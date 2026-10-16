# BUILD PROMPT: Nearby Stock Finder (local product-availability search)

Fill in the three placeholders first, then paste everything below.
- [CITY/REGION] = the one launch area (e.g. a single city)
- [CURRENCY] = e.g. INR, USD
- [APP NAME] = working name, can change later

---

## 1. What you are building

Build a mobile-first web app called **[APP NAME]**. A person searches for a product (starting with **electronics only**) and sees nearby physical shops that may have it, with price, stock status, how recently that stock was confirmed, distance, and directions.

This is a **decision tool: "where should I walk or drive to?"** It does NOT do checkout, payments, delivery, reservations, or chat. Do not build those.

Launch scope: **one city/region ([CITY/REGION])**, **one category (electronics: phones, accessories, chargers, laptops, earphones, small appliances)**, currency **[CURRENCY]**. Architect so more categories and cities can be added without rewrites (category and city are data, not hard-coded).

## 2. The hard problem (design everything around it)

The product is only as good as its stock accuracy. Shops will not reliably update inventory, and stale data makes users lose trust after one wasted trip. So:

1. **Never show a bare "In stock."** Always show status together with "Confirmed X ago".
2. **Status decays automatically with time** (see section 6). A listing confirmed 3 weeks ago must not look the same as one confirmed this morning.
3. **Updating must take under 10 seconds for a shop owner** (one tap), or they will not do it.
4. **Customers can report reality** ("I went, it was out of stock" / "Yes, it was there") and this feeds the confidence signal.
5. Be honest in the UI: when data is old, say so plainly.

## 3. Users

1. **Searcher** (no account needed): finds a product, compares shops, gets directions. Can optionally sign in later to save items.
2. **Shop owner** (account required): claims a shop, manages listings, confirms stock.
3. **Admin** (internal): approves shops, reviews flags, edits the catalogue, sees health metrics.

## 4. Core flows

**A. Search flow (primary, must be flawless)**
1. Home: big search box, "Use my location" button, manual area/pincode entry as fallback if location is denied.
2. User types a product; autocomplete suggests catalogue products (brand + model), tolerant of typos and partial names ("iphn 15", "boat airdopes").
3. Results page for that product: list of nearby shops with a map toggle.
4. Tap a shop row: shop detail with listing, address, hours, phone, directions.
5. "Get directions" opens the maps app/deep link. "Call shop" uses tel: link.
6. After visiting, an unobtrusive prompt: "Was it available?" (Yes / No / Price was different).

**B. Shop owner flow**
1. Sign up with phone/email, submit shop details (name, address pinned on map, hours, phone, photos, categories).
2. Admin approves (status: pending, verified, suspended). Unverified shops are visibly labelled or excluded; decide with a setting, default to showing only verified.
3. Dashboard: list of their products, each with a **one-tap status control** and a prominent **"Confirm all still accurate"** button that refreshes the timestamp for everything untouched.
4. Add products by searching the shared catalogue (preferred, no duplicate entries), set price or price range, status, optional "negotiable" flag, optional quantity.
5. Bulk update via CSV upload (product ID/model, price, status) with validation errors shown row by row.
6. A daily/weekly reminder (email or WhatsApp-style link, make the channel pluggable) showing "N listings not confirmed in 7+ days" with a one-tap confirm link.

**C. Flag/report flow**
Any listing has "Report a problem": wrong price, out of stock, shop closed/moved, wrong product. Reports are rate-limited and tied to device/session to limit abuse.

## 5. Screens and exact content

