# Administrator authentication and authorization

The supplied `public.is_admin()` predicate already accepts `admin`, `super_admin`, and `Super Admin`. The existing profile ID/email/role must not be replaced or promoted. The repository uses one Supabase client, with persisted sessions, automatic refresh, and the same Auth storage key on localhost and Vercel. No service-role key is used by the frontend.

## Confirmed frontend defects

The former authorization helper interpreted a delayed RPC false/error **before** checking whether its session was still current. A farmer denial could therefore be reported after an administrator had signed in. AdminContext also applied asynchronous state changes and errors from older account loads without guarding the whole load. Separate direct administrator sign-in bypassed the shared Auth login path. Cached administrator collections could survive logout/account transitions. These races are reproduced with controlled data in the tests below.

`authSession.js` now verifies the exact access token with Supabase Auth, checks the server user against the session and expected profile ID, coalesces checks, and rejects stale results. `adminAccess.js` still requires the existing server-side RPC. Both false and error responses are checked against their originating session before interpretation. Same-account token rotation permits one bounded retry; switching accounts never reuses the previous proof. A real false remains denied and includes the signed-in email/ID for diagnosis. An RPC/network failure remains an error, not a false role result.

AuthProvider initializes and restores the shared verified profile, exposes authentication loading/authenticated/unauthenticated/expired/error states, ignores stale reads and cleans subscriptions/deferred callbacks. Administrator login uses this same login path. AdminContext gates data behind completed Auth initialization and RPC success, guards all load setters by account/generation, coalesces loads, clears private collections on identity changes/logout, and distinguishes authorization from subsequent table/configuration errors. Protected routes wait for verification. Ordinary farmer sessions remain blocked by server-side authorization. Normal farmer-page login sends an actual administrator to the admin dashboard; admin redirects are confined to admin routes.

Existing contact SELECT/UPDATE grants are retained. No grants are repeated. ContactContext waits for the current admin proof and its counts remain based on actual contact rows, independent of resolution status. Broadcast creation/retrieval continues using `category='admin_broadcast'` and the verified existing notification columns.

## Live identity check still required

The correctness of the supplied SQL and profile does not prove which user a particular browser authenticated as, or which project its deployed Vite variables target. A browser RPC false cannot be conclusively diagnosed from an anonymous request or SQL editor call without a JWT subject.

Run `supabase/diagnostics/admin_identity.sql` in the same project used by the deployed application's `VITE_SUPABASE_URL`. It checks the confirmed profile, corresponding Auth user, the Auth user for the administrator email, function definition/ownership, execution permission and existing policies. Its optional transaction simulates only that existing ID to test the database function; it does not log in a browser. No rows, roles, grants or policies change.

Compare the browser error's verified Auth ID to `dc66acb2-e7aa-447d-90ac-1f47cd7a76e5`. If they differ, use the correct existing Auth account/project and review the identity mapping; do not change IDs or promote another account. If both IDs match and the database simulation is true while the browser RPC is false, inspect the served project's URL, session and RPC request before altering database rules. A SQL editor session without JWT claims normally has `auth.uid() = NULL`.

No live administrator credentials or privileged database connection are available in this workspace. Real `auth.users`/profile correspondence and a live login to the supplied account have not been independently verified. No production role, credential, account or farmer record has been modified. No database migration or policy change is proposed on the current evidence.

## Checks

```powershell
node scripts/check-admin-session.mjs
node scripts/check-admin-login.mjs
node scripts/check-admin-supabase.mjs
node scripts/check-poultry-context.mjs
node scripts/check-profile-browser.mjs
node scripts/check-admin-responsive.mjs
npm.cmd run build
```

These tests use isolated Supabase transport. The full-app administrator test uses the supplied ID/email and `role='admin'` only as fixture data, alongside six unchanged farmer roles; it does not create or authenticate a real account. It checks the actual App/Auth/Admin components, sections, refresh, logout, delayed farmer denial during admin login, delayed data after logout and farmer route denial. The helper suite checks trusted Auth IDs, concurrent verification, stale false/success, expiration, RPC failure versus denial, ID mismatch and bounded token refresh. A deployed login, real RLS and Vercel environment check remain necessary before claiming production access has been verified.
