# System Design: Org-Level Analytics Dashboard for Cloud Agent Platform (Azure-Native)

## Context

Engineers use a cloud platform to run AI/automation agents. As adoption grows, organizations need
visibility into how their teams use agents — to control costs, improve reliability,
and make resourcing decisions. This dashboard is the primary interface for that visibility.

All infrastructure uses Azure-native services. Enrichment and correlation are handled by Azure
Functions, and aggregations are pushed into ADX via update policies.

Identifiers are opaque UUIDs throughout; no email addresses or human-readable org slugs enter the
analytics pipeline, keeping PII out of the data store.

Primary personas:
- **Engineering leads** — want performance, reliability, and debugging signal
- **Platform/infra teams** — want cost allocation and quota management
- **Finance/FinOps** — want cost trends, forecasting, budget compliance
- **CTO/VP Eng** — want executive summary, ROI, adoption health

---

## Key Metrics

### 1. Consumption & Cost
| Metric | Why it matters |
|---|---|
| Total runs (by team, agent type) | Adoption footprint |
| Compute-hours consumed | Resource cost driver |
| Token usage (input/output, if LLM-backed) | Often the primary cost driver |
| $ spend (actual vs. budget) | FinOps |
| Cost per team / per user | Chargeback / showback |
| Cost per successful task | Efficiency |
| Projected month-end spend (based on run rate) | Budget forecasting |

### 2. Performance & Reliability
| Metric | Why it matters |
|---|---|
| Success rate (by agent type, team, time) | Product health |
| Failure rate + error breakdown (timeout, OOM, logic errors, infra faults) | Debuggability |
| p50 / p95 / p99 latency | User-facing SLA tracking |
| Long-tail run detection (runs > Nx avg duration) | Runaway agent detection |

### 3. Usage Patterns & Adoption
| Metric | Why it matters |
|---|---|
| Active teams/users over time | Org-wide adoption curve |
| New agent types introduced | Innovation signal |
| Run frequency heatmaps (hour of day, day of week) | Capacity planning |
| Scheduled vs. on-demand runs | Workload type understanding |
| Peak concurrency | Burst capacity planning |

### 4. Operational & Governance
| Metric | Why it matters |
|---|---|
| Failed runs requiring human intervention | Toil measurement |
| Agent version distribution (old vs. current) | Deprecation / migration health |

---

## Dashboard Views

### Executive Summary (default landing)
- Monthly spend bar chart: last 12 months + next 3 months forecast
- Run volume trend (sparkline, 30 days)
- Overall success rate (gauge)
- Top 3 cost centers (by team)

### Cost Explorer
- Time-series: daily spend by dimension (team / agent type)
- Pie: spend breakdown by cost driver (compute, tokens, storage, egress)
- Table: per-team spend, runs, avg cost/run, delta vs. prior period
- Forecasted month-end spend
- Budget burn rate widget

### Performance & Reliability
- Success/failure rates over time (stacked area)
- Error taxonomy treemap (categorized by root cause)
- Latency distribution (p50/p95/p99 over time)
- Slowest agents table (top 10 by avg duration)
- Failure hotspots: agent type x team heatmap

### Usage & Capacity
- Concurrency over time (observed peak vs. tenant limit)
- Run volume by team (bar chart, filterable by date range)
- Heatmap: runs by hour-of-day x day-of-week
- Agent type adoption: new types per month

### Team Drill-Down
- Per-team: runs, cost, success rate, top agents, active users
- Per-user activity within a team

---

## Azure-Native System Architecture

