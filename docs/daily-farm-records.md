# Daily farm records

The compact daily summary appears immediately after each farmer dashboard header. Full forms, status details, history and analytics are at `/daily-records`. The persistent header selection scopes records throughout the farmer workspace. The existing production, health and financial pages continue to show the same saved entries, and their recording actions open the central forms. Weight measurements now come from MySQL for growth analytics. See `poultry-selection-and-responsive-dashboards.md` for farm and poultry selection details.

## Database setup

From `backend`, run `node scripts/migrate_daily_records.js` with the existing database environment configured. The API also runs this idempotent initialization on first use. The database account needs permission to create tables and change `feed_inventory.quantity_bags` from integer to `DECIMAL(16,6)`. No farm records are deleted or seeded.

The migration adds `daily_records`, `daily_record_audit` and `farm_record_access`. Core production and financial entries are projected into the existing module tables in the same transaction. Water, weight and general activities live in the daily ledger. Read adapters include existing module records and exclude projections already represented by the daily ledger.

Existing module records are adopted into the ledger on their first authorized correction or deletion, retaining their IDs. Legacy live-bird sales retain a baseline because the previous sales API did not deduct birds; a correction changes only the difference from that baseline, preserving existing live-bird balances. Historical opening populations are reconstructed from the persisted current population and known movements, rather than inventing missing movement history.

## Farm access and permissions

The signed-in farmer's farm is available automatically. Additional independently persisted farms are available only with explicit `(user_id, farm_id)` grants in `farm_record_access`, managed by the database administrator. No self-service grant endpoint is exposed. Each selected farm must have its own existing verified subscription. Existing farm locations are not treated as independent farms, and this feature does not create farms or change flock/bird limits.

All paid plans and active trials can use core daily forms. Expired subscriptions can read historical entries but cannot mutate them. Reports and CSV exports use the saved plan capabilities; CSV export is also checked by the backend.

## Record and inventory rules

- Essential daily completion covers feed, mortality, water, health and eggs for eligible flocks. Weight, expenses, sales and general activities are optional and do not cause reminders. Farmers can explicitly confirm No Activity or Not Applicable, with a reason. Missing entries stay Pending, including missing mortality.
- Feed consumption equals supplied minus remaining; consumed feed is deducted from stock. The form explains that remaining feed stays in inventory. Quantities can be entered in kg or g; fractional bag balances are preserved.
- One immutable request key identifies a submission. A per-farm database lock and READ COMMITTED transaction prevent simultaneous retries from duplicating records or movements. Identical financial transactions are rejected. Corrections use an updated timestamp to reject stale edits.
- Mortality, live-bird sales, culling and same-type flock transfers update live birds atomically. Date-ordered validation prevents historical corrections from creating negative populations. Feed edits/deletions reverse the original movement before applying the replacement.
- Saleable egg stock is production less egg sales. Both farm and flock balances are validated by date. Corrections cannot invalidate existing sales. Opening egg stock must be recorded before eggs can be sold.
- Hen-day rates require an explicitly recorded laying-hen count. Legacy production without this count has no inferred lay rate. Damaged eggs are disjoint cracked, broken and other-unsellable counts.
- A sale stores revenue and dated payments separately. To collect a receivable, edit the sale and increase total payments received with the actual payment date. Only the additional receipt is attributed to that day; the original revenue date and bird/egg movement remain unchanged. Reducing a mistaken payment total reverses receipts from newest to oldest.
- Completed health activities share the medication/vaccination tables. Follow-up schedules appear under upcoming health activities. Withdrawal dates store entered information and do not produce dosage advice. Completed follow-ups prevent deletion of their source schedule.
- Dates default to the browser's local date. The server validates completed activity dates against its database calendar. Configure the application host and database to the farm's intended timezone.
- Audit entries retain actor, before/after snapshots and timestamps, including after deletion. CSV cells escape spreadsheet formula prefixes.

Local-only legacy browser weight records remain untouched in local storage; they are not silently attributed to an authenticated farm. Only persisted weight records enter the new analytics.

## Verification

From `backend`:

```text
node tests/dailyRecords.integration.test.js
node tests/dailyRecords.integration.test.js --browser
node tests/subscriptions.integration.test.js
```

The database tests create and drop only a randomly named test schema. Browser checks use installed Chrome, start an isolated Vite server and verify desktop/mobile dashboard prominence, form submission, saved summaries, reload persistence and absence of runtime exceptions. Screenshots are written to ignored `.ui-checks/`.

From the repository root, run `npm run build` for the production bundle.
