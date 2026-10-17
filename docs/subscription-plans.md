# Subscription catalog deployment and validation

The catalog is stored in MySQL `subscription_plans`. The only initial business configuration is `shared/subscriptionPlans.js`; rows are inserted only when absent. Landing, registration, billing, and admin use `/api/subscription/plans`. No browser edits or local storage values publish plan changes. The shared cards show derived feature text, actual limits, billing prices, and calculated annual savings. Pro is recommended by its immutable identifier.

## Existing configuration reconciled

Prices already matched the requested ₦2,500/₦5,000/₦12,000 monthly and ₦25,000/₦50,000/₦120,000 annually. Differences corrected:

- Professional is now displayed as Pro; Basic was still displayed as Starter in billing, onboarding copy and admin summaries.
- All three descriptions now use the requested descriptions.
- Enterprise's simulated limits (999 flocks/staff/types and 1,000,000 birds) are replaced with JSON `null`, meaning unlimited.
- Browser admin data, farmer constants, hardcoded billing cards, and backend limits previously operated independently. All now derive from the persisted catalog.
- Annual savings are calculated per plan, so price edits cannot leave a fixed 17% claim behind.
- Client-declared subscription tiers and synthetic successful payments no longer grant backend access.

Identifiers remain `basic`, `professional`, `enterprise`. Historical `starter`/`FREE` aliases resolve to Basic, and the historical uppercase `PRO` identifier still resolves to Enterprise. Newly selected Pro uses `professional`; do not relabel historical IDs based on displayed names.

## Local development

Run `npm.cmd run dev` from the project root to start both Express (port 5000) and Vite. The launcher waits for the backend health endpoint before starting the frontend and reuses an existing PoultryPro backend on port 5000. Closing the launcher stops only the child services it started. For separate terminals, use `npm.cmd run dev:backend` and `npm.cmd run dev:frontend`.

`ERR_CONNECTION_REFUSED` for localhost:5000 means the backend is not listening. After it starts, a 401 response means the connection works but the browser needs a verified server login; see the migration instructions below for older browser-only accounts.

## Server configuration

Keep the existing MySQL variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). In `backend/.env`, configure:

```dotenv
JWT_SECRET=<a long random server secret>
ADMIN_EMAIL=<administrator email>
ADMIN_PASSWORD_HASH=<bcrypt hash of administrator password>
PAYSTACK_SECRET_KEY=<Paystack server secret>
FRONTEND_URL=https://your-frontend.example
```

Do not put server credentials in Vite variables. Generate the bcrypt hash with bcryptjs using an operator-controlled password. The old demo admin shortcut cannot authorize catalog writes. Start the backend from its directory (`npm start`) so its `.env` is loaded. Use the existing `VITE_API_BASE_URL` for the frontend.

The existing database schema must already be initialized. Subscription tables are created non-destructively on first access; the database account needs CREATE TABLE permission. Startup does not delete accounts, subscriptions, payments, or stored browser history. New trials are granted only by successful server registration. Existing subscribers keep their agreed price; a new checkout uses a new server quote. Paying a previously issued quote retains that quote's price. Limit edits apply immediately to existing entitlements; over-limit records remain intact and additional creation is blocked. Downgrades require usage to fit the destination plan.

Paystack checkout is hosted by Paystack. Initialization and verification happen on the backend; verification checks payment status, exact quoted amount, NGN currency, reference, account ownership and customer email. Reference fulfillment is transactional and idempotent. Automatic renewal preference alone never extends paid access. Recurring off-session charging/webhooks are not implemented by this update; customers renew using verified checkout.

## Migrate browser-only accounts before switching login

The original login did not verify passwords, and browser subscription records had no authoritative server identity. These cannot be safely accepted as proof of a paid subscription. Preserve a backup/export from each original browser, verify ownership and paid terms, then run the operator import from `backend`:

```powershell
$env:MIGRATION_PASSWORD = '<unique temporary password for this account>'
node scripts/import_legacy_subscriptions.js C:/secure/reviewed-account.json
Remove-Item Env:MIGRATION_PASSWORD
```

Import one browser-only account at a time with its own password. Existing server users retain their password hash. The JSON file is an array:

```json
[
  {
    "user": { "id": "original-user-id", "name": "Farmer", "email": "farmer@example.com" },
    "farm": { "id": "original-farm-id", "name": "Original farm", "poultryTypes": ["broilers"] },
    "subscription": {
      "planId": "BASIC",
      "status": "active",
      "billingCycle": "monthly",
      "agreedPrice": 2500,
      "renewalDate": "2026-11-01T00:00:00.000Z",
      "trialEndsAt": "2026-10-01T00:00:00.000Z",
      "paymentHistory": []
    }
  }
]
```

Use actual original values. Trial accounts require their original trial end, and paid accounts require a verified agreed price and original renewal date. The importer skips existing server subscriptions and stores the full original subscription JSON, including history, without overwriting it. It never generates a fresh trial. Choose the correct preexisting farm ID (`farm-101` in the original single-farm backend) to retain ownership of existing database flocks. Browser-only farm production records require separate reviewed data import; the importer does not claim to migrate unrelated production data.

## Checks

```powershell
npm.cmd run build
node src/services/__tests__/subscriptionExpiration.test.js
node scripts/test_subscription_ui.mjs
cd backend
node tests/subscriptions.integration.test.js
```

The integration test creates a random isolated `poultrypro_test_<uuid>` database and removes only that database in `finally`. Its database user needs CREATE/DROP DATABASE privileges. It overrides auth settings only within the test process and mocks Paystack; no actual payments are made. It does not alter the configured application database or existing catalog.

Before production rollout, test a Paystack sandbox checkout/return with the real configured server and browser, and review the migration backup. Automated checks do not replace a live provider or visual browser check.
