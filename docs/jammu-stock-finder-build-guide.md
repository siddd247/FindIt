# STEP-BY-STEP BUILD GUIDE: Jammu Stock Finder
(for an AI website builder. Paste this whole file, attach `jammu_shops_seed.csv`, then send ONE step at a time.)

Before pasting, replace: **[APP NAME]** = your working name. City = **Jammu, J&K, India**. Currency = **INR (₹)**.

---

## PART A. MASTER RULES (read first, apply to every step)

Paste this block as the first message and tell the builder it applies for the whole project.

### A1. What the product is
A mobile-first web app where a person searches an electronics product and sees real nearby Jammu shops that may have it, with price, stock status, "confirmed X ago", distance, and a button that opens the shop's pin in Google Maps. No checkout, payments, delivery, chat or reservations. Three sides: **User**, **Shop owner**, **Admin (me only)**.

### A2. Working rules (non-negotiable)
1. **One step at a time.** Do only the step I send. Do not start the next one. Do not "also add" extras.
2. **Never rewrite working code.** Before changing anything, list the exact files you will touch. Only edit those. Do not regenerate, rename, move or reformat files outside that list.
3. **Change, don't replace.** Use targeted edits. If a file needs more than ~30% changed, stop and tell me why before doing it.
4. **No invented data.** Never make up shops, phone numbers, addresses, prices, stock, ratings, reviews, product specs or links. If a value is missing, leave it empty and show "Not available". Anything you are unsure about, ask me.
5. **No hallucinated libraries or APIs.** Use only packages you install and can import. After installing, confirm the version. If you are not sure an API exists, say so instead of guessing.
6. **Everything runs after every step.** At the end of each step: app builds with no errors, no console errors, no broken routes. Report what you ran and what you saw.
7. **Report format after every step** (keep it short):
   - Files created / files changed (exact paths)
   - What now works (and how I can check it)
   - What is stubbed or not done
   - Anything you assumed (flag it, do not hide it)
   - Next step you recommend (do not start it)
8. **Save a checkpoint.** Commit with a clear message (or tell me to save a copy) at the end of each step so I can roll back.
9. **Regression check.** Before finishing a step, re-test the main flows of all earlier steps (list which ones you tested). If anything broke, fix it before reporting.
10. **If my request conflicts with an earlier step or this guide, stop and tell me.** Do not silently pick one.

### A3. Data honesty rules
- All shop data comes only from `jammu_shops_seed.csv` (real, sourced) or from shops/admin entering it later through the app.
- Every shop has a `verification_status`. Show unverified ones with a visible "Listing found online, not yet confirmed" label. Never show an unverified shop as "Verified".
- Stock status for imported shops starts as **"Not recently confirmed"** (we have no stock data until someone confirms it). Do not set fake stock.
- No fake reviews or ratings. A shop with no reviews shows "No reviews yet".
- Any demo data must be labelled "Sample" and be removable in one admin action.

### A4. Tech stack (use unless you give a stated reason)
- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL (with PostGIS or a lat/lng + Haversine fallback) via Prisma
- Auth: email magic link or phone OTP for shop owners; separate password-based admin login
- Maps: **Google Maps links only** (see Part C). A Leaflet/OSM map view is optional later.
- Icons: **Lucide** or **Phosphor** (one set only, see D3)
- Deploy: Vercel/Render/Railway (any), with `.env.example`

---

## PART B. REAL DATA: WHAT I HAVE AND WHAT IS STILL MISSING

### B1. Shops (attached: `jammu_shops_seed.csv`)
- 18 real shops/listings found in public sources, each with a `source_url`.
- Areas covered: Gandhi Nagar, Gole Market, Kachi Chhawni, Prem Nagar/Gummat, Raghunath Bazaar, Trikuta Nagar, Bakshi Nagar, Talab Tillo, Wave Mall (Channi Rama).
- **Not yet covered (need adding before launch):** Rehari Colony, Residency Road, Jewel Chowk, Channi Himmat, Janipur, Nanak Nagar, Sainik Colony, Satwari, Bathindi, Nagrota, Digiana/Gangyal, Narwal, Canal Road, Shastri Nagar. Target: 2-3 shops per area.
- **Honest limits:** the shops come from online directories, which are often out of date. Some have no phone or exact address. Chains such as Croma, Reliance Digital and Vijay Sales had **no confirmed Jammu store found**, so they are NOT in the file. The Wave Mall Apple-reseller row is marked "needs verification".
- **How to add the missing ones (admin does this, not the builder):** use the Admin "Field agent mode" (Step 12) or a CSV import. For each shop, confirm on Google Maps or by visiting/calling, then copy the real Maps share link into the shop record.
- Phone numbers: only those published on official brand/store pages are included. Marketplace-listed numbers were left out on purpose.

