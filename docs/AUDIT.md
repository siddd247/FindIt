# Section 1 — existing-site audit

Date: 2026-10-16. Governing instruction: `docs/EXECUTE-PROMPT.md`. The guide is a target specification, not a new-project setup order. This audit does not certify incomplete features as working.

## Baseline and data protection

- Before-modifications commit: `1acd7444240314b07506d98576a6c6b4d310bf1b`.
- All three reference files already existed in `docs/`; SHA-256 comparisons match their Downloads originals. No reference was replaced or reformatted.
- Consistent SQLite backup: `backups/before-modifications-2026-10-16T10-42-18-220Z.sqlite`; matching `.sql` export and `.json` checksum/count manifest.
- Snapshot integrity: `ok`. SQL export restored successfully into an isolated in-memory database: 21 shops, 241 listings, zero foreign-key errors. The backup includes private records, so `backups/` is ignored by Git.
- Existing database counts: users 1; sessions 1; shops 21; categories 5; products 80; listings 241; listing_events 3; reports 0; reviews 0; search_logs 12; admin_actions 2; rate_limits 4. Counts are a snapshot and can change while the local website is used.
- There is existing non-sample/user-entered data. Do not reset the database, reinitialize the project, overwrite account records, or erase samples to simplify migration.
- Guide Parts A and C are copied verbatim into root `AGENTS.md`, with an explicit precedence note for the execute prompt's automatic milestone order.

## Current stack and structure

There are two implementations in the existing repository. Preserve their files; do not silently treat one as the other.

| Layer | Running local app | Retained hosted scaffold |
| --- | --- | --- |
| Entry | `npm run dev` / `npm start` -> `local/server.mjs` | `npm run build` -> `scripts/run-framework.mjs build`; `dev:hosted` / `start:hosted` |
| Runtime | Node 24 built-in HTTP server | Vinext / React / TypeScript / Cloudflare Worker |
| UI | `web/index.html`, `web/app.js`, `web/styles.css` | `app/`, reusable `components/ui/`; `app/ui.tsx` is missing |
| Database | Node `DatabaseSync`, `.local/stock.sqlite`, WAL, SQL prepared statements | D1 binding declared; Drizzle schema in `db/schema.ts` |
| ORM | No ORM in the active local runtime | Drizzle declared, dependencies incomplete |
| Authentication | scrypt owner passwords; hashed session tokens; users.role doubles as admin | Platform ChatGPT identity helpers; separate unfinished setup-key endpoint |
| Styling | Existing CSS variables, responsive breakpoints, light/dark | Tailwind / starter CSS |
| Maps | Custom OSM tile map + coordinate-based Google directions | Not complete |
| Build | No local compilation step currently defined | Existing package build command fails: missing `node_modules/vinext/dist/cli.js` |

`package.json` and its lock declare packages; this does not establish that they are installed. Neither Lucide nor bcrypt is presently importable from this checkout. No replacement package or API is assumed.

### Current page routes

`/`, `/search`, `/products/:id`, `/shops/:id`, `/join`, `/owner`, `/admin`, `/about`, `/availability`, `/privacy`, `/terms`, `/contact`, `/for-shops`, `/design-system`. Local HTTP routing serves a common document for unknown paths, so real 404 status handling is incomplete. Product/shop routes inject some server-rendered content and metadata before client rendering. The admin route and link are public knowledge today and reuse owner authentication.

### Current local APIs

GET: `/api/session`, `/api/catalogue`, `/api/search`, `/api/products/:id`, `/api/shops/:id`, `/api/owner`, `/api/admin`.

