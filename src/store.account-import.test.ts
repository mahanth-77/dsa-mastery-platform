import { describe, expect, it } from 'vitest';
import {
  defaultProblemProgress,
  defaultUserProgress,
  getProgressStorageKey,
  GUEST_PROGRESS_STORAGE_KEY,
  importProgress,
  mergeProgressImport,
  previewProgressImport,
} from './store';
import type { ActivityEvent, UserProgress } from './types';

function progressWith(
  problems: UserProgress['problems'] = {},
  activity: ActivityEvent[] = []
): UserProgress {
  return {
    ...defaultUserProgress(),
    problems,
    activity,
    settings: { dailyGoal: 7, theme: 'dark', compactView: false },
  };
}

describe('account-scoped progress storage', () => {
  it('keeps guest progress on the legacy key and namespaces accounts by immutable user id', () => {
    expect(getProgressStorageKey(null)).toBe(GUEST_PROGRESS_STORAGE_KEY);
    expect(getProgressStorageKey('user-123')).toBe('vertex-progress:user-123');
    expect(getProgressStorageKey('user-456')).not.toBe(getProgressStorageKey('user-123'));
  });
});

describe('non-destructive progress import', () => {
  const existingActivity: ActivityEvent = {
    date: '2026-11-12',
    problemId: 'placement-1',
    action: 'solved',
    patternId: 'pattern-01',
  };

  it('previews new records, placement collisions, and duplicate activity without mutation', () => {
    const current = progressWith({
      'placement-1': { ...defaultProblemProgress(), status: 'solved', notes: 'account note' },
    }, [existingActivity]);
    const incoming = progressWith({
      'placement-1': { ...defaultProblemProgress(), status: 'attempted', notes: 'guest note' },
      'placement-2': { ...defaultProblemProgress(), status: 'attempted' },
    }, [
      existingActivity,
      { date: '2026-11-13', problemId: 'placement-2', action: 'attempted', patternId: 'pattern-01' },
    ]);

    const preview = previewProgressImport(current, incoming);

    expect(preview).toEqual({
      incomingProblems: 2,
      newProblems: 1,
      existingProblemConflicts: 1,
      incomingActivityEvents: 2,
      newActivityEvents: 1,
      duplicateActivityEvents: 1,
    });
    expect(current.problems['placement-1'].notes).toBe('account note');
    expect(Object.keys(current.problems)).toHaveLength(1);
    expect(current.activity).toHaveLength(1);
  });

  it('adds only missing placements and unseen activity while preserving account records and settings', () => {
    const current = progressWith({
      'placement-1': { ...defaultProblemProgress(), status: 'solved', notes: 'account note' },
    }, [existingActivity]);
    const incoming = progressWith({
      'placement-1': { ...defaultProblemProgress(), status: 'attempted', notes: 'guest note' },
      'placement-2': { ...defaultProblemProgress(), status: 'attempted', notes: 'new note' },
    }, [
      existingActivity,
      { date: '2026-11-13', problemId: 'placement-2', action: 'attempted', patternId: 'pattern-01' },
    ]);

    const result = mergeProgressImport(current, incoming);

    expect(result.progress.problems['placement-1'].notes).toBe('account note');
    expect(result.progress.problems['placement-1'].status).toBe('solved');
    expect(result.progress.problems['placement-2'].notes).toBe('new note');
    expect(result.progress.settings).toEqual(current.settings);
    expect(result.progress.activity).toHaveLength(2);
    expect(result.preview.newProblems).toBe(1);
    expect(result.preview.existingProblemConflicts).toBe(1);
    expect(current.problems['placement-2']).toBeUndefined();
    expect(incoming.problems['placement-1'].notes).toBe('guest note');
  });

  it('rejects malformed backup files instead of replacing account state', () => {
    expect(() => importProgress('{broken')).toThrow(/valid JSON/);
    expect(() => importProgress('[]')).toThrow(/expected an object/);
    expect(() => importProgress(JSON.stringify({
      problems: { 'placement-1': { attempts: -1 } },
    }))).toThrow(/malformed problem record/);
  });

  it('normalizes valid legacy backups with missing optional collections', () => {
    const imported = importProgress(JSON.stringify({ problems: {} }));

    expect(imported.problems).toEqual({});
    expect(imported.activity).toEqual([]);
    expect(imported.settings.dailyGoal).toBe(5);
    expect(imported.settings.theme).toBe('dark');
  });

  it('rejects reserved object keys in imported placement identifiers', () => {
    const payload = '{"problems":{"__proto__":{}}}';
    expect(() => importProgress(payload)).toThrow(/reserved problem identifier/);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});
