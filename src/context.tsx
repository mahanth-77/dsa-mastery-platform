import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { CurriculumData, UserProgress, ProblemProgress, StatusOption } from './types';
import rawCurriculum from '../dsa_pattern_mastery_tracker.json';
import {
  loadProgress,
  saveProgress,
  updateProblemProgress,
  completeRevision as completeRevisionFn,
  defaultUserProgress,
  clearProgress as clearProgressFn,
  defaultSettings,
  validateCurriculum,
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
      clearProgressFn();
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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    curriculum: null,
    progress: loadProgress(),
    loading: true,
    error: null,
  });

  // Load curriculum
  useEffect(() => {
    try {
      const data = validateCurriculum(rawCurriculum);
      dispatch({ type: 'SET_CURRICULUM', payload: data });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load curriculum: ${err.message}` });
    }
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    saveProgress(state.progress);
  }, [state.progress]);

  const updateProblem = useCallback(
    (problemId: string, update: Partial<ProblemProgress>, patternId: string) => {
      dispatch({ type: 'UPDATE_PROBLEM', problemId, update, patternId });
    },
    []
  );

  const completeRevisionCb = useCallback(
    (problemId: string, confidence: number, patternId: string) => {
      dispatch({ type: 'COMPLETE_REVISION', problemId, confidence, patternId });
    },
    []
  );

  return (
    <AppContext.Provider
      value={{ state, dispatch, updateProblem, completeRevision: completeRevisionCb }}
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
