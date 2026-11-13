import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProblemProgress, UserProgress } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { importProgress } from '../store';

interface SnapshotRow {
  version: number;
  progress: UserProgress;
}

export interface CloudSyncResult {
  progress: UserProgress;
  version: number;
  changed: boolean;
}

function asIso(value: unknown): number {
  if (typeof value !== 'string') return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cloneProblem(record: ProblemProgress): ProblemProgress {
  return {
    ...record,
    reviewHistory: Array.isArray(record.reviewHistory)
      ? record.reviewHistory.map((event) => ({ ...event }))
      : [],
  };
}

function activityKey(event: UserProgress['activity'][number]): string {
  return [event.date, event.problemId, event.action, event.patternId].join('|');
}

/**
 * Merge independent placement records by their own edit timestamp.
 * When legacy records have no per-record timestamp, snapshot timestamps provide
 * a conservative fallback. Cloud wins exact ties to avoid repeated ping-pong.
 */
export function mergeCloudProgress(
  local: UserProgress,
  remote: UserProgress
): UserProgress {
  const problems: UserProgress['problems'] = Object.create(null);
  const ids = new Set([
    ...Object.keys(local.problems || {}),
    ...Object.keys(remote.problems || {}),
  ]);

  for (const id of ids) {
    const localRecord = local.problems?.[id];
    const remoteRecord = remote.problems?.[id];
    if (!localRecord && remoteRecord) {
      problems[id] = cloneProblem(remoteRecord);
      continue;
    }
    if (localRecord && !remoteRecord) {
      problems[id] = cloneProblem(localRecord);
      continue;
    }
    if (!localRecord || !remoteRecord) continue;

    const localTime = asIso(localRecord.updatedAt) || asIso(local.lastUpdated);
    const remoteTime = asIso(remoteRecord.updatedAt) || asIso(remote.lastUpdated);
    problems[id] = cloneProblem(localTime > remoteTime ? localRecord : remoteRecord);
  }

  const activityByKey = new Map<string, UserProgress['activity'][number]>();
  for (const event of [...(remote.activity || []), ...(local.activity || [])]) {
    activityByKey.set(activityKey(event), event);
  }
  const activity = Array.from(activityByKey.values()).sort((a, b) =>
    a.date.localeCompare(b.date) ||
    a.problemId.localeCompare(b.problemId) ||
    a.action.localeCompare(b.action)
  );

  const localTime = asIso(local.lastUpdated);
  const remoteTime = asIso(remote.lastUpdated);
  const settings = localTime > remoteTime
    ? { ...local.settings }
    : { ...remote.settings };

  return {
    version: Math.max(Number(local.version) || 1, Number(remote.version) || 1),
    problems,
    activity,
    settings,
    lastUpdated: new Date(Math.max(localTime, remoteTime)).toISOString(),
  };
}

function getClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Cloud sync is not configured. Local progress is still available.');
  }
  const client = getSupabaseClient();
  if (!client) throw new Error('Cloud sync client is unavailable.');
  return client;
}

async function readSnapshot(client: SupabaseClient): Promise<SnapshotRow | null> {
  const { data, error } = await client
    .from('user_progress_snapshots')
    .select('version, progress')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  if (!data.progress || typeof data.progress !== 'object' || Array.isArray(data.progress)) {
    throw new Error('The cloud progress snapshot is malformed. Local data was not changed.');
  }
  return {
    version: Number(data.version),
    progress: importProgress(JSON.stringify(data.progress)),
  };
}

/**
 * Loads, merges and conditionally saves the current user's snapshot.
 * The RPC checks an expected version atomically; a concurrent device write
 * causes a bounded re-read/merge/retry rather than a silent last-write-wins.
 */
export async function syncProgressSnapshot(
  localProgress: UserProgress
): Promise<CloudSyncResult> {
  const client = getClient();
  let remote = await readSnapshot(client);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const merged = remote
      ? mergeCloudProgress(localProgress, remote.progress)
      : { ...localProgress, problems: { ...localProgress.problems }, activity: [...localProgress.activity] };

    if (remote && JSON.stringify(merged) === JSON.stringify(remote.progress)) {
      return { progress: merged, version: remote.version, changed: false };
    }

    const { data, error } = await client.rpc('save_user_progress_snapshot', {
      p_expected_version: remote?.version ?? 0,
      p_progress: merged,
    });

    if (error) throw error;
    const result = data as {
      saved?: boolean;
      version?: number;
      progress?: UserProgress;
    } | null;

    if (result?.saved && typeof result.version === 'number') {
      return { progress: merged, version: result.version, changed: true };
    }

    if (!result || !result.progress || typeof result.progress !== 'object') {
      throw new Error('Cloud sync returned an invalid conflict response.');
    }

    remote = {
      version: Number(result.version) || 0,
      progress: importProgress(JSON.stringify(result.progress)),
    };
  }

  throw new Error('Cloud progress changed on another device repeatedly. Your local changes are safe; retry sync shortly.');
}
