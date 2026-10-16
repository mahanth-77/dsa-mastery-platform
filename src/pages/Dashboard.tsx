import React, { useState } from 'react';
import { useApp } from '../context';
import { Link } from 'react-router-dom';
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
  getEffectiveStatus,
} from '../store';
import {
  Binary,
  Clock,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ChevronRight,
  ExternalLink,
  Target,
  BarChart2,
  Sparkles,
  BookOpen,
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
          <span>SYNCHRONIZING CURRICULUM DATA...</span>
        </div>
      </div>
    );
  }

  const stats = getGlobalStats(curriculum, progress);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Editorial Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-accent font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              DEVELOPER COCKPIT
            </span>
            <span className="text-border">·</span>
            <span className="text-[10px] font-mono text-text-tertiary">
              21 PATTERNS · 115 VARIATIONS · 575 PROBLEMS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            {greeting}, engineer.
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            You have solved <strong className="text-text-primary tnum font-mono">{stats.solved}</strong> of{' '}
            <span className="font-mono tnum">{stats.total}</span> problems (<span className="text-accent font-mono tnum">{completionPct}%</span> overall completion).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/patterns" className="btn-secondary">
            <Binary className="w-3.5 h-3.5 text-text-secondary" />
            Browse Patterns
          </Link>
          {nextUp && (
            <button
              onClick={() =>
                setActiveWorkspace({
                  problem: nextUp.problem,
                  patternId: nextUp.patternId,
                  patternName: nextUp.patternName,
                  variationName: nextUp.variationName,
                })
              }
              className="btn-primary"
            >
              <Play className="w-3 h-3 fill-accent-text" />
              Continue Next Problem
            </button>
          )}
        </div>
      </div>

      {/* Asymmetric Top Grid: Hero Continuation Card + Precision Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hero Next Up Problem Card */}
        <div className="lg:col-span-7 panel p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-surface-1 to-surface-2 border-border">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="badge badge-accent">NEXT IN LINE</span>
              <span className="text-xxs font-mono text-text-tertiary truncate max-w-[200px]">
                {nextUp ? nextUp.patternName : 'All complete'}
              </span>
            </div>

            {nextUp ? (
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 tracking-tight">
                  {nextUp.problem.title}
                  <span className={`badge ${difficultyBg(nextUp.problem.difficulty)} text-[10px]`}>
                    {nextUp.problem.difficulty}
                  </span>
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Variation: <strong className="text-text-primary">{nextUp.variationName}</strong>
                </p>
                <div className="p-2.5 rounded bg-surface-0/60 border border-border-subtle mt-2.5 space-y-1">
                  <span className="text-[10px] font-mono text-accent uppercase tracking-wider block">
                    Algorithmic Objective
                  </span>
                  <p className="text-xxs text-text-secondary font-mono leading-relaxed">
                    Identify the core algorithmic invariant for this variation. Implement optimal time/space bounds, record solution edge cases, and schedule for spaced retention.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-xs text-text-secondary">
                🎉 Congratulations! You have solved or attempted every problem in the curriculum.
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-border/80 flex items-center justify-between gap-3">
            {nextUp && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setActiveWorkspace({
                      problem: nextUp.problem,
                      patternId: nextUp.patternId,
                      patternName: nextUp.patternName,
                      variationName: nextUp.variationName,
                    })
                  }
                  className="btn-primary text-xs"
                >
                  <Play className="w-3 h-3 fill-accent-text" />
                  Open in Workspace
                </button>
                <a
                  href={nextUp.problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-subtle text-xs"
                >
                  <ExternalLink className="w-3 h-3 text-text-tertiary" />
                  LeetCode
                </a>
              </div>
            )}

            <Link
              to="/patterns"
              className="text-xxs font-mono text-text-tertiary hover:text-accent transition-colors flex items-center gap-1 ml-auto"
            >
              Pattern Tree <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Side Metric Stack (Compact & Asymmetric) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {/* Daily Goal card */}
          <div className="panel p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary font-medium">
                  Daily Goal
                </span>
                <Target className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-text-primary tnum">
                  {todayActivity.length}
                </span>
                <span className="text-xs font-mono text-text-tertiary tnum">
                  / {dailyGoal}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <div className="track-bar h-1">
                <div
                  className="track-fill bg-accent"
                  style={{ width: `${todayPct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-text-tertiary mt-1 block text-right tnum">
                {todayPct}% of daily target
              </span>
            </div>
          </div>

          {/* Streak Card */}
          <div className="panel p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary font-medium">
                  Active Streak
                </span>
                <Flame className="w-3.5 h-3.5 text-warning" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-warning tnum">
                  {streak.current}
                </span>
                <span className="text-xs font-mono text-text-tertiary">
                  days
                </span>
              </div>
            </div>
            <p className="text-[10px] font-mono text-text-tertiary mt-3">
              Best record: <strong className="text-text-secondary tnum">{streak.best}d</strong>
            </p>
          </div>

          {/* Revisions Due Card */}
          <div className="panel p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary font-medium">
                  Revision Due
                </span>
                <Clock className="w-3.5 h-3.5 text-info" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold font-mono tnum ${overdueCount > 0 ? 'text-danger' : 'text-text-primary'}`}>
                  {overdueCount}
                </span>
                <span className="text-xs font-mono text-text-tertiary">
                  overdue
                </span>
              </div>
            </div>
            <Link
              to="/revisions"
              className="text-[10px] font-mono text-text-tertiary hover:text-text-primary flex items-center justify-between mt-3 group"
            >
              <span>{revisionQueue.length} in queue</span>
              <ArrowUpRight className="w-3 h-3 group-hover:text-accent transition-colors" />
            </Link>
          </div>

          {/* Weekly Actions Card */}
          <div className="panel p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary font-medium">
                  7-Day Velocity
                </span>
                <BarChart2 className="w-3.5 h-3.5 text-text-tertiary" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-text-primary tnum">
                  {weekActivity.length}
                </span>
                <span className="text-xs font-mono text-text-tertiary">
                  events
                </span>
              </div>
            </div>
            <p className="text-[10px] font-mono text-text-tertiary mt-3">
              Logged practice sessions
            </p>
          </div>
        </div>
      </div>

      {/* Global Mastery Track */}
      <div className="panel p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary tracking-tight">Curriculum Mastery Track</span>
          <span className="font-mono text-accent tnum">{stats.solved} / {stats.total} Solved</span>
        </div>
        <div className="track-bar h-1.5 bg-surface-3">
          <div
            className="track-fill bg-accent"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-text-tertiary pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" /> Easy: {stats.easySolved}/{stats.easy}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" /> Med: {stats.mediumSolved}/{stats.medium}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-danger" /> Hard: {stats.hardSolved}/{stats.hard}
          </span>
          <span>Target: 100%</span>
        </div>
      </div>

      {/* Two Column Layout: Revision Attention + Weak Pattern Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revision Queue Priority */}
        <div className="panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-text-primary">
                Spaced Revision Queue
              </h2>
            </div>
            <Link to="/revisions" className="text-xxs font-mono text-text-tertiary hover:text-accent">
              View All ({revisionQueue.length}) →
            </Link>
          </div>

          <div className="divide-y divide-border/60 py-1 flex-1">
            {revisionQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-tertiary">
                <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1.5 opacity-60" />
                No problems scheduled for revision yet. When you solve problems, they will appear here.
              </div>
            ) : (
              revisionQueue.slice(0, 4).map((item) => (
                <div
                  key={item.problem.id}
                  onClick={() =>
                    setActiveWorkspace({
                      problem: item.problem,
                      patternId: item.patternId,
                      patternName: item.patternName,
                      variationName: item.variationName,
                    })
                  }
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface-2/60 -mx-2 px-2 rounded cursor-pointer transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary group-hover:text-accent truncate">
                      {item.problem.title}
                    </p>
                    <p className="text-[10px] font-mono text-text-tertiary truncate">
                      {item.patternName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge ${difficultyBg(item.problem.difficulty)} text-[9px]`}>
                      {item.problem.difficulty}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${
                        item.daysOverdue > 0
                          ? 'text-danger font-semibold'
                          : item.daysOverdue === 0
                          ? 'text-warning'
                          : 'text-text-tertiary'
                      }`}
                    >
                      {item.daysOverdue > 0
                        ? `${item.daysOverdue}d overdue`
                        : item.daysOverdue === 0
                        ? 'Today'
                        : `In ${Math.abs(item.daysOverdue)}d`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weak Patterns Diagnostic */}
        <div className="panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-text-primary">
                Patterns Needing Focus
              </h2>
            </div>
            <Link to="/patterns" className="text-xxs font-mono text-text-tertiary hover:text-accent">
              All 21 Patterns →
            </Link>
          </div>

          <div className="divide-y divide-border/60 py-1 flex-1">
            {weakPatterns.map(({ pattern, stats: ps }, idx) => {
              const pct = ps.total > 0 ? Math.round((ps.solved / ps.total) * 100) : 0;
              return (
                <Link
                  key={pattern.id}
                  to={`/patterns/${pattern.id}`}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface-2/60 -mx-2 px-2 rounded transition-colors group"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-text-quaternary w-4">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-text-primary group-hover:text-accent truncate">
                        {pattern.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 track-bar h-1">
                          <div className="track-fill bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-text-tertiary tnum">
                          {ps.solved}/{ps.total} solved
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-text-secondary group-hover:text-text-primary tnum">
                      {pct}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pattern Catalog Quick Matrix */}
      <div className="panel p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-text-primary flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            All 21 Pattern Families
          </h2>
          <Link to="/patterns" className="text-xxs font-mono text-accent hover:underline">
            Explorer View →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {curriculum.patterns.map((p, idx) => {
            const ps = getPatternStats(p, progress);
            const pct = ps.total > 0 ? Math.round((ps.solved / ps.total) * 100) : 0;
            return (
              <Link
                key={p.id}
                to={`/patterns/${p.id}`}
                className="p-2.5 rounded bg-surface-0 hover:bg-surface-2 border border-border-subtle hover:border-border transition-colors flex items-center justify-between gap-2.5 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-text-quaternary shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <p className="text-xs text-text-secondary group-hover:text-text-primary font-medium truncate">
                    {p.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-12 track-bar h-1">
                    <div className="track-fill bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-text-tertiary w-7 text-right tnum">
                    {pct}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Problem Workspace Drawer / Modal */}
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
