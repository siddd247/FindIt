# UI redesign review

## Phase 1: tokens, self-hosted Inter and appearance controls

Review URL: http://127.0.0.1:3007 . Previous loopback previews redirect here when they lack the theme-asset capability. Administrator entry: /control, still private and authenticated. No data migration, account creation or catalogue changes were needed.

Implemented one token file, web/tokens.css, containing interface colors, semantic stock palettes, typography, radius, shadow, motion and spacing primitives. Existing component selectors use compatibility aliases until Phase 2 consolidation. All active UI hexadecimal color literals now originate in this file, including generated default favicon/manifest/page metadata. Transparent and inherited currentColor remain structural values; product swatches remain catalogue data.

Appearance uses Light/Dark/System mode independently from Indigo/Emerald/Amber accent. It initializes before the stylesheets, migrates saved Light/Dark preferences, persists mode and accent separately, follows live device changes in System mode, synchronizes browser tabs, handles unavailable storage, and closes with Escape/outside click. Buyer and admin headers use the same control. Accent buttons are discovered from labelled CSS token blocks, so another accent needs no JavaScript edit.

Self-hosted Inter 4.001, unmodified static 18pt Regular/Semibold/Bold faces, supplies the single heading/body font family. Direct network downloads were unavailable; actual installed Inter files were copied and checked. Source metadata and SHA-256 digests are in web/fonts/SOURCE.md; the complete SIL Open Font License is in web/fonts/OFL.txt. No external font host or new package dependency is used. The build preserves binary fonts and includes the license/source notes.

Stock colors are independent of every accent: available green, low stock amber, out of stock red/solid border, unavailable slate/dashed border. Text labels remain present, and inactive offers remain excluded from Best price.

### Browser review requested before Phase 2

Check each of these exact pages at viewport widths **360px, 768px and 1440px**:

| View | Path |
| --- | --- |
| Home/header | / |
| Search/model cards | /search?q=iphone+15 |
| Product/selectors/four stock badges | /products/apple-iphone-15-5fd79a72 |
| Shop directory | /shops |
| Shop/category | /shops/shop-013?category=phones |
| Shop-specific product | /products/apple-iphone-15-5fd79a72?shop=shop-013 |
| Shop login | /owner |
| Shop registration | /join |
| Admin login, then overview and Catalogue if signed in | /control |

On Home, also check the appearance menu at **320px and 390px**. On informational pages /about, /availability, /for-shops, /privacy, /terms, /contact, /owner-guide and /report-problem, check **360px and 1440px** for inherited font/colors and header usability.

Use the Appearance control (sun icon at narrow widths). Check Light and Dark with each accent, then System. Verify selection visibility, text/badge contrast, keyboard focus, Escape/outside dismissal, no horizontal overflow, and readable menus. Refresh, navigate between buyer/shop/admin pages and open a second tab to confirm persistence. While in System mode, change the operating system/browser emulation preference and verify automatic changes; explicit Light/Dark should stay fixed. Fonts should be served from /fonts/ on this origin, with no Google Fonts or third-party font request. A new browser with no saved preference starts in System mode with Indigo.

The live database has no shop-user accounts by the user's earlier decision. The signed-in shop dashboard is covered by isolated account/ownership tests; manual dashboard inspection requires an administrator-created account linked to a shop. No credentials were invented for visual review.

### Validation and remaining differences

All 68 automated tests pass. The compiled local build and its isolated HTTP smoke test pass. New tests cover startup before CSS, six mode/accent combinations, System changes, blocked storage, cross-tab updates, Escape/outside click, new token-block discovery, four distinct stock badges and exclusion from Best price. Palette checks cover 4.5:1 text contrast for normal/muted text, accents and stock labels, plus 3:1 control/status borders. This validates token pairs, not a complete browser WCAG assessment of every existing component.

