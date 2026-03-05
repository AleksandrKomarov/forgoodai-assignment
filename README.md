# Agent Analytics Dashboard

Org-level analytics dashboard for a cloud agent platform. Gives engineering leads, platform teams, finance, and executives visibility into cost, performance, usage, and team activity across the organization.

## What's in this repo

```
├── dashboard/              # React SPA (implemented)
├── analytics-dashboard-design.md   # System design (Azure-native architecture)
├── requirements-spec.md    # Functional requirements
├── api-reference.md        # API endpoint catalog
├── frontend specs/         # Per-view frontend specs + design tokens
├── backend specs/          # Per-view backend specs + shared conventions
└── wireframe.html          # UI wireframe
```

## What's implemented

**Frontend** — the `dashboard/` directory contains a fully built and tested React SPA with a mock API layer.

**Authentication** — spec'd but not implemented. The app is designed for Microsoft Entra ID (MSAL.js) but currently runs without auth.

**Backend** — spec'd but not implemented. Design docs cover Azure-native architecture (ADX, Azure Functions, Cosmos DB, APIM) and per-endpoint backend specs.

## Running locally

### Frontend dev server

```bash
cd dashboard
npm install
npm run dev          # dev server on http://localhost:3000
```

### Frontend tests

```bash
cd dashboard
npx vitest run              # unit + component tests
npx playwright install      # first time only
npx playwright test         # E2E tests
```
