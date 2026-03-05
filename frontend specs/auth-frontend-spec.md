# Frontend Spec: Authentication & Authorization

## Overview

The dashboard uses Microsoft Entra ID (Azure AD) for authentication via MSAL.js. It is a
multi-tenant application — one app registration serves all organizations, and each tenant sees
only its own data. There is no role-based access control; all authenticated users can access
all views and endpoints.

For backend auth conventions, see [backend-spec-common.md](backend-spec-common.md).
For shared styles and utilities, see [frontend-design-spec.md](frontend-design-spec.md).

---

## App Registration

A single Azure Entra ID app registration:

| Setting | Value |
|---------|-------|
| `signInAudience` | `AzureADMultipleOrgs` |
| Auth flow | Authorization code flow + PKCE |
| Platform | Single-page application (SPA) |
| Redirect URI | App's root URL (e.g., `https://{app}.azurestaticapps.net`) |
| Scopes | API access scope for the Analytics API app registration |

No client secret — PKCE replaces the need for a secret in public SPA clients.

---

## MSAL.js Configuration

```typescript
import { PublicClientApplication, Configuration } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: "https://login.microsoftonline.com/common",  // multi-tenant
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",  // or "localStorage" for persistent sessions
  },
};

const msalInstance = new PublicClientApplication(msalConfig);
```

**Environment variables:**

| Variable | Description |
|----------|-------------|
| `VITE_AZURE_CLIENT_ID` | App registration client ID |
| `VITE_API_SCOPE` | API scope (e.g., `api://{api-client-id}/access_as_user`) |
| `VITE_API_BASE_URL` | Backend API base URL |

---

## Auth Flow

### 1. App Load — Silent Token Acquisition

On app initialization, attempt to acquire a token silently from the MSAL cache:

```typescript
async function initializeAuth(): Promise<AuthenticationResult | null> {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) return null;

  try {
    return await msalInstance.acquireTokenSilent({
      scopes: [import.meta.env.VITE_API_SCOPE],
      account: accounts[0],
    });
  } catch {
    return null;  // silent acquisition failed — will trigger redirect
  }
}
```

### 2. No Session — Redirect to Login

If no cached session exists or silent acquisition fails, redirect to Entra ID login:

```typescript
async function login(): Promise<void> {
  await msalInstance.loginRedirect({
    scopes: [import.meta.env.VITE_API_SCOPE],
  });
}
```

After login, Entra ID redirects back to the app. MSAL.js handles the redirect response
automatically on app load:

```typescript
await msalInstance.handleRedirectPromise();
```

### 3. Token Acquired — API Calls

Once authenticated, every API call includes the JWT:

```
Authorization: Bearer {access_token}
```

### 4. Token Refresh

MSAL.js handles token renewal automatically. Tokens are refreshed silently before expiry.
If silent renewal fails (e.g., refresh token expired), the user is redirected to Entra ID
to re-authenticate.

---

## Auth Guard

The entire app is behind an auth guard. No views or API calls are accessible without a valid
session.

```typescript
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) {
    login();  // trigger redirect
    return <FullPageSpinner />;
  }

  return <>{children}</>;
}
```

**App root:**

```typescript
<MsalProvider instance={msalInstance}>
  <AuthGuard>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </AuthGuard>
</MsalProvider>
```

MSAL must wrap the entire app. TanStack Query and TanStack Router sit inside the auth boundary
so that no queries fire before authentication is complete.

---

## Auth Hook

A custom hook exposes auth state and the current user to any component:

```typescript
function useAuth() {
  const accounts = useMsal().accounts;
  const account = accounts[0] ?? null;

  return {
    isAuthenticated: account !== null,
    isLoading: useMsal().inProgress !== InteractionStatus.None,
    user: account
      ? {
          name: account.name ?? "",
          initials: getInitials(account.name ?? ""),
          tenantId: account.tenantId,
          userId: account.localAccountId,
        }
      : null,
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
```

---

## HTTP Client — Auth Interceptor

Every API request acquires a fresh token (from cache if valid) and attaches it.

```typescript
async function getAccessToken(): Promise<string> {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) throw new Error("Not authenticated");

  const result = await msalInstance.acquireTokenSilent({
    scopes: [import.meta.env.VITE_API_SCOPE],
    account: accounts[0],
  });
  return result.accessToken;
}

async function fetchWidget<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`/api/v1/widgets/${endpoint}`, import.meta.env.VITE_API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const token = await getAccessToken();
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    await msalInstance.loginRedirect({
      scopes: [import.meta.env.VITE_API_SCOPE],
    });
    throw new Error("Re-authenticating");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body);
  }

  return response.json();
}
```

All view hooks call `fetchWidget()`. A 401 response forces re-authentication via Entra ID
redirect — this is a fallback since MSAL's silent renewal normally prevents token expiry.

---

## JWT Claims Used

The backend extracts tenant and user identity from JWT claims. The frontend uses the same
claims for UI display.

| JWT Claim | Backend usage | Frontend usage |
|-----------|---------------|----------------|
| `tid` | Injected as `tenant_id` in every KQL query | Shown in sidebar footer (resolved to tenant name via Graph API) |
| `oid` | Maps to `user_id` in events | Used as `localAccountId` in MSAL |
| `name` | — | User avatar initials, display name |

**Tenant name resolution:** The `tid` claim is a UUID. The sidebar footer shows the
human-readable tenant name, resolved via Microsoft Graph API and cached client-side.

---

## UI Elements

### User Avatar (Header)

Displays user initials in a circular badge (`.avatar`), top-right of the header.
Example: user "Aleksandr K" displays `AK`.

### Tenant Name (Sidebar Footer)

Displays the organization name at the bottom of the sidebar (`.sidebar-footer`).
Tenant name resolved via Graph API using the `tid` from the JWT. Cached client-side. Falls
back to raw UUID if Graph API is unavailable.

---

## Error States

| Scenario | Behavior |
|----------|----------|
| No session on app load | Redirect to Entra ID login page |
| Silent token renewal fails | Redirect to Entra ID login page |
| API returns 401 | Force redirect to Entra ID (token may be revoked) |
| User cancels login | Show a "Sign in required" page with a retry button |
| Network error during auth | Show a "Connection error" page with a retry button |

All auth errors are full-page states (not inline widget errors). The app cannot function
without authentication.

---

## Security Considerations

- **No client secret:** SPA uses PKCE, which is the recommended flow for public clients
- **Session storage:** Tokens stored in `sessionStorage` by default (cleared when tab closes).
  Use `localStorage` only if persistent sessions are required
- **No `tenant_id` in URLs:** Tenant scoping is derived from the JWT on the backend. The
  frontend never sends `tenant_id` as a query parameter
- **HTTPS only:** Azure Static Web Apps enforces HTTPS. All auth redirects and API calls go
  over TLS
- **Token scope:** Request the narrowest scope needed (API access only, not broad Graph
  permissions). Graph API calls for display names use a separate scope
