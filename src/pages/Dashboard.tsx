import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Link } from 'react-router-dom';
import { getCurriculumStats, countLabel } from '../lib/curriculumStats';
import {
  getGlobalStats,
  getStreak,
  getTodayActivity,
  getWeekActivity,
  getRevisionQueue,
  getNextProblems,
  getPatternStats,
} from '../store';
import ProblemWorkspaceModal from '../components/ProblemWorkspaceModal';
import PatternGlyph from '../components/PatternGlyph';
import PatternPlate from '../components/PatternPlate';
import type { CurriculumProblem } from '../types';

const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
];
const asWord = (n: number) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));

type Workspace = {
  problem: CurriculumProblem;
  patternId: string;
  patternName: string;
  variationName: string;
};

export default function Dashboard() {
  const { state } = useApp();
  const { curriculum, progress } = state;

  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  // Enter continues with the next problem, but only when nothing else has focus.
  useEffect(() => {
    if (!curriculum) return;
    const next = getNextProblems(curriculum, progress, 1)[0];
    if (!next) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (activeWorkspace) return;
      if (document.activeElement && document.activeElement !== document.body) return;
      setActiveWorkspace({
        problem: next.problem,
        patternId: next.patternId,
        patternName: next.patternName,
        variationName: next.variationName,
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [curriculum, progress, activeWorkspace]);

  if (state.loading || !curriculum) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex items-center gap-2.5 text-text-tertiary font-mono text-xs">
          <div className="w-3.5 h-3.5 border border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading the codex…</span>
        </div>
      </div>
    );
  }

  const stats = getGlobalStats(curriculum, progress);
  const curriculumStats = getCurriculumStats(curriculum);
  const streak = getStreak(progress);
  const todayActivity = getTodayActivity(progress);
  const weekActivity = getWeekActivity(progress);
  const revisionQueue = getRevisionQueue(curriculum, progress);
  const nextProblems = getNextProblems(curriculum, progress, 4);

  const overdueCount = revisionQueue.filter((r) => r.daysOverdue > 0).length;
  const dailyGoal = progress.settings?.dailyGoal || 5;

  const nextUp = nextProblems[0];
  const open = (x: Workspace) => setActiveWorkspace(x);

  const targetPattern = nextUp ? curriculum.patterns.find((p) => p.id === nextUp.patternId) : undefined;
  const targetStats = targetPattern ? getPatternStats(targetPattern, progress) : null;
  const remaining = targetStats ? targetStats.total - targetStats.solved : 0;
  const started = !!targetStats && targetStats.solved > 0;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
    <div className="animate-fade-in pb-6 font-serif">
      {/* Opening: one sentence, one action, one plate */}
      <section className="flex flex-wrap items-center gap-x-[72px] gap-y-14 pt-14 pb-20 sm:pt-20 sm:pb-24">
        <div className="flex-[1_1_560px] min-w-0">
          <p className="lbl">
            {today}
            <span className="text-text-quaternary"> · </span>
            {countLabel(curriculumStats.patternCount, 'pattern', 'patterns')}
          </p>

          <h1 className="font-display mt-5 text-[clamp(44px,6.1vw,92px)] leading-[0.98] tracking-[-0.035em] text-text-primary">
            {nextUp && targetPattern ? (
              started ? (
                <>
                  {targetPattern.name} is <em className="italic">{asWord(remaining)} {remaining === 1 ? 'problem' : 'problems'}</em> from done.
                </>
              ) : (
                <>
                  Begin <em className="italic">{targetPattern.name}</em>.
                </>
              )
            ) : (
              <>
                Every problem is <em className="italic">solved or attempted</em>.
              </>
            )}
          </h1>

          <p className="mt-7 max-w-[30em] text-[21px] leading-[1.5] text-text-tertiary">
            <span className="tnum lining">{stats.solved}</span> of <span className="tnum lining">{stats.total}</span> solved,{' '}
            <span className="tnum lining">{todayActivity.length}</span> of {dailyGoal} done today.
            {nextUp && (
              <>
                {' '}Next in line is <b className="font-normal text-text-primary">{nextUp.problem.title}</b>.
              </>
            )}
          </p>

          {nextUp && (
            <div className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-4">
              <button onClick={() => open(nextUp)} className="btn-primary !px-5 !py-3.5">
                Continue
                <kbd className="kbd-key !bg-none !bg-canvas/10 !border-canvas/30 !text-canvas !shadow-none">↵</kbd>
              </button>
              <Link
                to={`/patterns/${nextUp.patternId}`}
                className="text-[18px] italic text-text-tertiary border-b border-border-hover pb-0.5 hover:text-text-primary hover:border-text-primary transition-colors"
              >
                Open the plate
              </Link>
              <a
                href={nextUp.problem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[18px] italic text-text-tertiary border-b border-border-hover pb-0.5 hover:text-text-primary hover:border-text-primary transition-colors"
              >
                LeetCode
              </a>
            </div>
          )}
        </div>

        {targetPattern && (
          <div className="flex-[0_1_470px] min-w-[300px] w-full">
            <PatternPlate
              patternId={targetPattern.id}
              name={targetPattern.name}
              note={`${targetPattern.variations.length} variations`}
            />
          </div>
        )}
      </section>

      {/* Ledger */}
      <section aria-label="Ledger" className="flex flex-wrap border-y border-border-hover">
        {[
          {
            k: 'Solved',
            v: stats.solved,
            sub: `of ${stats.total} · easy ${stats.easySolved}/${stats.easy} · medium ${stats.mediumSolved}/${stats.medium} · hard ${stats.hardSolved}/${stats.hard}`,
          },
          { k: 'Run', v: streak.current, sub: `days in a row · best ${streak.best}` },
          { k: 'Overdue', v: overdueCount, sub: `${revisionQueue.length} in the review queue` },
          { k: 'This week', v: weekActivity.length, sub: 'practice events' },
        ].map((m, i) => (
          <div
            key={m.k}
            className={`flex-[1_1_220px] py-8 pr-7 ${i > 0 ? 'pl-7 border-l border-border' : ''}`}
          >
            <div className="lbl">{m.k}</div>
            <div className="font-display mt-3.5 text-[64px] sm:text-[76px] leading-none tracking-[-0.04em] lining">
              {m.v}
            </div>
            <div className="lbl mt-3">{m.sub}</div>
          </div>
        ))}
      </section>

      {/* Due for revision */}
      <section className="pt-28" aria-labelledby="due-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-5 pb-5 border-b border-border-hover">
          <h2 id="due-heading" className="font-display text-[clamp(34px,4vw,56px)] leading-none">
            Due for <em className="italic">revision</em>
          </h2>
          <Link
            to="/revisions"
            className="text-[18px] italic text-text-tertiary border-b border-border-hover pb-0.5 hover:text-text-primary hover:border-text-primary transition-colors"
          >
            All {revisionQueue.length}
          </Link>
        </div>

        {revisionQueue.length === 0 ? (
          <p className="py-10 text-[18px] italic text-text-tertiary">
            Nothing scheduled yet. Solved problems appear here automatically.
          </p>
        ) : (
          <ul>
            {revisionQueue.slice(0, 4).map((item) => (
              <li key={item.problem.id} className="border-b border-border">
                <button
                  onClick={() =>
                    open({
                      problem: item.problem,
                      patternId: item.patternId,
                      patternName: item.patternName,
                      variationName: item.variationName,
                    })
                  }
                  className="group w-full flex flex-wrap items-baseline gap-x-3.5 gap-y-1 py-5 text-left text-[22px] sm:text-[24px] tracking-[-0.01em] transition-[padding] duration-200 hover:pl-2.5"
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block w-[7px] h-[7px] rounded-full -translate-y-[3px] mr-1 ${
                      item.daysOverdue > 0
                        ? 'bg-accent shadow-[0_0_12px_rgba(255,91,46,0.9)]'
                        : 'border border-border-hover'
                    }`}
                  />
                  <span className="group-hover:italic">{item.problem.title}</span>
                  <span
                    aria-hidden="true"
                    className="hidden sm:block flex-1 min-w-[20px] border-b border-dotted border-border-hover -translate-y-1.5"
                  />
                  <span className="text-[16px] text-text-tertiary">{item.patternName}</span>
                  <span
                    className={`font-mono text-[12px] min-w-[96px] text-right tnum ${
                      item.daysOverdue > 0 ? 'text-text-primary' : 'text-text-tertiary'
                    }`}
                  >
                    {item.daysOverdue > 0
                      ? `${item.daysOverdue}d overdue`
                      : item.daysOverdue === 0
                      ? 'Today'
                      : `In ${Math.abs(item.daysOverdue)}d`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* The Index */}
      <section className="pt-28" aria-labelledby="index-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-5 pb-5 border-b border-border-hover">
          <h2 id="index-heading" className="font-display text-[clamp(34px,4vw,56px)] leading-none">
            The <em className="italic">Index</em>
          </h2>
          <span className="lbl">
            {countLabel(curriculumStats.patternCount, 'pattern', 'patterns')} ·{' '}
            {countLabel(stats.total, 'problem', 'problems')} · ember rule: in progress · bone rule: complete
          </span>
        </div>

        <div className="idx mt-1.5">
          {curriculum.patterns.map((p, idx) => {
            const ps = getPatternStats(p, progress);
            const pct = ps.total > 0 ? Math.round((ps.solved / ps.total) * 1000) / 10 : 0;
            const complete = ps.total > 0 && ps.solved === ps.total;
            return (
              <Link
                key={p.id}
                to={`/patterns/${p.id}`}
                style={{ ['--i' as string]: idx } as React.CSSProperties}
                className="idx-row cx-rise group relative grid grid-cols-[28px_40px_minmax(0,1fr)_64px] sm:grid-cols-[44px_56px_minmax(0,1fr)_130px_84px] items-center gap-x-3.5 sm:gap-x-[26px] py-[17px] border-b border-border"
              >
                <span className="font-mono text-[12px] text-text-tertiary">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <PatternGlyph patternId={p.id} className="w-10 h-10 sm:w-14 sm:h-14" />
                <span className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] transition-transform duration-300 group-hover:translate-x-2 group-hover:italic">
                  {p.name}
                </span>
                <span className="hidden sm:block text-[14px] italic text-text-tertiary">
                  {p.variations.length} variations
                </span>
                <span className="font-mono text-[13px] text-right tnum">
                  {ps.solved} / {ps.total}
                </span>
                <span aria-hidden="true" className="absolute left-0 right-0 -bottom-px h-px">
                  <span
                    className={`block h-px transition-shadow group-hover:shadow-[0_0_10px_rgba(255,91,46,0.9)] ${
                      complete ? 'bg-text-primary' : 'bg-accent'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

    </div>

    {activeWorkspace && (
      <ProblemWorkspaceModal
        problem={activeWorkspace.problem}
        patternId={activeWorkspace.patternId}
        patternName={activeWorkspace.patternName}
        variationName={activeWorkspace.variationName}
        onClose={() => setActiveWorkspace(null)}
      />
    )}
    </>
  );
}