Live checks passed for 19 routes, all font/source/build hashes match, and server startup stderr is empty. SQLite integrity is ok; 164 active models, 918 variants and 29,376 offers remain. git diff --check passes. Real viewport, visual layout and rendered browser checks are delegated to the user as agreed; no screenshots are claimed.

Still intentionally pending: replacing the custom icons with Lucide and consolidating shared components (Phase 2), buyer layout/sticky comparison redesign (Phase 3), shop-dashboard density/layout (Phase 4), and admin layout (Phase 5). Existing card spacing/density and compatibility class/token names remain until those phases. The unused React/Next/Tailwind scaffold is untouched.

Exact Phase 1 file changes: web/tokens.css, web/theme.js, web/styles.css, web/app.js, web/admin.mjs, web/catalog-ui.mjs, web/index.html, web/icon.svg, web/manifest.webmanifest, web/sw.js, web/fonts/Inter-Regular.ttf, web/fonts/Inter-SemiBold.ttf, web/fonts/Inter-Bold.ttf, web/fonts/OFL.txt, web/fonts/SOURCE.md, local/theme-assets.mjs, local/server.mjs, scripts/build-local.mjs, tests/theme.test.mjs, tests/preview-routing.test.mjs, tests/release-audit.test.mjs, tests/ui.test.mjs, docs/UI-REDESIGN.md and docs/PROGRESS.md.

Phase 1 checkpoint: ee5f604. The user authorized Phase 2 with "continue".

## Phase 2: shared components and Lucide

Review URL: http://127.0.0.1:3008 . The page layouts are intentionally retained until their scheduled phases. No database migration, catalogue change, account creation or runtime dependency installation was needed.

Added web/components.css as the shared styling layer for semantic buttons, inputs/selects/textareas, chips, stock/Best price badges, cards, tables, native dialogs, skeletons and empty states across buyer, shop and admin views. Extracted 79 initial primitive rules plus the remaining chip/card overrides from web/styles.css; context-specific page geometry remains there. Shared HTML helpers in web/public-content.mjs now handle repeated fields, password controls, selectors/chips, stock badges, model cards, table structure, loading/empty states and dialog body. Existing names, IDs, data hooks, price/stock rules and ownership checks remain covered by regression tests. Tables support keyboard focus/scrolling and header scopes; modal titles are labelled without stale references. Disabled controls, selected/focus states and reduced motion share the same tokens.

Replaced all 45 icon aliases with official Lucide 1.17.0 geometry, including 11 distinct category icons. The existing Icon wrapper remains, with consistent two-unit stroke and decorative accessibility attributes. The snapshot came from an integrity-verified local npm cache package, not guessed paths; no React renderer is imported. Original source data, module hashes, archive integrity and ISC/Feather MIT notices are in web/vendor/lucide/. No emoji icons or third-party icon request is introduced. The existing custom brand favicon remains a logo.

Validation: all 72 tests and the compiled local build pass. New regressions cover official icon provenance/safe fallback, escaped field values, shared buyer chips resolving dependent selections with URL persistence, four semantic stock badges/one eligible Best price, and shop form names/CSV/history actions. Existing authentication, admin catalogue management, imports, pricing, theme persistence and ownership tests pass. Live checks covered 19 routes and actual JavaScript module rendering for Home, search, empty search, product, shop/category, shop sign-in and admin sign-in with Lucide and appearance controls. Server startup stderr is empty. SQLite integrity remains ok with 164 models, 918 variants and 29,376 offers. The unused scaffold is untouched.

### Phase 2 browser checklist

Check each exact URL at **360px, 768px and 1440px**, in Light and Dark, cycling Indigo/Emerald/Amber:

