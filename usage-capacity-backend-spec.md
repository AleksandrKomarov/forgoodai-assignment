# Backend Spec: Usage & Capacity Dashboard

## Overview

The Usage & Capacity view surfaces adoption metrics (active teams/users), concurrency monitoring
(peak vs. tenant limit), run distribution by team and time-of-day, and agent type adoption trends.
It reuses the `run-volume` widget from the Executive Summary spec and adds usage-specific endpoints.

For auth, query parameters, caching, and error handling conventions, see
[backend-spec-common.md](backend-spec-common.md). For functional requirements, see
[requirements-spec.md](requirements-spec.md). For API contracts and response schemas, see
[api-reference.md](api-reference.md).

---

## Endpoints

### 1. Active Users & Teams

```
GET /api/v1/widgets/active-users?start=2025-02-01&end=2025-03-01
```

Returns active user count (with prior-period delta) and active/total team counts.
Powers the Active Teams and Active Users KPI cards.

#### KQL — `DailyUserRollup` (users)

```kql
let period_start = datetime({start});
let period_end = datetime({end});
let period_len = period_end - period_start;
let prior_start = period_start - period_len - 1d;
let prior_end = period_start - 1d;
DailyUserRollup
| where tenant_id == "{tenant_id}"
| where day between (prior_start .. period_end)
| extend is_current = day between (period_start .. period_end)
| summarize active_users = dcount(user_id) by is_current
```

Application code extracts current and prior rows to compute `delta`.

#### KQL — `DailyRollup` (teams)

```kql
DailyRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize active_teams = dcount(team_id)
```

`total_teams` is fetched from Microsoft Graph API (count of groups in the tenant).

#### Cache

- Key: `active-users:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 2. Concurrency Timeseries

```
GET /api/v1/widgets/concurrency-timeseries?start=2025-02-01&end=2025-03-01
```

Returns daily peak concurrency values and the tenant concurrency limit.
Powers both the Concurrency Over Time chart and the Peak Concurrency KPI card.

#### KQL — `HourlyRollup`

```kql
HourlyRollup
| where tenant_id == "{tenant_id}"
| where hour between (datetime({start}) .. datetime({end}))
| summarize peak_concurrent = max(peak_concurrent) by day = startofday(hour)
| order by day asc
```

#### Concurrency limit lookup

Tenant concurrency limit is fetched from the `tenant-quotas` Cosmos DB container
(synced from Billing System API: `GET /tenants/{id}/quota`).

- Cosmos query: `SELECT * FROM c WHERE c.tenant_id = "{tenant_id}"`
- If no quota is set, `concurrency_limit` returns `null`

`peak_in_period` is the max across all daily values (computed in application code).

#### Cache

- Key: `concurrency-ts:{tenant_id}:{start}:{end}`
- TTL: 60 seconds
- Quota cached separately: `quota:{tenant_id}`, TTL 5 minutes

---

### 3. Run Volume by Team

```
GET /api/v1/widgets/run-volume-by-team?start=2025-02-01&end=2025-03-01
```

Returns run counts per team for the horizontal bar chart.

#### KQL — `DailyRollup`

```kql
DailyRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize run_count = sum(completed_count) + sum(failed_count) by team_id
| order by run_count desc
```

#### Cache

- Key: `run-volume-by-team:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 4. Run Heatmap

```
GET /api/v1/widgets/run-heatmap?start=2025-02-01&end=2025-03-01
```

Returns run counts aggregated by hour-of-day and day-of-week for the heatmap visualization.

#### KQL — `HourlyRollup`

```kql
HourlyRollup
| where tenant_id == "{tenant_id}"
| where hour between (datetime({start}) .. datetime({end}))
| summarize run_count = sum(run_count)
    by hour_of_day = hourofday(hour),
       day_of_week = dayofweek(hour) / 1d
| order by day_of_week asc, hour_of_day asc
```

`dayofweek()` returns a timespan; dividing by `1d` gives 0 (Sunday) through 6 (Saturday).

The result is a flat list (7 days × 24 hours = 168 entries). Cells with zero runs are
included for completeness.

#### Cache

- Key: `run-heatmap:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 5. Agent Type Adoption

```
GET /api/v1/widgets/agent-adoption
```

No `start`/`end` params — always shows the last 6 months of agent type adoption.
Powers both the New Agent Types KPI card and the monthly bar chart.

#### KQL — `DailyAgentRollup`

```kql
let cutoff = ago(180d);
DailyAgentRollup
| where tenant_id == "{tenant_id}"
| summarize first_seen = min(day) by agent_type
| where first_seen >= cutoff
| summarize new_types = make_list(agent_type),
            count = count()
  by month = format_datetime(first_seen, "yyyy-MM")
| order by month asc
```

To identify types new in the current month, the query filters `first_seen >= startofmonth(now())`.
Application code extracts the current month entry for the KPI card.

#### Cache

- Key: `agent-adoption:{tenant_id}`
- TTL: 5 minutes (trend data)

---

## Additional Errors

Beyond the [common error handling](backend-spec-common.md):

| Scenario | HTTP Status | Response Body |
|----------|-------------|---------------|
| Concurrency quota unavailable | 200 | `concurrency_limit` returns `null` |
| Range exceeds HourlyRollup retention (> 90 days) for `concurrency-timeseries` or `run-heatmap` | 400 | `{ "error": "range_exceeds_retention", "message": "Concurrency and heatmap data is limited to the 90-day hot window" }` |

---

## Query Performance

| Endpoint | Table | Retention |
|----------|-------|-----------|
| `active-users` | `DailyUserRollup` + `DailyRollup` | 2 years |
| `concurrency-timeseries` | `HourlyRollup` | **90 days** |
| `run-volume-by-team` | `DailyRollup` | 2 years |
| `run-heatmap` | `HourlyRollup` | **90 days** |
| `agent-adoption` | `DailyAgentRollup` | 2 years |

Only `concurrency-timeseries` and `run-heatmap` use `HourlyRollup` (90-day retention).
All other endpoints use daily rollup tables retained for 2 years.

