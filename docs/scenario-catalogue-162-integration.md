# VERTEX Long-Scenario Catalogue — 162-Problem Integration

**Status:** Implemented on integration branch `vertex/integrate-kattis-41-user-approved`. Isolated from production branches, staging migrations, and the core curriculum tracker. Not merged or deployed.

---

## 1. Executive Summary & Objective

In accordance with the VERTEX Research Phase 3 integration requirements, the separate **Long-Scenario Catalogue** has been expanded from the initial 41 Kattis user-accepted records to the full target collection of **162 unique problems**:
- **114 Historical Verified Problems:** Independently verified in Phase 3.2 (73 CSES, 21 Codeforces, 18 HackerRank, 2 AtCoder).
- **7 Certified Replacement Problems:** Adjudicated and certified in Phase 3.3.1.2 (`SCENARIO-REP-01`, `02`, `04`, `05`, `09`, `19` on Kattis, and `SCENARIO-REP-22` on CSES).
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
3. **Evidence Distinction Integrity:**
   - The 121 historical/replacement problems are labeled `historical_certified` / `verified` (`STATEMENT_GENUINELY_INSPECTED`).
   - The 41 Kattis problems are explicitly designated `user_accepted` / `pending` (`historical_assertion`), preserving source and depth audit caveats without artificial promotion.

---

## 3. Data Breakdown & Reconciliation

### Platform Distribution (162 Total)
| Platform | Count | Origin / Notes |
| :--- | :---: | :--- |
| **CSES** | 74 | 73 historical certified + 1 certified replacement (`SCENARIO-REP-22` Apartments) |
| **Kattis** | 47 | 41 user-accepted candidates + 6 certified replacements (`SCENARIO-REP-01`, `02`, `04`, `05`, `09`, `19`) |
| **Codeforces** | 21 | 21 historical certified |
| **HackerRank** | 18 | 18 historical certified |
| **AtCoder** | 2 | 2 historical certified |
| **Total** | **162** | **100% Reconciled** |

### Evidence Gate Distribution
| Evidence Status | Count | Semantics |
| :--- | :---: | :--- |
| `verified` | 121 | Live statement opened and inspected, formal constraints verified, rich domain scenario confirmed. |
| `pending` | 41 | User-accepted collection; retains original candidate audit status and review notes. |
| **Total** | **162** | |

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
   - **Evidence Filter:** Toggle between all states, Independently Verified (121), and User-Accepted / Pending (41).
   - **Depth Filter:** Filter by Strong (139) or Moderate (23) scenario depth.
   - **Reset Control:** One-click filter reset returning to the full 162-record view.
2. **Clear Evidence Indicators:**
   - Emerald badge with `CheckCircle2` for independently verified historical records.
   - Amber badge with `ShieldAlert` for user-accepted Kattis entries.
   - Distinct tags for Platform, ID, Difficulty, and Scenario Depth.
3. **Problem Context & Direct Navigation:**
   - Factual scenario summary or rationale excerpt.
   - Original contest/assessment source attribution.
   - Direct external link to the authentic problem statement on the respective host platform (`Open on CSES`, `Open on Kattis`, etc.).

---

## 5. Automated Validation & Verification Evidence

1. **TypeScript Typecheck (`tsc -b`):** Passed with 0 errors.
2. **Production Bundle Build (`vite build`):** Succeeded in 58.13s (dist chunk: `ScenarioCatalogue-B03lqN4t.js`).
3. **Automated Vitest Suite (`npm test`):**
   - `src/scenario-catalogue.test.ts` (8 tests) — **PASSED**
   - `src/store.account-import.test.ts` (6 tests) — **PASSED**
   - `src/lib/learningSignals.test.ts` (8 tests) — **PASSED**
   - `src/services/cloudProgressSyncService.test.ts` (4 tests) — **PASSED**
   - Total: **4 test files passed, 26 tests passed**.
4. **Integration Validation Script (`validate_step6_integration.js`):**
   - JSON parsing: Valid
   - Unique IDs: 162 / 162
   - Unique URLs: 162 / 162
   - Unique Titles: 162 / 162
   - URL protocols: 100% valid HTTP/HTTPS
   - Core curriculum invariants: 21 patterns, 115 variations, 941 placements strictly intact.
