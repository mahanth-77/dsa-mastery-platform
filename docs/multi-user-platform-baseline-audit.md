# VERTEX Multi-User Platform — Baseline Audit

**Audit date:** 2026-11-13  
**Scope:** GitHub source, Supabase project, and Vercel project  
**Status:** Read-only baseline audit; no application schema or production changes made.

## Executive summary

The repository currently contains a local-first React/Vite application and several partially integrated authentication/synchronization services. The Supabase project has no application tables or recorded migrations. The progress context still loads and saves the complete user progress object directly through localStorage. The current sync worker is not wired into that context.

The branch `vertex/multi-user-platform` is identical to `main` at commit `6c69ca1359e9f766fa5a44b26b433d8177b6fc62`; no isolated implementation branch changes exist yet.

## Verified baseline

### Curriculum
- 21 pattern families
- 115 variations
- 941 problem placements
- Curriculum JSON remains unchanged.

### Frontend
- React 18, Vite 5, TypeScript 5.6, React Router 6.
- Supabase JS dependency: `@supabase/supabase-js ^2.119.0`.
- Progress key: `dsa-mastery-progress`.
- `src/context.tsx` initializes progress with `loadProgress()` and persists changes with `saveProgress()`.
- The route tree exposes Dashboard, Pattern Explorer, Pattern Detail, Revision Center, Analytics, and Settings without authentication guards or sign-in/sign-up routes.
- `AuthContext` provides sign-up, sign-in, sign-out, and session restoration, but the UI does not currently expose a complete auth flow.
- `src/lib/supabase.ts` falls back to a localhost URL and a demo anon JWT when environment variables are absent. This makes missing configuration look configured and must be corrected before deployment.
- The existing `syntheticSyncAdapter` is explicitly a synthetic test adapter, not the production progress integration.

### Supabase
Project: `vertex`  
Project ref: `zknprjttuftrgeqyoedc`  
Region: `ap-south-1`

- No application tables found in the public schema.
- No recorded Supabase migrations found.
- No public RLS policies found.
- No public table grants found.
- Public function `rls_auto_enable()` is SECURITY DEFINER and its ACL currently grants EXECUTE to `anon` and `authenticated` as well as administrative roles.
- An enabled DDL event trigger named `ensure_rls` invokes this function after table-creation commands. The function currently sets `search_path = pg_catalog` and only attempts to enable RLS for tables created in the public schema.
- This function's ownership, intended operational necessity, ACL, and event-trigger behavior require review before any schema migration. Do not assume that automatic RLS enablement creates safe ownership policies; it does not.
- Security advisor review identified this function as an item requiring attention.

### Vercel
Project: `dsa-mastery-platform`  
Project ID: `prj_p5FH8sWyOhhDGCGCx1oWkWsPpgCo`

- Framework: Vite
- Latest deployment record: READY, production target
- Latest deployment commit: `6c69ca1359e9f766fa5a44b26b433d8177b6fc62`
- Latest deployment source branch: `main`
- Project metadata reports `live: false`; domain and production alias behavior still require an external verification pass.
- Domains include `dsa.startora.tech` and Vercel project domains.
- SSO protection is enabled for non-custom domains.

## Risks and blockers

1. **No backend schema:** the current frontend sync contract expects `user_placement_progress` and an `apply_sync_mutation` RPC, but neither exists in the database.
2. **No production sync integration:** app progress changes currently only write to localStorage.
3. **Configuration false-positive:** demo fallback credentials must not be treated as a configured production Supabase backend.
4. **Unsafe migration risk:** localStorage progress must not be uploaded automatically to whichever account happens to sign in.
5. **Account isolation:** sync queue, snapshots, conflicts, and cached progress need explicit account lifecycle handling.
6. **Database function permissions:** the security-definer RLS helper must be reviewed and hardened before creating application tables.
7. **Release state ambiguity:** Vercel's READY deployment status does not by itself prove the custom domain is serving the intended build.

## Approved implementation sequence

1. Correct Supabase configuration detection and fail closed for cloud features when environment variables are missing.
2. Review and harden the database RLS helper permissions without disabling its event trigger or changing behavior until the intended operational model is established.
3. Design versioned SQL migrations and a user-owned progress schema; enable RLS and add explicit ownership policies.
4. Add a tested RPC contract for idempotent mutation application and optimistic concurrency.
5. Implement authentication UI and guarded user-progress features while keeping public curriculum browsing available.
6. Integrate the existing local progress model with account-scoped sync; preserve all legacy fields (notes, approach, complexity, attempts, review history, confidence, activity, and settings).
7. Add explicit, previewable local-to-cloud import with a backup and merge policy.
8. Verify offline queue durability, retry behavior, account switching, two-user isolation, and cross-device convergence.
9. Deploy preview, inspect it, then request production approval.

## Change log

- This document only records read-only findings.
- No SQL mutations, GitHub source edits, production deployments, or user data migrations were performed during this audit.
