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
