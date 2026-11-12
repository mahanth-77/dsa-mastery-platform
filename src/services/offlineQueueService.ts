/**
 * ============================================================================
 * VERTEX 3.47.2 — OFFLINE QUEUE & LOCAL STORAGE SERVICE
 * ============================================================================
 * Reference: audit/phase-3.47.1/defect-register.md (DEFECT-01, DEFECT-02)
 * Invariants: Explicit durability disclosure, quota protection, multi-account
 *             partitioning, and cross-tab lease coordination.
 * ============================================================================
 */

import type {
  OfflineQueueItem,
  QueueItemStatus,
  SyncMutation,
  ConflictLedgerEntry,
  LocalPlacementProgress,
  StorageMode,
  StorageHealthStatus,
  CrossTabLease,
} from '../types/sync.ts';
import { PROGRESS_STATUS_RANK } from '../types/sync.ts';

const DB_NAME = 'vertex_sync_db';
const DB_VERSION = 2;

const STORE_QUEUE = 'vertex_offline_sync_queue';
const STORE_SNAPSHOTS = 'vertex_local_snapshots';
const STORE_CONFLICTS = 'vertex_conflict_ledger';
const STORE_COORDINATION = 'vertex_sync_coordination';

export interface UserProgressSnapshot {
  userId: string;
  version: number;
  progress: Record<string, LocalPlacementProgress>;
  updatedAt: string;
}

