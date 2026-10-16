# Project execution rules

Follow docs/EXECUTE-PROMPT.md. It overrides the guide's original setup and step order: preserve the existing stack; execute M1-M14 sequentially and continue automatically after passing checks. The guide is the target specification. Stop and revert a failed milestone after two unsuccessful repair attempts. Never recreate the app or reset existing data. List exact files before every edit. Retain samples, labelled or hidden.

Session update: the user explicitly authorized resuming after the earlier two-attempt stop. Continue the ordered milestones and repair prerequisites autonomously. The active application is the existing Node/SQLite/CSS runtime; a genuine compiled-and-smoke-tested build of that runtime is appropriate. Preserve the separate unfinished hosted build and report its limitations. This does not authorize erasing data, inventing real records, or bypassing tool permissions.

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


## PART C. GOOGLE MAPS BEHAVIOUR (applies everywhere a shop appears)
- Every shop card, shop page, result row, and the map view has a **"Open in Google Maps"** button.
- Click logic: use `google_maps_place_url` if set; else the search link from the shop name + address + pincode; else (no address) disable the button with a tooltip "Location not available".
- Opens in a new tab (`target="_blank" rel="noopener"`); on mobile it opens the Maps app.
- Also a **"Get directions"** link: `https://www.google.com/maps/dir/?api=1&destination=<url-encoded name+address>`.
- Track clicks as `direction_taps` (counts only, no personal data) for the owner dashboard.

---

