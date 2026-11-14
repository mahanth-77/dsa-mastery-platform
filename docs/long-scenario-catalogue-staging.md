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


### Statement evidence pass 3

A third ledger, `data/scenario-catalogue/kattis-41-statement-evidence-pass-3.json`, adds three more original-statement matches:

- **Coast Length** — KTH Challenge 2011, Problem E.
- **Nikola** — Croatian Open Competition in Informatics 2007/2008, Croatian Regionals.
- **Canonical Coin Systems** — North America Qualifier 2017, Problem C.

Updated cumulative source gate:
- 11/41 candidate identities corroborated against original contest statement sources.
- 30/41 still require original statement evidence.
- 0 live Kattis problem pages directly verified in these passes.
- 0 scenario qualifications approved by these source-evidence passes.
- 0 imports approved.

The 11 matches are evidence of source identity and statement content, not permission to import. The remaining 30 stay pending. Scenario materiality is deliberately separate; short or abstract tasks do not become long scenarios merely because an original statement was located.


### Statement evidence passes 4–7

Pass 4 adds two original NCPC 2007 statements:
- Shopaholic (Problem H)
- Phone List (Problem A)

Pass 5 adds four more:
- Train Passengers (NCPC 2014, Problem K)
- Financial Planning (BAPC 2018, Problem F)
- Boggle (GCPC 2013, Problem A; statement is from a mirror and is lower-provenance)
- Sudoku (NWERC 2006, Problem A)

Cumulative original contest statement identity matches: **17/41**. The other 24 candidates still require evidence or source-provenance resolution. The evidence pass has approved zero long-scenario qualifications and zero imports.

Pass 6 records eight direct Kattis-page fetch attempts that returned HTTP 403. This is a fetcher access restriction, not evidence that those problems are invalid, and it does not count as statement verification.

Pass 7 flags two alternate-source provenance conflicts:
- Train Sorting: an accessible statement copy is from Waterloo Contests Selection 2013, while the submitted source claim says Waterloo 2008.
- Cranes: an accessible statement copy is from Waterloo Contests Selection 2013, while the submitted source claim says Waterloo 2008.

These two alternate statements are not counted as verification of the submitted source claims. The Exact Change slug conflict remains unresolved. No candidate was promoted to import approval.


### Statement evidence passes 8–10 and crosswalk correction

Pass 8 reconciled three previously reviewed official statements into the source ledger:
- The Weight Of Words (Virginia Tech 2017)
- Counting Subsequences (IPSC 2006; the official page links easy and hard datasets)
- Perket (COCI 2008/2009)

All three are rejected from the long-scenario quota because their scenario formulations are compact. Their source identities are now counted in the source ledger.

Pass 9 adds:
- Pripreme (COCI 2014/2015 Round 4; contest statement copy)
- Introspective Caching (NCPC 2008 Problem I; original contest PDF)

Pass 10 records a secondary statement mirror for Classrooms (Hong Kong Regional Online Preliminary 2016), but does not count it as original official-hosted statement verification.

**Correction to the Exact Change finding:** The earlier wording implied `exactchange2` conflicted with `exactchange3`. That was too broad. These are distinct Exact Change variants; `exactchange2` is cross-referenced to UVa 11517, while the ICPC index's `exactchange3` is a separate PACNW 2024 problem. The candidate's submitted Waterloo 2008 provenance claim remains unsupported, so SCENARIO-057 stays on provenance hold. Do not replace its slug with `exactchange3`.

Updated cumulative gate:
- 22/41 original contest statement identities corroborated.
- 19/41 still need original statement evidence or provenance resolution.
- 6 archive metadata-only matches remain.
- 1 exactchange2 candidate is held for provenance resolution (not a confirmed slug typo).
- 2 alternate-source provenance conflicts remain for Train Sorting and Cranes.
- 0 live Kattis pages directly verified in these passes.
- 0 long-scenario approvals and 0 imports.

The 22/41 figure is source-identity evidence only. It does not mean 22 candidates are long scenarios. All 41 candidate records remain candidate-only and unapproved.


### Contest metadata corroboration — additional pass (2026-11-14)

