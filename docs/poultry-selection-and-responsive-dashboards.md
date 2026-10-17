# Poultry selection and responsive dashboards

The active poultry type now belongs to `FarmContext`. `PoultryContext` exposes that state rather than maintaining a second preference. The header offers farm and poultry selectors on every farmer page; overview type buttons use the same selection.

## Selection and records

- `shared/poultryScope.js` resolves stable IDs and flock names consistently, including Turkey and Cockerel. Both client scoping and backend queries use this mapping.
- Only the type preference is persisted under `poultrypro:poultry:<authenticated-user-id>:<farm-id>`. The old global preference is not reused across accounts. Preferences are validated after the selected farm finishes loading, so an initial empty response cannot overwrite a valid Turkey preference.
- Farm changes retain the current type when it is available on the new farm. Otherwise the selection becomes the sole available type or the all-poultry overview. Invalid or removed type preferences are overwritten with the valid selection. Logout and account changes cannot reuse another user's key.
- Each farm snapshot is fetched from authenticated backend endpoints. Snapshot responses are discarded when the account or selected farm changes. The shared `useFarm` hook filters flock, egg, mortality, health, weight, daily-record, financial and report data by the active type. Existing methods such as `scopedDataFor`, `computeTypeStats`, and subscription checks remain available.
- Requests carry `X-Farm-Id` and `X-Poultry-Type`. The backend verifies farm access against the signed-in owner and explicit farm grants before changing scope. Type-specific module queries and the daily-record endpoint filter records consistently. Creation rejects a flock belonging to a different selected type. Authentication identity remains tied to the original signed-in user when switching farms.
- Feed consumption is scoped by its flock. Feed stock is shared farm inventory and is clearly labelled separately. Farm-wide expenses or sales explicitly attributed to a poultry type remain with that type; unallocated farm-wide transactions appear in the all-poultry view.
- Database calendar dates are formatted without converting midnight to UTC, avoiding previous-day shifts in Nigeria's timezone.

## Dashboard and layouts

The overview's daily section contains four compact metrics, completion progress, the selected type, and links for Add Record and View All Records. It contains no entry form, activity table, or history. The full Daily Records page retains all nine categories, corrections, confirmations, audit details, filtered history, exports, and performance analytics.

Farmer and admin layouts use shrinking workspace columns, contained scrolling tables, responsive chart viewports, bounded notification panels, scrollable modals, and mobile navigation drawers. Drawers close on navigation, close-button use, outside click, or Escape. Existing icon imports now use the project's local SVG set; no Lucide imports or gradients remain in `src`.

Reports now render saved records from the selected poultry scope, with real date filters and permitted exports instead of placeholder export content.

## Validation

From `backend`:

```text
node tests/poultryScope.integration.test.js --browser
node tests/dailyRecords.integration.test.js --browser
node tests/subscriptions.integration.test.js
```

The poultry suite uses a disposable MySQL schema with distinct Broiler, Layer, Turkey and Cockerel records. It checks API filtering, incorrect-flock rejection, authorized and unauthorized farm changes, valid/invalid preferences and account isolation. Chrome checks persistent selection across pages and refresh, relevant form options, compact overview summaries, empty states, and responsive farmer/admin routes and subscription tabs at 320, 390, 768 and 1440 pixels. Screenshots go to ignored `.ui-checks/`.

Run `npm run build` from the repository root for the production bundle.
