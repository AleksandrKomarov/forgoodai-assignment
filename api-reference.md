# API Reference: Agent Analytics Dashboard

## Overview

All endpoints are served under `/api/v1/widgets/`. Authentication, common parameters, and error
handling conventions are described first, followed by all 24 endpoints grouped by view.

---

## Authentication

All requests require a valid Entra ID JWT in the `Authorization: Bearer {token}` header.
The `tid` (Tenant ID) claim scopes all queries to the caller's tenant — `tenant_id` is never
accepted as a query parameter.

All authenticated users can access all endpoints. No role-based filtering.

---

## Common Parameters

Endpoints that show data for a user-selected period accept:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `start` | ISO 8601 date | yes | Period start, inclusive |
| `end` | ISO 8601 date | yes | Period end, inclusive |

Validation:
- `end >= start`
- Maximum span: 365 days
- `start` must not be earlier than 2 years ago
- `end` must not be in the future

Prior-period comparison is automatic. The API computes:
```
period_length = end - start
prior_start   = start - period_length - 1 day
prior_end     = start - 1 day
```

---

## Common Errors

| Scenario | Status | Body |
|----------|--------|------|
| Missing or invalid JWT | 401 | `{ "error": "unauthorized" }` |
| Invalid `start`/`end` | 400 | `{ "error": "invalid_range", "message": "..." }` |
| Missing `start`/`end` | 400 | `{ "error": "missing_params", "message": "..." }` |
| Query timeout | 504 | `{ "error": "query_timeout" }` |
| Budget unavailable | 200 | Budget fields return `null` |
| Graph API unavailable | 200 | `team_name` falls back to raw UUID |
| No data for period | 200 | Zero values / empty arrays (not 404) |

---

## Executive Summary Endpoints

### 1. Monthly Spend

```
GET /api/v1/widgets/monthly-spend
```

No `start`/`end` — always returns 12 months of actual + 3 months of forecast.

**Response:**

```json
{
  "monthly_spend": [
    { "period": "2024-04", "total_usd": 12340.50 },
    ...
  ],
  "monthly_spend_forecast": [
    { "period": "2025-04", "projected_usd": 16467.58 },
    ...
  ]
}
```

---

### 2. Success Rate

```
GET /api/v1/widgets/success-rate?start={start}&end={end}
```

**Response:**

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

Also used by: Performance & Reliability.

---

### 3. Run Volume

```
GET /api/v1/widgets/run-volume?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "total_runs": 19550,
  "prior_total_runs": 17800,
  "delta_pct": 9.8,
  "daily": [
    { "date": "2025-02-01", "count": 642 },
    ...
  ]
}
```

Also used by: Usage & Capacity.

---

### 4. Top Cost Centers

```
GET /api/v1/widgets/top-cost-centers?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "teams": [
    {
      "team_id": "uuid",
      "team_name": "ML Platform",
      "spend_usd": 18200.00,
      "run_count": 8420,
      "delta_pct": 12.3
    },
    ...
  ]
}
```

Returns top 3 teams by spend.

---

### 5. Spend KPI

```
GET /api/v1/widgets/spend-kpi?start={start}&end={end}
```

**Response:**

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

`budget_usd` and `budget_utilization_pct` are `null` if no budget is set.

Also used by: Cost Explorer.

---

## Cost Explorer Endpoints

### 6. Daily Spend

