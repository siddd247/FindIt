# Execute-prompt progress

Run date: 2026-10-16. Follow `docs/EXECUTE-PROMPT.md`, not the old root progress file's build order.

## Additional catalogue and Jammu research batch

Latest user request: expand the last two years of phones/laptops/appliances, specifically include older M2–M5 Mac variants, research shops independently, and locate bulk datasets. Random product assignments to real shops were not represented as stock: research imports create zero inventory rows. No account/password or owner data was reset.

- Added **118 sourced model/configuration records**, total **351 active catalogue entries**. Includes 28 MacBook Air/Pro size/chip combinations across M2–M5, seven current HP Victus India SKUs with factual CPU/RAM/SSD/GPU/display summaries, additional Samsung A/S/Z phones and three explicitly documented Fold7 memory/storage combinations, 46 additional OPPO models, Lenovo LOQ/Legion/IdeaPad, Acer Nitro regional SKU, Redmi/realme models, and Samsung appliance records. This is an expansion batch, not every worldwide SKU or build-to-order combination. Unknown generation/configuration/year/details remain unknown. Acer's Canadian SKU is labelled regional; older Macs are explicit history exceptions.
- Added official indexed Reliance Jewel Chowk and Kunjwani store records, total **32 researched shops**. Source evidence is online only; Jewel phone/hours remain unknown. Existing owner-submitted shop remains separately preserved. An administrator account now exists and was preserved; run `node scripts/admin-url.mjs` for the private sign-in URL and use the credentials chosen during setup.
- Added reviewed-batch importer with dry-run, approved manufacturer hosts, factual summaries/SKUs/year metadata, audits and source checks. Invalid rows block product writes; repeats skip duplicates and archived models. It rejects local stock, shop and price fields. Backup before the batch: `backups/before-modifications-2026-10-16T12-19-52-914Z.*`, integrity `ok`.
- Product pages now show available manufacturer details, configuration scope, year, SKU and source. Exclusive-brand stores are excluded from unrelated single-brand queries. Search handles `14-inch` while preventing numeric/model-code substitutions such as M4→M5 or Reno14→Reno13.
- Bulk research: Open Icecat offers participating-brand content with account/licence requirements; broader coverage is a separate offering. A repository advertising 992 laptop records has conflicting README/LICENCE claims and December 2025 coverage. Kaggle advertises 6,620 phone records but readable licence/data were unavailable; a 443 MB Hugging Face dataset could not be validated. No third-party bulk data was silently declared manufacturer-verified.
- `scripts/download-laptop-research.mjs` was executed; all three public text/CSV fetches failed with environment network `EACCES`. Report is `.local/research-datasets/download-report.json`. No bulk dataset was downloaded/imported and no repository code was executed. The script remains available for a normal terminal with network access. See `docs/DATA-SOURCES.md` for links and limits.
- **36/36 automated tests pass; runnable build passes.** Added idempotency/archive preservation, source/year/stock rejection, escaped factual details, exclusive-store eligibility and exact numeric/model generation tests. One new search assertion initially failed and exposed the pre-existing substring shortcut; fixed and full suite rerun successfully. Browser/mobile/accessibility/hosting limitations from the earlier checkpoint remain open.

Files: `docs/catalogue-expansion-2026-10.json`, `docs/jammu_shops_researched.csv`, `docs/shop-research.json`, `docs/DATA-SOURCES.md`, `local/import-research.mjs`, `scripts/expand-catalogue.mjs`, `scripts/download-laptop-research.mjs`, `local/discovery.mjs`, `lib/rules.ts`, `web/app.js`, `web/public-content.mjs`, `tests/research.test.mjs`, `tests/discovery.test.mjs`, `tests/rules.test.ts`, this document. Checkpoint: see commit named `Expand manufacturer catalogue and Jammu stores with auditable source data`.

## Current integration checkpoint

