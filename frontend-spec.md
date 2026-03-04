# Frontend Spec: Agent Analytics Dashboard

## Overview

A React SPA that surfaces org-level analytics for a cloud agent platform. Five views — Executive
Summary, Cost Explorer, Performance & Reliability, Usage & Capacity, and Team Drill-Down — each
composed of independent widget components that fetch data in parallel.

For the API endpoint catalog, see [api-reference.md](api-reference.md).
For shared backend conventions (auth, validation, caching), see [backend-spec-common.md](backend-spec-common.md).

---

## Tech Stack & Hosting

| Layer | Choice |
|-------|--------|
| Language | TypeScript |
| Framework | React (client-side rendering, no SSR) |
| Hosting | Azure Static Web Apps |
| Auth | MSAL.js (Microsoft Authentication Library) |
| Server state | TanStack Query (React Query) |
| Charts | Recharts (or equivalent React charting library) |
| HTTP | Fetch/Axios with auth interceptor |
| Routing | TanStack Router |

---

## Authentication

MSAL.js handles the full auth lifecycle with Entra ID:

1. **App load:** attempt silent token acquisition from cache/session
2. **No session:** redirect to Entra ID login (authorization code flow + PKCE)
3. **Token acquired:** attach JWT to all API calls via `Authorization: Bearer {token}` header
4. **Token refresh:** MSAL handles silent renewal automatically

Configuration:

- Multi-tenant app registration (`signInAudience: AzureADMultipleOrgs`)
- Scopes: API access scope for the Analytics API app registration
- No role checks — all authenticated users see all views

---

## Layout

Fixed sidebar + header, matching the [wireframe](wireframe.html):

```
+--sidebar--+--header-----------------------------------+
|            |  View Title          [Date Range] [Avatar]|
| Nav links  +-------------------------------------------+
|            |                                           |
|            |  View content area                        |
|            |  (widgets render here)                    |
|            |                                           |
+--footer----+-------------------------------------------+
  Tenant name
```

### Sidebar

Five navigation links, one per view:
1. Executive Summary (default landing)
2. Cost Explorer
3. Performance & Reliability
4. Usage & Capacity
5. Team Drill-Down

Footer shows tenant name (from JWT `tid` claim, resolved via Graph API).

### Header

- **View title:** updates on navigation
- **Date range selector:** dropdown with presets (Last 7 days, Last 30 days, Last 90 days,
  This month, Custom range)
- **User avatar:** initials from JWT `name` claim

### Routing

One route per view. Executive Summary is the default (`/`).

---

## Global State

Only two pieces of UI state are shared; server state is managed by TanStack Query.

### Date Range

Shared across all views. Stored as `{ start: "YYYY-MM-DD", end: "YYYY-MM-DD" }`.

Presets compute `start` and `end` at selection time:
- Last 7 days: `end = today`, `start = today - 6d`
- Last 30 days: `end = today`, `start = today - 29d`
- Last 90 days: `end = today`, `start = today - 89d`
- This month: `start = first of month`, `end = today`
- Custom: user picks both dates (earliest start: 2 years ago, latest: today, max span: 365 days).
  Both inputs allow free selection within the absolute bounds. Inline validation errors appear
  for invalid ranges (missing date, end before start, span > 365 days). Invalid ranges are not
  propagated — widgets keep the last valid range until corrected.

Changing the date range updates query keys, which triggers automatic re-fetch for all mounted
range-scoped queries. Fixed-window endpoints (`monthly-spend`, `agent-adoption`,
`budget-forecast`) have keys without date range, so they are unaffected.

### Selected Team

Used only by Team Drill-Down. Defaults to the first team returned by `team-list`. Changing the
team updates query keys for `team-summary`, `team-top-agents`, and `team-user-activity`,
triggering automatic re-fetch.

---

## API Integration (TanStack Query)

### Server State Management

TanStack Query manages all server state — fetching, caching, re-fetching, and error handling.
No manual loading/error state management in components.

Each widget calls a query hook that returns `{ data, isLoading, isError, error }`. Widgets
render independently — a slow or failed query doesn't block sibling widgets.

### Query Key Structure

Query keys encode the endpoint name plus all parameters that affect the response:

| Endpoint | Query Key |
|----------|-----------|
| Range-scoped | `["widget-name", start, end]` |
| Range + params | `["widget-name", start, end, ...params]` |
| Team-scoped | `["widget-name", teamId, start, end]` |
| Fixed-window | `["widget-name"]` |

Examples:
- `["success-rate", "2025-02-01", "2025-03-01"]`
- `["daily-spend", "2025-02-01", "2025-03-01", "team", "daily"]`
- `["team-summary", "a1b2c3d4-...", "2025-02-01", "2025-03-01"]`
- `["monthly-spend"]`

