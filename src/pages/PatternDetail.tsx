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
  const { state, updateProblem } = useApp();
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

  const label = 'text-[12px] text-text-tertiary';
  const statusCell = (st: string) =>
    st === 'solved'
      ? 'bg-accent'
      : st === 'revisit'
      ? 'bg-accent/40'
      : st === 'attempted'
      ? 'bg-warning/70'
      : 'bg-surface-4';

  return (
    <div className="space-y-14 animate-fade-in pb-10">
      {/* Navigator */}
      <div className="flex items-center justify-between">
        <Link
          to="/patterns"
          className="inline-flex items-center gap-1.5 text-[12px] text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All patterns
        </Link>
        <div className="flex items-center gap-1">
          {prevPattern && (
            <Link to={`/patterns/${prevPattern.id}`} className="btn-ghost" title={prevPattern.name}>
              <ChevronLeft className="w-3 h-3" /> Previous
            </Link>
          )}
          {nextPattern && (
            <Link to={`/patterns/${nextPattern.id}`} className="btn-ghost" title={nextPattern.name}>
              Next <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-8">
        <div className="lg:col-span-7">
          <p className={`${label} tnum`}>
            Pattern {String(currentPatternIndex + 1).padStart(2, '0')} of {curriculum.patterns.length}
            <span className="text-text-quaternary"> · </span>
            {pattern.variations.length} variations
            <span className="text-text-quaternary"> · </span>
            {stats.total} problems
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tighter leading-[1.05] text-text-primary">
            {pattern.name}
          </h1>
          <p className="mt-4 text-sm text-text-secondary max-w-xl">
            {pattern.name} <span className="text-text-quaternary">&rarr;</span> sub-variations{' '}
            <span className="text-text-quaternary">&rarr;</span> targeted problem practice.
          </p>
        </div>

        <div className="lg:col-span-5 lg:pl-10 lg:border-l border-border">
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-semibold tracking-tighter leading-none text-text-primary tnum">
              {stats.solved}
            </span>
            <span className="text-xl text-text-tertiary tnum">/ {stats.total}</span>
            <span className="ml-auto text-sm text-accent tnum">{completionPct}%</span>
          </div>

          {/* Problem strip: one cell per problem, coloured by status */}
          <div className="mt-6 flex flex-wrap gap-[3px]" aria-label="Problem status strip">
            {pattern.variations.flatMap((v) =>
              v.problems.map((pr) => {
                const st = getProblemProgress(progress, pr.id).status;
                return (
                  <span
                    key={pr.id}
                    title={`${pr.title} · ${st.replace('_', ' ')}`}
                    className={`h-2.5 w-2.5 rounded-[3px] ${statusCell(st)}`}
                    style={st === 'solved' ? { boxShadow: '0 0 8px rgba(255,106,61,0.4)' } : undefined}
                  />
                );
              })
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-text-tertiary tnum">
            <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-2" />Easy {stats.easySolved}/{stats.easy}</span>
            <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-warning mr-2" />Medium {stats.mediumSolved}/{stats.medium}</span>
            <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-danger mr-2" />Hard {stats.hardSolved}/{stats.hard}</span>
            {stats.revisit > 0 && (
              <span className="text-accent inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {stats.revisit} scheduled for review
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Variations */}
      <div className="space-y-16">
        {pattern.variations.map((variation, vIdx) => {
          const varSolvedCount = variation.problems.filter(
            (p) => getProblemProgress(progress, p.id).status === 'solved'
          ).length;
          const frame = studyFrame(pattern.id, variation.name);
          const siblings = pattern.variations.filter((item) => item.id !== variation.id).map((item) => item.name);
          const term = 'text-[12px] text-text-tertiary mb-1';
          const desc = 'text-sm text-text-secondary leading-relaxed';

          return (
            <section key={variation.id}>
              <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-border">
                <h2 className="text-xl font-semibold tracking-tighter text-text-primary">
                  <span className="text-text-quaternary tnum mr-3">{String(vIdx + 1).padStart(2, '0')}</span>
                  {variation.name}
                </h2>
                <span className="text-[12px] text-text-tertiary tnum shrink-0">
                  {varSolvedCount}/{variation.problems.length} solved
                </span>
              </div>

              <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                <div className="md:col-span-2">
                  <p className={term}>Concept</p>
                  <p className="text-[15px] text-text-primary leading-relaxed">{frame.concept}</p>
                </div>
                <div>
                  <p className={term}>Recognize</p>
                  <p className={desc}>{frame.recognize} This variation is “{variation.name}”.</p>
                </div>
                <div>
                  <p className={term}>Use when</p>
                  <p className={desc}>{frame.useWhen}</p>
                </div>
                <div>
                  <p className={term}>Avoid when</p>
                  <p className={desc}>{frame.avoidWhen}</p>
                </div>
                <div>
                  <p className={term}>Mistake</p>
                  <p className={desc}>{frame.mistake}</p>
                </div>
                <div>
                  <p className={term}>Complexity</p>
                  <p className={`${desc} tnum`}>{frame.complexity}</p>
                </div>
                {siblings.length > 0 && (
                  <div>
                    <p className={term}>Differs from</p>
                    <p className={desc}>{siblings.join('; ')}.</p>
                  </div>
                )}
                {vIdx > 0 && (
                  <div className="md:col-span-2">
                    <p className={term}>Earlier in this pattern</p>
                    <p className={desc}>{pattern.variations[vIdx - 1].name}. That order is the curriculum sequence, not a proof that it is a formal prerequisite.</p>
                  </div>
                )}
              </div>

              {/* Problem rows */}
              <div className="divide-y divide-border border-y border-border">
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
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        <div className="pt-0.5 sm:pt-0 shrink-0">
                          {status === 'solved' ? (
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                          ) : status === 'attempted' ? (
                            <Clock className="w-4 h-4 text-warning" />
                          ) : status === 'revisit' ? (
                            <RotateCcw className="w-4 h-4 text-accent" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-surface-5 block" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm text-text-primary group-hover:text-accent transition-colors truncate">
                              {problem.title}
                            </span>
                            {probProgress.notes && (
                              <span className="text-[11px] text-text-tertiary border border-border rounded px-1.5">
                                Notes
                              </span>
                            )}
                            {probProgress.confidence > 0 && (
                              <span className="text-[11px] text-warning tnum">
                                ★{probProgress.confidence}
                              </span>
                            )}
                          </div>
                          {probProgress.approach && (
                            <p className="text-[12px] text-text-tertiary truncate max-w-md mt-0.5">
                              {probProgress.approach}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <span className={`badge ${difficultyBg(problem.difficulty)} text-[9px]`}>
                          {problem.difficulty}
                        </span>

                        <select
                          value={status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleQuickStatusChange(
                              e as any,
                              problem.id,
                              e.target.value as StatusOption
                            )
                          }
                          className="bg-surface-1 border border-border text-text-secondary hover:text-text-primary text-[12px] rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:border-accent"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="attempted">Attempted</option>
                          <option value="solved">Solved</option>
                          <option value="revisit">Needs Revision</option>
                        </select>

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
            </section>
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
