// ─── Curriculum types (mirrors the JSON schema) ───────────────────────────────

export type StatusOption = 'not_started' | 'attempted' | 'solved' | 'revisit';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface CurriculumProblem {
  id: string;
  title: string;
  url: string;
  difficulty: Difficulty;
  status: StatusOption;
  attempts: number;
  lastSolvedAt: string | null;
  nextRevisionAt: string | null;
}

export interface CurriculumVariation {
  id: string;
  name: string;
  problems: CurriculumProblem[];
}

export interface CurriculumPattern {
  id: string;
  name: string;
  variations: CurriculumVariation[];
}

export interface CurriculumData {
  title: string;
  version: number;
  createdAt: string;
  language: string;
  statusOptions: string[];
  difficultyOptions: string[];
  notes: string[];
  patterns: CurriculumPattern[];
}

// ─── User progress types (separate from curriculum) ──────────────────────────

export interface ReviewEvent {
  date: string;
  confidence: number;
}

export interface ProblemProgress {
  status: StatusOption;
  attempts: number;
  lastSolvedAt: string | null;
  nextRevisionAt: string | null;
  notes: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  confidence: number; // 1-5
  reviewHistory: ReviewEvent[];
  /** Timestamp of the last edit to this placement, used for cross-device merging. */
  updatedAt?: string;
}

export interface ActivityEvent {
  date: string;      // ISO date string YYYY-MM-DD
  problemId: string;
  action: StatusOption;
  patternId: string;
}

export interface UserSettings {
  dailyGoal: number;
  theme: 'dark' | 'light';
  compactView: boolean;
  updatedAt?: string;
}

export interface UserProgress {
  version: number;
  problems: Record<string, ProblemProgress>;
  activity: ActivityEvent[];
  settings: UserSettings;
  lastUpdated: string;
}

// ─── Computed / derived types ─────────────────────────────────────────────────

export interface PatternStats {
  total: number;
  solved: number;
  attempted: number;
  revisit: number;
  notStarted: number;
  easy: number;
  medium: number;
  hard: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export interface StreakInfo {
  current: number;
  best: number;
  lastActiveDate: string | null;
}

export interface RevisionItem {
  problem: CurriculumProblem;
  variationName: string;
  patternName: string;
  patternId: string;
  progress: ProblemProgress;
  daysOverdue: number;
}
