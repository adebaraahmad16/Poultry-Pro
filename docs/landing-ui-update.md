# Landing page and advertising removal

The Basic plan keeps its white theme. Pro uses #EFF6FF with #2563EB controls and #93C5FD border; Enterprise uses #172554 with #FACC15 accents, white headings and #CBD5E1 secondary text. The shared PlanCards component renders these identities on landing, billing and admin pages using the existing server catalog. No catalog values or financial records were changed.

The hero, benefits and final CTA use distinct, locally hosted poultry photographs. Responsive WebP versions are 768/1600 pixels wide, with JPEG fallback and solid section backgrounds if both formats fail. Only the hero loads eagerly. Author, source, license and derivative notices are available at /images/poultry/credits.html and linked in the footer.

Removed advertising: top banner, hero ad, sponsored grid, advertiser CTA, navbar/footer links, admin sidebar item and page route, dashboard metric, context state/actions, service methods and ad constants/components. Inspection found no advertising endpoints, services, tables or dependencies in the backend. Existing local ad-storage values and any historical audit entries are left intact and unused. No records were deleted and no database migration was needed.

Updated landing and admin-shell components use local SVG icons; unrelated pages retain their existing implementation. No gradients are used in the updated UI.

Validation: production build, shared pricing-card rendering checks, and headless Chrome at 390px, 768px and 1440px. Browser checks cover exact theme colours, images, overflow, annual toggle, absence of advertising, admin edit/view subscribers controls, and runtime exceptions. Review screenshots are generated into .ui-checks/ (ignored by git).

To reproduce assets, run scripts/download_poultry_images.py, then scripts/prepare_poultry_images.mjs with Chrome installed. Downloads need network access. To reproduce browser checks while frontend and backend are running, run node scripts/check_landing_browser.mjs. The browser test uses an isolated profile and a temporary locally signed admin session; it does not change plan data.


## Hero and Poultry Types refinement

The Hero now uses equal desktop columns with the existing photo, dark solid overlay, headline/description, working Get Started and Explore Features links, and three compact management benefits. Its right column contains an illustrative representation of the existing farm overview, clearly labeled as example data, plus flock/health/financial feature highlights. No live farm statistics are claimed.

Only the landing-page poultry list filters out the quails identifier. The shared poultry registry, farmer pages and backend remain unchanged. Eight equal-height cards use one column on mobile, two from 768px and four from 1024px, with a distinct locally hosted African poultry photograph, light solid overlay and the existing registration link. Photo credits include the new CC BY-SA 4.0 image by Emmanuel Ssekaggo. Navigation, subscriptions and other landing sections are unchanged by this refinement.
