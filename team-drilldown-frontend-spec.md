# Frontend Spec: Team Drill-Down View

## Overview

The Team Drill-Down view provides per-team detail with team-scoped KPIs, agent breakdown, and
user activity. Route: `/team`. The view makes **4 API calls on mount** (`team-list` once, then
3 team-scoped calls), with each widget rendering independently.

For API response schemas, see [api-reference.md](api-reference.md) endpoints 21-24.
For shared styles and utilities, see [frontend-design-spec.md](frontend-design-spec.md).

---

## Component Tree

```
TeamDrillDownView
  |
  +-- TeamSelector                        (pill navigation)
  |     data: useTeamList()
  |
  +-- KpiRow                              (kpi-row)
  |     +-- TeamRunsKpiCard                data: useTeamSummary(teamId, start, end)  <- shared
  |     +-- TeamSpendKpiCard               data: useTeamSummary(teamId, start, end)  <- shared
  |     +-- SuccessRateKpiCard             data: useTeamSummary(teamId, start, end)  <- shared
  |     +-- ActiveUsersKpiCard             data: useTeamSummary(teamId, start, end)  <- shared
  |
  +-- BottomRow                          (grid-2)
        +-- TopAgentsTable                 data: useTeamTopAgents(teamId, start, end)
        +-- UserActivityTable              data: useTeamUserActivity(teamId, start, end)
```

**Shared data:** `useTeamSummary()` feeds all four KPI cards. TanStack Query deduplicates
identical query keys.

---

## Layout

- **Team selector:** `.pill-nav` — full-width horizontal button group
- **KPI row:** `.kpi-row` — 4 equal columns
- **Bottom row:** `.grid-2` — left: top agents table, right: user activity table

---

## Local State

```typescript
const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
```

Initialized to the first team's `team_id` once `useTeamList` returns data. Changing the
selected team updates query keys for `team-summary`, `team-top-agents`, and
`team-user-activity`, triggering automatic re-fetch.

---

## Data Hooks

### useTeamList

```typescript
function useTeamList() {
  return useQuery({
    queryKey: ["team-list"],
    queryFn: () => fetchWidget("team-list"),
    staleTime: 300_000,
    gcTime: 600_000,
  });
}
```

**Returns:** `{ teams: [{ team_id, team_name }] }`

Fixed-window — not affected by date range or team selection changes. Fetched once and cached
for 5 minutes. The first team in the list is selected by default.

---

### useTeamSummary

```typescript
function useTeamSummary(teamId: string, start: string, end: string) {
  return useQuery({
    queryKey: ["team-summary", teamId, start, end],
    queryFn: () => fetchWidget("team-summary", { team_id: teamId, start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
    enabled: !!teamId,
  });
}
```

**Returns:** `{ team_id, team_name, runs: { total, prior_total, delta_pct }, spend: { spend_usd, prior_spend_usd, delta_pct }, success_rate: { rate_pct, prior_rate_pct, delta_pp }, active_users: { count, prior_count, delta } }`

Feeds all four KPI cards. Re-fetches on both team selection and date range change.

---

### useTeamTopAgents

```typescript
function useTeamTopAgents(teamId: string, start: string, end: string, limit: number = 10) {
  return useQuery({
    queryKey: ["team-top-agents", teamId, start, end, limit],
    queryFn: () =>
      fetchWidget("team-top-agents", { team_id: teamId, start, end, limit: String(limit) }),
    staleTime: 30_000,
    gcTime: 600_000,
    enabled: !!teamId,
  });
}
```

**Returns:** `{ team_id, team_name, agents: [{ agent_type, run_count, success_rate_pct, avg_duration_ms, spend_usd }] }`

Default limit: 10, max: 50.

---

### useTeamUserActivity

```typescript
function useTeamUserActivity(teamId: string, start: string, end: string) {
  return useQuery({
    queryKey: ["team-user-activity", teamId, start, end],
    queryFn: () =>
      fetchWidget("team-user-activity", { team_id: teamId, start, end }),
    staleTime: 30_000,
    gcTime: 600_000,
    enabled: !!teamId,
  });
}
```

**Returns:** `{ team_id, team_name, users: [{ user_id, user_name, run_count, last_active, success_rate_pct }] }`

`last_active` is an ISO 8601 timestamp.

---

## Widget Specifications

### 1. Team Selector

**Data source:** `useTeamList()`

Horizontal pill navigation (button group). One pill per team.

```html
<div class="pill-nav">
  {teams.map(team => (
    <button
      class={team.team_id === selectedTeamId ? "pill active" : "pill"}
      onClick={() => setSelectedTeamId(team.team_id)}>
      {team.team_name}
    </button>
  ))}
</div>
```