Implementation checkpoint: `6a0ed09` (shared public/admin integration; M6–M12 were committed together rather than separate milestone commits). Final hardening/checks checkpoint: `ef794e4`. Current local URL: http://127.0.0.1:3000. Admin setup is intentionally unclaimed: run `node scripts/admin-url.mjs` locally and choose credentials. No secret is stored in this document.

| Milestone | Current status | Evidence / checkpoint |
| --- | --- | --- |
| M1 | Done | `c529754`; immutable migrations, preservation/rollback tests |
| M2 | Done | `5d6459e`; original 18 imported idempotently; latest research does not grant owner verification |
| M3 | Done | `4a559dd`; validated Google Maps links, count-only taps |
| M4 | Done, user scope expanded | `0deeafb`; strict CSV importer; authorized manufacturer research imported separately |
| M5 | Partial | `c14c07b`, `6a0ed09`; responsive design and Icon wrapper; actual Lucide/Phosphor installation and real 360px browser check remain unavailable |
| M6 | Implemented | `6a0ed09`; five-column footer, legal/help/company/owner routes and back-to-top |
| M7 | Implemented and API tested | `6a0ed09`; owner/visitor requests pending, private publicly, missing coordinates/hours left null |
| M8 | Implemented and API tested | `6a0ed09`; private path, Argon2id, separate sessions, setup/env CLI, change password, lockout, inactivity, noindex, audits; optional TOTP absent |
| M9 | Implemented and API tested | `6a0ed09`; pending count, shop filters/pagination, evidence, moderation, snapshots and guarded undo; stale undo rejects conflicts |
| M10 | Implemented and API tested | `6a0ed09`; sourced CSV dry-run/apply, product editing/merge, field shop/actual stock observation, reports, stale/zero searches and demo archive |
| M11 | Implemented | `6a0ed09`; database aggregate metrics/activity/CSV exports, no charts or counts fabricated |
| M12 | Implemented | `6a0ed09`; one-tap/bulk confirmation, catalogue add/edit, rank parts, actual seven-day views/taps, stale banner |
| M13 | Implemented and unit tested | `6a0ed09`, `ef794e4`; stock decay, independent reports, availability tiers for every sort, invalid timestamps never fresh |
| M14 | Partial | `ef794e4`; local validation/CSRF/security headers/upload constraints/build/regression pass. Edge CDP timed out at `Page.enable`; visual/AA/Lighthouse/physical-4G checks and public hosting not passed |

### Latest data state

- **233 active sourced products/product families**, with source URLs and date, across Apple, Samsung, Xiaomi, vivo, OPPO, realme, Google, OnePlus, iQOO, Nothing, Motorola, HP, Dell, ASUS, Lenovo, Acer, LG, Sony and boAt. Selected families are not an exhaustive global SKU database; no generation/configuration/specification is inferred where missing. Some manufacturer items may be preorder listings.
- **30 researched shop records**: original 18 plus 12 additions covering New Rehari, Channi Himmat, New Plot, City Chowk, Bari Brahmana, Nanak Nagar, Janipur, Sainik Colony, Satwari and Narwal, among existing areas. One existing owner-submitted shop is preserved separately.
- Original-source results: nine checked online (four official, five third party); nine source retrieval failures retained unverified. Total sourced shop evidence: twelve official listing checks, nine online directory/index checks and nine unverified originals. **Zero owner/visit verification claims.** Official locator search results may be indexed; source notes disclose failed full-page fetches.
- **Zero active sample shops/products/listings and zero real stock listings**. Archive/backup rows remain for recovery. No randomized stock, price, availability probability, rating, review, phone or coordinate was created.
- `docs/shop-research.json` records unresolved sources and area gaps: Residency Road, Jewel Chowk, Nagrota, Digiana, Gangyal, Canal Road and Shastri Nagar still need stronger store-level sources/import review. Search results that merely list nearby businesses are not proof of the searched area.
- Latest backup before additional shop imports: `backups/before-modifications-2026-10-16T11-48-05-012Z.*`, SQLite integrity `ok`.

