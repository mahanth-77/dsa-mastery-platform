# Long Scenario Collection — 178-Record Evidence Gate

**Audit date:** 2026-11-14  
**Repository branch:** `audit/long-scenario-178-evidence-gate`  
**Status:** Review specification; no production import  
**Scope:** The 178 original baseline records only. The seven replacement records are outside this 178-record review.

## Executive decision

The 178-record baseline is structurally reconciled, but it is **not independently certified as 178 verified long-scenario problems**. Keep it out of the production curriculum and out of any user-facing count described as verified long-scenario content until each record passes the admission gate below.

The prior qualification labels are historical audit outcomes, not current proof. In particular, the strict-triage package contains no preserved statement excerpt for any of these 178 baseline rows. A previously reported successful page-open check is not a substitute for retaining reproducible evidence.

## Reconciled baseline

- 178 rows in the original qualified baseline.
- 178 unique IDs.
- All 178 IDs are present in the reconciled final 185-record file.
- Title, platform, and original URL match between the baseline qualification data and final collection for all 178.
- All 178 original URLs use HTTPS.
- The 178 baseline rows have no preserved statement excerpt in the strict-triage file.
- All 178 have `import_approval = NO`.

These checks establish identity and structural consistency. They do **not** establish that each source currently resolves, that the page is the exact problem, or that the original statement genuinely qualifies as a long scenario.

## Strict triage of the 178 baseline rows

| Disposition | Count | Required action |
|---|---:|---|
| `SOURCE_UNVERIFIED_HOLD` | 64 | Obtain permitted, reproducible evidence from the official source or an authoritative mirror. A 403 is an access limitation, not proof that a URL is broken. |
| `EXCLUDE_FROM_LONG_SCENARIO_SET` | 58 | Keep out of the long-scenario collection. Do not delete from general DSA practice solely because of this category decision. |
| `REWRITE_SUMMARY_AND_REASSESS` | 51 | Correct the factual summary so it reflects the actual source statement, then reassess materiality. Rewriting a summary must never manufacture context absent from the source. |
| `MANUAL_STATEMENT_REVIEW` | 4 | Require a human reviewer to inspect the original statement and record a reasoned decision. |
| `SOURCE_MISMATCH_HOLD` | 1 | Correct the source mapping before any further review. The known example is **Merge k Sorted Lists**, whose linked HackerRank page is **Merge two sorted linked lists**. |
| **Total** | **178** | **No baseline row is approved for import.** |

The strict-triage result classifies 114 source pages as opened and 64 as blocked during that audit. The opened-page records were not thereby certified as long scenarios: the review classified the observed statements as short or moderate tasks. The 64 blocked records remain unverified; HTTP 403 must not be treated as a dead link.

## Admission model

Keep this catalogue separate from `dsa_pattern_mastery_tracker.json` and from learner progress. A scenario question is a different content type from a normal pattern-practice placement.

Recommended review lifecycle:

1. `DISCOVERED` — metadata captured; no source claim.
2. `SOURCE_VERIFIED` — official or authoritative source resolves and its title matches.
3. `STATEMENT_REVIEWED` — reviewer inspected the actual statement and recorded evidence notes.
4. `SCENARIO_QUALIFIED` — context is integral to the task, not decorative wording added by a summary.
5. `APPROVED_FOR_CATALOG` — all gates pass; eligible for the separate scenario catalogue.
6. `HOLD` — evidence or mapping is incomplete.
7. `REJECTED_FOR_SCENARIO` — source is valid but does not meet the scenario definition.

A record must not jump from a historical `QUALIFIED` label directly to `APPROVED_FOR_CATALOG`.

## Required record fields

Every staged record should retain:

- Stable scenario ID, exact original title, platform, canonical source URL.
- Original contest/assessment when known.
- Difficulty and algorithmic pattern metadata, clearly marked as editorial classification.
- Source retrieval date, HTTP outcome, final URL, observed page title, and reviewer identity.
- Evidence type and evidence location. Do not store full copyrighted statements or solutions.
- A concise factual summary that does not add context absent from the source.
- Separate decisions for source authenticity, scenario materiality, algorithmic relevance, free-to-read access, and import approval.
- Review status, disposition reason, and timestamps for every decision change.

## Long-scenario qualification rubric

Approve only when the original statement—not a rewritten description—supports all of the following:

1. **Authenticity:** The linked page is the exact problem on the claimed platform or an authoritative contest archive.
2. **Integral context:** The domain, entities, rules, or operational setting materially define the task. Removing the context would change the problem's meaning or model, not merely its wording.
3. **Substantive specification:** The statement defines meaningful interactions, constraints, state, resource allocation, scheduling, simulation, or another non-trivial domain model.
4. **Algorithmic substance:** The task requires a genuine algorithmic technique; a decorative story around a one-line arithmetic/string exercise does not qualify.
5. **Evidence:** A reviewer records the source title, canonical URL, access result, statement sections inspected, and a short rationale. An inaccessible page stays on hold unless authoritative evidence is available through a permitted route.

Keep scenario materiality independent from difficulty. A hard abstract graph problem is not automatically a long scenario; a moderate scheduling problem can qualify if its domain model is integral.

## Safety rails for VERTEX

- Do not append these 178 records to the existing 941 curriculum placements.
- Do not alter placement IDs, ordering, pattern/variation assignments, status defaults, or learner progress.
- Do not change dashboard totals or describe the 178 as verified.
- Do not copy complete problem statements or solutions into the repository. Preserve canonical links and limited factual review notes.
- Do not bypass access controls, paywalls, or anti-bot restrictions. Use official APIs or permitted authoritative sources where available.
- Import only from a reviewed, versioned scenario catalogue after a separate implementation and test review.

## Definition of done

The 178-record audit is complete only when every row has a recorded source decision and scenario decision, every mismatch is resolved, every hold has an explicit outcome, and the approved count is derived from rows in `APPROVED_FOR_CATALOG`—not from the historical target or an old spreadsheet total.

**Current decision: 178 structurally reconciled; 0 approved for import by the strict-triage audit.** The existing 21-pattern / 115-variation / 941-placement curriculum remains unchanged.
