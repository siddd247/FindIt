# Product design and release audit

Reviewed 2026-10-16. Scope: the existing Node/SQLite application, its customer, owner and administrator interfaces, and local release checks. Preserve existing accounts, shops, 918 supplied variants, 29,376 approved catalogue assignments, price provenance and stock evidence.

## Findings and acceptance criteria

| Priority | Finding | Required outcome |
| --- | --- | --- |
| High | Search mixes assigned catalogues, zero confirmed-stock results, repeated variants and generic shop leads on one long page. | Explicit views for shop catalogues, confirmed stock and products; counts describe the selected evidence. |
| High | Shop pages omit their approved catalogue assignments. | Searchable assigned products on the shop page, with unconfirmed-stock and estimate labels. |
| High | Old localhost runtime and cached module exports hid shop matches. | Preserve tested legacy-origin migration; version changed assets coherently. |
| High | Catalogue approval can look like availability or identity verification. | Keep administrative assignment, shop identity evidence, stock confirmation and estimated pricing distinct. |
| High | Keyboard suggestions move focus into a list without a maintained active option. | Input-based arrow selection, labelled options, Enter selection, Escape/outside dismissal. |
| High | Storage exceptions or malformed saved history can stop initial rendering. | Storage reads/writes degrade safely; validate stored history. |
| Medium | Home's first twelve records are mostly colour/storage variants of one older phone. | Featured models span actual categories and prefer recent launches without duplicating variants. |
| Medium | Headline copy suggests confirmed inventory that does not exist. | Discovery copy and concise data guidance reflect current catalogue/stock evidence. |
| Medium | Admin and owner forms have weak busy/error feedback and no password visibility control. | Accessible errors, busy states and labelled password controls while preserving authentication. |
| Medium | Small text, serial warning panels, inconsistent heading faces and accumulated breakpoint overrides impede scanning. | Shared readable type, neutral information panels, consistent spacing, compact cards and deliberate phone/laptop layouts. |
| Medium | Unknown coordinates coexist with a distance selector and map affordance. | Explain distance limitations; never create distances or map pins to fill gaps. |
| Medium | Ordinary informational pages download the entire catalogue unnecessarily. | Load catalogue data only for flows that use it. |
| Medium | Private admin navigation and login need keyboard/landmark consistency. | Working skip target, clear navigation state, accessible fields and compact mobile controls. |
| Medium | README describes an earlier sourced catalogue and denies the newer generated assignments. | Document the actual dataset, administrative approval and current operating limits. |

## Verification boundaries

The browser diagnostic command was rejected by the session's automatic approval policy because sandbox approval is disabled. Browser screenshots, real viewport rendering, actual screen-reader behavior and physical-phone checks therefore remain unverified. DOM/module tests and contrast calculations do not substitute for those checks.

## Public launch blockers

The local implementation is not yet a publicly deployed production service. Hosting/HTTPS, a working hosted build and persistent storage, public-origin configuration, owner email verification and recovery, a real support contact, browser accessibility/layout review and actual stock confirmation remain launch requirements. The uploaded product variants and converted historical USD amounts are not independently verified specifications or current Indian retail prices. Admin assignment approval does not remove those limitations.

Changes, test evidence and checkpoint references are recorded in `docs/PROGRESS.md` when the pass is complete.

## Completed implementation checks

Implemented the outcomes above in web/app.js, web/public-content.mjs, web/simulation.mjs, web/admin.mjs and web/styles.css. HTML/module URLs now use 20261016-design-release and the offline shell cache is v10. No live catalogue, shop, account or stock records were changed in this pass.

All 50 tests pass, including the new design-readiness suite covering category diversity, model deduplication, blocked storage, malformed saved JSON, compact/expanded shop groups, shop catalogue evidence and all three actual search module views. The compiled local build and isolated HTTP smoke check pass. Live API/module checks render 12 approved/unconfirmed shop cards initially for iPhone XR, iPhone 15 and MacBook, with 32 unique shops present in each first result page. Browser rendering and public deployment remain outside these verified results.
