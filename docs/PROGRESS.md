# Execute-prompt progress

Run date: 2026-10-16. Follow `docs/EXECUTE-PROMPT.md`, not the old root progress file's build order.

## Resumed by explicit user instruction

## Latest scope: sourced catalogue and sample removal

The user now explicitly authorizes web product/shop research, importing real catalogue data, adding sourced missing-area shops, and removing samples. Root AGENTS records this override. A verified backup was taken at `backups/before-modifications-2026-10-16T11-27-24-478Z.*`. New-only migration 002 adds evidence fields; migration 001 and original schemas are unchanged. `docs/catalogue-research.json` contains official source URLs and the 2026-10-16 check date. `scripts/apply-researched-catalogue.mjs` inserted 165 sourced names/product families. All active sample shops/products/listings (including the dependent sample-catalogue listing) were archived, not relabelled as real; owner shop/account records remain. Live catalogue has zero sample products and zero stock listings because no real shop inventory was supplied. Demo auto-seeding is disabled except explicit isolated test fixtures. No random availability or price was created. All 27 regression tests and runnable build pass. Latest phones/brand pages were checked online; some entries are source-listed families without a supplied generation/configuration/year, explicitly left empty.

The user authorized continuing after the previous stop. The running application's build now packages the existing Node/SQLite implementation: shared TypeScript becomes executable JavaScript, application/schema/assets are bundled without private data, generated modules are validated, and a separate built server is exercised over HTTP. The previous unfinished hosted build is preserved as `build:hosted`. This is a runnable artifact build, not a substitute syntax-only check. Network package downloads still return EACCES. No stack switch or dependency version change was made.

## Checkpoints

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
