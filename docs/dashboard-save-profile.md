# Dashboard navigation, saves, and shared profiles

The existing AuthProvider owns the canonical profile. `useProfile()` exposes that state without another profile query. Confirmed writes update the header and settings together; failed writes preserve the draft. Account changes clear the previous profile, and late responses cannot publish another account's information. Browser storage is a display cache, not the persistence layer.

Both nested dashboard layouts remain mounted. Sidebars retain their scroll positions, including after mobile drawer reopening; route changes reset content scroll. Save handlers prevent simultaneous submissions and await confirmed database results. Inventory, tasks, notification preferences, and administrator configuration now use database persistence. Partial flock updates preserve unrelated fields.

## Deployment required

Review and apply `supabase/migrations/20261030000100_dashboard_persistence.sql` in staging first, after existing migrations. It adds settings persistence, missing operational fields, profile privilege protection, and atomic inventory/mortality/payment functions. It does not change plan prices or delete records. This SQL has not been executed from this workspace.

The read-only schema check found missing `app_settings`, `profiles.account_status`, and inventory/health fields in the configured project. Those saves require migration and live testing. Run `node scripts/check-dashboard-schema.mjs` afterward.

Avatar uploads reuse the existing bucket selected by `VITE_PROFILE_AVATAR_BUCKET` (default `avatars`). Confirm it exists. Review `supabase/optional/profile_avatar_storage_policies.sql` against the actual bucket and existing policies. No bucket or privacy setting was changed. Signed display URLs are refreshed; signed tokens are not stored as permanent avatar URLs.

Deploy `verify-admin-payment` with server-side `PAYSTACK_SECRET_KEY`, Supabase service credentials, and `APP_ALLOWED_ORIGIN` (or `CONTACT_ALLOWED_ORIGIN`). Never expose secrets as Vite variables. Verification checks transaction success, original order amount/currency/reference, and the authenticated owner's email before atomic settlement. See [Paystack verification documentation](https://paystack.com/docs/payments/verify-payments/). No real payment was changed during development.

## Verification

```powershell
node scripts/check-dashboard-saves.mjs
node scripts/check-profile-browser.mjs
node scripts/check-admin-responsive.mjs
node src/services/__tests__/contactService.test.js
node scripts/test_subscription_ui.mjs
npm.cmd run build
```

The first three checks use isolated Supabase fixtures. Profile browser checks cover header synchronization, failure/draft preservation, stale requests, reload from fixture server data, sidebar persistence, seven viewport widths, and account switching. Admin browser checks cover 394 layout and interaction assertions. Fixture RPCs do not execute PostgreSQL or establish actual RLS correctness.

Release requires staging farmer/admin accounts: test operational create/edit/delete and reload, real avatar uploads, account switching, subscriptions, deployed contact submissions, payment verification, and denied cross-account access. Existing legacy support-ticket and administrator-invitation features were not converted into a complete backend in this change. No administrator credentials, user records, or live subscription prices were changed.