1. **Home**: search box, location chip, category chips (Phones, Audio, Laptops, Chargers & Cables, Appliances), "Recently searched" (local storage), short "how it works" (3 steps), and one honest line: "Stock info is confirmed by shops and shoppers. Check the time stamp."
2. **Results**: product header (photo, name, brand, model, spec summary), sort control (Best match default, Nearest, Lowest price, Most recently confirmed), filters (In stock only, within X km, open now, price range, negotiable), list/map toggle. Each shop card shows: shop name, distance, open/closed now, rating, price (or range), status badge, "Confirmed 2 days ago" text, negotiable tag, and a small **"Why this rank?"** info link.
3. **Shop detail**: photos, address, map pin, hours, phone, directions button, rating and review count, verified badge, list of their electronics listings (searchable), report button.
4. **Product page** (shareable URL): product info, price range across shops, shop list. Must have SEO metadata.
5. **Shop owner dashboard**: described above, plus a stats strip (listings, % confirmed in last 7 days, customer views and direction taps this week, which is the incentive for owners to participate).
6. **Admin**: shop approval queue, reports queue, catalogue editor (add/merge products), stale-listing report, abuse flags, basic metrics.
7. **Static**: About, How availability works (explain statuses and decay plainly), Privacy, Terms, Contact, For shop owners (value pitch).
8. **States**: designed empty states, loading skeletons, no-results ("No shops nearby list this. Try a wider radius or similar products"), offline, location-denied, and error pages.

## 6. Availability model (implement exactly)

Stored per listing: `status_reported`, `last_confirmed_at`, `confirmed_by` (owner / customer_report / import), `price_min`, `price_max`, `negotiable`, `quantity` (optional).

Reported statuses: `in_stock`, `low_stock`, `out_of_stock`.

**Displayed status** is computed from reported status and age since `last_confirmed_at` (make thresholds configurable in one config file; defaults below):
- 0 to 48 hours: show reported status as is.
- 48 hours to 7 days: show reported status with a "Confirmed N days ago" caution line.
- Over 7 days: show **"Not recently confirmed"** (grey), regardless of reported status. Keep the last reported status visible in small text ("last reported: in stock").
- Over 30 days: hide from default results, still visible in shop detail with a "Possibly outdated" label.

**Customer reports** adjust a separate `community_signal`:
- A "went, available" report refreshes confidence but does NOT overwrite the owner's `last_confirmed_at`; it shows as "Customer confirmed 1 day ago".
- Two or more independent "out of stock" reports within 48 hours downgrade the displayed status to "Reported out of stock by customers" until the owner re-confirms.
- Reports from the same device or IP count once; apply rate limits.

## 7. Ranking (visible and explainable)

