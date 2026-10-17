# Nearby Stock Finder — Jammu

A local electronics availability finder for shoppers, shop owners, and administrators. Launch area: Jammu, India. INR/USD selection filters stored listing currencies; there is no automatic currency conversion.

## Run the working local instance

Requires Node.js **24.16.0 or newer** (built-in SQLite, TypeScript stripping, and Argon2). No npm installation is needed for the local app.

```powershell
cd C:\Users\sidha\Downloads\nearby-stock-finder
node local/server.mjs
```

Open **http://127.0.0.1:3000**. The server binds only to this computer. Stop it with Ctrl+C. To use another port: `$env:PORT='3002'` before starting.

Owner accounts are created at **My shop → Create an account** and always have the owner role. Admin identities and sessions are separate. Owner passwords use scrypt; admin passwords use Argon2id. Email verification, password recovery and outbound email delivery are not connected. The runtime binds to localhost; public production hosting remains unfinished.

Data persists in `.local/stock.sqlite`; uploaded photos live in `.local/uploads/` (or the selected `LOCAL_DATA_DIR`). Both are ignored by Git. Restarting preserves accounts and data. Demo records have been soft archived after verified backups; default startup does not create demo data. Isolated tests explicitly enable sample fixtures. No reviews or real stock confirmations are fabricated. User-authorized INR reference estimates and generated catalogue assignments are explicitly labelled.

## Current catalogue and design checkpoint

The active dataset contains 918 user-supplied product variants and 32 active shops. All 29,376 product/shop catalogue assignments are administratively approved; none confirms actual inventory. INR reference estimates come from the supplied USD estimates, converted and rounded, and are not current shop quotes. Original sourced records remain archived with backups.

The current running preview is http://127.0.0.1:3002 . Legacy loopback previews forward from port 3000 to 3001 for assignment support, and from 3001 to 3002 when pricing modules are unavailable. A newly started current server defaults to port 3000.

Search has three views: Shop catalogues, Confirmed stock and Product variants. Shop matches open searchable shop catalogues; assignments remain labelled stock unconfirmed. The home page features distinct models across categories. Owner/admin forms include password visibility and accessible error feedback; saved-storage failures cannot prevent initial rendering. Shared spacing, typography, icons and responsive rules cover phone and laptop layouts.

Validation: 50 tests pass and the compiled local runtime builds and passes its isolated HTTP smoke check. Live API/module checks pass for iPhone XR, iPhone 15 and MacBook. Actual browser viewport checks were blocked by the session approval policy; responsive visual behavior is not verified. Public hosting, durable hosted storage, email verification/recovery, a support contact, and verified product/stock evidence remain launch requirements. See [design audit](docs/DESIGN-AUDIT.md).

## Generated shop price estimates

Edit all price behavior in [web/shop-pricing-config.mjs](web/shop-pricing-config.mjs): shop personality ranges, category spreads/default, 85%-115% clamp, ending styles, tie step, optional daily drift and optional out-of-stock rate. Drift and simulated out-of-stock are disabled by default. Reload after config edits; bump versioned asset URLs for a published release.

Reusable getShopPrices(product, shops) lives in web/shop-pricing.mjs. It accepts base_price (or the unchanged existing reference_price) and category_id/category. It never mutates inputs or writes to the database. Stable shop IDs assign a fixed personality and ending style; product/shop IDs seed jitter. Pass the complete shop directory to keep tie resolution consistent across filtered views. Prices round to whole INR, then shop endings, then clamp; collisions nudge by INR 1 within bounds. Very small ranges can have unavoidable ties; missing/nonpositive prices remain unavailable. Optional drift uses the UTC date. Optional inStock describes simulation only and never asserts observed stock.

Search and product pages compare one exact variant across all assigned shops, sorted by estimated price. They show the lowest estimate, each shop estimate and a best-price badge. Broad queries identify the compared variant and link other matches separately. Shop pages use the same estimate for the same pair; base reference details stay unchanged. Amounts remain explicitly generated estimates, not confirmed shop quotes. No product, brand or model name is special-cased.

