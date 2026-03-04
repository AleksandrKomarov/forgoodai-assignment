# Backend Spec: Performance & Reliability Dashboard

## Overview

The Performance & Reliability view surfaces success/failure trends, latency percentiles, error
categorization, slowest agents, and failure hotspots. It reuses the `success-rate` widget from
the Executive Summary spec and adds performance-specific endpoints.

For auth, query parameters, caching, and error handling conventions, see
[backend-spec-common.md](backend-spec-common.md).

---

## Reused Endpoints

| Endpoint | Performance view usage |
|----------|------------------------|
| `GET /api/v1/widgets/success-rate?start=...&end=...` | Success Rate KPI card (rate + delta) |

---

## New Endpoints

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

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "p50_ms": 1200,
  "p95_ms": 4800,
  "p99_ms": 12100,
  "prior_p50_ms": 1280,
  "prior_p95_ms": 4480,
  "prior_p99_ms": 10700,
  "delta_p50_ms": -80,
  "delta_p95_ms": 320,
  "delta_p99_ms": 1400
}
```

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

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "daily": [
    { "date": "2025-02-01", "completed": 610, "failed": 32 },
    { "date": "2025-02-02", "completed": 558, "failed": 22 },
    "..."
  ]
}
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

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "total_failures": 1130,
  "errors": [
    { "error_code": "CONTEXT_LIMIT_EXCEEDED", "count": 429, "pct": 38.0 },
    { "error_code": "TIMEOUT", "count": 271, "pct": 24.0 },
    { "error_code": "OOM", "count": 203, "pct": 18.0 },
    { "error_code": "LOGIC_ERROR", "count": 136, "pct": 12.0 },
    { "error_code": "INFRA_FAULT", "count": 91, "pct": 8.0 }
  ]
}
```

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

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "daily": [
    { "date": "2025-02-01", "p50_ms": 1150, "p95_ms": 4600, "p99_ms": 11200 },
    { "date": "2025-02-02", "p50_ms": 1220, "p95_ms": 4900, "p99_ms": 12500 },
    "..."
  ]
}
```

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

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "agents": [
    { "agent_type": "deep-analyzer-v2", "avg_duration_ms": 18400, "p95_duration_ms": 32100, "run_count": 312 },
    { "agent_type": "code-reviewer-v3", "avg_duration_ms": 12100, "p95_duration_ms": 22400, "run_count": 1847 },
    { "agent_type": "security-scanner-v1", "avg_duration_ms": 9800, "p95_duration_ms": 18200, "run_count": 502 },
    { "agent_type": "doc-generator-v2", "avg_duration_ms": 8500, "p95_duration_ms": 15600, "run_count": 1203 },
    { "agent_type": "test-writer-v1", "avg_duration_ms": 7200, "p95_duration_ms": 13800, "run_count": 2105 }
  ]
}
```

#### Cache

- Key: `slowest-agents:{tenant_id}:{start}:{end}:{limit}`
- TTL: 60 seconds

---

### 6. Failure Hotspots

```
GET /api/v1/widgets/failure-hotspots?start=2025-02-01&end=2025-03-01
```

Returns failure rate matrix: agent type x team. Powers the heatmap table.

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

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "teams": [
    { "team_id": "uuid-1", "team_name": "ML Infra" },
    { "team_id": "uuid-2", "team_name": "Data Eng" },
    { "team_id": "uuid-3", "team_name": "Platform Team" }
  ],
  "cells": [
    { "agent_type": "code-reviewer-v3", "team_id": "uuid-1", "failure_rate_pct": 1.2, "failed": 14, "total": 1167 },
    { "agent_type": "code-reviewer-v3", "team_id": "uuid-2", "failure_rate_pct": 0.8, "failed": 5, "total": 625 },
    { "agent_type": "code-reviewer-v3", "team_id": "uuid-3", "failure_rate_pct": 1.1, "failed": 6, "total": 545 },
    { "agent_type": "deep-analyzer-v2", "team_id": "uuid-1", "failure_rate_pct": 8.4, "failed": 26, "total": 310 },
    { "agent_type": "deep-analyzer-v2", "team_id": "uuid-2", "failure_rate_pct": 2.1, "failed": 4, "total": 190 },
    "..."
  ]
}
```

The `teams` array provides the column headers. The `cells` array is a flat list that the SPA
pivots into a matrix. Cells with zero runs for a combination are omitted.

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
returns a 400 error:
`{ "error": "range_exceeds_retention", "message": "Period-wide latency percentiles are limited to the 90-day hot window" }`.

Note: `latency-distribution` and `slowest-agents` use pre-computed daily percentiles from
`DailyAgentRollup`. Cross-day aggregation uses `max` for p95/p99 (conservative upper bound)
rather than exact percentiles, which is acceptable for trend visualization and ranking.

---

## Widget Reusability

| Endpoint | Also used by |
|----------|--------------|
| `success-rate` | Executive Summary |
| `success-failure-timeseries` | Team Drill-Down (filtered to single team) |
| `error-taxonomy` | Team Drill-Down (filtered to single team) |
| `slowest-agents` | Team Drill-Down (filtered to single team) |
| `failure-hotspots` | — (Performance view only) |
| `latency-kpi` | — (Performance view only) |
| `latency-distribution` | — (Performance view only) |
