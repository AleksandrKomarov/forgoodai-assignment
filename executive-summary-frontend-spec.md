# Frontend Spec: Executive Summary View

## Overview

The Executive Summary is the default landing page (route: `/`). It surfaces high-level KPIs,
spend trends, run volume, and top cost centers. The view makes **6 API calls on mount**, with
each widget rendering independently as its response arrives.

For API response schemas, see [api-reference.md](api-reference.md) endpoints 1-5 and 8.

---

## Component Tree

```
ExecutiveSummaryView
  |
  +-- KpiRow                            (kpi-row)
  |     +-- SpendKpiCard                  data: useSpendKpi(start, end)
  |     +-- TotalRunsKpiCard              data: useRunVolume(start, end)
  |     +-- SuccessRateKpiCard            data: useSuccessRate(start, end)
  |     +-- ProjectedSpendCard            data: useBudgetForecast()
  |
  +-- ChartsRow                         (grid-2-1)
  |     +-- MonthlySpendChart             data: useMonthlySpend()
  |     +-- RightColumn                 (flex column, gap: 16px)
  |           +-- SuccessRateGauge        data: useSuccessRate(start, end)  ← shared
  |           +-- RunVolumeSparkline      data: useRunVolume(start, end)   ← shared
  |
  +-- TopCostCentersTable               data: useTopCostCenters(start, end)
```

**Shared data:** `useSuccessRate()` feeds both the KPI card and the gauge. `useRunVolume()`
feeds both the KPI card and the sparkline. TanStack Query deduplicates identical query keys.

---

## Layout

- **KPI row:** `.kpi-row` — 4 equal columns
- **Charts row:** `.grid-2-1` — left: Monthly Spend Chart, right: two cards stacked vertically
  (gauge on top, sparkline below)
- **Table:** full-width `card`

---

## Data Hooks

### useSpendKpi

```typescript
function useSpendKpi(start: string, end: string) {
  return useQuery({
    queryKey: ["spend-kpi", start, end],
    queryFn: () => fetchWidget("spend-kpi", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ spend_usd, prior_spend_usd, delta_pct, budget_usd, budget_utilization_pct }`

---

### useRunVolume

```typescript
function useRunVolume(start: string, end: string) {
  return useQuery({
    queryKey: ["run-volume", start, end],
    queryFn: () => fetchWidget("run-volume", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ total_runs, prior_total_runs, delta_pct, daily: [{ date, count }] }`

Used by both `TotalRunsKpiCard` (reads `total_runs`, `delta_pct`) and `RunVolumeSparkline`
(reads `daily[]`).

---

### useSuccessRate

```typescript
function useSuccessRate(start: string, end: string) {
  return useQuery({
    queryKey: ["success-rate", start, end],
    queryFn: () => fetchWidget("success-rate", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ rate_pct, completed, failed, total, prior_rate_pct, delta_pp }`

Used by both `SuccessRateKpiCard` (reads `rate_pct`, `delta_pp`) and `SuccessRateGauge`
(reads `rate_pct`).

---

### useBudgetForecast

```typescript
function useBudgetForecast() {
  return useQuery({
    queryKey: ["budget-forecast"],
    queryFn: () => fetchWidget("budget-forecast"),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ month, days_elapsed, days_in_month, spent_so_far_usd, daily_run_rate_usd, forecast: { projected_usd, projected_over_budget_usd, projected_budget_pct }, burn_rate: { budget_usd, burn_pct, month_progress_pct, on_track } }`

Fixed-window — not affected by date range changes.

---

### useMonthlySpend

```typescript
function useMonthlySpend() {
  return useQuery({
    queryKey: ["monthly-spend"],
    queryFn: () => fetchWidget("monthly-spend"),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ monthly_spend: [{ period, total_usd }], monthly_spend_forecast: [{ period, projected_usd }] }`

Fixed-window — not affected by date range changes.

---

### useTopCostCenters

```typescript
function useTopCostCenters(start: string, end: string) {
  return useQuery({
    queryKey: ["top-cost-centers", start, end],
    queryFn: () => fetchWidget("top-cost-centers", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ teams: [{ team_id, team_name, spend_usd, run_count, delta_pct }] }`

---

## Widget Specifications

### 1. Spend KPI Card

**Data source:** `useSpendKpi(start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | dynamic | `Accumulated Spend ({days}d)` | `Accumulated Spend (30d)` |
| Value | `spend_usd` | `formatCurrencyCompact()` | `$47.2K` |
| Delta | `delta_pct` | `±X.X% vs prior period` | `+8.3% vs prior period` |

`{days}` = `daysBetween(start, end)` from the date range selector.

**Delta color:** Cost increase = **red** (`.kpi-delta.down`). Cost decrease = **green**.

```html
<div class="kpi">
  <div class="kpi-label">Accumulated Spend ({days}d)</div>
  <div class="kpi-value">{formatCurrencyCompact(spend_usd)}</div>
  <div class="kpi-delta {getDeltaClass(delta_pct, 'cost')}">
    {formatSignedPercent(delta_pct)} vs prior period
  </div>