POST: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/shops`, `/api/listings`, `/api/listing-edit`, `/api/confirm`, `/api/reports`, `/api/direction-tap`, `/api/upload`.

Admin POST: `/api/admin/shop`, `/api/admin/resolve`, `/api/admin/field-shop`, `/api/admin/product`, `/api/admin/merge`, `/api/admin/seed`, `/api/admin/remove-samples`, `/api/admin/import`.

The retained `app/api/[...path]/route.ts` is a different, unfinished API surface. Its parity with the running local app is not established.

### Current database tables and constraints

`users`, `sessions`, `categories`, `shops`, `products`, `listings`, `listing_events`, `reports`, `reviews`, `search_logs`, `admin_actions`, `rate_limits`.

Shop status is currently `pending` / `verified` / `suspended`, conflating approval with verification. Shop latitude, longitude, phone, address, and hours are NOT NULL. Products lack official-source metadata. There is no separate `admins` or `import_batches` table or local migration runner. `local/schema.sql` is an existing bootstrap schema and must remain immutable. The Drizzle migration journal has no entries; hosted migrations have not been generated or deployed.

## Supplied CSV audit — no external verification performed

The supplied CSV contains 18 rows with unique IDs and source URLs. Verification values are `listing_found` (16), `listing_found_partial_address` (1), and `needs_verification_old_dealer_listing` (1). **All 18 remain unverified.** A sourced web listing is not a shop verification.

No latitude/longitude columns or product-level price/stock data are supplied. Phone and hours are missing for multiple rows. Some hours are partial or conflicting (especially Cashify Gandhi Nagar). Preserve their source text; do not infer structured opening/closing times. The Hi Tech Computers row has an explicitly partial address. The iSpace Wave Mall row explicitly requires verification that it is still operating. The supplied pincode values must not be corrected from memory.

The importer must preserve source and verification strings, leave coordinates NULL, and create no claimed product availability or owner-confirmation timestamp. “Not recently confirmed” on a shop without inventory is an unknown-information state, not an invented listing.

## Requirement gap table

Status describes the pre-modification codebase, except the explicitly identified Section 1 governance work.

| Requirement | Status | Existing files | Change needed / milestone |
| --- | --- | --- | --- |
| A1 Jammu electronics utility; no checkout/payment/delivery/chat/reservations | done | `lib/config.ts`, `web/app.js` | Preserve scope throughout |
| A1 three isolated user/owner/admin experiences | partial | `local/server.mjs`, `web/app.js` | Separate admin identity and UI, M8–M11 |
| A2 targeted edits, exact file lists, one tested checkpoint per milestone | partial | New `AGENTS.md`, Git baseline | Enforce execute-prompt M1–M14 order, commits, rollback after two failed repairs |
| A2 >30% file-change warning | missing | Dense `web/app.js`, `local/server.mjs` | Extract additive modules; warn before large edits, never wholesale regenerate |
| A2 build, test, regression after each milestone | conflicts | `package.json`, `scripts/run-framework.mjs` | Restore existing build prerequisite; do not replace build with a no-op |
| A3 only sourced or owner/admin-entered real shops | partial | `lib/seed.ts`, current DB | Retain labelled samples; import only supplied CSV, M2 |
| A3 separate verification and approval | missing | `local/schema.sql`, `local/server.mjs`, `web/app.js` | New fields/status migration, truthful badges, M1/M2/M5 |
| A3 imported stock unknown, no invented price/timestamp | missing | No real imports yet | No invented inventory during M2; nullable/unknown display support |
| A3 no fabricated reviews or ratings | done | `lib/seed.ts`, `lib/rules.ts`, `web/app.js` | Preserve empty ratings as “No reviews yet”; Bayesian prior is a ranking parameter, not a displayed review |
| A3 samples labelled and removable | partial | `web/app.js`, `/api/admin/remove-samples` | Preserve all existing samples; public default hiding and reversible tools M2/M10 |
| A4 preserve current framework/database/ORM/auth/styling | conflicts | Two existing implementations | Execute prompt overrides fresh Next/Prisma setup; keep active Node/SQLite and retained scaffold |
| A4 owner magic-link or OTP | missing | Local email/password auth | Existing auth preserved per execute prompt; real delivery integration remains a known limitation, not simulated verification |
| B1 import 18 sourced shops | missing | `docs/jammu_shops_seed.csv` | M2 dry run, validation, idempotent import, report |
| B1 missing areas remain admin work | missing | Hard-coded area mapping in `web/app.js` | Editable areas/import capability M9/M10; report missing coverage |
| B1 preserve absent phones, partial addresses/hours | conflicts | NOT NULL and required inputs | Additive migration for nullable fields; display “Not available”, M1/M2/M5/M7 |
| B1 verify shops by Maps/calling | not done | CSV verification values | User responsibility; do not claim verification |
| B2 Maps search and optional real place URL | missing | Existing coordinate directions only | Persist both fields; link-precedence helper, M1/M3 |
| B2 never invent coordinates | conflicts | Required coordinates and default shop-form pin | Nullable migration; remove implicit real-shop coordinates, M1/M7/M9 |
| B3 sourced catalogue import, no self-supplied real products | missing | Existing sample catalogue only | M4 official-source importer; no real product rows loaded |
| B3 series/variant/year/source/aliases/compatibility | partial | `db/schema.ts`, `local/schema.sql` | Append schema fields, M1; validate in M4 |
| B3 5-year / major-brand 7-year catalogue windows | missing | No source-aware importer | Configured validation and brand review boundaries, M4 |
| B3 official_url required; licensed images only | missing | Existing admin product API | Reject unsourced products; image provenance handling, M4/M10 |
| B3 brand batches reviewed, Apple CSV supplied by user | missing | No brand CSV | Headers-only template and awaiting-input report, M4; never generate example product rows |
| B3 phones/tablets/laptops/audio/watch/charging/accessories/appliances | partial | Five seed categories | Add category definitions without product fabrication, M4/M5 |
| C “Open in Google Maps” at every shop appearance | missing | `directions()`, `card()`, `shopPage()`, `drawMap()` in `web/app.js` | Shared Maps helper and card/page/map actions, M3 |
| C place URL -> name/address/pincode search -> disabled tooltip | missing | No helper | Validate permitted URL formats; missing address disabled, M3 |
| C directions from encoded name/address | conflicts | Coordinate-based directions | Use encoded supplied text, never invented pin, M3 |
| C new tab + noopener + mobile Maps behavior | partial | `web/app.js` | Consistent anchor attributes; no promise of a verified pin, M3 |
| C anonymous direction_taps counts only | partial | `search_logs`, `/api/direction-tap` | Dedicated count semantics, no personal identifiers, M3/M11/M12 |
| D1 warm accent/deep neutral; accessible status colors+icons+words | partial | `web/styles.css`, `web/app.js` | Richer restrained visual design and status treatment, M5 |
| D1 display font/body font, body >=16px, touch >=44px | partial | System font, several smaller labels | Consistent typography/tokens and measured controls, M5/M14 |
| D1 rich cards: area/verification/status/confirmed/price/distance/Maps | partial | `card()` | Truthful optional fields, unknown distance/price, visible verification, M5 |
| D1 light/dark, skeleton, reduced motion | done | `web/styles.css`, `web/app.js` | Preserve and recheck, M5/M14 |
| D1 WCAG AA | not done | Browser QA previously stalled | Real keyboard/contrast/accessibility checks; report tool limits, M14 |
| D2 shopper search/categories/filters/area/list-map/shareable pages | partial | `web/app.js`, `local/server.mjs` | Area/pincode query for shops with no coordinates; no unsupported relevance claims, M2/M5 |
| D2 owner simple one-tap dashboard | partial | `owner()`, `/api/confirm` | Preserve behavior; stats/reminder and statuses, M12 |
| D2 professional admin | partial | `adminPage()` | Sidebar/table/request workflow and secure boundary, M8–M11 |
| D3 single installed Lucide/Phosphor set with Icon wrapper | missing | Hand-drawn inline `paths` object | Install/import confirmed library, wrapper 16/20/24, M5; dependency access is a blocker |
| D3 consistent category/status icon semantics | partial | `icon()` | Add tablet/watch/accessories and canonical status icons, M5 |
| D4 five-column footer with exact shopper/owner/company/legal groups | partial | `footer()` | Build specified groups, M6 |
| D4 actual routes for Browse areas / Owner guide / Report a problem | missing | No matching pages | Add real pages and reuse existing static pages, M6 |
| D4 no placeholder links; year/honest line/back-to-top | partial | `footer()` | Real routes and real top action, M6 |
| E1 reusable tokens/components/design system/env/README | partial | Existing CSS/design-system page; `.env.example` ignored by baseline | Preserve stack; restore build and validate, M5/M14 |
| E2 immutable migrations, empty-DB and rollback tests/indexes | missing | `local/schema.sql`, empty Drizzle journal | Append local migration runner and SQL migrations; no old edits, M1 |
| E2 separate admins/import_batches plus indexes | missing | Existing tables otherwise present | M1 schema, M8 authentication |
| E3 shop import dry run/row errors/name+pincode duplicate key/batch audit | missing | Existing generic import is not sufficient | Dedicated sourced importer, M2 |
| E4 product pipeline and brand batch | missing | No product CSV | M4 pipeline/template/tests only; load no products |
| E5 fuzzy/full-text/aliases/query logging | partial | `matchProduct`, `/api/search` | Existing fuzzy tests pass; missing index-backed full text, area fallback, and empty-query logs, M4/M5/M13 |
| E6 exact decay + configurable ranking + explanation | partial | `lib/rules.ts`, `lib/config.ts` | Existing tests pass; null confirmation/distance and explicit-sort out-of-stock ordering need review, M13 |
| E6 admin Maps coordinate extraction only after confirmation | missing | Manual map picker invents default form coordinates | Parse supported link values, require admin confirmation, never infer missing coordinates, M9 |
| E7 honest user pages + empty/loading/error/offline/location-denied | partial | `web/app.js`, `web/sw.js`, local SSR | Wire real unverified/no-stock shops; improve unknown and error states, M5 |
| E8 static pages + valid footer routes | partial | Existing six pages | Reuse/edit per D4, M6 |
| E9 owner/visitor request pending and hidden, owner pending screen | partial | `createShop`, `shopForm`, `owner` | Visitor submission and pincode/Maps/missing fields, explicit pending screen; no auto-approval, M7 |
| E10 private separate admin login and accounts | conflicts | First owner is promoted to admin; public `/admin` | M8 separate admins, random configured path, no public links; keep owner records intact |
| E10 argon2/bcrypt, env setup, password change | missing | Local scrypt user hashes | Install verified bcrypt/argon2; env-based account script, M8 |
| E10 lockout/rate limits/secure session/inactivity/noindex | partial | Generic rate limit; HTTP-only owner cookies | Separate admin sessions, HTTPS-secure configuration, inactivity and metadata, M8 |
| E10 optional TOTP | missing | None | Evaluate only if feasible; optional, no fake 2FA, M8 |
| E10 all admin actions audited | partial | `admin_actions` | Include login/security/read/export/actions with redaction and reversals, M8–M11 |
| E11 pending live badge/approve/reject reason/request changes | partial | Approve/suspend/pending buttons | State/reason/revision workflow and polling count, M9 |
| E11 all-shops search/filter/sort/pagination/detail/edit/location | missing | Simple rendered list | Server-side queries and complete editing, M9 |
| E11 hold/deactivate/reactivate/verify/soft-delete, reversible | partial | Suspension hides public listings; no full reversible system | Snapshot/audit-based reversible commands, M9 |
| E12 shop+product CSV screens with dry runs | partial | Generic shop/listing CSV only | Source-aware importers/screens and reports, M10 |
| E12 catalogue add/edit/merge | partial | Add/merge only | Source requirements, editing, merge collision handling/audits, M10 |
| E12 field agent mobile shop+stock capture | partial | Existing add-verified shortcut | Pending/verification semantics and on-site confirmations only when entered, M10 |
| E12 reports/stale/zero-result/sample removal | partial | Existing lists/remover | Secure new admin integration and reversibility, M10 |
| E13 real counts by status/pending/searches/zero-rate/directions/week confirmations | partial | Current subset from capped 200-log query | Correct aggregate queries and periods, M11 |
| E13 activity/security/settings/CSV exports | partial | Activity list only | Complete exports/settings without secrets and spreadsheet injection, M11 |
| E14 owner product controls/range/negotiable/quantity/no duplicates | done | `owner`, `listingForm`, local listing APIs | Regression and new status integration, M12 |
| E14 real stats views/directions/7-day freshness + stale reminder | partial | Freshness percentage; “One tap” filler | Real counts and stale reminder, M12 |
| E15 reports independence/48h/owner reconfirmation/device-once | done | `lib/rules.ts`, `/api/reports`, tests | Preserve; extend edge-case/rate-limit tests, M13 |
| E16 validation/CSRF/XSS/security headers/rate limits | partial | Local server and h() | Full endpoint/security regression and malformed input cases, M14 |
| E16 compression/lazy load/PWA | partial | JPEG canvas, upload, `web/sw.js` | Verify file boundaries and offline freshness; uploads respect configured data directory, M14 |
| E16 360px/accessibility/4G <2s/browser-console check | not done | `tests/browser-qa.mjs` stalls at Page.enable | Diagnose existing browser infrastructure; measure, never claim an unrun pass, M14 |
| E17 production env/backup/privacy/404/500/non-invasive analytics | partial | Local-only runtime, backup helper, static privacy | Real deployment remains out of current build; no fabricated production URL, M14 |
| F smallest edits/no old migration changes/change log/regression | partial | New baseline and this audit | Enforce throughout; no wholesale file replacement |
| G human launch review, five Maps spot-checks, missing area coverage/backups | not done | Source CSV and this backup | User checks real locations/shops; preserve unknown verification |

## Conflicts, assumptions, and risks

1. **Pre-existing build is broken.** It targets the unfinished hosted scaffold, with no `app/ui.tsx` and incomplete packages. Running local syntax tests is not a replacement for the required build. Do not silently change the build command to make the gate appear green. Fix dependency availability and the original framework implementation before advancing through the gated milestones.
2. **Preserve stack.** The execute prompt explicitly says keep the existing framework/database/ORM/auth/styling. This overrides the guide's from-scratch Next/Prisma setup. No PostgreSQL/Prisma migration, project recreation, or stack switch is authorized.
3. **Migration must preserve data.** The active SQLite schema requires coordinates; real source rows do not contain them. A new, transactional migration must support NULL without fabricating values. If table reconstruction is required, preserve every row/relationship/index, test against a backup, and supply a reversible migration. Do not alter `local/schema.sql` or existing migrations.
4. **Status and verification differ.** Plan an explicit old-to-new status mapping with retained legacy state/audit (`verified` approval -> `active`, `suspended` -> `on_hold`, `pending` unchanged). Never infer a real verification from approval. The sample flag stays separate. Existing owner records remain intact.
5. **No product CSV.** Existing 80 products are samples and must not be relabelled as sourced real stock. The real-shop directory can be browsed by area while product searches have an honest empty state. Category tags in a shop CSV are not product-stock confirmations.
6. **All supplied shops unverified.** Imported `active` means approved to display, not verified. Required visible label: “Listing found online, not yet confirmed”. Missing or conflicting hours must not make “Open now” appear as a known fact.
7. **Maps semantics.** Supplied search links are not verified place pins. Preserve CSV text exactly. Generate only the documented Google search/directions URL from supplied fields. Missing coordinates yield “Not available” for distance; no pin placement until an administrator confirms values.
8. **Currency.** The guide now targets INR. Preserve any existing USD records, even if later public UI focuses on INR; never convert historical prices without an exchange source or erase them.
9. **Admin isolation.** Existing user role is not the requested private admin account. Do not migrate owner password hashes into bcrypt or invent credentials. New admin account must be explicitly created through environment/first-run setup; owner accounts and records stay intact.
10. **No destructive ambiguity requires a question yet.** Proposed changes can be additive and reversible. Any discovered need to overwrite user data would trigger the execute prompt's stop/ask condition.

## Ordered milestone plan — do not skip the build gate

| Milestone | Bounded work and validation |
| --- | --- |
| Section 1 | Baseline Git snapshot, verified backup/export, reference verification, AGENTS persistence, this complete audit, test/build baseline; commit documentation |
| M1 | New migrations/runner/rollback tests, nullable real-shop fields and canonical status/verification/source/Maps/type/pincode fields, separate admins/import_batches and sourced product fields; preserve existing rows |
| M2 | New sourced shop importer + dry run/duplicate/errors/batch records; backup before import; import exactly supplied 18; rerun idempotence; public unknown stock and unverified labels |
| M3 | Shared Google Maps URL validation/precedence and all appearances; anonymous counters and route tests |
| M4 | Source-required product CSV validation, aliases/compatibility/category/time windows, headers-only template/tests; await user's brand CSVs |
| M5 | Installed/import-tested one icon library and wrapper; targeted Home/Results/cards/type/states/theme/360px edits |
| M6 | Specified footer, existing static page reuse, real browse-areas/owner-guide/problem routes; link regression |
| M7 | Owner/visitor request validation and pending state with no public visibility before approval |
| M8 | Separate private admin identity/session/login/env account creation/password change/lockout/inactivity/noindex/action audit; optional TOTP only if feasible |
| M9 | Request review and reasons, live count, server-filtered/paginated shop table, reversible detail/location/status/delete actions |
| M10 | Import/dry-run screens, sourced catalogue editor, field-agent/report/stale/zero-search/sample tools |
| M11 | Real database aggregate metrics/activity/settings and safe CSV exports |
| M12 | Owner controls preserved, accurate rank/stats/reminder and under-10-second confirmation checks |
| M13 | Rules/ranking/reports gaps and edge cases; exact mathematical breakdown and ordering tests |
| M14 | Complete security/image/accessibility/4G/404/error/PWA regression and run/env/admin documentation |

After each milestone: build, full tests, earlier-flow regression, repair at most twice; if unresolved, revert that milestone using Git, record failure and stop. No later milestone begins on a failing gate.

## Baseline verification results

- `node --test tests/rules.test.ts tests/api.test.mjs`: **13/13 passed**. Includes signup/approval/listing confirmation/report duplication/CSRF/audit and pure availability/ranking tests against isolated fixtures.
- `node scripts/run-framework.mjs build` (the package build command): **failed**, missing `node_modules/vinext/dist/cli.js`, before application changes.
- Online dependency repair attempt 1: locked `npm ci`, prefer-offline, bounded network wait; failed with registry EACCES and npm “Exit handler never called”.
- Offline dependency repair attempt 2: **failed**, `ENOTCACHED` for `zod-3.25.76.tgz`, plus EPERM cleanup warnings inside ignored `node_modules`.
- Final build recheck: **failed**, the same missing Vinext CLI. Final local regression: **13/13 passed**; existing preview `/` returned HTTP **200**.
- The run stopped at this prerequisite after two failed repairs under execute-prompt rule 0.8. M1 was not begun; no schema or application changes exist to revert. The baseline and audit records are retained.
- Database snapshot integrity and isolated SQL restore: **passed**. No schema change or import has run.
- Existing local preview remains separate from the failed hosted build. No visual, accessibility, public deployment, or shop-verification pass is claimed.
