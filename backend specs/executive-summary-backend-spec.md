# Backend Spec: Executive Summary Dashboard

## Overview

The Executive Summary is the default landing page of the analytics dashboard. It surfaces high-level
KPIs, spend trends, run volume, and top cost centers.

For auth, query parameters, caching, and error handling conventions, see
[backend-spec-common.md](backend-spec-common.md). For functional requirements, see
[requirements-spec.md](requirements-spec.md). For API contracts and response schemas, see
[api-reference.md](api-reference.md).

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

#### Cache

- Key: `spend-kpi:{tenant_id}:{start}:{end}`, TTL 60 seconds
- Budget cached separately: `budget:{tenant_id}:{period}`, TTL 5 minutes