```
+---------------------------+   +------------------------------+   +----------------------------+
|  Agent Execution Platform |   |  Platform Admin API          |   |  Billing System            |
|  Publishes:               |   |  (external; source of truth  |   |  (external; owns pricing,  |
|  run.started              |   |   for tenant/user/team data) |   |   cost calc, and budgets)  |
|  run.completed            |   |                              |   |                            |
|  run.failed               |   |  Emits events / webhooks     |   |  Publishes:                |
|  Partition key: run_id    |   |                              |   |  run.priced                |
+-------------+-------------+   +---------------+--------------+   |  Partition key: run_id     |
              | JSON events over AMQP           |                  |                            |
              |                                 |                  |  Budget API:               |
              |                                 |                  |  GET /tenants/{id}/budget  |
              |                                 |                  |  Quota API:                |
              |                                 |                  |  GET /tenants/{id}/quota   |
              |                                 |                  +-------------+--------------+
              v                                 v events /                       |
+------------------------------------------+----+ webhooks                       |
|   Azure Event Hubs                            |<-------------------------------+
|   Single namespace, partition key=run_id      |  run.priced events over AMQP
|   Retention: 7 days                           |
|   Throughput units: auto-inflate              |
+--------+------------------+-------------------+
         |                  |
         | Event Hubs       | Azure Functions
         | Capture          | Event Hub trigger
         v                  v
+-----------------+  +------------------------------------------+
|  ADLS Gen2      |  |   Enrichment Function App                |
|  (raw archive)  |  |                                          |
|                 |  |   On run.started:                        |
|  Parquet, auto- |  |   - Lookup team_id from user-team map    |
|  partitioned    |  |     (Cosmos DB, keyed by user_id UUID)   |
|  by time via    |  |   - Store correlation state in Cosmos DB |
|  Event Hubs     |  |     keyed by run_id (TTL: 24h)           |
|  Capture        |  |                                          |
|  Retention:     |  |   On run.completed / run.failed:         |
|  2 years        |  |   - Fetch correlation state by run_id    |
|  Queryable via  |  |   - Merge started + outcome fields       |
|  Synapse        |  |   - Write enriched AgentRun to ADX       |
|  Serverless SQL |  |   - Correlation state expires via TTL    |
|  for ad-hoc     |  |                                          |
|  queries        |  |   On run.priced (from Billing System):   |
|                 |  |   - Fetch tenant_id + team_id from       |
|                 |  |     run-correlation by run_id            |
|                 |  |   - Write RunCost record to ADX          |
|                 |  |                                          |
|                 |  |   On admin events from Platform API:     |
|                 |  |   - Sync user-team-map in Cosmos DB      |
+-----------------+  +--------------------+---------------------+
                                          |
                                          v
+-------------------------------------------------------------+
|   Azure Data Explorer (ADX / Kusto)                         |
|                                                             |
|   Tables:                                                   |
|   - AgentRuns           enriched run records, 90d hot       |
|   - RunCosts            cost per run from Billing System    |
|   - HourlyRollup        update policy on AgentRuns          |
|     per (tenant, team, hour): run_count,                    |
|     peak_concurrent (max overlapping runs). 90d hot         |
|   - DailyRollup         update policy, retained 2 years     |
|   - HourlyCostRollup    update policy on RunCosts           |
|     (joins AgentRuns to include agent_type)                 |
|   - DailyCostRollup     update policy, retained 2 years     |
|     (joins AgentRuns to include agent_type)                 |
|   - DailyAgentRollup    update policy on AgentRuns          |
|     per (tenant, team, agent_type, day): run_count,         |
|     failed_count, sum_duration_ms, p50/p95/p99 duration     |
|     Retained 2 years                                        |
|   - DailyErrorRollup    update policy on AgentRuns          |
|     per (tenant, day, error_code): count                    |
|     Retained 2 years                                        |
|   - DailyUserRollup     update policy on AgentRuns          |
|     per (tenant, team, user_id, day): run_count,            |
|     completed_count, failed_count, last_active              |
|     Retained 2 years                                        |
|                                                             |
|   Stored function: AgentRunsWithCost()                      |
|   - Joins AgentRuns + RunCosts on run_id for cost views     |
|                                                             |
|   ADX update policies auto-populate rollup tables on        |
|   every AgentRuns / RunCosts ingestion — no scheduled jobs  |
|   Cost rollup policies join RunCosts + AgentRuns on run_id  |
|   to include agent_type for per-agent cost analysis         |
+----------------------+--------------------------------------+
                       |  KQL
                       v
+-------------------------------------------------------------+
|   Analytics API Layer                                       |
|                                                             |
|   Azure API Management (gateway + rate limiting)            |
|   - Entra ID JWT validation (validate-jwt policy)           |
|   - Forwards verified claims to App Service                 |
|        |                                                    |
|   Azure App Service (REST API)                              |
|   - Query routing (granularity -> rollup table selection)   |
|   - RBAC claim injection into KQL predicates                |
|   - Result caching: Azure Cache for Redis                   |
|     (60s real-time widgets, 5min trend queries)             |
|   - Display name resolution via Microsoft Graph API         |
|     (maps user_id/team_id UUIDs -> names at query time)     |
|   - Budget data from Billing System API                     |
+----------------------+--------------------------------------+
                       |
                       v
+------------------------------------------+
|  Custom SPA (React)                      |
|  Azure Static Web Apps                   |
|                                          |
|  Single interface for all personas:      |
|  engineering leads, platform teams,      |
|  finance, and executives                 |
+------------------------------------------+

+-------------------------------------------------------------+
|   Azure Cosmos DB (NoSQL)                                   |
|                                                             |
|   Container: user-team-map                                  |
|     { user_id: uuid, tenant_id: uuid, team_id: uuid }       |
|     Synced by Enrichment Function from Platform Admin API   |
|                                                             |
|   Container: run-correlation                                |
|     { run_id: uuid, tenant_id: uuid, team_id: uuid,         |
|       user_id: uuid, agent_type, agent_version,             |
|       trigger, started_at }                                 |
|     TTL: 24h (auto-expires orphaned started events)         |
|                                                             |
|   Container: tenant-budgets (cache)                         |
|     { tenant_id: uuid, period: "2025-03",                   |
|       budget_usd: 45000, updated_at }                       |
|     Partition key: tenant_id                                |
|     Synced from Billing System API                          |
|                                                             |
|   Container: tenant-quotas (cache)                          |
|     { tenant_id: uuid, concurrency_limit: 50,               |
|       updated_at }                                          |
|     Partition key: tenant_id                                |
|     Synced from Billing System API                          |
+-------------------------------------------------------------+


+-------------------------------------------------------------+
|   Azure Entra ID                                            |
|                                                             |
|   Multi-tenant app registration (signInAudience:            |
|   AzureADMultipleOrgs) — accepts tokens from any Azure AD   |
|   organization. One app registration serves all tenants.    |
|                                                             |
|   App roles: TenantAdmin, TeamLead, Contributor, Finance    |
|   Assigned per customer tenant via Enterprise Applications  |
|                                                             |
|   JWT claims used directly as platform identifiers:         |
|   - oid (Object ID, UUID) -> user_id in events              |
|   - tid (Tenant ID, UUID) -> tenant_id in events            |
|                                                             |
|   JWT validated by API Management (validate-jwt policy)     |
|   -> claims forwarded to App Service for KQL scoping        |
+-------------------------------------------------------------+
```

