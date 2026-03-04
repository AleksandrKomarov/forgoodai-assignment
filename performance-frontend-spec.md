# Frontend Spec: Performance & Reliability View

## Overview

The Performance & Reliability view surfaces success/failure trends, latency percentiles, error
categorization, and failure hotspots. Route: `/performance`. The view makes **6 unique API calls
on mount**, with each widget rendering independently.

For API response schemas, see [api-reference.md](api-reference.md) endpoints 2, 10-15.
For shared styles and utilities, see [frontend-design-spec.md](frontend-design-spec.md).

---

## Component Tree

```
PerformanceView
  |
  +-- KpiRow                              (kpi-row)
  |     +-- SuccessRateKpiCard             data: useSuccessRate(start, end)
  |     +-- P50LatencyKpiCard              data: useLatencyKpi(start, end)  ← shared
  |     +-- P95LatencyKpiCard              data: useLatencyKpi(start, end)  ← shared
  |     +-- P99LatencyKpiCard              data: useLatencyKpi(start, end)  ← shared
  |
  +-- SuccessFailureChart                 (full-width card)
  |     data: useSuccessFailureTimeseries(start, end)
  |
  +-- MiddleRow                           (grid-2)
  |     +-- ErrorTaxonomyTreemap           data: useErrorTaxonomy(start, end)
  |     +-- LatencyDistributionChart       data: useLatencyDistribution(start, end)
  |
  +-- BottomRow                           (grid-2)
        +-- SlowestAgentsTable             data: useSlowestAgents(start, end, limit)
        +-- FailureHotspotsMatrix          data: useFailureHotspots(start, end)
```

**Shared data:** `useLatencyKpi()` feeds all three latency KPI cards. `useSuccessRate()` is the
same hook used by Executive Summary — TanStack Query deduplicates identical query keys.

---

## Layout

- **KPI row:** `.kpi-row` — 4 equal columns
- **Success/Failure chart:** full-width `card`
- **Middle row:** `.grid-2` — left: treemap, right: latency distribution
- **Bottom row:** `.grid-2` — left: slowest agents table, right: failure hotspots matrix

---

## Data Hooks

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

Same hook as Executive Summary. Reused here for the Success Rate KPI card.

---

### useLatencyKpi

```typescript
function useLatencyKpi(start: string, end: string) {
  return useQuery({
    queryKey: ["latency-kpi", start, end],
    queryFn: () => fetchWidget("latency-kpi", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ p50_ms, p95_ms, p99_ms, prior_p50_ms, prior_p95_ms, prior_p99_ms, delta_p50_ms, delta_p95_ms, delta_p99_ms }`

Feeds all three latency KPI cards. **Limited to 90-day range** — the endpoint returns 400 for
longer periods because it queries raw `AgentRuns`.

---

### useSuccessFailureTimeseries

```typescript
function useSuccessFailureTimeseries(start: string, end: string) {
  return useQuery({
    queryKey: ["success-failure-timeseries", start, end],
    queryFn: () => fetchWidget("success-failure-timeseries", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ daily: [{ date, completed, failed }] }`

---

### useErrorTaxonomy

```typescript
function useErrorTaxonomy(start: string, end: string) {
  return useQuery({
    queryKey: ["error-taxonomy", start, end],
    queryFn: () => fetchWidget("error-taxonomy", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ total_failures, errors: [{ error_code, count, pct }] }`

Returns `{ total_failures: 0, errors: [] }` when no failures exist.

---

### useLatencyDistribution

```typescript
function useLatencyDistribution(start: string, end: string) {
  return useQuery({
    queryKey: ["latency-distribution", start, end],
    queryFn: () => fetchWidget("latency-distribution", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ daily: [{ date, p50_ms, p95_ms, p99_ms }] }`

---

### useSlowestAgents

```typescript
function useSlowestAgents(start: string, end: string, limit: number = 10) {
  return useQuery({
    queryKey: ["slowest-agents", start, end, limit],
    queryFn: () => fetchWidget("slowest-agents", { start, end, limit: String(limit) }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ agents: [{ agent_type, avg_duration_ms, p95_duration_ms, run_count }] }`

Default limit: 10, max: 50.

---

### useFailureHotspots

```typescript
function useFailureHotspots(start: string, end: string) {
  return useQuery({
    queryKey: ["failure-hotspots", start, end],
    queryFn: () => fetchWidget("failure-hotspots", { start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ teams: [{ team_id, team_name }], cells: [{ agent_type, team_id, failure_rate_pct, failed, total }] }`