**Pill styling:**
- Default: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 20px`,
  `padding: 6px 16px`, `font-size: 13px`, `color: var(--text2)`
- Active: `background: var(--accent)`, `color: white`, `border-color: var(--accent)`

**Initialization:** On first data load, set `selectedTeamId` to `teams[0].team_id` using
an effect:

```typescript
useEffect(() => {
  if (data?.teams.length && !selectedTeamId) {
    setSelectedTeamId(data.teams[0].team_id);
  }
}, [data]);
```

---

### 2. Team Runs KPI Card

**Data source:** `useTeamSummary(teamId, start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | dynamic | `Team Runs ({days}d)` | `Team Runs (30d)` |
| Value | `runs.total` | `formatCount()` | `4,210` |
| Delta | `runs.delta_pct` | `±X.X% vs prior period` | `+8.2% vs prior period` |

**Delta color:** Run increase = **green** (`.kpi-delta.up`), decrease = **red**.

---

### 3. Team Spend KPI Card

**Data source:** `useTeamSummary(teamId, start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | dynamic | `Team Spend ({days}d)` | `Team Spend (30d)` |
| Value | `spend.spend_usd` | `formatCurrencyCompact()` | `$21.3K` |
| Delta | `spend.delta_pct` | `±X.X% vs prior period` | `+11.7% vs prior period` |

**Delta color:** Cost increase = **red** (`.kpi-delta.down`), decrease = **green**.

---

### 4. Success Rate KPI Card

**Data source:** `useTeamSummary(teamId, start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | static | — | `SUCCESS RATE` |
| Value | `success_rate.rate_pct` | `formatPercent()` | `94.8%` |
| Delta | `success_rate.delta_pp` | `±X.Xpp vs prior period` | `+1.6pp vs prior period` |

**Value color:** Always `var(--green)`.

**Delta color:** Rate increase = **green** (`.kpi-delta.up`), decrease = **red**.

---

### 5. Active Users KPI Card

**Data source:** `useTeamSummary(teamId, start, end)`

| Element | Source field | Format | Example |
|---------|-------------|--------|---------|
| Label | dynamic | `Active Users ({days}d)` | `Active Users (30d)` |
| Value | `active_users.count` | `formatCount()` | `18` |
| Delta | `active_users.delta` | `±N vs prior period` | `+2 vs prior period` |

**Delta color:** User increase = **green** (`.kpi-delta.up`), decrease = **red**.

**Delta formatting:** `active_users.delta` is an absolute count (not a percentage):

```typescript
const sign = delta > 0 ? "+" : "";
const label = `${sign}${delta} vs prior period`;
const className = delta >= 0 ? "kpi-delta up" : "kpi-delta down";
```

---

### 6. Top Agents Table

**Data source:** `useTeamTopAgents(teamId, start, end)`

**Card title:** `TOP AGENTS`

| Column | Source | Format |
|--------|--------|--------|
| Agent | `agent_type` | Plain text |
| Runs | `run_count` | `formatCount()` -> `1,420` |
| Success | `success_rate_pct` | Color-coded `.tag` |
| Avg Duration | `avg_duration_ms` | `formatDuration()` -> `4.2s` |
| Spend | `spend_usd` | `formatCurrencyFull()` -> `$8,120` |

**Success rate tag:**

```typescript
function getSuccessTag(rate: number): { className: string; label: string } {
  if (rate >= 95) return { className: "tag green", label: `${rate.toFixed(1)}%` };
  if (rate >= 85) return { className: "tag gray", label: `${rate.toFixed(1)}%` };
  return { className: "tag red", label: `${rate.toFixed(1)}%` };
}
```

Thresholds: `>=95%` = green (healthy), `85-95%` = gray (moderate), `<85%` = red (concerning).

Default: top 10 agents. Sorted by run count descending (API returns pre-sorted).

---

### 7. User Activity Table

**Data source:** `useTeamUserActivity(teamId, start, end)`

**Card title:** `USER ACTIVITY`

| Column | Source | Format |
|--------|--------|--------|
| User | `user_name` | Bold (`<strong>`) |
| Runs | `run_count` | `formatCount()` -> `842` |
| Last Active | `last_active` | `formatRelativeTime()` -> `2 hours ago` |
| Success | `success_rate_pct` | Color-coded `.tag` (same thresholds as Top Agents) |

Sorted by run count descending (API returns pre-sorted). Shows all users in the team with
activity in the selected period.

---

## Date Range Integration

### Range-scoped (re-fetch on date change)

| Widget | Query key |
|--------|-----------|
| Team Runs + Spend + Success Rate + Active Users KPIs | `["team-summary", teamId, start, end]` |
| Top Agents Table | `["team-top-agents", teamId, start, end, limit]` |
| User Activity Table | `["team-user-activity", teamId, start, end]` |

### Fixed-window (not affected by date change)

| Widget | Query key |
|--------|-----------|
| Team Selector | `["team-list"]` |

### Re-fetch on team selection change

All team-scoped queries (`team-summary`, `team-top-agents`, `team-user-activity`) include
`teamId` in their query keys. Changing the selected team automatically triggers re-fetch.
`team-list` is unaffected by team selection.