### B2. Google Maps links in the seed file
- The `google_maps_url` column uses the official Maps search format `https://www.google.com/maps/search/?api=1&query=...`. It opens Google Maps at a search for that shop. It is not a saved place pin.
- Each shop has an optional field `google_maps_place_url`. When admin pastes the real share link (maps.app.goo.gl/... or the full place URL), the app uses that instead. Until then it uses the search link.
- Do not invent coordinates. Latitude/longitude stay empty until admin sets them (Step 6 includes a "set location" tool).

### B3. Product catalogue (5 years, 7 for major brands)
The builder must NOT invent products or specs. Build a catalogue **import pipeline**, then load data into it:
- Scope: phones, tablets, laptops, earphones/headphones, smartwatches, chargers, cables, power banks, cases, tempered glass, small appliances.
- Time window: models released in the last 5 years (since Oct 2021); 7 years (since Oct 2019) for Apple, Samsung, OnePlus, Xiaomi/Redmi, Realme, Oppo, Vivo, HP, Dell, Lenovo, ASUS.
- **Source of truth:** official brand product pages and official India spec sheets. Do not scrape sites that forbid it. Prefer a CSV I supply or an official/licensed data source.
- Required columns: `brand, series, model, variant (RAM/storage/colour), category, launch_year, official_url, image_url (only if licence allows), aliases`.
- Every product row keeps its `official_url`. A product without a source is rejected by the importer.
- Load in batches by brand (Apple first, then Samsung, etc.), each batch reviewed by me before the next.
- Add-ons (accessories) are first-class products with a `compatible_with` field (e.g. "iPhone 15").

---

## PART C. GOOGLE MAPS BEHAVIOUR (applies everywhere a shop appears)
- Every shop card, shop page, result row, and the map view has a **"Open in Google Maps"** button.
- Click logic: use `google_maps_place_url` if set; else the search link from the shop name + address + pincode; else (no address) disable the button with a tooltip "Location not available".
- Opens in a new tab (`target="_blank" rel="noopener"`); on mobile it opens the Maps app.
- Also a **"Get directions"** link: `https://www.google.com/maps/dir/?api=1&destination=<url-encoded name+address>`.
- Track clicks as `direction_taps` (counts only, no personal data) for the owner dashboard.

---

## PART D. DESIGN SPEC (so the UI is less bland)

### D1. Look and feel
- Warm, confident, local. Not generic SaaS. Pick **one** distinctive accent colour and one deep neutral; keep a green/amber/red/grey status system (never colour alone: always icon + word).
- Typography: one display font for headings plus one readable body font (via Google Fonts or `next/font`). Body ≥ 16px, tap targets ≥ 44px.
- Rich shop cards: area chip, "Verified / Found online" badge, status badge, "Confirmed 2 days ago", price, distance, big "Open in Google Maps" button.
- Light and dark mode. Skeleton loaders. Respect reduced motion. WCAG AA.

### D2. Three experiences
- **User:** big search, category tiles with real illustrations/icons, filters (in stock, area, price, open now), list/map toggle, shareable product pages.
- **Shop owner:** very simple. A list of my products with one-tap status buttons and a big "Confirm everything is still accurate" button.
- **Admin:** dense, professional dashboard (see Steps 10-13).

### D3. Icons (fix the "AI-looking" icons)
- Use **one** icon library everywhere (Lucide or Phosphor). No emoji as icons. No mixed styles.
- Same stroke width and size scale across the app (16 / 20 / 24).
- Product category icons: phone, laptop, headphones, watch, charger/cable, tablet, appliance, accessories.
- Status icons: check-circle (in stock), alert (low), x-circle (out), clock (not recently confirmed).
- Provide an `Icon` wrapper component so the set can be swapped in one place.

### D4. Footer (build once, reuse)
Columns: **Brand + one-line promise** | **For shoppers** (How it works, How stock is confirmed, Browse areas) | **For shop owners** (List your shop, Owner login, Owner guide) | **Company** (About, Contact, Report a problem) | **Legal** (Privacy, Terms). Bottom bar: © year, "Stock info is confirmed by shops and shoppers. Check the time stamp.", and a back-to-top link. Fully responsive; all links go to real pages, never "#".

---

## PART E. THE STEPS (send one at a time)

For every step below, the builder must follow Part A. Each step lists: Goal, Do, Do NOT, Done when.

