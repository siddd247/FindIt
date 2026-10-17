# Nearby Stock Finder - Jammu

A college demonstration of local electronics discovery for shoppers, shop owners and a separate administrator. The working application is the standalone Node.js/SQLite runtime in local/ and web/. It does not require framework packages to run.

## Start

Requires Node.js 24.16.0 or newer.

    npm start

Default address: http://127.0.0.1:3000 . If that port is occupied, set a free port first in PowerShell:

    $env:PORT='3006'
    npm start

The current review instance is http://127.0.0.1:3006 . Earlier loopback previews on ports 3000-3002 and 3005 forward here when their backend lacks grouped catalogue support. Deployed origins never change ports. A newly started current server stays on its own port.

Data is kept in .local/stock.sqlite, photos in .local/uploads, and private setup settings in .local/security.json. These files and database backups are excluded from Git and builds. The server binds to this computer only. Use Ctrl+C for clean shutdown.

## Access

- Shoppers: no account required. Search products, compare store catalogues, browse variants, view shops, get Maps directions and report actual inventory observations.
- Owners: /owner for sign-in; /join for registration. Authenticated shop registrations become active immediately under npm start. Set OWNER_AUTO_APPROVAL=0 to require review. Anonymous shop suggestions always require review. Existing suspended/rejected shops are not reactivated automatically.
- Administrator: /control, with separate admin authentication and server-side role checks. The previous private entry URL redirects here; no public navigation link is shown. Run node scripts/admin-url.mjs for first-time setup if needed. No default credentials are supplied. Use Shop users to create credentials and assign an existing shop. All 32 current shops are unassigned; both administrator records are preserved.

Admin setup uses a one-time token. Admin passwords use Argon2id; owner passwords use scrypt. Both session tokens are hashed, cookies are HttpOnly/SameSite, writes check request origin, and throttling remains enabled. Legacy admin-role users cannot enter the owner portal. Self-service email verification and password recovery are not connected.

## Catalogue, store prices and inventory

The active catalogue has 164 models represented by 918 distinct variant records across 11 verticals: Phones, Audio, Laptops, Chargers & Cables, Appliances, Tablets, Watches, Desktops, Monitors, TV & Home and Accessories. All 32 active shops have catalogue assignments for all 918 variants (29,376 pairs).

Search now shows one card per parent model. Product pages switch actual child configurations without a reload, preserve selection in the URL, and update price, specifications and shop status. Shop pages drill down through categories to shop-specific model pages. All 918 active legacy IDs redirect to their parent with the child selected. The 431 archived IDs show a noindex, no-longer-listed page without redirects.

The original reference_price is retained unchanged. The reusable getShopPrices(product, shops) reads it as the base_price input and calculates deterministic per-store indicative prices. Edit web/shop-pricing-config.mjs for shop ranges, category spreads, rounding, 85%-115% bounds and optional daily movement. Daily movement is off by default. The catalogue seed uses the separately configured four-state stock distribution. Pass the full directory for consistent tie handling across views. All 918 variants currently have 32 distinct store prices within bounds.

Model comparisons list the selected variant across shops, with available/low-stock offers sorted first by price and exactly one Best price badge. Out-of-stock/unavailable offers stay visible below them. Seed/demo offers remain distinguishable from shop-entered offers. The seed distribution is 16,288 available, 5,844 low stock, 4,431 out of stock and 2,813 unavailable. These statuses are demonstration data, not independent stock observations. Market indicative prices are not shop quotes.

Existing actual inventory rows total zero. Catalogue comparisons are populated, but the Confirmed Stock view correctly has no observations until an owner or field agent enters them. Missing shop details remain unavailable: 32 missing opening schedules, 19 missing phone numbers and one missing pincode. The sourced Bari Brahmana pincode 181133 is retained even though it falls outside the requested 180001-180020 interval. Administrators can edit hours, contact details and source evidence; no unrelated phone numbers were inserted.

## Review and checks

    npm test
    npm run build
    node scripts/audit-local.mjs

The automated suite covers authentication separation, owner registration, moderation, catalogue imports, stock reports/freshness, deterministic prices, filters, keyboard suggestions, password visibility, theme state and graceful SQLite shutdown. Tests and build checks use isolated temporary databases and available ports, await server exit and remove their own temporary directories. The runtime uses one SQLite connection per process with foreign keys, WAL and a busy timeout. Migrations 004 and 005 add parent/variant/offer tables, seed provenance, request review results and model redirect/default controls while retaining original records.

The build compiles the shared TypeScript, validates runtime JavaScript and smoke-tests the executable package in dist/local. No live database, secrets, uploads or account data are packaged. A native Node experimental notice may be emitted by the TypeScript compilation API; it is not a runtime error.

Browser/device visual checks remain unverified in this restricted environment. The browser QA script is retained; PREVIEW_URL selects its target. npm run lint currently requires the unavailable ESLint executable. The retained hosted framework scaffold is separate from the running site and has not been certified by this review. The current work does not deploy the app publicly.

Shop dashboards provide ownership-scoped variant prices/status, CSV import/export, history, rank and catalogue requests. Admin tools manage parent/variant metadata and supplied images, axis order/defaults, merge/split/move operations, requests, shop accounts and data quality, with an audit trail.

Seed data can be re-rolled with node scripts/seed-catalogue.mjs --reroll --apply --seed=your-seed or removed with --wipe --apply. These commands back up first and preserve offers edited by shops. Migration dry runs use node scripts/migrate-catalogue.mjs; add --apply only after review.

See docs/CATALOGUE-RESTRUCTURE.md for the current phase results and exact changed files. See docs/RELEASE-AUDIT.md for earlier findings, backups and limitations. docs/PROGRESS.md preserves historical implementation records. Internal compatibility filenames and data provenance remain intact even though public-facing catalogue language has been updated.
