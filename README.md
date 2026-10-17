# Nearby Stock Finder - Jammu

A college demonstration of local electronics discovery for shoppers, shop owners and a separate administrator. The working application is the standalone Node.js/SQLite runtime in local/ and web/. It does not require framework packages to run.

## Start

Requires Node.js 24.16.0 or newer.

    npm start

Default address: http://127.0.0.1:3000 . If that port is occupied, set a free port first in PowerShell:

    $env:PORT='3005'
    npm start

The current review instance is http://127.0.0.1:3005 . Earlier loopback previews on ports 3000-3002 forward to this instance when their backend lacks the release endpoint. Deployed origins never change ports. A newly started current server stays on its own port.

Data is kept in .local/stock.sqlite, photos in .local/uploads, and private setup settings in .local/security.json. These files and database backups are excluded from Git and builds. The server binds to this computer only. Use Ctrl+C for clean shutdown.

## Access

- Shoppers: no account required. Search products, compare store catalogues, browse variants, view shops, get Maps directions and report actual inventory observations.
- Owners: /owner for sign-in; /join for registration. Authenticated shop registrations become active immediately under npm start. Set OWNER_AUTO_APPROVAL=0 to require review. Anonymous shop suggestions always require review. Existing suspended/rejected shops are not reactivated automatically.
- Administrator: run node scripts/admin-url.mjs using the same PORT and LOCAL_DATA_DIR as the server, then open the private link it prints. Admin accounts, cookies and permissions are separate from owner accounts; /admin intentionally returns 404. No default credentials are supplied.

Admin setup uses a one-time token. Admin passwords use Argon2id; owner passwords use scrypt. Both session tokens are hashed, cookies are HttpOnly/SameSite, writes check request origin, and throttling remains enabled. Legacy admin-role users cannot enter the owner portal. Self-service email verification and password recovery are not connected.

## Catalogue, store prices and inventory

The active catalogue has 164 models represented by 918 distinct variant records across 11 verticals: Phones, Audio, Laptops, Chargers & Cables, Appliances, Tablets, Watches, Desktops, Monitors, TV & Home and Accessories. All 32 active shops have catalogue assignments for all 918 variants (29,376 pairs).

The original reference_price is retained unchanged. The reusable getShopPrices(product, shops) reads it as the base_price input and calculates deterministic per-store indicative prices. Edit web/shop-pricing-config.mjs for shop ranges, category spreads, rounding, 85%-115% bounds and optional daily movement. Optional stock exclusions and daily movement are off by default. Pass the full directory for consistent tie handling across views. All 918 variants currently have 32 distinct store prices within bounds.

Shop Catalogues compares the same exact variant across eligible shops, ordered by indicative price with one Best price badge. Location filters restrict the compared stores. Product Variants lists other configurations. Confirmed Stock shows separately entered owner/field observations with freshness, price, availability and negotiability filters. Unknown coordinates do not satisfy a distance filter. Availability and identity verification remain distinct from catalogue registration. Market indicative prices are not shop quotes.

Existing actual inventory rows total zero. Catalogue comparisons are populated, but the Confirmed Stock view correctly has no observations until an owner or field agent enters them. Missing shop details remain unavailable: 32 missing opening schedules, 19 missing phone numbers and one missing pincode. The sourced Bari Brahmana pincode 181133 is retained even though it falls outside the requested 180001-180020 interval. Administrators can edit hours, contact details and source evidence; no unrelated phone numbers were inserted.

## Review and checks

    npm test
    npm run build
    node scripts/audit-local.mjs

The automated suite covers authentication separation, owner registration, moderation, catalogue imports, stock reports/freshness, deterministic prices, filters, keyboard suggestions, password visibility, theme state and graceful SQLite shutdown. Tests and build checks use isolated temporary databases and available ports, await server exit and remove their own temporary directories. The runtime uses one SQLite connection per process with foreign keys, WAL and a busy timeout. Migration 003 adds five query indexes without changing records.

The build compiles the shared TypeScript, validates runtime JavaScript and smoke-tests the executable package in dist/local. No live database, secrets, uploads or account data are packaged. A native Node experimental notice may be emitted by the TypeScript compilation API; it is not a runtime error.

Browser/device visual checks remain unverified in this restricted environment. The browser QA script is retained; PREVIEW_URL selects its target. npm run lint currently requires the unavailable ESLint executable. The retained hosted framework scaffold is separate from the running site and has not been certified by this review. The current work does not deploy the app publicly.

See docs/RELEASE-AUDIT.md for findings, evidence, exact changed files, backup and limitations. docs/PROGRESS.md preserves historical implementation records. Internal compatibility filenames and data provenance remain intact even though public-facing catalogue language has been updated.
