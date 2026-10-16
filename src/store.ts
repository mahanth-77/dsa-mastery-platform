import type {
  CurriculumData,
  CurriculumPattern,
  UserProgress,
  ProblemProgress,
  ActivityEvent,
  StatusOption,
  UserSettings,
  StreakInfo,
  PatternStats,
  RevisionItem,
  Difficulty,
} from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dsa-mastery-progress';
const REVISION_INTERVALS = [1, 3, 7, 14, 30, 60]; // days

// ─── Default factories ───────────────────────────────────────────────────────

export function defaultProblemProgress(): ProblemProgress {
  return {
    status: 'not_started',
    attempts: 0,
    lastSolvedAt: null,
    nextRevisionAt: null,
    notes: '',
    approach: '',
    timeComplexity: '',
    spaceComplexity: '',
    confidence: 0,
    reviewHistory: [],
  };
}

export function defaultSettings(): UserSettings {
  return {
    dailyGoal: 5,
    theme: 'dark',
    compactView: false,
  };
}

export function defaultUserProgress(): UserProgress {
  return {
    version: 1,
    problems: {},
    activity: [],
    settings: defaultSettings(),
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Curriculum loader ───────────────────────────────────────────────────────

export function validateCurriculum(raw: unknown): CurriculumData {
  const data = raw as CurriculumData;
  if (!data || !Array.isArray(data.patterns)) {
    throw new Error('Invalid curriculum: missing patterns array');
  }
  // Ensure every pattern has an id
  data.patterns.forEach((p, pi) => {
    if (!p.id) {
      p.id = `pattern-${String(pi + 1).padStart(2, '0')}`;
    }
    if (!Array.isArray(p.variations)) {
      p.variations = [];
    }
    p.variations.forEach((v, vi) => {
      if (!v.id) {
        v.id = `${p.id}-variation-${String(vi + 1).padStart(2, '0')}`;
      }
      if (!Array.isArray(v.problems)) {
        v.problems = [];
      }
      v.problems.forEach((prob, probi) => {
        if (!prob.id) {
          prob.id = `${v.id}-problem-${String(probi + 1).padStart(2, '0')}`;
        }
        prob.status = prob.status || 'not_started';
        prob.attempts = prob.attempts || 0;
        prob.difficulty = prob.difficulty || 'Medium';
      });
    });
  });
  return data;
}

// ─── LocalStorage persistence ────────────────────────────────────────────────

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultUserProgress();
    const data = JSON.parse(raw) as UserProgress;
    // Ensure settings exist
    if (!data.settings) data.settings = defaultSettings();
    if (!data.activity) data.activity = [];
    if (!data.problems) data.problems = {};
    return data;
  } catch {
    return defaultUserProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  progress.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Progress accessors ─────────────────────────────────────────────────────

export function getProblemProgress(
  progress: UserProgress,
  problemId: string
): ProblemProgress {
  return progress.problems[problemId] || defaultProblemProgress();
}

export function getEffectiveStatus(
  progress: UserProgress,
  problemId: string
): StatusOption {
  const p = progress.problems[problemId];
  return p ? p.status : 'not_started';
}

export function updateProblemProgress(
  progress: UserProgress,
  problemId: string,
  update: Partial<ProblemProgress>,
  patternId: string
): UserProgress {
  const existing = getProblemProgress(progress, problemId);
  const newStatus = update.status || existing.status;
  const oldStatus = existing.status;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const merged: ProblemProgress = {
    ...existing,
    ...update,
  };

  // Auto-set solved date
  if (newStatus === 'solved' && oldStatus !== 'solved') {
    merged.lastSolvedAt = now.toISOString();
    merged.attempts = (existing.attempts || 0) + 1;
    // Schedule first revision in 1 day
    const nextRev = new Date(now);
    nextRev.setDate(nextRev.getDate() + 1);
    if (!merged.nextRevisionAt) {
      merged.nextRevisionAt = nextRev.toISOString().slice(0, 10);
    }
  }

  if (newStatus === 'attempted' && oldStatus === 'not_started') {
    merged.attempts = (existing.attempts || 0) + 1;
  }

  // Record activity only if status actually changed
  let newActivity = [...progress.activity];
  if (newStatus !== oldStatus) {
    // Prevent duplicate events for same problem on same day with same action
    const alreadyRecorded = newActivity.some(
      (a) =>
        a.date === todayStr &&
        a.problemId === problemId &&
        a.action === newStatus
    );
    if (!alreadyRecorded) {
      newActivity.push({
        date: todayStr,
        problemId,
        action: newStatus,
        patternId,
      });
    }
  }

  return {
    ...progress,
    problems: {
      ...progress.problems,
      [problemId]: merged,
    },
    activity: newActivity,
    lastUpdated: now.toISOString(),
  };
}

// ─── Revision scheduling ────────────────────────────────────────────────────

export function completeRevision(
  progress: UserProgress,
  problemId: string,
  confidence: number,
  patternId: string
): UserProgress {
  const existing = getProblemProgress(progress, problemId);
  const reviewCount = existing.reviewHistory.length;
  const intervalIndex = Math.min(reviewCount, REVISION_INTERVALS.length - 1);
  const daysUntilNext = REVISION_INTERVALS[intervalIndex];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + daysUntilNext);

  const updated: ProblemProgress = {
    ...existing,
    confidence,
    nextRevisionAt: nextDate.toISOString().slice(0, 10),
    lastSolvedAt: now.toISOString(),
    reviewHistory: [
      ...existing.reviewHistory,
      { date: todayStr, confidence },
    ],
  };

  // Record activity
  let newActivity = [...progress.activity];
  const alreadyRecorded = newActivity.some(
    (a) =>
      a.date === todayStr &&
      a.problemId === problemId &&
      a.action === 'solved'
  );
  if (!alreadyRecorded) {
    newActivity.push({
      date: todayStr,
      problemId,
      action: 'solved',
      patternId,
    });
  }

  return {
    ...progress,
    problems: {
      ...progress.problems,
      [problemId]: updated,
    },
    activity: newActivity,
    lastUpdated: now.toISOString(),
  };
}

export function getRevisionQueue(
  curriculum: CurriculumData,
  progress: UserProgress
): RevisionItem[] {
  const today = new Date().toISOString().slice(0, 10);
  const items: RevisionItem[] = [];

  for (const pattern of curriculum.patterns) {
    for (const variation of pattern.variations) {
      for (const problem of variation.problems) {
        const prog = getProblemProgress(progress, problem.id);
        if (prog.nextRevisionAt && prog.status === 'solved') {
          const daysOverdue = Math.floor(
            (new Date(today).getTime() - new Date(prog.nextRevisionAt).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          items.push({
            problem,
            variationName: variation.name,
            patternName: pattern.name,
            patternId: pattern.id,
            progress: prog,
            daysOverdue,
          });
        }
      }
    }
  }

  return items.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// ─── Stats calculators ──────────────────────────────────────────────────────

export function getPatternStats(
  pattern: CurriculumPattern,
  progress: UserProgress
): PatternStats {
  const stats: PatternStats = {
    total: 0, solved: 0, attempted: 0, revisit: 0, notStarted: 0,
    easy: 0, medium: 0, hard: 0,
    easySolved: 0, mediumSolved: 0, hardSolved: 0,
  };

  for (const v of pattern.variations) {
    for (const p of v.problems) {
      stats.total++;
      const status = getEffectiveStatus(progress, p.id);
      if (status === 'solved') stats.solved++;
      else if (status === 'attempted') stats.attempted++;
      else if (status === 'revisit') stats.revisit++;
      else stats.notStarted++;

      if (p.difficulty === 'Easy') {
        stats.easy++;
        if (status === 'solved') stats.easySolved++;
      } else if (p.difficulty === 'Medium') {
        stats.medium++;
        if (status === 'solved') stats.mediumSolved++;
      } else {
        stats.hard++;
        if (status === 'solved') stats.hardSolved++;
      }
    }
  }

  return stats;
}

export function getGlobalStats(
  curriculum: CurriculumData,
  progress: UserProgress
): PatternStats {
  const stats: PatternStats = {
    total: 0, solved: 0, attempted: 0, revisit: 0, notStarted: 0,
    easy: 0, medium: 0, hard: 0,
    easySolved: 0, mediumSolved: 0, hardSolved: 0,
  };

  for (const pat of curriculum.patterns) {
    const ps = getPatternStats(pat, progress);
    stats.total += ps.total;
    stats.solved += ps.solved;
    stats.attempted += ps.attempted;
    stats.revisit += ps.revisit;
    stats.notStarted += ps.notStarted;
    stats.easy += ps.easy;
    stats.medium += ps.medium;
    stats.hard += ps.hard;
    stats.easySolved += ps.easySolved;
    stats.mediumSolved += ps.mediumSolved;
    stats.hardSolved += ps.hardSolved;
  }

  return stats;
}

export function getStreak(progress: UserProgress): StreakInfo {
  if (progress.activity.length === 0) {
    return { current: 0, best: 0, lastActiveDate: null };
  }

  const uniqueDays = [...new Set(progress.activity.map((a) => a.date))].sort();
  if (uniqueDays.length === 0) {
    return { current: 0, best: 0, lastActiveDate: null };
  }

  const lastDay = uniqueDays[uniqueDays.length - 1];
  const today = new Date().toISOString().slice(0, 10);

  // Calculate best streak
  let best = 1;
  let currentRun = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      currentRun++;
      best = Math.max(best, currentRun);
    } else {
      currentRun = 1;
    }
  }

  // Calculate current streak (must include today or yesterday)
  let current = 0;
  if (lastDay === today) {
    current = 1;
    for (let i = uniqueDays.length - 2; i >= 0; i--) {
      const curr = new Date(uniqueDays[i + 1]);
      const prev = new Date(uniqueDays[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) current++;
      else break;
    }
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    if (lastDay === yStr) {
      current = 1;
      for (let i = uniqueDays.length - 2; i >= 0; i--) {
        const curr = new Date(uniqueDays[i + 1]);
        const prev = new Date(uniqueDays[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) current++;
        else break;
      }
    }
  }

  return { current, best: Math.max(best, current), lastActiveDate: lastDay };
}

export function getTodayActivity(progress: UserProgress): ActivityEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return progress.activity.filter((a) => a.date === today);
}

export function getWeekActivity(progress: UserProgress): ActivityEvent[] {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  return progress.activity.filter((a) => a.date >= weekAgoStr);
}

// Activity for last N days grouped by date
export function getActivityByDate(
  progress: UserProgress,
  days: number = 90
): Record<string, number> {
  const result: Record<string, number> = {};
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().slice(0, 10);

  for (const a of progress.activity) {
    if (a.date >= startStr) {
      result[a.date] = (result[a.date] || 0) + 1;
    }
  }
  return result;
}

// Get weak patterns (lowest solve percentage)
export function getWeakPatterns(
  curriculum: CurriculumData,
  progress: UserProgress,
  limit: number = 5
): { pattern: CurriculumPattern; stats: PatternStats }[] {
  return curriculum.patterns
    .map((p) => ({ pattern: p, stats: getPatternStats(p, progress) }))
    .filter((x) => x.stats.total > 0)
    .sort((a, b) => {
      const aRatio = a.stats.solved / a.stats.total;
      const bRatio = b.stats.solved / b.stats.total;
      return aRatio - bRatio;
    })
    .slice(0, limit);
}

// Get next problems to study (not started or attempted, priority by pattern progress)
export function getNextProblems(
  curriculum: CurriculumData,
  progress: UserProgress,
  limit: number = 5
): { problem: CurriculumData['patterns'][0]['variations'][0]['problems'][0]; patternName: string; variationName: string; patternId: string }[] {
  const result: { problem: CurriculumData['patterns'][0]['variations'][0]['problems'][0]; patternName: string; variationName: string; patternId: string }[] = [];

  for (const pattern of curriculum.patterns) {
    for (const variation of pattern.variations) {
      for (const problem of variation.problems) {
        const status = getEffectiveStatus(progress, problem.id);
        if (status === 'not_started' || status === 'attempted') {
          result.push({
            problem,
            patternName: pattern.name,
            variationName: variation.name,
            patternId: pattern.id,
          });
        }
        if (result.length >= limit) return result;
      }
    }
  }

  return result;
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export function exportProgress(progress: UserProgress): string {
  return JSON.stringify(progress, null, 2);
}

export function importProgress(jsonStr: string): UserProgress {
  const data = JSON.parse(jsonStr);
  if (!data.problems || typeof data.problems !== 'object') {
    throw new Error('Invalid progress data: missing problems object');
  }
  if (!data.activity || !Array.isArray(data.activity)) {
    data.activity = [];
  }
  if (!data.settings) {
    data.settings = defaultSettings();
  }
  return data as UserProgress;
}

// ─── Difficulty color helpers ────────────────────────────────────────────────

export function difficultyColor(d: Difficulty): string {
  switch (d) {
    case 'Easy': return 'text-success';
    case 'Medium': return 'text-warning';
    case 'Hard': return 'text-danger';
    default: return 'text-text-secondary';
  }
}

export function difficultyBg(d: Difficulty): string {
  switch (d) {
    case 'Easy': return 'bg-success-muted text-success border-success-border';
    case 'Medium': return 'bg-warning-muted text-warning border-warning-border';
    case 'Hard': return 'bg-danger-muted text-danger border-danger-border';
    default: return 'bg-surface-2 text-text-tertiary border-border';
  }
}

export function statusColor(s: StatusOption): string {
  switch (s) {
    case 'solved': return 'text-success';
    case 'attempted': return 'text-warning';
    case 'revisit': return 'text-info';
    case 'not_started': return 'text-text-quaternary';
    default: return 'text-text-quaternary';
  }
}

export function statusLabel(s: StatusOption): string {
  switch (s) {
    case 'solved': return 'Solved';
    case 'attempted': return 'Attempted';
    case 'revisit': return 'Needs Revision';
    case 'not_started': return 'Not Started';
    default: return s;
  }
}
