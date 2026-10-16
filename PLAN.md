# Phased implementation plan

## Assumptions agreed in conversation

- Jammu, India is the initial launch area.
- INR and USD are selectable listing currencies, without automatic conversion.
- Working name: Nearby Stock Finder.
- Sample marketplace data is always labelled. No fake reviews.
- The independent customer-report downgrade is Phase 1 because acceptance criteria require it.
- No checkout, payments, delivery, reservation, or chat flows.

## Phase 1 — build and validate the working local MVP

1. Define page list, schema, API, and business rules. **Implemented.**
2. Implement decay, configurable ranking, community evidence and fuzzy search. **Implemented; 12 rule tests pass.**
3. Implement shopper home/search/results/filter/map/shop/product/direction/report flows. **Implemented locally; HTTP checks pass.**
4. Implement local account, shop registration, approval, catalogue listings, one-tap owner status, bulk confirmation. **Implemented locally; API integration checks pass.**
5. Implement admin approval/report/catalogue/stale data/sample import/field-agent tools. **Implemented locally; import validation checked through API.**
6. Run browser/accessibility/performance validation and production deployment. **Incomplete.** Browser automation is blocked at the installed Edge's `Page.enable` command; no visual or accessibility pass is claimed. Framework registry downloads fail with access/time-out errors. Local password authentication is development-only; real mail/OTP or platform identity integration remains a production gate.

The local preview is usable now at http://127.0.0.1:3000 while its server is running. Do not call Phase 1 production complete until step 6 and the original acceptance criteria are satisfied.

## Phase 2 — start only after Phase 1 release gates pass

Owner inventory CSV updates, notifications/reminders, reviews, saved items, and owner analytics. Not started.

## Phase 3 — start after Phase 2

Additional cities/categories, price-drop alerts, POS integrations, and subscriptions. Not started.

## Verification status

- Rules: stock-age boundaries, fresh/stale/out-of-stock ordering, exact score breakdown, Bayesian review weighting, customer reports/independence, owner re-confirmation, typo matching, seed integrity, distance and IST hours.
- API: auth/authorization, pending-shop exclusion, admin approval, new listing and duplicate rejection, status confirmation, duplicate report rejection, CSRF origin rejection, CSV error rows, USD filtering, audit records, password hashing, SSR product content, logout invalidation.
- Browser: attempted using existing Edge without installing a browser; automation did not return from Page.enable. Mobile layout and accessibility require manual review or a working browser automation environment.
