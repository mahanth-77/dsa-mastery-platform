import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useApp } from '../context';
import { useAuth } from './AuthContext';
import { accountApi, ApiError } from '../lib/accountApi';
import { mergeProgress, progressFingerprint, sameProgress } from '../lib/syncMerge';
import { defaultUserProgress } from '../store';
import type { UserProgress } from '../types';

/**
 * Keeps personal progress in step across devices while signed in.
 *
 * Model: pull the server copy, merge it with the local copy (see lib/syncMerge),
 * apply the result locally, and push it back with the revision we read. If another
 * device wrote in between, the server answers 409 with its latest copy and we merge again.
 * Progress always stays in the browser first; sync is an addition, never a requirement.
 */

const META_KEY = 'vertex-sync-meta';

interface Meta {
  /** The account this browser last synced with. */
  userId: string | null;
  /** Bumped when progress is reset, so a reset beats older copies on other devices. */
  epoch: number;
  pendingReset: boolean;
  lastSyncedAt: string | null;
}

const emptyMeta = (): Meta => ({ userId: null, epoch: 0, pendingReset: false, lastSyncedAt: null });

function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return emptyMeta();
    const m = JSON.parse(raw);
    return {
      userId: typeof m.userId === 'string' ? m.userId : null,
      epoch: Number.isInteger(m.epoch) ? m.epoch : 0,
      pendingReset: m.pendingReset === true,
      lastSyncedAt: typeof m.lastSyncedAt === 'string' ? m.lastSyncedAt : null,
    };
  } catch {
    return emptyMeta();
  }
}

function saveMeta(meta: Meta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* storage full or blocked: sync still works for this session */
  }
}

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'offline' | 'error';

interface SyncContextType {
  status: SyncStatus;
  lastSyncedAt: string | null;
  syncNow: () => Promise<boolean>;
  /** Call right after progress has been reset locally. */
  afterReset: () => void;
  /** Saves progress, ends the session, then clears this browser's copy if it was saved. */
  signOut: () => Promise<{ clearedLocal: boolean }>;
  deleteAccount: () => Promise<boolean>;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useApp();
  const auth = useAuth();
  const user = auth.user;