### Checks and limitations

`npm.cmd test`: **30/30 pass**. Includes isolated admin setup, owner/admin isolation, lockout, password session revocation, passive polling/inactivity, visitor pending privacy, reversible moderation and stale undo conflicts, source import validation/idempotency, field stock evidence, no invented distances/stock, CSRF, real page-module rendering, Maps and availability/ranking boundaries. DOM shims exercise modules but do not establish real browser layout, focus or accessibility. `npm.cmd run build`: compiled runtime bundle and separate HTTP smoke test pass, including all imported browser modules.

Warm localhost performance (20 requests each, 2026-10-16): p95 home 4.44ms, app JS 2.31ms/56,039 bytes, catalogue 18.8ms/141,027 bytes, shops 3.81ms, phone-category search 6.29ms. Reproduce with `node scripts/check-local-performance.mjs`; private report `.local/performance.json`. These measure HTTP responses, not rendering or mobile-network performance.

User actions still required: choose admin credentials; confirm ownership/location/operating status of shops; obtain actual model/price/stock observations from shops; refresh incomplete/old sources; configure contact/email/recovery and HTTPS/public deployment for a public release. Native Sites/Vinext scaffold remains incomplete and undeployed. The running implementation is the existing Node/SQLite app. No permission or package-install success is implied by the user's authorization; restricted tool network access still applies.

## Resumed by explicit user instruction

## Latest scope: sourced catalogue and sample removal

The user now explicitly authorizes web product/shop research, importing real catalogue data, adding sourced missing-area shops, and removing samples. Root AGENTS records this override. A verified backup was taken at `backups/before-modifications-2026-10-16T11-27-24-478Z.*`. New-only migration 002 adds evidence fields; migration 001 and original schemas are unchanged. `docs/catalogue-research.json` contains official source URLs and the 2026-10-16 check date. `scripts/apply-researched-catalogue.mjs` inserted 165 sourced names/product families. All active sample shops/products/listings (including the dependent sample-catalogue listing) were archived, not relabelled as real; owner shop/account records remain. Live catalogue has zero sample products and zero stock listings because no real shop inventory was supplied. Demo auto-seeding is disabled except explicit isolated test fixtures. No random availability or price was created. All 27 regression tests and runnable build pass. Latest phones/brand pages were checked online; some entries are source-listed families without a supplied generation/configuration/year, explicitly left empty.

The user authorized continuing after the previous stop. The running application's build now packages the existing Node/SQLite implementation: shared TypeScript becomes executable JavaScript, application/schema/assets are bundled without private data, generated modules are validated, and a separate built server is exercised over HTTP. The previous unfinished hosted build is preserved as `build:hosted`. This is a runnable artifact build, not a substitute syntax-only check. Network package downloads still return EACCES. No stack switch or dependency version change was made.

## Earlier checkpoints (historical; current statuses above)

| Milestone | Status | Commit |
| --- | --- | --- |
| Before modifications | done | `1acd7444240314b07506d98576a6c6b4d310bf1b` |
| Section 1: setup and audit | done; build prerequisite failed | `2e785cd0518089753e3f9fb65e1b4783f7c3eb90` |
| M1: schema additions | done | `c529754` |
| M2: sourced shop import | done | `5d6459e` |
| M3: Google Maps everywhere | done | `4a559dd` |
| M4: product import pipeline | done | `0deeafb` |
| M5: user redesign | partial; library access/choice pending | See commit `ui: improve sourced shop cards and verify actual page rendering` |
| M6: footer/static pages | not done | — |
| M7: pending shop requests | not done | — |
| M8: private admin foundation | not done | — |
| M9: requests/shop controls | not done | — |
| M10: admin data tools | not done | — |
| M11: admin dashboard | not done | — |
| M12: owner dashboard refresh | not done | — |
| M13: rules/reports/ranking | not done | — |
| M14: hardening/regression | not done | — |

## Section 1 — what changed

## M1 — schema additions

