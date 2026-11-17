# VERTEX account API (Cloudflare Worker + D1)

Sign-in (Google, or a 6-digit emailed code) and cross-device progress sync. Free tier is enough to start.

## Setup
1. `cd worker && npm install`
2. The VERTEX D1 database is named `vertex-db`. Its generated ID is configured in `wrangler.toml`. Authenticate with `npx wrangler login` before running database or deployment commands.
3. For a newly created, empty database, apply the current schema: `npx wrangler d1 execute vertex-db --remote --file=schema.sql`. If the database was initialized earlier using a schema without the OIDC nonce column, apply `npx wrangler d1 execute vertex-db --remote --file=migrations/0002_oauth_nonce.sql` instead. Do not apply that migration to a database that already has the `nonce` column.
4. `APP_ORIGIN` is set in `wrangler.toml` to `https://dsa.startora.tech` for production (or your local origin during local development).
5. Set secrets (`npx wrangler secret put NAME`):
   - `CODE_PEPPER`: any long random string.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google Cloud Console > APIs & Services > Credentials > OAuth client (Web). Authorised redirect URI: `${APP_ORIGIN}/api/auth/google/callback`.
   - Email codes (optional): `BREVO_API_KEY` or `RESEND_API_KEY`, plus `MAIL_FROM`. Reliable delivery to arbitrary users needs a verified sending domain, which may cost money. Without it, Google sign-in still works and the email option reports "unavailable".
6. Deploy the Worker with `npx wrangler deploy`. Its URL is `https://vertex-api.divimahanth77.workers.dev`.
7. `vercel.json` routes `/api/*` to the Worker URL above, keeping the session cookie first-party on the VERTEX site.

## Local development
Copy `.dev.vars.example` to `.dev.vars` (set `DEV_LOG_CODES=1` to print email codes to the console), apply the schema with `--local`, run `npm run dev` here (port 8787) and `npm run dev` in the repo root; Vite proxies `/api`.

## Security notes
Google sign-in binds the one-time OAuth state to a short-lived HttpOnly/SameSite=Lax browser cookie, uses PKCE and an OIDC nonce, and verifies the ID-token RS256 signature against Google's published JWKS before accepting claims. Keep the Worker and D1 migrations in sync.

## Verify after deploying
Sign in on the live site and confirm a `__Host-vertex_sid` cookie is set (Vercel must pass `Set-Cookie` through the rewrite), then sign in on a second device and check progress appears.
