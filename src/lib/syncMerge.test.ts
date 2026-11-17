import { describe, it, expect } from 'vitest';
import { mergeProgress, sameProgress, progressFingerprint } from './syncMerge';
import type { UserProgress, ProblemProgress } from '../types';

const prob = (o: Partial<ProblemProgress>): ProblemProgress => ({ status: 'not_started', attempts: 0, notes: '', reviewHistory: [], ...o } as ProblemProgress);
const base = (problems: Record<string, ProblemProgress>, extra: Partial<UserProgress> = {}): UserProgress =>
  ({ version: 1, problems, activity: [], settings: {}, lastUpdated: '2026-01-01T00:00:00.000Z', ...extra } as UserProgress);

describe('mergeProgress', () => {
  it('newest updatedAt wins per problem', () => {
    const a = base({ p: prob({ status: 'attempted', updatedAt: '2026-02-01T00:00:00Z' }) });
    const b = base({ p: prob({ status: 'solved', updatedAt: '2026-01-01T00:00:00Z' }) });
    expect(mergeProgress(a, b).problems.p.status).toBe('attempted');
  });
  it('without timestamps the further-along side wins', () => {
    const a = base({ p: prob({ status: 'solved' }) });
    const b = base({ p: prob({ status: 'attempted' }) });
    expect(mergeProgress(a, b).problems.p.status).toBe('solved');
    expect(mergeProgress(b, a).problems.p.status).toBe('solved');
  });
  it('unions problems and de-duplicates activity', () => {
    const e = { date: '2026-01-02', problemId: 'x', action: 'solved' } as any;
    const m = mergeProgress(base({ a: prob({}) }, { activity: [e] }), base({ b: prob({}) }, { activity: [e] }));
    expect(Object.keys(m.problems).sort()).toEqual(['a', 'b']);
    expect(m.activity).toHaveLength(1);
  });
  it('is idempotent and ignores lastUpdated in fingerprints', () => {
    const a = base({ p: prob({ status: 'solved' }) });
    const m = mergeProgress(a, a);
    expect(sameProgress(m, a)).toBe(true);
    expect(progressFingerprint({ ...a, lastUpdated: '2030-01-01' })).toBe(progressFingerprint(a));
  });
});
