# Nearby Stock Finder — Jammu

A local electronics availability finder for shoppers, shop owners, and administrators. Launch area: Jammu, India. INR/USD selection filters stored listing currencies; there is no automatic currency conversion.

## Run the working local instance

Requires Node.js 24+ (built-in SQLite and TypeScript stripping). No npm installation is needed for the local app.

```powershell
cd C:\Users\sidha\Downloads\nearby-stock-finder
node local/server.mjs
```

Open **http://127.0.0.1:3000**. The server binds only to this computer. Stop it with Ctrl+C. To use another port: `$env:PORT='3002'` before starting.

The first locally registered account becomes admin. Create it at **My shop → Create an account**. Later accounts are shop owners. Local authentication uses email/password with scrypt hashes and httpOnly session cookies. It is development authentication: email verification, password recovery, and outbound email delivery are not connected. Do not expose this runtime as a public production service.

Data persists in `.local/stock.sqlite`; uploaded photos live in `.local/uploads/`. Both are ignored by Git. Restarting the app preserves accounts, shops, listings, and reports. New local databases include 20 sample shops and 80 sample products. All sample records are labelled; directions and calls are disabled for demo shops. No reviews or ratings are fabricated.

## Delivery process and current state

**Phase 1: local implementation.** Home/search/autocomplete, fuzzy model matching, manual Jammu area or pincode, geolocation, filters, sort, list/map views, product and shop pages, directions/call, status decay, explainable ranking, independent reports, owner accounts and shop submission, one-tap and bulk confirmations, product editing, admin approval/suspension, catalogue add/merge, sample seeding/removal, admin CSV seed import with row errors, field agent entry, static pages, light/dark mode, PWA shell, and offline messaging.

Core rule tests and API integration tests pass. Browser checks are tracked in `PROGRESS.md`. Public deployment, performance on a physical 4G phone, a full accessibility audit, and real email/phone authentication remain release checks. Phase 1 is not yet certified production ready.

**Phase 2: not started.** Owner CSV inventory updates, reminders, reviews, saved items, and owner analytics. The community downgrade rule is included in Phase 1 because the original Phase 1 acceptance criteria explicitly require it.

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
- `/admin`: approval/reports/catalogue/stale data/seed import/field agent workspace.
- `/about`, `/availability`, `/privacy`, `/terms`, `/contact`, `/for-shops`, `/design-system`.

## Local API

GET `/api/session`, `/api/catalogue`, `/api/search`, `/api/products/:id`, `/api/shops/:id`, `/api/owner`, `/api/admin`.

POST `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/shops`, `/api/listings`, `/api/listing-edit`, `/api/confirm`, `/api/reports`, `/api/direction-tap`, `/api/upload`.

Admin POST `/api/admin/shop`, `/api/admin/resolve`, `/api/admin/product`, `/api/admin/merge`, `/api/admin/seed`, `/api/admin/remove-samples`, `/api/admin/import`, `/api/admin/field-shop`.

All writes check same-origin JSON requests. Owner and administrator authorization is enforced server-side. No account is needed for product search, shop detail, or reports. Reports count a device or network at most once within 48 hours. On localhost all browser sessions usually share an IP; creating another browser profile will not create another independent vote.

## Data model

Relational tables: users, sessions, shops, categories, products, listings, listing_events, reports, reviews, search_logs, admin_actions, rate_limits. Shops/products/listings support soft deletion; confirmations and edits append audit events. Reviews are schema-only until Phase 2. Schema: `local/schema.sql`. Shared availability/ranking/search logic: `lib/rules.ts`; thresholds and weights: `lib/config.ts`.

Stock age: up to 48h current; over 48h caution; over 7d not recently confirmed; over 30d hidden from search. Customer positive reports do not alter owner confirmation time. Two independent negative reports after the owner's last confirmation, within 48h, flag stock until owner confirmation.

## Checks

```powershell
node --test tests/rules.test.ts tests/api.test.mjs
node tests/browser-qa.mjs
```

The API test creates a separate temporary database and server on port 3001. It does not claim admin or add test accounts to the running preview database. Browser QA uses an installed Edge and the working preview on port 3000; screenshots are saved under `.local/`.

## Resume work

Use `codex resume --last` to resume the latest CLI conversation, or `codex resume --all` to choose the right one. A fresh session can read `PROGRESS.md`, this file, and the original build prompt to continue. Secrets and credentials are never stored in these notes.