`teams` provides column headers. `cells` is a flat list pivoted into a matrix client-side.

---

## Widget Specifications

### 1. Success Rate KPI Card

**Data source:** `useSuccessRate(start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | static | — | `SUCCESS RATE` |
| Value | `rate_pct` | `formatPercent()` | `96.3%` |
| Delta | `delta_pp` | `±X.Xpp` | `+0.5pp` |

**Value color:** Always `var(--green)`.

**Delta color:** Rate increase = **green** (`.kpi-delta.up`), decrease = **red**.

---

### 2. p50 Latency KPI Card

**Data source:** `useLatencyKpi(start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | static | — | `P50 LATENCY` |
| Value | `p50_ms` | `formatDuration()` | `1.2s` |
| Delta | `delta_p50_ms` | `formatLatencyDelta()` | `-80ms` |

**Delta color:** Latency decrease = **green** (`.kpi-delta.up`), increase = **red** (`.kpi-delta.down`).

---

### 3. p95 Latency KPI Card

**Data source:** `useLatencyKpi(start, end)` (shared)

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | static | — | `P95 LATENCY` |
| Value | `p95_ms` | `formatDuration()` | `4.8s` |
| Delta | `delta_p95_ms` | `formatLatencyDelta()` | `+320ms` |

**Delta color:** Same as p50 — latency increase = **red**.

---

### 4. p99 Latency KPI Card

**Data source:** `useLatencyKpi(start, end)` (shared)

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | static | — | `P99 LATENCY` |
| Value | `p99_ms` | `formatDuration()` | `12.1s` |
| Delta | `delta_p99_ms` | `formatLatencyDelta()` | `+1.4s` |

**Delta color:** Same as p50 — latency increase = **red**.

---

### 5. Success / Failure Chart

**Data source:** `useSuccessFailureTimeseries(start, end)`

**Card title:** `SUCCESS / FAILURE RATES OVER TIME`

Stacked vertical bar chart. Chart height: `180px`. One bar per day.

**Bar rendering:** Each day is a vertical flex column with two segments:
- **Top (green):** completed runs. `border-radius: 3px 3px 0 0`.
- **Bottom (red):** failed runs. `border-radius: 0 0 3px 3px`. Minimum height: `2px` (ensures
  failures are always visible).

Bar `max-width: 18px`.

**Height calculation:**

```typescript
const maxRuns = Math.max(...daily.map(d => d.completed + d.failed));
// Each segment: height = (count / maxRuns) * 100%
```

**X-axis labels:** Every bar. Format: `"Feb 1"`, `"Feb 2"`, etc. Style: `font-size: 9px`,
`color: var(--text2)`.

**Legend:** Uses `.chart-legend` — `"Success"` (green square) and `"Failed"` (red square).

---

### 6. Error Taxonomy Treemap

**Data source:** `useErrorTaxonomy(start, end)`

**Card title:** `ERROR TAXONOMY`

CSS grid treemap showing failure categories. Height: `180px`.

**Grid layout:**

```css
.treemap {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  grid-template-rows: 2fr 1fr;
  gap: 4px;
  height: 180px;
}
```

The first cell (largest error) spans 2 rows (`grid-row: span 2`). Remaining cells fill the
2×2 right side.

**Cell styling:** `border-radius: 6px`, white text, centered content. Each cell shows:
`{ERROR_CODE}\n{pct}%`.

**Treemap colors:** Assigned by index (highest count → most prominent color):

| Index | Color |
|-------|-------|
| 0 | `#ef4444` (red) |
| 1 | `#f97316` (orange) |
| 2 | `#f59e0b` (amber) |
| 3 | `#fb923c` (light orange) |
| 4 | `#fbbf24` (yellow) |

**Empty state:** When `total_failures === 0`, show "No failures in selected period".

---

### 7. Latency Distribution Chart

**Data source:** `useLatencyDistribution(start, end)`

**Card title:** `LATENCY DISTRIBUTION (P50 / P95 / P99)`

Overlapping bar chart showing daily p50, p95, p99. Chart height: `140px`.

**Bar rendering:** Three overlapping bars per day, positioned absolutely within a relative
container. Each bar narrows progressively inward:

```typescript
// p99: widest (back), lightest
style = `left:0; right:0; height:${(p99/max)*100}%; background:rgba(67,97,238,0.18);`

// p95: middle width, medium opacity
style = `left:10%; right:10%; height:${(p95/max)*100}%; background:rgba(67,97,238,0.45);`

// p50: narrowest (front), solid
style = `left:20%; right:20%; height:${(p50/max)*100}%; background:#4361ee;`
```

All bars: `position: absolute; bottom: 0; border-radius: 4px 4px 0 0`.

Bar container: `max-width: 36px`.

**Height calculation:**

```typescript
const maxLatency = Math.max(...daily.map(d => d.p99_ms));
```

**X-axis labels:** Every 5th bar. Format: `"Feb 1"`, `"Feb 6"`, etc. Style: `font-size: 10px`,
`color: var(--text2)`.

**Legend:** `"p50"` (solid accent square), `"p95"` (medium opacity), `"p99"` (light opacity).

---

### 8. Slowest Agents Table

**Data source:** `useSlowestAgents(start, end, limit)`

**Card title:** `SLOWEST AGENTS (TOP 10 BY AVG DURATION)`

| Column | Source | Format |
|--------|--------|--------|
| Agent | `agent_type` | Plain text |
| Avg Duration | `avg_duration_ms` | `formatDuration()` → `18.4s` |
| Runs | `run_count` | `formatCount()` → `312` |

Default: top 10. Sorted by average duration descending (API returns pre-sorted).

---

### 9. Failure Hotspots Matrix

**Data source:** `useFailureHotspots(start, end)`

**Card title:** `FAILURE HOTSPOTS: AGENT TYPE X TEAM`

Matrix table with agent types as rows and teams as columns.

**Column headers:** From `teams[]` array (`team_name`). First column (row header) is blank.

**Row headers:** Unique `agent_type` values extracted from `cells[]`. Bold (`font-weight: 600`).

**Pivot logic:** The API returns a flat `cells[]` array. Client-side pivoting:

```typescript
const agentTypes = [...new Set(cells.map(c => c.agent_type))];
const matrix = agentTypes.map(agent => ({
  agent,
  values: teams.map(team => {
    const cell = cells.find(c => c.agent_type === agent && c.team_id === team.team_id);
    return cell ? cell.failure_rate_pct : null;
  }),
}));
```

**Cell rendering:** Color-coded `.tag` based on failure rate:

```typescript
function getFailureTag(rate: number | null): { className: string; label: string } {
  if (rate === null) return { className: "tag gray", label: "—" };
  if (rate < 2) return { className: "tag green", label: `${rate.toFixed(1)}%` };
  if (rate < 5) return { className: "tag gray", label: `${rate.toFixed(1)}%` };
  return { className: "tag red", label: `${rate.toFixed(1)}%` };
}
```

Thresholds: `<2%` = green (healthy), `2–5%` = gray (moderate), `>=5%` = red (concerning).

Cells with no runs for an agent-team combination (`null`) show `"—"` in a gray tag.

---

## Latency Delta Formatting

Latency deltas use a custom formatter (not in the shared design spec) since they display
as milliseconds or seconds depending on magnitude:

```typescript
function formatLatencyDelta(ms: number): string {
  const sign = ms > 0 ? "+" : "";
  if (Math.abs(ms) >= 1000) return `${sign}${(ms / 1000).toFixed(1)}s`;
  return `${sign}${ms}ms`;
}
```

Examples: `formatLatencyDelta(-80)` → `"-80ms"`, `formatLatencyDelta(1400)` → `"+1.4s"`.

**Delta class for latency:**

```typescript
function getLatencyDeltaClass(ms: number): string {
  if (ms === 0) return "";
  return ms < 0 ? "up" : "down";  // lower latency = good
}
```

---

## Date Range Integration

All widgets re-fetch when the date range changes:

| Widget | Query key |
|--------|-----------|
| Success Rate KPI | `["success-rate", start, end]` |
| Latency KPI (×3 cards) | `["latency-kpi", start, end]` |
| Success/Failure Chart | `["success-failure-timeseries", start, end]` |
| Error Taxonomy | `["error-taxonomy", start, end]` |
| Latency Distribution | `["latency-distribution", start, end]` |
| Slowest Agents | `["slowest-agents", start, end, limit]` |
| Failure Hotspots | `["failure-hotspots", start, end]` |

No fixed-window widgets on this view — all are range-scoped.

**90-day limit:** The `latency-kpi` endpoint returns 400 when the selected range exceeds 90 days.
The latency KPI cards should handle this gracefully — show the error state with a message
indicating the range limit.
