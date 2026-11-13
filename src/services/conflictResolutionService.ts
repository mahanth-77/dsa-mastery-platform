/**
 * ============================================================================
 * VERTEX 3.47.2 — DETERMINISTIC CONFLICT RESOLUTION SERVICE
 * ============================================================================
 * Reference: audit/phase-3.47.1/defect-register.md (DEFECT-04, DEFECT-05, DEFECT-06)
 * Invariants: Multi-dimensional progress semantics, study intent preservation,
 *             cumulative attempt delta reconciliation, and local SRS calculation.
 * ============================================================================
 */

import type {
  ConflictResolutionContext,
  ResolvedProgressMutation,
  SyncMutation,
  ProgressStatus,
} from '../types/sync.ts';
import { PROGRESS_STATUS_RANK, REVISION_INTERVALS_DAYS } from '../types/sync.ts';

export class ConflictResolutionService {
  /**
   * Deterministically resolves a version conflict between a client mutation and current server state.
   * DEFECT-04 Remediation: Replaces linear rank comparison with an explicit state transition matrix.
   * DEFECT-05 Remediation: Replaces Math.max attempts with commutative delta addition.
   */
  public resolvePlacementConflict(ctx: ConflictResolutionContext): ResolvedProgressMutation {
    const { clientMutation, serverState, placementId } = ctx;

    let resolvedStatus: ProgressStatus;
    let resolvedConfidence: number;
    let resolutionType: ResolvedProgressMutation['resolutionType'];
    let requiresUserNotice = false;

    // ========================================================================
    // 1. INTENTIONAL RESET RULE
    // ========================================================================
    if (clientMutation.resetRequested) {
      resolvedStatus = 'not_started';
      resolvedConfidence = 0;
      resolutionType = 'INTENTIONAL_RESET_APPLIED';
      requiresUserNotice = false;
    }
    // ========================================================================
    // 2. REVISIT STUDY INTENT RULE (DEFECT-04)
    // A user's explicit intent to revisit a problem must NEVER be discarded,
    // even if another device has marked the problem as 'solved'.
    // ========================================================================
    else if (clientMutation.status === 'revisit') {
      resolvedStatus = 'revisit';
      resolvedConfidence = clientMutation.confidence;
      resolutionType = 'STUDY_INTENT_REVISIT_HONORED';
      requiresUserNotice = false;
    }
    // ========================================================================
    // 3. SOLVED MILESTONE RULE
    // Client achieved a solve. Solve is an achievement milestone that advances state.
    // ========================================================================
    else if (clientMutation.status === 'solved') {
      resolvedStatus = 'solved';
      resolvedConfidence = clientMutation.confidence;
      resolutionType = 'AUTOMATIC_CLIENT_ADVANCE';
      requiresUserNotice = false;
    }
    // ========================================================================
    // 4. ATTEMPTED MUTATION AGAINST SERVER STATE
    // ========================================================================
    else if (clientMutation.status === 'attempted') {
      if (serverState.status === 'solved') {
        // Stale client attempt occurred before another device recorded a solve.
        // Preserve the solved milestone, but notify the user.
        resolvedStatus = 'solved';
        resolvedConfidence = serverState.confidence;
        resolutionType = 'AUTOMATIC_SERVER_PRESERVE';
        requiresUserNotice = true;
      } else if (serverState.status === 'revisit') {
        // Problem is actively scheduled for revisit; an attempt keeps it in revisit
        resolvedStatus = 'revisit';
        resolvedConfidence = clientMutation.confidence;
        resolutionType = 'AUTOMATIC_SERVER_PRESERVE';
        requiresUserNotice = false;
      } else {
        // Advances from not_started to attempted, or updates existing attempted
        resolvedStatus = 'attempted';
        resolvedConfidence = clientMutation.confidence;
        resolutionType = 'AUTOMATIC_CLIENT_ADVANCE';
        requiresUserNotice = false;
      }
    }
    // ========================================================================
    // 5. STALE NOT_STARTED MUTATION (WITHOUT EXPLICIT RESET)
    // ========================================================================
    else {
      // Stale update claiming not_started when server has already progressed
      resolvedStatus = serverState.status;
      resolvedConfidence = serverState.confidence;
      resolutionType = 'AUTOMATIC_SERVER_PRESERVE';
      requiresUserNotice = true;
    }

    // ========================================================================
    // 6. CUMULATIVE ATTEMPT DELTA RECONCILIATION (DEFECT-05)
    // Preserves independent solving attempts made on multiple offline devices.
    // delta = max(0, client.attempts - client.baseAttempts)
    // resolvedAttempts = serverState.attempts + delta
    // ========================================================================
    let deltaAttempts = 0;
    if (clientMutation.baseAttempts !== undefined) {
      deltaAttempts = Math.max(0, clientMutation.attempts - clientMutation.baseAttempts);
    } else {
      // Fallback if baseAttempts not populated
      deltaAttempts = Math.max(0, clientMutation.attempts - serverState.attempts);
    }
    const resolvedAttempts = serverState.attempts + deltaAttempts;

    // ========================================================================
    // 7. FRESH RECONCILED MUTATION BOUND TO SERVER VERSION
    // ========================================================================
    const reconciledMutation: SyncMutation = {
      clientMutationId: crypto.randomUUID(),
      placementId,
      status: resolvedStatus,
      confidence: resolvedConfidence,
      attempts: resolvedAttempts,
      progress: {
        ...clientMutation.progress,
        status: resolvedStatus,
        confidence: resolvedConfidence,
        attempts: resolvedAttempts,
      },
      expectedVersion: serverState.serverVersion,
      clientTimestamp: new Date().toISOString(),
      baseAttempts: serverState.attempts,
    };

    const auditLog = `[VERTEX 3.47.2 Conflict Resolution] Placement ${placementId}: Status [client: ${clientMutation.status}, server: ${serverState.status}] -> ${resolvedStatus} (${resolutionType}); Attempts [server: ${serverState.attempts} + delta: ${deltaAttempts}] -> ${resolvedAttempts}; Bound to server version ${serverState.serverVersion}`;

    return {
      reconciledMutation,
      requiresUserNotice,
      resolutionType,
      auditLog,
    };
  }

  /**
   * Computes the next scheduled spaced repetition revision date based on confidence.
   * DEFECT-06 Architectural Documentation:
   * This is a client-side study preference and planning calculation.
   * It is utilized locally to schedule future review notifications.
   * Core database synchronization synchronizes placement status, attempts, and confidence.
   */
  public calculateNextRevisionDate(confidence: number, fromDate: Date = new Date()): string {
    const safeConf = Math.max(0, Math.min(5, Math.floor(confidence)));
    const intervalDays = REVISION_INTERVALS_DAYS[Math.min(safeConf, REVISION_INTERVALS_DAYS.length - 1)];

    const target = new Date(fromDate.getTime());
    target.setDate(target.getDate() + intervalDays);
    return target.toISOString().split('T')[0];
  }
}

export const conflictResolutionService = new ConflictResolutionService();
