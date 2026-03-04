# Frontend Spec: Usage & Capacity View

## Overview

The Usage & Capacity view surfaces adoption metrics, concurrency monitoring, run distribution
patterns, and agent type trends. Route: `/usage`. The view makes **5 unique API calls on mount**,
with each widget rendering independently.

For API response schemas, see [api-reference.md](api-reference.md) endpoints 16-20.
For shared styles and utilities, see [frontend-design-spec.md](frontend-design-spec.md).

---

## Component Tree

```
UsageCapacityView
  |
  +-- KpiRow                              (kpi-row)
  |     +-- ActiveTeamsKpiCard             data: useActiveUsers(start, end)  <- shared
  |     +-- ActiveUsersKpiCard             data: useActiveUsers(start, end)  <- shared
  |     +-- PeakConcurrencyKpiCard         data: useConcurrencyTimeseries(start, end)
  |     +-- NewAgentTypesKpiCard           data: useAgentAdoption()
  |
  +-- ConcurrencyChart                   (full-width card)
  |     data: useConcurrencyTimeseries(start, end)  <- shared
  |
  +-- MiddleRow                          (grid-2)
  |     +-- RunVolumeByTeamChart           data: useRunVolumeByTeam(start, end)
  |     +-- RunHeatmap                     data: useRunHeatmap(start, end)
  |
  +-- AgentAdoptionChart                 (full-width card)
        data: useAgentAdoption()  <- shared
```

**Shared data:** `useActiveUsers()` feeds both Active Teams and Active Users KPI cards.
`useConcurrencyTimeseries()` feeds both the Peak Concurrency KPI and the Concurrency Chart.
`useAgentAdoption()` feeds both the New Agent Types KPI and the Adoption Chart. TanStack Query
deduplicates identical query keys.

---

## Layout

- **KPI row:** `.kpi-row` — 4 equal columns
- **Concurrency chart:** full-width `card`
- **Middle row:** `.grid-2` — left: run volume by team, right: run heatmap
- **Adoption chart:** full-width `card`

---

## Data Hooks

### useActiveUsers

```typescript
function useActiveUsers(start: string, end: string) {
  return useQuery({
    queryKey: ["active-users", start, end],
    queryFn: () => fetchWidget("active-users", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ active_users, prior_active_users, delta_users, active_teams, total_teams }`

Used by both `ActiveTeamsKpiCard` (reads `active_teams`, `total_teams`) and `ActiveUsersKpiCard`
(reads `active_users`, `delta_users`).

---

### useConcurrencyTimeseries

```typescript
function useConcurrencyTimeseries(start: string, end: string) {
  const withinLimit = daysBetween(start, end) <= 90;
  return useQuery({
    queryKey: ["concurrency-timeseries", start, end],
    queryFn: () => fetchWidget("concurrency-timeseries", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
    enabled: withinLimit,
  });
}
```

**Returns:** `{ concurrency_limit, peak_in_period, daily: [{ date, peak_concurrent }] }`

`concurrency_limit` is `null` if no quota is set. Used by both `PeakConcurrencyKpiCard`
(reads `peak_in_period`, `concurrency_limit`) and `ConcurrencyChart` (reads `daily[]`,
`concurrency_limit`).

**90-day limit:** Uses `enabled: withinLimit` to skip the API call when the selected range
exceeds 90 days, avoiding unnecessary 400 errors. Components check `daysBetween > 90`
independently and show an inline warning.

---

### useRunVolumeByTeam

```typescript
function useRunVolumeByTeam(start: string, end: string) {
  return useQuery({
    queryKey: ["run-volume-by-team", start, end],
    queryFn: () => fetchWidget("run-volume-by-team", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ teams: [{ team_id, team_name, run_count }] }`

Sorted by `run_count` descending.

---

### useRunHeatmap

```typescript
function useRunHeatmap(start: string, end: string) {
  const withinLimit = daysBetween(start, end) <= 90;
  return useQuery({
    queryKey: ["run-heatmap", start, end],
    queryFn: () => fetchWidget("run-heatmap", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
    enabled: withinLimit,
  });
}
```

**Returns:** `{ cells: [{ day_of_week, hour_of_day, run_count }] }`

168 entries (7 days x 24 hours). `day_of_week`: 0 = Sunday through 6 = Saturday.

**90-day limit:** Same pattern as `useConcurrencyTimeseries` — disabled when range > 90 days.

---

### useAgentAdoption

