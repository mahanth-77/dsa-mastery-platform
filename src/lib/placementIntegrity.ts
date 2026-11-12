import type { CurriculumData, CurriculumProblem } from '../types';

export interface PlacementRow {
  patternId: string;
  variationId: string;
  index: number;
  problem: CurriculumProblem;
}

export function collectPlacements(curriculum: CurriculumData): PlacementRow[] {
  const rows: PlacementRow[] = [];
  curriculum.patterns.forEach((pattern) => {
    pattern.variations.forEach((variation) => {
      variation.problems.forEach((problem, index) => {
        rows.push({ patternId: pattern.id, variationId: variation.id, index, problem });
      });
    });
  });
  return rows;
}

function neutralDefault(problem: CurriculumProblem): boolean {
  return problem.status === 'not_started'
    && problem.attempts === 0
    && problem.lastSolvedAt === null
    && problem.nextRevisionAt === null;
}

/**
 * Compare a proposed tracker with the frozen baseline.
 * Returns human-readable errors. Hashes are not used.
 * Original problem objects must match under JSON serialization.
 */
export function compareStagedToBaseline(baseline: CurriculumData, staged: CurriculumData): string[] {
  const errors: string[] = [];
  const baseRows = collectPlacements(baseline);
  const stagedRows = collectPlacements(staged);
  const stagedById = new Map<string, PlacementRow>();
  stagedRows.forEach((row) => {
    if (!row.problem.id) {
      errors.push('missing placement id');
      return;
    }
    if (stagedById.has(row.problem.id)) errors.push('duplicate placement id ' + row.problem.id);
    stagedById.set(row.problem.id, row);
  });

  const baseByVariation = new Map<string, PlacementRow[]>();
  baseRows.forEach((row) => {
    const list = baseByVariation.get(row.variationId) || [];
    list.push(row);
    baseByVariation.set(row.variationId, list);
  });
  const stagedByVariation = new Map<string, PlacementRow[]>();
  stagedRows.forEach((row) => {
    const list = stagedByVariation.get(row.variationId) || [];
    list.push(row);
    stagedByVariation.set(row.variationId, list);
  });

  const baseIds = new Set<string>();
  baseRows.forEach((row) => {
    baseIds.add(row.problem.id);
    const next = stagedById.get(row.problem.id);
    if (!next) {
      errors.push('missing original placement ' + row.problem.id);
      return;
    }
    if (JSON.stringify(row.problem) !== JSON.stringify(next.problem)) {
      errors.push('modified original placement ' + row.problem.id);
    }
    if (next.patternId !== row.patternId) errors.push('changed pattern assignment ' + row.problem.id);
    if (next.variationId !== row.variationId) errors.push('changed variation assignment ' + row.problem.id);
  });

  baseByVariation.forEach((rows, variationId) => {
    const prefix = (stagedByVariation.get(variationId) || []).slice(0, rows.length).map((row) => row.problem.id);
    if (prefix.join('|') !== rows.map((row) => row.problem.id).join('|')) {
      errors.push('baseline order changed ' + variationId);
    }
  });

  stagedRows.forEach((row) => {
    if (baseIds.has(row.problem.id)) return;
    if (!neutralDefault(row.problem)) errors.push('invalid new placement default ' + row.problem.id);
  });

  return errors;
}
