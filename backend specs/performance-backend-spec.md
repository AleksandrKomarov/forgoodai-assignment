# Backend Spec: Performance & Reliability Dashboard

## Overview

The Performance & Reliability view surfaces success/failure trends, latency percentiles, error
categorization, slowest agents, and failure hotspots. It reuses the `success-rate` widget from
the Executive Summary spec and adds performance-specific endpoints.

For auth, query parameters, caching, and error handling conventions, see
[backend-spec-common.md](backend-spec-common.md). For functional requirements, see
[requirements-spec.md](requirements-spec.md). For API contracts and response schemas, see
[api-reference.md](api-reference.md).

---

## Endpoints

### 1. Latency KPI

```
GET /api/v1/widgets/latency-kpi?start=2025-02-01&end=2025-03-01
```

Returns p50, p95, p99 latency for the selected period with prior-period deltas.

#### KQL — `AgentRuns`

```kql
let period_start = datetime({start});
let period_end = datetime({end});
let period_len = period_end - period_start;
let prior_start = period_start - period_len - 1d;
let prior_end = period_start - 1d;
AgentRuns
| where tenant_id == "{tenant_id}"
| where started_at between (prior_start .. period_end)
| extend is_current = started_at between (period_start .. period_end)
| summarize p50 = percentile(duration_ms, 50),
            p95 = percentile(duration_ms, 95),
            p99 = percentile(duration_ms, 99)
  by is_current
```

Application code computes deltas: `delta_ms = current - prior` for each percentile.

#### Cache

- Key: `latency-kpi:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 2. Success / Failure Rates Over Time

```
GET /api/v1/widgets/success-failure-timeseries?start=2025-02-01&end=2025-03-01
```

Returns daily success and failure counts for the stacked area/bar chart.

#### KQL — `DailyRollup`

```kql
DailyRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({start}) .. datetime({end}))
| project day, completed = completed_count, failed = failed_count
| order by day asc
```

#### Cache

- Key: `success-failure-ts:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 3. Error Taxonomy

```
GET /api/v1/widgets/error-taxonomy?start=2025-02-01&end=2025-03-01
```

Returns failure counts grouped by `error_code` for the treemap.

#### KQL — `DailyErrorRollup`

```kql
DailyErrorRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize count = sum(count) by error_code
| order by count desc
```

Application code computes `pct` for each error code relative to total failures.

#### Cache

- Key: `error-taxonomy:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 4. Latency Distribution Over Time

```
GET /api/v1/widgets/latency-distribution?start=2025-02-01&end=2025-03-01
```

Returns daily p50/p95/p99 latency for the time-series chart.

#### KQL — `DailyAgentRollup`

Daily percentiles are pre-computed in the rollup. This query aggregates across agent types
to get the overall daily percentiles (weighted by run count):

```kql
DailyAgentRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize p50 = avg(p50_duration_ms),
            p95 = max(p95_duration_ms),
            p99 = max(p99_duration_ms)
  by day
| order by day asc
```

Note: cross-agent aggregation uses `avg` for p50 (weighted approximation) and `max` for
p95/p99 (conservative upper bound). For exact period-wide percentiles, use the `latency-kpi`
endpoint which queries raw `AgentRuns`.

#### Cache

- Key: `latency-dist:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 5. Slowest Agents

```
GET /api/v1/widgets/slowest-agents?start=2025-02-01&end=2025-03-01&limit=10
```

Returns the top N agents by average duration.

#### Query Parameters

| Param   | Type    | Required | Default | Description                  |
|---------|---------|----------|---------|------------------------------|
| `start` | date    | yes      | —       | Period start, inclusive       |
| `end`   | date    | yes      | —       | Period end, inclusive         |
| `limit` | integer | no       | 10      | Number of agents to return (max 50) |

#### KQL — `DailyAgentRollup`

```kql
DailyAgentRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize avg_duration_ms = round(sum(sum_duration_ms) / sum(run_count), 0),
            p95_duration_ms = max(p95_duration_ms),
            run_count = sum(run_count)
  by agent_type
| top {limit} by avg_duration_ms desc
```

Average duration is computed from pre-aggregated sums (`sum_duration_ms / run_count`).
p95 uses `max` across days as a conservative upper bound.

#### Cache

- Key: `slowest-agents:{tenant_id}:{start}:{end}:{limit}`
- TTL: 60 seconds

---

### 6. Failure Hotspots

```
GET /api/v1/widgets/failure-hotspots?start=2025-02-01&end=2025-03-01
```

Returns failure rate matrix: agent type x team.

#### KQL — `DailyAgentRollup`

```kql
DailyAgentRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize total = sum(run_count),
            failed = sum(failed_count)
  by agent_type, team_id
| extend failure_rate_pct = round(100.0 * failed / total, 1)
| project agent_type, team_id, failure_rate_pct, failed, total
| order by failure_rate_pct desc
```

The `teams` array in the response provides column headers. The `cells` array is a flat list
that the SPA pivots into a matrix. Cells with zero runs for a combination are omitted.

#### Cache

- Key: `failure-hotspots:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

## Additional Errors

Beyond the [common error handling](backend-spec-common.md):

| Scenario | HTTP Status | Response Body |
|----------|-------------|---------------|
| `limit` out of range (< 1 or > 50) | 400 | `{ "error": "invalid_param", "message": "limit must be between 1 and 50" }` |
| No failures in period (error taxonomy) | 200 | `{ "total_failures": 0, "errors": [] }` |

---

## Query Performance

Most endpoints use pre-aggregated rollup tables and have no retention limit:

| Endpoint | Table | Retention |
|----------|-------|-----------|
| `success-rate` | `DailyRollup` | 2 years |
| `success-failure-timeseries` | `DailyRollup` | 2 years |
| `error-taxonomy` | `DailyErrorRollup` | 2 years |
| `latency-distribution` | `DailyAgentRollup` | 2 years |
| `slowest-agents` | `DailyAgentRollup` | 2 years |
| `failure-hotspots` | `DailyAgentRollup` | 2 years |
| `latency-kpi` | `AgentRuns` (raw) | **90 days** |

Only `latency-kpi` queries raw `AgentRuns` because period-wide percentiles (e.g., 30-day p50)
can't be derived from daily pre-computed percentiles. For ranges exceeding 90 days, `latency-kpi`
returns a 400 error.

Note: `latency-distribution` and `slowest-agents` use pre-computed daily percentiles from
`DailyAgentRollup`. Cross-day aggregation uses `max` for p95/p99 (conservative upper bound)
rather than exact percentiles, which is acceptable for trend visualization and ranking.

