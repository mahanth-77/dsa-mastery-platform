import type { ActivityEvent, ProblemProgress, StatusOption, UserProgress } from '../types';

/**
 * Cross-device merge of personal progress.
 *
 * Rules, per problem: the most recent `updatedAt` wins. When neither side has a
 * timestamp (data saved before sync existed), the side that is further along wins,
 * so merging never silently throws away a solved problem. Activity is an append-only
 * log, so it is a de-duplicated union. Merging is symmetric: merge(a, b) equals merge(b, a).
 */

const RANK: Record<StatusOption, number> = {
  not_started: 0,
  attempted: 1,
  revisit: 2,
  solved: 3,
};

function progressScore(p: ProblemProgress): number[] {
  return [
    RANK[p.status] ?? 0,
    p.attempts || 0,
    (p.reviewHistory || []).length,
    (p.notes || '').length > 0 ? 1 : 0,
  ];
}

function pickProblem(a: ProblemProgress, b: ProblemProgress): ProblemProgress {
  const ta = a.updatedAt || '';
  const tb = b.updatedAt || '';
  if (ta !== tb) return ta > tb ? a : b;
  const sa = progressScore(a);
  const sb = progressScore(b);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return sa[i] > sb[i] ? a : b;
  }
  // Fully tied: break the tie on content so the result does not depend on argument order.
  return stableStringify(a) >= stableStringify(b) ? a : b;
}

const activityKey = (e: ActivityEvent) => `${e.date}|${e.problemId}|${e.action}`;

export function mergeProgress(local: UserProgress, remote: UserProgress): UserProgress {
  const problems: Record<string, ProblemProgress> = {};
  const ids = new Set([...Object.keys(local.problems || {}), ...Object.keys(remote.problems || {})]);
  for (const id of ids) {
    const l = local.problems?.[id];
    const r = remote.problems?.[id];
    problems[id] = l && r ? pickProblem(l, r) : ((l || r) as ProblemProgress);
  }

  const seen = new Map<string, ActivityEvent>();
  for (const e of [...(local.activity || []), ...(remote.activity || [])]) {
    if (!seen.has(activityKey(e))) seen.set(activityKey(e), e);
  }
  const activity = [...seen.values()].sort((a, b) =>
    a.date !== b.date
      ? a.date < b.date ? -1 : 1
      : activityKey(a) < activityKey(b) ? -1 : activityKey(a) > activityKey(b) ? 1 : 0
  );

  const lu = local.lastUpdated || '';
  const ru = remote.lastUpdated || '';
  const settingsSource = ru > lu ? remote : ru < lu ? local : stableStringify(remote.settings) > stableStringify(local.settings) ? remote : local;

  return {
    version: Math.max(local.version || 1, remote.version || 1),
    problems,
    activity,
    settings: { ...settingsSource.settings },
    lastUpdated: lu >= ru ? lu : ru,
  };
}

/** JSON with sorted object keys, so equal data always serialises identically. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/** Content fingerprint that ignores `lastUpdated` (which changes on every save). */
export function progressFingerprint(p: UserProgress): string {
  const activity = [...(p.activity || [])]
    .map((e) => stableStringify(e))
    .sort();
  return `${stableStringify(p.problems || {})}#${activity.join(',')}#${stableStringify(p.settings || {})}`;
}

export function sameProgress(a: UserProgress, b: UserProgress): boolean {
  return progressFingerprint(a) === progressFingerprint(b);
}