---

## Event Schemas

Run lifecycle events (`run.started`, `run.completed`, `run.failed`) are published by the
Agent Execution Platform. Cost events (`run.priced`) are published by the Billing System.
`run_id` is the correlation key across all event types.
All identifiers are opaque UUIDs — no email addresses or human-readable slugs.

All event types use the same Event Hubs namespace, partitioned by `run_id` to guarantee
ordering: `run.started` always arrives before `run.completed`/`run.failed` within the
same partition. `run.priced` may arrive after the terminal event (billing is async).
(Partition key is hashed to a fixed partition slot — many `run_id` values share each
physical partition, ensuring even load distribution.)

```jsonc
// run.started — published when a run is accepted and begins executing
{
  "event_type": "run.started",
  "event_id": "uuid",
  "run_id": "uuid",
  "tenant_id": "uuid",             // opaque UUID, no human-readable slug
  "user_id": "uuid",               // internal platform UUID — no email, no PII
  "agent_type": "code-reviewer-v3",
  "agent_version": "3.1.2",
  "trigger": "scheduled" | "on-demand" | "webhook",
  "started_at": "2025-03-01T10:00:00Z"
  // team_id intentionally absent — enriched by Function App
}

// run.completed — published when a run finishes successfully
{
  "event_type": "run.completed",
  "event_id": "uuid",
  "run_id": "uuid",                // correlates to run.started
  "ended_at": "2025-03-01T10:00:04Z",
  "compute": {
    "cpu_seconds": 12.4,
    "memory_gb_seconds": 3.1,
    "gpu_seconds": 0
  },
  "tokens": {
    "input": 14200,
    "output": 3100,
    "model": "claude-sonnet-4-6"
  }
  // no tenant_id, no user_id, no agent_type — all in run.started, correlated by run_id
}

// run.failed — published when a run terminates with an error
{
  "event_type": "run.failed",
  "event_id": "uuid",
  "run_id": "uuid",                // correlates to run.started
  "ended_at": "2025-03-01T10:00:02Z",
  "error_code": "CONTEXT_LIMIT_EXCEEDED",
  "error_message": "Context window exceeded at step 4",
  "compute": {
    "cpu_seconds": 3.1,
    "memory_gb_seconds": 0.8,
    "gpu_seconds": 0
  },
  "tokens": {                      // partial — whatever was consumed before failure
    "input": 5000,
    "output": 200,
    "model": "claude-sonnet-4-6"
  }
}

// run.priced — published by Billing System after pricing a completed or failed run
{
  "event_type": "run.priced",
  "event_id": "uuid",
  "run_id": "uuid",                // correlates to run.started
  "cost_usd": 0.043,
  "cost_breakdown": {
    "compute_usd": 0.012,
    "token_usd": 0.031
  },
  "priced_at": "2025-03-01T10:01:00Z"
}
```