Default "Best match" score from 0 to 100, with a visible breakdown shown in the "Why this rank?" popover:
- Distance: 40%
- Freshness of confirmation: 35%
- Rating: 15% (use a Bayesian average so a shop with 2 reviews doesn't beat one with 200)
- Availability status: 10%

Rules: out-of-stock never ranks above in-stock; stale (7+ day) listings are capped below fresh ones. Weights live in config. Show the same breakdown to shop owners in their dashboard so they know "confirming stock daily raises your rank."

## 8. Data model (relational; PostgreSQL recommended)

Tables: `users`, `shops` (owner_id, name, address, lat, lng, phone, hours JSON, status, verified_at), `categories`, `products` (brand, model, name, specs JSON, photo, category_id, canonical_id for merging duplicates), `listings` (shop_id, product_id, price_min, price_max, negotiable, status_reported, last_confirmed_at, confirmed_by, quantity), `listing_events` (audit log of every change), `reports`, `reviews`, `search_logs` (query, results count, zero-result flag, for catalogue gaps), `admin_actions`.

Add a geospatial index (PostGIS or equivalent) on shop location. Use soft deletes. Keep the audit log so disputes can be resolved.

## 9. Search

- Full-text plus fuzzy matching on brand, model, name, and common aliases (e.g. "airpods", "AirPods Pro 2nd gen").
- Radius default 5 km, expandable to 10, 25, 50.
- Log every zero-result search; show these to admin as "products people want but we don't list."
- Do not show unrelated products to fill space.

## 10. Design direction

- **Mobile-first** (most users are on phones, often on slower networks), then desktop.
- Tone: clean, trustworthy, practical. Not flashy. Think "reliable local utility," not "startup landing page."
- One strong accent colour for primary actions, plus a **status colour system used consistently and never as the only signal** (green in stock, amber low or older, red out, grey not recently confirmed; always paired with an icon and a word for accessibility).
- Typography: one readable sans-serif family, clear hierarchy, minimum 16px body text, large tap targets (44px+).
- Cards over tables on mobile; a sticky bottom bar with List/Map toggle.
- Skeleton loaders, smooth but minimal motion, respects reduced-motion preferences.
- Light and dark mode.
- WCAG AA contrast, keyboard navigation, screen-reader labels, visible focus states.
- Provide a short design-system page: colours, type scale, spacing, components (button, badge, shop card, filter chip, toast, modal).

## 11. Tech guidance (adjust only with a stated reason)

- Front end: React or Next.js with TypeScript, Tailwind. Server-side rendering for product and shop pages (SEO and speed).
- Back end: Node (or equivalent) REST/JSON API, PostgreSQL + PostGIS, Redis for caching/rate limits.
- Maps: Leaflet + OpenStreetMap tiles to avoid early cost; keep the map provider behind an interface so Google Maps can replace it. Directions via deep link to the device maps app (no paid routing API in MVP).
- Auth: phone OTP or email magic link for owners; sessions secure and httpOnly.
- Images: resized and compressed on upload, lazy-loaded.
- PWA: installable, caches the shell and recent searches.
- Notifications: pluggable layer (email first; SMS/WhatsApp later).
- Hosting: any standard platform; provide environment variable template and deployment steps.

## 12. Non-functional requirements

- Search results under 2 seconds on a mid-range phone on 4G.
- Location data used only for the search, not stored against a user unless they opt in. Clear privacy copy.
- Input validation, rate limiting, CSRF/XSS protection, hashed secrets, no secrets in the repo.
- Basic analytics (searches, zero-result rate, direction taps, owner confirmations per week) with no invasive tracking.
- Automated tests for the availability decay, ranking, and report logic (these are the core business rules).

## 13. Cold start (be realistic, build for it)

An empty marketplace is useless. Include:
- An **admin seed tool**: bulk import shops and listings from CSV, plus a "field agent" mode where an admin on a phone can quickly add a shop and confirm its stock on site.
- Seed data for the demo: 20 shops and 80 products across the launch area, clearly marked as sample data and removable in one action.
- Do not fake reviews, ratings, or stock. Sample data must be labelled as such.

## 14. Phased delivery (commit to this order, and tell me before changing it)

**Phase 1, MVP:** search, results with status + freshness, shop detail, directions/call, owner signup + one-tap dashboard, admin approval + seeding, report button, decay logic, ranking with explanation.
**Phase 2:** CSV bulk update, reminders, reviews, community signal weighting, saved items, analytics for owners.
**Phase 3:** more categories/cities, price-drop alerts, POS/inventory integrations, shop subscription tier.
Build Phase 1 fully and properly before touching Phase 2.

## 15. Acceptance criteria for Phase 1

- A new visitor can search "[a real product in the catalogue]" and see correctly ordered nearby shops within 2 seconds.
- Every listing shows status plus a time since confirmation; a listing older than 7 days shows "Not recently confirmed".
- A shop owner can sign up, get approved, add a product, and confirm all stock in under 60 seconds total for confirmation.
- Two "out of stock" reports from different devices downgrade a listing; one device reporting twice does not.
- "Why this rank?" shows the real score breakdown.
- All screens work at 360px width, pass an accessibility check, and have designed loading, empty, and error states.
- Decay and ranking rules have passing tests.

## 16. Working instructions

- Before coding, give me: the final page list, data model, API endpoints, and any assumptions. Flag anything in this brief that is unclear or conflicts, rather than guessing.
- Do not add features outside this brief (no checkout, delivery, chat, or payments).
- Do not use fake data without labelling it.
- At each milestone, summarise what works, what is stubbed, and what is next.
- Prefer simple and reliable over clever. If a requirement is risky or expensive, say so and propose a cheaper alternative.
