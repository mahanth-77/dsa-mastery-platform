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


## Kattis 64-record gate — candidate-only staging (2026-11-14)

The supplied final approval CSV and report were imported into a separate, non-runtime data area:

- `data/scenario-catalogue/kattis-41-candidates.json`
- `data/scenario-catalogue/kattis-64-gate-register.json`

### Reconciled gate counts

| Submitted disposition | Count | Staging treatment |
|---|---:|---|
| Reported approved | 41 | Imported as `candidate`; `importApproved: false` |
| Held for human review | 4 | Retained in audit register only |
| Disqualified | 19 | Retained in audit register only |
| **Total** | **64** | **64 unique IDs** |

The independent scenario audit reported 42 long-scenario candidates (20 strong + 22 moderate), but one (SCENARIO-050) remains held for its original/canonical slug mismatch. The 41 submitted approvals are not promoted to schema-level `approved` status.

### Evidence limitation and approval boundary

The supplied CSV contains observed-field booleans and gate notes, but does not include statement excerpts, evidence artifact paths, or retrieval dates. Accordingly, every staged candidate records:

- `reviewStatus: "candidate"`
- `importApproved: false`
- `evidence.evidenceKind: "historical_assertion"`
- `evidence.statementExcerpt: null`
- `evidence.retrievedAt: null`
- `review.scenarioFidelity: "inconclusive"`
- `review.scenarioDepth: "unassessed"`

This preserves the submitted audit claims without misrepresenting them as independently reproducible evidence or satisfying the existing approval gate.

Nine candidates are additionally flagged for scenario-materiality review: SCENARIO-008, 013, 016, 052, 053, 060, 095, 096, and 178. This is a review queue, not a disqualification.

The report names branch `vertex/recover-64-kattis-evidence`, but that branch was not found among the repository's published branches during this import. The evidence files described in the report were not present in the GitHub branch inspected here and were not fabricated or recreated. Only the CSV/report content supplied in the conversation was used.

The report's pre-existing baseline of 121 and combined total of 162 remain **reported, not independently re-certified in this staging change**. The baseline evidence files referenced in the report were not supplied for inspection.

### Integrity boundary

- `dsa_pattern_mastery_tracker.json` was read from the staging branch and its blob SHA remained `5ede9edfe952caebefee9aaa2f5a61e480f25aa9` at verification.
- No curriculum placement, learner progress, runtime component, Supabase migration, or production dataset was changed.
- These files are candidate/audit data only; they are not wired into the application.
- No production import, merge, or deployment was performed.


## Kattis nine-record scenario-materiality review (2026-11-14)

A separate review artifact was added at `data/scenario-catalogue/kattis-9-scenario-materiality-review.json`.

| Review outcome | Count |
|---|---:|
| Reviewed | 9 |
| Rejected as long scenarios on accessible official statements | 4 |
| Provisional not-long-scenario assessment; original statement still needed for final source-content judgement | 4 |
| Statement required before disposition | 1 |
| Import approved | 0 |

**Rejected as long scenarios:** SCENARIO-060 The Weight Of Words; SCENARIO-095 Counting Subsequences (Hard); SCENARIO-096 Busy Schedule; SCENARIO-178 Perket. These are valid practice problems, but their accessible statements/tasks are compact and do not meet the long-scenario standard.

**Provisional not-long-scenario:** SCENARIO-008 Coloring Socks; SCENARIO-013 Interval Scheduling; SCENARIO-016 Wood Cutting; SCENARIO-053 Radio Commercials. Available indexes/solution references indicate compact low-difficulty or standard algorithm exercises, but the original full statement was not retrieved for each. These remain candidates with a provisional quality concern, not final source-content rejections.

**Still pending:** SCENARIO-052 Walrus Weights. Metadata confirms the Kattis slug and Popup 2015 source, but the statement itself must be obtained before a defensible scenario-depth decision.

**Retrieval limitation:** direct Kattis problem-page requests returned 403/blocked in this review session. Independent references and official contest PDFs were used where available. This review does not certify all 41 candidate URLs or replace the missing source-evidence package. The 41 records remain candidate-only, and no import approvals, curriculum placements, or learner-progress changes were made.


## Kattis 41 source-identity cross-check (2026-11-14)

A separate metadata cross-check was added at `data/scenario-catalogue/kattis-41-source-identity-crosscheck.json`.

- 41 candidate records checked against the ICPC contest archive's Kattis index.
- 22 title/slug/contest metadata matches found.
- 1 slug conflict: the candidate titled **Exact Change** points to `exactchange2`, while the consulted archive maps the title **Exact Change** to `exactchange3`. This is an identity conflict, not proof that the submitted slug is invalid; it requires direct statement verification.
- 18 records had no matching entry in this particular archive index. Absence from this index is not proof of an invalid Kattis problem.
- 0 official Kattis statements were independently verified in this pass.
- 0 candidates were approved for import.

The ICPC archive index is a secondary metadata source. It can corroborate a title/slug/contest association but cannot establish statement content, input/output rules, constraints, or long-scenario depth. Therefore all 41 remain candidate-only. The next gate is direct official statement retrieval or an authoritative original contest statement for each candidate, with an excerpt and retrieval timestamp captured. No URL should be silently substituted to make a row appear to pass.


## Original contest statement retrieval — passes 1 and 2 (2026-11-14)

Two evidence ledgers now capture eight candidate statement matches:

- `data/scenario-catalogue/kattis-41-statement-evidence-pass-1.json` — 6 records: Bank Queue, Postal Delivery, Planting Trees, Canvas Painting, Daydreaming Stockbroker, and Marbles on a Tree.
- `data/scenario-catalogue/kattis-41-statement-evidence-pass-2.json` — 2 records: Button Bashing and Restaurant Orders.

For each, the ledger records the original contest statement URL, matching title/problem identity, a short statement excerpt, observed input/output contract, constraints, and a separate scenario-depth note.

**Current source gate:**
- 8/41 original contest statement identities corroborated.
- 33/41 still need original statement evidence.
- 0/41 live Kattis pages independently verified in this pass (direct requests remain blocked).
- 0/41 scenario qualifications approved by this evidence pass.
- 0 imports approved.

**Quality caution:** statement identity is not long-scenario qualification. For example, Planting Trees, Button Bashing, and Restaurant Orders have valid statement evidence but concise problem formulations. Postal Delivery and Canvas Painting have richer operational narratives, but still require the formal scenario-depth gate. No candidate is promoted merely because its statement was found.

No curriculum data, learner progress, runtime code, or production records were changed.
