import React, { useState, useMemo } from 'react';
import { useApp } from '../context';
import {
  getRevisionQueue,
  difficultyBg,
} from '../store';
import { struggledPlacements } from '../lib/learningSignals';
import type { RevisionItem, CurriculumProblem } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ExternalLink,
  FileEdit,
} from 'lucide-react';
import ProblemWorkspaceModal from '../components/ProblemWorkspaceModal';

export default function RevisionCenter() {
  const { state, completeRevision } = useApp();
  const { curriculum, progress } = state;

  const [filterTab, setFilterTab] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [activeWorkspace, setActiveWorkspace] = useState<{
    problem: CurriculumProblem;
    patternId: string;
    patternName: string;
    variationName: string;
  } | null>(null);

  if (!curriculum) return null;

  const fullQueue = useMemo(() => {
    return getRevisionQueue(curriculum, progress);
  }, [curriculum, progress]);
  const struggled = useMemo(() => struggledPlacements(curriculum, progress), [curriculum, progress]);

  const overdueList = useMemo(() => fullQueue.filter((i) => i.daysOverdue > 0), [fullQueue]);
  const todayList = useMemo(() => fullQueue.filter((i) => i.daysOverdue === 0), [fullQueue]);
  const upcomingList = useMemo(() => fullQueue.filter((i) => i.daysOverdue < 0), [fullQueue]);

  const displayedList = useMemo(() => {
    let list = fullQueue;
    if (filterTab === 'overdue') list = overdueList;
    if (filterTab === 'today') list = todayList;
    if (filterTab === 'upcoming') list = upcomingList;

    if (selectedDifficulty !== 'All') {
      list = list.filter((item) => item.problem.difficulty === selectedDifficulty);
    }
    return list;
  }, [fullQueue, filterTab, overdueList, todayList, upcomingList, selectedDifficulty]);

  const handleQuickReview = (item: RevisionItem, confidenceScore: number) => {
    completeRevision(item.problem.id, confidenceScore, item.patternId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-accent font-semibold">
              SPACED REPETITION QUEUE
            </span>
            <span className="text-border">·</span>
            <span className="text-[10px] font-mono text-text-tertiary">
              INTERVAL-BASED REINFORCEMENT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Revision Center
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Due dates apply only to placements you marked solved. Solved is not mastery. A recall is recorded only when you complete a review.
          </p>
        </div>
      </div>

      <section className="panel p-4 space-y-2" aria-label="Placements that need more practice">
        <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-text-primary">Needs more practice</h2>
        <p className="text-[11px] text-text-tertiary">Revisit status, or attempted at least twice and not solved. This list uses only saved progress.</p>
        {struggled.length === 0 ? (
          <p className="text-xs text-text-secondary">No saved struggle yet.</p>
        ) : (
          <ul className="space-y-1">
            {struggled.slice(0, 8).map((row) => (
              <li key={row.placementId} className="text-xs text-text-secondary">
                {row.title} · {row.variationName} · {row.progress.status} · attempts {row.progress.attempts}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Priority Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setFilterTab('overdue')}
          className={`panel p-4 cursor-pointer transition-all ${
            filterTab === 'overdue'
              ? 'border-danger/60 bg-danger-muted/30 ring-1 ring-danger/40'
              : 'hover:border-border-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
              Overdue Review
            </span>
            <AlertTriangle className="w-4 h-4 text-danger" />
          </div>
          <p className="text-2xl font-bold font-mono text-danger mt-2 tnum">
            {overdueList.length}
          </p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1">
            Immediate recall required
          </p>
        </div>

        <div
          onClick={() => setFilterTab('today')}
          className={`panel p-4 cursor-pointer transition-all ${
            filterTab === 'today'
              ? 'border-warning/60 bg-warning-muted/30 ring-1 ring-warning/40'
              : 'hover:border-border-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
              Due Today
            </span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-2xl font-bold font-mono text-warning mt-2 tnum">
            {todayList.length}
          </p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1">
            Scheduled for this session
          </p>
        </div>

        <div
          onClick={() => setFilterTab('upcoming')}
          className={`panel p-4 cursor-pointer transition-all ${
            filterTab === 'upcoming'
              ? 'border-accent/60 bg-accent-muted/30 ring-1 ring-accent/40'
              : 'hover:border-border-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
              Upcoming
            </span>
            <Calendar className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold font-mono text-accent mt-2 tnum">
            {upcomingList.length}
          </p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1">
            Future intervals
          </p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="panel p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-border">
          {(['all', 'overdue', 'today', 'upcoming'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors uppercase font-medium ${
                filterTab === tab
                  ? 'bg-surface-0 text-text-primary shadow-xs border border-border font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'all' ? `All (${fullQueue.length})` : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-text-tertiary">Difficulty:</span>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="input-field text-xs py-1 px-2 w-28 cursor-pointer font-sans"
          >
            <option value="All">All Levels</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Revision Queue List */}
      <div className="space-y-2.5">
        {displayedList.length === 0 ? (
          <div className="panel p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-text-primary">
              No revisions pending in this view
            </h3>
            <p className="text-xs text-text-tertiary max-w-sm mx-auto">
              Problems marked as solved or scheduled with revision intervals will appear here automatically.
            </p>
          </div>
        ) : (
          displayedList.map((item) => {
            const isOverdue = item.daysOverdue > 0;
            const isToday = item.daysOverdue === 0;

            return (
              <div
                key={item.problem.id}
                className={`panel p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all hover:border-border-hover ${
                  isOverdue ? 'border-danger/30 bg-danger-muted/5' : ''
                }`}
              >
                {/* Problem Info */}
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="pt-1">
                    <span
                      className={`w-2 h-2 rounded-full block shrink-0 ${
                        isOverdue
                          ? 'bg-danger shadow-xs shadow-danger/50'
                          : isToday
                          ? 'bg-amber-400 shadow-xs shadow-warning/50'
                          : 'bg-accent'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-text-primary tracking-tight">
                        {item.problem.title}
                      </span>
                      <span className={`badge ${difficultyBg(item.problem.difficulty)} text-[9px]`}>
                        {item.problem.difficulty}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 text-text-tertiary border border-border">
                        {item.patternName}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-text-tertiary mt-0.5">
                      Variation: <strong className="text-text-secondary">{item.variationName}</strong>
                      {item.progress.nextRevisionAt && ` · Scheduled: ${item.progress.nextRevisionAt}`}
                      {item.progress.reviewHistory.length > 0 &&
                        ` · Reviewed ${item.progress.reviewHistory.length} times`}
                    </p>

                    {item.progress.approach && (
                      <p className="text-[11px] font-mono text-text-secondary mt-1 line-clamp-1 italic">
                        "{item.progress.approach}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isOverdue
                        ? 'text-danger'
                        : isToday
                        ? 'text-amber-400'
                        : 'text-text-tertiary'
                    }`}
                  >
                    {isOverdue
                      ? `${item.daysOverdue}d overdue`
                      : isToday
                      ? 'Due Today'
                      : `In ${Math.abs(item.daysOverdue)}d`}
                  </span>

                  {/* Recall feedback buttons */}
                  <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-border">
                    <span className="text-[10px] font-mono text-text-tertiary px-1 hidden sm:inline">
                      Recall:
                    </span>
                    {[
                      { label: 'Hard', score: 2 },
                      { label: 'Good', score: 4 },
                      { label: 'Easy', score: 5 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleQuickReview(item, btn.score)}
                        className="btn-subtle text-[10px] font-mono py-0.5 px-1.5"
                        title="Record a review. The next date follows the review count: 1, 3, 7, 14, 30, then 60 days."
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-accent" />
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Workspace button */}
                  <button
                    type="button"
                    onClick={() =>
                      setActiveWorkspace({
                        problem: item.problem,
                        patternId: item.patternId,
                        patternName: item.patternName,
                        variationName: item.variationName,
                      })
                    }
                    className="p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                    title="Open workspace"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                  </button>

                  {/* External Link */}
                  <a
                    href={item.problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-text-tertiary hover:text-accent hover:bg-surface-2 rounded-md transition-colors"
                    title="Open LeetCode problem"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Workspace Modal */}
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