Validation: 53 tests pass and the local build passes, including JavaScript delivery of both new pricing modules. A full live-data check covered 918 products x 32 shops: all 29,376 prices stayed within bounds, each product had 32 distinct prices, and repeated calls were identical. Live module checks verified sorted shop estimates/best-price badges for phone, laptop and charger searches. Browser visual verification remains unavailable in this environment.

## Private admin setup

Start the server, then run in another terminal:

```powershell
node scripts/admin-url.mjs
```

Open the printed private localhost link. Choose your own email and a unique password of 14–128 characters. The one-time setup token is consumed after setup. No default admin credentials exist. `/admin` returns 404; the private URL is not linked publicly. Keep `.local/security.json`, the database and backups private. To print the sign-in URL again, run the same script.

Alternatively set process variables `ADMIN_EMAIL` and `ADMIN_PASSWORD`, run `node scripts/create-admin.mjs`, then remove the variables. The script uses the same one-time setup endpoint and never prints the password. Do not put real credentials in `.env.example` or Git. Admin login locks for 15 minutes after five failures, expires after 30 minutes of inactivity, and password changes revoke all sessions. Cookies are httpOnly/SameSite Strict. Set `COOKIE_SECURE=1` only behind a configured HTTPS host; local HTTP uses `0`. TOTP is not implemented.

## Sourced data and availability

`docs/catalogue-research.json` records selected manufacturer product/family names, source URLs and check date. Some families lack generation/configuration/specifications; these remain unknown. This is not an exhaustive global SKU catalogue. Search distinguishes catalogue matches, relevant shops to contact, and actual confirmed stock listings. Currency filters stored INR/USD listings and never converts prices. Generated catalogue assignments are stored separately and never become real shop stock. The active catalogue now uses the user-supplied dataset described below.

`docs/jammu_shops_seed.csv` preserves the original 18 shops. `docs/jammu_shops_researched.csv` adds sourced areas; `docs/shop-research.json` records successful checks, inaccessible sources and remaining area gaps. Official listing checks and third-party directory checks have different public labels; neither grants owner/visit verification. Imported shops have no stock until an owner or field agent supplies a real observation. Coordinates remain empty until supplied and confirmed; area/pincode filters never invent GPS coordinates.

For a new empty local database, run these explicit imports after starting once:

```powershell
node scripts/backup-db.mjs
node scripts/import-shops.mjs --apply
node scripts/apply-researched-catalogue.mjs
node scripts/apply-shop-research.mjs
```

The command above applies the original shop import; omit `--apply` for a dry run. Research imports are idempotent. Source data needs periodic rechecking and shop confirmation. Existing owner records are preserved.

## Delivery process and current state

**Phase 1: local implementation.** Home/search/autocomplete, fuzzy model matching, manual Jammu area or pincode, geolocation, filters, sort, list/map views, product and shop pages, directions/call, status decay, explainable ranking, independent reports, owner accounts and shop submission, one-tap and bulk confirmations, product editing, admin approval/suspension, catalogue add/merge, sample archival, admin CSV imports with row errors, field agent entry, static pages, light/dark mode, PWA shell, and offline messaging.

Core rule tests and API integration tests pass. Browser checks are tracked in `PROGRESS.md`. Public deployment, performance on a physical 4G phone, a full accessibility audit, and real email/phone authentication remain release checks. Phase 1 is not yet certified production ready.

**Phase 2: not started.** Owner CSV inventory updates, outbound reminders, reviews, saved items, and expanded analytics. Actual view/direction counters and an on-screen stale reminder are already available. The community downgrade rule is included in Phase 1 because the original Phase 1 acceptance criteria explicitly require it.

**Phase 3: not started.** Additional city/category rollout, price alerts, POS integrations, subscriptions. Cities/categories are represented as data/configuration; only Jammu electronics is launched.

## Technical choices

