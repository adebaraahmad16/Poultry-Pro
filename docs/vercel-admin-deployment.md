# Admin deployment diagnosis and fix

Verified against https://poultry-pro-pi.vercel.app on 17 October 2026.

## Observed production failures

| Request | Observed response |
| --- | --- |
| `/` | 200, HTML referencing the production bundles |
| `/admin` | 404, `X-Vercel-Error: NOT_FOUND`, plain text response |
| `/admin/login` | 404, `X-Vercel-Error: NOT_FOUND` |
| `/assets/index-ho5LNN_j.js` | 200, JavaScript; includes admin routes |
| `/assets/index-oXAyaMfQ.css` | 200, CSS |

The failing resource is the initial page document, before React executes. No `vercel.json` existed in the repository. The deployed JavaScript also contains `http://localhost:5000/api` as its API base, with no deployed backend origin. This is a separate configuration failure that would prevent real production login even after restoring deep links.

## Configuration

`vercel.json` builds this existing Vite application with `npm run build` into `dist`. Its SPA rewrite serves `index.html` for frontend routes, including `/admin` and nested routes. `/api`, `/assets`, and file requests are excluded; API errors and missing bundles are not replaced with HTML. There were no repository API rewrites, redirects, or headers to preserve. The Express/MySQL backend remains a separate deployment. See [Vercel rewrites](https://vercel.com/docs/routing/rewrites).

In the existing Vercel project, set **Settings > Environment Variables > `VITE_API_BASE_URL`** to the actual HTTPS backend API URL, including `/api`. Apply it to Production and to Preview if preview deployments should connect to that backend. `VITE_BACKEND_URL` remains a supported legacy alias, but `VITE_API_BASE_URL` takes precedence. Never use localhost in a deployed frontend. Vite embeds these values at build time, so changing the variable requires a new deployment.

No real production backend URL is present in the repository or deployed bundle. Do not substitute an invented hostname. If using `/api` on the same origin instead, first provision the real backend/proxy; this repository does not host Express as a Vercel function.

Backend-only environment variables remain on the backend host: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and the existing database/payment settings. Do not expose them as `VITE_*` variables. Deploy the backend update containing `GET /api/auth/admin/session` before the updated frontend. The endpoint verifies the signed JWT and admin role, returns no-store session metadata, and rejects farmer/invalid/expired tokens.

## Application safeguards

- Production API configuration is checked without throwing at module import. Missing, malformed, loopback, or insecure backend URLs produce actionable errors rather than attempted connections to a visitor's computer.
- Admin cached profiles never grant access. Session restoration verifies the server session before rendering protected pages.
- Admin and farmer tokens stay separate. An admin 401 clears only the matching current admin session.
- Authentication and data-loading failures have retry controls. Unexpected React render failures have a visible error boundary and reload action.
- Login retains the existing UI and shows an in-progress state while verifying credentials.
- Existing local admin collections are preserved. This fix does not migrate the pre-existing browser-local admin management features into new backend APIs.

## Verification

Changed files:

- Deployment guidance: `vercel.json`, `.env.example`, this document.
- API/session handling: `src/services/apiConfig.js`, `src/services/planCatalog.js`, `src/services/sessionService.js`, `backend/routes/subscriptionRoutes.js`.
- Admin rendering/authentication: `src/admin/context/AdminContext.jsx`, `src/admin/auth/ProtectedAdminRoute.jsx`, `src/admin/auth/AdminLogin.jsx`, `src/admin/components/AdminLayout.jsx`, `src/components/common/AppErrorBoundary.jsx`, `src/main.jsx`.
- Checks: `src/services/__tests__/productionConfiguration.test.js`, `src/services/__tests__/sessionService.test.js`, `backend/tests/subscriptions.integration.test.js`, `backend/tests/poultryScope.integration.test.js`, `scripts/check_poultry_scope_browser.mjs`.

```text
node --test src/services/__tests__/productionConfiguration.test.js src/services/__tests__/sessionService.test.js
cd backend
node tests/subscriptions.integration.test.js
node tests/poultryScope.integration.test.js --browser --preview
```

The last command creates a disposable MySQL test schema, builds the real production frontend against the isolated API, serves it using Vite preview, and runs Chrome checks. It covers homepage/direct admin entry/refresh, non-admin and expired sessions, real admin login, failed session/data requests with retry, farmer data isolation, and farmer/admin pages at 320, 390, 768 and 1440 pixels. It also checks for failing JavaScript/CSS responses and uncaught rendering errors. This tests Vite's production output, not Vercel's deployed rewrite engine. The configuration test separately checks rewrite inclusion/exclusion.

Result: the final `npm run build` passed (existing bundle-size advisory only); both unit test files passed; 56 subscription/auth integration checks passed; 30 poultry-scope checks and all production-preview browser checks passed. No required JS/CSS failures or uncaught React errors were reported.

For a manual production check, run `npm run build`, then `npm run preview`, and open `/admin` on the displayed preview URL. Local preview permits a local backend; hosted production pages require the configured production URL.

## Remaining deployment verification

1. Deploy the backend session endpoint and confirm the backend is reachable over HTTPS.
2. Configure `VITE_API_BASE_URL` in the existing Vercel project and deploy this commit with `vercel.json` at the project root.
3. Verify `/`, `/dashboard`, `/admin`, `/admin/login` and nested admin routes by direct entry and refresh on the real domain. Confirm referenced JS/CSS return 200.
4. Sign in with real admin credentials and verify the Network panel targets the actual backend, then test logout, expired sessions and mobile navigation.

The currently deployed site was diagnosed, but this local change has not been deployed or validated after deployment. Production resolution must not be claimed until these checks pass.