```
GET /api/v1/widgets/daily-spend?start={start}&end={end}&dimension={dimension}&granularity={granularity}
```

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `dimension` | string | no | `team` | `team` or `agent_type` |
| `granularity` | string | no | `daily` | `daily`, `weekly`, or `monthly` |

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "dimension": "team",
  "granularity": "daily",
  "series": [
    {
      "key": "uuid",
      "label": "ML Infra",
      "data": [
        { "date": "2025-02-01", "spend_usd": 720.50 },
        ...
      ]
    },
    ...
  ]
}
```

When `dimension=agent_type`, `key` and `label` are both the agent type string.

**Errors:**

| Scenario | Status | Body |
|----------|--------|------|
| Invalid `dimension` | 400 | `{ "error": "invalid_param", "message": "dimension must be 'team' or 'agent_type'" }` |
| Invalid `granularity` | 400 | `{ "error": "invalid_param", "message": "granularity must be 'daily', 'weekly', or 'monthly'" }` |

---

### 7. Spend Breakdown

```
GET /api/v1/widgets/spend-breakdown?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "total_usd": 47200.00,
  "drivers": [
    { "driver": "tokens", "spend_usd": 30128.00, "pct": 63.8 },
    { "driver": "compute", "spend_usd": 12272.00, "pct": 26.0 },
    { "driver": "storage", "spend_usd": 3304.00, "pct": 7.0 },
    { "driver": "egress", "spend_usd": 1496.00, "pct": 3.2 }
  ]
}
```

An additional `{ "driver": "other", ... }` entry is included if there's a remainder.

---

### 8. Budget & Forecast

```
GET /api/v1/widgets/budget-forecast
```

No `start`/`end` — always calculates for the current month.

**Response:**

```json
{
  "month": "2025-03",
  "days_elapsed": 18,
  "days_in_month": 31,
  "spent_so_far_usd": 30100.00,
  "daily_run_rate_usd": 1672.22,
  "forecast": {
    "projected_usd": 51838.89,
    "projected_over_budget_usd": 6838.89,
    "projected_budget_pct": 115.2
  },
  "burn_rate": {
    "budget_usd": 45000.00,
    "burn_pct": 66.9,
    "month_progress_pct": 58.1,
    "on_track": false
  }
}
```

If no budget is set: `burn_rate.budget_usd`, `burn_rate.burn_pct`,
`forecast.projected_over_budget_usd`, and `forecast.projected_budget_pct` are `null`.

---

### 9. Per-Team Cost Summary

```
GET /api/v1/widgets/team-cost-summary?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "total_spend_usd": 47200.00,
  "teams": [
    {
      "team_id": "uuid",
      "team_name": "ML Infra",
      "spend_usd": 21340.00,
      "run_count": 4210,
      "avg_cost_per_run": 5.07,
      "delta_pct": 18.0,
      "share_pct": 45.2
    },
    ...
  ]
}
```

Returns all teams, sorted by spend descending.

---

## Performance & Reliability Endpoints

### 10. Latency KPI

```
GET /api/v1/widgets/latency-kpi?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "p50_ms": 1200,
  "p95_ms": 4800,
  "p99_ms": 12100,
  "prior_p50_ms": 1280,
  "prior_p95_ms": 4480,
  "prior_p99_ms": 10700,
  "delta_p50_ms": -80,
  "delta_p95_ms": 320,
  "delta_p99_ms": 1400
}
```

**Errors:**

| Scenario | Status | Body |
|----------|--------|------|
| Range exceeds 90 days | 400 | `{ "error": "range_exceeds_retention", "message": "Period-wide latency percentiles are limited to the 90-day hot window" }` |

---

### 11. Success / Failure Timeseries

```
GET /api/v1/widgets/success-failure-timeseries?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "daily": [
    { "date": "2025-02-01", "completed": 610, "failed": 32 },
    ...
  ]
}
```

---

### 12. Error Taxonomy

```
GET /api/v1/widgets/error-taxonomy?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "total_failures": 1130,
  "errors": [
    { "error_code": "CONTEXT_LIMIT_EXCEEDED", "count": 429, "pct": 38.0 },
    { "error_code": "TIMEOUT", "count": 271, "pct": 24.0 },
    { "error_code": "OOM", "count": 203, "pct": 18.0 },
    { "error_code": "LOGIC_ERROR", "count": 136, "pct": 12.0 },
    { "error_code": "INFRA_FAULT", "count": 91, "pct": 8.0 }
  ]
}
```

Returns `{ "total_failures": 0, "errors": [] }` when no failures exist.

---

### 13. Latency Distribution

```
GET /api/v1/widgets/latency-distribution?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "daily": [
    { "date": "2025-02-01", "p50_ms": 1150, "p95_ms": 4600, "p99_ms": 11200 },
    ...
  ]
}
```

---

### 14. Slowest Agents

```
GET /api/v1/widgets/slowest-agents?start={start}&end={end}&limit={limit}
```

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `limit` | integer | no | 10 | Number of agents (max 50) |

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "agents": [
    {
      "agent_type": "deep-analyzer-v2",
      "avg_duration_ms": 18400,
      "p95_duration_ms": 32100,
      "run_count": 312
    },
    ...
  ]
}
```

