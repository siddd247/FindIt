# Phase 2: isolated Turso and Cloudinary setup

This is for the **migration branch only**. It creates a new development database and a separate test asset namespace. Do not use production database credentials or production Cloudinary credentials. The real-service integration test writes synthetic accounts, one shop, one product, one listing, admin activity and one JPEG, then removes its own rows and image. Initial application startup also creates the schema and category rows in the development database.

## 1. Create a disposable Turso database

Install the Turso CLI using the current instructions at [Turso CLI installation](https://docs.turso.tech/cli/introduction), sign in with `turso auth login`, and create a database named exactly `nearby-phase2-dev` in a region near the Vercel function region:

```powershell
turso db create nearby-phase2-dev
```

Get its URL and create a database-scoped auth token. Keep the token in your local PowerShell environment; do not paste it into chat or commit it:

```powershell
$env:TURSO_DATABASE_URL = (turso db show --url nearby-phase2-dev).Trim()
$env:TURSO_AUTH_TOKEN = (turso db tokens create nearby-phase2-dev).Trim()
```

The integration test checks that the URL is `libsql:` and its host identifies `nearby-phase2-dev`. It refuses to run unless you explicitly confirm the disposable database below.

## 2. Create a Cloudinary test environment

Create or use a **separate Cloudinary test account/cloud**, then copy its cloud name and API key from the Cloudinary Console. Read the API secret without echoing it to the terminal:

```powershell
$env:CLOUDINARY_CLOUD_NAME = Read-Host 'Cloudinary test cloud name'
$env:CLOUDINARY_API_KEY = Read-Host 'Cloudinary test API key'
$secret = Read-Host 'Cloudinary test API secret' -AsSecureString
$env:CLOUDINARY_API_SECRET = [System.Net.NetworkCredential]::new('', $secret).Password
```

The app uploads under the `nearbuy/` public-ID prefix. The integration test uses random UUIDs and deletes its test image afterward. Never use an account that contains assets you cannot risk touching.

## 3. Run the real-service verification

From the repository root, set explicit opt-in flags and run only the cloud integration test first:

```powershell
$env:NEARBY_RUN_CLOUD_INTEGRATION = '1'
$env:NEARBY_CLOUD_TEST_CONFIRM = 'nearby-phase2-dev'
node --test tests/cloud-integration.test.mjs
```

The test starts two independent application processes against the same Turso database and Cloudinary account. It checks owner sign-up and session persistence, shop creation, inventory listing and stock updates, buyer search, admin login/dashboard, image upload/retrieval, and persistence from the second process. It uses only generated `.invalid` email addresses and synthetic product/shop data. Test uploads use the `nearbuy-phase2-test/` Cloudinary public-ID prefix. Before and after a run, cleanup matches only those synthetic account/product markers and deletes dependent rows before their parent rows.

To run the full suite and build afterward:

```powershell
npm test
npm run build
```

The gated cloud test is skipped unless `NEARBY_RUN_CLOUD_INTEGRATION=1` is set. No service secret is required for ordinary local development or tests.

## 4. Credentials to configure later

For an eventual **Vercel Preview** only, configure these server-side environment variables in the Preview scope: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `COOKIE_SECURE=1`, and a strong one-time `ADMIN_SETUP_TOKEN` for initial administrator setup. Add any custom Preview hostname to `ALLOWED_HOSTS`; Vercel's generated `VERCEL_URL` is recognized automatically. Use a distinct Preview database/token and Cloudinary test account. Do not configure Production values during Phase 2. Vercel Preview deployment is Phase 3 and requires separate approval.

The application also accepts `NEARBY_DATABASE=turso` and `IMAGE_STORAGE=cloudinary` locally to select the remote providers without setting `VERCEL=1`. These flags are set by the integration test process. The app fails closed if Vercel starts without Turso or Cloudinary credentials; it will not silently persist to ephemeral local files.

## Costs and limits

Turso currently advertises a free tier; its exact row, storage, request, and location limits can change, so check [Turso pricing](https://turso.tech/pricing) before creating the database. Cloudinary advertises a free plan at $0 with monthly credits; check its current [plan limits and pricing](https://cloudinary.com/pricing) before uploading a real catalogue. Exceeding included allowances, adding paid features, or changing plans can incur charges. Vercel's own function, bandwidth, and build limits also depend on the account plan.

## Phase 2 status

The application now has the real Turso adapter and Cloudinary signed upload/read/delete adapter. Automated tests validate Cloudinary request signing and response checks without contacting a service. **Real Turso/Cloudinary connectivity and end-to-end persistence remain unverified until the five provider credentials above are configured locally and the explicitly gated integration test is run.** No production data or credentials have been used.