```typescript
function useAgentAdoption() {
  return useQuery({
    queryKey: ["agent-adoption"],
    queryFn: () => fetchWidget("agent-adoption"),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ months: [{ month, new_count, new_types }], current_month: { month, new_count, new_types } }`

Fixed-window — not affected by date range changes. Used by both `NewAgentTypesKpiCard`
(reads `current_month`) and `AgentAdoptionChart` (reads `months[]`).

---

## Widget Specifications

### 1. Active Teams KPI Card

**Data source:** `useActiveUsers(start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | static | — | `ACTIVE TEAMS` |
| Value | `active_teams`, `total_teams` | `{active_teams} of {total_teams}` | `3 of 3` |

No delta row — this KPI shows a ratio, not a period-over-period change.

```html
<div class="kpi">
  <div class="kpi-label">Active Teams</div>
  <div class="kpi-value">{active_teams} of {total_teams}</div>
</div>
```

---

### 2. Active Users KPI Card

**Data source:** `useActiveUsers(start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | dynamic | `Active Users ({days}d)` | `Active Users (30d)` |
| Value | `active_users` | `formatCount()` | `47` |
| Delta | `delta_users` | `±N vs prior period` | `+5 vs prior period` |

`{days}` = `daysBetween(start, end)` from the date range context.

**Delta color:** User increase = **green** (`.kpi-delta.up`), decrease = **red**.

**Delta formatting:** `delta_users` is an absolute count (not a percentage):

```typescript
const sign = delta_users > 0 ? "+" : "";
const label = `${sign}${delta_users} vs prior period`;
const className = delta_users >= 0 ? "kpi-delta up" : "kpi-delta down";
```

---

### 3. Peak Concurrency KPI Card

**Data source:** `useConcurrencyTimeseries(start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | dynamic | `Peak Concurrency ({days}d)` | `Peak Concurrency (30d)` |
| Value | `peak_in_period` | `formatCount()` | `34` |
| Subtitle | `concurrency_limit` | `Limit: {limit}` | `Limit: 50` |

No delta row. The subtitle uses 12px secondary-color text (same pattern as Projected Month-End
KPI card).

**Null limit:** Show `"No limit set"` as subtitle when `concurrency_limit` is `null`.

**90-day warning:** When `daysBetween(start, end) > 90`, show an inline warning instead of data:
`"Concurrency data is limited to 90-day ranges."`.

---

### 4. New Agent Types KPI Card

**Data source:** `useAgentAdoption()`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | static | — | `NEW AGENT TYPES` |
| Value | `current_month.new_count` | integer | `2` |
| Subtitle | `current_month.new_types` | comma-separated list | `security-scanner-v2, summarizer-v1` |

No delta row. The subtitle uses 11px secondary-color text.

**Subtitle logic:**

```typescript
if (new_count === 0) {
  subtitle = "None this month";
} else if (new_types.length <= 3) {
  subtitle = new_types.join(", ");
} else {
  subtitle = `${new_types.slice(0, 3).join(", ")} + ${new_types.length - 3} more`;
}
```

Fixed-window — not affected by date range selector.

---

### 5. Concurrency Chart

**Data source:** `useConcurrencyTimeseries(start, end)`

**Card title:** `CONCURRENCY OVER TIME`

Vertical bar chart with a horizontal dashed reference line. Chart height: `200px`.

**Bar rendering:** One bar per day showing `peak_concurrent`. Bar `max-width: 20px`,
`border-radius: 3px 3px 0 0`.

**Bar color logic** (when `concurrency_limit` is not null):

```typescript
function getBarColor(peak: number, limit: number): string {
  if (peak >= limit) return "var(--red)";
  if (peak >= limit * 0.9) return "var(--orange)";
  return "var(--accent)";
}
```

When `concurrency_limit` is `null`, all bars use `var(--accent)`.

**Reference line:** Horizontal dashed line at `concurrency_limit` (if not null):
- Style: `2px dashed var(--orange)`, `position: absolute`
- Right-aligned label: `"Limit: {limit}"`, `font-size: 11px`, `color: var(--orange)`

**Height calculation:**

```typescript
const maxValue = Math.max(
  ...daily.map(d => d.peak_concurrent),
  concurrency_limit ?? 0,  // ensure limit line is visible
);
// Each bar: height = (peak_concurrent / maxValue) * 100%
```

**X-axis labels:** Every 5th bar. Format: `"Feb 1"`, `"Feb 6"`. Style: `font-size: 9px`,
`color: var(--text2)`.

**90-day warning:** When `daysBetween(start, end) > 90`, render the card with title and an
inline warning message: `"Concurrency data is limited to 90-day ranges. Please select a shorter period."`.

---

### 6. Run Volume by Team Chart

**Data source:** `useRunVolumeByTeam(start, end)`

**Card title:** `RUN VOLUME BY TEAM`

Horizontal bar chart. One row per team.

**Row rendering:**

```
+---------------------------------------------------+
| Data Eng     [=============================] 5,102 |
| ML Infra     [========================]     4,210 |
| Platform     [==================]           3,847 |
+---------------------------------------------------+
```

Each row is a flex container: fixed-width label (team name, right-aligned), flex-grow bar
track, fixed-width count value.

**Bar styling:**
- Track: `height: 24px`, `background: var(--bg)`, `border-radius: 4px`
- Fill: `background: var(--accent)`, `border-radius: 4px`
- Fill width: `(run_count / maxRunCount) * 100%`

**Value format:** `formatCount(run_count)` — e.g., `5,102`.

Row spacing: `12px`. Teams are pre-sorted by `run_count` descending from the API.

---

### 7. Run Heatmap

**Data source:** `useRunHeatmap(start, end)`

**Card title:** `RUN ACTIVITY HEATMAP`

7 x 24 grid (rows = days of week, columns = hours of day).

**Grid layout:** CSS Grid with `grid-template-columns: 40px repeat(24, 1fr)`, `gap: 2px`.

**Row labels (left column):** `Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`.
Style: `font-size: 11px`, `color: var(--text2)`.

**Column labels (top row):** Every 3rd hour to reduce clutter: `0`, `3`, `6`, `9`, `12`, `15`,
`18`, `21`. Style: `font-size: 10px`, `color: var(--text2)`.

**Cell rendering:**

```typescript
const maxCount = Math.max(...cells.map(c => c.run_count));
const grid = new Map<string, number>();
cells.forEach(c => grid.set(`${c.day_of_week}-${c.hour_of_day}`, c.run_count));

// Per cell:
const count = grid.get(`${day}-${hour}`) ?? 0;
const opacity = 0.05 + (count / maxCount) * 0.95;
// style: background: var(--accent), opacity: {opacity}
```

Cell style: `aspect-ratio: 1`, `border-radius: 3px`, `min-height: 16px`.

**Tooltip:** `title="{dayName} {hour}:00 — {run_count} runs"`.

**90-day warning:** Same pattern as Concurrency Chart — show inline warning when range > 90 days.

---

### 8. Agent Adoption Chart

**Data source:** `useAgentAdoption()`

**Card title:** `AGENT TYPE ADOPTION (LAST 6 MONTHS)`

Vertical bar chart, one bar per month. Chart height: `200px`.

**Bar rendering:** Bar `max-width: 32px`, `border-radius: 4px 4px 0 0`, color `var(--accent)`.

**Height calculation:**

```typescript
const maxCount = Math.max(...months.map(m => m.new_count));
// Each bar: height = (new_count / maxCount) * 100%
```

**Value label:** Count displayed above each bar (e.g., `"1"`, `"3"`). `font-weight: 600`.

**X-axis labels:** Month abbreviation — `new Date(month + "-01").toLocaleDateString(undefined, { month: "short" })`. Style: `font-size: 10px`.

**Tooltip:** `title="{month}: {new_count} new ({new_types.join(', ')})"`.

Fixed-window — not affected by date range selector.

---

## Date Range Integration

### Range-scoped (re-fetch on date change)

| Widget | Query key |
|--------|-----------|
| Active Teams + Active Users KPIs | `["active-users", start, end]` |
| Peak Concurrency KPI + Concurrency Chart | `["concurrency-timeseries", start, end]` |
| Run Volume by Team | `["run-volume-by-team", start, end]` |
| Run Heatmap | `["run-heatmap", start, end]` |

### Fixed-window (not affected by date change)

| Widget | Query key |
|--------|-----------|
| New Agent Types KPI + Adoption Chart | `["agent-adoption"]` |

**90-day limit:** The `concurrency-timeseries` and `run-heatmap` queries use `enabled: false`
when the selected range exceeds 90 days. The Peak Concurrency KPI, Concurrency Chart, and Run
Heatmap show inline warnings while Active Teams KPI, Active Users KPI, Run Volume by Team, and
Agent Adoption continue to display data normally.