**Errors:**

| Scenario | Status | Body |
|----------|--------|------|
| `limit` out of range | 400 | `{ "error": "invalid_param", "message": "limit must be between 1 and 50" }` |

---

### 15. Failure Hotspots

```
GET /api/v1/widgets/failure-hotspots?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "teams": [
    { "team_id": "uuid-1", "team_name": "ML Infra" },
    { "team_id": "uuid-2", "team_name": "Data Eng" },
    ...
  ],
  "cells": [
    {
      "agent_type": "code-reviewer-v3",
      "team_id": "uuid-1",
      "failure_rate_pct": 1.2,
      "failed": 14,
      "total": 1167
    },
    ...
  ]
}
```

`teams` provides column headers. `cells` is a flat list to be pivoted into a matrix.

---

## Usage & Capacity Endpoints

### 16. Active Users & Teams

```
GET /api/v1/widgets/active-users?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "active_users": 47,
  "prior_active_users": 42,
  "delta_users": 5,
  "active_teams": 3,
  "total_teams": 3
}
```

---

### 17. Concurrency Timeseries

```
GET /api/v1/widgets/concurrency-timeseries?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "concurrency_limit": 50,
  "peak_in_period": 34,
  "daily": [
    { "date": "2025-02-01", "peak_concurrent": 28 },
    ...
  ]
}
```

`concurrency_limit` is `null` if no quota is set.

**Errors:**

| Scenario | Status | Body |
|----------|--------|------|
| Range exceeds 90 days | 400 | `{ "error": "range_exceeds_retention", "message": "Concurrency and heatmap data is limited to the 90-day hot window" }` |

---

### 18. Run Volume by Team

```
GET /api/v1/widgets/run-volume-by-team?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "teams": [
    { "team_id": "uuid", "team_name": "Data Eng", "run_count": 5102 },
    ...
  ]
}
```

Sorted by `run_count` descending.

---

### 19. Run Heatmap

```
GET /api/v1/widgets/run-heatmap?start={start}&end={end}
```

**Response:**

```json
{
  "start": "2025-02-01",
  "end": "2025-03-01",
  "cells": [
    { "day_of_week": 0, "hour_of_day": 0, "run_count": 42 },
    { "day_of_week": 0, "hour_of_day": 1, "run_count": 38 },
    ...
  ]
}
```

168 entries (7 days × 24 hours). `day_of_week`: 0 = Sunday through 6 = Saturday.

**Errors:**

| Scenario | Status | Body |
|----------|--------|------|
| Range exceeds 90 days | 400 | `{ "error": "range_exceeds_retention", "message": "Concurrency and heatmap data is limited to the 90-day hot window" }` |

---

### 20. Agent Type Adoption

```
GET /api/v1/widgets/agent-adoption
```

No `start`/`end` — always shows last 6 months.

**Response:**

```json
{
  "months": [
    { "month": "2024-10", "new_count": 1, "new_types": ["log-analyzer-v1"] },
    { "month": "2024-11", "new_count": 3, "new_types": ["doc-generator-v2", "test-writer-v1", "security-scanner-v1"] },
    ...
  ],
  "current_month": {
    "month": "2025-03",
    "new_count": 2,
    "new_types": ["security-scanner-v2", "summarizer-v1"]
  }
}
```

---

## Team Drill-Down Endpoints

### 21. Team List

```
GET /api/v1/widgets/team-list
```

No `start`/`end` — returns all teams regardless of date range.

**Response:**

```json
{
  "teams": [
    { "team_id": "uuid", "team_name": "ML Infra" },
    { "team_id": "uuid", "team_name": "Data Eng" },
    { "team_id": "uuid", "team_name": "Platform Team" }
  ]
}
```

---

### 22. Team Summary