## M2 — sourced shops

## M3 — Google Maps

## M4 — product pipeline only

## M5 — current UI checkpoint (partial)

Files: `web/icons.mjs`, `web/app.js`, `web/styles.css`, `local/server.mjs`, `scripts/build-local.mjs`, `tests/api.test.mjs`, `tests/ui.test.mjs`, `tests/ui-runtime.test.mjs`, this log. Existing icon paths are centralized in an imported `Icon` wrapper with consistent stroke; they are **not claimed as Lucide**. Package registry and external library downloads remain inaccessible. An optional user question asks whether to keep existing icons temporarily; the library requirement remains incomplete until resolved.

The visual layer now uses a warm rust accent/deep neutral, a system display/body font pair, richer sourced-shop cards, area/pincode filtering, readable primary details, explicit unknown prices/distance/confirmation/hours, responsive card grids, and Maps actions. Existing light/dark/reduced-motion behavior stays intact. Original styling was not reformatted. No unsourced data was added. A page-module integration test runs the actual browser JavaScript against an isolated API using minimal document shims, catching template/runtime exceptions on Home, sourced directory/detail, search and owner sign-in; it is **not a browser layout/accessibility test**. It found and fixed an unknown-hours display error. The build now verifies module URLs have JavaScript MIME types. Actual Edge launch failed with GPU-process errors; no screenshot, 360px visual pass, Lighthouse or accessibility pass is claimed.

Current dev command is `npm.cmd run dev` because PowerShell blocks npm.ps1; it serves http://127.0.0.1:3000. The real sourced directory is /shops. Native PowerShell policy was not changed. Later milestones M6–M14 have not been started while M5's icon requirement remains pending.

Files: `local/import-products.mjs`, `scripts/import-products.mjs`, `docs/products_template.csv`, `tests/import-products.test.mjs`, this log. Template contains headers only. Import requires official HTTPS URLs and explicit administrator approval of the brand's official host, supports aliases/variants/series/accessory compatibility, enforces catalogue year windows, rejects unlicensed image URLs, limits a reviewed batch to one brand, detects duplicates, records dry runs and row errors. No real product CSV exists and **no real products were loaded**. Tests use isolated, clearly named fixtures only. All 24 tests and the real executable build pass. User must supply official-source brand CSVs, Apple first; boundary-year release months need human review because the schema supplies launch year only.

Files: `web/maps.mjs`, `tests/maps.test.mjs`, `web/index.html` (module loading), targeted `web/app.js` and `local/server.mjs` changes, this log. Shared link logic prefers a validated place link, then a supplied/generated Google search link using supplied address/pincode; absent location disables Maps with a tooltip. Directions use supplied name/address, not guessed coordinates. Buttons appear on directory cards, listing cards, shop details and map-associated shop links. Samples remain non-travelable. New-tab anchors use noopener. Direction clicks increment shop/day counters without personal information. All 21 tests and the executable build/built-server smoke pass, including M1/M2 and original owner/report/ranking regressions. Actual location verification is not claimed; Maps search URLs are searches, not confirmed pins.

Files: `local/csv.mjs`, `local/import-shops.mjs`, `scripts/import-shops.mjs`, `tests/import-shops.test.mjs`, `docs/SHOPS-IMPORT-REPORT.json`, small directory/unknown-value changes in `local/server.mjs` and `web/app.js`, this log. All 18 supplied rows imported after dry run and a fresh verified backup. Re-running inserts zero and identifies all 18 duplicates. No product listings, prices, stock confirmations, coordinates, inferred hours or invented phone numbers were created. All source verification strings retained: all 18 unverified. `/shops` exposes a sourced directory; cards and detail visibly warn that stock is unconfirmed. Sample and owner-entered records remain intact. All 18 tests, including previous API and migration flows, pass; built runtime HTTP smoke passes. Import report includes row-level errors, duplicate handling, batches and warnings. Actual Google Maps verification remains the user's task.

