# Frontend Design Spec: Shared Styles & Utilities

All CSS component styles, layout primitives, formatting functions, the widget state machine,
and the HTTP client used across every view.

---

## Design Tokens

```css
:root {
  --bg: #f5f6fa;
  --surface: #fff;
  --border: #e2e5ec;
  --text: #1a1d23;
  --text2: #5f6577;
  --accent: #4361ee;
  --accent-light: #eef1ff;
  --green: #22c55e;
  --red: #ef4444;
  --orange: #f59e0b;
  --sidebar-w: 220px;
  --header-h: 56px;
}
```

Additional hardcoded colors used in specific charts:

| Color | Hex | Usage |
|-------|-----|-------|
| Purple | `#8b5cf6` | Donut chart — Egress segment |
| Gray | `#94a3b8` | Donut chart — Other segment |

---

## Typography

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: var(--text);
  background: var(--bg);
}
```

---

## Layout Primitives

### Content Area

```css
.main {
  margin-left: var(--sidebar-w);
  margin-top: var(--header-h);
  padding: 24px;
}
```

### KPI Row (4-column)

```css
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
```

### 2:1 Grid

```css
.grid-2-1 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
```

### 1:1 Grid

```css
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
```

---

## Component Styles

### Card

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
}
.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
}
```

### KPI Card

```css
.kpi {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 18px 20px;
}
.kpi-label {
  font-size: 12px;
  color: var(--text2);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.kpi-value {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -1px;
}
.kpi-delta {
  font-size: 12px;
  margin-top: 4px;
}
.kpi-delta.up { color: var(--green); }
.kpi-delta.down { color: var(--red); }
```

### Table

```css
.wtable { width: 100%; border-collapse: collapse; font-size: 13px; }
.wtable th {
  text-align: left; padding: 10px 12px;
  border-bottom: 2px solid var(--border);
  font-weight: 600; color: var(--text2);
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px;
}
.wtable td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
.wtable tr:last-child td { border-bottom: none; }
.wtable tr:hover td { background: var(--accent-light); }
```

### Inline Bar

```css
.bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar {
  height: 8px;
  border-radius: 4px;
  background: var(--accent);
}
```

### Tag (delta badge)

```css
.tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
.tag.green { background: #dcfce7; color: #166534; }
.tag.red { background: #fee2e2; color: #991b1b; }
.tag.gray { background: #f1f5f9; color: #475569; }
```

### Gauge (SVG Arc)

```css
.gauge {
  width: 120px;
  height: 120px;
  position: relative;
  margin: 0 auto;
}
.gauge svg { transform: rotate(-90deg); }
.gauge-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.gauge-label .val { font-size: 24px; font-weight: 700; }
.gauge-label .sub { font-size: 11px; color: var(--text2); }
```

### Sparkline

```css
.sparkline {
  display: flex;
  align-items: stretch;
  gap: 2px;
  height: 40px;
}
.sparkline .sp-bar {
  flex: 1;
  border-radius: 2px 2px 0 0;
  background: var(--accent);
  opacity: 0.7;
  align-self: flex-end;
}
```

### Filter Bar

```css
.filter-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.filter-bar select {
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  background: var(--surface);
}
.filter-bar .label {
  font-size: 12px;
  color: var(--text2);
  font-weight: 500;
}
```

### Progress Bar

```css
.progress-track {
  margin-top: 10px;
  height: 10px;
  background: var(--border);
  border-radius: 5px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s;
}
```

### Large Value Card

Used by Forecast and Burn Rate cards.

```css
.large-value {
  font-size: 32px;
  font-weight: 700;
  margin: 12px 0;
}
.large-value-subtitle {
  font-size: 13px;
  color: var(--text2);
}
.large-value-context {
  font-size: 12px;
  color: var(--text2);
  margin-top: 4px;
}
```

### Donut Container

```css
.donut-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 24px 16px;
}
```

### Chart Legend

```css
.chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 10px;
  font-size: 11px;
  color: var(--text2);
}
.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 4px;
}
```

### Avatar

```css
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}
```

### Sidebar Footer

```css
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #2a2d35;
  font-size: 12px;
  color: #5f6577;
}
```

