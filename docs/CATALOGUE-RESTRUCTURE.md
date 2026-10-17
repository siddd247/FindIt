# Parent catalogue restructure

User decisions approved 2026-10-17. Keep the current Node/SQLite stack and styling. Group 918 active variants; preserve 431 archived records separately. Indicative/demo offers retain provenance. No external URLs or images are invented.

## Phase 1

Applied additive migration 004 after backup. Created 164 parent products and 918 child variants with exact legacy ID/slug mappings, valid cheapest-base-price defaults and detected option axes (including correlated Configuration selectors). 41 parents have one variant; no suspicious groups or orphans. Existing flat source records remain unchanged.

Created 29,376 approved demo offers across 32 shops. Distribution: 16,288 available; 5,844 low stock; 4,431 out of stock; 2,813 unavailable. Every variant has an available offer and every shop has all four statuses. All offers and approval operations carry seed provenance.

Approval pass counts: shops 0, shop users 0, product requests 0, variant requests 0, parent products 0, variants 0, pending offers 0. New seed offers are created approved, separately from those pending counts.

Shop-user deletion dry run listed zero accounts. User confirmed zero; apply completed as a no-op. Both administrator records and all shops remain.

Commands:

    node scripts/migrate-catalogue.mjs
    node scripts/migrate-catalogue.mjs --apply
    node scripts/seed-catalogue.mjs --reroll --apply --seed=another-seed
    node scripts/seed-catalogue.mjs --wipe --apply
    node scripts/delete-shop-users.mjs

Migration and seed commands back up before application. Seeding/re-rolling affects seed offers and recorded seed approval changes; shop-authored offers are preserved. Account deletion requires the exact reviewed count and hash.

Phase 1 validation: 59 tests and compiled build passed; no unmapped active variants, invalid defaults, empty parents, invalid mappings, orphan offers or foreign-key violations. Old URL HTTP redirects and option-interaction checks follow in Phase 2. Missing images: all 164 parents, intentionally empty.

## Phase 2

Buyer model search/cards, dependent selectors, internal shop/category navigation and shop-specific variant pricing are implemented. Active legacy variants return 301 with variant preselected; parent ID URLs canonicalize to slugs. All 431 archived IDs return 410 with noindex, suggestions and category navigation. /control is the admin entry; prior private path redirects. Parent pages include canonical URLs and aggregate price structured data.

Validation: 61 tests and compiled build pass. Live verification checked all 918 active redirects, 431 archive responses, 164 parents and 933 selector combinations, with no server stderr. Availability sorting excludes out-of-stock/unavailable offers from Best price. Real browser layout remains unverified.

## Phase 3

Shop dashboards group their own offers by parent model and expand to variant price/stock forms. Added ownership-scoped CSV import/export, atomic validation, price history/rank, optional real HTTPS product URLs and missing-catalogue requests. Shop edits promote offers out of seed ownership so later seed wipes preserve them. Active/suspended shop-user status is enforced by server sessions and sign-in.

Validation: 62 tests and compiled build pass. Cross-shop reads/writes/history/CSV are denied, invalid CSV applies no rows, history records source and shop edits, suspended accounts are rejected, and seed wipe retains shop-entered offers. Live account count remains zero; no shop credentials were invented.

## Phase 4

Completed administrator catalogue management: create/edit parent models and variants, supplied product/colour images, selector ordering, automatic cheapest or explicit default, merge/split/move variants, materialize approved requests, quality review and audit log. Added active shop-user creation, explicit shop assignment/reassignment and account suspension. Every API is protected by separate administrator authentication; future shop users remain ownership-scoped. No live credentials were invented.

Migration 005 adds parent redirect targets and default locks plus reviewed-request result references. Backed up before application: backups/before-modifications-2026-10-17T12-04-49-015Z.sqlite, SQL export and manifest; integrity ok. Original source data and offers were preserved.

Validation: 63 automated tests pass; compiled local build and isolated HTTP smoke check pass. Integration checks cover role isolation, suspension, catalogue edits, duplicate rejection/transaction rollback, split/merge/move mapping preservation, old-model redirects, request creation and unique UI form IDs. Real browser layout/device/console testing remains unavailable, and ESLint is not installed. No deployment was performed.

Updated local preview: http://127.0.0.1:3006 ; private admin sign-in: http://127.0.0.1:3006/control . Earlier loopback previews forward to the grouped catalogue runtime. No public admin navigation link is added.

Changed files for Phase 4: local/admin-api.mjs, local/catalog-admin.mjs, local/catalog-model.mjs, local/catalog-read.mjs, local/migrate.mjs, local/migrations/005_catalog_admin.up.sql, local/server.mjs, web/admin.mjs, web/catalog-admin-ui.mjs, web/catalog-ui.mjs, web/shop-pricing-config.mjs, web/styles.css, web/sw.js, tests/catalog-admin.test.mjs, README.md, docs/CATALOGUE-RESTRUCTURE.md and docs/PROGRESS.md. No tracked files were deleted.

Final live checks: all 918 active IDs return the correct 301/variant selection; all 164 parents have valid defaults/offers, 933 possible selector combinations resolve, and all 32 shop pages expose 164 models across 11 categories. Earlier Phase 2 checked all 431 archived responses; a final spaced sample remains 410/noindex. Actual buyer module handlers render, switch variants, persist query selection and restrict shop-specific offers without exceptions. Server startup stderr is empty. Final integrity and all seven pending-queue counts remain zero. The zero-account approved deletion was a no-op; both administrator records remain.