### STEP 1. Project setup and design system
- **Goal:** empty but running app with tokens and components.
- **Do:** create the Next.js + TS + Tailwind project; fonts; colour tokens (light/dark); spacing and type scale; the `Icon` wrapper (D3); base components (Button, Badge, Card, Chip, Input, Modal, Toast, Skeleton); a hidden `/design-system` page showing them; `.env.example`; README with run steps.
- **Do NOT:** build any real page or database yet.
- **Done when:** `npm run dev` and `npm run build` pass; `/design-system` renders in light and dark.

### STEP 2. Database schema and migrations
- **Goal:** the data model, nothing else.
- **Do:** tables: `users`, `admins` (separate), `shops` (name, type, area, address, pincode, phone, hours JSON, lat, lng, google_maps_url, google_maps_place_url, source_url, verification_status, status [pending|active|on_hold|deactivated|rejected], owner_id, soft delete), `categories`, `products` (brand, series, model, variant, category, launch_year, official_url, aliases, compatible_with), `listings`, `listing_events` (audit log), `reports`, `reviews`, `search_logs`, `admin_actions`, `import_batches`. Add indexes (text search, location).
- **Do NOT:** write UI. Do not seed fake rows.
- **Done when:** migration runs clean on an empty DB and can be rolled back; schema doc added to README.

### STEP 3. Import the real shops
- **Goal:** load `jammu_shops_seed.csv` safely.
- **Do:** an importer script with validation: required fields, duplicate detection (name+pincode), a dry-run report, row-by-row error list, each import recorded in `import_batches`. Imported shops get `status=active` but `verification_status` kept from the file. Generate `google_maps_url` if missing.
- **Do NOT:** invent lat/lng, phone, rating or stock. Do not edit the CSV contents.
- **Done when:** 18 shops imported; re-running the import creates no duplicates; the report shows 0 silent failures.

### STEP 4. Product catalogue importer + first brand batch
- **Goal:** the product pipeline (B3), loaded with ONE brand only.
- **Do:** CSV importer with validation (rejects rows without `official_url`); alias handling ("airpods", "iphn"); I will supply the Apple CSV. Import it and show a summary table.
- **Do NOT:** add products yourself from memory. Do not import other brands yet.
- **Done when:** Apple products searchable in the database; rejected rows are listed with reasons.
- **Repeat as STEP 4b, 4c...** one brand per message (Samsung, OnePlus, Xiaomi/Redmi, Realme, Oppo, Vivo, HP, Dell, Lenovo, ASUS, then audio, accessories, appliances).

### STEP 5. Search API
- **Goal:** backend search only.
- **Do:** `/api/search?q=&area=&lat=&lng=&radius=` with fuzzy + full-text over brand/model/aliases; typo tolerance; radius 5/10/25/50 km; if no coordinates, filter by area/pincode; log every query and zero-result searches.
- **Do NOT:** build UI.
- **Done when:** tests prove "iphn 15", "airpods pro" and a partial model return sensible results; zero-result queries are logged.

### STEP 6. Availability and ranking logic (the core rules)
- **Goal:** pure functions with tests.
- **Do:** displayed-status rules: 0-48h as reported; 48h-7d with "Confirmed N days ago"; over 7d "Not recently confirmed" (grey, last reported shown small); over 30d hidden from default results. Customer reports: two independent out-of-stock reports in 48h downgrade status; same device counts once. Ranking: distance 40, freshness 35, rating 15 (Bayesian), availability 10; out-of-stock never above in-stock. All thresholds in one config file. Also an admin "set location" helper that accepts a pasted Maps link and stores lat/lng only if the admin confirms.
- **Do NOT:** touch UI.
- **Done when:** unit tests pass for decay, report rules, ranking, and the "Why this rank?" breakdown.

### STEP 7. User side: Home, Results, Product, Shop pages
- **Goal:** the shopper experience, wired to real search.
- **Do:** Home (search, area chips, category tiles, honest line, how-it-works); Results (cards from D1, filters, sort, list/map toggle, "Why this rank?"); Product page (shareable URL, SEO metadata); Shop detail (address, hours, phone, verification label, listings, report button). Add the Google Maps buttons from Part C everywhere. Designed empty/loading/error/offline/location-denied states.
- **Do NOT:** build owner or admin screens.
- **Done when:** I can search, open a shop and click "Open in Google Maps" and land on the right Maps search. 360px layout is clean.

### STEP 8. Footer and static pages
- **Do:** footer from D4 and pages: About, How availability works, For shop owners, Privacy, Terms, Contact. Replace any placeholder links.
- **Done when:** no link in the footer goes to "#" or a 404.