```
GET /api/v1/widgets/team-summary?team_id={team_id}&start={start}&end={end}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `team_id` | uuid | yes | Team to drill into |

**Response:**

```json
{
  "team_id": "uuid",
  "team_name": "ML Infra",
  "start": "2025-02-01",
  "end": "2025-03-01",
  "runs": {
    "total": 4210,
    "prior_total": 3890,
    "delta_pct": 8.2
  },
  "spend": {
    "spend_usd": 21340.00,
    "prior_spend_usd": 19100.00,
    "delta_pct": 11.7
  },
  "success_rate": {
    "rate_pct": 94.8,
    "prior_rate_pct": 93.2,
    "delta_pp": 1.6
  },
  "active_users": {
    "count": 18,
    "prior_count": 16,
    "delta": 2
  }
}
```

**Errors:**

| Scenario | Status | Body |
|----------|--------|------|
| Missing `team_id` | 400 | `{ "error": "missing_params", "message": "team_id is required" }` |

---

### 23. Team Top Agents

```
GET /api/v1/widgets/team-top-agents?team_id={team_id}&start={start}&end={end}&limit={limit}
```

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `team_id` | uuid | yes | — | Team to drill into |
| `limit` | integer | no | 10 | Number of agents (max 50) |

**Response:**

```json
{
  "team_id": "uuid",
  "team_name": "ML Infra",
  "start": "2025-02-01",
  "end": "2025-03-01",
  "agents": [
    {
      "agent_type": "code-reviewer-v3",
      "run_count": 1420,
      "success_rate_pct": 97.1,
      "avg_duration_ms": 4200,
      "spend_usd": 8120.00
    },
    ...
  ]
}
```

**Errors:**

| Scenario | Status | Body |
|----------|--------|------|
| Missing `team_id` | 400 | `{ "error": "missing_params", "message": "team_id is required" }` |
| `limit` out of range | 400 | `{ "error": "invalid_param", "message": "limit must be between 1 and 50" }` |

---

### 24. Team User Activity

```
GET /api/v1/widgets/team-user-activity?team_id={team_id}&start={start}&end={end}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `team_id` | uuid | yes | Team to drill into |

**Response:**

```json
{
  "team_id": "uuid",
  "team_name": "ML Infra",
  "start": "2025-02-01",
  "end": "2025-03-01",
  "users": [
    {
      "user_id": "uuid",
      "user_name": "Sarah Chen",
      "run_count": 842,
      "last_active": "2025-03-01T08:14:00Z",
      "success_rate_pct": 97.8
    },
    ...
  ]
}
```

**Errors:**

| Scenario | Status | Body |
|----------|--------|------|
| Missing `team_id` | 400 | `{ "error": "missing_params", "message": "team_id is required" }` |

---

## Endpoint Summary

| # | Endpoint | Params | Fixed Window | Reused By |
|---|----------|--------|:---:|-----------|
| 1 | `monthly-spend` | — | yes | Cost Explorer |
| 2 | `success-rate` | start, end | — | Performance |
| 3 | `run-volume` | start, end | — | Usage & Capacity |
| 4 | `top-cost-centers` | start, end | — | — |
| 5 | `spend-kpi` | start, end | — | Cost Explorer |
| 6 | `daily-spend` | start, end, dimension, granularity | — | — |
| 7 | `spend-breakdown` | start, end | — | — |
| 8 | `budget-forecast` | — | yes | — |
| 9 | `team-cost-summary` | start, end | — | — |
| 10 | `latency-kpi` | start, end | — | — |
| 11 | `success-failure-timeseries` | start, end | — | — |
| 12 | `error-taxonomy` | start, end | — | — |
| 13 | `latency-distribution` | start, end | — | — |
| 14 | `slowest-agents` | start, end, limit | — | — |
| 15 | `failure-hotspots` | start, end | — | — |
| 16 | `active-users` | start, end | — | — |
| 17 | `concurrency-timeseries` | start, end | — | — |
| 18 | `run-volume-by-team` | start, end | — | — |
| 19 | `run-heatmap` | start, end | — | — |
| 20 | `agent-adoption` | — | yes | — |
| 21 | `team-list` | — | yes | — |
| 22 | `team-summary` | team_id, start, end | — | — |
| 23 | `team-top-agents` | team_id, start, end, limit | — | — |
| 24 | `team-user-activity` | team_id, start, end | — | — |

**Retention limits:** Endpoints 10 (`latency-kpi`), 17 (`concurrency-timeseries`), and
19 (`run-heatmap`) are limited to 90-day ranges. All others support up to 365 days.
