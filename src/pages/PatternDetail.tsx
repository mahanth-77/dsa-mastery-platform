import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context';
import { getPatternStats, getProblemProgress } from '../store';
import type { CurriculumProblem, StatusOption } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, FileEdit } from 'lucide-react';
import ProblemWorkspaceModal from '../components/ProblemWorkspaceModal';
import PatternPlate from '../components/PatternPlate';
import { studyFrame } from '../lib/studyFrames';

const linkCls =
  'text-[16px] italic text-text-tertiary hover:text-text-primary transition-colors inline-flex items-center gap-1.5';

/** Tick colour per status: bone = solved, ring = needs review, dim = attempted, outline = not started. */
function tickStyle(status: StatusOption): React.CSSProperties {
  switch (status) {
    case 'solved':
      return { background: '#e9e4d8', borderColor: '#e9e4d8' };
    case 'revisit':
      return { background: 'transparent', borderColor: '#ff5b2e' };
    case 'attempted':
      return { background: 'rgba(233,228,216,.38)', borderColor: 'rgba(233,228,216,.38)' };
    default:
      return { background: 'transparent', borderColor: 'rgba(233,228,216,.26)' };
  }
}

function statusMark(status: StatusOption): string {
  switch (status) {
    case 'solved':
      return 'bg-text-primary border-text-primary';
    case 'revisit':
      return 'border-accent';
    case 'attempted':
      return 'bg-text-primary/40 border-text-primary/40';
    default:
      return 'border-border-hover';
  }
}

const STATUS_LABEL: Record<StatusOption, string> = {
  not_started: 'Not started',
  attempted: 'Attempted',
  solved: 'Solved',
  revisit: 'Needs revision',
};

