# Vercel migration

## Phase plan

This migration is being developed on `vercel-functions-persistent-storage`. The current SQLite database and the pre-migration backups are read-only inputs; production credentials and production data are never used by the migration tests.

1. Refactor the runtime behind a request-handler boundary and a storage interface. Keep the local SQLite adapter for existing development/tests, use a local SQLite/libSQL-compatible development database, and mock image storage.
2. Connect isolated Turso and Cloudinary development accounts through environment variables; verify data operations and image persistence using sanitized fixtures.
3. Use separate Vercel Preview environment variables and run end-to-end and redeployment-persistence checks. Production data migration, production deployment, and merge require separate approval.

## Database architecture decision

Use Turso through its asynchronous `@libsql/client` API in the deployed runtime. Keep the current synchronous `node:sqlite` implementation local-only while porting database-dependent services to the common async interface. This requires changes throughout the API and domain modules, but gives the deployed code a supported remote I/O path and avoids filesystem-based persistence.

The `libsql` package exposes a synchronous API resembling better-sqlite3 and advertises remote connections. It could reduce source changes, but remote SQL on a synchronous API blocks the function's JavaScript worker during network calls. It also introduces a native Node addon into the serverless bundle and makes SQLite-specific locking/transaction behavior a critical dependency. The current server performs many queries per request (including per-offer ranking reads), which makes a remote synchronous driver particularly risky for latency and function timeouts. It is therefore not selected for the Vercel runtime.

Turso's embedded-replica mode is also not the Vercel persistence layer: replicas depend on local files, which are ephemeral and isolated between Vercel function instances. The application will use Turso's remote async endpoint directly, with transactions for writes and the function region placed near the database.

| Option | SQLite compatibility | Vercel fit | Reliability/cost implications | Decision |
| --- | --- | --- | --- | --- |
| Existing `node:sqlite` | Native SQLite, synchronous | Local-only; local files are ephemeral and not shared in Functions | No hosted DB cost, but writes can disappear on restart/redeploy and instances diverge | Keep for local tests only |
| `libsql` sync Node API | better-sqlite3-like API; remote support is advertised | Node runtime can run native modules, but native packaging and blocked event-loop I/O add risk | Minimal call-site rewrite; synchronous network work and SQLite single-writer semantics are a poor serverless fit | Rejected for production |
| Turso via `@libsql/client` async API | SQLite-compatible SQL/driver | Fits Node Functions and remote request/transaction model; no local persistence assumption | Requires async refactor; free plan limits and service availability apply | Selected |

## Image storage

Use a storage interface. Local development and unit tests use a mock/local test adapter; Vercel uses Cloudinary's signed server-side upload API. The API secret stays on the server. The database stores only the resulting HTTPS asset URL and stable asset identifier. A provider quota or account suspension can affect delivery, so hosted availability is subject to Cloudinary account status and plan limits.

## Phase 1 Vercel configuration

- Framework preset: **Other**. The repository is a custom Node server, not a Next.js application; the installed Next.js package belongs to an unfinished scaffold.
- Build command: `npm run build` (validates/builds the local-compatible package). `vercel.json` uses the **Other** framework preset and does not set `.next` or `dist/local` as an output directory. Functions include `local/`, `web/`, and `lib/` files.
- Runtime: Node.js Functions, with a region near the Turso database.
- Environment variables for Phase 2 Preview/Development: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `COOKIE_SECURE=1`. Do not add production values in Phase 2.
- Never place these values in frontend modules, test fixtures, Git, or production environment before final approval.

## Backup status

Before this migration began, the local SQLite database was backed up using `VACUUM INTO`; the backup passed `PRAGMA integrity_check` and has a SHA-256 manifest. The local uploads directory contained zero files. The migration has not written to the original database, uploads, or external storage.

## Phase 1 implementation status (completed locally)

All existing application request routes now dispatch through `applicationHandler` and the actual Vercel Node Function entrypoints (`api/index.mjs` and `api/[...path].mjs`), without starting a persistent HTTP server. The local `npm start` workflow still starts the same application handler on the local server. Request-path database access uses the asynchronous adapter in buyer/search/catalogue, owner authentication and inventory, shop offers and imports, admin authentication, catalog administration, and admin moderation/import/report/product/shop actions. Multi-write actions use adapter transactions. The existing schema migrations have an asynchronous path. Image upload and `/uploads/` retrieval use the storage interface; Phase 1 uses an isolated mock Cloudinary-compatible provider.

Automated checks cover buyer search, owner sign-up/login, upload and retrieval, persistence after recreating the handler process, async shop/product imports, catalog admin, admin actions, Vercel URL/request bridging, and the existing suite. No external service credentials are used. The existing synchronous catalogue-replacement/import helpers remain for local CLI usage only; they are not called by the Vercel request path. The original SQLite database and verified backup remain untouched.

Validation on this branch: **88/88 tests pass** (`npm test`), **production/local build passes** (`npm run build`), and Vercel Function integration tests pass as part of the suite. The Vercel function has not been deployed to Preview and Turso/Cloudinary have not been contacted. There is no image deletion endpoint in the current application; uploaded assets are read through the adapter and are not removed by these changes.

Phase 1 is ready for review/approval to begin Phase 2. It is not evidence of a live Vercel deployment: Phase 2 must validate real isolated Turso and Cloudinary credentials, SQL/transaction compatibility, upload URL delivery, session cookies, and data/image persistence on Vercel Preview. Until that integration is done, the mock file provider is not durable across Vercel instances or redeployments. Do not migrate production data, merge, or deploy to production without separate approval.

## Phase 2 implementation status

The Vercel runtime now selects the real Turso adapter and real Cloudinary storage adapter when configured. Cloudinary uses signed uploads, authenticated metadata/image reads and signed deletion; app-facing `/uploads/<uuid>.jpg` URLs remain unchanged. Locally, SQLite and mock image storage remain the default. The async migration runner rechecks migration versions inside write transactions so simultaneous function cold starts do not apply the same migration twice.

Provider adapters have automated credential-free coverage, including Cloudinary request/signature validation. `docs/PHASE-2-SETUP.md` describes dedicated test account/database setup and an opt-in end-to-end test that exercises buyer, owner, admin, upload, and cross-process persistence against those real services. Current result: **91 tests pass, 0 fail, 1 real-cloud test skipped**; `npm run build` passes. **The real-service test has not yet run:** none of `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, or `CLOUDINARY_API_SECRET` is configured in the local environment. Do not deploy or promote these settings; Preview verification remains Phase 3.

