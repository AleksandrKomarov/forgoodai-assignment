# Backend Spec: Executive Summary Dashboard

## Overview

The Executive Summary is the default landing page of the analytics dashboard. It surfaces high-level
KPIs, spend trends, run volume, and top cost centers.

For auth, query parameters, caching, and error handling conventions, see
[backend-spec-common.md](backend-spec-common.md).

---

## Endpoints

### 1. Monthly Spend Chart

```
GET /api/v1/widgets/monthly-spend
```

Returns 12 months of historical spend and a 3-month forecast. No `start`/`end` params —
the window is always 12 months back from today.

#### KQL — `DailyCostRollup`

```kql
DailyCostRollup
| where tenant_id == "{tenant_id}"
| where day >= ago(365d)
| summarize total_usd = sum(cost_usd) by period = format_datetime(day, "yyyy-MM")
| order by period asc
```

#### Forecast logic

Application code (not KQL):
1. Take the last 3 complete months of actual spend
2. Compute average monthly spend
3. Project that average forward for 3 months

#### Response

```json
{
  "monthly_spend": [
    { "period": "2024-04", "total_usd": 12340.50 },
    { "period": "2024-05", "total_usd": 13100.00 },
    { "period": "2024-06", "total_usd": 11800.75 },
    { "period": "2024-07", "total_usd": 12900.00 },
    { "period": "2024-08", "total_usd": 14200.25 },
    { "period": "2024-09", "total_usd": 13500.00 },
    { "period": "2024-10", "total_usd": 15100.50 },
    { "period": "2024-11", "total_usd": 14800.00 },
    { "period": "2024-12", "total_usd": 16200.75 },
    { "period": "2025-01", "total_usd": 15900.00 },
    { "period": "2025-02", "total_usd": 17100.25 },
    { "period": "2025-03", "total_usd": 16400.50 }
  ],
  "monthly_spend_forecast": [
    { "period": "2025-04", "projected_usd": 16467.58 },
    { "period": "2025-05", "projected_usd": 16467.58 },
    { "period": "2025-06", "projected_usd": 16467.58 }
  ]
}
```

#### Cache

- Key: `monthly-spend:{tenant_id}`
- TTL: 5 minutes (trend data, not real-time)

---

### 2. Success Rate

```
GET /api/v1/widgets/success-rate?start=2025-02-01&end=2025-03-01
```

#### KQL — `DailyRollup`

Single query fetches both current and prior period:

```kql
let period_start = datetime({start});
let period_end = datetime({end});
let period_len = period_end - period_start;
let prior_start = period_start - period_len - 1d;
let prior_end = period_start - 1d;
DailyRollup
| where tenant_id == "{tenant_id}"
| where day between (prior_start .. period_end)
| extend is_current = day between (period_start .. period_end)
| summarize completed = sum(completed_count), failed = sum(failed_count) by is_current
| extend total = completed + failed,
         rate_pct = round(100.0 * completed / (completed + failed), 1)
```

Application code extracts the two rows (`is_current = true/false`) and computes
`delta_pp = current_rate_pct - prior_rate_pct` (percentage-point change).

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "rate_pct": 94.2,
  "completed": 18420,
  "failed": 1130,
  "total": 19550,
  "prior_rate_pct": 92.8,
  "delta_pp": 1.4
}
```

#### Cache

- Key: `success-rate:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 3. Run Volume

```
GET /api/v1/widgets/run-volume?start=2025-02-01&end=2025-03-01
```

Returns daily run counts for the sparkline and a total with prior-period delta.

#### KQL — `DailyRollup`

Current period:
```kql
DailyRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({start}) .. datetime({end}))
| summarize count = sum(completed_count) + sum(failed_count) by day
| order by day asc
```

Prior-period total (second query, same structure with prior date range):
```kql
DailyRollup
| where tenant_id == "{tenant_id}"
| where day between (datetime({prior_start}) .. datetime({prior_end}))
| summarize prior_total = sum(completed_count) + sum(failed_count)
```