When date range or team selection changes, the new key triggers an automatic fetch. Previous
data stays cached and is returned instantly if the user switches back.

### Stale Time & Cache

| Category | `staleTime` | Rationale |
|----------|-------------|-----------|
| Real-time widgets (60s backend TTL) | 30 seconds | Re-fetch on refocus/remount after 30s |
| Trend data (5min backend TTL) | 2 minutes | Slow-moving data, less aggressive refresh |
| Team list | 5 minutes | Rarely changes |

`gcTime` (garbage collection): 10 minutes for all queries — keeps data in memory for quick
back-navigation between views.

### HTTP Client

- Base URL from environment config (e.g., `REACT_APP_API_BASE_URL`)
- All calls go through `/api/v1/widgets/{endpoint}`
- Auth interceptor attaches JWT on every request
- Standard error handling: 401 triggers re-auth, 4xx/5xx surfaced via query `error` state

### Automatic Re-fetch

| Trigger | Mechanism |
|---------|-----------|
| Date range change | Query key changes → automatic fetch |
| Team selection change | Query key changes → automatic fetch |
| View navigation | Queries mount → fetch if stale or uncached |
| Filter change (Cost Explorer) | Query key changes → automatic fetch |
| Window refocus | `refetchOnWindowFocus` (default TanStack Query behavior) |

Background re-fetches show stale data while loading (no loading spinner for refocuses).

---

## Widget State Machine

TanStack Query provides `isLoading`, `isError`, `data`, and `isRefetching` flags.
Every widget maps these to the same visual states:

| State | TanStack Query condition | Display |
|-------|--------------------------|---------|
| **Loading** | `isLoading` (no cached data) | Skeleton placeholder |
| **Refreshing** | `isRefetching` (has cached data) | Show stale data, no spinner |
| **Success** | `data` present | Rendered chart, table, or KPI card |
| **Error** | `isError` | Inline error message with retry button |
| **Empty** | `data` present but zero/empty | "No data for selected period" |

---

## View Hierarchies & API Mapping

### Executive Summary

Default landing page. 5 API calls on mount.

| Widget | API Endpoint | Chart Type |
|--------|-------------|------------|
| Accumulated Spend KPI | `spend-kpi` | KPI card |
| Total Runs KPI | `run-volume` | KPI card (total + delta from response) |
| Success Rate KPI | `success-rate` | KPI card |
| Projected Month-End KPI | `budget-forecast` | KPI card |
| Monthly Spend Chart | `monthly-spend` | Vertical bar (12 actual + 3 forecast with dashed border) |
| Success Rate Gauge | `success-rate` | SVG arc gauge |
| Run Volume Sparkline | `run-volume` | Sparkline (daily bars, no axes) |
| Top 3 Cost Centers | `top-cost-centers` | Table with inline bar chart |

Layout: 4-column KPI row, then 2:1 grid (spend chart left, gauge + sparkline right), then
full-width cost centers table.

---

### Cost Explorer

Filter bar at top. 5 API calls on mount.

| Widget | API Endpoint | Chart Type |
|--------|-------------|------------|
| Filter bar | — | Dropdowns: dimension (Team/Agent Type), granularity (Daily/Weekly/Monthly) |
| Daily Spend Chart | `daily-spend` | Stacked bar (one series per dimension value) |
| Spend Breakdown | `spend-breakdown` | Donut chart with center total |
| Forecast Card | `budget-forecast` | Value + progress bar (gradient fill when over budget) |
| Burn Rate Card | `budget-forecast` | Value + context (% consumed vs. % through month) |
| Per-Team Cost Summary | `team-cost-summary` | Table with delta tags + share bars |

Layout: filter bar, full-width spend chart, then 1:1 grid (donut left, forecast + burn
rate stacked right), then full-width table.

Changing dimension or granularity re-fetches `daily-spend` only.

---

### Performance & Reliability

7 API calls on mount.

| Widget | API Endpoint | Chart Type |
|--------|-------------|------------|
| Success Rate KPI | `success-rate` | KPI card |
| p50 Latency KPI | `latency-kpi` | KPI card |
| p95 Latency KPI | `latency-kpi` | KPI card |
| p99 Latency KPI | `latency-kpi` | KPI card |
| Success/Failure Chart | `success-failure-timeseries` | Stacked bar (green success, red failed) |
| Error Taxonomy | `error-taxonomy` | Treemap (proportional blocks, color-coded) |
| Latency Distribution | `latency-distribution` | Overlapping bars (p99 back/lightest, p50 front/darkest) |
| Slowest Agents | `slowest-agents` | Table |
| Failure Hotspots | `failure-hotspots` | Table as matrix (agent rows x team columns, color-coded rates) |