</div>
```

---

### 2. Total Runs KPI Card

**Data source:** `useRunVolume(start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | dynamic | `Total Runs ({days}d)` | `Total Runs (30d)` |
| Value | `total_runs` | `formatCount()` | `12,847` |
| Delta | `delta_pct` | `±X.X% vs prior period` | `+12.1% vs prior period` |

**Delta color:** Run increase = **green** (`.kpi-delta.up`).

---

### 3. Success Rate KPI Card

**Data source:** `useSuccessRate(start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | static | — | `SUCCESS RATE` |
| Value | `rate_pct` | `formatPercent()` | `96.3%` |
| Delta | `delta_pp` | `±X.Xpp vs prior period` | `+0.5pp vs prior period` |

**Value color:** Always `var(--green)`.

**Delta color:** Rate increase = **green**, decrease = **red**.

---

### 4. Projected Month-End KPI Card

**Data source:** `useBudgetForecast()`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | static | — | `PROJECTED MONTH-END` |
| Value | `forecast.projected_usd` | `formatCurrencyCompact()` | `$51.8K` |
| Delta | `forecast.projected_over_budget_usd` | `$X.XK over/under budget` | `$6.8K over budget` |

**Delta logic:**

```typescript
if (forecast.projected_over_budget_usd === null) {
  delta = null;  // no budget set
} else if (forecast.projected_over_budget_usd > 0) {
  delta = `${formatCurrencyCompact(forecast.projected_over_budget_usd)} over budget`;
  className = "kpi-delta down";  // red
} else {
  delta = `${formatCurrencyCompact(Math.abs(forecast.projected_over_budget_usd))} under budget`;
  className = "kpi-delta up";    // green
}
```

Fixed-window — not affected by the date range selector.

---

### 5. Monthly Spend Chart

**Data source:** `useMonthlySpend()`

**Card title:** `MONTHLY SPEND + 3 MONTH FORECAST`

Vertical bar chart, 15 bars (12 actual + 3 forecast). Chart height: `220px`.

**Actual bars:**
- Background: `var(--accent)`, full opacity
- Max-width: `32px`, border-radius: `4px 4px 0 0`
- Bottom label: month abbreviation (e.g., `"Mar"`), `font-size: 10px`
- Value label: `formatCurrencyCompact(total_usd)`, `font-weight: 600`

**Forecast bars:**
- Background: `var(--accent)`, opacity decreasing: `0.4`, `0.3`, `0.2`
- Border: `2px dashed var(--accent)`
- Bottom label: month + asterisk (e.g., `"Mar*"`)
- Value label: `formatCurrencyCompact(projected_usd)`, `color: var(--text2)`

**Height calculation:**

```typescript
const allValues = [
  ...monthlySpend.map(m => m.total_usd),
  ...forecast.map(m => m.projected_usd),
];
const maxValue = Math.max(...allValues);
const heightPct = (value / maxValue) * 100;
```

**Legend:** Centered below chart — "Actual" (solid square) and "Forecast" (faded square).

Fixed-window — not affected by date range selector.

---

### 6. Success Rate Gauge

**Data source:** `useSuccessRate(start, end)` (shared with KPI card)

**Card title:** `OVERALL SUCCESS RATE`

SVG arc gauge, 120×120px. Uses `.gauge` component.

```html
<svg viewBox="0 0 120 120" width="120" height="120">
  <!-- Background arc -->
  <circle cx="60" cy="60" r="52"
    stroke="var(--border)" stroke-width="10" fill="none" />
  <!-- Foreground arc -->
  <circle cx="60" cy="60" r="52"
    stroke="var(--green)" stroke-width="10" fill="none"
    stroke-dasharray="{circumference}"
    stroke-dashoffset="{dashoffset}"
    stroke-linecap="round" />
</svg>
```

**Arc calculation:**

```typescript
const circumference = 2 * Math.PI * 52;  // ≈ 326.7
const dashoffset = circumference * (1 - rate_pct / 100);
```

Center label: rate value (24px bold) + `"{days}-day avg"` subtitle (11px), where `{days}` reflects the selected date range.

---

### 7. Run Volume Sparkline

**Data source:** `useRunVolume(start, end)` (shared with KPI card)

**Card title:** `RUN VOLUME ({days}d)` — dynamic, reflects selected date range.

Minimal bar chart — no axes, no labels. Uses `.sparkline` component.

```html
<div class="sparkline">
  {daily.map(d => (
    <div class="sp-bar" style="height: {(d.count / maxCount) * 100}%" />
  ))}
</div>
```

One bar per day in `daily[]`. Height proportional to max count.

---

### 8. Top Cost Centers Table

**Data source:** `useTopCostCenters(start, end)`

**Card title:** `TOP 3 COST CENTERS (BY TEAM)`

| Column | Source | Format |
|--------|--------|--------|
| Team | `team_name` | Bold (`<strong>`) |
| Spend ({days}d) | `spend_usd` | `formatCurrencyFull()` → `$21,340` |
| Runs | `run_count` | `formatCount()` → `4,210` |
| Avg Cost/Run | computed: `spend_usd / run_count` | `formatCurrencyPrecise()` → `$5.07` |
| Share | `spend_usd` | Inline bar (`.bar-container`) + percentage label (`X.X%`) |

**Share bar width:** `(team.spend_usd / totalSpend) * 100` percent, where `totalSpend` is the sum of all displayed teams' spend. A percentage label is shown below the bar.

**Note:** `delta_pct` is in the response but NOT displayed here — it's used in the Cost
Explorer's per-team table instead.

---

## Date Range Integration

### Range-scoped (re-fetch on date change)

| Widget | Query key |
|--------|-----------|
| Spend KPI Card | `["spend-kpi", start, end]` |
| Total Runs KPI + Sparkline | `["run-volume", start, end]` |
| Success Rate KPI + Gauge | `["success-rate", start, end]` |
| Top Cost Centers | `["top-cost-centers", start, end]` |

### Fixed-window (not affected by date change)

| Widget | Query key |
|--------|-----------|
| Monthly Spend Chart | `["monthly-spend"]` |
| Projected Month-End KPI | `["budget-forecast"]` |
