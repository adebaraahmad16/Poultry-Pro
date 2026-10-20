# Frontend API configuration

The repository's `.env` and `.env.example` previously set `VITE_API_URL`,
while `src/services/apiConfig.js` only read `VITE_API_BASE_URL` and
`VITE_BACKEND_URL`. Consequently that setting was ignored. The production
guard (`apiConfigurationError`, consumed by `request` and `checkedFetch`)
reported a missing backend before making a request. A correctly populated
`VITE_API_BASE_URL` in the frontend build would already have been accepted;
the repository alone cannot establish what a remote Vercel build received.

Use this configuration in the **frontend** Vercel project's Settings >
Environment Variables:

```dotenv
VITE_API_BASE_URL=https://<actual-backend-project-domain>/api
```

Replace the placeholder with the domain assigned to the separate Express
backend project. `poultrypro-backend.vercel.app` appeared in the old local
configuration, but its availability and ownership have not been verified.
Use the actual deployed backend domain, not the frontend domain, an Aiven
database URL, or a path to `backend/server.js`.

Apply the variable to **Production**, and **Preview** if previews use that
backend. Frontend Root Directory must be the repository root, Framework
Preset Vite, Build Command `npm run build`, Output Directory `dist`.
Redeploy after saving, and open the new deployment URL. A variable on the
backend project does not configure the frontend. These are build-time
values, so changing settings cannot update an existing JavaScript bundle.
Vercel builds now fail early if the effective URL is missing or invalid.

Both `https://<backend-domain>` and `https://<backend-domain>/api/` normalize
to `https://<backend-domain>/api`. Endpoints append `/auth/...`,
`/subscription/...`, `/daily-records`, etc., without another `/api` prefix.
Production URLs must be absolute HTTPS URLs without credentials, query
strings, fragments, or loopback hosts. Relative `/api` is rejected because
the frontend project has no backend proxy. Legacy `VITE_BACKEND_URL`, then
`VITE_API_URL`, are fallback names; nonempty `VITE_API_BASE_URL` takes
precedence, including when its value is invalid.

For local development, `.env.example` uses
`VITE_API_BASE_URL=http://localhost:5000/api`. With no variable, local Vite
development and localhost production previews also use port 5000. No
`.env.production` currently exists. Vite's standard environment loading is
unchanged; deployment variables override file values. Client API code uses
`import.meta.env`; `process.env` in `vite.config.js` is build-side Node code.

After deploying, verify backend `/health` and `/health/ready`, then inspect
browser Network requests during farmer/admin login, registration,
subscriptions, and daily records. They should target the backend domain
with exactly one `/api`. This workspace validation does not verify the
remote Vercel settings, database connectivity, or authenticated live flows.
