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

Status: Phase 1 complete; waiting for user browser feedback before Phase 2.
