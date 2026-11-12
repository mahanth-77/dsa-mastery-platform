import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

/**
 * VERTEX 3.45 — Read-Only Backend Service
 *
 * Provides typed, secure, read-only queries against the local Supabase backend.
 * Strict Boundary Invariants:
 * - Read-only: Zero progress mutation, staging, commit, rollback, or write RPCs.
 * - Never trusts client-supplied user IDs: all user-isolated queries rely on auth.uid() in PostgreSQL RLS.
 * - Fails safely in offline / unconfigured environments.
 * - Normalizes database errors to protect internal schemas from exposure.
 */

export interface CloudProfile {
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CloudSettings {
  user_id: string;
  daily_goal: number;
  theme: string;
  compact_view: boolean;
  active_curriculum_version_id: string | null;
  updated_at: string;
}

export interface CloudCurriculumVersion {
  id: string;
  version_number: number;
  title: string;
  status: string;
  created_at: string;
}

export interface CloudProgressSummary {
  recordCount: number;
  serverVersionMax: number;
  lastSolvedAt: string | null;
}

export interface ReadResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  isOffline?: boolean;
  isUnauthorized?: boolean;
}

function normalizeReadError(err: any): string {
  if (!err) return 'An unexpected error occurred while querying the backend.';
  const msg = err.message || String(err);

  if (/JWT expired/i.test(msg) || /invalid claim/i.test(msg)) {
    return 'Your session has expired. Please sign in again.';
  }
  if (/failed to fetch/i.test(msg) || /network/i.test(msg) || /connection/i.test(msg)) {
    return 'Unable to reach the database server. Operating in offline mode.';
  }
  if (/permission denied/i.test(msg) || /42501/i.test(msg)) {
    return 'Access denied: insufficient permissions to view this resource.';
  }

  return 'Unable to retrieve cloud records at this time.';
}

/**
 * Retrieves the authenticated user's profile record from public.user_profiles.
 * Relies entirely on database RLS (user_id = auth.uid()); never passes user_id in the filter.
 */
export async function getCloudProfile(): Promise<ReadResult<CloudProfile>> {
  if (!isSupabaseConfigured()) {
    return { success: false, data: null, error: 'Backend is offline or unconfigured.', isOffline: true };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: null, error: 'Database client unavailable.', isOffline: true };
  }

  try {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      return { success: false, data: null, error: 'Authentication required.', isUnauthorized: true };
    }

    const { data, error } = await client
      .from('user_profiles')
      .select('user_id, email, display_name, created_at, updated_at')
      .maybeSingle();

    if (error) {
      return { success: false, data: null, error: normalizeReadError(error) };
    }

    return { success: true, data: data as CloudProfile | null };
  } catch (err: any) {
    return { success: false, data: null, error: normalizeReadError(err) };
  }
}

/**
 * Retrieves the authenticated user's settings record from public.user_settings.
 * Relies entirely on database RLS (user_id = auth.uid()).
 */
export async function getCloudSettings(): Promise<ReadResult<CloudSettings>> {
  if (!isSupabaseConfigured()) {
    return { success: false, data: null, error: 'Backend is offline or unconfigured.', isOffline: true };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: null, error: 'Database client unavailable.', isOffline: true };
  }

  try {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      return { success: false, data: null, error: 'Authentication required.', isUnauthorized: true };
    }

    const { data, error } = await client
      .from('user_settings')
      .select('user_id, daily_goal, theme, compact_view, active_curriculum_version_id, updated_at')
      .maybeSingle();

    if (error) {
      return { success: false, data: null, error: normalizeReadError(error) };
    }

    return { success: true, data: data as CloudSettings | null };
  } catch (err: any) {
    return { success: false, data: null, error: normalizeReadError(err) };
  }
}

/**
 * Retrieves the latest RELEASED curriculum version from public.curriculum_versions.
 * Public read access is permitted under RLS policy p_read_curriculum_versions.
 */
export async function getReleasedCurriculumVersion(): Promise<ReadResult<CloudCurriculumVersion>> {
  if (!isSupabaseConfigured()) {
    return { success: false, data: null, error: 'Backend is offline or unconfigured.', isOffline: true };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: null, error: 'Database client unavailable.', isOffline: true };
  }

  try {
    const { data, error } = await client
      .from('curriculum_versions')
      .select('id, version_number, title, status, created_at')
      .eq('status', 'RELEASED')
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { success: false, data: null, error: normalizeReadError(error) };
    }

    return { success: true, data: data as CloudCurriculumVersion | null };
  } catch (err: any) {
    return { success: false, data: null, error: normalizeReadError(err) };
  }
}

/**
 * Retrieves read-only summary metrics of the user's placement progress in the cloud database.
 * Protected under RLS policy p_user_progress (user_id = auth.uid()).
 */
export async function getCloudProgressSummary(): Promise<ReadResult<CloudProgressSummary>> {
  if (!isSupabaseConfigured()) {
    return { success: false, data: null, error: 'Backend is offline or unconfigured.', isOffline: true };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: null, error: 'Database client unavailable.', isOffline: true };
  }

  try {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      return { success: false, data: null, error: 'Authentication required.', isUnauthorized: true };
    }

    const { data, error } = await client
      .from('user_placement_progress')
      .select('placement_id, status, confidence, attempts, last_solved_at, server_version');

    if (error) {
      return { success: false, data: null, error: normalizeReadError(error) };
    }

    const rows = data || [];
    let maxServerVersion = 1;
    let latestSolved: string | null = null;

    rows.forEach((r: any) => {
      const v = Number(r.server_version || 1);
      if (v > maxServerVersion) maxServerVersion = v;
      if (r.last_solved_at && (!latestSolved || r.last_solved_at > latestSolved)) {
        latestSolved = r.last_solved_at;
      }
    });

    return {
      success: true,
      data: {
        recordCount: rows.length,
        serverVersionMax: maxServerVersion,
        lastSolvedAt: latestSolved,
      },
    };
  } catch (err: any) {
    return { success: false, data: null, error: normalizeReadError(err) };
  }
}

