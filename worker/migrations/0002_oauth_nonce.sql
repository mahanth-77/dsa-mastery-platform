-- Add the OIDC nonce to OAuth state rows for Google sign-in.
-- Apply to an existing D1 database before deploying the updated Worker:
-- npx wrangler d1 execute vertex --remote --file=migrations/0002_oauth_nonce.sql
ALTER TABLE oauth_states ADD COLUMN nonce TEXT NOT NULL DEFAULT '';
