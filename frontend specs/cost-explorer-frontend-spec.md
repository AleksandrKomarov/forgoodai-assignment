# Frontend Spec: Cost Explorer View

## Overview

The Cost Explorer provides detailed cost analysis with dimension filtering, cost driver
breakdown, budget forecasting, and per-team comparison. Route: `/cost-explorer`. The view
makes **4 unique API calls on mount**, with each widget rendering independently.

For API response schemas, see [api-reference.md](api-reference.md) endpoints 6-9.

---

## Component Tree

```
CostExplorerView
  |
  +-- FilterBar                             (filter-bar)
  |     +-- DimensionDropdown                 local state: "team" | "agent_type"
  |     +-- GranularityDropdown               local state: "daily" | "weekly" | "monthly"
  |
  +-- DailySpendChart                       (full-width card)
  |     data: useDailySpend(start, end, dimension, granularity)
  |
  +-- MiddleRow                             (grid-2)
  |     +-- SpendBreakdownDonut               data: useSpendBreakdown(start, end)
  |     +-- RightColumn                     (flex column, gap: 16px)
  |           +-- ForecastCard                data: useBudgetForecast()  ← shared
  |           +-- BurnRateCard                data: useBudgetForecast()  ← shared
  |
  +-- TeamCostSummaryTable                  (full-width card)
        data: useTeamCostSummary(start, end)
```

**Shared data:** `useBudgetForecast()` feeds both Forecast and Burn Rate cards.

---

## Layout

- **Filter bar:** `.filter-bar` above all widgets
- **Daily Spend Chart:** full-width `card`
- **Middle row:** `.grid-2` — left: donut, right: two cards stacked (forecast + burn rate)
- **Table:** full-width `card`

---

## Local State

```typescript
const [dimension, setDimension] = useState<"team" | "agent_type">("team");
const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("daily");
```

Only affects the `useDailySpend` query key. All other widgets are unaffected by filter changes.

---

## Data Hooks

### useDailySpend

```typescript
function useDailySpend(
  start: string,
  end: string,
  dimension: "team" | "agent_type",
  granularity: "daily" | "weekly" | "monthly",
) {
  return useQuery({
    queryKey: ["daily-spend", start, end, dimension, granularity],
    queryFn: () => fetchWidget("daily-spend", { start, end, dimension, granularity }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ start, end, dimension, granularity, series: [{ key, label, data: [{ date, spend_usd }] }] }`

When `dimension=team`, `key` is the team UUID and `label` is the resolved team name. When
`dimension=agent_type`, both `key` and `label` are the agent type string.

---

### useSpendBreakdown

```typescript
function useSpendBreakdown(start: string, end: string) {
  return useQuery({
    queryKey: ["spend-breakdown", start, end],
    queryFn: () => fetchWidget("spend-breakdown", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ start, end, total_usd, drivers: [{ driver, spend_usd, pct }] }`

Drivers: `tokens`, `compute`, `storage`, `egress`. An additional `other` entry is included
if there's a remainder.

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

Fixed-window — not affected by date range or filter changes. Same hook used by Executive
Summary's Projected Month-End KPI card.

---

### useTeamCostSummary

```typescript
function useTeamCostSummary(start: string, end: string) {
  return useQuery({
    queryKey: ["team-cost-summary", start, end],
    queryFn: () => fetchWidget("team-cost-summary", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ start, end, total_spend_usd, teams: [{ team_id, team_name, spend_usd, run_count, avg_cost_per_run, delta_pct, share_pct }] }`

Returns all teams, sorted by spend descending.

---

## Widget Specifications

### 1. Filter Bar

```html
<div class="filter-bar">
  <span class="label">Dimension:</span>
  <select value={dimension} onChange={e => setDimension(e.target.value)}>
    <option value="team">Team</option>
    <option value="agent_type">Agent Type</option>
  </select>
  <span class="label">Period:</span>
  <select value={granularity} onChange={e => setGranularity(e.target.value)}>
    <option value="daily">Daily</option>
    <option value="weekly">Weekly</option>
    <option value="monthly">Monthly</option>
  </select>
</div>
```

Changing either dropdown re-fetches the Daily Spend Chart only.

---

### 2. Daily Spend Chart

**Data source:** `useDailySpend(start, end, dimension, granularity)`

**Card title:** Dynamic — `"{Granularity} Spend by {Dimension}"` (e.g., `"Daily Spend by Team"`).

Stacked vertical bar chart. One color-coded series per dimension value. Chart height: `200px`.

**Bar rendering:** Each time bucket is a vertical flex column with segments stacked. Top
segment gets `border-radius: 3px 3px 0 0`, bottom gets `0 0 3px 3px`. Bar `max-width: 20px`.

**Height calculation:**

```typescript
const maxTotal = Math.max(
  ...data[0].data.map((_, i) =>
    series.reduce((sum, s) => sum + s.data[i].spend_usd, 0)
  )
);
// Each segment: height = (spend_usd / maxTotal) * 100%
```

**Series colors:** Assigned by index from the chart color palette (accent, green, orange...).

**X-axis labels:** Every 5th bar. Format varies by granularity:
- Daily: `"Feb 1"`, `"Feb 6"`
- Weekly: `"Feb 1"`, `"Feb 8"`
- Monthly: `"Feb"`, `"Mar"`

Label style: `font-size: 9px`, `color: var(--text2)`.

**Legend:** Uses `.chart-legend` component below the chart.

---

### 3. Spend Breakdown Donut

**Data source:** `useSpendBreakdown(start, end)`

**Card title:** `SPEND BREAKDOWN BY COST DRIVER`

