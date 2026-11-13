/**
 * ============================================================================
 * VERTEX 3.47.2 — CANONICAL SYNCHRONIZATION TYPES & CONTRACTS
 * ============================================================================
 * Reference: audit/phase-3.47.1/defect-register.md
 * Invariants: Placement-specific progress tracking, semantic intent separation,
 *             cumulative attempt delta reconciliation, and explicit durability.
 * ============================================================================
 */

export type ProgressStatus = 'not_started' | 'attempted' | 'solved' | 'revisit';

/**
 * Historical milestone rank used strictly for linear baseline advancement.
 * NOTE: Conflict resolution does NOT rely solely on this rank for user intent.
 * Specifically, 'revisit' represents an intentional study state and is NOT
 * demoted by 'solved' milestones during conflict reconciliation.
 */
export const PROGRESS_STATUS_RANK: Record<ProgressStatus, number> = {
  not_started: 0,
  attempted: 1,
  revisit: 2,
  solved: 3,
};

export const REVISION_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60] as const;

export type StorageMode = 'INDEXED_DB' | 'MEMORY_FALLBACK';

export interface StorageHealthStatus {
  isAvailable: boolean;
  isDurable: boolean;
  storageMode: StorageMode;
  quotaExceeded: boolean;
  error?: string;
}

export interface LocalPlacementProgress {
  placementId: string;
  status: ProgressStatus;
  confidence: number;
  attempts: number;
  lastSolvedAt: string | null;
  nextRevisionAt: string | null;
  serverVersion: number;
  isDirty?: boolean;
  localUpdatedAt: string;
}

export interface SyncMutation {
  clientMutationId: string;
  placementId: string;
  status: ProgressStatus;
  confidence: number;
  attempts: number;
  /** Complete learner-authored state; never sync only the summary fields. */
  progress: ProblemProgress;
  expectedVersion: number;
  clientTimestamp: string;
  /**
   * Base attempts known to client when mutation was created.
   * Enables commutative delta reconciliation: delta = max(0, attempts - baseAttempts).
   */
  baseAttempts?: number;
  /**
   * Explicit flag indicating user deliberately requested progress reset.
   * Prevents intentional resets from being discarded as stale downgrades.
   */
  resetRequested?: boolean;
}

export interface SyncMutationResult {
  client_mutation_id: string;
  placement_id: string;
  server_version: number;
  status: ProgressStatus;
  is_idempotent_replay: boolean;
}

export type QueueItemStatus = 'PENDING' | 'IN_FLIGHT' | 'CONFLICT' | 'ACKNOWLEDGED' | 'FAILED';

export interface OfflineQueueItem {
  id: string;
  userId: string;
  mutation: SyncMutation;
  status: QueueItemStatus;
  enqueuedAt: string;
  retryCount: number;
  nextRetryAt: string;
  /**
   * Explicit durability indicator (DEFECT-01).
   * True if persisted in durable IndexedDB; false if stored in transient RAM.
   */
  isDurable: boolean;
  storageMode: StorageMode;
  lastError?: {
    code: string;
    message: string;
    timestamp: string;
  };
}

export interface ConflictResolutionContext {
  placementId: string;
  clientMutation: SyncMutation;
  serverState: LocalPlacementProgress;
}

export interface ResolvedProgressMutation {
  reconciledMutation: SyncMutation;
  requiresUserNotice: boolean;
  resolutionType:
    | 'AUTOMATIC_CLIENT_ADVANCE'
    | 'AUTOMATIC_SERVER_PRESERVE'
    | 'STUDY_INTENT_REVISIT_HONORED'
    | 'INTENTIONAL_RESET_APPLIED';
  auditLog: string;
}

export interface ConflictLedgerEntry {
  id: string;
  userId: string;
  placementId: string;
  clientState: {
    status: ProgressStatus;
    confidence: number;
    attempts: number;
    expectedVersion: number;
  };
  serverState: {
    status: ProgressStatus;
    confidence: number;
    attempts: number;
    serverVersion: number;
  };
  resolvedState: {
    status: ProgressStatus;
    confidence: number;
    attempts: number;
    appliedVersion: number;
  };
  resolutionType: string;
  occurredAt: string;
  acknowledged: boolean;
}

export interface SyncWorkerState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
  isStorageDurable: boolean;
  storageMode: StorageMode;
}

export interface CrossTabLease {
  userId: string;
  tabId: string;
  acquiredAt: string;
  expiresAt: string;
  fencingToken: number;
}
