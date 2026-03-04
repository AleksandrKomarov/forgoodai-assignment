# Backend Spec: Common Conventions

Shared conventions for all dashboard widget endpoints. For functional requirements, see
[requirements-spec.md](requirements-spec.md). For API contracts without implementation details,
see [api-reference.md](api-reference.md).

---

## Auth & Tenant Scoping

All endpoints require a valid **Entra ID JWT**, validated by API Management (`validate-jwt` policy).

- **Tenant scoping:** the `tid` (Tenant ID) claim from the JWT is injected as `tenant_id` into
  every KQL query. No endpoint accepts `tenant_id` as a query parameter — it's always derived
  from the token.
- **Access:** all authenticated users within a tenant can read all dashboard widgets. No
  role-based filtering is applied.

---

## Common Query Parameters

Endpoints that show data for a user-selected period accept:

| Param   | Type           | Required | Description                    |
|---------|----------------|----------|--------------------------------|
| `start` | ISO 8601 date  | yes      | Period start, inclusive         |
| `end`   | ISO 8601 date  | yes      | Period end, inclusive           |

**Validation rules:**
- `end >= start`
- Maximum span: 365 days
- `start` must not be earlier than 2 years ago
- `end` must not be in the future

**Prior-period comparison** is automatic. The API computes a prior period of equal length:
```
period_length = end - start
prior_start   = start - period_length - 1 day
prior_end     = start - 1 day
```
Delta values in the response reflect this prior period.

Some endpoints accept additional parameters (e.g., `dimension`, `granularity`, `limit`) —
documented in their respective view specs.

---

## Display Name Resolution

`team_id` UUIDs in KQL results are resolved to human-readable `team_name` values via
**Microsoft Graph API**:

- **Batch lookup:** single Graph request for all team IDs in the result set
- **Cached in Redis:** key `name:{uuid}`, TTL 15 minutes
- **Fallback:** if Graph API is unavailable, `team_name` returns the raw UUID string

Applies to any endpoint that returns team data (e.g., `top-cost-centers`, `daily-spend`,
`team-cost-summary`, `failure-hotspots`).

---

## Caching Strategy

All widget responses are cached in **Azure Cache for Redis**.

| Category | TTL | Examples |
|----------|-----|---------|
| Real-time widgets | 60 seconds | success-rate, run-volume, error-taxonomy |
| Trend / historical data | 5 minutes | monthly-spend, budget-forecast |
| Display names | 15 minutes | Graph API name lookups |

Cache keys follow the pattern: `{widget-name}:{tenant_id}:{params...}`

On cache miss: run all KQL queries in parallel, assemble response, resolve names, cache, return.

---

## Error Handling

### Standard Errors (all endpoints)

| Scenario                         | HTTP Status | Response Body                                        |
|----------------------------------|-------------|------------------------------------------------------|
| Missing or invalid JWT           | 401         | `{ "error": "unauthorized" }`                        |
| Invalid `start`/`end` params     | 400         | `{ "error": "invalid_range", "message": "..." }`     |
| `start`/`end` missing            | 400         | `{ "error": "missing_params", "message": "..." }`    |
| ADX query timeout (30s limit)    | 504         | `{ "error": "query_timeout" }`                       |
| Budget unavailable               | 200         | Budget fields return `null`                           |
| Graph API unavailable            | 200         | `team_name` falls back to raw UUID string             |
| No data for requested period     | 200         | Zero values / empty arrays (not 404)                  |

Individual view specs may document additional endpoint-specific errors (e.g., invalid
`dimension`, `limit` out of range, retention window exceeded).

---

## SPA Integration

- The SPA fires all widget requests for a view **in parallel** on page load
- Each widget renders independently as its response arrives
- A failed widget shows an inline error state without blocking other widgets
- When the user changes the date range, only range-scoped endpoints are re-fetched

## Request Cancellation

The SPA may abort in-flight HTTP requests (via the standard `AbortSignal` mechanism) when the user
navigates away or changes query parameters. Backend endpoints should handle client disconnects
gracefully — cancel any running KQL queries when the connection is dropped to avoid unnecessary
ADX resource consumption.
