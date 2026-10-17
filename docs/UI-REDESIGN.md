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

Status: Phase 2 complete; waiting for user browser feedback before Phase 3.