### Enriched AgentRun record written to ADX by Function App

```jsonc
{
  // From run-correlation Cosmos container (populated on run.started)
  "run_id": "uuid",
  "tenant_id": "uuid",
  "team_id": "uuid",               // looked up from user-team-map
  "user_id": "uuid",               // internal UUID only — no PII in analytics store
  "agent_type": "code-reviewer-v3",
  "agent_version": "3.1.2",
  "trigger": "scheduled",
  "started_at": "2025-03-01T10:00:00Z",
  // From run.completed or run.failed
  "outcome": "completed" | "failed",
  "ended_at": "2025-03-01T10:00:04Z",
  "duration_ms": 4200,
  "error_code": null,              // set on failure
  "error_message": null,
  "compute": { "cpu_seconds": 12.4, "memory_gb_seconds": 3.1, "gpu_seconds": 0 },
  "tokens": { "input": 14200, "output": 3100, "model": "claude-sonnet-4-6" }
  // No cost — cost data lives in RunCosts table, joined via run_id
}
```

### RunCost record written to ADX by Function App (from run.priced)

```jsonc
{
  "run_id": "uuid",                // correlates to AgentRuns record
  "tenant_id": "uuid",            // from run-correlation Cosmos container
  "team_id": "uuid",              // from run-correlation Cosmos container
  "cost_usd": 0.043,
  "cost_breakdown": {
    "compute_usd": 0.012,
    "token_usd": 0.031
  },
  "priced_at": "2025-03-01T10:01:00Z"
}
```

---

## Key Design Decisions

1. **Azure Functions for per-event enrichment:** Functions handle all stateless per-event
   enrichment. Windowed aggregations are pushed into ADX via update policies, keeping the
   architecture simple with no separate streaming service.

2. **Cosmos DB as correlation store (run-correlation container):** Since `run.started` carries
   identity context and `run.completed`/`run.failed` carry outcome/resource data, the Function
   stores started-event state in Cosmos DB (TTL: 24h) and merges on terminal events. Partitioning
   Event Hubs by `run_id` guarantees ordering within a run's lifecycle, so the started record is
   always present when the terminal event is processed.

3. **team_id enriched by Function, not platform:** The agent execution platform knows `tenant_id`
   and `user_id` but has no dependency on the team organizational model. Team membership is
   maintained in the `user-team-map` Cosmos container (synced from Entra ID groups) and
   injected at enrichment time, keeping the two domains decoupled.

4. **No PII in the analytics pipeline:** All identifiers are opaque UUIDs. No email addresses,
   no org slugs, no display names enter Event Hubs, ADLS Gen2, or ADX. Display names for the
   dashboard UI are resolved at query time by the API layer via **Microsoft Graph API** — the
   API maps `user_id` (Entra ID `oid`) and team group IDs to display names on every response.
   Names are cached in Redis (TTL: 15 min) to avoid per-request Graph calls. No PII is stored
   in the analytics data.

