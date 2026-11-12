import type { CurriculumData } from '../types';

export interface VariationProblemCount {
  variationId: string;
  count: number;
}

export interface CurriculumStats {
  patternCount: number;
  variationCount: number;
  placementCount: number;
  uniqueCanonicalProblemCount: number;
  problemsPerVariation: VariationProblemCount[];
}

export function canonicalProblemKey(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

export function getCurriculumStats(curriculum: CurriculumData): CurriculumStats {
  const canonicalKeys = new Set<string>();
  const problemsPerVariation: VariationProblemCount[] = [];
  let variationCount = 0;
  let placementCount = 0;

  for (const pattern of curriculum.patterns) {
    for (const variation of pattern.variations) {
      variationCount += 1;
      const count = variation.problems.length;
      placementCount += count;
      problemsPerVariation.push({ variationId: variation.id, count });
      for (const problem of variation.problems) {
        if (problem.url) canonicalKeys.add(canonicalProblemKey(problem.url));
      }
    }
  }

  return {
    patternCount: curriculum.patterns.length,
    variationCount,
    placementCount,
    uniqueCanonicalProblemCount: canonicalKeys.size,
    problemsPerVariation,
  };
}

export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
