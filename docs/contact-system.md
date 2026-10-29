# Contact system deployment and verification

The implementation uses the existing Supabase profiles, `is_admin()` role check, and notifications table. It does not use the legacy MySQL backend or browser storage for enquiries. Existing local admin sessions alone cannot authorize contact database access; a Supabase administrator session is required.

## Deployment

1. Apply `supabase/migrations/20261029_contact_messages.sql` after the existing schema migrations. No existing enquiry table was found in repository migrations. Verify the remote schema before applying if it has changes outside this repository.
2. Set the Edge Function secret `CONTACT_ALLOWED_ORIGIN` to the exact frontend origin, without a trailing slash (for example your production HTTPS origin). The function fails closed without it. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` inside the function; never put the service key in frontend variables.
3. Deploy `submit-contact` using `supabase functions deploy submit-contact --no-verify-jwt`. Public enquiries do not require login. `supabase/config.toml` records this requirement.
4. Official email and WhatsApp links are centralized in `src/config/supportContact.js`. The confirmed email is `ahmadadebara04@gmail.com`; WhatsApp displays `08109606739` and uses international number `2348109606739` in chat links. All public pages and official CMS support fields use this configuration; old `VITE_SUPPORT_EMAIL` / `VITE_SUPPORT_WHATSAPP` overrides are no longer used. Personal administrator contacts, login credentials, notification-delivery settings, and enquiry senders remain independent.
5. Build and deploy the frontend. Existing Vercel SPA rewrites support refreshing `/contact` and `/admin/contact-messages`.

## Behavior

- Public submissions go only through the Edge Function. Validation, a honeypot, five submissions per hour per IP and email, and UUID retry deduplication protect the endpoint. Client addresses are hashed before persistent rate-limit storage. Deployment must retain Supabase's trusted forwarding headers; verify IP attribution in the target gateway. CORS/origin checks are an additional restriction, not the rate limiter.
- The database function writes the enquiry and one admin notification atomically. A repeated request ID returns success without inserting a duplicate. Anonymous and authenticated browser roles cannot call it directly.
- Retries must have the same content as the original request. Editing the form generates a fresh request ID. Request bodies are limited to 64 KiB while streaming, with validation repeated inside the database function. Expired rate-limit buckets are removed during submissions.
- Contact RLS permits only existing administrator roles to select or update. Browser updates are restricted to `status` and `is_read` columns.
- Opening a message leaves read status unchanged. Explicit read/unread buttons update only `is_read`; resolution buttons update only `status`. Email replies open the administrator's mail application and do not claim delivery.
- Sidebar and overview counts use exact database counts. Unread queries filter only `is_read=false`. Counts poll every 15 seconds, refresh on browser focus, and refresh immediately after successful message updates. Lists are paginated server-side.
- Contact notification read actions update only the notification. Viewing the linked enquiry changes neither its notification nor enquiry read status. Existing broadcasts and support tickets remain separate and intact.

## Verification

Run `node src/services/__tests__/contactService.test.js` and `npm run build`. The Node test covers server validation, all six read/resolution combinations, unread counts, status independence, failed writes, and refresh routing using a database double.

Run `supabase/tests/contact_messages.sql` through a staging SQL connection to verify actual database defaults, atomic retry behavior, rate limiting, status independence, and anonymous/non-admin access. It rolls back test writes. This SQL suite has not been run from the workspace.

## Workspace verification (29 October 2026)

- Production build passed (`npm.cmd run build`).
- Contact service and validation tests passed, including bounded request bodies, Unicode messages, failed submissions, rejected invalid updates, and the six read/resolution combinations.
- A read-only request to the configured Supabase project returned `404 / PGRST205` for `contact_messages`: the migration is not deployed there. The existing notifications endpoint is present. No remote records were written or changed.
- No Supabase CLI or PostgreSQL client is installed. No privileged Supabase connection was available through the configured app client. Apply the migration and deploy the function before treating public submissions as operational.
- The broader Node service run passed four test files; `backendAvailability.test.js` and `subscriptionExpiration.test.js` fail when importing the existing Vite-only `import.meta.env` usage in `supabaseClient.js`. That module was not changed by this contact work.
- Rendered support-card checks passed for full-card email and WhatsApp links, prefilled subject/message, new-tab security, and wrapping layout classes. Browser interaction and mobile visual checks have not been run. Official contacts now use the business-confirmed centralized configuration.

Before release, test a deployed submission from desktop and mobile; check that another administrator sees the enquiry and alert within 15 seconds; test all filters and both read-state controls; verify notification read independence, confirmed mail/WhatsApp links, and unauthorized access. Confirm the existing farmer dashboard, subscription flow, and administrator login in the target deployment. Browser interaction, live database authorization, and deployed Edge Function delivery require environment access and are not established by the production build.
