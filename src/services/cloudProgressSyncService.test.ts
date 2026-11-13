import { describe, expect, it } from 'vitest';
import { defaultProblemProgress, defaultUserProgress } from '../store';
import type { ActivityEvent, UserProgress } from '../types';
import { mergeCloudProgress } from './cloudProgressSyncService';

function snapshot(
  problems: UserProgress['problems'],
  lastUpdated: string,
  activity: ActivityEvent[] = []
): UserProgress {
  return {
    ...defaultUserProgress(),
    problems,
    activity,
    lastUpdated,
  };
}

describe('cloud progress reconciliation', () => {
  it('merges independent placement edits using per-placement timestamps', () => {
    const local = snapshot({
      localOnly: {
        ...defaultProblemProgress(),
        status: 'solved',
        notes: 'local notes',
        updatedAt: '2026-11-13T10:00:00.000Z',
      },
      shared: {
        ...defaultProblemProgress(),
        status: 'attempted',
        notes: 'newer local edit',
        updatedAt: '2026-11-13T12:00:00.000Z',
      },
    }, '2026-11-13T12:00:00.000Z');

    const remote = snapshot({
      remoteOnly: {
        ...defaultProblemProgress(),
        status: 'solved',
        notes: 'remote notes',
        updatedAt: '2026-11-13T11:00:00.000Z',
      },
      shared: {
        ...defaultProblemProgress(),
        status: 'solved',
        notes: 'older cloud edit',
        updatedAt: '2026-11-13T09:00:00.000Z',
      },
    }, '2026-11-13T11:00:00.000Z');

    const merged = mergeCloudProgress(local, remote);

    expect(merged.problems.localOnly.notes).toBe('local notes');
    expect(merged.problems.remoteOnly.notes).toBe('remote notes');
    expect(merged.problems.shared.notes).toBe('newer local edit');
  });

  it('unions activity events without duplicating exact matches', () => {
    const shared: ActivityEvent = {
      date: '2026-11-13',
      problemId: 'placement-1',
      action: 'solved',
      patternId: 'pattern-01',
    };
    const localOnly: ActivityEvent = {
      date: '2026-11-13',
      problemId: 'placement-2',
      action: 'attempted',
      patternId: 'pattern-02',
    };

    const merged = mergeCloudProgress(
      snapshot({}, '2026-11-13T12:00:00.000Z', [shared, localOnly]),
      snapshot({}, '2026-11-13T11:00:00.000Z', [shared])
    );

    expect(merged.activity).toHaveLength(2);
    expect(merged.activity).toContainEqual(shared);
    expect(merged.activity).toContainEqual(localOnly);
  });

  it('uses cloud settings on equal or newer cloud snapshot timestamps', () => {
    const local = snapshot({}, '2026-11-13T11:00:00.000Z');
    local.settings.dailyGoal = 8;
    const remote = snapshot({}, '2026-11-13T11:00:00.000Z');
    remote.settings.dailyGoal = 4;

    expect(mergeCloudProgress(local, remote).settings.dailyGoal).toBe(4);
  });

  it('keeps placement snapshot time independent from a settings-only edit', () => {
    const local = snapshot({
      'placement-1': {
        ...defaultProblemProgress(),
        status: 'attempted',
        updatedAt: '2026-11-13T09:00:00.000Z',
      },
    }, '2026-11-13T12:00:00.000Z');
    local.settings.updatedAt = '2026-11-13T08:00:00.000Z';

    const remote = snapshot({
      'placement-1': {
        ...defaultProblemProgress(),
        status: 'solved',
        updatedAt: '2026-11-13T10:00:00.000Z',
      },
    }, '2026-11-13T11:00:00.000Z');

    const merged = mergeCloudProgress(local, remote);

    expect(merged.problems['placement-1'].status).toBe('solved');
    expect(merged.lastUpdated).toBe('2026-11-13T12:00:00.000Z');
  });
});
