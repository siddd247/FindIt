# Execute-prompt progress

Run date: 2026-10-16. Follow `docs/EXECUTE-PROMPT.md`, not the old root progress file's build order.

## Checkpoints

| Milestone | Status | Commit |
| --- | --- | --- |
| Before modifications | done | `1acd7444240314b07506d98576a6c6b4d310bf1b` |
| Section 1: setup and audit | done; build prerequisite failed | `2e785cd0518089753e3f9fb65e1b4783f7c3eb90` |
| M1: schema additions | not done | — |
| M2: sourced shop import | not done | — |
| M3: Google Maps everywhere | not done | — |
| M4: product import pipeline | not done | — |
| M5: user redesign | not done | — |
| M6: footer/static pages | not done | — |
| M7: pending shop requests | not done | — |
| M8: private admin foundation | not done | — |
| M9: requests/shop controls | not done | — |
| M10: admin data tools | not done | — |
| M11: admin dashboard | not done | — |
| M12: owner dashboard refresh | not done | — |
| M13: rules/reports/ranking | not done | — |
| M14: hardening/regression | not done | — |

## Section 1 — what changed

Exact created/changed source files:

- `.gitignore`: exclude `backups/` because exports contain private database records.
- `AGENTS.md`: persist guide Parts A/C verbatim, with explicit execute-prompt precedence for automatic sequential execution and stack preservation.
- `scripts/backup-db.mjs`: consistent SQLite backup, SQL export, integrity check, checksum/count manifest.
- `docs/AUDIT.md`: current stack/routes/APIs/tables, comprehensive guide gap table, data constraints/risks and exact M1–M14 sequence.
- `docs/PROGRESS.md`: this run's checkpoint/failure/results record.
- Git metadata initialized and a before-modification snapshot committed.

The three reference files already existed in `docs/` and byte-match the Downloads originals; no copies were overwritten. Application code, old schemas/migrations, and original reference data were not changed. All current samples and user-entered data were retained. Existing samples remain labelled Sample, visible as before, and removable by the existing admin action; the new default-hiding behavior was not implemented because the build gate stopped this run.

Backup artifacts (ignored, not committed):

`backups/before-modifications-2026-10-16T10-42-18-220Z.sqlite`, `.sql`, `.json`.

The SQL export restored in an isolated in-memory database with 21 shops / 241 listings, integrity `ok`, and zero foreign-key violations. The original live database was not restored over or modified by the backup operation.

## Validation and mandatory stop

Baseline and final regression: `node --test tests/rules.test.ts tests/api.test.mjs` — **13/13 passed**. Earlier-flow API coverage: owner signup/login, pending approval/public exclusion, listing creation/ownership, admin approval, stock confirmation, duplicate reports, CSRF origin rejection, audit records, password hashes, currency filtering, product SSR, logout. Tests used isolated databases. `node --check scripts/backup-db.mjs` passed. Existing local preview `http://127.0.0.1:3000/` returned HTTP 200.

The package build command, `node scripts/run-framework.mjs build`, failed before application work: missing `node_modules/vinext/dist/cli.js`. A separate pre-existing source problem is the absent `app/ui.tsx` imported by the retained scaffold. The working local Node site and the incomplete framework build are different paths; do not claim the local test suite proves the framework builds.

Two repair attempts were made without changing the stack, package versions, lockfile, scripts, or build semantics:

1. Locked online `npm ci --prefer-offline --no-audit --no-fund --fetch-retries=0 --fetch-timeout=15000` using the installed npm JavaScript entrypoint. Failed: registry download EACCES; npm “Exit handler never called”. Log: `C:\Users\sidha\AppData\Local\npm-cache\_logs\2026-10-16T10_41_37_096Z-debug-0.log`.
2. Locked offline `npm ci --offline --no-audit --no-fund`. Failed: `ENOTCACHED`, unavailable zod tarball; EPERM cleanup warnings in ignored `node_modules`. Log: `C:\Users\sidha\AppData\Local\npm-cache\_logs\2026-10-16T10_42_59_548Z-debug-0.log`.

Final build recheck failed with the same missing CLI. **Stopped under operating rule 0.8 before M1.** There was no application milestone change to revert: Git preserves the baseline, source files are unchanged, and no schema migration/import occurred. Documentation, verified backup, and audit checkpoints are retained. `node_modules` remains incomplete and ignored; no dependency-install success is claimed.

## Assumptions and unimplemented work

- Execute prompt overrides the guide's original from-scratch build order; active Node/SQLite/auth/CSS and retained scaffold stay intact.
- Guide now targets INR; preserve existing USD records instead of converting or deleting them in future work.
- All 18 supplied shops are unverified: 16 listing_found, one listing_found_partial_address, one needs_verification_old_dealer_listing. No Maps/telephone verification was performed. No coordinates, stock, prices, or products were invented or imported.
- Real product data is absent. M4 must create only pipeline, tests and a headers-only template until the user supplies brand CSVs.
- New separate admin accounts, secure private path, bcrypt/argon2 setup script and password changes are not implemented. Existing `/admin` is the legacy owner-role admin surface, not the requested secure new admin.
- Browser/accessibility/4G checks have not passed. Previous Edge automation stalled at Page.enable; no fabricated browser result.

## Resume prerequisites and user-owned tasks

Restore access to required locked npm packages (or supply a complete trusted dependency cache), then repair and verify the pre-existing framework build. Do not replace the build command with syntax checks. Resume M1 only with the gate resolved; maintain commits and new-only migrations.

User tasks once the relevant milestones exist: set admin environment credentials and run the future M8 setup script; supply official-source brand product CSVs (Apple first); verify all imported shops and provide real Maps place links/coordinates; add missing areas with sourced shops. Do not create a guessed admin password.

Missing-area work from guide B1: Rehari Colony, Residency Road, Jewel Chowk, Channi Himmat, Janipur, Nanak Nagar, Sainik Colony, Satwari, Bathindi, Nagrota, Digiana/Gangyal, Narwal, Canal Road, Shastri Nagar. Target 2–3 verified shops per area; do not fabricate these rows.

## Run the preserved local app

```powershell
cd C:\Users\sidha\Downloads\nearby-stock-finder
node local/server.mjs
```

Open http://127.0.0.1:3000. Do not start a second process if the existing server already responds. Legacy admin route: `/admin`, using the existing account's role; it is not the future isolated private admin. Account secrets are not stored in these notes.