Files: `local/migrate.mjs`, `local/migrations/001_sourced_shops.up.sql`, `local/migrations/001_sourced_shops.down.sql`, `scripts/migrate-local.mjs`, `tests/migrations.test.mjs`, targeted compatibility edits in `local/server.mjs` and `web/app.js`, this progress file. Old bootstrap/schema files were not edited. New tables include separate admins, admin sessions, import batches and anonymous shop counts. Shop source/Maps/verification/pincode/type fields and canonical statuses are present, as are product provenance/variant/compatibility fields. NULL coordinates are supported without inventing values.

Checks: all 16 tests pass; executable local build and built-server HTTP smoke pass. Migration tested on an empty DB and on existing sample fixtures, preserving listings/prices/relations and reversing original statuses. Rollback refuses when newly added real data would be lost. A first regression caused by an old positional audit insert was fixed with explicit columns. Backup ran before live migration. Existing owner auth is unchanged; separate-admin authentication remains M8. Hosted scaffold remains unfinished. Migration maps approval `verified` to `active` and `suspended` to `on_hold`, retaining legacy values; real verification defaults to not_verified, never inferred from approval.

Exact created/changed source files:

- `.gitignore`: exclude `backups/` because exports contain private database records.
- `AGENTS.md`: persist guide Parts A/C verbatim, with explicit execute-prompt precedence for automatic sequential execution and stack preservation.
- `scripts/backup-db.mjs`: consistent SQLite backup, SQL export, integrity check, checksum/count manifest.
- `docs/AUDIT.md`: current stack/routes/APIs/tables, comprehensive guide gap table, data constraints/risks and exact M1–M14 sequence.
- `docs/PROGRESS.md`: this run's checkpoint/failure/results record.
- Git metadata initialized and a before-modification snapshot committed.

The three reference files already existed in `docs/` and byte-match the Downloads originals; no copies were overwritten. Application code, old schemas/migrations, and original reference data were not changed. All current samples and user-entered data were retained. Existing samples remain labelled Sample, visible as before, and removable by the existing admin action; the new default-hiding behavior was not implemented because the build gate stopped this run.

Backup artifacts (ignored, not committed):

`backups/before-modifications-2026-10-16T10-42-18-220Z.sqlite`, `.sql`, `.json`.

The SQL export restored in an isolated in-memory database with 21 shops / 241 listings, integrity `ok`, and zero foreign-key violations. The original live database was not restored over or modified by the backup operation.

## Validation and mandatory stop

Baseline and final regression: `node --test tests/rules.test.ts tests/api.test.mjs` — **13/13 passed**. Earlier-flow API coverage: owner signup/login, pending approval/public exclusion, listing creation/ownership, admin approval, stock confirmation, duplicate reports, CSRF origin rejection, audit records, password hashes, currency filtering, product SSR, logout. Tests used isolated databases. `node --check scripts/backup-db.mjs` passed. Existing local preview `http://127.0.0.1:3000/` returned HTTP 200.

The package build command, `node scripts/run-framework.mjs build`, failed before application work: missing `node_modules/vinext/dist/cli.js`. A separate pre-existing source problem is the absent `app/ui.tsx` imported by the retained scaffold. The working local Node site and the incomplete framework build are different paths; do not claim the local test suite proves the framework builds.

Two repair attempts were made without changing the stack, package versions, lockfile, scripts, or build semantics:

1. Locked online `npm ci --prefer-offline --no-audit --no-fund --fetch-retries=0 --fetch-timeout=15000` using the installed npm JavaScript entrypoint. Failed: registry download EACCES; npm “Exit handler never called”. Log: `C:\Users\sidha\AppData\Local\npm-cache\_logs\2026-10-16T10_41_37_096Z-debug-0.log`.
2. Locked offline `npm ci --offline --no-audit --no-fund`. Failed: `ENOTCACHED`, unavailable zod tarball; EPERM cleanup warnings in ignored `node_modules`. Log: `C:\Users\sidha\AppData\Local\npm-cache\_logs\2026-10-16T10_42_59_548Z-debug-0.log`.

