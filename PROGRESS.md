# Nearby Stock Finder — continuation notes

## User request
Read `C:\Users\sidha\Downloads\nearby-stock-finder-build-prompt.md` and execute the project in the specified phases. Finish Phase 1 before Phase 2. Launch in Jammu, India; support explicit INR/USD selection without invented FX conversion. Working app name: Nearby Stock Finder.

## Location and hosting identity
Project: `C:\Users\sidha\Downloads\nearby-stock-finder`
Sites skill: `C:\Users\sidha\.codex\plugins\cache\openai-curated-remote\sites\1.0.0\skills\sites\SKILL.md`
Plugin root: `C:\Users\sidha\.codex\plugins\cache\openai-curated-remote\sites\1.0.0`
Site ID is persisted in `.openai/hosting.json`. Reuse it; never create a second Site.
Site is registered but NOT built or deployed. Keep it private.

## Work done
- Read full build prompt and Sites storage/identity/local preview/troubleshooting references.
- Supplied page list, data model, endpoint outline, and assumptions in conversation.
- Copied and configured official Vinext portable starter; D1 binding enabled.
- Added configurable Jammu defaults, decay rules, Bayesian ranking, independent-report logic, fuzzy matching, geodistance calculation.
- Added relational Drizzle schema and labelled sample generator (20 shops / 80 products).
- Added API source for shop registration, listings, one-tap confirmations, reports, admin setup/approval/seeding/catalogue and search.
- These source files are unverified; implementation is in progress.

## Working local website — added after the initial scaffold

The user requested a local URL. Dependency downloads were blocked, so a dependency-free local implementation was created using Node 24 built-in HTTP/SQLite and shared TypeScript rules. The user was told about this setup change. Delivery phase order was preserved.

- **Working URL:** http://127.0.0.1:3000
- **Start:** `node local/server.mjs` from the project directory; `npm start` / `npm run dev` also point to this runtime. `START-LOCAL.cmd` is a double-click launcher.
- **Current retained server session:** 60687 (this tool session may no longer exist after closing the terminal; check HTTP before starting a second server).
- **Data:** `.local/stock.sqlite`, photos `.local/uploads/`; ignored by Git. Restart preserves records.
- **Admin:** first locally registered account becomes admin. No credentials have been created in the user's real local database by the agent. API tests use isolated temporary databases.
- **Auth:** local email/password with scrypt, httpOnly cookies, hashed session tokens; real email verification/OTP is not connected. Hosted platform auth is a separate unfinished integration.

Implemented local pages and flows: home, fuzzy catalogue search, Jammu area/pincode and GPS, INR/USD filter, radius/price/open/negotiable/status filters, all sort options, list/map, actual rank breakdowns, SSR product/shop content, directions/call for real shops, labelled samples with travel/call disabled, independent reports, owner account/shop submission, admin approval/suspension, add/edit products, one-tap and confirm-all stock, audit history, admin catalogue add/merge, report resolution, stale-listing/zero-search views, sample removal, row-validated admin seed CSV, field agent, photos compressed on upload, PWA shell, dark mode, static pages/design system.

**Validation completed:** `node --test tests/rules.test.ts` passed 12 tests; `node --test tests/api.test.mjs` passed the integration flow. HTTP home/assets/session/search return 200. `iphn 15` returns only iPhone 15 (fixed numeric fuzzy matching). Syntax checks passed for local server and browser JS.

**Browser verification:** attempted installed Edge through CDP. It stalled on `Page.enable`, including after adding timeouts and a unique profile. No browser or accessibility pass is claimed. Temporary QA browser processes were targeted for cleanup using their unique profile prefix. A working browser automation environment or manual check is still needed for 360px layouts.

## Remaining release work
1. Review the running local UI manually or with working browser automation; complete the original 360px/accessibility/performance acceptance checks. Do not claim these passed.
2. Finish production identity and deployment. Current local runtime is not public production hosting.
3. The retained Vinext/D1 scaffold is unfinished, including missing `app/ui.tsx`. Do not use its framework build as the running app or claim it is deployable. Registry downloads failed EACCES/ETIMEDOUT; `node_modules` is incomplete. If continuing with Sites, finish the hosted implementation/adapter and generate schema migrations.
4. Obtain fresh source write credentials for the SAME persisted Site. Follow Sites source-helper/private publication workflow. No version has been deployed.
5. Only after Phase 1 release gates pass, start Phase 2. No Phase 2/3 work has been done.

Read `README.md` for run instructions, pages, API, model, and limitations. `PLAN.md` tracks the phase order and acceptance status.

## Decisions / limits
- Hosted D1 replaces recommended PostgreSQL/PostGIS; use indexed coordinates and Haversine bounding/search. Hosted identity is ChatGPT sign-in, replacing email/phone OTP per Sites requirements. Clearly document deviations.
- First-admin binding should use ADMIN_SETUP_KEY and cannot be claimed twice. Secrets must not be written into source.
- Public shopper endpoints require no app account, but initial private Site hosting limits who can visit. Do not make public without user request.
- No fake ratings/reviews; all demo data labelled. No checkout/payments/delivery/chat.
- Two independent negative-report downgrade is Phase 1 because acceptance criteria require it despite appearing in Phase 2 wording.
- No later phases have been started.

## Resume CLI
Use `codex resume --last` for the latest session, or `codex resume --all` to choose this session across working directories. A fresh session can continue by reading this file and the original prompt; it does not automatically inherit previous chat history.
