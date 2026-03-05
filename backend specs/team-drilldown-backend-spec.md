# Backend Spec: Team Drill-Down Dashboard

## Overview

The Team Drill-Down view lets users select a team and view its KPIs (runs, spend, success rate,
active users), top agents breakdown, and per-user activity. All team-scoped endpoints require a
`team_id` query parameter.

For auth, query parameters, caching, and error handling conventions, see
[backend-spec-common.md](backend-spec-common.md). For functional requirements, see
[requirements-spec.md](requirements-spec.md). For API contracts and response schemas, see
[api-reference.md](api-reference.md).

---

## Endpoints

### 1. Team List

```
GET /api/v1/widgets/team-list
```

Returns all teams in the tenant for the team selector (pill navigation).
No `start`/`end` params — returns all teams regardless of date range.

#### Source

Team list is fetched from **Microsoft Graph API** (list groups for the tenant).

#### Cache

- Key: `team-list:{tenant_id}`
- TTL: 15 minutes (same as display name cache)

---

### 2. Team Summary

```
GET /api/v1/widgets/team-summary?team_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890&start=2025-02-01&end=2025-03-01
```

Returns all 4 KPI values for a single team with prior-period deltas.

#### Query Parameters

| Param     | Type   | Required | Description              |
|-----------|--------|----------|--------------------------|
| `team_id` | uuid   | yes      | Team to drill into       |
| `start`   | date   | yes      | Period start, inclusive   |
| `end`     | date   | yes      | Period end, inclusive     |

#### KQL — Runs + Success Rate (`DailyRollup`)

```kql
let period_start = datetime({start});
let period_end = datetime({end});
let period_len = period_end - period_start;
let prior_start = period_start - period_len - 1d;
let prior_end = period_start - 1d;
DailyRollup
| where tenant_id == "{tenant_id}" and team_id == "{team_id}"
| where day between (prior_start .. period_end)
| extend is_current = day between (period_start .. period_end)
| summarize completed = sum(completed_count), failed = sum(failed_count) by is_current
| extend total = completed + failed,
         rate_pct = round(100.0 * completed / (completed + failed), 1)
```

Application code extracts current and prior rows for runs delta and success rate delta.

#### KQL — Spend (`DailyCostRollup`)

```kql
let period_start = datetime({start});
let period_end = datetime({end});
let period_len = period_end - period_start;
let prior_start = period_start - period_len - 1d;
let prior_end = period_start - 1d;
DailyCostRollup
| where tenant_id == "{tenant_id}" and team_id == "{team_id}"
| where day between (prior_start .. period_end)
| summarize current_usd = sumif(cost_usd, day between (period_start .. period_end)),
            prior_usd = sumif(cost_usd, day between (prior_start .. prior_end))
| extend delta_pct = round((current_usd - prior_usd) / prior_usd * 100, 1)
```

#### KQL — Active Users (`DailyUserRollup`)

```kql
let period_start = datetime({start});
let period_end = datetime({end});
let period_len = period_end - period_start;
let prior_start = period_start - period_len - 1d;
let prior_end = period_start - 1d;
DailyUserRollup
| where tenant_id == "{tenant_id}" and team_id == "{team_id}"
| where day between (prior_start .. period_end)
| extend is_current = day between (period_start .. period_end)
| summarize active_users = dcount(user_id) by is_current
```

Application code runs all three KQL queries in parallel and assembles the response.

#### Cache

- Key: `team-summary:{tenant_id}:{team_id}:{start}:{end}`
- TTL: 60 seconds

---

### 3. Team Top Agents

```
GET /api/v1/widgets/team-top-agents?team_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890&start=2025-02-01&end=2025-03-01&limit=10
```

Returns agent breakdown for the selected team, sorted by run count.

#### Query Parameters

| Param     | Type    | Required | Default | Description                  |
|-----------|---------|----------|---------|------------------------------|
| `team_id` | uuid    | yes      | —       | Team to drill into           |
| `start`   | date    | yes      | —       | Period start, inclusive       |
| `end`     | date    | yes      | —       | Period end, inclusive         |
| `limit`   | integer | no       | 10      | Number of agents to return (max 50) |

#### KQL — Performance (`DailyAgentRollup`)

```kql
DailyAgentRollup
| where tenant_id == "{tenant_id}" and team_id == "{team_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize run_count = sum(run_count),
            failed_count = sum(failed_count),
            avg_duration_ms = round(sum(sum_duration_ms) / sum(run_count), 0)
  by agent_type
| extend success_rate_pct = round(100.0 * (run_count - failed_count) / run_count, 1)
| top {limit} by run_count desc
```

#### KQL — Cost (`DailyCostRollup`)

```kql
DailyCostRollup
| where tenant_id == "{tenant_id}" and team_id == "{team_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize spend_usd = round(sum(cost_usd), 2) by agent_type
```

Application code joins the two results by `agent_type`.

#### Cache

- Key: `team-top-agents:{tenant_id}:{team_id}:{start}:{end}:{limit}`
- TTL: 60 seconds

---

### 4. Team User Activity

```
GET /api/v1/widgets/team-user-activity?team_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890&start=2025-02-01&end=2025-03-01
```

Returns per-user metrics within a team.

#### Query Parameters

| Param     | Type | Required | Description              |
|-----------|------|----------|--------------------------|
| `team_id` | uuid | yes      | Team to drill into       |
| `start`   | date | yes      | Period start, inclusive   |
| `end`     | date | yes      | Period end, inclusive     |

#### KQL — `DailyUserRollup`

```kql
DailyUserRollup
| where tenant_id == "{tenant_id}" and team_id == "{team_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize run_count = sum(run_count),
            completed = sum(completed_count),
            failed = sum(failed_count),
            last_active = max(last_active)
  by user_id
| extend success_rate_pct = round(100.0 * completed / (completed + failed), 1)
| order by run_count desc
```

User display names are resolved via Microsoft Graph API (per common conventions).

#### Cache

- Key: `team-user-activity:{tenant_id}:{team_id}:{start}:{end}`
- TTL: 60 seconds

---

## Additional Errors

Beyond the [common error handling](backend-spec-common.md):

| Scenario | HTTP Status | Response Body |
|----------|-------------|---------------|
| Missing `team_id` | 400 | `{ "error": "missing_params", "message": "team_id is required" }` |
| `limit` out of range (< 1 or > 50) | 400 | `{ "error": "invalid_param", "message": "limit must be between 1 and 50" }` |

---

## Query Performance

| Endpoint | Table | Retention |
|----------|-------|-----------|
| `team-list` | Microsoft Graph API | — |
| `team-summary` | `DailyRollup` + `DailyCostRollup` + `DailyUserRollup` | 2 years |
| `team-top-agents` | `DailyAgentRollup` + `DailyCostRollup` | 2 years |
| `team-user-activity` | `DailyUserRollup` | 2 years |

All endpoints use pre-aggregated rollup tables. No raw table queries, no retention limits.

