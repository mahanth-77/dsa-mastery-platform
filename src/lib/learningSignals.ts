import type { CurriculumData, ProblemProgress, UserProgress } from '../types';
import { getProblemProgress } from '../store';

export interface PlacementLearning {
  placementId: string;
  patternId: string;
  patternName: string;
  variationId: string;
  variationName: string;
  title: string;
  difficulty: string;
  progress: ProblemProgress;
}

export interface LearningSummary {
  placements: number;
  solved: number;
  attempted: number;
  revisit: number;
  notStarted: number;
  revised: number;
  demonstratedRecall: number;
}

export interface WeakVariation {
  variationId: string;
  variationName: string;
  patternName: string;
  touched: number;
  revisit: number;
  unsolvedAttempts: number;
  lowConfidenceSolved: number;
}

export function isRevised(progress: ProblemProgress): boolean {
  return progress.reviewHistory.length > 0;
}

/** A solved mark is not mastery. Recall requires a completed review and confidence of at least 4. */
export function hasDemonstratedRecall(progress: ProblemProgress): boolean {
  return progress.status === 'solved' && progress.confidence >= 4 && progress.reviewHistory.length > 0;
}

export function summarizeLearning(curriculum: CurriculumData, progress: UserProgress): LearningSummary {
  const summary: LearningSummary = {
    placements: 0,
    solved: 0,
    attempted: 0,
    revisit: 0,
    notStarted: 0,
    revised: 0,
    demonstratedRecall: 0,
  };
  for (const pattern of curriculum.patterns) {
    for (const variation of pattern.variations) {
      for (const problem of variation.problems) {
        summary.placements += 1;
        const row = getProblemProgress(progress, problem.id);
        if (row.status === 'solved') summary.solved += 1;
        else if (row.status === 'attempted') summary.attempted += 1;
        else if (row.status === 'revisit') summary.revisit += 1;
        else summary.notStarted += 1;
        if (isRevised(row)) summary.revised += 1;
        if (hasDemonstratedRecall(row)) summary.demonstratedRecall += 1;
      }
    }
  }
  return summary;
}

export function listPlacements(curriculum: CurriculumData, progress: UserProgress): PlacementLearning[] {
  const rows: PlacementLearning[] = [];
  for (const pattern of curriculum.patterns) {
    for (const variation of pattern.variations) {
      for (const problem of variation.problems) {
        rows.push({
          placementId: problem.id,
          patternId: pattern.id,
          patternName: pattern.name,
          variationId: variation.id,
          variationName: variation.name,
          title: problem.title,
          difficulty: problem.difficulty,
          progress: getProblemProgress(progress, problem.id),
        });
      }
    }
  }
  return rows;
}

export function struggledPlacements(curriculum: CurriculumData, progress: UserProgress): PlacementLearning[] {
  return listPlacements(curriculum, progress).filter((row) => {
    const item = row.progress;
    return item.status === 'revisit' || (item.status === 'attempted' && item.attempts >= 2);
  });
}

export function weakVariations(curriculum: CurriculumData, progress: UserProgress): WeakVariation[] {
  const groups = new Map<string, WeakVariation>();
  for (const row of listPlacements(curriculum, progress)) {
    const item = row.progress;
    const touched = item.status !== 'not_started';
    if (!touched) continue;
    const current = groups.get(row.variationId) || {
      variationId: row.variationId,
      variationName: row.variationName,
      patternName: row.patternName,
      touched: 0,
      revisit: 0,
      unsolvedAttempts: 0,
      lowConfidenceSolved: 0,
    };
    current.touched += 1;
    if (item.status === 'revisit') current.revisit += 1;
    if (item.status !== 'solved' && item.attempts >= 2) current.unsolvedAttempts += 1;
    if (item.status === 'solved' && item.confidence > 0 && item.confidence < 3) current.lowConfidenceSolved += 1;
    groups.set(row.variationId, current);
  }
  return [...groups.values()]
    .filter((row) => row.revisit + row.unsolvedAttempts + row.lowConfidenceSolved > 0)
    .sort((a, b) => (b.revisit + b.unsolvedAttempts + b.lowConfidenceSolved) - (a.revisit + a.unsolvedAttempts + a.lowConfidenceSolved));
}
