import React, { useState } from 'react';
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
  getWeakPatterns,
  getPatternStats,
  difficultyBg,
} from '../store';
import {
  ArrowUpRight,
  CheckCircle2,
  Play,
  ExternalLink,
} from 'lucide-react';
import ProblemWorkspaceModal from '../components/ProblemWorkspaceModal';
import type { CurriculumProblem } from '../types';

export default function Dashboard() {
  const { state } = useApp();
  const { curriculum, progress } = state;

  const [activeWorkspace, setActiveWorkspace] = useState<{
    problem: CurriculumProblem;
    patternId: string;
    patternName: string;
    variationName: string;
  } | null>(null);

  if (state.loading || !curriculum) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex items-center gap-2.5 text-text-tertiary font-mono text-xs">
          <div className="w-3.5 h-3.5 border border-accent border-t-transparent rounded-full animate-spin" />
          <span>LOADING CURRICULUM DATA...</span>
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
  const weakPatterns = getWeakPatterns(curriculum, progress, 4);

  const overdueCount = revisionQueue.filter((r) => r.daysOverdue > 0).length;
  const completionPct = stats.total > 0 ? ((stats.solved / stats.total) * 100).toFixed(1) : '0.0';
  const dailyGoal = progress.settings?.dailyGoal || 5;
  const todayPct = Math.min(100, Math.round((todayActivity.length / dailyGoal) * 100));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const nextUp = nextProblems[0];
  const open = (x: NonNullable<typeof nextUp>) =>
    setActiveWorkspace({
      problem: x.problem,
      patternId: x.patternId,
      patternName: x.patternName,
      variationName: x.variationName,
    });

  const label = 'text-[12px] text-text-tertiary';

  return (
    <div className="animate-fade-in space-y-14 pb-10">
      {/* Opening: one number, one sentence, one action */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-8 pt-2">
        <div className="lg:col-span-7">
          <p className={label}>
            {greeting} · {countLabel(curriculumStats.patternCount, 'pattern', 'patterns')}, {countLabel(curriculumStats.placementCount, 'problem', 'problems')}
          </p>
          <div className="mt-3 flex items-baseline gap-4">
            <span className="text-7xl sm:text-8xl font-semibold tracking-tighter leading-none text-text-primary tnum">
              {stats.solved}
            </span>
            <span className="text-2xl text-text-tertiary tnum tracking-tight">/ {stats.total}</span>
          </div>
          <p className="mt-4 text-sm text-text-secondary max-w-md leading-relaxed">
            Problems solved. <span className="text-accent tnum">{completionPct}%</span> of the curriculum, with{' '}
            <span className="text-text-primary tnum">{todayActivity.length}</span> of {dailyGoal} done today.
          </p>

          {/* Pattern spectrum: one column per pattern, filled to its completion */}
          <div className="mt-8">
            <div className="flex items-end gap-[3px] h-20">
              {curriculum.patterns.map((p) => {
                const ps = getPatternStats(p, progress);
                const pct = ps.total > 0 ? Math.round((ps.solved / ps.total) * 100) : 0;
                return (
                  <Link
                    key={p.id}
                    to={`/patterns/${p.id}`}
                    title={`${p.name} · ${ps.solved}/${ps.total}`}
                    className="group relative flex-1 h-full rounded-[3px] bg-surface-3 overflow-hidden hover:bg-surface-4 transition-colors"
                  >
                    <span
                      className="absolute bottom-0 inset-x-0 bg-accent group-hover:bg-accent-hover transition-all"
                      style={{ height: `${Math.max(pct, pct > 0 ? 6 : 0)}%`, boxShadow: '0 0 12px rgba(255,106,61,0.45)' }}
                    />
                  </Link>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-text-quaternary">
              <span>Pattern 1</span>
              <span>Pattern {curriculum.patterns.length}</span>
            </div>
          </div>
        </div>

        {/* Next up */}
        <div className="lg:col-span-5 lg:pl-10 lg:border-l border-border flex flex-col justify-center">
          <p className={label}>Next up</p>
          {nextUp ? (
            <>
              <h2 className="mt-3 text-2xl font-semibold tracking-tighter text-text-primary leading-tight">
                {nextUp.problem.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {nextUp.patternName} <span className="text-text-quaternary">/</span> {nextUp.variationName}
              </p>
              <div className="mt-3">
                <span className={`badge ${difficultyBg(nextUp.problem.difficulty)}`}>{nextUp.problem.difficulty}</span>
              </div>
              <div className="mt-7 flex items-center gap-3">
                <button onClick={() => open(nextUp)} className="btn-primary">
                  <Play className="w-3 h-3 fill-accent-text" />
                  Open workspace
                </button>
                <a href={nextUp.problem.url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  <ExternalLink className="w-3 h-3" />
                  LeetCode
                </a>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-text-secondary">
              Every problem in the curriculum is solved or attempted.
            </p>
          )}
        </div>
      </section>

      {/* Vital signs: no boxes, hairline dividers */}
      <section className="grid grid-cols-2 md:grid-cols-4 border-y border-border divide-x divide-border">
        {[
          { k: 'Today', v: `${todayActivity.length}`, sub: `of ${dailyGoal} goal`, tone: 'text-text-primary' },
          { k: 'Streak', v: `${streak.current}`, sub: `best ${streak.best} days`, tone: 'text-warning' },
          { k: 'Overdue', v: `${overdueCount}`, sub: `${revisionQueue.length} in queue`, tone: overdueCount > 0 ? 'text-danger' : 'text-text-primary' },
          { k: 'This week', v: `${weekActivity.length}`, sub: 'practice events', tone: 'text-text-primary' },
        ].map((m) => (
          <div key={m.k} className="px-5 py-5 first:pl-0">
            <p className={label}>{m.k}</p>
            <p className={`mt-1.5 text-3xl font-semibold tracking-tighter tnum ${m.tone}`}>{m.v}</p>
            <p className="mt-0.5 text-[12px] text-text-quaternary tnum">{m.sub}</p>
          </div>
        ))}
      </section>

      {/* Difficulty split */}
      <section className="space-y-3">
        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-surface-3 gap-px">
          <span className="bg-success" style={{ width: `${stats.total ? (stats.easySolved / stats.total) * 100 : 0}%` }} />
          <span className="bg-warning" style={{ width: `${stats.total ? (stats.mediumSolved / stats.total) * 100 : 0}%` }} />
          <span className="bg-danger" style={{ width: `${stats.total ? (stats.hardSolved / stats.total) * 100 : 0}%` }} />
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-1 text-[12px] text-text-tertiary tnum">
          <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-2" />Easy {stats.easySolved}/{stats.easy}</span>
          <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-warning mr-2" />Medium {stats.mediumSolved}/{stats.medium}</span>
          <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-danger mr-2" />Hard {stats.hardSolved}/{stats.hard}</span>
        </div>
      </section>

      {/* Two ledgers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-12">
        <div>
          <div className="flex items-baseline justify-between pb-3 border-b border-border">
            <h2 className="text-base font-semibold tracking-tight text-text-primary">Revision queue</h2>
            <Link to="/revisions" className="text-[12px] text-text-tertiary hover:text-accent transition-colors">
              All {revisionQueue.length} <ArrowUpRight className="inline w-3 h-3" />
            </Link>
          </div>
          {revisionQueue.length === 0 ? (
            <div className="py-10 text-sm text-text-tertiary flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Nothing scheduled yet. Solved problems appear here automatically.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {revisionQueue.slice(0, 5).map((item) => (
                <li key={item.problem.id}>
                  <button
                    onClick={() => open(item)}
                    className="group w-full flex items-center justify-between gap-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm text-text-primary group-hover:text-accent truncate transition-colors">
                        {item.problem.title}
                      </span>
                      <span className="block text-[12px] text-text-tertiary truncate">{item.patternName}</span>
                    </span>
                    <span
                      className={`shrink-0 text-[12px] tnum ${
                        item.daysOverdue > 0 ? 'text-danger' : item.daysOverdue === 0 ? 'text-warning' : 'text-text-tertiary'
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
        </div>

        <div>
          <div className="flex items-baseline justify-between pb-3 border-b border-border">
            <h2 className="text-base font-semibold tracking-tight text-text-primary">Needs focus</h2>
            <Link to="/patterns" className="text-[12px] text-text-tertiary hover:text-accent transition-colors">
              All {curriculum.patterns.length} patterns <ArrowUpRight className="inline w-3 h-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {weakPatterns.map(({ pattern, stats: ps }, idx) => {
              const pct = ps.total > 0 ? Math.round((ps.solved / ps.total) * 100) : 0;
              return (
                <li key={pattern.id}>
                  <Link
                    to={`/patterns/${pattern.id}`}
                    className="group flex items-center gap-4 py-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="w-5 text-[12px] text-text-quaternary tnum">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-text-primary group-hover:text-accent truncate transition-colors">
                        {pattern.name}
                      </span>
                      <span className="mt-1.5 block h-[3px] rounded-full bg-surface-3 overflow-hidden">
                        <span className="block h-full bg-accent" style={{ width: `${pct}%` }} />
                      </span>
                    </span>
                    <span className="text-[12px] text-text-secondary tnum w-16 text-right">
                      {ps.solved}/{ps.total}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {activeWorkspace && (
        <ProblemWorkspaceModal
          problem={activeWorkspace.problem}
          patternId={activeWorkspace.patternId}
          patternName={activeWorkspace.patternName}
          variationName={activeWorkspace.variationName}
          onClose={() => setActiveWorkspace(null)}
        />
      )}
    </div>
  );
}
