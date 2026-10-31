# Farmer pictures and Daily Records

## Profile pictures

The old settings input uploaded immediately, accepted 5 MB, offered no preview/removal, and assumed an `avatars` bucket. It stored a public URL even when Storage could be private. Missing bucket/owner policies cannot be repaired with a publishable frontend key.

The picture editor now previews before saving, validates actual JPEG/PNG/WebP headers and the 2 MB limit, checks browser image decoding, provides loading/error feedback and a guarded Save action, and supports replacement/removal. JPG and JPEG use the JPEG MIME type. A failed save keeps the preview and existing profile; cleanup removes only the newly uploaded unused object. Existing stored images are not deleted during replacement/removal: removal clears the profile reference after a confirmed database update.

Uploads use unique `<authenticated-user-id>/<uuid>.<extension>` paths with `upsert=false`. The existing `profiles.avatar_url` stores a stable `storage://bucket/path` reference. Existing HTTPS/Supabase public or signed URL references remain readable. Newly signed tokens are never stored as the permanent reference. Private images resolve to one-hour signed display URLs, refreshed by the existing shared Auth profile timer. The upload verifies readable access before reporting success.

AuthProvider remains the single profile source. The editor and dashboard header use `useProfile()` and the same circular avatar component. Server-confirmed changes update all consumers immediately. Broken/missing pictures show initials, and display failures remain visible in settings. Account switches invalidate pending previews/results.

## Storage setup: live access pending

The workspace's anonymous `listBuckets()` request returned an empty list. This does **not** establish that no private buckets exist. There is no authenticated staging Storage connection available here. No remote bucket was created or changed and no real farmer picture was uploaded.

Review/run `supabase/optional/setup_profile_images.sql` with a privileged SQL connection. It lists existing bucket metadata first and reuses a known private profile bucket. If other unrecognized buckets exist, it stops for review rather than creating a possible duplicate. With no existing buckets, it creates private `avatars`; an explicit bucket selection can also be supplied after review. Existing public buckets cause a clear stop rather than an automatic privacy change. The script sets limits for new uploads to 2 MB and the three supported MIME types, adds owner-folder policies, and retains unrelated existing policies and stored files. It refuses to proceed if Storage RLS is disabled.

Review overlapping existing Storage policies: PostgreSQL permissive policies combine with OR, so adding an owner policy does not narrow a preexisting broad write policy. The script prints policy metadata for review and does not silently drop existing policies. Test actual authenticated cross-user access before declaring production Storage secure.

Set `VITE_PROFILE_AVATAR_BUCKET` on localhost and Vercel to the selected bucket ID, then rebuild. If unset, the upload reuses the bucket referenced by the farmer's existing Supabase image, otherwise defaults to `avatars`. No bucket is created by React. No service-role credentials belong in Vite variables.

## Daily Records

The page remains an overview. Creation/editing stays in the dedicated dashboards. Eight equal-height summary cards use one column below 400px, two on phones/tablets where space permits, and four at the XL breakpoint. Long values use compact notation from one million upward, with the full value in the tooltip. Icons stay aligned, controls have touch targets, mobile history uses wrapping record cards, and desktop history retains a contained table. The loading skeleton matches the cards. Detail dialogs have a sticky, accessible close control.

Totals follow date, poultry, flock and category filters. Feeding reads the persisted `recorded_values.consumedKg` through the existing mapper; egg totals include broken/rejected eggs through `totalEggs`. Canonical poultry IDs replace incorrect singular/plural string matching. Dates use the existing local farm-date helper; This Month means the current calendar month. Medication summaries no longer invent missing dosages/durations. Weight activity is included when present. Pagination clamps to a valid page after filtering.

## Verification

### Investigating a live Storage HTTP 400

### Upload-to-profile persistence correction

The previous flow required signing the uploaded path before writing `avatar_url`.
A signing error therefore skipped the database write. Upload now checks Storage's
returned path against the requested owner path and saves the reference before
resolving a private image for display. A successful public HEAD response with an
image content type establishes that the exact URL is publicly readable; that URL
is persisted directly. Otherwise a permanent Storage reference is persisted and a
signed URL is used only for display. Signed URLs are never rewritten as public URLs.
Public references do not go through signing on reload.

The database must return the saved `avatar_url` before shared state is updated or
the editor reports success. A missing/read-denied object displays the default
avatar and a clear image-read error; background signing retries stop on that error.
Replacement deletes only the previous owned object after the new reference is
saved. Removal clears the database first and then removes the previous owned object.
Cleanup failures become warnings and do not undo the confirmed database change.

`supabase/optional/recover_uploaded_avatar.sql` is a separate, unexecuted recovery
for the exact existing object supplied in the report. It changes only the matching
empty profile reference, only when that object exists. It never overwrites a newer
avatar. An authorized operator can review/run it to recover that existing upload;
ordinary uploads through the repaired UI do not require this SQL.

`profileService` now retains Storage `status`, `statusCode`, `code`, and the original
message instead of treating every upload error as a bucket or RLS problem. The
picture editor displays that diagnosis and retains the selected preview for retry.
Upload, signed-image access, and profile-write failures are identified separately.
The SDK transport regression tests verify binary multipart uploads and errors for
missing buckets, disallowed MIME types, excessive size, permissions, collisions,
and expired JWTs. They make no live Storage requests.

Use the failed POST's Network response body to identify the deployed failure.
Run `supabase/diagnostics/avatar_upload.sql` for read-only bucket, MIME/size,
Storage policy, privilege, and profile-column inspection. A zero-row bucket result
in the SQL editor establishes absence; an anonymous bucket-list result does not.
Do not apply the optional setup script or change an existing bucket's privacy or
policies merely because a request returned 400. The authenticated failure response
and deployed bucket/policy inspection are still required for a confirmed live fix.

```powershell
node scripts/check-avatar-daily-browser.mjs
node scripts/check-avatar-storage.mjs
node scripts/check-dashboard-saves.mjs
node scripts/check-profile-browser.mjs
npm.cmd run build
```

The full-app browser workflow uses actual App/Auth/Farm/settings/header components with isolated Supabase/Storage transport. It checks valid formats, preview before upload, loading, failed-save cleanup/retry, change/removal, refresh/login persistence, default avatars, data totals, filters, table pagination, sidebar/detail interactions, and 320/375/425/768/1024/1440px layout. Images and screenshots remain in ignored `.ui-checks/avatar-daily/`.

The Storage SQL test executes the actual setup against isolated PostgreSQL: private creation/reuse, idempotency, limits, owner-folder INSERT/SELECT/UPDATE/DELETE policies, cross-user denial, and public-bucket refusal. This does not establish the deployed project's existing policy definitions or verify real Storage HTTP delivery. Live upload/read/reload/login must be verified after the selected bucket and policy setup is configured. Farm records, subscription logic, accounts, and application database tables are unchanged.