The source cross-check now records additional metadata-only matches:
- Water — Kattis 2016 Southeast USA Regionals Division 1 source page.
- Grid — Kattis 2015 Southeast USA Regionals Division 1 source page.
- Air Conditioned Minions — secondary contest metadata links it to Singapore Regional 2015.
- Fire — secondary contest metadata links `fire2` to BAPC 2012.
- Build Dependencies — secondary contest metadata links `builddeps` to NWERC 2015 Practice.
- Radio Commercials — secondary contest metadata links `commercials` to KTH training 2011-01-26.

These are provenance/slug metadata matches only, not problem-statement evidence. The linked Kattis statement pages returned 403 where directly tested. They do not increase the 22 original-statement count or approve scenario quality.

Current source inventory: 22 original contest statement identities verified; 8 metadata-only matches; 10 not found in the consulted archive index; 1 explicit provenance-mismatch hold (Exact Change); 3 alternate-source provenance conflicts recorded (including Train Sorting and Cranes). Categories overlap where a record has both a metadata observation and a separate provenance issue; do not sum them as mutually exclusive buckets.


### Original statement evidence — pass 11

Pass 11 adds:
- **Water** — original 2016 Southeast USA Regional Division 1 Problem J statement. It is a water utility network that undergoes permanent pipe-capacity improvements; the maximum source-to-mansion flow must be reported after every change. This is a strong contextual candidate for long-scenario review.
- **Fire** — original BAPC 2012 Problem F statement. It describes escaping a building as fire spreads through rooms; scenario framing is clear, but it is a single time-dependent BFS problem and should receive only moderate-depth consideration.
- **Train Sorting** — a DMOJ judge mirror identifies the task as Waterloo 2008 Spring A and provides the matching statement. This corroborates the year/source family; the exact submitted June 15 date remains unverified. Its short train-car story and single LIS-style objective do not support strong long-scenario status.

The prior Train Sorting alternate-source conflict is superseded: a Waterloo 2008 Spring A record is now independently corroborated. The Waterloo 2013 copy is treated as an alternate/reused statement, not evidence against the 2008 source claim.