| View | URL | Check |
| --- | --- | --- |
| Home | http://127.0.0.1:3008/ | Lucide category/navigation icons; shared buttons and appearance menu |
| Search | http://127.0.0.1:3008/search?q=iphone+15 | Cards, filters, keyboard focus, hover and reset |
| Empty search | http://127.0.0.1:3008/search?q=iphone+15&min=999999999 | Empty state; Reset filters returns products |
| Product | http://127.0.0.1:3008/products/apple-iphone-15-5fd79a72 | Chip selection, live prices/URL, four stock badge treatments, Best price and disabled website buttons |
| Shop category | http://127.0.0.1:3008/shops/shop-013?category=phones | Category chips, cards, Maps links and shop-specific product links |
| Shop login | http://127.0.0.1:3008/owner | Fields, focus, password visibility, primary button and errors |
| Registration | http://127.0.0.1:3008/join | Fields, validation, selected controls |
| Administrator | http://127.0.0.1:3008/control | Sign-in fields; after sign-in check Shops table, Catalogue fields/textarea and Data quality |

Also check Home/header at **320px and 390px** for overflow and touch targets. Use Tab/Shift+Tab and Escape; confirm appearance persistence and System mode still work. A native report dialog can be inspected where an actual reportable inventory listing exists; the live dataset has none, and no inventory was fabricated to create that state. Signed-in shop dashboard inspection still requires an administrator-created shop-user account; current live account count remains zero as previously requested. Isolated fixtures cover those flows.

Known pending differences: buyer page composition/card density and sticky comparison panel (Phase 3), shop dashboard composition (Phase 4), and admin composition (Phase 5). Some contextual spacing/type rules remain in page CSS pending those layouts. Browser viewport/visual checks remain the user review step; no screenshots or rendered-browser contrast certification are claimed.

Exact Phase 2 changed/created files: web/components.css, web/styles.css, web/tokens.css, web/public-content.mjs, web/icons.mjs, web/app.js, web/admin.mjs, web/catalog-ui.mjs, web/catalog-admin-ui.mjs, web/shop-model-ui.mjs, web/index.html, web/sw.js, web/vendor/lucide/LICENSE.txt, web/vendor/lucide/SOURCE.md, web/vendor/lucide/icon-nodes.json, local/server.mjs, scripts/build-local.mjs, tests/components.test.mjs, tests/ui.test.mjs, tests/theme.test.mjs, tests/preview-routing.test.mjs, docs/UI-REDESIGN.md and docs/PROGRESS.md. No tracked files deleted.

Phase 2 checkpoint: 0b242be. The user authorized Phase 3 with "cont".

## Phase 3: buyer discovery, product comparison and retailer pages

Review URL: http://127.0.0.1:3009 . Earlier local previews forward here when their backend lacks the buyer-design capability. User authorized this phase with "cont". No new dependency, invented image/shop URL, account creation or database migration was needed.

Home now prioritizes search, real catalogue/directory counts and category browsing. Removed the decorative map illustration, moved actual featured model cards into the main flow and derives suggested searches from the catalogue instead of specific hardcoded model names. Discovery uses larger art areas (actual images or honest category-icon fallbacks), model-level names, starting prices, shop counts and option counts. Directory filters/reset, sourced retailer identity, Maps/contact information and internal shop/category/product navigation remain available.

Product pages have larger image areas, configuration chips/swatches, a specification table and a desktop sticky comparison column. Its shop list scrolls within the panel on desktop; at widths up to 1024px the panel returns to normal document flow with no nested shop-list scrolling. A compact price is also visible near the product heading on narrower screens. The selected configuration updates range/exact price, images, specs, stock rows and URL without reloading or another read request. Offers are flat compact rows rather than repeated shadow cards. Available/low-stock offers sort first; out-of-stock/unavailable remain visibly distinct and excluded from Best price. Indicative/seed and shop-entered provenance stays visible. Internal Go to shop and disabled external website controls remain.

Search has a dedicated query bar, desktop filter column and native collapsible phone filters. Brand/category/min/max/spec fields retain their names and API semantics. Added per-filter removal; Reset retains its previous clear-all behavior. Request sequencing prevents earlier, slower responses from overwriting newer filter selections. Archived pages retain suggestions and category links; server 410/noindex behavior is unchanged.