---

## Chart Color Palette

Series colors assigned by index for stacked/grouped charts:

| Index | Color | CSS variable |
|-------|-------|-------------|
| 0 | `#4361ee` | `var(--accent)` |
| 1 | `#22c55e` | `var(--green)` |
| 2 | `#f59e0b` | `var(--orange)` |
| 3 | `#8b5cf6` | — (purple) |
| 4 | `#94a3b8` | — (gray) |

Cost driver color mapping (donut chart):

| Driver | Color |
|--------|-------|
| `tokens` | `#4361ee` (accent) |
| `compute` | `#22c55e` (green) |
| `storage` | `#f59e0b` (orange) |
| `egress` | `#8b5cf6` (purple) |
| `other` | `#94a3b8` (gray) |

---

## Formatting Utilities

Implement in a shared `utils/formatters.ts` module.

### formatCurrencyCompact

Compact currency for KPI values and chart labels.

```typescript
function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}
// formatCurrencyCompact(47200) → "$47.2K"
// formatCurrencyCompact(1234567) → "$1.2M"
```

### formatCurrencyFull

Full currency with thousands separator for table cells.

```typescript
function formatCurrencyFull(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}
// formatCurrencyFull(21340) → "$21,340"
```

### formatCurrencyPrecise

Two-decimal currency for per-unit costs.

```typescript
function formatCurrencyPrecise(value: number): string {
  return `$${value.toFixed(2)}`;
}
// formatCurrencyPrecise(5.07) → "$5.07"
```

### formatPercent

Percentage with one decimal place.

```typescript
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
// formatPercent(96.3) → "96.3%"
```

### formatCount

Integer with thousands separator.

```typescript
function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
// formatCount(12847) → "12,847"
```

### formatSignedPercent

Signed percentage for delta display.

```typescript
function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
// formatSignedPercent(8.3) → "+8.3%"
// formatSignedPercent(-2.1) → "-2.1%"
```

### formatDuration

Duration in seconds with one decimal.

```typescript
function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}
// formatDuration(4200) → "4.2s"
```

### formatRelativeTime

Relative timestamp for "last active" fields.

```typescript
function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
```

### Delta Color Rules

| Metric type | Positive delta | Negative delta |
|-------------|---------------|----------------|
| Cost / spend | red (up = bad) | green (down = good) |
| Success rate | green (up = good) | red (down = bad) |
| Run count | green (up = good) | red (down = bad) |
| Latency | red (up = bad) | green (down = good) |
| Over budget | red (bad) | green (good) |

CSS classes: `.kpi-delta.up` = green (good), `.kpi-delta.down` = red (bad).

**Important:** "up"/"down" refer to good/bad, NOT numeric direction. A cost increase is
numerically positive but semantically bad, so it gets `.kpi-delta.down` (red).

```typescript
function getDeltaClass(value: number, type: "cost" | "rate" | "count"): string {
  if (value === 0) return "";
  const isPositive = value > 0;
  const isGood = type === "cost" ? !isPositive : isPositive;
  return isGood ? "up" : "down";
}
```

---

## Widget State Machine

Every widget maps TanStack Query flags to the same visual states:

| State | TanStack Query condition | Display |
|-------|--------------------------|---------|
| **Loading** | `isLoading` (no cached data) | Skeleton placeholder matching widget dimensions |
| **Refreshing** | `isRefetching` (has cached data) | Show stale data, no spinner |
| **Success** | `data` present | Rendered chart, table, or KPI card |
| **Error** | `isError` | Inline error message with retry button |
| **Empty** | `data` present but zero/empty | "No data for selected period" |

### Loading

Skeleton placeholder matching the widget's dimensions:
- KPI cards: gray pulsing rectangles for value and delta lines
- Charts: gray pulsing rectangle matching chart height
- Tables: gray pulsing rows

### Error

```html
<div class="widget-error">
  <p>Failed to load data</p>
  <button onclick="refetch()">Retry</button>
</div>
```

The retry button calls the query's `refetch()`. Other widgets continue independently.

### Refreshing

Background re-fetch while stale data exists. Show stale data as-is — no spinner. The UI
updates seamlessly when fresh data arrives.