5. **Event Hubs Capture for raw archive:** The built-in Capture feature writes every raw event
   to ADLS Gen2 as Parquet automatically — no code, no separate pipeline. Queryable on-demand via
   Synapse Serverless SQL for ad-hoc queries without a permanent always-on cluster.

6. **ADX update policies for rollups:** Pre-aggregated HourlyRollup and DailyRollup tables are
   populated automatically on every AgentRuns ingestion via KQL update policies; separate
   HourlyCostRollup and DailyCostRollup tables are populated on RunCosts ingestion. Cost rollup
   update policies join `RunCosts` with `AgentRuns` on `run_id` to include `agent_type`, enabling
   per-agent cost analysis without querying raw tables. `DailyAgentRollup` pre-aggregates run
   counts, failure counts, duration sums, and daily latency percentiles per (tenant, team,
   agent_type, day) for performance views. `DailyErrorRollup` pre-aggregates error counts per
   (tenant, day, error_code) for error taxonomy. Dashboard queries hit rollup tables for
   trend/range queries and the raw tables only for period-wide percentile calculations
   (which require the full distribution).

7. **Budget data from Billing System:** Monthly budgets per tenant are owned by the Billing
   System (where admins set them). The Analytics API layer fetches the current period's budget
   from the Billing System API and caches it in a `tenant-budgets` Cosmos container (synced
   periodically). Actual spend from cost rollup tables is compared against the budget to power
   the budget burn rate widget and over/under-budget indicators.

8. **Per-user rollup for adoption and activity:** `DailyUserRollup` stores per-user rows
   per (tenant, team, user_id, day) with run_count, completed_count, failed_count, and
   last_active. Cross-day distinct user counts use `dcount(user_id)` over the rollup. This
   avoids the 90-day retention limit of raw AgentRuns and also powers per-user activity
   tables in the Team Drill-Down view.

9. **Concurrency tracking in HourlyRollup:** `HourlyRollup` stores `peak_concurrent` per
   hour — the maximum number of overlapping runs (where `started_at < hour_end` and
   `ended_at > hour_start`). Computed by the ADX update policy on ingestion. Tenant
   concurrency limits are fetched from the Billing System API and cached in a
   `tenant-quotas` Cosmos container (same sync pattern as `tenant-budgets`).

10. **Billing system decoupled from analytics:** Pricing is owned by an external Billing System
   that publishes `run.priced` events with the final cost per run. The analytics pipeline stores
   cost in a separate `RunCosts` ADX table, keeping run analytics (latency, success rates, etc.)
   immediately available without waiting for pricing. Dashboard cost views join `AgentRuns` +
   `RunCosts` via a stored function. This separation means pricing logic, rate changes, and
   billing corrections are handled entirely outside the analytics pipeline.

---

## Verification / Testing Approach

- Publish synthetic events (run.started -> run.completed, run.started -> run.failed) to Event Hubs
  and verify AgentRuns records in ADX contain correct merged fields, enriched team_id, and no cost fields
- Publish synthetic run.priced events and verify RunCosts records in ADX contain correct cost_usd,
  cost_breakdown, and tenant_id/team_id (looked up from run-correlation by run_id)
- Verify late-arriving run.priced events: publish a run.priced event minutes after the terminal event
  and confirm the RunCost record is still written correctly (run-correlation state within 24h TTL)
- Verify dashboard cost views correctly join AgentRuns + RunCosts; runs without a matching RunCost
  record should appear with null cost, not be excluded
- Verify Cosmos DB run-correlation TTL: orphaned run.started records (no terminal event) expire
  and do not remain in the store permanently
- Verify user-team-map lookup: change a user's team and confirm subsequent runs report the new team
- Verify RBAC: team lead JWT cannot query another team's data; finance role cannot see user-level detail
- Query ADLS Gen2 via Synapse Serverless and confirm raw Parquet event counts match ADX AgentRuns counts
- Load test the API at 100 concurrent users across 10 tenants and confirm Redis cache hit rate > 80%
  and p99 response time < 500ms
- Verify all dashboard views render correctly for each Entra ID role (TenantAdmin, TeamLead, Contributor, Finance)