### STEP 9. Shop owner accounts and list-a-shop request
- **Goal:** the live request flow.
- **Do:** owner sign-up/login; "List your shop" form (name, address, area, pincode, phone, hours, categories, Maps link, photos); submit creates a shop with `status=pending`. The shop is **not public** until approved. Show the owner a "Pending approval" screen.
- **Do NOT:** auto-approve anything.
- **Done when:** a test submission appears in the database as pending and is invisible to the public site.

### STEP 10. Admin foundation: private login and layout
- **Goal:** the admin area only I can enter.
- **Do:** a separate admin login at an unguessable path (e.g. `/admin-login`, not linked anywhere public); separate `admins` table with its own ID; hashed password (argon2/bcrypt); rate-limited login with lockout; secure httpOnly session; optional 2FA (TOTP); "Change password" screen; `noindex`; auto logout on inactivity; audit log of every admin action. Admin credentials come from env/first-run setup, never hard-coded.
- **Do NOT:** reuse the owner login or its accounts.
- **Done when:** public users and owners cannot reach any admin route (tested); wrong passwords are throttled.

### STEP 11. Admin: requests (approval tab) and shop control
- **Do:** sidebar sections; **Pending Approval** tab with live new requests, count badge, approve / reject (with reason) / request changes; **All Shops** table with search, filters (area, status, verification, type), sort, pagination; per-shop actions: view full data, edit details, **edit location** (address, Maps link, lat/lng), **hold**, **deactivate**, **reactivate**, mark Verified, delete (soft); every action is logged and reversible.
- **Done when:** a pending request from Step 9 can be approved and then appears on the public site; hold/deactivate hides the shop immediately.

### STEP 12. Admin: data tools
- **Do:** catalogue editor (add/edit/merge products); CSV import screens for shops and products with dry-run reports; "Field agent mode" for adding a shop and confirming stock on a phone; reports queue (wrong price, closed, out of stock); stale-listing report; zero-result searches ("products people want that we don't list"); sample-data remover.
- **Done when:** I can import a CSV, see row errors, and fix a flagged listing.

### STEP 13. Admin: dashboard and system
- **Do:** overview (shops by status, pending count, searches, zero-result rate, direction taps, owner confirmations this week); activity log; admin account/security settings; export (CSV) of shops and logs.
- **Done when:** numbers match the database and no chart uses fake data.

### STEP 14. Shop owner dashboard
- **Do:** list of my products with one-tap status control; "Confirm all still accurate"; add product by searching the catalogue (no duplicates); price or range; negotiable flag; optional quantity; rank explainer; stats strip (views, direction taps, % confirmed in 7 days); stale-listing reminder banner.
- **Done when:** an owner can confirm all stock in under 10 seconds and the timestamp updates.

### STEP 15. Reports and community signal
- **Do:** "Was it available?" prompt, report form, rate limiting per device/session, effect on displayed status per Step 6.
- **Done when:** two reports from two devices downgrade a listing; one device twice does not.

### STEP 16. Hardening, performance, accessibility
- **Do:** input validation, CSRF/XSS protection, rate limits, security headers, image compression and lazy load, PWA basics, Lighthouse pass, keyboard and screen-reader checks, full regression of Steps 1-15.
- **Done when:** search under 2 seconds on throttled 4G; no failing tests; accessibility check passes.

### STEP 17. Launch checklist
- **Do:** production env vars, backups, privacy copy for location use, 404/500 pages, analytics (non-invasive), a written list of known limitations. Do not add features.

---

## PART F. HOW TO REQUEST CHANGES LATER (so nothing breaks)

Use this template for every modification:

```
CHANGE REQUEST
What I want: <one specific change>
Where: <page / component / admin section>
Do not touch: everything else
Before editing: list the exact files you'll change and why
After editing: re-test <flows that could be affected> and report results
If it conflicts with an earlier step: stop and ask
```

Rules for the builder on changes:
1. Make the smallest edit that works.
2. Don't rename or move files unless asked.
3. If a fix needs a database change, write a new migration; never edit old migrations.
4. If something is unclear, ask one question instead of guessing.
5. If a change would affect more than the stated area, say so first.

## PART G. STEP-BY-STEP CHECKLIST FOR YOU (not for the builder)

- [ ] After each step, open the app and test it yourself before sending the next.
- [ ] After Step 3, spot-check 5 shops by clicking their Maps buttons.
- [ ] Add the missing areas (B1) via Step 12 once admin exists. Verify each shop on Google Maps or by phone.
- [ ] Never launch with shops still labelled "Listing found online" unless you are fine showing that label.
- [ ] Keep a backup of the database before every import.