Final build recheck failed with the same missing CLI. **Stopped under operating rule 0.8 before M1.** There was no application milestone change to revert: Git preserves the baseline, source files are unchanged, and no schema migration/import occurred. Documentation, verified backup, and audit checkpoints are retained. `node_modules` remains incomplete and ignored; no dependency-install success is claimed.

## Assumptions and unimplemented work

- Execute prompt overrides the guide's original from-scratch build order; active Node/SQLite/auth/CSS and retained scaffold stay intact.
- Guide now targets INR; preserve existing USD records instead of converting or deleting them in future work.
- All 18 supplied shops are unverified: 16 listing_found, one listing_found_partial_address, one needs_verification_old_dealer_listing. No Maps/telephone verification was performed. No coordinates, stock, prices, or products were invented or imported.
- Real product data is absent. M4 must create only pipeline, tests and a headers-only template until the user supplies brand CSVs.
- New separate admin accounts, secure private path, bcrypt/argon2 setup script and password changes are not implemented. Existing `/admin` is the legacy owner-role admin surface, not the requested secure new admin.
- Browser/accessibility/4G checks have not passed. Previous Edge automation stalled at Page.enable; no fabricated browser result.

## Resume prerequisites and user-owned tasks

Restore access to required locked npm packages (or supply a complete trusted dependency cache), then repair and verify the pre-existing framework build. Do not replace the build command with syntax checks. Resume M1 only with the gate resolved; maintain commits and new-only migrations.

User tasks once the relevant milestones exist: set admin environment credentials and run the future M8 setup script; supply official-source brand product CSVs (Apple first); verify all imported shops and provide real Maps place links/coordinates; add missing areas with sourced shops. Do not create a guessed admin password.

Missing-area work from guide B1: Rehari Colony, Residency Road, Jewel Chowk, Channi Himmat, Janipur, Nanak Nagar, Sainik Colony, Satwari, Bathindi, Nagrota, Digiana/Gangyal, Narwal, Canal Road, Shastri Nagar. Target 2–3 verified shops per area; do not fabricate these rows.

## Run the preserved local app

```powershell
cd C:\Users\sidha\Downloads\nearby-stock-finder
node local/server.mjs
```

Open http://127.0.0.1:3000. Do not start a second process if the existing server already responds. Legacy admin route: `/admin`, using the existing account's role; it is not the future isolated private admin. Account secrets are not stored in these notes.


## 2026-10-16: requested theme and icon fixes

Implementation checkpoint: a69ad19. This entry supersedes the earlier visual-state notes for this bounded change.

Files changed: web/styles.css, web/icons.mjs, web/app.js, web/admin.mjs, web/index.html, web/manifest.webmanifest, web/icon.svg, web/sw.js; this record in docs/PROGRESS.md.

- Unified existing branding around forest green; removed competing terracotta overrides. Added semantic light/dark foreground, surface, action, warning, danger and map colors, including dark-aware stock badges and notices.
- Added distinct tablet, watch, desktop, monitor, TV and accessory silhouettes and an appliance icon. All eleven categories now have unique icons instead of falling back to a storefront. Kept the existing shared decorative SVG wrapper, sizing, currentColor and consistent stroke. This remains the custom icon set, not a Lucide integration.
- Added icons to the private admin menu. Retained category/action icons and the 44px theme switch on mobile. Updated sun/moon symbol, accessible label, pressed state, persisted selection and browser theme color on toggling. Updated favicon, app manifest and offline-cache version.
- Assumption confirmed by user: consistent, clear icons; no request to make decorative icons independent actions. Existing data and inventory behavior unchanged.

