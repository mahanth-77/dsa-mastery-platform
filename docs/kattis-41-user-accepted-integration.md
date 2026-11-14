# Kattis 41 user-accepted catalogue integration

**Status:** Implemented on an isolated feature branch for review. Not merged or deployed.

## User decision and scope

On 2026-11-14, the user explicitly asked to begin integrating the 41 Kattis problems submitted in the final 64-record gate, stating they were happy with that set. This is recorded as acceptance for inclusion in a separate VERTEX scenario catalogue.

This does not rewrite the underlying evidence history. Candidate records still carry their original evidence fields and review rationale. Missing statement excerpts, missing retrieval timestamps, unresolved source crosswalks, and unassessed scenario depth remain visible as evidence limitations.

## Implemented

- Added `data/scenario-catalogue/kattis-41-user-accepted.json` with exactly 41 unique records.
- Each record is tagged `catalogueInclusion: user_accepted` and `evidenceGate: pending`.
- Added a dedicated `/scenarios` route and sidebar entry.
- Added search by title, ID, URL, and primary pattern; pattern and evidence-state filters.
- Each card links to the original submitted Kattis URL and shows the recorded evidence/depth status and review rationale.
- The page explicitly discloses that inclusion is user-approved while source verification and scenario-depth review remain separate.

## Deliberately unchanged

- `dsa_pattern_mastery_tracker.json` and all 941 existing placements.
- Existing progress records, revision scheduling, analytics, and Supabase schema/data.
- Core curriculum counts (21 patterns / 115 variations / 941 placements).
- Existing PR #2 and its staging audit history.

## Acceptance and evidence semantics

The user-approved inclusion state is not a claim that all 41 are independently source-verified or objectively long scenarios. The catalogue uses separate fields for user inclusion and evidence review. The original `reviewStatus`, evidence payload, and rationale are preserved per record for traceability.

## Validation required before merge

- Confirm JSON parses and has 41 unique scenario IDs.
- Confirm every record is user-accepted and still has its original source URL.
- Confirm the route, navigation entry, and page type-check/build.
- Confirm no changes to the core tracker, progress schema, Supabase migrations, or deployment configuration.
- Review UI accessibility and mobile layout.
- Keep this feature branch unmerged until checks pass.