export class OfflineQueueService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryQueue: Map<string, OfflineQueueItem> = new Map();
  private memorySnapshots: Map<string, UserProgressSnapshot> = new Map();
  private memoryConflicts: Map<string, ConflictLedgerEntry> = new Map();
  private memoryLeases: Map<string, CrossTabLease> = new Map();
  private isIndexedDBAvailable: boolean;

  constructor(forceMemoryFallback: boolean = false) {
    this.isIndexedDBAvailable = !forceMemoryFallback && typeof indexedDB !== 'undefined';
    if (!this.isIndexedDBAvailable) {
      console.warn(
        '[VERTEX Storage Warning] Operating in non-durable memory fallback mode. Offline mutations will NOT survive tab or process termination.'
      );
    }
  }

  /**
   * Returns whether current storage engine is durable (survives restarts).
   * DEFECT-01 Remediation: Callers and UI can query this directly.
   */
  public isDurable(): boolean {
    return this.isIndexedDBAvailable;
  }

  /**
   * Returns the current storage mode identifier.
   */
  public getStorageMode(): StorageMode {
    return this.isIndexedDBAvailable ? 'INDEXED_DB' : 'MEMORY_FALLBACK';
  }

  /**
   * Diagnoses and returns complete storage health and quota status.
   */
  public async checkStorageHealth(): Promise<StorageHealthStatus> {
    if (!this.isIndexedDBAvailable) {
      return {
        isAvailable: false,
        isDurable: false,
        storageMode: 'MEMORY_FALLBACK',
        quotaExceeded: false,
        error: 'IndexedDB is unavailable in current runtime environment.',
      };
    }

    try {
      const db = await this.getDB();
      return {
        isAvailable: !!db,
        isDurable: true,
        storageMode: 'INDEXED_DB',
        quotaExceeded: false,
      };
    } catch (err: any) {
      const isQuota = err?.name === 'QuotaExceededError';
      return {
        isAvailable: false,
        isDurable: false,
        storageMode: 'MEMORY_FALLBACK',
        quotaExceeded: isQuota,
        error: err?.message || 'Failed to initialize IndexedDB storage.',
      };
    }
  }

  /**
   * Initializes and returns the IndexedDB connection singleton.
   */
  private async getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBAvailable) {
      throw new Error('IndexedDB is not available in current environment');
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Offline Queue Store
          if (!db.objectStoreNames.contains(STORE_QUEUE)) {
            const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
            queueStore.createIndex('idx_user_status', ['userId', 'status'], { unique: false });
            queueStore.createIndex('idx_user_placement', ['userId', 'mutation.placementId'], { unique: false });
            queueStore.createIndex('idx_retry', ['status', 'nextRetryAt'], { unique: false });
          }

          // 2. Local Snapshots Store
          if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
            db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'userId' });
          }

          // 3. Conflict Ledger Store
          if (!db.objectStoreNames.contains(STORE_CONFLICTS)) {
            const conflictStore = db.createObjectStore(STORE_CONFLICTS, { keyPath: 'id' });
            conflictStore.createIndex('idx_user_occurred', ['userId', 'occurredAt'], { unique: false });
          }

          // 4. Cross-Tab Coordination Lease Store (DEFECT-02)
          if (!db.objectStoreNames.contains(STORE_COORDINATION)) {
            db.createObjectStore(STORE_COORDINATION, { keyPath: 'userId' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          this.dbPromise = null;
          reject(request.error);
        };
      } catch (err) {
        this.dbPromise = null;
        reject(err);
      }
    });

    return this.dbPromise;
  }

  /**
   * Enqueues a sync mutation for the authenticated user with intra-placement coalescing.
   * Reports explicit durability status on the created item.
   */
  public async enqueueMutation(userId: string, mutation: SyncMutation): Promise<OfflineQueueItem> {
    if (!userId) {
      throw new Error('Cannot enqueue mutation without a valid userId');
    }

    const now = new Date().toISOString();
    const isDurable = this.isDurable();
    const storageMode = this.getStorageMode();

    if (!this.isIndexedDBAvailable) {
      // In-Memory Fallback
      for (const item of this.memoryQueue.values()) {
        if (item.userId === userId && item.mutation.placementId === mutation.placementId && item.status === 'PENDING') {
          // Coalesce in-place
          const rankNew = PROGRESS_STATUS_RANK[mutation.status];
          const rankOld = PROGRESS_STATUS_RANK[item.mutation.status];
          // Preserve revisit or higher rank
          if (mutation.status === 'revisit' || rankNew >= rankOld) {
            item.mutation.status = mutation.status;
          }
          item.mutation.confidence = mutation.confidence;
          item.mutation.attempts = Math.max(item.mutation.attempts, mutation.attempts);
          if (mutation.baseAttempts !== undefined) {
            item.mutation.baseAttempts = Math.min(item.mutation.baseAttempts ?? mutation.baseAttempts, mutation.baseAttempts);
          }
          item.enqueuedAt = now;
          return item;
        }
      }

      const newItem: OfflineQueueItem = {
        id: crypto.randomUUID(),
        userId,
        mutation,
        status: 'PENDING',
        enqueuedAt: now,
        retryCount: 0,
        nextRetryAt: now,
        isDurable: false,
        storageMode: 'MEMORY_FALLBACK',
      };
      this.memoryQueue.set(newItem.id, newItem);
      return newItem;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([STORE_QUEUE], 'readwrite');
        const store = tx.objectStore(STORE_QUEUE);
        const index = store.index('idx_user_placement');

        const query = index.getAll(IDBKeyRange.only([userId, mutation.placementId]));

        query.onsuccess = () => {
          const existingItems: OfflineQueueItem[] = query.result || [];
          const pendingItem = existingItems.find((i) => i.status === 'PENDING');

          if (pendingItem) {
            // Coalesce into existing pending mutation, keeping the original expectedVersion
            const rankNew = PROGRESS_STATUS_RANK[mutation.status];
            const rankOld = PROGRESS_STATUS_RANK[pendingItem.mutation.status];

            if (mutation.status === 'revisit' || rankNew >= rankOld) {
              pendingItem.mutation.status = mutation.status;
            }
            pendingItem.mutation.confidence = mutation.confidence;
            pendingItem.mutation.attempts = Math.max(pendingItem.mutation.attempts, mutation.attempts);
            if (mutation.baseAttempts !== undefined) {
              pendingItem.mutation.baseAttempts = Math.min(
                pendingItem.mutation.baseAttempts ?? mutation.baseAttempts,
                mutation.baseAttempts
              );
            }
            pendingItem.enqueuedAt = now;
            pendingItem.isDurable = true;
            pendingItem.storageMode = 'INDEXED_DB';

            const updateReq = store.put(pendingItem);
            updateReq.onsuccess = () => resolve(pendingItem);
            updateReq.onerror = () => reject(updateReq.error);
          } else {
            // Create new queue item
            const newItem: OfflineQueueItem = {
              id: crypto.randomUUID(),
              userId,
              mutation,
              status: 'PENDING',
              enqueuedAt: now,
              retryCount: 0,
              nextRetryAt: now,
              isDurable: true,
              storageMode: 'INDEXED_DB',
            };
            const putReq = store.add(newItem);
            putReq.onsuccess = () => resolve(newItem);
            putReq.onerror = (e) => {
              if (putReq.error?.name === 'QuotaExceededError') {
                reject(new Error('IndexedDB storage quota exceeded. Unable to persist offline progress.'));
              } else {
                reject(putReq.error);
              }
            };
          }
        };

        query.onerror = () => reject(query.error);
        tx.onerror = (e) => {
          if (tx.error?.name === 'QuotaExceededError') {
            reject(new Error('IndexedDB storage quota exceeded. Transaction aborted.'));
          } else {
            reject(tx.error);
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Retrieves all PENDING mutations for a user, sorted chronologically (FIFO).
   */
  public async getPendingMutations(userId: string): Promise<OfflineQueueItem[]> {
    if (!this.isIndexedDBAvailable) {
      return Array.from(this.memoryQueue.values())
        .filter((item) => item.userId === userId && item.status === 'PENDING')
        .sort((a, b) => a.enqueuedAt.localeCompare(b.enqueuedAt));
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const index = store.index('idx_user_status');
      const request = index.getAll(IDBKeyRange.only([userId, 'PENDING']));

      request.onsuccess = () => {
        const items: OfflineQueueItem[] = request.result || [];
        items.sort((a, b) => a.enqueuedAt.localeCompare(b.enqueuedAt));
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Updates queue item status and retry metadata.
   */
  public async updateItemStatus(
    id: string,
    status: QueueItemStatus,
    extra?: Partial<OfflineQueueItem>
  ): Promise<void> {
    if (!this.isIndexedDBAvailable) {
      const item = this.memoryQueue.get(id);
      if (item) {
        item.status = status;
        if (extra) Object.assign(item, extra);
      }
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item: OfflineQueueItem | undefined = getReq.result;
        if (!item) {
          resolve();
          return;
        }

        item.status = status;
        if (extra) {
          Object.assign(item, extra);
        }

        const putReq = store.put(item);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Removes an acknowledged mutation from the queue.
   */
  public async removeMutation(id: string): Promise<void> {
    if (!this.isIndexedDBAvailable) {
      this.memoryQueue.delete(id);
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Resets in-flight mutations back to PENDING.
   * DEFECT-02 Remediation: Only resets items if force=true (e.g. startup) OR
   * if the item has been stranded in-flight longer than staleTimeoutMs.
   */
  public async resetInFlightMutations(
    userId: string,
    force: boolean = true,
    staleTimeoutMs: number = 30000
  ): Promise<number> {
    const now = Date.now();

    if (!this.isIndexedDBAvailable) {
      let count = 0;
      for (const item of this.memoryQueue.values()) {
        if (item.userId === userId && item.status === 'IN_FLIGHT') {
          const itemTime = new Date(item.enqueuedAt).getTime();
          if (force || now - itemTime > staleTimeoutMs) {
            item.status = 'PENDING';
            count++;
          }
        }
      }
      return count;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const index = store.index('idx_user_status');
      const req = index.getAll(IDBKeyRange.only([userId, 'IN_FLIGHT']));

      req.onsuccess = () => {
        const inFlight: OfflineQueueItem[] = req.result || [];
        let count = 0;
        for (const item of inFlight) {
          const itemTime = new Date(item.enqueuedAt).getTime();
          if (force || now - itemTime > staleTimeoutMs) {
            item.status = 'PENDING';
            store.put(item);
            count++;
          }
        }
        resolve(count);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ==========================================================================
  // CROSS-TAB COORDINATION LEASE API (DEFECT-02)
  // ==========================================================================

  /**
   * Attempts to acquire an exclusive sync drain lease for a user across browser tabs.
   * Acquires a coordination lease with a monotonically increasing fencing token (DEFECT-02).
   * Returns true if lease acquired; false if currently held by another active tab.
   */
  public async acquireLease(userId: string, tabId: string, ttlMs: number = 15000): Promise<boolean> {
    const now = Date.now();
    const expiresAt = new Date(now + ttlMs).toISOString();

    if (!this.isIndexedDBAvailable) {
      const existing = this.memoryLeases.get(userId);
      let fencingToken = 1;
      if (existing) {
        const existingExpires = new Date(existing.expiresAt).getTime();
        if (existing.tabId !== tabId && existingExpires > now) {
          return false; // Active lease held by another tab
        }
        fencingToken = existing.tabId === tabId && existingExpires > now
          ? (existing.fencingToken || 1)
          : (existing.fencingToken || 0) + 1;
      }
      this.memoryLeases.set(userId, {
        userId,
        tabId,
        acquiredAt: new Date(now).toISOString(),
        expiresAt,
        fencingToken,
      });
      return true;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_COORDINATION], 'readwrite');
      const store = tx.objectStore(STORE_COORDINATION);
      const req = store.get(userId);

      req.onsuccess = () => {
        const existing: CrossTabLease | undefined = req.result;
        let fencingToken = 1;
        if (existing) {
          const existingExpires = new Date(existing.expiresAt).getTime();
          if (existing.tabId !== tabId && existingExpires > now) {
            resolve(false); // Active lease held by another tab
            return;
          }
          fencingToken = existing.tabId === tabId && existingExpires > now
            ? (existing.fencingToken || 1)
            : (existing.fencingToken || 0) + 1;
        }

        const newLease: CrossTabLease = {
          userId,
          tabId,
          acquiredAt: new Date(now).toISOString(),
          expiresAt,
          fencingToken,
        };
        const putReq = store.put(newLease);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves current lease state for an account.
   */
  public async getCurrentLease(userId: string): Promise<CrossTabLease | null> {
    if (!this.isIndexedDBAvailable) {
      return this.memoryLeases.get(userId) || null;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_COORDINATION], 'readonly');
      const store = tx.objectStore(STORE_COORDINATION);
      const req = store.get(userId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Continuously validates whether tabId still holds a valid, non-expired lease and matches fencingToken.
   * DEFECT-02 Remediation: Called before every loop iteration and before queue state transitions.
   */
  public async hasValidLease(userId: string, tabId: string, fencingToken?: number): Promise<boolean> {
    const now = Date.now();
    if (!this.isIndexedDBAvailable) {
      const existing = this.memoryLeases.get(userId);
      if (!existing) return false;
      if (existing.tabId !== tabId) return false;
      if (new Date(existing.expiresAt).getTime() <= now) return false;
      if (fencingToken !== undefined && existing.fencingToken !== fencingToken) return false;
      return true;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_COORDINATION], 'readonly');
      const store = tx.objectStore(STORE_COORDINATION);
      const req = store.get(userId);

      req.onsuccess = () => {
        const existing: CrossTabLease | undefined = req.result;
        if (!existing) {
          resolve(false);
          return;
        }
        if (existing.tabId !== tabId) {
          resolve(false);
          return;
        }
        if (new Date(existing.expiresAt).getTime() <= now) {
          resolve(false);
          return;
        }
        if (fencingToken !== undefined && existing.fencingToken !== fencingToken) {
          resolve(false);
          return;
        }
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Renews an existing lease held by tabId, verifying fencingToken if provided.
   */
  public async renewLease(userId: string, tabId: string, fencingToken?: number, ttlMs: number = 15000): Promise<boolean> {
    const now = Date.now();
    const expiresAt = new Date(now + ttlMs).toISOString();

    if (!this.isIndexedDBAvailable) {
      const existing = this.memoryLeases.get(userId);
      if (!existing || existing.tabId !== tabId) return false;
      if (new Date(existing.expiresAt).getTime() <= now) return false;
      if (fencingToken !== undefined && existing.fencingToken !== fencingToken) return false;
      existing.expiresAt = expiresAt;
      return true;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_COORDINATION], 'readwrite');
      const store = tx.objectStore(STORE_COORDINATION);
      const req = store.get(userId);

      req.onsuccess = () => {
        const existing: CrossTabLease | undefined = req.result;
        if (!existing || existing.tabId !== tabId) {
          resolve(false);
          return;
        }
        if (new Date(existing.expiresAt).getTime() <= now) {
          resolve(false); // Stale worker cannot renew an already-expired lease
          return;
        }
        if (fencingToken !== undefined && existing.fencingToken !== fencingToken) {
          resolve(false); // Stale generation
          return;
        }

        existing.expiresAt = expiresAt;
        const putReq = store.put(existing);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Releases a lease held by tabId, verifying fencingToken to prevent stale workers from deleting a new owner's lease.
   */
  public async releaseLease(userId: string, tabId: string, fencingToken?: number): Promise<boolean> {
    if (!this.isIndexedDBAvailable) {
      const existing = this.memoryLeases.get(userId);
      if (existing && existing.tabId === tabId) {
        if (fencingToken !== undefined && existing.fencingToken !== fencingToken) {
          return false;
        }
        this.memoryLeases.delete(userId);
        return true;
      }
      return false;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_COORDINATION], 'readwrite');
      const store = tx.objectStore(STORE_COORDINATION);
      const req = store.get(userId);

      req.onsuccess = () => {
        const existing: CrossTabLease | undefined = req.result;
        if (existing && existing.tabId === tabId) {
          if (fencingToken !== undefined && existing.fencingToken !== fencingToken) {
            resolve(false); // Cannot release a newer generation lease!
            return;
          }
          const delReq = store.delete(userId);
          delReq.onsuccess = () => resolve(true);
          delReq.onerror = () => reject(delReq.error);
        } else {
          resolve(false);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Stores a complete progress snapshot for offline hydration.
   */
  public async saveSnapshot(userId: string, progress: Record<string, LocalPlacementProgress>): Promise<void> {
    const snapshot: UserProgressSnapshot = {
      userId,
      version: 1,
      progress,
      updatedAt: new Date().toISOString(),
    };

    if (!this.isIndexedDBAvailable) {
      this.memorySnapshots.set(userId, snapshot);
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SNAPSHOTS], 'readwrite');
      const store = tx.objectStore(STORE_SNAPSHOTS);
      const req = store.put(snapshot);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves the cached snapshot for a user.
   */
  public async getSnapshot(userId: string): Promise<UserProgressSnapshot | null> {
    if (!this.isIndexedDBAvailable) {
      return this.memorySnapshots.get(userId) || null;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SNAPSHOTS], 'readonly');
      const store = tx.objectStore(STORE_SNAPSHOTS);
      const req = store.get(userId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Records a conflict resolution event into the audit ledger.
   */
  public async recordConflict(entry: ConflictLedgerEntry): Promise<void> {
    if (!this.isIndexedDBAvailable) {
      this.memoryConflicts.set(entry.id, entry);
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_CONFLICTS], 'readwrite');
      const store = tx.objectStore(STORE_CONFLICTS);
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves conflict history for a specific user.
   */
  public async getConflictLedger(userId: string): Promise<ConflictLedgerEntry[]> {
    if (!this.isIndexedDBAvailable) {
      return Array.from(this.memoryConflicts.values())
        .filter((c) => c.userId === userId)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_CONFLICTS], 'readonly');
      const store = tx.objectStore(STORE_CONFLICTS);
      const index = store.index('idx_user_occurred');
      const range = IDBKeyRange.bound([userId, ''], [userId, '\uffff']);
      const req = index.getAll(range);

      req.onsuccess = () => {
        const results: ConflictLedgerEntry[] = req.result || [];
        results.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Purges all queue records for a user (used strictly during full reset or account purge).
   */
  public async clearUserQueue(userId: string): Promise<void> {
    if (!this.isIndexedDBAvailable) {
      for (const [key, item] of this.memoryQueue.entries()) {
        if (item.userId === userId) this.memoryQueue.delete(key);
      }
      this.memorySnapshots.delete(userId);
      for (const [key, item] of this.memoryConflicts.entries()) {
        if (item.userId === userId) this.memoryConflicts.delete(key);
      }
      this.memoryLeases.delete(userId);
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const index = store.index('idx_user_status');
      const cursorReq = index.openCursor(IDBKeyRange.bound([userId, ''], [userId, '\uffff']));

      cursorReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  }
}

export const offlineQueueService = new OfflineQueueService();
