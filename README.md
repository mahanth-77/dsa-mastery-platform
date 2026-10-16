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
- **Key Metrics**: Real-time counter of total problems solved vs 575 problems across all 21 pattern families.
- **Consecutive Streak**: Authentic streak counter and personal best tracking calculated strictly from timestamped user actions.
- **Today & Week Activity**: Dynamic tracking against daily target goals.
- **Continue Learning**: Direct recommendation engine pointing to the next unstarted or in-progress problem.
- **Spaced Revision Queue**: Highlights overdue reviews and items scheduled for today.
- **Patterns Needing Attention**: Real-time identification of lowest-completion pattern families.

### 2. Pattern Explorer (`/patterns`)
- **Comprehensive Catalog**: Displays all 21 patterns, 115 variations, and 575 problems without omission.
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
- **Recall Grading**: Quick buttons (`Hard (+1d)`, `Good (+3d)`, `Easy (+7d)`) to reinforce weak memory nodes.
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
- **Curriculum Metadata**: Read-only dataset verification (21 patterns, 115 variations, 575 problems).
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
