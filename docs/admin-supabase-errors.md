# Admin notification and contact access fixes

## Confirmed responses

Zero-record requests against the configured Supabase project confirmed:

- `notifications.category`, `id`, `user_id`, `farm_id`, `title`, `message`, `type`, `time`, `is_read`, and `created_at` are queryable (HTTP 200).
- `related_entity_type`, `related_entity_id`, `priority`, and `action_url` return HTTP 400, PostgreSQL `42703`, with messages such as `column notifications.related_entity_type does not exist`.
- An anonymous contact request returns HTTP 401, `42501`, `permission denied for table contact_messages`. Its hint proposes granting SELECT to anon; **do not follow that hint** for private enquiries.
- An anonymous call to `public.is_admin()` returns HTTP 200 and `false`. The function exists and is callable. No authenticated production admin session was available in this workspace, so its live signed-in result and the deployed authenticated grants/policy definitions have not been independently established.

No remote records were read or written by these schema checks. The app's Supabase client already persists sessions, refreshes tokens, and uses its configured Auth storage key; those settings were retained.

## Root causes and implementation

Broadcast persistence queried/wrote columns absent in the deployed schema. It now creates and retrieves `category='admin_broadcast'`, using only confirmed columns. Existing text record IDs encode batch:recipient, allowing grouping and retry deduplication without adding metadata columns. Existing records are retained; standalone older IDs are displayed individually. Farmer notification normalization still presents broadcasts in System Announcements. Priority derives from the existing `type` field when no optional metadata exists.

AdminContext previously restored a cached administrator even when `supabase.auth.getSession()` returned no session. ContactContext treated that UI flag as authorization and polled private table counts. A cache or legacy Express token cannot authenticate a Supabase REST request, producing the confirmed anonymous 401/42501 response.

Supabase mode now requires completed shared Auth initialization, a current session, and a successful `public.is_admin()` call before enabling admin/contact data. The helper coalesces verification per access token, rechecks session identity after verification, and never exposes credentials. Login role handling accepts the same existing role names as the repository's is_admin definition. Legacy backend mode remains separate. Cached UI identities no longer authorize Supabase access.

Contact statistics share one in-flight request per administrator. The total count is checked first, so a table permission failure does not generate four identical denied requests. Valid calls retrieve exact total, unread, in-progress and resolved counts; unread filters only `is_read=false`. Providers/pages skip requests until ready, avoid overlapping polls/focus refreshes, skip hidden-tab polling, retain diagnostic errors, and stop automatic polling after authorization failures until an explicit retry or identity change. Broadcast loading runs independently of optional settings configuration.

Farmer notification writes/read updates also omit absent optional metadata columns. Existing optional metadata is still read when present; known alert routes derive from category/ID when it is absent. Contact alerts without stored association metadata open Contact Messages rather than an invalid `message=undefined` link.

## SQL and deployment

No RLS policy was disabled, no anonymous permission granted, and no profile role, administrator credential or existing record changed.

`supabase/diagnostics/admin_notification_access.sql` is a separate read-only audit for actual columns, authenticated grants, RLS policies and the existing is_admin definition. If a signed-in administrator still fails the verification, inspect its actual profile role and this audit before changing policies. The application displays the actual code/message; it does not substitute fake statistics.

The existing contact-submission SQL function also referenced missing notification metadata. Review/apply `supabase/migrations/20261030000300_notification_schema_alignment.sql` after the existing migrations. It replaces only that function, preserving validation, rate limits, atomic writes, request deduplication, existing grants and RLS. New contact alert IDs are `contact:<enquiry-id>` for a stable detail link without new columns. Existing unrelated notifications are untouched. The not-yet-deployed trial queue SQL likewise uses the verified minimal notification schema.

## Verification

```powershell
node scripts/check-admin-supabase.mjs
node scripts/check-dashboard-saves.mjs
node src/services/__tests__/contactService.test.js
node scripts/check-admin-responsive.mjs
node scripts/check-contact-schema.mjs
npm.cmd run build
```

`check-admin-supabase.mjs` runs actual admin/contact providers and services in Chrome, with a strict fixture rejecting the missing columns. It checks Auth initialization, cached-session rejection, actual is_admin gating, broadcast creation/retrieval despite settings failure, preservation/deduplication, all six contact states, coalesced requests, stopped permission retries, retry recovery, logout and non-admin isolation. It performs no live database writes. `check-contact-schema.mjs` executes the contact migrations and SQL tests against isolated PostgreSQL with the minimal notification schema, not a production database.

Final deployed validation requires an existing authenticated admin session: sign in, confirm is_admin returns true, load broadcasts and Contact Messages, verify counts and read/resolution independence, publish to controlled test recipients, and confirm zero recurring denied requests. The workspace cannot certify that production-session check without access to such a session.
