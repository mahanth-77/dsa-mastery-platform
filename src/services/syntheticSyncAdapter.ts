/**
 * ============================================================================
 * VERTEX 3.47 — SYNTHETIC PROGRESS SYNCHRONIZATION ADAPTER
 * ============================================================================
 * Reference: Section 5 Frontend Integration Boundary
 * Invariant: Completely isolated from personal local tracker progress.
 *            Does NOT touch localStorage['dsa-mastery-progress'].
 * ============================================================================
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProblemProgress } from '../types';
import { getSupabaseClient } from '../lib/supabase.ts';
import { offlineQueueService } from './offlineQueueService.ts';
import { SyncWorkerService } from './syncWorkerService.ts';
import type {
  LocalPlacementProgress,
  ProgressStatus,
  SyncMutation,
} from '../types/sync.ts';

export interface SyntheticDeviceConfig {
  deviceId: string;
  userId: string;
  client?: SupabaseClient;
}

/**
 * Isolated device client simulating a user device (e.g. Laptop, Phone)
 * interacting with the synthetic synchronization backend.
 */
export class SyntheticDeviceClient {
  public readonly deviceId: string;
  public readonly userId: string;
  private client: SupabaseClient;
  public readonly syncWorker: SyncWorkerService;
  private localProgress: Map<string, LocalPlacementProgress> = new Map();

  constructor(config: SyntheticDeviceConfig) {
    this.deviceId = config.deviceId;
    this.userId = config.userId;
    const resolvedClient = config.client || getSupabaseClient();
    if (!resolvedClient) {
      throw new Error('Supabase client must be provided or configured for SyntheticDeviceClient');
    }
    this.client = resolvedClient;
    this.syncWorker = new SyncWorkerService(this.client);
    this.syncWorker.setActiveUser(this.userId);
  }

  /**
   * Initializes or loads local synthetic progress for a placement.
   */
  public setLocalPlacement(progress: LocalPlacementProgress): void {
    this.localProgress.set(progress.placementId, { ...progress });
  }

  public getLocalPlacement(placementId: string): LocalPlacementProgress | undefined {
    return this.localProgress.get(placementId);
  }

  public getAllLocalPlacements(): LocalPlacementProgress[] {
    return Array.from(this.localProgress.values());
  }

  /**
   * Hydrates local progress from the cloud database for synthetic test verification.
   */
  public async hydrateFromServer(curriculumVersionId?: string): Promise<number> {
    let query = this.client
      .from('user_placement_progress')
      .select('placement_id, status, confidence, attempts, server_version, last_solved_at, next_revision_at, updated_at');

    if (curriculumVersionId) {
      query = query.eq('curriculum_version_id', curriculumVersionId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to hydrate from server: ${error.message}`);
    }

    const rows = data || [];
    for (const row of rows) {
      this.localProgress.set(row.placement_id, {
        placementId: row.placement_id,
        status: row.status as ProgressStatus,
        confidence: row.confidence,
        attempts: row.attempts,
        serverVersion: Number(row.server_version),
        lastSolvedAt: row.last_solved_at,
        nextRevisionAt: row.next_revision_at,
        localUpdatedAt: row.updated_at,
      });
    }

    return rows.length;
  }

  /**
   * Performs an optimistic update on this synthetic device and enqueues a sync mutation.
   */
  public async recordProgress(
    placementId: string,
    status: ProgressStatus,
    confidence: number = 3,
    attemptIncrement: number = 1
  ): Promise<SyncMutation> {
    const existing = this.localProgress.get(placementId) || {
      placementId,
      status: 'not_started',
      confidence: 0,
      attempts: 0,
      lastSolvedAt: null,
      nextRevisionAt: null,
      serverVersion: 1,
      localUpdatedAt: new Date().toISOString(),
    };

    const newAttempts = existing.attempts + attemptIncrement;
    const now = new Date().toISOString();

    // 1. Optimistic Local State Update
    const updatedRecord: LocalPlacementProgress = {
      ...existing,
      status,
      confidence,
      attempts: newAttempts,
      lastSolvedAt: status === 'solved' ? (existing.lastSolvedAt || now) : existing.lastSolvedAt,
      isDirty: true,
      localUpdatedAt: now,
    };
    this.localProgress.set(placementId, updatedRecord);

    // 2. Formulate Canonical Sync Mutation
    const mutation: SyncMutation = {
      clientMutationId: crypto.randomUUID(),
      placementId,
      status,
      confidence,
      attempts: newAttempts,
      progress: {
        status,
        attempts: newAttempts,
        lastSolvedAt: updatedRecord.lastSolvedAt,
        nextRevisionAt: updatedRecord.nextRevisionAt,
        notes: '',
        approach: '',
        timeComplexity: '',
        spaceComplexity: '',
        confidence,
        reviewHistory: [],
      } satisfies ProblemProgress,
      expectedVersion: existing.serverVersion,
      clientTimestamp: now,
      baseAttempts: existing.attempts,
    };

    // 3. Enqueue to Durable Offline Queue
    await offlineQueueService.enqueueMutation(this.userId, mutation);

    return mutation;
  }

  /**
   * Triggers synchronization drain for this synthetic device.
   */
  public async sync(): Promise<void> {
    await this.syncWorker.triggerSync();
  }
}
