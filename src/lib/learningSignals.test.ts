import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { summarizeLearning, hasDemonstratedRecall, weakVariations, struggledPlacements } from './learningSignals';
import { studyFrame } from './studyFrames';
import { defaultProblemProgress, getProblemProgress, completeRevision } from '../store';
import type { CurriculumData, UserProgress } from '../types';

const tracker = JSON.parse(readFileSync(new URL('../../dsa_pattern_mastery_tracker.json', import.meta.url), 'utf8')) as CurriculumData;

function emptyProgress(): UserProgress {
  return { version: 1, problems: {}, activity: [], settings: { dailyGoal: 5, theme: 'dark', compactView: false }, lastUpdated: '' };
}

describe('curriculum identity', () => {
  it('keeps 941 placements, 115 variations, and 21 patterns', () => {
    let placements = 0;
    let variations = 0;
    for (const pattern of tracker.patterns) {
      variations += pattern.variations.length;
      for (const variation of pattern.variations) placements += variation.problems.length;
    }
    assert.equal(tracker.patterns.length, 21);
    assert.equal(variations, 115);
    assert.equal(placements, 941);
  });

  it('does not change the active tracker hash', () => {
    const hash = createHash('sha256').update(readFileSync(new URL('../../dsa_pattern_mastery_tracker.json', import.meta.url))).digest('hex').toUpperCase();
    assert.equal(hash, '479C2395B07F85472C398CA69FFF6CA65F459143D5E51018796F8297EB6058E8');
  });

  it('isolates progress by placement id when URLs match', () => {
    const progress = emptyProgress();
    const first = tracker.patterns[0].variations[0].problems[0];
    progress.problems[first.id] = { ...defaultProblemProgress(), status: 'solved', attempts: 3 };
    const sameUrl = tracker.patterns.flatMap((pattern) => pattern.variations.flatMap((variation) => variation.problems)).find((problem) => problem.url === first.url && problem.id !== first.id);
    const other = getProblemProgress(progress, sameUrl ? sameUrl.id : 'missing-placement');
    assert.equal(other.status, 'not_started');
    assert.equal(other.attempts, 0);
  });
});

describe('learning signals', () => {
  it('does not treat solved as demonstrated recall', () => {
    const row = { ...defaultProblemProgress(), status: 'solved' as const };
    assert.equal(hasDemonstratedRecall(row), false);
    row.confidence = 4;
    row.reviewHistory = [{ date: '2026-01-01', confidence: 4 }];
    assert.equal(hasDemonstratedRecall(row), true);
  });

  it('counts placements rather than collapsing duplicate URLs', () => {
    const summary = summarizeLearning(tracker, emptyProgress());
    assert.equal(summary.placements, 941);
    assert.equal(summary.notStarted, 941);
    assert.equal(summary.demonstratedRecall, 0);
  });

  it('reports a weak variation only from saved evidence', () => {
    const progress = emptyProgress();
    assert.equal(weakVariations(tracker, progress).length, 0);
    const problem = tracker.patterns[0].variations[0].problems[0];
    progress.problems[problem.id] = { ...defaultProblemProgress(), status: 'revisit', attempts: 2 };
    const weak = weakVariations(tracker, progress);
    assert.equal(weak[0].variationId, tracker.patterns[0].variations[0].id);
    assert.equal(struggledPlacements(tracker, progress)[0].placementId, problem.id);
  });
});

describe('revision schedule', () => {
  it('spaces reviews at 1, 3, 7, 14, 30, then 60 days', () => {
    const expected = [1, 3, 7, 14, 30, 60];
    let progress = emptyProgress();
    progress.problems['p'] = { ...defaultProblemProgress(), status: 'solved' };
    for (const days of expected) {
      const next = new Date();
      next.setDate(next.getDate() + days);
      const expectedDate = next.toISOString().slice(0, 10);
      progress = completeRevision(progress, 'p', 4, 'pattern-01');
      assert.equal(progress.problems['p'].nextRevisionAt, expectedDate);
    }
    assert.equal(progress.problems['p'].reviewHistory.length, expected.length);
  });
});

describe('study frames', () => {
  it('has a frame for every pattern family', () => {
    for (const pattern of tracker.patterns) {
      const frame = studyFrame(pattern.id, pattern.variations[0].name);
      assert.ok(frame.concept.length > 20);
      assert.equal(pattern.variations.length > 0, true);
    }
    assert.equal(tracker.patterns.length, 21);
  });
});
