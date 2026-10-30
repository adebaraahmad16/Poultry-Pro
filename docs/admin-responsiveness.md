# Admin responsive interface

The existing admin routes and business logic are retained. No database migrations, RLS changes, administrator credentials, subscription prices, or farmer dashboard changes are part of this update.

- The desktop sidebar still collapses. Below 1024px, a separate expanded drawer uses 85% of the viewport, capped at 320px. It closes on navigation, backdrop clicks, Escape, and switching to desktop. Focus is contained and restored, and background scrolling is locked while open.
- The header keeps 44px controls, a compact page title on phones, and safe-area spacing. Existing alerts, profile actions, search, and desktop branding remain available.
- `ResponsiveRecords` presents existing table rows as labeled cards below 1280px. It retains one set of records and action handlers. The shared table keeps search, filters, pagination, and adds an accessible sort selector. Bespoke subscriber, trial, administrator, report, and endpoint tables use the same presentation. Long names and references wrap.
- Overview cards use one column on the smallest screens, two where readable, and four on wide desktops. Long metrics scale to their card width without changing their numeric values.
- Settings and subscription sections use labeled selectors on phones and wrapping navigation on larger screens. Plan cards stack when the admin workspace is too narrow for three readable cards.
- `AdminDialog` provides bounded internal scrolling, a sticky accessible close control, focus containment/restoration, Escape dismissal, and nested scroll locking. Admin confirmation dialogs opt into this shell; the shared confirmation provider's default farmer presentation is unchanged.
- Contact read/unread state and resolution remain independent. Notification state remains separate. Successful contact edits use the existing refresh event, without a duplicate statistics request.
- Chart series and calculations are unchanged. Existing gradients are replaced with flat fills; chart animations are disabled and keyboard accessibility is enabled.

## Checks

Run:

```powershell
node scripts/check-admin-responsive.mjs
node src/services/__tests__/contactService.test.js
node scripts/test_subscription_ui.mjs
npm.cmd run build
```

The browser checker uses the installed Windows Chrome executable, existing build dependencies, and isolated fixture records. It bundles the actual admin components, substitutes test contexts/database responses, and blocks external HTTPS requests. It does not sign in as a real administrator, modify real records, or test live Supabase policies.

The matrix covers all 17 sidebar routes, every settings/subscription section, and admin dialogs at 320, 375, 425, 768, 1024, 1280, and 1440px, plus 900×425 and 768×375 landscape layouts. Assertions cover document/dialog overflow, close-button visibility after scrolling, focus retention, nested dialogs, all sidebar links, drawer dismissal/collapse behavior, search/filter/sort/pagination, and independent contact/notification state and unread badges. Screenshots and the machine-readable report are written to the ignored `.ui-checks/admin-responsive/` directory.

Existing deployment requirements for contact storage and its submission function still apply; see `docs/contact-system.md`. Production authentication, live permissions, real payment operations, and physical-device keyboards require checks in the deployed environment.
