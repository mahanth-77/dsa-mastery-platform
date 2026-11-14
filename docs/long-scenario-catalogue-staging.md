# Long-scenario catalogue: staging and import gate

**Status:** Design/staging only. No curriculum, learner-progress, Supabase, or production data changed.

## Decision

Keep the long-scenario collection separate from the existing DSA curriculum. Do not append any of these 178 records to `dsa_pattern_mastery_tracker.json` and do not count them as verified long-scenario placements.

The 178 original baseline records reconcile structurally: 178 unique IDs, with matching title, platform, and URL fields across the normalized collection and strict-triage audit. That proves record identity and consistency; it does **not** prove that every source is a currently accessible, authentic long scenario.

## Re-triage of the 178 baseline records

| Strict disposition | Count | Treatment |
|---|---:|---|
| `SOURCE_UNVERIFIED_HOLD` | 64 | Keep quarantined until the official statement can be captured and reviewed. A retrieval 403 is inconclusive, not a dead link. |
| `EXCLUDE_FROM_LONG_SCENARIO_SET` | 58 | Do not include in the long-scenario collection. They may still be useful as ordinary DSA practice, but that is a separate product decision. |
| `REWRITE_SUMMARY_AND_REASSESS` | 51 | Rewrite only from facts in the official statement, then reassess scenario materiality and depth. |
| `MANUAL_STATEMENT_REVIEW` | 4 | Require human review of the complete official statement. |
| `SOURCE_MISMATCH_HOLD` | 1 | Resolve the title/source mismatch before any further qualification. |
| **Total** | **178** | **0 approved for import by the strict-triage audit.** |

All 178 baseline records lack a preserved statement excerpt in the strict-triage evidence. The earlier Phase 3.2 source-open/input-output/constraints flags are historical audit assertions; they are not a substitute for reproducible statement evidence in the current package.

## Required evidence before approval

A record may move to `approved` only when all of these are true:

1. The official source URL is canonical and resolves to the intended problem.
2. The observed page title matches the catalogue title, or a documented correction is approved.
3. The official statement excerpt is preserved with a retrieval date and source URL.
4. Input format, output format, and constraints are observed and recorded.
5. The scenario is genuinely present in the source; synthetic roles, settings, operational details, or business context are not added.
6. Scenario depth is independently assessed as `moderate`, `long`, or `strong` using a documented rubric.
7. A reviewer records the decision and rationale. A link check alone is never enough.

A blocked retrieval must remain `source_unverified`, not be silently converted to either approved or rejected. Historical evidence may be retained, but it must be labeled historical and must not satisfy the current approval gate on its own.

## Proposed lifecycle

`candidate` → `source_checked` → `statement_captured` → `scenario_reviewed` → `approved`

Any stage may instead transition to `hold`, `rewrite_required`, or `excluded`. Only `approved` records can be exposed in the future long-scenario experience.

## Integration boundary

- Existing curriculum remains **21 patterns / 115 variations / 941 placements**.
- Existing placement IDs, ordering, status fields, and learner progress remain untouched.
- Scenario records use their own stable IDs and separate catalogue storage.
- Do not add scenario-only records to curriculum totals or spaced-repetition calculations.
- Do not write to Supabase until the catalogue schema, ownership/access model, and migration plan are reviewed separately.
- The schema in `long-scenario-record.schema.json` is a proposed contract, not an implemented runtime feature.

## Next review batch

Start with the 64 source-unverified rows using alternate official access paths or archived official contest statements. Review the four manual-review rows next, then resolve the single source mismatch. Reassess the 51 rewrite candidates only after their source statements are available. Keep the 58 exclusions out of the long-scenario queue.

## Audit scope and honesty

This staging decision uses the supplied final 185-record CSV and strict-triage CSV. It does not claim a fresh live re-fetch of every source. The strict-triage file records 115 pages opened and 70 Kattis retrievals blocked with HTTP 403 across all 185 records. The 178 baseline rows are not independently re-certified merely because their IDs reconcile.


## Recovery research — ICPC archive lead (2026-11-14)

The first recovery route is now identified: the public ICPC contest archive has a Kattis judge catalogue and a separate problem index. The Kattis catalogue documents that Kattis provides statements/submissions and maps problem IDs to contest sources. The problem index records **Bank Queue** as Kattis short name `bank`, associated with `kth-2013`, and marks the KTH 2013 non-mainline set as holding statements, test data, solutions, and packages (`StDSoP`). This is a promising archival lead, not yet a statement capture or qualification decision.

Research references:
- Kattis judge catalogue: https://icpc-contest-archive.github.io/contests/judge/kattis.html
- Problem index: https://icpc-contest-archive.github.io/contests/problem/index.html
- Bank Queue archive index row: problem UUID `949781ee-0639-475a-93ee-75f96893a51c`, short name `bank`, set `kth-2013`.

**Recovery status remains unchanged:** 64 records are still `SOURCE_UNVERIFIED_HOLD` until actual statement content is retrieved and compared. The public catalogue's archive-holding flag is metadata about archive availability; it is not a substitute for inspecting the statement. No record was upgraded, and no VERTEX curriculum data was changed.