Layout: 4-column KPI row, full-width success/failure chart, 1:1 grid (treemap + latency),
1:1 grid (slowest agents table + failure hotspots matrix).

**90-day limit:** The `latency-kpi` endpoint requires ≤ 90-day range. When the selected range
exceeds 90 days, the latency KPI cards show an inline warning instead of data.

---

### Usage & Capacity

6 API calls on mount.

| Widget | API Endpoint | Chart Type |
|--------|-------------|------------|
| Active Teams KPI | `active-users` | KPI card (shows `active_teams` of `total_teams`) |
| Active Users KPI | `active-users` | KPI card (with delta) |
| Peak Concurrency KPI | `concurrency-timeseries` | KPI card (`peak_in_period`, limit as subtitle) |
| New Agent Types KPI | `agent-adoption` | KPI card (current month count + type names) |
| Concurrency Chart | `concurrency-timeseries` | Vertical bar with horizontal dashed line at limit |
| Run Volume by Team | `run-volume-by-team` | Horizontal bar chart |
| Run Heatmap | `run-heatmap` | Grid (7 rows x 24 cols, opacity-mapped cells) |
| Agent Adoption Chart | `agent-adoption` | Vertical bar (one bar per month) |

Layout: 4-column KPI row, full-width concurrency chart, 1:1 grid (run volume by team +
heatmap), full-width adoption chart.

**90-day limit:** The `concurrency-timeseries` and `run-heatmap` endpoints require ≤ 90-day range
(hourly-granularity data). When the selected range exceeds 90 days, these widgets show an inline
warning instead of data.

---

### Team Drill-Down

4 API calls on mount (team-list once, then 3 team-scoped calls).

| Widget | API Endpoint | Chart Type |
|--------|-------------|------------|
| Team Selector | `team-list` | Pill navigation (horizontal button group) |
| Team Runs KPI | `team-summary` | KPI card |
| Team Spend KPI | `team-summary` | KPI card |
| Success Rate KPI | `team-summary` | KPI card |
| Active Users KPI | `team-summary` | KPI card |
| Top Agents | `team-top-agents` | Table (agent, runs, success rate tag, avg duration, spend) |
| User Activity | `team-user-activity` | Table (user name, runs, last active relative, success rate tag) |

Layout: pill nav, 4-column KPI row, 1:1 grid (top agents table + user activity table).

`team-list` is fetched once and not re-fetched on date range change (teams don't depend on
date range). Team-scoped endpoints re-fetch on both team selection and date range change.

---

## Charting Strategy

| Chart Type | Instances | Notes |
|------------|-----------|-------|
| Vertical bar | Monthly Spend, Agent Adoption, Concurrency | Forecast bars: dashed border, reduced opacity |
| Stacked bar | Daily Spend, Success/Failure | Color-coded series with legend |
| Horizontal bar | Run Volume by Team | Labels left, values right |
| Donut | Spend Breakdown | Center label shows total |
| Treemap | Error Taxonomy | Proportional rectangles, labeled with code + percentage |
| Heatmap | Runs by hour/day | 7x24 grid, color intensity maps to run count |
| Gauge | Success Rate | SVG arc (green fill proportional to rate) |
| Sparkline | Run Volume (Executive) | Minimal bars, no axes or labels |
| Overlapping bars | Latency Distribution | Three bars per day layered back-to-front |
| Progress bar | Budget Burn Rate | Linear bar, gradient to red when over 100% |

---

## Design Tokens

See [frontend-design-spec.md](frontend-design-spec.md) for design tokens, component appearance,
and delta color rules.

---

## Formatting Utilities

Implemented in `formatters.ts`. See
[requirements-spec.md — Display Formatting](requirements-spec.md#display-formatting) for the
format rules these implement.

| Function | Purpose | Example |
|----------|---------|---------|
| `formatCurrencyCompact` | Abbreviated currency for KPIs | `$47.2K`, `$1.2M` |
| `formatCurrencyFull` | Full currency with locale-aware thousands separator | `$21,340` |
| `formatCurrencyPrecise` | Two-decimal currency for per-unit costs | `$5.07` |
| `formatPercent` | Percentage with one decimal | `96.3%` |
| `formatCount` | Integer with locale-aware thousands separator | `12,847` |
| `formatSignedPercent` | Signed percentage for deltas | `+8.3%`, `-2.1%` |
| `formatDuration` | Duration from ms to seconds | `4.2s` |
| `formatRelativeTime` | Relative timestamp | `2 hours ago` |
| `getDeltaClass` | Maps delta + metric type to `"up"` / `"down"` CSS class | see delta color rules |
