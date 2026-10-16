# EXECUTE-PROMPT: modify the existing Nearby Stock Finder site (run end to end)

Project folder (already built, do NOT recreate it):
`C:\Users\sidha\Downloads\nearby-stock-finder`

Reference files (copy into `docs\` inside the project if not already there):
- `C:\Users\sidha\Downloads\jammu-stock-finder-build-guide.md`  (target spec: rules, data, Maps, design, admin, steps)
- `C:\Users\sidha\Downloads\jammu_shops_seed.csv`  (real, sourced Jammu shops)
- `C:\Users\sidha\Downloads\nearby-stock-finder-build-prompt.md`  (the original brief the site was built from)

The guide overrides the original brief wherever they conflict. The guide was written for a from-scratch build, so use it as a **target specification**, not a build order. Keep this project's existing framework, database, ORM, auth and styling. Do not re-run its Step 1 setup or switch stacks.

## 0. Operating rules (apply to the whole run)
1. Follow Part A (Master Rules) and Part C (Google Maps behaviour) of the guide. Put both into `AGENTS.md` at the project root so they persist.
2. Never rewrite or reformat working files. Before each change, list the exact files you will touch. Targeted edits only.
3. Database: new migrations only, never edit old ones. Export a backup of the current database before the first schema change or import.
4. No invented data: no fake shops, phones, addresses, prices, stock, ratings, reviews, product specs, coordinates or links. Missing values stay empty and display as "Not available".
5. No hallucinated packages or APIs. Install, import, and run to confirm.
6. Do not delete existing sample/demo data. Hide or label it as "Sample" and make it removable from admin. Tell me what you did.
7. Make a git commit after every milestone (init git first if needed, and make a "before modifications" commit before touching anything).
8. After each milestone, run the build and the tests, and re-test the main flows of all earlier milestones. If anything fails, fix it before continuing. If you cannot fix it after two attempts, revert that milestone with git, record it in `docs/PROGRESS.md`, and stop.
9. Maintain `docs/PROGRESS.md`: for each milestone list files changed, what works, what is stubbed, assumptions, test results, and the commit hash.
10. Never put secrets in the repo. Admin credentials come from environment variables or a first-run setup, never hard-coded.

## 1. Setup and audit (do first, then continue automatically)
1. Create `docs\` if missing and copy the three reference files into it. Verify all three exist and are readable.
2. Create the "before modifications" git commit and export a database backup to `backups\`.
3. Read the guide, the CSV, the original brief and the codebase. Write `docs/AUDIT.md`: stack and structure, current routes/APIs/tables, a gap table (requirement | done/partial/missing/conflicts | files | change needed) covering every guide requirement, conflicts and risks, and the ordered milestone plan below.
4. Continue to the milestones. **Stop and ask me only if** the audit finds a conflict that could destroy or overwrite existing data or code, or if something is genuinely ambiguous.

## 2. Milestones (do in this order, one at a time)
- **M1. Schema additions:** migrate to support: shop `status` (pending / active / on_hold / deactivated / rejected), `verification_status`, `source_url`, `google_maps_url`, `google_maps_place_url`, `type`, `area`, `pincode`; separate `admins` table; `listing_events`, `admin_actions`, `import_batches`; product fields `series, variant, launch_year, official_url, aliases, compatible_with`. Keep existing data intact.
- **M2. Import real shops:** importer for `docs/jammu_shops_seed.csv` with validation, dry-run report, duplicate detection (name + pincode), row-error list, import recorded in `import_batches`. Import the 18 shops. Re-running must not duplicate. Imported shops keep their `verification_status`; stock for them starts "Not recently confirmed".
- **M3. Google Maps everywhere:** "Open in Google Maps" and "Get directions" on every shop card, result row, shop page and map view, using the logic in guide Part C (place URL if set, else search link, else disabled with tooltip). Track direction taps as counts only.
- **M4. Product import pipeline:** CSV importer that rejects rows without `official_url`, supports aliases and accessory compatibility. **Do not load any product data yourself.** There is no product CSV yet. Build the importer, an example template file `docs/products_template.csv` with headers only, and tests. Report that I need to supply brand CSVs.
- **M5. User-side redesign:** richer, less bland look per guide Part D. One consistent icon set replacing the current icons (D3, via an `Icon` wrapper), better shop cards with area chip, verification badge, status badge and "Confirmed X ago", improved Home and Results, designed empty/loading/error states, light and dark mode, 360px layout.
- **M6. Footer and static pages:** footer per guide D4, with real links only (no "#"), and About, How availability works, For shop owners, Privacy, Terms, Contact pages (reuse any that exist).
- **M7. List-a-shop request flow:** a shop submitted by an owner or visitor is created `status=pending` and is invisible publicly until approved. Owner sees a "Pending approval" screen.
- **M8. Private admin foundation:** separate admin login at an unguessable path, not linked publicly; separate `admins` table; hashed password (argon2 or bcrypt); change-password screen; rate limiting and lockout; secure httpOnly session; inactivity logout; `noindex`; audit log of every admin action. Optional TOTP 2FA if feasible with the current stack. Provide a script/instructions to create my admin account using env variables. Do not invent a password; tell me how to set it.
- **M9. Admin: requests and shop control:** sidebar; live **Pending Approval** tab with count badge and approve / reject (with reason) / request changes; **All Shops** table with search, filters (area, status, verification, type), sort, pagination; per-shop actions: view all data, edit details, edit location (address, Maps link, lat/lng), hold, deactivate, reactivate, mark verified, soft delete. Every action logged and reversible. Hold/deactivate hides the shop publicly at once.
- **M10. Admin: data tools:** shop and product CSV import screens with dry-run and row errors; catalogue editor (add/edit/merge); "Field agent mode" for adding a shop and confirming stock on a phone; reports queue; stale-listing report; zero-result searches list; sample-data remover.
- **M11. Admin dashboard:** counts by status, pending count, searches, zero-result rate, direction taps, owner confirmations this week, activity log, CSV export. Only real database numbers, no fake charts.
- **M12. Shop owner dashboard refresh:** product list with one-tap status buttons, "Confirm all still accurate", add product from catalogue (no duplicates), price or range, negotiable flag, rank explainer, stats strip, stale reminder banner.
- **M13. Availability, reports and ranking check:** confirm decay rules (0-48h as reported; 48h-7d caution; over 7d "Not recently confirmed"; over 30d hidden from default results), the report rules (two independent out-of-stock reports in 48h downgrade; same device counts once) and ranking (distance 40, freshness 35, rating 15, availability 10; out-of-stock never above in-stock). Fix gaps and add unit tests for what is missing.
- **M14. Hardening and final regression:** input validation, CSRF/XSS protection, rate limits, security headers, image compression, accessibility checks, performance check, full regression of M1-M13, update README with run steps, env variables and how to create the admin account.

## 3. Things you cannot do. Do not fake them.
- You cannot verify shops on Google Maps or by phone. Leave `verification_status` as in the CSV and flag every unverified shop in the report.
- You cannot supply product data. Build the pipeline only (M4).
- You cannot add the missing Jammu areas (Rehari, Residency Road, Jewel Chowk, Channi Himmat, Janipur, Nanak Nagar, Sainik Colony, Satwari and others). Make sure admin can add them (M9, M10) and list them as pending work.
- Do not invent latitude/longitude. Leave empty until admin sets them.

## 4. Final deliverable
When all milestones are done (or stopped by rule 8), reply with:
1. A short table: milestone | done / partial / not done | commit hash
2. Exactly what I must do myself (create admin account, supply product CSVs, verify shops, add missing areas)
3. How to run the site and the admin
4. Known limitations and anything you assumed

Begin Section 1 now.
