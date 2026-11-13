import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context';
import {
  getPatternStats,
  getProblemProgress,
  difficultyBg,
} from '../store';
import type { CurriculumProblem, StatusOption } from '../types';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileEdit,
} from 'lucide-react';
import ProblemWorkspaceModal from '../components/ProblemWorkspaceModal';
import { studyFrame } from '../lib/studyFrames';

export default function PatternDetail() {
  const { patternId } = useParams<{ patternId: string }>();
  const { state, updateProblem, canEditProgress } = useApp();
  const { curriculum, progress } = state;

  const [activeWorkspace, setActiveWorkspace] = useState<{
    problem: CurriculumProblem;
    variationName: string;
    index: number;
    variationIndex: number;
  } | null>(null);

  if (!curriculum) return null;

  const currentPatternIndex = curriculum.patterns.findIndex((p) => p.id === patternId);
  const pattern = curriculum.patterns[currentPatternIndex];

  if (!pattern) {
    return (
      <div className="panel p-12 text-center space-y-3">
        <p className="text-sm text-text-secondary">Pattern not found in curriculum index.</p>
        <Link to="/patterns" className="btn-primary inline-flex">
          Return to Pattern Explorer
        </Link>
      </div>
    );
  }

  const prevPattern = currentPatternIndex > 0 ? curriculum.patterns[currentPatternIndex - 1] : null;
  const nextPattern =
    currentPatternIndex < curriculum.patterns.length - 1
      ? curriculum.patterns[currentPatternIndex + 1]
      : null;

  const stats = getPatternStats(pattern, progress);
  const completionPct = stats.total > 0 ? ((stats.solved / stats.total) * 100).toFixed(1) : '0.0';

  // Flattened problems for fast linear navigation
  const allProblemsFlat = useMemo(() => {
    const list: { problem: CurriculumProblem; variationName: string }[] = [];
    pattern.variations.forEach((v) => {
      v.problems.forEach((p) => {
        list.push({ problem: p, variationName: v.name });
      });
    });
    return list;
  }, [pattern]);

  const activeProblemFlatIndex = activeWorkspace
    ? allProblemsFlat.findIndex((item) => item.problem.id === activeWorkspace.problem.id)
    : -1;

  const handleNavigateWorkspace = (direction: 'prev' | 'next') => {
    if (activeProblemFlatIndex === -1) return;
    const newIdx = direction === 'prev' ? activeProblemFlatIndex - 1 : activeProblemFlatIndex + 1;
    if (newIdx >= 0 && newIdx < allProblemsFlat.length) {
      const target = allProblemsFlat[newIdx];
      setActiveWorkspace({
        problem: target.problem,
        variationName: target.variationName,
        index: newIdx,
        variationIndex: 0,
      });
    }
  };

  const handleQuickStatusChange = (
    e: React.MouseEvent,
    problemId: string,
    newStatus: StatusOption
  ) => {
    e.stopPropagation();
    updateProblem(problemId, { status: newStatus }, pattern.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Nav Breadcrumb & Pattern Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <Link
          to="/patterns"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> ALL PATTERNS
        </Link>

        {/* Prev / Next pattern quick switcher */}
        <div className="flex items-center gap-2">
          {prevPattern && (
            <Link
              to={`/patterns/${prevPattern.id}`}
              className="btn-secondary text-xxs py-1 px-2.5 font-mono flex items-center gap-1"
              title={prevPattern.name}
            >
              <ChevronLeft className="w-3 h-3" /> Prev Pattern
            </Link>
          )}
          {nextPattern && (
            <Link
              to={`/patterns/${nextPattern.id}`}
              className="btn-secondary text-xxs py-1 px-2.5 font-mono flex items-center gap-1"
              title={nextPattern.name}
            >
              Next Pattern <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Pattern Master Banner Card */}
      <div className="panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-accent">
                PATTERN {String(currentPatternIndex + 1).padStart(2, '0')} OF 21
              </span>
              <span className="text-[10px] font-mono text-text-tertiary">
                {pattern.variations.length} VARIATIONS · {stats.total} TOTAL PROBLEMS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              {pattern.name}
            </h1>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl">
              Hierarchy: <strong>{pattern.name}</strong> &rarr; Sub-Variations &rarr; Targeted Problem Practice
            </p>
          </div>

          {/* Progress metric box */}
          <div className="flex items-center gap-4 bg-surface-2 p-3 rounded-lg border border-border shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-mono text-text-tertiary block">COMPLETION</span>
              <span className="text-lg font-bold font-mono text-text-primary tnum">
                {stats.solved} / {stats.total}
              </span>
            </div>
            <div className="w-24 flex flex-col gap-1">
              <div className="track-bar h-1.5">
                <div
                  className="track-fill bg-accent"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-accent text-right tnum font-semibold">
                {completionPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Difficulty breakdown pills */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border/60 text-xs font-mono text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Easy: <strong className="text-text-primary tnum">{stats.easySolved}</strong>/{stats.easy}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Med: <strong className="text-text-primary tnum">{stats.mediumSolved}</strong>/{stats.medium}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Hard: <strong className="text-text-primary tnum">{stats.hardSolved}</strong>/{stats.hard}
          </span>
          {stats.revisit > 0 && (
            <span className="flex items-center gap-1.5 text-indigo-400 font-medium ml-auto">
              <Clock className="w-3.5 h-3.5" />
              {stats.revisit} Scheduled for Review
            </span>
          )}
        </div>
      </div>

      {/* Variations & Problem Lists */}
      <div className="space-y-4">
        {pattern.variations.map((variation, vIdx) => {
          const varSolvedCount = variation.problems.filter(
            (p) => getProblemProgress(progress, p.id).status === 'solved'
          ).length;
          const frame = studyFrame(pattern.id, variation.name);
          const siblings = pattern.variations.filter((item) => item.id !== variation.id).map((item) => item.name);

          return (
            <div
              key={variation.id}
              className="panel overflow-hidden border-border hover:border-border-hover transition-colors"
            >
              {/* Variation Header */}
              <div className="px-4 py-3 bg-surface-2/60 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <h2 className="text-xs font-bold text-text-primary tracking-tight">
                    Variation {vIdx + 1}: {variation.name}
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-text-tertiary tnum">
                  {varSolvedCount}/{variation.problems.length} SOLVED
                </span>
              </div>
              <div className="px-4 py-3 text-xs text-text-secondary space-y-1 border-b border-border/60 bg-surface-0/40">
                <p><span className="text-text-primary font-medium">Concept. </span>{frame.concept}</p>
                <p><span className="text-text-primary font-medium">Recognize. </span>{frame.recognize} This variation is “{variation.name}”.</p>
                <p><span className="text-text-primary font-medium">Use when. </span>{frame.useWhen}</p>
                <p><span className="text-text-primary font-medium">Avoid when. </span>{frame.avoidWhen}</p>
                <p><span className="text-text-primary font-medium">Mistake. </span>{frame.mistake}</p>
                <p><span className="text-text-primary font-medium">Complexity. </span>{frame.complexity}</p>
                {siblings.length > 0 && (
                  <p><span className="text-text-primary font-medium">Differs from. </span>{siblings.join('; ')}.</p>
                )}
                {vIdx > 0 && (
                  <p><span className="text-text-primary font-medium">Earlier in this pattern. </span>{pattern.variations[vIdx - 1].name}. That order is the curriculum sequence, not a proof that it is a formal prerequisite.</p>
                )}
              </div>

              {/* Problem Rows */}
              <div className="divide-y divide-border/60">
                {variation.problems.map((problem, pIdx) => {
                  const probProgress = getProblemProgress(progress, problem.id);
                  const status = probProgress.status;

                  return (
                    <div
                      key={problem.id}
                      onClick={() =>
                        setActiveWorkspace({
                          problem,
                          variationName: variation.name,
                          index: pIdx,
                          variationIndex: vIdx,
                        })
                      }
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface-1 hover:bg-surface-2/50 cursor-pointer transition-colors group"
                    >
                      {/* Left: Status icon, title, notes snippet */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="pt-0.5 sm:pt-0 shrink-0">
                          {status === 'solved' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : status === 'attempted' ? (
                            <Clock className="w-4 h-4 text-amber-400" />
                          ) : status === 'revisit' ? (
                            <RotateCcw className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-surface-4 block" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                              {problem.title}
                            </span>
                            {probProgress.notes && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-3 text-text-tertiary border border-border">
                                NOTES
                              </span>
                            )}
                            {probProgress.confidence > 0 && (
                              <span className="text-[10px] font-mono text-amber-400">
                                ★{probProgress.confidence}
                              </span>
                            )}
                          </div>
                          {probProgress.approach && (
                            <p className="text-[11px] text-text-tertiary truncate max-w-md mt-0.5 font-mono">
                              {probProgress.approach}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Difficulty badge, Quick Status Changer, Link */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <span className={`badge ${difficultyBg(problem.difficulty)} text-[9px]`}>
                          {problem.difficulty}
                        </span>

                        {/* Status Select dropdown */}
                        <select
                          value={status}
                          disabled={!canEditProgress}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleQuickStatusChange(
                              e as any,
                              problem.id,
                              e.target.value as StatusOption
                            )
                          }
                          className="bg-surface-2 border border-border text-text-secondary hover:text-text-primary text-[11px] font-mono rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:border-accent"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="attempted">Attempted</option>
                          <option value="solved">Solved</option>
                          <option value="revisit">Needs Revision</option>
                        </select>

                        {/* Open Problem Workspace button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveWorkspace({
                              problem,
                              variationName: variation.name,
                              index: pIdx,
                              variationIndex: vIdx,
                            });
                          }}
                          className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-3 rounded-md transition-colors"
                          title="Open workspace"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </button>

                        {/* External LeetCode link */}
                        <a
                          href={problem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-text-tertiary hover:text-accent hover:bg-surface-3 rounded-md transition-colors"
                          title="Open original problem in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Workspace modal */}
      {activeWorkspace && (
        <ProblemWorkspaceModal
          problem={activeWorkspace.problem}
          patternId={pattern.id}
          patternName={pattern.name}
          variationName={activeWorkspace.variationName}
          onClose={() => setActiveWorkspace(null)}
          onNavigate={handleNavigateWorkspace}
          hasPrev={activeProblemFlatIndex > 0}
          hasNext={activeProblemFlatIndex < allProblemsFlat.length - 1}
        />
      )}
    </div>
  );
}
