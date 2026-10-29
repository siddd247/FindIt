# Admin and shop-owner functional optimization

Branch: `admin-owner-optimization`, based on the existing Vercel migration branch. Original databases, backups, uploads, and the unrelated untracked `stock/` directory are not modified. Tests use disposable SQLite databases. No schema migration is required.

## Audit and implementation plan

The active application is the custom Node HTTP/request handler in `local/server.mjs`, asynchronous SQLite/Turso adapters, and plain JS/CSS frontend. The unused Next.js scaffold is outside scope. Admin authentication uses separate Argon2id credentials and database sessions; owner credentials use scrypt and separate database sessions. Role/status checks are server-side. Existing shop states are pending, active, rejected, on_hold, and deactivated; active means approved for discovery, not evidence-verified.

Phase 1: streamline existing admin review and owner assignment, show owner email/status, expose rejected/unassigned filters, prevent stale reassignment, support audited removal of an owner without deleting inventory, add confirmation and success states, and show actionable dashboard counts. Preserve catalogue/import/report/security tools.

Phase 2: remove account/listing approval coupling and automatic public approval; allow pending and rejected owners to prepare shops and inventory, retain suspension protections, add shop-detail editing/resubmission, restore registration and adding offers in the grouped owner dashboard, and synchronize approval status. Public queries must continue to select only active, nondeleted shops. Add complete lifecycle/authorization tests.

Audit findings: grouped owner queries and offer writes require an active shop, so pending owners cannot use the actual dashboard. The grouped dashboard has neither a shop-registration form for new accounts nor an add-variant form for shops with no offers. Owners cannot update shop details. Legacy autoapproval can make newly submitted shops public without an admin decision. Admin approval and evidence are already separate but their raw status labels obscure this. Existing assignment tools support links but not removal. Owner details are missing from shop review, and most changes have no success feedback. Admin sidebar counts update independently but some form data can become stale; owner approval needs explicit refresh/focus synchronization.

Baseline: 99 tests, 98 passed, one credential-gated real-cloud test skipped. Browser automation/authenticated visual checks are not currently available; verification will use HTTP lifecycle tests and frontend handler/view tests, with limitations reported explicitly.

## Implemented behavior

Admin navigation now groups existing tools, shows actionable review/request/report/assignment counts, and adds refresh and success states. Shop review exposes owner identity separately from approval/evidence. Search covers owner email as well as shop fields; approval and assignment filters, stable ordering, integer pagination and reset are supported. Sensitive shop actions, account suspension, reassignment and structural catalogue actions request confirmation. Owner assignments can be removed without touching approval or inventory, with an optional expected-owner check to reject stale changes and a database audit record. Account operations no longer run unrelated catalogue-integrity scans. Deleted accounts are excluded from account selectors; an assignment pointing to an unavailable account can still be removed.

Shop accounts can sign in immediately. New owner and visitor shop submissions always start pending, including when a legacy `OWNER_AUTO_APPROVAL=1` environment value is present. This deliberately replaces the earlier demonstration autoapproval rule; existing approved shops are not changed. The API retains `ownerAutoApproval` as `false` for client compatibility. Approval does not imply evidence verification.

Owners can register shops, edit details/categories/hours/photos, add catalogue variants, edit prices and stock, import/export CSV, inspect price history and request catalogue additions while pending or rejected. Rejected shops can be corrected and resubmitted to pending; on-hold/deactivated shops remain readable but cannot be edited or self-reactivated. Owners cannot set approval, verification or assignment fields. New management writes use transactions and audit/history records. Shop ranking reads now fetch competitor prices once rather than once per offer. Inventory can be searched, filtered by category and paginated by model. Lightweight approval refresh runs on focus and every 15 seconds, retaining dirty form values. Stale variant-selector responses are ignored and listeners survive browser back/forward-cache restores.

Public directory, shop pages, legacy search, grouped shop catalogues and model comparisons keep active/nondeleted shop restrictions. Tests exercise visibility before approval, after approval, after rejection and after resubmission; owner inventory and existing fixture shops/offers remain intact. Account sessions, stock and image reads are verified across a separate handler-process restart through the Vercel Function entrypoints.

## Files changed

- Backend: `local/admin-api.mjs`, `local/catalog-admin.mjs`, `local/server.mjs`, `local/shop-offers.mjs`; new `local/shop-management.mjs`.
- Frontend: `web/admin.mjs`, `web/catalog-admin-ui.mjs`, `web/shop-model-ui.mjs`, `web/app.js`, `web/admin.css`, `web/workspace.css`; new `web/admin-shop-tools.mjs`, `web/shop-status.mjs`, `web/shop-workspace-view.mjs`.
- Startup/cache references: `scripts/start-local.mjs`, `web/index.html`, `web/sw.js`. HTML and service-worker changes update asset versions only; no homepage layout or typography changes.
- Existing tests updated for explicit admin approval and current asset versions: `tests/cloud-integration.test.mjs`, `tests/components.test.mjs`, `tests/release-audit.test.mjs`, `tests/theme.test.mjs`.
- New tests: `tests/admin-operations.test.mjs`, `tests/shop-lifecycle.test.mjs`, `tests/shop-workspace-ui.test.mjs`.
- Report: `docs/ADMIN-OWNER-OPTIMIZATION.md`.

## Verification and remaining external checks

Local suite: 106 tests, 105 passed, zero failed, one explicitly credential-gated cloud integration test skipped. Production/local build passes, including isolated HTTP smoke checks. Targeted ESLint checks and diff whitespace checks pass. No dependencies or schema migrations were added. No live database or account was edited, and no commit, merge or deployment was performed.

Actual browser visual acceptance remains unverified because browser automation is unavailable. Review `/control`, `/owner` and `/join` at 390px, 768px and 1440px in both themes. Use disposable accounts to exercise pending/rejected/approved states. The real cloud test was updated to require explicit admin approval and must be rerun in the credentialed WSL environment before deploying these changes:

```bash
NEARBY_RUN_CLOUD_INTEGRATION=1 NEARBY_CLOUD_TEST_CONFIRM=nearby-phase2-dev node --test tests/cloud-integration.test.mjs
```
