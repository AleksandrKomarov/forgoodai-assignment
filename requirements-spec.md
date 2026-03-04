# Functional Requirements: Agent Analytics Dashboard

## Overview

An org-level analytics dashboard for a cloud agent platform. Provides visibility into cost,
performance, usage, and team-level activity across the organization. Serves engineering leads,
platform teams, finance/FinOps, and executives through a single interface.

---

## Dashboard-Wide Requirements

### Authentication & Access

- Users authenticate via Microsoft Entra ID (Azure AD)
- Multi-tenant: each organization sees only its own data
- All authenticated users can access all views — no role-based restrictions

### Navigation

Five views accessible via a persistent sidebar:

1. Executive Summary (default landing page)
2. Cost Explorer
3. Performance & Reliability
4. Usage & Capacity
5. Team Drill-Down

Sidebar footer displays the tenant (organization) name.

### Date Range Selection

- A global date range selector in the header applies to all views
- Presets: Last 7 days, Last 30 days, Last 90 days, This month, Custom range
- Custom range: user picks start and end dates; earliest start is 2 years ago, end cannot
  exceed today, max span is 365 days (backend limit). Inline validation errors are shown for
  invalid ranges; invalid ranges are not propagated to widgets
- Changing the date range refreshes all date-dependent widgets across the current view
- Some widgets have fixed windows (e.g., "last 12 months", "last 6 months") and are
  not affected by the date range selector
- Some widgets are limited to 90-day ranges (latency KPIs, concurrency chart, run heatmap).
  These show an inline warning when the selected range exceeds 90 days

### Prior-Period Comparison

- All KPI cards with deltas automatically compare against a prior period of equal length
- Example: if the selected range is Feb 1–Mar 1 (28 days), the prior period is
  Jan 3–Jan 31 (28 days)
- Deltas are shown as percentage change for counts/amounts, or percentage-point change
  for rates

### Per-Widget Independence

- Each widget on a view loads independently
- A slow or failed widget does not block other widgets from rendering
- Failed widgets show an inline error with a retry option
- Widgets with no data show a zero-value state ("No data for selected period")

### Display Formatting

| Data type | Format | Examples |
|-----------|--------|---------|
| Currency (large) | Abbreviated with K suffix | $47.2K |
| Currency (table) | Full with locale-aware thousands separator | $21,340 |
| Percentage | One decimal place | 96.3% |
| Duration | Seconds with one decimal | 4.2s, 18.4s |
| Delta (cost/runs) | Signed percentage, color-coded | +8.3% (green), -3.0% (red) |
| Delta (rates) | Percentage points | +0.5pp, -1.2pp |
| Timestamp (relative) | Human-readable | 2 hours ago, 1 day ago |
| Count | Locale-aware thousands separator | 12,847 |

Delta color coding:
- Cost/spend: increase = red (bad), decrease = green (good)
- Success rate: increase = green (good), decrease = red (bad)
- Run count: increase = green (higher adoption)
- Latency: increase = red (slower), decrease = green (faster)

---

## 1. Executive Summary

Default landing page. High-level KPIs, spend trends, and top cost centers.

### KPI Cards (row of 4)

| KPI | Value | Delta |
|-----|-------|-------|
| Accumulated Spend | Total spend for selected period | % change vs prior period |
| Total Runs | Total completed + failed runs | % change vs prior period |
| Success Rate | Completed / total runs | Percentage-point change vs prior period |
| Projected Month-End | Forecasted total spend for current month | Over/under budget amount |

### Monthly Spend Chart

- Vertical bar chart showing 12 months of actual spend + 3 months of forecast
- Forecast bars are visually distinct (dashed border, reduced opacity)
- Forecast is a linear projection based on the average of the last 3 complete months
- Not affected by the date range selector — always shows the same 15-month window

### Success Rate Gauge

- Circular gauge (SVG arc) showing the overall success rate for the selected period
- Label shows the percentage value and "{days}-day avg" reflecting the selected date range

### Run Volume Sparkline

- Minimal bar chart showing daily run counts for the selected period
- No axes or labels — provides at-a-glance trend context

### Top 3 Cost Centers Table

| Column | Description |
|--------|-------------|
| Team | Team name |
| Spend | Total spend for the period |
| Runs | Total runs for the period |
| Avg Cost/Run | Spend / runs |
| Share | Inline bar + percentage showing relative spend share |

---

## 2. Cost Explorer

Detailed cost analysis with dimension filtering, forecasting, and budget tracking.

### Filter Bar

- **Dimension:** Team or Agent Type — controls how the spend chart is broken down
- **Granularity:** Daily, Weekly, or Monthly — controls the time bucket size

Changing filters refreshes only the spend time-series chart.

### Daily Spend Chart

- Stacked bar chart showing spend over time
- One color-coded series per dimension value (e.g., one per team or one per agent type)
- Time buckets match the selected granularity
- Legend identifies each series

### Spend Breakdown (Donut Chart)

- Donut chart showing spend split by cost driver
- Cost drivers: Tokens, Compute, Storage, Egress
- Center label shows total spend
- Each segment shows driver name, percentage, and dollar amount

### Forecasted Month-End Spend

- Projected total spend for the current month (based on daily run rate)
- Budget amount for context
- Progress bar showing projected spend vs budget (gradient to red when over 100%)
- Shows over/under budget amount
- Not affected by date range selector — always calculates for the current month

