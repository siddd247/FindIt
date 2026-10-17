# Final college build audit

Reviewed 2026-10-17. Scope: the executable Node/SQLite application, public assets, owner/admin portals, catalogue allocation, tests and build lifecycle. Retained hosting/framework assets were inspected as separate scaffold; they were not silently removed or claimed as a deployed service.

## Outcomes by pillar

| Pillar | Result and evidence |
| --- | --- |
| Presentation | Public store-price labels now use Estimated Store Price (INR) and Market Indicative Price (INR). Store catalogues have a canonical /catalogues route; /simulation redirects for compatibility. Public wording no longer describes prices as generated estimates. Stock evidence is still distinguished from indicative prices. Historical audit records and internal provenance are retained. |
| Dataset | 918 variants / 164 models, all in the designated 11 categories. Zero duplicate model/spec combinations, zero duplicate slugs, no foreign-key violations, integrity_check=ok. All 32 active shops retain their 29,376 catalogue assignments and distinct bounded store prices. No SKU or reference price was changed. |
| Authentication | Separate admin and owner cookies remain. Legacy admin-role users are denied owner sessions. Removed unreachable legacy admin GET/POST handlers, dashboard, first-account-admin branch and redundant handlers. Argon2id/scrypt, hashed sessions, same-origin writes and throttling remain. npm start enables active authenticated-owner registration; anonymous suggestions still require review. |
| UI and filters | Catalogue comparisons now obey area/pincode and coordinate radius. Distance filters exclude unknown pins. Inverted/invalid price ranges return clear errors; explicit false booleans do not enable stock filters. A single eligible Best price is selected after filtering without changing pair prices. Saved theme loads before CSS. Blur/Escape dismiss suggestions; initial ArrowUp selects the last option. Password visibility and admin form isolation are regression-tested. Repeated shop Maps controls were removed. |
| Hygiene | Removed the dead legacy admin interface and controller paths, obsolete import/parser handlers, duplicate pagination click handler, component preview route and 13 unused CSS rules. One shared live database connection is passed to handlers; no connection pool is needed for synchronous SQLite. Added WAL busy timeout, graceful signal/IPC shutdown, dynamic test ports and verified scratch cleanup helpers. |
| Startup | npm start launched the review instance at http://127.0.0.1:3005 with empty stderr. Built runtime compilation/module/HTTP checks pass. 56 public-route HTTP checks cover every active shop, every category and shared page assets; actual client-module search checks cover phones, laptops, chargers and an area-restricted query. Browser-console certification is not possible from module checks. |

## Database migration and preservation

Before modification, created verified SQLite, SQL and manifest backups at:

    backups/before-modifications-2026-10-17T10-31-54-271Z.sqlite
    backups/before-modifications-2026-10-17T10-31-54-271Z.sql
    backups/before-modifications-2026-10-17T10-31-54-271Z.json

SQLite backup SHA-256: a8f2f53486e1549e47bfb7465d0267ee2f14def6b6a2b9baa0cb5712ea3052ce.

Migration 003 creates sessions_active_owner, listings_shop_product_active, products_category_active, reports_listing_created and shops_active_area. These are non-unique query indexes. It changes no records and preserves earlier migrations. Before/after canonical digest of all shop, product, user and admin rows was identical: 2f1afe19516b9e63512679dcea02f7218f2cf76898a997c036a714309d6cc934. No destructive catalogue deduplication was needed. Schema rollback handles the added indexes.

## Remaining data and verification limits

- Actual inventory observations total zero. Administrative catalogue assignment is not a stock observation; the Confirmed Stock view retains that distinction and links back to populated store comparisons.
- All 32 opening schedules, 19 phone numbers and one pincode remain missing. The existing sourced 181133 postcode is outside the requested numeric interval. These were not overwritten with invented details. Admin hour editing is now supported and validated.
- One legacy admin-role user remains preserved in the users table, but cannot authenticate as an owner. The actual administrator uses the separate admins table.
- Real browser screenshots, physical device layouts, screen reader checks and browser-console error collection remain unverified because browser diagnostics are blocked in this environment. Module/handler checks are not represented as browser tests.
- Full ESLint execution is unavailable: npm run lint reports that eslint is not installed in this checkout. Native module syntax validation and build checks pass; no lint certification is claimed.
- Automatic approval review rejected recursive removal of 178 historical scratch directories under .local because sandbox approval is disabled. They were retained. New tests and build checks await clean server exit and delete only their own verified temporary paths; shutdown regressions assert no remaining WAL/SHM files.
- Existing hosted framework scaffolding/dependencies remain separate and unverified. This local review neither publishes a site nor supplies production hosting/email services.

## Files altered or added

- README.md
- docs/PROGRESS.md
- docs/RELEASE-AUDIT.md
- local/admin-api.mjs
- local/admin-auth.mjs
- local/discovery.mjs
- local/migrate.mjs
- local/migrations/003_release_indexes.up.sql
- local/server.mjs
- local/simulated-stock.mjs
- package.json
- scripts/audit-local.mjs
- scripts/build-local.mjs
- scripts/runtime-checks.mjs
- scripts/start-local.mjs
- tests/admin.test.mjs
- tests/api.test.mjs
- tests/browser-qa.mjs
- tests/helpers/runtime.mjs
- tests/preview-routing.test.mjs
- tests/release-audit.test.mjs
- tests/replace-catalogue.test.mjs
- tests/shop-pricing.test.mjs
- tests/simulated-stock.test.mjs
- tests/ui-runtime.test.mjs
- web/admin.mjs
- web/app.js
- web/index.html
- web/maps.mjs
- web/public-content.mjs
- web/shop-pricing.mjs
- web/simulation.mjs
- web/styles.css
- web/sw.js
- web/theme.js

No tracked files were deleted. Removed code and CSS are described above; historical scratch-directory deletion was rejected and did not run.

## Final validation result

All 56 automated tests passed. The final compiled local build passed module validation and isolated HTTP smoke checks; git diff --check passed. Startup regression captured no server stderr and asserted clean WAL/SHM removal after shutdown. Actual browser console/layout verification and ESLint remain unverified as described above.
