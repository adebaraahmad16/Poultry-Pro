# Farm and poultry context lifecycle

`App.jsx` already uses the correct hierarchy: AuthProvider → FarmProvider → PoultryProvider. That order is preserved. FarmProvider always renders its context provider, including while authentication or farm records are loading. Loading data therefore must not be represented by an absent context.

The old `useRawFarm()` returned React's undefined default outside its provider, producing the reported property-access error. It now checks the provider boundary and reports the wiring problem explicitly. PoultryProvider consumes the actual farm contract rather than silently substituting an empty context. During legitimate loading, FarmProvider supplies an empty list of available types and the `all` selection until loaded records match the authenticated user and farm. All existing context fields remain exposed.

The module-level service scope setter changed external state during rendering. Service synchronization and preference writes now run in effects. Selection callbacks validate against current farm types and avoid redundant state updates; refresh state updaters no longer write storage. Preference reads/writes tolerate blocked browser storage. Account changes clear only in-memory state, never database records. The selected farm is associated with the account that selected it, so another account cannot inherit that farm or its types. A saved unavailable type is rejected and restored using the existing valid-selection rules.

Available type discovery handles null/empty collections and both normalized `poultryTypes` and database-shaped `poultry_types`. Turkey/broiler record filtering continues to use existing flock IDs and canonical poultry types. All Poultry remains available. Removing the farm object's identity from refresh dependencies avoids reloading solely because a response supplied a new farm object.

Full-app testing also exposed a refresh loop: fetching notifications cached them with the generic storage mutation event, which queued another entire farm refresh. Notification cache writes are now quiet; explicit notification actions retain their existing dedicated update event. Farm mutations still refresh farm data normally.

## Checks

```powershell
node scripts/check-poultry-context.mjs
node scripts/check-profile-browser.mjs
node scripts/check-dashboard-saves.mjs
node src/services/__tests__/contactService.test.js
npm.cmd run build
```

The poultry test bundles the actual App, AuthProvider, FarmProvider, PoultryProvider, login page and dashboards in React StrictMode. Only the Supabase transport is replaced with controlled test data. It covers signed-out startup, login, paused record loading, turkey/broiler separation, All Poultry, navigation, browser refresh, invalid preferences, account changes, empty/null types and absent farms, blocked preference writes, and stable request counts. It checks runtime exceptions and React render/hook warnings. Artifacts are in ignored `.ui-checks/poultry-context/`.

These are isolated integration checks, not a production Supabase login. No database tables, RLS policies, farm records, subscriptions, account credentials or stored farmer data were modified. No migration is required for this fix.
