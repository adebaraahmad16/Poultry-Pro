# Automated trial reminders

## Implementation

The existing `farm_subscriptions` row is keyed by `farm_id`, not a subscription `id`. Signup stores its actual `created_at` and `trial_ends_at`; these define the trial identity. Remaining days are `ceil((trial_ends_at - now()) / 86400)` using timestamp instants, independent of browser timezone. At exactly seven days the count is seven; seven days plus one second is eight.

`20261030000200_trial_reminders.sql` adds delivery tracking in `subscription_reminders` and minimal signed provider receipts in `subscription_email_events`. Neither is another notifications table. Existing subscriptions, prices, dates, authentication, and notification policies are retained. Existing unrestricted order creation is guarded against browser-supplied paid statuses; confirmed payments must come from the verified backend.

The queue transaction creates one tracking row and one unread row in existing `public.notifications`. The unique event key combines farm, farmer, original subscription creation time, and milestone. Extending a trial does not resend an already generated milestone; pending reminders with the old expiration are cancelled. Notification deletion/read status does not recreate reminders or alter email status. Trial expiration and confirmed paid-order activation have distinct unique events. Payment order confirmation and actual active subscription must agree; pending payments do not create activation confirmations. Historical activation emails are not backfilled by scanning old orders.

The daily SQL Cron job creates dashboard alerts even if email delivery is unavailable. A separate Edge Function worker runs every 15 minutes, checks milestones again, and retries due email jobs. The schedule works without farmer sessions. The worker uses row leases, `SKIP LOCKED`, persisted request bodies, provider idempotency keys, bounded batches, and exponential backoff. It checks subscription applicability before claiming and before persisting the send payload. Paid activation cancels pending trial emails while preserving delivered notifications. An external request already in flight cannot be recalled; its eventual outcome is retained.

Email addresses come from `auth.users`, names from `profiles`, and plan names from `subscription_plans`. The public Reply-To and support links reuse `src/config/supportContact.js`. The sender is a separately verified provider identity. Templates contain the actual expiration in UTC, the existing logo URL, plain text fallback, and an HTTPS link to `/settings/subscription`. The frontend countdown requires a subscription loaded from Supabase; it never invents dates from browser storage. It hides on active paid subscriptions. Browser-generated trial alerts have been disabled for Supabase accounts to prevent duplicate reminders. Existing farm/stock alerts remain.

Free Trial Management includes paginated delivery monitoring without another sidebar entry. It displays start/expiry, milestone, dashboard creation, email status, attempts, and errors. Existing farmer notification badges and dates are reused, with a Free Trial category and Upgrade Now actions. Polling/focus refresh supplements realtime and updates paid activation/countdown state.

## Deploy in staging

1. Apply existing migrations, then review/apply `supabase/migrations/20261030000200_trial_reminders.sql`. It does not enable jobs or send emails by itself. The first queue run includes currently due unpaid expired trials; review staging/production eligibility before enabling the schedule.
2. Configure backend secrets: `RESEND_API_KEY`, `SUBSCRIPTION_EMAIL_FROM` (a Resend-verified sender), `APP_URL` (the deployed HTTPS frontend origin), `TRIAL_CRON_SECRET` (a random secret of at least 32 characters), and `RESEND_WEBHOOK_SECRET`. Supabase supplies its server URL/service-role environment. Never put these secrets in `VITE_*` variables. The public Gmail support address is Reply-To, not an assumed authorized From address. Deploy `public/logo-email.png` with the frontend; it is a PNG rendering of the existing logo for email compatibility.
3. Deploy `trial-reminders` and `subscription-email-webhook`. Their JWT gateway checks are disabled because each endpoint performs its own backend-secret or raw-body cryptographic verification. Neither accepts a public API key as authorization.
4. In Resend, configure the webhook URL `https://<project>/functions/v1/subscription-email-webhook` for `email.delivered`, `email.bounced`, and `email.failed`; securely configure its signing secret. A successful send API response means **accepted**, not delivered. Signed receipts update actual delivery/bounce/failure status. Replayed and out-of-order receipts are safe, including receipts arriving before the send acknowledgement is saved.
5. Store `poultrypro_project_url` and `poultrypro_trial_cron_secret` in Supabase Vault through the secure dashboard. The latter must match `TRIAL_CRON_SECRET`. Then review/run `supabase/optional/install_trial_reminder_schedule.sql`. Cron uses UTC: daily dashboard queue at 09:00; email processing every 15 minutes. Named jobs are reused when the installation is rerun.
6. Inspect `cron.job`, `cron.job_run_details`, `net._http_response`, Edge Function logs, and Free Trial Management. Database-only scheduling is independent of provider configuration, but email worker configuration failures return HTTP 503 and remain visible in job/HTTP logs.

Only the backend can enqueue, claim, finish, or record provider events. Delivery tracking is read-only to authorized administrators under RLS. Existing farmer notification RLS continues to restrict recipients. Never disable RLS to troubleshoot deployment.

## Retries and operations

Resend keeps idempotency keys for 24 hours. Retries use identical canonical JSON and the same key. Automatic retry stops after 12 attempts or before the 24-hour window ends; ambiguous sends move to `needs_review` after 22 hours. Reconcile these with provider history before any manual resend. Do not simply reset a possibly accepted job to pending. Permanent provider rejection is `failed`; temporary rejection/timeouts are retried. No UI claims an email was delivered before a signed receipt.

Stale trial reminders are cancelled rather than sending an incorrect days-remaining message. Scheduler downtime longer than a milestone's one-day window does not backfill every missed milestone. Expiration remains a distinct once-only event. Already accepted emails cannot be unsent when a subscription changes. Tracking and delivered dashboard notifications are retained.

## Verification

```powershell
# Temporary test engine only; no runtime application dependency is added.
npm.cmd install --prefix .ui-checks/sql-engine --no-save --package-lock=false @electric-sql/pglite
node scripts/check-trial-reminders.mjs
node scripts/check-trial-ui.mjs
node scripts/check-admin-responsive.mjs
node scripts/check-dashboard-saves.mjs
node src/services/__tests__/contactService.test.js
node scripts/test_subscription_ui.mjs
npm.cmd run build
```

The reminder suite executes the actual migration in an isolated PostgreSQL engine, with controlled auth/subscription schemas and a simulated provider. It tests all milestones, expiry, activation, uniqueness, RLS isolation, backend-only RPC permissions, disjoint worker leases, stale acknowledgements, email-only retries, crash recovery/idempotent replay, provider receipts, retry cutoff, and signed-webhook tampering/replay rejection. It does not use real farmer dates or contact real email recipients. The UI suite exercises the countdown, farmer notifications, and admin delivery view at 320, 375, 425, 768, 1024, 1280 and 1440px.

Live completion still requires staging: install the jobs, use separate controlled trial farmers for each milestone, close all browsers, observe Cron execution and unread dashboard records, confirm real inbox receipt and signed delivered status, invoke repeated/overlapping runs, simulate a provider failure, and confirm paid activation stops pending reminders. Check farmer/admin permissions against deployed policies and existing payment activation. Real Cron execution, provider credentials, verified sender authorization and inbox delivery cannot be established by local tests. No production subscription records have been changed.

References: [Supabase scheduled Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions), [Resend idempotency](https://resend.com/changelog/idempotency-keys), [Svix signature verification](https://www.svix.com/guides/receiving/receive-webhooks-with-javascript-express/).
