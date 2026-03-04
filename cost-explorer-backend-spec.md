# Backend Spec: Cost Explorer Dashboard

## Overview

The Cost Explorer provides detailed cost analysis — daily spend time-series, breakdown by cost
driver, month-end forecasting, budget burn rate, and a per-team cost summary table. It reuses
several widget endpoints from the Executive Summary spec and adds Cost Explorer-specific ones.

For auth, query parameters, caching, and error handling conventions, see
[backend-spec-common.md](backend-spec-common.md).

---

## Reused Endpoints

These endpoints are defined in the Executive Summary spec and reused here without changes:

| Endpoint | Cost Explorer usage |
|----------|---------------------|
| `GET /api/v1/widgets/spend-kpi?start=...&end=...` | Spend KPI card (total spend, delta, budget comparison) |
| `GET /api/v1/widgets/monthly-spend` | Not directly shown but available for context |

---

## New Endpoints

### 1. Daily Spend Time-Series

```
GET /api/v1/widgets/daily-spend?start=2025-02-01&end=2025-03-01&dimension=team
```

Returns daily spend broken down by a selectable dimension.

#### Query Parameters

| Param       | Type   | Required | Default | Description                           |
|-------------|--------|----------|---------|---------------------------------------|
| `start`     | date   | yes      | —       | Period start, inclusive                |
| `end`       | date   | yes      | —       | Period end, inclusive                  |
| `dimension` | string | no       | `team`  | Grouping dimension: `team` or `agent_type` |
| `granularity` | string | no     | `daily` | Time bucket: `daily`, `weekly`, or `monthly` |

#### Granularity → table selection

All dimension/granularity combinations use `DailyCostRollup` (which includes `agent_type`
via a join with `AgentRuns` in the update policy). Weekly and monthly granularity aggregate
with `bin()`.

#### KQL — dimension=team

```kql
// {bin_size} = 1d | 7d | 30d depending on granularity
DailyCostRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize spend_usd = sum(cost_usd) by bucket = bin(day, {bin_size}), team_id
| order by bucket asc
```

#### KQL — dimension=agent_type

```kql
// {bin_size} = 1d | 7d | 30d depending on granularity
DailyCostRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize spend_usd = sum(cost_usd) by bucket = bin(day, {bin_size}), agent_type
| order by bucket asc
```

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "dimension": "team",
  "granularity": "daily",
  "series": [
    {
      "key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "label": "ML Infra",
      "data": [
        { "date": "2025-02-01", "spend_usd": 720.50 },
        { "date": "2025-02-02", "spend_usd": 680.00 },
        "..."
      ]
    },
    {
      "key": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "label": "Data Eng",
      "data": [
        { "date": "2025-02-01", "spend_usd": 490.25 },
        "..."
      ]
    },
    {
      "key": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "label": "Platform Team",
      "data": [
        { "date": "2025-02-01", "spend_usd": 380.00 },
        "..."
      ]
    }
  ]
}
```

When `dimension=agent_type`, `key` and `label` are both the agent type string (e.g.
`"code-reviewer-v3"`), no Graph API resolution needed.

#### Cache

- Key: `daily-spend:{tenant_id}:{start}:{end}:{dimension}:{granularity}`
- TTL: 60 seconds

---

### 2. Spend Breakdown by Cost Driver

```
GET /api/v1/widgets/spend-breakdown?start=2025-02-01&end=2025-03-01
```

Returns spend split by cost driver (tokens, compute, storage, egress) for the donut chart.

#### KQL — `RunCosts`

```kql
RunCosts
| where tenant_id == "{tenant_id}"
| where priced_at between (datetime({start}) .. datetime({end}))
| summarize total_usd = sum(cost_usd),
            compute_usd = sum(toreal(cost_breakdown.compute_usd)),
            token_usd = sum(toreal(cost_breakdown.token_usd)),
            storage_usd = sum(toreal(cost_breakdown.storage_usd)),
            egress_usd = sum(toreal(cost_breakdown.egress_usd))
```

Note: `storage_usd` and `egress_usd` may be zero or absent in `cost_breakdown` if the Billing
System doesn't break them out. The API returns them as `0.00` when absent, and an `other_usd`
field captures any remainder (`total - compute - token - storage - egress`).

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "total_usd": 47200.00,
  "drivers": [
    { "driver": "tokens", "spend_usd": 30128.00, "pct": 63.8 },
    { "driver": "compute", "spend_usd": 12272.00, "pct": 26.0 },
    { "driver": "storage", "spend_usd": 3304.00, "pct": 7.0 },
    { "driver": "egress", "spend_usd": 1496.00, "pct": 3.2 }
  ]
}
```

If `other_usd > 0`, an additional `{ "driver": "other", ... }` entry is included.

#### Cache