Current source inventory after pass 11:
- 25/41 original contest statement identities corroborated (including a small number of judge/contest-hosted copies; check each record's sourceType).
- 6 metadata-only matches.
- 9 not found in the consulted archive index.
- 1 explicit provenance-mismatch hold: Exact Change.
- 2 remaining alternate-source provenance conflicts: Exact Change and Cranes.
- 0 live Kattis pages directly verified.
- 0 imports approved.

The 25 count is not a quality pass count. Water is a strong long-scenario candidate for final rubric review; Fire is a possible moderate candidate; Train Sorting is not a long-scenario candidate. None is import-approved.


## Kattis statement evidence and provenance cross-check — pass 12 (2026-11-14)

Added `data/scenario-catalogue/kattis-41-statement-evidence-pass-12.json` for six unresolved candidates:

| ID | Candidate | Finding | Current treatment |
|---|---|---|---|
| 011 | Air Conditioned Minions | Singapore 2015 source association corroborated by secondary archive/judge metadata; participant recap describes interval-greedy task, but original statement not captured | Provisional not-long-scenario quality concern; not a final source-content rejection |
| 035 | Muddy Hike | Kattis problem identity appears in a solution index; MAPS 2017 organizer/site exists, but the accessible evidence does not tie this exact problem to that source | Provenance and statement remain unverified |
| 052 | Walrus Weights | Popup 2015 Session 1 source association corroborated by secondary judge metadata; statement not captured | Retain human-review flag; depth unassessed |
| 058 | Spiderman's Workout | Matching full statement inspected on a secondary DOMjudge mirror; claimed Norwegian/Swedish Championships 2003 provenance not corroborated | Provisional not-long-scenario assessment based on the concise single-task statement; source provenance unresolved |
| 083 | Word Cloud | MCPC 2014 title/slug/source association corroborated by secondary archive and judge metadata; exact 2014 statement not captured | Depth unassessed; do not substitute the distinct 2015 Word Clouds Revisited problem |
| 200 | Cranes | Only the alternate Waterloo 2013 statement copy was found; claimed Waterloo 2008-10-04 statement not obtained | Keep provenance hold |

Pass 12 adds **zero original contest statements** and **zero import approvals**. Three candidates have secondary metadata corroboration; one has matching statement content on a secondary mirror but unresolved original provenance. Two candidates receive only provisional not-long-scenario quality concerns; these are not counted as final source-content rejections. Direct Kattis page/source-page requests remain blocked with HTTP 403, which is an access limitation and not evidence of invalidity.

The statement-content review for Spiderman's Workout found a short climbing-direction optimization task with at most 101 scenarios, at most 40 distances per scenario, and total distance at most 1000. This is not enough narrative or task breadth for the long-scenario quota under the current rubric. The Air Conditioned Minions assessment is provisional because it relies on a participant recap rather than the full original statement.

**Cumulative integrity status:** all six remain candidate-only; `importApproved: false`; no curriculum, learner-progress, runtime, Supabase, or production data changed. The previously reported 25/41 original-statement identity count is unchanged; pass 12 does not add to that count.


## Kattis evidence cross-check — pass 13 (2026-11-14)

Added `data/scenario-catalogue/kattis-41-statement-evidence-pass-13.json` for ten unresolved candidates:

| ID | Candidate | New finding | Gate status |
|---|---|---|---|
| 008 | Coloring Socks | Kattis identity and course-use references found; submitted KTH Training source and full statement not verified | Candidate; depth unassessed |
| 013 | Interval Scheduling | VJudge metadata identifies Kattis slug and Algorithm Design, ITU 2019 source | Metadata only; statement missing |
| 014 | Classrooms | Matching statement inspected on a secondary mirror; VJudge metadata identifies Hong Kong Regional Online Preliminary 2016 | Provisional not-long-scenario; original-host statement missing |
| 016 | Wood Cutting | Archive index confirms Alberta 2016 source; a third-party solution explanation describes minimizing average customer wait | Metadata/solution description only; statement missing |
| 027 | Single source shortest path, time table | KTH course pages describe `shortestpath2` as timetable-graph Dijkstra; submitted Popup 2005 provenance is not corroborated | Course exercise reference only; statement/source unresolved |
| 030 | Grid | Archive index confirms `grid` under SEUSA 2015, but does not distinguish Division 1 from Division 2 | Metadata only; statement missing |
| 034 | Build Dependencies | VJudge metadata identifies NWERC 2015 Practice source | Metadata only; statement missing |
| 053 | Radio Commercials | KTH course page lists it as an exam problem; submitted training-date provenance and statement remain unverified | Course context only |
| 057 | Exact Change | `exactchange2` identity appears in a solution index; Waterloo 2008 provenance remains unsupported; `exactchange3` is a distinct variant | Keep provenance hold |
| 096 | Busy Schedule | Baylor course page lists problem 207; textbook index lists it among sorting exercises | Course context only; statement missing |

Pass 13 records five secondary metadata matches, four course/problem-context references without full source corroboration, and one identity-only reference with unresolved provenance. One secondary statement mirror was inspected (Classrooms); zero original contest statements were captured. Only Classrooms receives a provisional not-long-scenario assessment in this pass. The other candidates remain unassessed rather than being rejected from titles, algorithm labels, or solution summaries.

The Grid finding is deliberately narrow: the archive index maps the Kattis slug to the 2015 Southeast USA contest family but does not prove the Division 1 claim. A Division 2 statement must not be substituted. Likewise, the KTH course exercise for `shortestpath2` is not evidence for the submitted Popup 2005 provenance.

**Pass 13 result:** 0 new original-statement identity approvals; 0 import approvals. No candidate record, curriculum placement, learner progress, runtime, Supabase, or production data was modified.


## Kattis evidence cross-check — pass 14 (2026-11-14)

Added `data/scenario-catalogue/kattis-41-statement-evidence-pass-14.json` for Word Cloud (SCENARIO-083) and Walrus Weights (SCENARIO-052).

- **Word Cloud:** inspected a full secondary statement mirror containing the typography model, font-size and character-width formulas, ordered row-packing rules, input/output, constraints, and sample data. The mirror links to Kattis `wordcloud`; the ICPC archive maps the exact title/slug to MCPC 2014, and VJudge metadata names the same 2014 source and authors Ryan Marshall and Michael Goldwasser. This is strong identity/source metadata corroboration plus statement-content inspection, but it is not the original contest-hosted statement. The candidate's submitted STRONG depth label is reduced to **provisional MODERATE**: there is a concrete data-processing narrative and several layout calculations, but the algorithmic core is still one ordered greedy row-packing task. Human rubric confirmation and original-source retrieval remain open.
- **Walrus Weights:** VJudge's Kattis problem metadata identifies the exact slug, Popup 2015 Session 1 source, and author Marc Vinyals. The full statement and constraints remain uncaptured, so scenario depth remains unassessed and its human-review flag stays in place.

Pass 14 adds zero original contest-hosted statements and zero import approvals. The 25/41 original-statement identity count is unchanged. No candidate JSON, curriculum, learner progress, runtime, Supabase, or production data was changed.


## Focused scenario-depth review — pass 15 (2026-11-14)

Added `data/scenario-catalogue/kattis-41-scenario-depth-review-pass-15.json` for four priority records. This is a materiality review based on secondary descriptions/statements, not an original-source approval pass.

- **Air Conditioned Minions (011):** the ICPC archive maps the exact title/slug to Singapore 2015; two participant recaps identify it as Problem F. One describes sorting temperature intervals and greedily selecting the minimum number of overlap groups. Provisional not-long-scenario: a compact single-objective interval-greedy task. Full original statement not captured.
- **Muddy Hike (035):** a competitive-programming problem catalogue describes the exact Kattis problem as a minimax path problem; a solution repository lists the exact slug. MAPS 2017's Kattis contest site exists, but no evidence yet connects this exact problem to that source. Provisional not-long-scenario on technical shape only; provenance remains unresolved and statement missing.
- **Spiderman's Workout (058):** the secondary statement mirror inspected in pass 12 describes a bounded up/down sequence DP minimizing maximum height, with at most 40 moves per case and total distance at most 1000. Provisional not-long-scenario: one compact optimization task; claimed 2003 contest provenance remains unresolved.
- **Cranes (200):** the Waterloo 2013 alternate statement still does not establish the submitted Waterloo 2008-10-04 provenance. Keep the hold; do not substitute the alternate statement.

Pass 15 adds zero original contest statements and zero import approvals. Three candidates receive provisional not-long-scenario assessments; Cranes remains unassessed on provenance hold. These dispositions are not written into the candidate catalogue, pending the full evidence gate and human review.


## Primary-source and scenario-depth review — pass 16 (2026-11-14)

Added `data/scenario-catalogue/kattis-41-source-and-depth-review-pass-16.json` for Cranes (SCENARIO-200), Exact Change (SCENARIO-057), and Spiderman's Workout (SCENARIO-058).

- **Cranes:** the official University of Waterloo archive identifies the October 4, 2008 contest and lists Problem A: Cranes. Its original statement was inspected. This corroborates the submitted Waterloo source claim and supersedes the earlier concern based solely on the unrelated/reused Waterloo 2013 statement. The exact Kattis `cranes` slug crosswalk is still not independently established. The statement is a bounded geometric subset-selection problem with at most 15 candidate locations; provisional not-long-scenario.
- **Exact Change:** the official Waterloo archive lists Problem C: Exact Change on October 4, 2008, and its original statement was inspected. This corroborates the claimed Waterloo source statement, but not the exact Kattis `exactchange2` slug crosswalk. The separate `exactchange3` entry remains a different problem and must not be substituted. The task is a bounded dual-objective subset-sum/coin-selection DP; provisional not-long-scenario.
- **Spiderman's Workout:** found and inspected a complete 2003 statement PDF hosted by Linköping University. It confirms the bounded up/down sequence optimization (M <= 40; total distance <= 1000). The PDF's source marker does not independently establish the claimed Norwegian/Swedish Championships provenance or the Kattis slug crosswalk. Provisional not-long-scenario.

The cross-check now distinguishes **candidate source statement verified, Kattis slug crosswalk pending** (2 records) from fully cross-checked Kattis source identities. The archive-index-only count remains separate. Pass 16 adds two official Waterloo statements and one institutionally hosted statement copy; it adds zero import approvals. All 41 candidate records remain candidate-only; no curriculum, learner progress, runtime, Supabase, or production data was changed.


## Source reconciliation and materiality review — pass 17 (2026-11-14)

Added `data/scenario-catalogue/kattis-41-source-and-depth-review-pass-17.json` for Cranes, Exact Change, Walrus Weights, Word Cloud, and Muddy Hike.

- **Cranes:** inspected the official Waterloo October 4, 2008 contest index and Problem A statement. It describes candidate crane sites on a square grid, radii, non-touching safety constraints, and maximizing covered area with at most 15 candidate sites. This confirms the Waterloo source statement, but not the exact Kattis `cranes` slug crosswalk. Provisional not-long-scenario.
- **Exact Change:** inspected the same official contest index and Problem C statement. It minimizes the amount paid at or above the price, then the number of bills/coins (price <= 10,000 cents; n <= 100). This confirms the Waterloo source statement, but not the exact Kattis `exactchange2` crosswalk. Do not substitute distinct `exactchange3`. Provisional not-long-scenario.
- **Walrus Weights:** source metadata continues to identify Popup 2015 Session 1 and author Marc Vinyals. Third-party solutions/discussions indicate a single subset-sum task choosing plate weights closest to 1000. The original statement and constraints remain unavailable; provisional not-long-scenario only, not source-approved.
- **Word Cloud:** archive metadata maps `wordcloud` to MCPC 2014, distinct from `wordclouds` / Word Clouds Revisited (MCPC 2015). A full secondary statement mirror and VJudge metadata were previously inspected. Keep provisional MODERATE, not STRONG; original contest-hosted statement and human rubric review remain open.
- **Muddy Hike:** third-party catalogue/solution evidence indicates a minimax path problem, but the original statement and MAPS 2017 source link remain unverified. Provisional not-long-scenario only; not an identity disqualification.

Pass 17 adds zero original statements beyond the two Waterloo statements already captured in pass 16. It adds zero import approvals. All candidate records, curriculum placements, learner progress, runtime, Supabase, and production data remain untouched.


### Source reconciliation and statement-retrieval pass 18
Added `data/scenario-catalogue/kattis-41-source-and-depth-review-pass-18.json`.

- Wood Cutting: the ICPC Kattis archive maps the exact `woodcutting` slug/title to Alberta 2016. This corroborates source identity only; the original statement was not captured.
- Interval Scheduling: Virtual Judge metadata identifies `intervalscheduling`, Algorithm Design, ITU 2019, and author Thore Husfeldt. Secondary metadata only; original statement still missing.
- Build Dependencies: Virtual Judge metadata identifies `builddeps`, NWERC 2015 Practice, and author Jeroen Bransen. Original practice statement not captured. Do not substitute the similarly titled NWERC 2025 test-session problem.
- Grid: a retrieved Division 2 PDF is a different task and is explicitly excluded as evidence for the submitted Division 1 source claim.
- Single Source Shortest Path, Time Table: a UCF teaching assignment confirms the Kattis slug and time-dependent Dijkstra technical shape, not the submitted Popup 2005 provenance.
- Coloring Socks and Radio Commercials: no authoritative source statement retrieved; retain unverified.
- Muddy Hike and Walrus Weights: only secondary technical/metadata evidence remains; no original statement.
- Busy Schedule: educational references support a compact sorting-task concern, not the submitted Baylor source provenance; original statement still needed.
- Exact Change and Cranes: official Waterloo statements remain verified from Pass 16/17, but exact Kattis slug crosswalks remain pending.

Pass 18 reviewed 12 records (10 unresolved candidates plus the two Waterloo slug-crosswalk checks), captured zero new original statements, and approved zero imports. All 41 candidate records remain candidate-only. No curriculum, learner progress, runtime, Supabase, or production data changed.


### Targeted source reconciliation pass 19
Added `data/scenario-catalogue/kattis-41-source-and-depth-review-pass-19.json`.

- Wood Cutting: ICPC archive explicitly maps `woodcutting` to Alberta 2016; this is title/slug/source metadata, not the original statement.
- Radio Commercials: Virtual Judge metadata identifies exact slug `commercials`, KTH training 2011-01-26, and author Lukáš Poláček; full training statement still missing.
- Build Dependencies: Virtual Judge metadata identifies `builddeps`, NWERC 2015 Practice, and author Jeroen Bransen. A 2025 NWERC practice-slides PDF contains a same-title problem by the same author, but it is a different edition and is not substituted as 2015 evidence.
- Coloring Socks: slug/title corroborated only by a solution index; no KTH source statement found. A KTH Challenge 2013 PDF is unrelated and excluded.
- Exact Change: archive maps `exactchange3` to PACNW 2024, confirming it is a distinct variant; this does not resolve the `exactchange2` Waterloo 2008 crosswalk.
- Cranes: official Waterloo 2008 statement remains verified, but the Kattis `cranes` slug crosswalk remains pending.

Pass 19 captured zero new original statements and approved zero imports. Candidate records remain unchanged; all 41 remain candidate-only. No curriculum, learner progress, runtime, Supabase, or production data changed.



### Targeted primary-source retrieval and slug-crosswalk pass 20
Added `data/scenario-catalogue/kattis-41-source-and-depth-review-pass-20.json`.

- Wood Cutting: the official Kattis Alberta 2016 problem-source page lists Wood Cutting and links the `woodcutting` problem page; the ICPC archive independently maps the same title/slug to Alberta 2016. This is now direct official Kattis source-list metadata, not statement verification. The problem and English statement endpoints returned 403/disabled fetch, so no statement text, I/O, examples, or constraints were inspected.
- Radio Commercials: existing Virtual Judge metadata identifies `commercials`, KTH Training 2011-01-26, and author Lukáš Poláček. Direct Kattis problem and KTH Training source-list retrieval returned 403; no original statement captured.
- Build Dependencies: existing Virtual Judge metadata identifies `builddeps`, NWERC 2015 Practice, and Jeroen Bransen. The official Kattis source-list and problem endpoints returned 403; the NWERC 2025 slide deck remains excluded as a different edition.
- Coloring Socks: the `color` slug/title association remains secondary-only; the submitted KTH Training source claim is not corroborated. Course references do not establish contest provenance; the unrelated KTH Challenge 2013 PDF remains excluded.
- Exact Change: `exactchange3` remains a distinct PACNW 2024 variant. The Waterloo 2008 Problem C statement is verified, but no authoritative mapping from candidate slug `exactchange2` to that statement was found.
- Cranes: the Waterloo 2008 Problem A statement is verified, but no authoritative Kattis `cranes` slug crosswalk was found. Absence from the consulted secondary archive index is not proof of invalidity.

Pass 20 reviewed 6 records, obtained 1 new direct official Kattis source-list metadata confirmation (Wood Cutting), captured 0 new original statements, approved 0 scenario-depth claims, and approved 0 imports. All 41 candidate records remain candidate-only and unchanged. No curriculum, learner progress, runtime, Supabase, or production data changed. PR remains draft; no merge or deployment.



### Unresolved statement and false-positive review pass 21
Added `data/scenario-catalogue/kattis-41-source-and-depth-review-pass-21.json`.

- Muddy Hike: located a full third-party statement copy carrying problem ID `maps17.mu`. It describes a four-direction grid path minimizing the maximum mud depth. This is useful statement-content evidence, but the host is not the contest organizer or an authoritative archive. The task is one minimax path optimization, provisionally not long-scenario material; MAPS 2017 primary provenance remains unverified.
- Grid: the ICPC archive maps `grid` to Southeast USA 2015 Division 1. The available Division 2 PDF describes a different digit-jump task and is explicitly excluded; the Division 1 statement remains missing.
- Busy Schedule: a DMOJ page with the same title was identified as a false match: it uses slug `sched` and describes a different graph/engagement problem. It is not evidence for Kattis `busyschedule` or Baylor problem 207.
- Interval Scheduling: only the prior Virtual Judge metadata remains; no primary statement captured.
- Walrus Weights: Popup 2015 metadata and third-party solution/discussion references remain; no original statement or constraints captured.

Pass 21 reviewed 5 records, captured 0 new primary statements, logged 1 third-party statement copy, excluded 1 false-positive title match, and approved 0 source identities, scenario-depth claims, or imports. All 41 candidate records remain unchanged and candidate-only. No curriculum, learner progress, runtime, Supabase, or production data changed.


### Targeted primary-source retrieval and exact crosswalk pass 22
Added `data/scenario-catalogue/kattis-41-source-and-depth-review-pass-22.json`.

- **Build Dependencies:** inspected the complete NWERC 2015 official main-contest statement packet. Its 11-problem index does not include Build Dependencies. This does not rule out a separate practice-session package, but the prior NWERC 2015 Practice label is not corroborated by the main-contest packet. No Build Dependencies statement captured; keep the source attribution unresolved.
- **Radio Commercials:** prior VJudge metadata remains secondary-only; no KTH Training 2011-01-26 original statement or authoritative source listing retrieved.
- **Coloring Socks:** slug/title support remains limited to third-party solution indexes; submitted KTH provenance remains unverified. The unrelated KTH Challenge 2013 packet remains excluded.
- **Grid:** the ICPC Kattis judge index explicitly maps Grid / `grid` to SEUSA 2015 Division 1. The archive marks the problem set partial (18 of 21 problems); the Division 1 statement is still missing. The different Division 2 PDF remains excluded.
- **Muddy Hike:** no official MAPS 2017 package or exact Kattis source crosswalk retrieved. The third-party statement copy is not upgraded to primary evidence.
- **Interval Scheduling, Walrus Weights, Busy Schedule:** no original statements or authoritative source exports retrieved. The DMOJ `sched` same-title result remains a false positive for Busy Schedule.
- **Cranes:** Waterloo 2008 Problem A remains an official statement match, but no authoritative Kattis `cranes` slug crosswalk found.
- **Exact Change:** Waterloo 2008 Problem C remains an official statement match, but the `exactchange2` crosswalk is unresolved. The archive explicitly maps distinct `exactchange3` to PACNW 2024; do not substitute it.

Pass 22 reviewed 10 records, inspected one official contest statement packet, added one archive source crosswalk for Grid, captured zero new original statements, approved zero scenario-depth claims, and approved zero imports. The NWERC packet creates a source-attribution discrepancy to resolve for Build Dependencies; it does not establish that a separate practice package never existed. All 41 candidates remain candidate-only and `importApproved: false`. No candidate records, curriculum, learner progress, runtime, Supabase, or production data changed. PR remains draft; no merge or deployment.


### Kattis metadata reconciliation and statement retrieval pass 23
Added `data/scenario-catalogue/kattis-41-source-and-depth-review-pass-23.json`.

- **Build Dependencies:** VJudge exposes Kattis metadata for exact slug `builddeps`, source Northwestern Europe Regional Contest (NWERC) 2015 Practice, author Jeroen Bransen, and an official/mainOfficial description flag. This corroborates the practice-source attribution at the metadata level. Correction to Pass 22 interpretation: the NWERC 2015 main-contest packet contains a separate 11-problem set; its omission of Build Dependencies does not contradict the separately labeled practice source. The original practice statement is still not captured.
- **Radio Commercials:** VJudge exposes Kattis metadata for `commercials`, KTH training 2011-01-26, author Lukáš Poláček, with official/mainOfficial description flags. This strengthens source metadata corroboration; the original KTH statement is still missing.
- **Interval Scheduling:** VJudge exposes Kattis metadata for `intervalscheduling`, Algorithm Design, ITU 2019, author Thore Husfeldt, with official/mainOfficial description flags. Original statement remains missing.
- **Walrus Weights:** VJudge exposes Kattis metadata for `walrusweights`, Popup 2015 Session 1, author Marc Vinyals, with official/mainOfficial description flags. Original statement remains missing; prior provisional not-long assessment is unchanged.
- **Coloring Socks:** a VJudge contest listing independently matches Kattis slug `color` to the title Coloring Socks. It does not establish source provenance or statement content.

Pass 23 reviewed 5 records, corroborated 4 source/author metadata sets through secondary renderings of Kattis fields, added 1 title/slug identity match, captured 0 original statements, approved 0 scenario-depth claims, and approved 0 imports. These metadata results are not original-statement verification. All 41 candidates remain candidate-only and `importApproved: false`; no candidate records, curriculum, learner progress, runtime, Supabase, or production data changed. PR remains draft; no merge or deployment.