Validation: npm.cmd test passed 36/36; npm.cmd run build compiled and smoke-tested the local runtime successfully; git diff --check passed. Live home, directory, owner, CSS, JS, icon module, admin module, manifest and service worker returned HTTP 200. An additional module-level DOM harness exercised light-to-dark and dark-to-light transitions, labels, symbols, aria-pressed, localStorage and browser theme color. All eleven category paths were distinct. Nine semantic foreground/background pairs in both themes exceeded 4.5:1 in a calculated contrast check.

Visual verification limit: installed Edge automation again timed out at Page.enable before screenshots or viewport checks. The DOM harness and color calculations are not a browser layout/accessibility pass. Browser layout at 360px and 1280px remains to be verified. Hosted framework build and public deployment were outside this local styling request.

Open http://127.0.0.1:3000 and hard refresh (Ctrl+Shift+R) to bypass previously cached assets. Next recommended check: inspect home, search, directory and owner screens in both themes on desktop and phone.


## 2026-10-16: refined icons and phone/laptop usability

Implementation checkpoint: ee37472. User requested better icons, mobile/laptop layouts and research into appropriate usage.

Files changed: web/icons.mjs, web/styles.css, web/app.js, web/admin.mjs, web/public-content.mjs, web/sw.js, tests/browser-qa.mjs, docs/PROGRESS.md.

- Researched official Lucide guidance at https://lucide.dev/guide/lucide and https://lucide.dev/how-to/accessibility and W3C target-size guidance at https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html. Applied visible labels, consistent semantics, decorative aria-hidden SVGs, clear contrast and 44px or larger primary interactive targets.
- Registry/raw asset requests from the shell fail with EACCES. Web retrieval could read documentation but not retrieve installable assets. No Lucide package installation or library integration is claimed. The revised 45-symbol set is local SVG artwork, rendered offline through the existing Icon wrapper. Device silhouettes now use rounded screens, recognizable laptop bases, headphone cups, appliances and peripheral details. Wrapper validates sizes and falls back safely for unknown names.
- Improved icon use in catalogue cards, manufacturer/source links, directory actions, map zoom/pan controls and admin navigation (overview/grid, catalogue/package, imports/upload, field/location, logout/exit). All eleven categories have distinct shapes.
- Added native keyboard-accessible compact navigation below 1051px with five labelled destinations. Escape closes it and returns focus; outside clicks close it. The owner destination remains available in the menu when the narrow header hides its duplicate button. Filter disclosure exposes its state and restores focus after rendering.
- Added phone/tablet/laptop grid breakpoints, full-width mobile search action, 16px mobile inputs, larger tap targets, readable card text, safe text wrapping, single-column phone catalogue/form layouts, roomier status controls and adaptive desktop filters. Preserved the existing forest-green themes and data behavior. Versioned the offline shell cache.

Validation: final npm.cmd test passed 36/36; npm.cmd run build passed (compiled and smoke-tested local runtime); git diff --check passed. A module-level DOM harness rendered search in both themes and verified menu markup, Escape/focus return, outside-click dismissal, filter expansion/focus and device icons. Home, directory, owner and all affected served assets returned HTTP 200. Verified every literal icon call references a known symbol, all 45 symbols render decorative currentColor SVGs, category symbols are distinct, unsafe icon sizes do not inject markup, and CSS braces balance.

Browser QA: expanded tests/browser-qa.mjs for widths 320, 360, 390, 768, 1024, 1366, 1440 in both themes, including overflow, 44px controls, readable input size and compact menu checks. Installed Edge again timed out at Page.enable before any rendering. These browser checks have NOT passed; no screenshots, device layout pass or complete accessibility pass is claimed. Run node tests/browser-qa.mjs from a working local browser-automation environment to finish this check.

Preview: http://127.0.0.1:3000 (hard refresh with Ctrl+Shift+R). No public deployment was requested. Next recommended step: visual review of the phone and laptop layouts in both themes, then replace local artwork with a verified installed icon package when dependency access is available.


## 2026-10-16: replace product dataset and show estimated INR prices