Uses `.donut-container` — donut SVG on left, legend on right.

**SVG donut:** 180×180px viewBox, center (90,90), radius 70, stroke-width 28.

```html
<svg viewBox="0 0 180 180" width="180" height="180">
  {drivers.map((driver, i) => (
    <circle cx="90" cy="90" r="70" fill="none"
      stroke="{driverColor(driver.driver)}"
      stroke-width="28"
      stroke-dasharray="{arcLength} {circumference}"
      stroke-dashoffset="{offset}"
      transform="rotate(-90 90 90)" />
  ))}
  <text x="90" y="85" text-anchor="middle" font-size="22" font-weight="700"
        fill="var(--text)">{formatCurrencyCompact(total_usd)}</text>
  <text x="90" y="103" text-anchor="middle" font-size="11"
        fill="var(--text2)">total spend</text>
</svg>
```

**Arc calculation:**

```typescript
const circumference = 2 * Math.PI * 70;  // ≈ 439.8
let cumulativeOffset = 0;
drivers.map(driver => {
  const arcLength = (driver.pct / 100) * circumference;
  const offset = -cumulativeOffset;
  cumulativeOffset += arcLength;
  return { arcLength, offset };
});
```

**Driver colors:** Use the cost driver color mapping from the design spec.

**Legend (right side):** `font-size: 14px`, `line-height: 2.2`. Each row:
`{Driver} — {pct}% ({formatCurrencyCompact(spend_usd)})`.

---

### 4. Forecast Card

**Data source:** `useBudgetForecast()`

**Card title:** `FORECASTED MONTH-END SPEND`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Value | `forecast.projected_usd` | `formatCurrencyFull()` | `$51,800` |
| Budget subtitle | `burn_rate.budget_usd` | `Budget: {formatCurrencyFull()}` | `Budget: $45,000` |
| Progress bar fill | `forecast.projected_budget_pct` | percentage width | `115%` |
| Over/under label | computed | see below | `115% of budget — $6.8K over` |

**Progress bar fill color:**

```typescript
const fillStyle = projected_budget_pct > 100
  ? "linear-gradient(90deg, var(--accent), var(--red))"  // over budget
  : "var(--accent)";                                      // under budget
```

Fill width: `Math.min(projected_budget_pct, 120)%`.

**Over/under label:**

```typescript
if (forecast.projected_over_budget_usd === null) {
  label = null;  // no budget set — hide budget context
} else if (forecast.projected_over_budget_usd > 0) {
  label = `${Math.round(forecast.projected_budget_pct)}% of budget — ${formatCurrencyCompact(forecast.projected_over_budget_usd)} over`;
  color = "var(--red)";
} else {
  label = `${Math.round(forecast.projected_budget_pct)}% of budget — ${formatCurrencyCompact(Math.abs(forecast.projected_over_budget_usd))} under`;
  color = "var(--green)";
}
```

**Null budget:** Hide budget subtitle, progress bar, and over/under label. Show projected
spend value only.

Fixed-window — not affected by date range or filter changes.

---

### 5. Burn Rate Card

**Data source:** `useBudgetForecast()` (shared with Forecast Card)

**Card title:** `BUDGET BURN RATE`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Value | `burn_rate.burn_pct` | `{Math.round(value)}%` | `73%` |
| Subtitle | static | — | `of monthly budget consumed` |
| Context | computed | — | `Day 18 of 31 (58% through month)` |

```typescript
const context = `Day ${days_elapsed} of ${days_in_month} (${Math.round(burn_rate.month_progress_pct)}% through month)`;
```

**On-track indicator:** `burn_rate.on_track` boolean — optionally color the value green (on
track) or red/orange (not on track).

**Null budget:** Show `"No budget configured"` instead of the percentage.

Fixed-window — not affected by date range or filter changes.

---

### 6. Per-Team Cost Summary Table

**Data source:** `useTeamCostSummary(start, end)`

**Card title:** `PER-TEAM COST SUMMARY`

| Column | Source | Format |
|--------|--------|--------|
| Team | `team_name` | Bold (`<strong>`) |
| Spend | `spend_usd` | `formatCurrencyFull()` → `$21,340` |
| Runs | `run_count` | `formatCount()` → `4,210` |
| Avg $/Run | `avg_cost_per_run` | `formatCurrencyPrecise()` → `$5.07` |
| vs Prior Period | `delta_pct` | Color-coded `.tag` |
| Share | `share_pct` | Inline `.bar` + percentage text |

**Delta tag:**

```typescript
if (delta_pct > 0) return <span className="tag red">+{Math.round(delta_pct)}%</span>;
if (delta_pct < 0) return <span className="tag green">{Math.round(delta_pct)}%</span>;
return <span className="tag gray">0%</span>;
```

Cost increase = red tag, cost decrease = green tag.

**Share bar width:** `(share_pct / maxSharePct) * 100` percent.

Shows **all teams** (not top 3), sorted by spend descending.

---

## Date Range & Filter Integration

### Re-fetch on date range change

| Widget | Query key | Re-fetches? |
|--------|-----------|:-----------:|
| Daily Spend Chart | `["daily-spend", start, end, dimension, granularity]` | Yes |
| Spend Breakdown Donut | `["spend-breakdown", start, end]` | Yes |
| Forecast Card | `["budget-forecast"]` | No |
| Burn Rate Card | `["budget-forecast"]` | No |
| Per-Team Cost Summary | `["team-cost-summary", start, end]` | Yes |

### Re-fetch on filter change

Only `useDailySpend` re-fetches. All other widgets are unaffected.