  const [status, setStatus] = useState<SyncStatus>('off');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => loadMeta().lastSyncedAt);

  const progressRef = useRef<UserProgress>(state.progress);
  progressRef.current = state.progress;
  const userRef = useRef(user);
  userRef.current = user;
  const clearUserRef = useRef(auth.clearUser);
  clearUserRef.current = auth.clearUser;

  const runningRef = useRef<Promise<boolean> | null>(null);
  const rerunRef = useRef(false);
  /** Fingerprint of the progress as last confirmed on the server. */
  const syncedKeyRef = useRef<string | null>(null);
  const lastRunAtRef = useRef(0);

  const runSync = useCallback(
    function run(): Promise<boolean> {
      if (!userRef.current) return Promise.resolve(false);
      if (runningRef.current) {
        rerunRef.current = true;
        return runningRef.current;
      }
      lastRunAtRef.current = Date.now();

      const execute = async (): Promise<boolean> => {
        const account = userRef.current;
        if (!account) return false;
        setStatus('syncing');
        try {
          let meta = loadMeta();
          if (meta.userId && meta.userId !== account.id) {
            // Leftovers from a different account on this browser must never be merged in.
            meta = { ...emptyMeta(), userId: account.id };
            const blank = defaultUserProgress();
            progressRef.current = blank;
            dispatch({ type: 'SET_PROGRESS', payload: blank });
          } else if (!meta.userId) {
            meta = { ...meta, userId: account.id }; // first sign-in: adopt this browser's progress
          }
          const hasSyncedBefore = meta.userId === account.id && !!meta.lastSyncedAt;

          let remote = await accountApi.getProgress();

          for (let attempt = 0; attempt < 4; attempt++) {
            const local = progressRef.current;
            let merged: UserProgress;
            let epoch: number;

            if (!remote.data) {
              merged = local; // brand-new account: this browser's progress becomes the first copy
              epoch = Math.max(meta.epoch, remote.epoch);
            } else if (meta.pendingReset) {
              merged = local; // we reset: our (empty) copy wins over older copies
              epoch = remote.epoch + 1;
            } else if (remote.epoch > meta.epoch && hasSyncedBefore) {
              merged = remote.data; // another device reset: its copy wins
              epoch = remote.epoch;
            } else if (remote.epoch < meta.epoch) {
              merged = local;
              epoch = meta.epoch;
            } else {
              merged = mergeProgress(local, remote.data);
              epoch = Math.max(meta.epoch, remote.epoch);
            }

            if (!sameProgress(merged, local)) {
              progressRef.current = merged;
              dispatch({ type: 'SET_PROGRESS', payload: merged });
            }

            const needsPush = !remote.data || epoch !== remote.epoch || !sameProgress(merged, remote.data);
            if (needsPush) {
              try {
                const res = await accountApi.putProgress(remote.rev, epoch, merged);
                remote = { rev: res.rev, epoch: res.epoch, data: merged };
              } catch (err) {
                if (err instanceof ApiError && err.status === 409 && err.body && 'rev' in err.body) {
                  remote = { rev: err.body.rev, epoch: err.body.epoch, data: err.body.data };
                  continue; // someone else wrote first: merge again
                }
                throw err;
              }
            }

            const now = new Date().toISOString();
            meta = { userId: account.id, epoch, pendingReset: false, lastSyncedAt: now };
            saveMeta(meta);
            syncedKeyRef.current = progressFingerprint(progressRef.current);
            setLastSyncedAt(now);
            setStatus('synced');
            return true;
          }
          setStatus('error'); // kept losing the race; the next trigger will retry
          return false;
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            clearUserRef.current();
            setStatus('off');
          } else if (err instanceof TypeError || (err instanceof ApiError && err.status >= 500)) {
            setStatus('offline');
          } else {
            setStatus('error');
          }
          return false;
        }
      };

      const p = execute().finally(() => {
        runningRef.current = null;
        if (rerunRef.current) {
          rerunRef.current = false;
          void run();
        }
      });
      runningRef.current = p;
      return p;
    },
    [dispatch]
  );

  // Sign-in (or page load while signed in): do a full sync.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (userId) {
      syncedKeyRef.current = null;
      void runSync();
    } else {
      setStatus('off');
    }
  }, [userId, runSync]);

  // Local edits: push shortly after they stop.
  useEffect(() => {
    if (!userId) return;
    if (syncedKeyRef.current === null) return; // the initial sync has not finished yet
    if (progressFingerprint(state.progress) === syncedKeyRef.current) return;
    const t = window.setTimeout(() => void runSync(), 2000);
    return () => window.clearTimeout(t);
  }, [state.progress, userId, runSync]);

  // Pick up changes from other devices when this tab is used again.
  useEffect(() => {
    if (!userId) return;
    const refocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRunAtRef.current > 30_000) void runSync();
    };
    const online = () => void runSync();
    window.addEventListener('focus', refocus);
    document.addEventListener('visibilitychange', refocus);
    window.addEventListener('online', online);
    return () => {
      window.removeEventListener('focus', refocus);
      document.removeEventListener('visibilitychange', refocus);
      window.removeEventListener('online', online);
    };
  }, [userId, runSync]);

  const afterReset = useCallback(() => {
    if (!userRef.current) return;
    saveMeta({ ...loadMeta(), pendingReset: true });
    // Let React apply the reset to state before we read it.
    window.setTimeout(() => void runSync(), 50);
  }, [runSync]);

  const signOut = useCallback(async () => {
    let clearedLocal = false;
    if (userRef.current) {
      await runSync();
      clearedLocal = syncedKeyRef.current === progressFingerprint(progressRef.current);
    }
    await auth.endSession();
    syncedKeyRef.current = null;
    if (clearedLocal) dispatch({ type: 'CLEAR_PROGRESS' });
    setStatus('off');
    return { clearedLocal };
  }, [auth, dispatch, runSync]);

  const deleteAccount = useCallback(async () => {
    try {
      await accountApi.deleteAccount();
    } catch {
      return false;
    }
    auth.clearUser();
    saveMeta(emptyMeta());
    setLastSyncedAt(null);
    syncedKeyRef.current = null;
    setStatus('off');
    return true; // this browser keeps its local progress
  }, [auth]);

  return (
    <SyncContext.Provider value={{ status, lastSyncedAt, syncNow: runSync, afterReset, signOut, deleteAccount }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextType {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within a SyncProvider');
  return ctx;
}
