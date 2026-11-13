import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { syncProgressSnapshot } from './services/cloudProgressSyncService';
import type { CurriculumData, UserProgress, ProblemProgress, StatusOption } from './types';
import rawCurriculum from '../dsa_pattern_mastery_tracker.json';
import {
  loadProgress,
  saveProgress,
  updateProblemProgress,
  completeRevision as completeRevisionFn,
  defaultUserProgress,
  defaultSettings,
  validateCurriculum,
  getProgressStorageKey,
} from './store';

interface AppState {
  curriculum: CurriculumData | null;
  progress: UserProgress;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_CURRICULUM'; payload: CurriculumData }
  | { type: 'SET_PROGRESS'; payload: UserProgress }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_PROBLEM'; problemId: string; update: Partial<ProblemProgress>; patternId: string }
  | { type: 'COMPLETE_REVISION'; problemId: string; confidence: number; patternId: string }
  | { type: 'CLEAR_PROGRESS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserProgress['settings']> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CURRICULUM':
      return { ...state, curriculum: action.payload, loading: false };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_PROBLEM': {
      const newProgress = updateProblemProgress(
        state.progress,
        action.problemId,
        action.update,
        action.patternId
      );
      return { ...state, progress: newProgress };
    }
    case 'COMPLETE_REVISION': {
      const newProgress = completeRevisionFn(
        state.progress,
        action.problemId,
        action.confidence,
        action.patternId
      );
      return { ...state, progress: newProgress };
    }
    case 'CLEAR_PROGRESS': {
      return { ...state, progress: defaultUserProgress() };
    }
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        progress: {
          ...state.progress,
          settings: { ...state.progress.settings, ...action.payload },
        },
      };
    }
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  updateProblem: (problemId: string, update: Partial<ProblemProgress>, patternId: string) => void;
  completeRevision: (problemId: string, confidence: number, patternId: string) => void;
  accountReady: boolean;
  canEditProgress: boolean;
  activeStorageKey: string;
  cloudSyncStatus: 'local-only' | 'connecting' | 'syncing' | 'synced' | 'offline';
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [activeStorageKey, setActiveStorageKey] = useState(getProgressStorageKey(null));
  const [hydratedUserId, setHydratedUserId] = useState<string | null | undefined>(undefined);
  const [cloudReadyUserId, setCloudReadyUserId] = useState<string | null | undefined>(undefined);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'local-only' | 'connecting' | 'syncing' | 'synced' | 'offline'>('connecting');
  const activeUserId = user?.id ?? null;
  const accountReady = !authLoading && hydratedUserId === activeUserId;
  const [state, dispatch] = useReducer(reducer, {
    curriculum: null,
    progress: loadProgress(),
    loading: true,
    error: null,
  });

  // Load the correct local namespace only after Supabase has restored the session.
  // Guest data remains untouched and is never copied into an account automatically.
  useEffect(() => {
    if (authLoading) return;
    const storageKey = getProgressStorageKey(activeUserId);
    setActiveStorageKey(storageKey);
    dispatch({ type: 'SET_PROGRESS', payload: loadProgress(storageKey) });
    setHydratedUserId(activeUserId);
  }, [authLoading, activeUserId]);

  // Load curriculum
  useEffect(() => {
    try {
      const data = validateCurriculum(rawCurriculum);
      dispatch({ type: 'SET_CURRICULUM', payload: data });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load curriculum: ${err.message}` });
    }
  }, []);

  // Restore and reconcile the authenticated account snapshot before enabling edits.
  // If the network is unavailable, retain the account's local copy and allow offline work.
  useEffect(() => {
    if (!accountReady) return;
    if (!activeUserId) {
      setCloudReadyUserId(null);
      setCloudSyncStatus('local-only');
      return;
    }

    let cancelled = false;
    const storageKey = getProgressStorageKey(activeUserId);
    const localSnapshot = loadProgress(storageKey);
    setCloudSyncStatus('syncing');

    syncProgressSnapshot(localSnapshot)
      .then((result) => {
        if (cancelled) return;
        saveProgress(result.progress, storageKey);
        dispatch({ type: 'SET_PROGRESS', payload: result.progress });
        setCloudReadyUserId(activeUserId);
        setCloudSyncStatus('synced');
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('[VERTEX Sync] Cloud hydration failed; continuing with local account progress.', error);
        setCloudReadyUserId(activeUserId);
        setCloudSyncStatus('offline');
      });

    return () => { cancelled = true; };
  }, [accountReady, activeUserId]);

  // Guest mode is read-only. Never rewrite legacy guest data merely because the
  // app mounted; only authenticated account namespaces are persisted.
  useEffect(() => {
    if (user && !authLoading && accountReady && cloudReadyUserId === activeUserId) {
      saveProgress(state.progress, activeStorageKey);
    }
  }, [state.progress, activeStorageKey, accountReady, authLoading, user, cloudReadyUserId, activeUserId]);

  // Debounced snapshot sync. Every save is version-checked in Postgres; concurrent
  // devices merge and retry instead of silently overwriting each other's records.
  useEffect(() => {
    if (!user || !accountReady || cloudReadyUserId !== activeUserId) return;
    let cancelled = false;
    const snapshot = state.progress;
    const timeout = window.setTimeout(() => {
      setCloudSyncStatus('syncing');
      syncProgressSnapshot(snapshot)
        .then((result) => {
          if (cancelled || activeUserId !== user.id) return;
          saveProgress(result.progress, activeStorageKey);
          if (JSON.stringify(result.progress) !== JSON.stringify(snapshot)) {
            dispatch({ type: 'SET_PROGRESS', payload: result.progress });
          }
          setCloudSyncStatus('synced');
        })
        .catch((error) => {
          if (!cancelled) {
            console.warn('[VERTEX Sync] Cloud save failed; changes remain in local account storage.', error);
            setCloudSyncStatus('offline');
          }
        });
    }, 900);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [state.progress, user, accountReady, cloudReadyUserId, activeUserId, activeStorageKey]);

  const canEditProgress = Boolean(user && !authLoading && accountReady && cloudReadyUserId === activeUserId);

  // Expose a guarded dispatcher so guest UI cannot mutate or clear legacy progress.
  const guardedDispatch = useCallback((action: Action) => {
    if (!canEditProgress && (
      action.type === 'SET_PROGRESS'
      || action.type === 'UPDATE_PROBLEM'
      || action.type === 'COMPLETE_REVISION'
      || action.type === 'CLEAR_PROGRESS'
      || action.type === 'UPDATE_SETTINGS'
    )) {
      return;
    }
    dispatch(action);
  }, [canEditProgress]);

  const updateProblem = useCallback(
    (problemId: string, update: Partial<ProblemProgress>, patternId: string) => {
      if (!canEditProgress) return;
      dispatch({ type: 'UPDATE_PROBLEM', problemId, update, patternId });
    },
    [canEditProgress]
  );

  const completeRevisionCb = useCallback(
    (problemId: string, confidence: number, patternId: string) => {
      if (!canEditProgress) return;
      dispatch({ type: 'COMPLETE_REVISION', problemId, confidence, patternId });
    },
    [canEditProgress]
  );

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch: guardedDispatch,
        updateProblem,
        completeRevision: completeRevisionCb,
        accountReady,
        canEditProgress,
        activeStorageKey,
        cloudSyncStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