Added web/buyer.css and removed 224 old buyer/illustration/footer style rules (14,026 bytes) from web/styles.css; shared primitives remain in web/components.css and all colors remain in web/tokens.css. Updated typography/layout tokens, responsive header/footer and theme-safe spacing. Administrator JavaScript now loads only for /control rather than every public page. Shop dashboard/admin compositions are intentionally deferred to Phases 4/5.

Validation: 77 tests pass; compiled local build and isolated built-server smoke checks pass. New regressions cover partial price ranges, dependent selections and image updates, single variants, scoped offers, internal links, mobile filter markup, stale-response handling, individual removal/reset, sourced shop details/unknown values, archives and model-card data. Existing auth/role, owner, admin catalogue, imports, CSV/history, deterministic pricing and six theme combinations pass.

Live HTTP checks covered 21 routes. Actual catalogue UI handlers rendered all 164 parents and resolved 933 option combinations, always showing 32 offer rows and one eligible Best price, with only 164 initial read calls (selection caused none). Nine actual application modules rendered against live APIs, including Home with 11 category links/12 distinct model cards, search/empty state, model, directory/shop, owner/admin login and informational content. Server stderr remains empty; SQLite integrity ok and all 29,376 offers unchanged. These are programmatic module/HTTP checks, not a real browser or screenshot assessment.

### Phase 3 browser checklist

Check each URL at **360px, 768px, 1366px and 1440px**, with Light/Dark and each Indigo/Emerald/Amber accent:

| Page | URL | Main check |
| --- | --- | --- |
| Home | http://127.0.0.1:3009/ | Search-first layout, real counts, 11 categories, discovery cards, suggestions keyboard/Escape |
| Search | http://127.0.0.1:3009/search?q=iphone+15 | Desktop filter column; collapsed phone filters; apply/remove/reset and ascending price |
| Empty search | http://127.0.0.1:3009/search?q=iphone+15&min=999999999 | Empty state and Reset filters |
| Phone model | http://127.0.0.1:3009/products/apple-iphone-15-5fd79a72 | Sticky desktop comparison and scrolling; chip/swatch selected/hover/focus states; live price/URL/specs |
| Laptop model | http://127.0.0.1:3009/products/apple-macbook-pro-16-m4-pro-max-5d32991b | Configuration selector labels, long names, image area and comparison rows |
| One variant | http://127.0.0.1:3009/products/dyson-purifier-hot-cool-gen1-hp10-4ed580c0 | No redundant selectors; price/shop list remains usable |
| Directory | http://127.0.0.1:3009/shops | Area/name filters, reset, sourced details and Maps links |
| Shop/category | http://127.0.0.1:3009/shops/shop-013?category=phones | Active category, sourced/unknown contact details, category product cards |
| Shop-specific model | http://127.0.0.1:3009/products/apple-iphone-15-5fd79a72?shop=shop-013 | Only that shop’s price/status changes with configuration; shop context survives refresh |
| Informational content | http://127.0.0.1:3009/availability | Body typography, footer and link contrast |

Also inspect Home/header at **320px and 390px** and the product page at **1024px** (comparison should flow normally) versus **1366px** (comparison should stick). Use a viewport height around 900px, scroll through specs, then scroll the desktop shop comparison region with mouse and keyboard. At phone width the whole page should scroll normally. Check all four stock badges, one eligible Best price, disabled external website buttons, refresh/share URLs and System theme tracking.

Known pending differences: signed-in shop dashboard composition (Phase 4) and admin composition (Phase 5). Real product photos are still absent from the provided dataset and have not been invented; category icons remain. Programmatic palette contrast checks pass, but actual rendered layout/contrast, overflow, phone focus and sticky scrolling are for the user browser review. No screenshots are claimed.