The original prompt recommends React/Next, PostgreSQL/PostGIS, and Redis. A Vinext/React Sites scaffold and D1 schema are retained for a future hosted build. Its dependency installation failed with EACCES/ETIMEDOUT registry errors. To provide a running instance, the working local app uses Node's built-in HTTP server, SQLite, shared TypeScript business rules, and responsive HTML/CSS/JavaScript. The map uses OpenStreetMap raster tiles through a small replaceable adapter with zoom/pan controls; it avoids a blocked Leaflet download. Coordinates are indexed, and distance uses Haversine calculations. Rate limits use the database. Outbound maps links use Google Maps directions.

The hosted scaffold is incomplete and is not the running website. Use `node local/server.mjs`; `npm start` and `npm run dev` also point to this local runtime. Sites registration already exists in `.openai/hosting.json`; reuse its project ID. No version has been deployed. Native Sites authentication would use platform-owned ChatGPT sign-in, as required by that platform.

## Pages

- `/`: search, category navigation, location, recent searches, explanation.
- `/search?q=iPhone%2015`: nearby list/map, filters, ranking explanations.
- `/products/:id`: shareable product page with server-rendered content and metadata.
- `/shops/:id`: shop details, hours, phone, searchable listings, old records.
- `/join`, `/owner`: account and shop registration, owner stock dashboard.
- Private URL printed by `scripts/admin-url.mjs`: separate setup/login, dashboard, pending requests, reversible shop moderation, source evidence, imports, catalogue editor/merge, field stock, reports and exports.
- `/about`, `/availability`, `/privacy`, `/terms`, `/contact`, `/for-shops`, `/design-system`.

## Local API

GET `/api/session`, `/api/catalogue`, `/api/search`, `/api/products/:id`, `/api/shops/:id`, `/api/owner`, `/api/admin`.

POST `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/shops`, `/api/listings`, `/api/listing-edit`, `/api/confirm`, `/api/reports`, `/api/direction-tap`, `/api/upload`.

Admin POST `/api/admin/setup`, `/api/admin/login`, `/api/admin/logout`, `/api/admin/password`, `/api/admin/shop-status`, `/api/admin/shop-edit`, `/api/admin/shop-verify`, `/api/admin/shop-delete`, `/api/admin/undo`, `/api/admin/request-changes`, `/api/admin/report-resolve`, `/api/admin/product-save`, `/api/admin/product-merge`, `/api/admin/remove-samples`, `/api/admin/import`, `/api/admin/field-shop`, `/api/admin/field-stock`. Server authorization is required independently of the hidden UI path.

All writes check same-origin JSON requests. Owner and administrator authorization is enforced server-side. No account is needed for product search, shop detail, or reports. Reports count a device or network at most once within 48 hours. On localhost all browser sessions usually share an IP; creating another browser profile will not create another independent vote.

## Data model

Relational tables: users, sessions, shops, categories, products, listings, listing_events, reports, reviews, search_logs, admin_actions, rate_limits. Shops/products/listings support soft deletion; confirmations and edits append audit events. Reviews are schema-only until Phase 2. Schema: `local/schema.sql`. Shared availability/ranking/search logic: `lib/rules.ts`; thresholds and weights: `lib/config.ts`.

Stock age: up to 48h current; over 48h caution; over 7d not recently confirmed; over 30d hidden from search. Customer positive reports do not alter owner confirmation time. Two independent negative reports after the owner's last confirmation, within 48h, flag stock until owner confirmation.

## Checks

```powershell
npm.cmd test
npm.cmd run build
node tests/browser-qa.mjs
```

Automated tests use separate temporary databases and ports 3001/3003/3004; they never consume the real admin setup or add fixture inventory to the preview database. The build bundles executable runtime files and smoke-tests the built server on port 3099 without private data. `build:hosted` remains incomplete. Browser automation has failed to start installed Edge in this restricted environment; no screenshot, physical 360px/4G, Lighthouse or full accessibility pass is claimed. See `docs/PROGRESS.md` for current results and limitations.

## Resume work

Use `codex resume --last` to resume the latest CLI conversation, or `codex resume --all` to choose the right one. A fresh session can read `PROGRESS.md`, this file, and the original build prompt to continue. Secrets and credentials are never stored in these notes.
