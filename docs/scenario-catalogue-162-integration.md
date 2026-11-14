# VERTEX Long-Scenario Catalogue — 162-Problem Integration & Evidence Audit

**Status:** Implemented on integration branch `vertex/integrate-kattis-41-user-approved`. Isolated from production branches, staging migrations, and the core curriculum tracker. Not merged or deployed.

---

## 1. Executive Summary & Objective

In accordance with the VERTEX Research Phase 3 integration and audit requirements, the separate **Long-Scenario Catalogue** has been established with the complete target collection of **162 unique problems**:
- **114 Historical Verified Problems:** Originating from Phase 3.2 (73 CSES, 21 Codeforces, 18 HackerRank, 2 AtCoder).
- **7 Certified Replacement Problems:** Adjudicated in Phase 3.3.1.2 (`SCENARIO-REP-01`, `02`, `04`, `05`, `09`, `19` on Kattis, and `SCENARIO-REP-22` on CSES).
- **41 User-Accepted Kattis Records:** Maintained with full audit transparency and distinct evidence gating.

All 162 problems are housed exclusively within `data/scenario-catalogue/scenario-catalogue.json` and presented through the dedicated `/scenarios` route.

---

## 2. Invariants & Scope Boundaries Strictly Maintained

1. **Core Curriculum Untouched:**
   - `dsa_pattern_mastery_tracker.json` is completely unchanged.
   - Core pattern count remains exactly **21 patterns**.
   - Variation count remains exactly **115 variations**.
   - Curriculum placement count remains exactly **941 placements**.
   - `importApproved: false` is strictly enforced across all 162 catalogue records (0 curriculum imports).
2. **Learner Progress & Persistence Unaltered:**
   - No modifications to user progress, revision queue scheduling, mastery calculations, or analytics.
   - No modifications to Supabase database schema, migrations, or production settings.
3. **Honest Evidence Stratification (No Blanket Assumptions):**
   - Historical records are not treated as having verified statement captures simply because a previous audit flagged them `STATEMENT_GENUINELY_INSPECTED`.
   - Records are honestly partitioned into three distinct evidentiary tiers based on actual data persisted on disk.

---

## 3. Data Breakdown & Evidence Stratification

### Platform Distribution (162 Total)
| Platform | Count | Origin / Notes |
| :--- | :---: | :--- |
| **CSES** | 74 | 73 historical certified + 1 certified replacement (`SCENARIO-REP-22` Apartments) |
| **Kattis** | 47 | 41 user-accepted candidates + 6 certified replacements (`SCENARIO-REP-01`, `02`, `04`, `05`, `09`, `19`) |
| **Codeforces** | 21 | 21 historical certified |
| **HackerRank** | 18 | 18 historical certified |
| **AtCoder** | 2 | 2 historical certified |
| **Total** | **162** | **100% Reconciled** |

### Evidence Gate Stratification (Corrected Audit Reality)
| Evidence Tier | Count | Persistent Artifact Status | Description |
| :--- | :---: | :--- | :--- |
| `statement_captured` | **7** | Full verbatim excerpts, input/output/constraint specs in `phase_3_3_1_audit/replacement_22_statement_audit.json` | 7 certified replacements genuinely inspected during Phase 3.3.1 with verbatim statement excerpts and discrepancy notes. |
| `metadata_verified` | **114** | Canonical URL, host platform identity, contest origin, and editorial domain summary verified | 114 historical non-Kattis records whose problem URLs and identities are 100% authentic, but whose verbatim raw statement bodies have not yet been extracted to local disk archives. |
| `pending` | **41** | Retained as user-accepted candidates with source statement extraction pending | 41 Kattis problems approved by the user for inclusion, with independent statement-level extraction remaining pending. |
| **Total** | **162** | | |

### Scenario Depth Distribution
| Depth Classification | Count | Semantics |
| :--- | :---: | :--- |
| `STRONG` | 139 | Multi-phase state tracking, deep narrative context integral to algorithmic solution. |
| `MODERATE` | 23 | Substantial domain context with direct algorithmic pattern mapping. |
| **Total** | **162** | |

### Uniqueness Verification
- **Unique IDs:** 162 / 162 (0 collisions)
- **Unique URLs:** 162 / 162 (0 collisions)
- **Unique Titles:** 162 / 162 (0 collisions)

---

## 4. UI Architecture & Features

The `ScenarioCatalogue` view (`src/pages/ScenarioCatalogue.tsx`) delivers:
1. **Interactive Multi-Facet Filtering:**
   - **Search:** Instant matching across title, unique ID, primary pattern, secondary patterns, platform, and contest source.
   - **Platform Filter:** Dropdown filtering by platform with dynamic counts (CSES: 74, Kattis: 47, Codeforces: 21, HackerRank: 18, AtCoder: 2).
   - **Pattern Filter:** Dropdown of all distinct DSA algorithmic patterns across the 162 scenarios.
   - **Evidence Filter:** Toggle across all 3 evidence tiers:
     - All evidence states (162)
     - Statement Captured (7)
     - Metadata & URL Verified (114)
     - User-Accepted · Evidence Pending (41)
   - **Depth Filter:** Filter by Strong (139) or Moderate (23) scenario depth.
   - **Reset Control:** One-click filter reset returning to the full 162-record view.
2. **Distinct Evidence Badging:**
   - Emerald badge (`CheckCircle2`) for `statement_captured` (7 replacements with verbatim statement quotes).
   - Blue badge (`BookOpen`) for `metadata_verified` (114 historical records with verified canonical metadata).
   - Amber badge (`ShieldAlert`) for `pending` (41 user-accepted additions).
3. **Problem Context & Direct Navigation:**
   - Factual scenario summary or verbatim statement quote.
   - Original contest/assessment source attribution.
   - Direct external link to the authentic problem statement on the respective host platform (`Open on CSES`, `Open on Kattis`, etc.).

---

## 5. Automated Validation & Verification Evidence

1. **TypeScript Typecheck (`tsc -b`):** Passed with 0 errors.
2. **Production Bundle Build (`vite build`):** Succeeded with 0 errors.
3. **Automated Vitest Suite (`npm test`):**
   - `src/scenario-catalogue.test.ts` (9 tests) — **PASSED**
   - `src/store.account-import.test.ts` (6 tests) — **PASSED**
   - `src/lib/learningSignals.test.ts` (8 tests) — **PASSED**
   - `src/services/cloudProgressSyncService.test.ts` (4 tests) — **PASSED**
   - Total: **4 test files passed, 27 tests passed**.
4. **Integration Validation Script (`validate_step6_integration.js`):**
   - JSON parsing: Valid
   - Unique IDs: 162 / 162
   - Unique URLs: 162 / 162
   - Unique Titles: 162 / 162
   - URL protocols: 100% valid HTTP/HTTPS
   - Core curriculum invariants: 21 patterns, 115 variations, 941 placements strictly intact.