Exact Phase 3 changed/created files: web/buyer.css, web/catalog-ui.mjs, web/public-content.mjs, web/app.js, web/styles.css, web/tokens.css, web/index.html, web/sw.js, local/server.mjs, scripts/build-local.mjs, tests/buyer-design.test.mjs, tests/preview-routing.test.mjs, tests/theme.test.mjs, docs/UI-REDESIGN.md and docs/PROGRESS.md. No tracked files deleted.

Status: Phases 1–3 were reviewed in order. The user then authorized continuing through all remaining phases, so Phases 4–5 are complete in the same implementation run.

## Phase 4: shop dashboard

Added a token-based dashboard layout for the grouped catalogue shop workspace. The shop selector, bulk CSV controls, expandable model groups, variant offer forms, price history and product requests now have clearer grouping and mobile behavior. Product groups keep their dense variant editing rows; the dashboard does not add catalog-edit permissions. Existing server ownership checks and actions remain unchanged. The legacy shop owner workspace also receives responsive layout styling through its existing classes.

## Phase 5: admin workspace

Added a consistent private operations layout using the same tokens and shared controls. The admin sidebar has clearer selected states and spacing, the overview header remains visible during long pages, status tables keep their own scroll area, and the navigation becomes touch-friendly on phone widths. Admin routes, forms, role checks and data actions remain unchanged. No database or account changes were made.

Validation for both phases: the full automated suite and local build pass; added checks cover token-only colors, stylesheet order/serving, responsive shop/admin selectors and latest-preview routing. HTTP checks cover both new CSS assets and the runtime design flags. These checks do not certify rendered browser geometry or screenshots.

### Final browser checklist

Use **http://127.0.0.1:3012**. Check the following at **360px, 768px and 1440px** in Light and Dark, cycling Indigo, Emerald and Amber:

| Page | URL | Main check |
| --- | --- | --- |
| Buyer Home | http://127.0.0.1:3012/ | Search, cards, header theme picker and phone width |
| Product comparison | http://127.0.0.1:3012/products/apple-iphone-15-5fd79a72 | Variant selection, price changes, sticky comparison desktop and normal page scroll on phone |
| Shop sign-in | http://127.0.0.1:3012/owner | Fields, validation, theme control and narrow layout |
| Shop dashboard | http://127.0.0.1:3012/owner | After signing in with an assigned shop account: shop identity, product groups, variant fields, stock select, history and CSV controls |
| Shop registration | http://127.0.0.1:3012/join | Form spacing and mobile input widths |
| Admin sign-in | http://127.0.0.1:3012/control | Private login layout and theme control |
| Admin workspace | http://127.0.0.1:3012/control | After signing in: sidebar selection, dashboard stats, shops table, catalogue form, data quality and long-page header behavior |

The live database has no shop-user account, per the earlier account-removal decision. Manual signed-in shop-dashboard checks require an administrator-created account linked to a shop. Admin views beyond the sign-in screen require the existing administrator credentials. No accounts or credentials were created for this review. The automated isolated ownership and admin tests remain the verification for those signed-in actions.

Also inspect shop and admin views at **320px** for horizontal overflow, usable button targets, side navigation, and whether tables remain reachable by horizontal scrolling. Use Tab and keyboard focus in forms/tables; verify every theme and refresh persistence. The admin sidebar is sticky on phones, so confirm it does not cover too much of the viewport when expanded.

Remaining limitation: no screenshot or real-browser visual review was available in this environment. The font, palettes, source assets and styles are local; rendered sticky behavior, overflow and contrast still need your browser check.

Exact Phase 4–5 changed/created files: web/workspace.css, web/admin.css, web/shop-model-ui.mjs, web/index.html, web/sw.js, web/app.js, local/server.mjs, scripts/build-local.mjs, tests/theme.test.mjs, tests/components.test.mjs, tests/preview-routing.test.mjs and docs/UI-REDESIGN.md. No database files, accounts or catalogue data changed.

Final redesign checkpoint: phases 4 and 5 are complete; the repository commit records this verified state.
