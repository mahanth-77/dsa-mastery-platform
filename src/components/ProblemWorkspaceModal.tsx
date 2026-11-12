import React, { useState, useEffect } from 'react';
import type { CurriculumProblem, StatusOption } from '../types';
import { useApp } from '../context';
import {
  getProblemProgress,
  difficultyBg,
  statusLabel,
} from '../store';
import { studyFrame } from '../lib/studyFrames';
import { hasDemonstratedRecall } from '../lib/learningSignals';
import {
  X,
  ExternalLink,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  Star,
  Save,
  Sparkles,
  FileCode,
} from 'lucide-react';

interface ProblemWorkspaceModalProps {
  problem: CurriculumProblem | null;
  patternId: string;
  patternName: string;
  variationName: string;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const CONFIDENCE_LEVELS = [
  { level: 1, label: 'Struggled' },
  { level: 2, label: 'Needed Hints' },
  { level: 3, label: 'Optimal' },
  { level: 4, label: 'Fluent' },
  { level: 5, label: 'Instant Recall' },
];

export default function ProblemWorkspaceModal({
  problem,
  patternId,
  patternName,
  variationName,
  onClose,
  onNavigate,
  hasPrev = false,
  hasNext = false,
}: ProblemWorkspaceModalProps) {
  const { state, updateProblem } = useApp();

  if (!problem) return null;

  const currentProgress = getProblemProgress(state.progress, problem.id);

  const [status, setStatus] = useState<StatusOption>(currentProgress.status);
  const [attempts, setAttempts] = useState<number>(currentProgress.attempts);
  const [notes, setNotes] = useState<string>(currentProgress.notes || '');
  const [approach, setApproach] = useState<string>(currentProgress.approach || '');
  const [timeComplexity, setTimeComplexity] = useState<string>(currentProgress.timeComplexity || '');
  const [spaceComplexity, setSpaceComplexity] = useState<string>(currentProgress.spaceComplexity || '');
  const [confidence, setConfidence] = useState<number>(currentProgress.confidence || 0);
  const [nextRevisionAt, setNextRevisionAt] = useState<string>(currentProgress.nextRevisionAt || '');
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const prog = getProblemProgress(state.progress, problem.id);
    setStatus(prog.status);
    setAttempts(prog.attempts);
    setNotes(prog.notes || '');
    setApproach(prog.approach || '');
    setTimeComplexity(prog.timeComplexity || '');
    setSpaceComplexity(prog.spaceComplexity || '');
    setConfidence(prog.confidence || 0);
    setNextRevisionAt(prog.nextRevisionAt || '');
    setSavedToast(false);
  }, [problem.id, state.progress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'ArrowLeft' && hasPrev && onNavigate && (e.altKey || e.metaKey)) {
        onNavigate('prev');
      }
      if (e.key === 'ArrowRight' && hasNext && onNavigate && (e.altKey || e.metaKey)) {
        onNavigate('next');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate, hasPrev, hasNext, status, attempts, notes, approach, timeComplexity, spaceComplexity, confidence, nextRevisionAt]);

  const handleSave = () => {
    updateProblem(
      problem.id,
      {
        status,
        attempts,
        notes,
        approach,
        timeComplexity,
        spaceComplexity,
        confidence,
        nextRevisionAt: nextRevisionAt ? nextRevisionAt : null,
      },
      patternId
    );
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleStatusChange = (newStatus: StatusOption) => {
    setStatus(newStatus);
    let revDate = nextRevisionAt;
    if (newStatus === 'solved' && !nextRevisionAt) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      revDate = tomorrow.toISOString().slice(0, 10);
      setNextRevisionAt(revDate);
    }
    updateProblem(
      problem.id,
      {
        status: newStatus,
        nextRevisionAt: revDate ? revDate : null,
      },
      patternId
    );
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  };

  const setRevisionIntervalDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().slice(0, 10);
    setNextRevisionAt(dateStr);
    updateProblem(
      problem.id,
      { nextRevisionAt: dateStr },
      patternId
    );
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl my-auto bg-surface-1 border border-border rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`badge ${difficultyBg(problem.difficulty)} text-[10px]`}>
              {problem.difficulty}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-text-primary truncate tracking-tight">
                {problem.title}
              </h2>
              <p className="text-[10px] font-mono text-text-tertiary truncate">
                {patternName} &rsaquo; {variationName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigate && (
              <div className="flex items-center gap-0.5 bg-surface-2 border border-border rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => onNavigate('prev')}
                  disabled={!hasPrev}
                  className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-tertiary rounded"
                  aria-label="Previous problem"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('next')}
                  disabled={!hasNext}
                  className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-tertiary rounded"
                  aria-label="Next problem"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          <div className="text-xs text-text-secondary space-y-1">
            <p>
              <a className="text-accent underline" href={problem.url} target="_blank" rel="noopener noreferrer">Open the original problem</a>
              . The statement stays on that site. This workspace stores your notes only.
            </p>
            <p><span className="text-text-primary font-medium">Why this variation. </span>{studyFrame(patternId, variationName).recognize} You are practicing “{variationName}”.</p>
            <p><span className="text-text-primary font-medium">Concept. </span>{studyFrame(patternId, variationName).concept}</p>
            <p>{hasDemonstratedRecall(currentProgress) ? 'A review with confidence 4 or 5 is recorded for this placement.' : 'Solved is not mastery. Recall is a completed review with confidence 4 or 5.'}</p>
          </div>
          {/* Quick Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-surface-0 border border-border">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
                Status:
              </span>
              <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-border-subtle">
                {(['not_started', 'attempted', 'solved', 'revisit'] as StatusOption[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                      status === st
                        ? 'bg-accent text-accent-text font-bold shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {statusLabel(st)}
                  </button>
                ))}
              </div>
            </div>

            <a
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1 px-3"
            >
              <ExternalLink className="w-3 h-3 text-accent" />
              Open LeetCode
            </a>
          </div>

          {/* Metrics Matrix: Attempts, Confidence, Revision Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Attempts */}
            <div className="panel p-3 bg-surface-0/60">
              <label className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block mb-1">
                Total Attempts
              </label>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold font-mono text-text-primary tnum">{attempts}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAttempts((prev) => Math.max(0, prev - 1))}
                    className="w-6 h-6 flex items-center justify-center rounded bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 font-mono text-xs"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttempts((prev) => prev + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 font-mono text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div className="panel p-3 bg-surface-0/60">
              <label className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block mb-1">
                Confidence Level
              </label>
              <div className="flex items-center gap-1 pt-0.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setConfidence(lvl)}
                    className="p-1 text-text-tertiary hover:text-amber-400 transition-colors"
                    title={CONFIDENCE_LEVELS[lvl - 1].label}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        lvl <= confidence
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-surface-4'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-[11px] font-mono text-text-secondary ml-1.5">
                  {confidence > 0 ? CONFIDENCE_LEVELS[confidence - 1]?.label : 'Unrated'}
                </span>
              </div>
            </div>

            {/* Next Revision */}
            <div className="panel p-3 bg-surface-0/60">
              <label className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block mb-1">
                Next Review Due
              </label>
              <input
                type="date"
                value={nextRevisionAt}
                onChange={(e) => setNextRevisionAt(e.target.value)}
                className="w-full text-xs font-mono bg-surface-2 border border-border rounded px-2 py-0.5 text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Quick Spaced Repetition Scheduling Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-mono text-text-tertiary flex items-center gap-1 mr-1">
              <Clock className="w-3 h-3 text-text-quaternary" /> Presets:
            </span>
            {[
              { label: '+1 Day', days: 1 },
              { label: '+3 Days', days: 3 },
              { label: '+1 Week', days: 7 },
              { label: '+2 Weeks', days: 14 },
              { label: '+1 Month', days: 30 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setRevisionIntervalDays(preset.days)}
                className="btn-subtle text-[10px] font-mono py-0.5 px-2"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Complexity Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mb-1 font-mono">
                <Cpu className="w-3 h-3 text-accent" /> Time Complexity
              </label>
              <input
                type="text"
                placeholder="e.g. O(n log n), O(V + E)"
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                className="input-field font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mb-1 font-mono">
                <Layers className="w-3 h-3 text-accent" /> Space Complexity
              </label>
              <input
                type="text"
                placeholder="e.g. O(1) in-place, O(n)"
                value={spaceComplexity}
                onChange={(e) => setSpaceComplexity(e.target.value)}
                className="input-field font-mono text-xs"
              />
            </div>
          </div>

          {/* Core Pattern & Intuition */}
          <div>
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mb-1 font-mono">
              <Sparkles className="w-3 h-3 text-accent" /> Algorithmic Pattern & Invariant
            </label>
            <textarea
              rows={3}
              placeholder="What is the core algorithmic invariant? (e.g. two pointers starting from ends, prefix sum with hashmap count, monotonic stack for next greater element)"
              value={approach}
              onChange={(e) => setApproach(e.target.value)}
              className="input-field text-xs resize-y font-mono"
            />
          </div>

          {/* Personal Solution Notes / Edge Cases */}
          <div>
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mb-1 font-mono">
              <FileCode className="w-3 h-3 text-accent" /> Personal Notes & Edge Cases
            </label>
            <textarea
              rows={4}
              placeholder="Edge cases: duplicates, empty array, negative integers, zero division, off-by-one pointer bounds..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field text-xs resize-y font-mono"
            />
          </div>

          {/* Past Review History Log */}
          {currentProgress.reviewHistory && currentProgress.reviewHistory.length > 0 && (
            <div className="panel p-3 bg-surface-0/60 space-y-1.5">
              <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block">
                Review History ({currentProgress.reviewHistory.length} sessions)
              </span>
              <div className="space-y-1">
                {currentProgress.reviewHistory.map((rev, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
                    <span>{rev.date}</span>
                    <span className="text-amber-400">Score: {rev.confidence}/5</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-0">
          <div className="flex items-center gap-2">
            {savedToast && (
              <span className="text-xs text-accent flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">CHANGES PERSISTED</span>
              </span>
            )}
            {currentProgress.lastSolvedAt && !savedToast && (
              <span className="text-[11px] font-mono text-text-tertiary">
                Solved on {new Date(currentProgress.lastSolvedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary text-xs"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
