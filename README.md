# DSA Pattern Mastery Tracker

A production-grade, dark-first web application designed for mastering Data Structures & Algorithms (DSA) patterns through deliberate practice, pattern intuition capture, and spaced-repetition revision.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Build for Production
```bash
npm run build
npm run preview
```

---

## 📦 What Was Built

### 1. Dashboard (`/`)
- **Key Metrics**: Real-time counter of total problems solved vs 941 placements across all 21 pattern families.
- **Consecutive Streak**: Authentic streak counter and personal best tracking calculated strictly from timestamped user actions.
- **Today & Week Activity**: Dynamic tracking against daily target goals.
- **Continue Learning**: Direct recommendation engine pointing to the next unstarted or in-progress problem.
- **Spaced Revision Queue**: Highlights overdue reviews and items scheduled for today.
- **Patterns Needing Attention**: Real-time identification of lowest-completion pattern families.

### 2. Pattern Explorer (`/patterns`)
- **Comprehensive Catalog**: Displays all 21 patterns, 115 variations, and 941 placements without omission.
- **Live Search**: Instant multi-level search across pattern family name, inner variation, and problem title.
- **Multi-criteria Filtering**: Filter by difficulty (`Easy`, `Medium`, `Hard`) and status (`Solved`, `Attempted`, `Needs Revision`, `Not Started`).
- **Pattern Selector & Sorter**: Filter by specific pattern family, sort by completion percentage, problem count, or alphabetical.
- **Compact vs Comfortable Views**: Toggle between high-density list and expansive cards.

### 3. Pattern Detail View (`/patterns/:patternId`)
- **Hierarchy Clarity**: Explains `Main Pattern Family` → `Inner Variations` → `Curated LeetCode Problems`.
- **Sequential Navigation**: Jump seamlessly between previous/next patterns and problems.
- **Quick Status Control**: Update status (`Not Started`, `Attempted`, `Solved`, `Needs Revision`) inline or via the focused workspace.
- **Direct Problem Links**: Canonical problem URLs opening safely in new tabs (`rel="noopener noreferrer"`).

### 4. Problem Workspace Modal
- **Focused Study Canvas**: Dedicated interface to study a problem without distractions.
- **Mastery Notes & Intuition**: Capture algorithmic takeaways, edge cases, and pattern recognition triggers.
- **Complexity Analysis**: Dedicated fields for Big-O Time (`O(n)`) and Space (`O(1)`).
- **Mastery Rating**: 1 to 5-star confidence scoring.
- **Spaced Repetition Scheduler**: Presets for `+1 Day`, `+3 Days`, `+1 Week`, `+2 Weeks`, `+1 Month` or custom date selection.

### 5. Revision Center (`/revisions`)
- **Spaced-Repetition System**: Automated recall queue categorized into **Overdue**, **Due Today**, and **Upcoming**.
- **Recall Grading**: Review buttons record confidence. The next date follows the review count: 1, 3, 7, 14, 30, then 60 days.
- **Review History**: Persistent audit trail of all past review sessions.

### 6. Analytics & Insights (`/analytics`)
- **Honest Analytics**: Zero fabricated data—clean empty-state indicators for new users until authentic study sessions are logged.
- **60-Day Activity Heatmap**: GitHub-style activity grid plotting real study events.
- **Difficulty Breakdown Chart**: Recharts bar chart contrasting Total vs Solved by Easy, Medium, and Hard.
- **Pattern Leaderboard**: Real-time progress bars ranking pattern completion across all 21 families.

### 7. Settings & Data Portability (`/settings`)
- **Daily Target**: Configurable problem goals (e.g. 5 problems/day).
- **Full Data Export**: Download backup JSON containing all notes, complexity specs, review history, and timestamps.
- **Safe Import**: Schema-validated import with error handling to restore progress across machines.
- **Curriculum Metadata**: Read-only dataset verification (21 patterns, 115 variations, 941 placements).
- **Destructive Action Protection**: Reset progress with explicit confirmation step (leaves curriculum JSON untouched).

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React 18 + Vite + TypeScript (Strict mode)
- **Styling**: Tailwind CSS with custom dark-first design system tokens (`surface-0` through `surface-5`, `accent`, `border`, `text-primary`)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State & Storage**: React Context + Reducer with resilient `localStorage` sync
- **Separation of Concerns**:
  - `src/types.ts`: TypeScript contracts for curriculum and user progress models
  - `src/store.ts`: Pure functional storage engine, revision interval calculation, streak logic, and stats aggregation
  - `src/context.tsx`: Reactive state provider
  - `src/components/`: Reusable modular components (`Layout`, `ProblemWorkspaceModal`)
  - `src/pages/`: Isolated route pages


---

## ☁️ Account Cloud Sync

Authenticated progress can be synchronized across browsers and devices through Supabase. Guest progress remains local to the current browser.

### Configure the hosted backend

1. Use the VERTEX Supabase project.
2. Apply both SQL migrations in `supabase/migrations/` in timestamp order. The first creates the snapshot table and version-checked RPC; the second tightens table privileges for least-privilege access.
3. Copy `.env.example` to `.env.local`.
4. Set `VITE_SUPABASE_URL` to the hosted project URL and `VITE_SUPABASE_ANON_KEY` to its public publishable key.
5. Configure the same environment variables in your deployment provider and redeploy the frontend.

Never expose a Supabase `service_role` or secret key in frontend environment variables.

### Synchronization behavior

- Each authenticated account has a private cloud snapshot protected by PostgreSQL Row Level Security.
- Snapshot writes use an atomic expected-version check. Concurrent writes trigger a bounded merge/retry rather than blind overwrite.
- Placement records merge using per-placement edit timestamps; activity events are deduplicated.
- Failed cloud requests leave account progress in browser storage and are retried when the browser reconnects, on the next edit, or after reload.
- Guest progress is not uploaded automatically. Use the explicit import flow after signing in if you want to move guest work into an account.

The sync layer is versioned and conflict-aware, but it is not a substitute for regular JSON backups. Keep exports for important work.