Implementation checkpoint: 3362e52. The user authorized replacing products only, preserving shops/accounts, supplied C:/Users/sidha/Documents/codes/products.json, and then explicitly requested INR price estimates. The supplied path is a directory; the actual data file is products_catalog.json inside it. The adjacent generate_catalog.mjs was not executed.

Files created: local/replace-catalogue.mjs, scripts/replace-catalogue.mjs, tests/replace-catalogue.test.mjs. Files changed: web/public-content.mjs, web/sw.js, docs/PROGRESS.md. Ignored artifacts: a fresh database backup/SQL export/manifest under backups/; dataset snapshot and report under .local/datasets/.

Applied replacement: 351 old active product records archived, 918 supplied variants imported across 11 categories. Active product total is now exactly 918. No active listings existed before replacement; none were created. All 53 shop rows (33 active), the owner account and admin account exactly match the pre-replacement backup. Old sample/product rows, historical listings and audit records remain recoverable, rather than breaking foreign keys. Old product IDs are no longer available through the product API. Original user dataset unchanged.

Dataset SHA-256: 47997a61adb590bbb57c9b061e0ba808b4ee31ef7a3c89d374a664011df065d9. Import batch: 13c578b4-9440-4cb0-a807-bec24d428dde. Registered as user_supplied_unverified, with original IDs/slugs, variant titles, full specifications and search keywords preserved. No manufacturer source URL or source-check date was fabricated. The UI labels imported specifications and variants as unverified; this import is structural validation, not factual verification of every row.

Estimated prices: all 918 products have INR reference estimates, calculated from supplied approx_price_usd times 94.9245, rounded to the nearest INR 100. The dated exchange rate was checked at https://www.xe.com/en-gb/currencyconverter/convert/?Amount=1&From=USD&To=INR on 2026-10-16 (16:11 UTC quote). Original USD amounts and rate provenance remain in specs. Cards/details clearly state Estimated INR price; not a shop quote. Estimates do not account for current Indian retail pricing, taxes, import costs, depreciation or discounts. Local prices and stock still require actual shop confirmation. Example: supplied iPhone XR 64GB Black USD 749 becomes estimated INR 71,100.

Backup: backups/before-modifications-2026-10-16T16-25-58-949Z.sqlite, matching .sql and .json. Snapshot integrity passed; SQL export restored into an isolated database with the previous 351 active products. Live integrity and foreign keys also passed after replacement. Dataset snapshot/report: .local/datasets/47997a61adb590bbb57c9b061e0ba808b4ee31ef7a3c89d374a664011df065d9.json and replacement-47997a61adb590bbb57c9b061e0ba808b4ee31ef7a3c89d374a664011df065d9.report.json.

Validation: 40/40 automated tests passed, including new preservation, empty/malformed/duplicate rejection, transaction rollback after insertion failure, repeat-import no-op, INR conversion/provenance and escaped UI output checks. Full supplied dataset also imported into an isolated fixture with 918 INR estimates. Local build compiled and smoke-tested successfully; git diff --check passed. Live catalogue API returned all 918 records; searches for iPhone XR 64GB Black, HP, Samsung and MacBook returned imported products without manufactured inventory. An initial live check for HP Victus correctly found no record: that model is absent from the replacement file; the supplied HP rows cover Spectre, OMEN Transcend and OMEN desktop variants. Product page returned HTTP 200; archived product API returned 404. Browser visual verification remains unavailable from earlier Edge automation failures; no new visual-layout pass is claimed.

To validate another replacement, run node scripts/replace-catalogue.mjs --file=<file-or-directory>. Add --apply only when replacing the active catalogue; it creates/verifies a new full backup first. Validation rejects the whole import if any row is invalid, and archival plus insertion are one transaction. Repeating an identical active dataset is a no-op. No database schema changes were needed.

Local preview: http://127.0.0.1:3000; hard refresh with Ctrl+Shift+R for the updated price/verification labels. Next recommendation: review the imported model/configuration accuracy before treating entries as verified products or relying on reference estimates as market prices.
