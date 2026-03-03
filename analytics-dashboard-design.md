# System Design: Org-Level Analytics Dashboard for Cloud Agent Platform (Azure-Native)

## Context

Engineers use a cloud platform to run AI/automation agents. As adoption grows, organizations need
visibility into how their teams use agents — to control costs, improve reliability,
and make resourcing decisions. This dashboard is the primary interface for that visibility.

All infrastructure uses Azure-native services. Azure Stream Analytics is intentionally excluded —
enrichment and correlation are handled by Azure Functions, and aggregations are pushed into ADX via
update policies, keeping the pipeline simpler and more maintainable.

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
| Quota utilization (% of tenant limit consumed) | Prevents surprise overages |
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
- Per-user activity within a team (RBAC-gated, Entra ID roles)

---

## Azure-Native System Architecture

```
+---------------------------+   +------------------------------+
|  Agent Execution Platform  |   |  Platform Admin API          |
|  Publishes:               |   |  (external; source of truth  |
|  run.started              |   |   for tenant/user/team/       |
|  run.completed            |   |   pricing data)              |
|  run.failed               |   |                              |
|  Partition key: run_id    |   |  Emits events / webhooks     |
+-------------+-------------+   +---------------+--------------+
              | JSON events over AMQP            | events / webhooks
              v                                  v
+------------------------------------------+----+
|   Azure Event Hubs                            |
|   Single namespace, partition key=run_id      |
|   Retention: 7 days                           |
|   Throughput units: auto-inflate              |
+--------+------------------+-------------------+
         |                  |
         | Event Hubs        | Azure Functions
         | Capture           | Event Hub trigger
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
|  Synapse        |  |   - Calculate cost_usd from tokens +     |
|  Serverless SQL |  |     compute + pricing config (Cosmos DB) |
|  for ad-hoc     |  |   - Write enriched AgentRun to ADX       |
|  queries        |  |   - Correlation state expires via TTL    |
|                 |  |                                          |
|                 |  |   On admin events from Platform API:     |
|                 |  |   - Sync user-team-map in Cosmos DB      |
|                 |  |   - Sync pricing-config in Cosmos DB     |
+-----------------+  +--------------------+---------------------+
                                          |
                                          v
+-------------------------------------------------------------+
|   Azure Data Explorer (ADX / Kusto)                         |
|                                                             |
|   Tables:                                                   |
|   - AgentRuns        fully enriched run records, 90d hot   |
|   - HourlyRollup     update policy on AgentRuns ingestion  |
|   - DailyRollup      update policy, retained 2 years       |
|                                                             |
|   ADX update policies auto-populate rollup tables on       |
|   every AgentRuns ingestion — no scheduled jobs needed      |
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
|     { user_id: uuid, tenant_id: uuid, team_id: uuid }      |
|     Synced by Enrichment Function from Platform Admin API   |
|                                                             |
|   Container: run-correlation                                |
|     { run_id: uuid, tenant_id: uuid, team_id: uuid,        |
|       user_id: uuid, agent_type, agent_version,             |
|       trigger, started_at }                                 |
|     TTL: 24h (auto-expires orphaned started events)         |
|                                                             |
|   Container: pricing-config                                 |
|     { tenant_id: uuid, effective_from,                     |
|       cpu_per_second_usd, token_input_per_1k_usd,          |
|       token_output_per_1k_usd }                             |
|     Synced by Enrichment Function from Platform Admin API   |
|     Versioned — historical runs calculated at correct price |
+-------------------------------------------------------------+


+-------------------------------------------------------------+
|   Azure Entra ID                                            |
|                                                             |
|   Multi-tenant app registration (signInAudience:           |
|   AzureADMultipleOrgs) — accepts tokens from any Azure AD  |
|   organization. One app registration serves all tenants.   |
|                                                             |
|   App roles: TenantAdmin, TeamLead, Contributor, Finance   |
|   Assigned per customer tenant via Enterprise Applications  |
|                                                             |
|   JWT claims used directly as platform identifiers:        |
|   - oid (Object ID, UUID) -> user_id in events             |
|   - tid (Tenant ID, UUID) -> tenant_id in events           |
|                                                             |
|   JWT validated by API Management (validate-jwt policy)    |
|   -> claims forwarded to App Service for KQL scoping       |
+-------------------------------------------------------------+
```

---

## Event Schemas

Events are published by the Agent Execution Platform. `run_id` is the correlation key.
All identifiers are opaque UUIDs — no email addresses or human-readable slugs.

All three event types use the same Event Hubs namespace, partitioned by `run_id` to
guarantee ordering: `run.started` always arrives before `run.completed`/`run.failed`
within the same partition. (Partition key is hashed to a fixed partition slot — many
`run_id` values share each physical partition, ensuring even load distribution.)

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
  "tokens": { "input": 14200, "output": 3100, "model": "claude-sonnet-4-6" },
  // Calculated by Function using pricing-config
  "cost_usd": 0.043,
  "pricing_config_version": "2025-01"  // for historical audit accuracy
}
```

---

## Key Design Decisions

1. **Azure Functions replaces Stream Analytics:** Functions handle all stateless per-event
   enrichment. Windowed aggregations are pushed into ADX via update policies, which is where
   the data lives anyway. This removes a managed streaming service from the stack.

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
   dashboard UI are resolved at query time by the API layer from a separate identity service,
   not stored in the analytics data.

5. **Event Hubs Capture for raw archive:** The built-in Capture feature writes every raw event
   to ADLS Gen2 as Parquet automatically — no code, no separate pipeline. Queryable on-demand via
   Synapse Serverless SQL for ad-hoc queries without a permanent always-on cluster.

6. **ADX update policies for rollups:** Pre-aggregated HourlyRollup and DailyRollup tables are
   populated automatically on every AgentRuns ingestion via KQL update policies. Dashboard
   queries hit rollup tables for trend/range queries and the raw AgentRuns table only for
   short windows (< 24h), keeping all queries fast.

7. **Pricing config versioned in Cosmos DB:** `pricing-config` records carry an `effective_from`
   date. The Function looks up the active version at event time and stamps `pricing_config_version`
   on the ADX record, so historical cost calculations remain accurate after price changes.

---

## Verification / Testing Approach

- Publish synthetic events (run.started -> run.completed, run.started -> run.failed) to Event Hubs
  and verify AgentRuns records in ADX contain correct merged fields and enriched team_id
- Verify Cosmos DB run-correlation TTL: orphaned run.started records (no terminal event) expire
  and do not remain in the store permanently
- Verify user-team-map lookup: change a user's team and confirm subsequent runs report the new team
- Verify RBAC: team lead JWT cannot query another team's data; finance role cannot see user-level detail
- Query ADLS Gen2 via Synapse Serverless and confirm raw Parquet event counts match ADX AgentRuns counts
- Load test the API at 100 concurrent users across 10 tenants and confirm Redis cache hit rate > 80%
  and p99 response time < 500ms
- Verify all dashboard views render correctly for each Entra ID role (TenantAdmin, TeamLead, Contributor, Finance)