- Key: `spend-breakdown:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 3. Budget & Forecast

```
GET /api/v1/widgets/budget-forecast
```

No `start`/`end` params — always calculates for the current month. Combines month-end
forecast and budget burn rate into a single endpoint since they share the same data sources.

#### Logic

1. Query actual spend so far this month from `DailyCostRollup`:

```kql
DailyCostRollup
| where tenant_id == "{tenant_id}"
| where day >= startofmonth(now())
| summarize spent_so_far = sum(cost_usd), days_with_data = dcount(day)
```

2. Fetch budget from `tenant-budgets` Cosmos container.

3. Application code:
   - `days_elapsed` = current day of month
   - `days_in_month` = total days in current month
   - `daily_run_rate` = `spent_so_far / days_elapsed`
   - `projected_usd` = `daily_run_rate * days_in_month`
   - `burn_pct` = `spent_so_far / budget_usd * 100`
   - `month_progress_pct` = `days_elapsed / days_in_month * 100`
   - `on_track` = `burn_pct <= month_progress_pct + 5` (within 5pp tolerance)

#### Response

```json
{
  "month": "2025-03",
  "days_elapsed": 18,
  "days_in_month": 31,
  "spent_so_far_usd": 30100.00,
  "daily_run_rate_usd": 1672.22,
  "forecast": {
    "projected_usd": 51838.89,
    "projected_over_budget_usd": 6838.89,
    "projected_budget_pct": 115.2
  },
  "burn_rate": {
    "budget_usd": 45000.00,
    "burn_pct": 66.9,
    "month_progress_pct": 58.1,
    "on_track": false
  }
}
```

If no budget is set, `burn_rate.budget_usd` is `null`, `burn_rate.burn_pct` is `null`,
and `forecast.projected_over_budget_usd` / `forecast.projected_budget_pct` are `null`.
`forecast.projected_usd` is always returned since it doesn't depend on a budget.

#### Cache

- Key: `budget-forecast:{tenant_id}`
- TTL: 5 minutes

---

### 4. Per-Team Cost Summary

```
GET /api/v1/widgets/team-cost-summary?start=2025-02-01&end=2025-03-01
```

Returns all teams (not just top 3) with spend, run count, avg cost/run, prior-period delta,
and share of total spend. Powers the summary table.

#### KQL — `DailyCostRollup` + `DailyRollup`

Spend and run counts come from two tables, joined by `team_id`:

```kql
let period_start = datetime({start});
let period_end = datetime({end});
let period_len = period_end - period_start;
let prior_start = period_start - period_len - 1d;
let prior_end = period_start - 1d;
let current_cost = DailyCostRollup
  | where tenant_id == "{tenant_id}"
  | where day between (prior_start .. period_end)
  | extend is_current = day between (period_start .. period_end)
  | summarize spend_usd = sumif(cost_usd, is_current),
              prior_spend_usd = sumif(cost_usd, not(is_current))
    by team_id;
let current_runs = DailyRollup
  | where tenant_id == "{tenant_id}"
  | where day between (period_start .. period_end)
  | summarize run_count = sum(completed_count) + sum(failed_count)
    by team_id;
current_cost
| join kind=leftouter current_runs on team_id
| extend avg_cost_per_run = round(spend_usd / run_count, 2),
         delta_pct = round((spend_usd - prior_spend_usd) / prior_spend_usd * 100, 1)
| order by spend_usd desc
```

Total spend is computed in application code to calculate each team's `share_pct`.

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "total_spend_usd": 47200.00,
  "teams": [
    {
      "team_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "team_name": "ML Infra",
      "spend_usd": 21340.00,
      "run_count": 4210,
      "avg_cost_per_run": 5.07,
      "delta_pct": 18.0,
      "share_pct": 45.2
    },
    {
      "team_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "team_name": "Data Eng",
      "spend_usd": 14780.00,
      "run_count": 5102,
      "avg_cost_per_run": 2.90,
      "delta_pct": -3.0,
      "share_pct": 31.3
    },
    {
      "team_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "team_name": "Platform Team",
      "spend_usd": 11080.00,
      "run_count": 3535,
      "avg_cost_per_run": 3.13,
      "delta_pct": -1.0,
      "share_pct": 23.5
    }
  ]
}
```

#### Cache

- Key: `team-cost-summary:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

## Additional Errors

Beyond the [common error handling](backend-spec-common.md):

| Scenario | HTTP Status | Response Body |
|----------|-------------|---------------|
| Invalid `dimension` value | 400 | `{ "error": "invalid_param", "message": "dimension must be 'team' or 'agent_type'" }` |
| Invalid `granularity` value | 400 | `{ "error": "invalid_param", "message": "granularity must be 'daily', 'weekly', or 'monthly'" }` |

---

## Widget Reusability

| Endpoint | Also used by |
|----------|--------------|
| `daily-spend` | Team Drill-Down (filtered to single team) |
| `spend-breakdown` | Team Drill-Down (filtered to single team) |
| `team-cost-summary` | Team Drill-Down (as context for team selection) |
| `spend-kpi` | Executive Summary |
| `budget-forecast` | Executive Summary (if budget widget is added) |
