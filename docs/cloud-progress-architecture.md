# VERTEX Cloud Progress Architecture — Design Decision Record

**Date:** 2026-11-13  
**Status:** Proposed contract; not applied to Supabase.  
**Scope:** Preserve the current 21-family / 115-variation / 941-placement curriculum and every existing learner field.

## 1. Critical contract mismatch found

The current application stores a rich `UserProgress` document in localStorage:

- `problems[placementId]`: status, attempts, lastSolvedAt, nextRevisionAt, notes, approach, timeComplexity, spaceComplexity, confidence, reviewHistory
- `activity[]`: date, problemId, action, patternId
- `settings`: dailyGoal, theme, compactView
- `version`, `lastUpdated`

The existing sync worker's `apply_sync_mutation` call sends only:
`clientMutationId, placementId, status, confidence, attempts, expectedVersion`.

It does not send notes, approach, complexity, review history, activity, or settings. Therefore, creating only the existing worker's expected `user_placement_progress` table would silently fail to preserve the complete learner state. That design is rejected.

The existing read service also expects `user_profiles`, `user_settings`, `curriculum_versions`, and `user_placement_progress`; these expectations are not backed by migrations or current database tables.

## 2. Recommended storage model

Use normalized ownership and a JSONB payload per placement, rather than uploading a single unbounded JSON document or discarding fields.

### `public.user_profiles`
- `user_id uuid primary key references auth.users(id) on delete cascade`
- `display_name text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Do not duplicate email as authoritative profile data; obtain it from the authenticated user/session or synchronize it only through a trusted server-side path.

### `public.user_settings`
- `user_id uuid primary key references auth.users(id) on delete cascade`
- `settings jsonb not null` constrained to an object
- `updated_at timestamptz not null default now()`
- Preserve the existing dailyGoal/theme/compactView fields and allow explicit schema versioning.

### `public.user_placement_progress`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `placement_id text not null`
- `payload jsonb not null` containing the full existing ProblemProgress shape
- `server_version bigint not null default 1`
- `client_updated_at timestamptz not null`
- `updated_at timestamptz not null default now()`
- primary key (`user_id, placement_id`)
- Validate JSON object shape, status enum, confidence bounds, nonnegative attempts, and array/object types. Avoid duplicating fields in columns until query/analytics needs justify it.

### `public.user_activity_events` (optional phase 2)
Do not introduce this initially. The current activity array can be preserved inside a per-user progress envelope or added later with stable event IDs and idempotency. Avoid a lossy conversion of date/problem/action events.

### `public.sync_mutation_receipts`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `client_mutation_id uuid not null`
- `placement_id text not null`
- `applied_server_version bigint not null`
- `created_at timestamptz not null default now()`
- primary key (`user_id, client_mutation_id`)
- Retain receipts for idempotent replay; define retention only after a safe replay window is chosen.

## 3. Security model

- Enable RLS on every exposed user-owned table.
- Policies target `authenticated` only.
- SELECT/DELETE: `(select auth.uid()) = user_id`.
- INSERT: `WITH CHECK ((select auth.uid()) = user_id)`.
- UPDATE: both `USING ((select auth.uid()) = user_id)` and `WITH CHECK ((select auth.uid()) = user_id)`.
- Never trust a user ID supplied by the browser as authorization. The RPC derives ownership from `auth.uid()`.
- Grant only the exact table operations required to `authenticated`; no `anon` access to learner data.
- Keep curriculum public read-only separately; do not mix learner-owned rows with public curriculum data.
- Any SECURITY DEFINER RPC must have a fixed safe search_path, schema-qualified object references, strict validation, minimal grants, and a documented reason it needs definer privileges. Prefer SECURITY INVOKER.
- The existing `rls_auto_enable()` helper has already had EXECUTE revoked from PUBLIC, anon, and authenticated. Its event trigger remains active.

## 4. Sync contract changes required before implementation

The current worker's placement mutation contract is incomplete for the app's actual data model. Replace it with a typed full-payload mutation contract:

- `client_mutation_id`
- `placement_id`
- `payload` (complete ProblemProgress)
- `expected_version`
- `client_updated_at`
- optional `base_payload` or field-level intent metadata if conflict resolution requires it

RPC must:
1. Derive `user_id := auth.uid()`; reject null.
2. Validate payload and placement identifier.
3. Check `sync_mutation_receipts` first and return prior result for idempotent replay.
4. Lock the target user's placement row.
5. Apply an explicit optimistic-concurrency policy; do not silently overwrite rich notes/review history.
6. Increment server version atomically.
7. Store receipt and row update in one transaction.
8. Return the canonical server payload and version.
9. Never accept a caller-supplied user ID.

The existing conflict resolver is specialized for status/confidence/attempts and must be extended or replaced for rich payload merging. A blanket last-write-wins merge is not acceptable for notes or review history.

## 5. Local data and account lifecycle

- Keep `dsa-mastery-progress` intact as the legacy guest/local document.
- Never automatically upload it on sign-in.
- Before import: create a local backup, show record counts and last-updated time, and ask the user to explicitly import/merge.
- Keep guest progress separate from account-scoped progress until the user chooses a migration.
- Cache cloud snapshots partitioned by immutable Supabase user UUID.
- On sign-out/account switch: abort in-flight requests; never display or enqueue one account's state under another account; do not delete guest progress.
- Queue records must carry the account UUID and be validated against the active session immediately before dispatch.
- Offline edits must remain durable in IndexedDB; memory fallback must be disclosed as non-durable.

## 6. Rollout phases

1. Add migration SQL and database contract tests in the feature branch; do not apply to the live project yet.
2. Add typed repository/RPC implementation and adapt the worker to complete payloads.
3. Add auth UI and explicit guest/account state model.
4. Add preview-only schema apply and test two isolated accounts, RLS, idempotency, concurrency, and offline behavior.
5. Implement explicit local import/merge with backup and recovery.
6. Preview deployment and full browser verification.
7. Production deployment only after a separate explicit approval.

## 7. Release blockers

- Existing worker currently sends an incomplete payload.
- Current `getCloudProfile()` assumes a profile row exists; profile provisioning trigger/migration is absent.
- Current auth context does not coordinate the active sync user or clear/switch progress safely.
- Current progress context does not integrate the sync worker.
- Existing `saveProgress` mutates `lastUpdated` in place, and the app state has no migration/backup UX.
- No application migration history or tables currently exist in Supabase.

**Decision:** Do not create the database schema until the worker contract and local/account state lifecycle are updated to match this complete payload model. This prevents a cloud backend that appears to work while silently losing learner data.