function DifficultyDots({ level }: { level: string }) {
  const n = level === 'Easy' ? 1 : level === 'Medium' ? 2 : 3;
  return (
    <span className="inline-flex gap-1" role="img" aria-label={level}>
      {[1, 2, 3].map((i) => (
        <i
          key={i}
          className={`w-1.5 h-1.5 rounded-full border ${
            i <= n ? 'bg-text-primary border-text-primary' : 'border-border-hover'
          }`}
        />
      ))}
    </span>
  );
}

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
      <div className="py-24 text-center space-y-4">
        <p className="text-[20px] italic text-text-tertiary">Pattern not found in the curriculum index.</p>
        <Link to="/patterns" className="btn-primary inline-flex">
          Return to the Index
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
    <>
    <div className="animate-fade-in pb-6 font-serif">
      {/* Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-7">
        <Link to="/patterns" className={linkCls}>
          <ArrowLeft className="w-3.5 h-3.5" /> The Index
        </Link>
        <div className="flex items-center gap-7">
          {prevPattern && (
            <Link to={`/patterns/${prevPattern.id}`} className={linkCls} title={prevPattern.name}>
              <ChevronLeft className="w-3.5 h-3.5" />
              {String(currentPatternIndex).padStart(2, '0')} {prevPattern.name}
            </Link>
          )}
          {nextPattern && (
            <Link to={`/patterns/${nextPattern.id}`} className={linkCls} title={nextPattern.name}>
              {String(currentPatternIndex + 2).padStart(2, '0')} {nextPattern.name}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Title and plate */}
      <section className="flex flex-wrap items-end gap-x-16 gap-y-12 pt-14 pb-20 sm:pb-24">
        <div className="flex-[1_1_520px] min-w-0">
          <p className="lbl tnum">
            PLATE {String(currentPatternIndex + 1).padStart(2, '0')} · {pattern.variations.length} VARIATIONS ·{' '}
            {stats.total} PROBLEMS
          </p>
          <h1 className="font-display mt-6 text-[clamp(52px,9.4vw,150px)] leading-[0.92] tracking-[-0.05em] text-text-primary">
            {pattern.name}
          </h1>
          <p className="mt-7 text-[clamp(20px,2.2vw,28px)] italic font-light text-text-tertiary">
            {pattern.name} <span className="text-text-quaternary">&rarr;</span> sub-variations{' '}
            <span className="text-text-quaternary">&rarr;</span> targeted problem practice.
          </p>
        </div>
        <div className="flex-[0_1_480px] min-w-[280px] w-full">
          <PatternPlate
            patternId={pattern.id}
            name={pattern.name}
            note={`${pattern.variations.length} variations`}
          />
        </div>
      </section>

      {/* Ledger for this pattern */}
      <section aria-label="Progress in this pattern" className="flex flex-wrap border-y border-border-hover">
        {[
          { k: 'Solved', v: `${stats.solved}`, tail: ` / ${stats.total}` },
          { k: 'Complete', v: completionPct, tail: '%' },
          { k: 'Scheduled for review', v: `${stats.revisit}`, tail: '' },
          { k: 'Hard', v: `${stats.hardSolved}`, tail: ` / ${stats.hard}` },
        ].map((m, i) => (
          <div
            key={m.k}
            className={`flex-[1_1_200px] py-7 pr-6 ${i > 0 ? 'pl-6 border-l border-border' : ''}`}
          >
            <div className="lbl">{m.k}</div>
            <div className="font-display mt-2.5 text-[52px] leading-none tracking-[-0.04em] lining">
              {m.v}
              {m.tail && <span className="text-[24px] text-text-tertiary tracking-normal">{m.tail}</span>}
            </div>
          </div>
        ))}
      </section>

      {/* Variations */}
      <section className="pt-28" aria-labelledby="variations-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-5 pb-5 border-b border-border-hover">
          <h2 id="variations-heading" className="font-display text-[clamp(34px,4vw,56px)] leading-none">
            {pattern.variations.length} <em className="italic">variations</em>
          </h2>
          <span className="lbl">each tick is a problem · bone: solved · ring: revisit · dim: attempted</span>
        </div>

        <div>
          {pattern.variations.map((variation, vIdx) => {
            const varSolvedCount = variation.problems.filter(
              (p) => getProblemProgress(progress, p.id).status === 'solved'
            ).length;
            const frame = studyFrame(pattern.id, variation.name);
            const siblings = pattern.variations.filter((item) => item.id !== variation.id).map((item) => item.name);
            const term = 'lbl mb-1.5';
            const desc = 'text-[17px] leading-[1.55] text-text-secondary';

            return (
              <section key={variation.id} className="pt-16">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-4 border-b border-border">
                  <h3 className="font-display text-[clamp(24px,2.6vw,34px)] leading-[1.1]">
                    <span className="font-mono text-[12px] text-text-tertiary tracking-normal mr-4 align-middle">
                      {String(vIdx + 1).padStart(2, '0')}
                    </span>
                    {variation.name}
                  </h3>
                  <div className="flex items-center gap-5">
                    <span className="hidden sm:flex items-center" aria-hidden="true">
                      {variation.problems.map((p) => (
                        <i
                          key={p.id}
                          className="inline-block w-[7px] h-4 ml-[3px] rounded-[1px] border"
                          style={tickStyle(getProblemProgress(progress, p.id).status)}
                        />
                      ))}
                    </span>
                    <span className="font-mono text-[13px] tnum">
                      {varSolvedCount} / {variation.problems.length}
                    </span>
                  </div>
                </div>

                <div className="py-7 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="md:col-span-2">
                    <p className={term}>CONCEPT</p>
                    <p className="text-[19px] leading-[1.5] text-text-primary">{frame.concept}</p>
                  </div>
                  <div>
                    <p className={term}>RECOGNIZE</p>
                    <p className={desc}>{frame.recognize} This variation is “{variation.name}”.</p>
                  </div>
                  <div>
                    <p className={term}>USE WHEN</p>
                    <p className={desc}>{frame.useWhen}</p>
                  </div>
                  <div>
                    <p className={term}>AVOID WHEN</p>
                    <p className={desc}>{frame.avoidWhen}</p>
                  </div>
                  <div>
                    <p className={term}>MISTAKE</p>
                    <p className={desc}>{frame.mistake}</p>
                  </div>
                  <div>
                    <p className={term}>COMPLEXITY</p>
                    <p className={`${desc} tnum`}>{frame.complexity}</p>
                  </div>
                  {siblings.length > 0 && (
                    <div>
                      <p className={term}>DIFFERS FROM</p>
                      <p className={desc}>{siblings.join('; ')}.</p>
                    </div>
                  )}
                  {vIdx > 0 && (
                    <div className="md:col-span-2">
                      <p className={term}>EARLIER IN THIS PATTERN</p>
                      <p className={desc}>
                        {pattern.variations[vIdx - 1].name}. That order is the curriculum sequence, not a proof that it is a formal prerequisite.
                      </p>
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
                        className="group py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer transition-[padding] duration-200 hover:pl-2.5"
                      >
                        <div className="flex items-start sm:items-center gap-4 min-w-0">
                          <span
                            className={`shrink-0 w-[11px] h-[11px] rounded-full border mt-1.5 sm:mt-0 ${statusMark(status)}`}
                            role="img"
                            aria-label={STATUS_LABEL[status]}
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="text-[21px] tracking-[-0.01em] text-text-primary group-hover:italic truncate">
                                {problem.title}
                              </span>
                              {probProgress.notes && (
                                <span className="font-mono text-[11px] text-text-tertiary border border-border rounded px-1.5">
                                  notes
                                </span>
                              )}
                              {probProgress.confidence > 0 && (
                                <span className="font-mono text-[11px] text-text-secondary tnum">
                                  ★{probProgress.confidence}
                                </span>
                              )}
                            </div>
                            {probProgress.approach && (
                              <p className="text-[14px] italic text-text-tertiary truncate max-w-md mt-0.5">
                                {probProgress.approach}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <DifficultyDots level={problem.difficulty} />

                          <select
                            value={status}
                            aria-label={`Status for ${problem.title}`}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleQuickStatusChange(
                                e as any,
                                problem.id,
                                e.target.value as StatusOption
                              )
                            }
                            className="bg-canvas border border-border text-text-secondary hover:text-text-primary text-[12px] font-mono rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:border-accent"
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
                            className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md transition-colors"
                            title="Open workspace"
                            aria-label={`Open workspace for ${problem.title}`}
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={problem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-text-tertiary hover:text-accent rounded-md transition-colors"
                            title="Open original problem in new tab"
                            aria-label={`Open ${problem.title} in a new tab`}
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
      </section>

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
    </>
  );
}