### Budget Burn Rate

- Percentage of monthly budget consumed so far
- Percentage of month elapsed (for comparison)
- Not affected by date range selector — always calculates for the current month

### Per-Team Cost Summary Table

| Column | Description |
|--------|-------------|
| Team | Team name |
| Spend | Total spend for the period |
| Runs | Total runs for the period |
| Avg $/Run | Spend / runs |
| vs Prior Period | Delta percentage, color-coded tag |
| Share | Percentage of total spend, with inline bar |

Shows all teams (not just top 3), sorted by spend descending.

---

## 3. Performance & Reliability

Success/failure trends, latency analysis, error categorization, and failure hotspots.

### KPI Cards (row of 4)

| KPI | Value | Delta |
|-----|-------|-------|
| Success Rate | Completed / total runs | Percentage-point change vs prior period |
| p50 Latency | Median run duration | Millisecond change vs prior period |
| p95 Latency | 95th percentile run duration | Millisecond change vs prior period |
| p99 Latency | 99th percentile run duration | Millisecond change vs prior period |

Latency percentiles are computed from raw run data (not rollups) for accuracy.
Limited to 90-day range — shows an inline warning when the selected range exceeds 90 days.

### Success / Failure Chart

- Stacked bar chart with daily bars
- Green portion: completed runs
- Red portion: failed runs
- Tooltip shows counts and failure rate per day

### Error Taxonomy (Treemap)

- Treemap visualization of failure categories
- Categories: CONTEXT_LIMIT_EXCEEDED, TIMEOUT, OOM, LOGIC_ERROR, INFRA_FAULT, etc.
- Size proportional to occurrence count
- Each block labeled with error code and percentage of total failures

### Latency Distribution Chart

- Daily chart showing p50, p95, and p99 latency over time
- Overlapping bars: p99 tallest/lightest, p95 middle, p50 shortest/darkest
- Provides trend visibility for latency degradation

### Slowest Agents Table

| Column | Description |
|--------|-------------|
| Agent | Agent type name |
| Avg Duration | Average run duration |
| Runs | Total runs in period |

Default: top 10, configurable up to 50. Sorted by average duration descending.

### Failure Hotspots (Matrix Table)

- Matrix with agent types as rows and teams as columns
- Each cell shows the failure rate for that agent-team combination
- Color-coded: green (low failure rate), red (high failure rate)
- Helps identify specific agent-team combinations with reliability issues

---

## 4. Usage & Capacity

Adoption metrics, concurrency monitoring, run distribution, and agent type trends.

### KPI Cards (row of 4)

| KPI | Value | Delta |
|-----|-------|-------|
| Active Teams | Count of teams with at least one run | Shown as "X of Y total" |
| Active Users | Distinct users with at least one run | Count change vs prior period |
| Peak Concurrency | Maximum simultaneous runs in the period | Tenant limit shown as subtitle |
| New Agent Types | Count of agent types first seen this month | Type names listed as subtitle |

### Concurrency Over Time Chart

- Vertical bar chart showing daily peak concurrent runs
- Horizontal dashed line indicating the tenant's concurrency limit
- Bars that exceed or approach the limit are visually highlighted
- Helps identify capacity pressure and burst patterns

Limited to 90-day range — shows an inline warning when the selected range exceeds 90 days
(uses hourly-granularity data).

### Run Volume by Team

- Horizontal bar chart ranking teams by total run count
- Label on left (team name), value on right (count)
- Bar length proportional to the highest team

### Run Heatmap

- 7 × 24 grid (rows = days of week, columns = hours of day)
- Cell color intensity maps to run count
- Shows when runs cluster — useful for capacity planning and identifying peak hours

Limited to 90-day range — shows an inline warning when the selected range exceeds 90 days
(uses hourly-granularity data).

### Agent Type Adoption Chart

- Vertical bar chart showing new agent types introduced per month
- Covers the last 6 months
- Not affected by date range selector — always shows the same 6-month window

---

## 5. Team Drill-Down

Per-team detail view with team-scoped KPIs, agent breakdown, and user activity.

### Team Selector

- Horizontal pill navigation showing all teams in the tenant
- First team selected by default
- Selecting a team refreshes all widgets below with that team's data
- Team list is not affected by date range — always shows all teams

### KPI Cards (row of 4)

| KPI | Value | Delta |
|-----|-------|-------|
| Team Runs | Total runs for the selected team | % change vs prior period |
| Team Spend | Total spend for the selected team | % change vs prior period |
| Success Rate | Completed / total runs for the team | Percentage-point change |
| Active Users | Distinct users with runs in the team | Count change vs prior period |

### Top Agents Table

| Column | Description |
|--------|-------------|
| Agent | Agent type name |
| Runs | Total runs by this agent type within the team |
| Success | Success rate, shown as color-coded tag |
| Avg Duration | Average run duration |
| Spend | Total spend for this agent type within the team |

Default: top 10 agents, configurable up to 50. Sorted by run count descending.

### User Activity Table

| Column | Description |
|--------|-------------|
| User | Display name |
| Runs | Total runs by this user within the team |
| Last Active | Most recent run, shown as relative time |
| Success | Success rate, shown as color-coded tag |

Shows all users in the team with activity in the selected period. Sorted by run count descending.