Application code computes `delta_pct = (total_runs - prior_total_runs) / prior_total_runs * 100`.

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "total_runs": 19550,
  "prior_total_runs": 17800,
  "delta_pct": 9.8,
  "daily": [
    { "date": "2025-02-01", "count": 642 },
    { "date": "2025-02-02", "count": 580 },
    { "date": "2025-02-03", "count": 710 },
    "..."
  ]
}
```

#### Cache

- Key: `run-volume:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 4. Top Cost Centers

```
GET /api/v1/widgets/top-cost-centers?start=2025-02-01&end=2025-03-01
```

Returns top 3 teams by spend with prior-period delta.

#### KQL — `DailyCostRollup`

Single query covers both periods:
```kql
let period_start = datetime({start});
let period_end = datetime({end});
let period_len = period_end - period_start;
let prior_start = period_start - period_len - 1d;
let prior_end = period_start - 1d;
DailyCostRollup
| where tenant_id == "{tenant_id}"
| where day between (prior_start .. period_end)
| extend is_current = day between (period_start .. period_end)
| summarize spend_usd = sumif(cost_usd, is_current),
            prior_spend_usd = sumif(cost_usd, not(is_current)),
            run_count = sumif(run_count, is_current)
  by team_id
| extend delta_pct = round((spend_usd - prior_spend_usd) / prior_spend_usd * 100, 1)
| top 3 by spend_usd desc
```

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "teams": [
    {
      "team_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "team_name": "ML Platform",
      "spend_usd": 18200.00,
      "run_count": 8420,
      "delta_pct": 12.3
    },
    {
      "team_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "team_name": "Data Engineering",
      "spend_usd": 14100.00,
      "run_count": 6200,
      "delta_pct": -3.1
    },
    {
      "team_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "team_name": "Backend Services",
      "spend_usd": 9800.00,
      "run_count": 4930,
      "delta_pct": 5.7
    }
  ]
}
```

#### Cache

- Key: `top-cost-centers:{tenant_id}:{start}:{end}`
- TTL: 60 seconds

---

### 5. Spend KPI

```
GET /api/v1/widgets/spend-kpi?start=2025-02-01&end=2025-03-01
```

Total spend for the selected period with prior-period delta and budget comparison.
Separate from the monthly-spend chart because it's scoped to the user-selected period.

#### KQL — `DailyCostRollup`

```kql
let period_start = datetime({start});
let period_end = datetime({end});
let period_len = period_end - period_start;
let prior_start = period_start - period_len - 1d;
let prior_end = period_start - 1d;
DailyCostRollup
| where tenant_id == "{tenant_id}"
| where day between (prior_start .. period_end)
| summarize current_usd = sumif(cost_usd, day between (period_start .. period_end)),
            prior_usd = sumif(cost_usd, day between (prior_start .. prior_end))
| extend delta_pct = round((current_usd - prior_usd) / prior_usd * 100, 1)
```

#### Budget lookup

Budget is fetched from the `tenant-budgets` Cosmos DB container (synced from Billing System API).
The API matches the budget record for the period that overlaps with the selected range.

- Cosmos query: `SELECT * FROM c WHERE c.tenant_id = "{tenant_id}" AND c.period = "{yyyy-MM}"`
- If the selected range spans multiple months, the budget for the month containing `end` is used
- If no budget is set, `budget_usd` and `budget_utilization_pct` return `null`

#### Response

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "spend_usd": 42100.00,
  "prior_spend_usd": 38900.00,
  "delta_pct": 8.2,
  "budget_usd": 45000.00,
  "budget_utilization_pct": 93.6
}
```

#### Cache

- Key: `spend-kpi:{tenant_id}:{start}:{end}`, TTL 60 seconds
- Budget cached separately: `budget:{tenant_id}:{period}`, TTL 5 minutes

---

## Widget Reusability

These endpoints are not exclusive to the Executive Summary. Other dashboard views can reuse them:

| Endpoint            | Also used by            |
|---------------------|-------------------------|
| `spend-kpi`         | Cost Explorer           |
| `top-cost-centers`  | Cost Explorer           |
| `success-rate`      | Performance & Reliability |
| `run-volume`        | Usage & Capacity        |
| `monthly-spend`     | Cost Explorer           |
