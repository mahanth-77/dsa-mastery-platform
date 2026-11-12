import React, { useMemo } from 'react';
import { useApp } from '../context';
import {
  getGlobalStats,
  getStreak,
  getActivityByDate,
  getPatternStats,
} from '../store';
import { summarizeLearning, weakVariations } from '../lib/learningSignals';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  BarChart2,
  Calendar,
  Flame,
  AlertCircle,
  Layers,
} from 'lucide-react';

export default function Analytics() {
  const { state } = useApp();
  const { curriculum, progress } = state;

  if (!curriculum) return null;

  const globalStats = useMemo(() => getGlobalStats(curriculum, progress), [curriculum, progress]);
  const learning = useMemo(() => summarizeLearning(curriculum, progress), [curriculum, progress]);
  const weak = useMemo(() => weakVariations(curriculum, progress), [curriculum, progress]);
  const streak = useMemo(() => getStreak(progress), [progress]);
  const activityMap = useMemo(() => getActivityByDate(progress, 90), [progress]);

  const hasActivity = progress.activity.length > 0;

  // Difficulty chart data
  const difficultyData = [
    {
      name: 'Easy',
      total: globalStats.easy,
      solved: globalStats.easySolved,
      color: '#34d399', // emerald
    },
    {
      name: 'Medium',
      total: globalStats.medium,
      solved: globalStats.mediumSolved,
      color: '#fbbf24', // amber
    },
    {
      name: 'Hard',
      total: globalStats.hard,
      solved: globalStats.hardSolved,
      color: '#f87171', // rose
    },
  ];

  // Pattern completion ranking
  const patternProgressData = useMemo(() => {
    return curriculum.patterns
      .map((p) => {
        const ps = getPatternStats(p, progress);
        const pct = ps.total > 0 ? Math.round((ps.solved / ps.total) * 100) : 0;
        return {
          id: p.id,
          name: p.name,
          total: ps.total,
          solved: ps.solved,
          pct,
        };
      })
      .sort((a, b) => b.pct - a.pct || b.total - a.total);
  }, [curriculum, progress]);

  // Last 60 days activity grid for authentic heatmap
  const heatmapDays = useMemo(() => {
    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    const now = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        count: activityMap[dateStr] || 0,
        dayOfWeek: d.getDay(),
      });
    }
    return days;
  }, [activityMap]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-accent font-semibold">
              TELEMETRY & MASTERY AUDIT
            </span>
            <span className="text-border">·</span>
            <span className="text-[10px] font-mono text-text-tertiary">
              UNFABRICATED LOCAL METRICS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Analytics & Insights
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Audit your pattern mastery distribution, algorithmic difficulty coverage, and real study velocity.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="panel p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">
            Overall Completion
          </span>
          <p className="text-2xl font-bold font-mono text-text-primary mt-1 tnum">
            {globalStats.total > 0 ? ((globalStats.solved / globalStats.total) * 100).toFixed(1) : '0.0'}%
          </p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1 tnum">
            {globalStats.solved} solved of {globalStats.total} placements
          </p>
        </div>

        <div className="panel p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">
            Consecutive Streak
          </span>
          <p className="text-2xl font-bold font-mono text-warning mt-1 flex items-center gap-1.5 tnum">
            <Flame className="w-5 h-5 fill-warning text-warning" />
            {streak.current} Days
          </p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1 tnum">
            Personal record: {streak.best}d
          </p>
        </div>

        <div className="panel p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">
            Logged Actions
          </span>
          <p className="text-2xl font-bold font-mono text-accent mt-1 tnum">
            {progress.activity.length}
          </p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1">
            Recorded study events
          </p>
        </div>

        <div className="panel p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">
            Marked revisit
          </span>
          <p className="text-2xl font-bold font-mono text-indigo-400 mt-1 tnum">
            {globalStats.revisit}
          </p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1">
            Not the same as a completed review
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="panel p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">Attempted</span>
          <p className="text-2xl font-bold font-mono mt-1 tnum">{learning.attempted}</p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1">Status attempted, not solved</p>
        </div>
        <div className="panel p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">Reviews recorded</span>
          <p className="text-2xl font-bold font-mono mt-1 tnum">{learning.revised}</p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1">Placements with at least one review</p>
        </div>
        <div className="panel p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">Demonstrated recall</span>
          <p className="text-2xl font-bold font-mono mt-1 tnum">{learning.demonstratedRecall}</p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1">Solved, reviewed, confidence 4 or 5</p>
        </div>
        <div className="panel p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">Placements</span>
          <p className="text-2xl font-bold font-mono mt-1 tnum">{learning.placements}</p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1">Counted by placement, not by URL</p>
        </div>
      </div>

      <section className="panel p-4 space-y-2" aria-label="Weak variations">
        <h2 className="text-xs font-semibold uppercase tracking-wider font-mono">Weak variations with saved evidence</h2>
        {weak.length === 0 ? (
          <p className="text-xs text-text-secondary">None yet. A variation appears here only after a revisit, a repeated unsolved attempt, or a solved item you rated below 3.</p>
        ) : (
          <ul className="space-y-1">
            {weak.slice(0, 8).map((row) => (
              <li key={row.variationId} className="text-xs text-text-secondary">
                {row.patternName} · {row.variationName}: {row.revisit} revisit, {row.unsolvedAttempts} repeated unsolved, {row.lowConfidenceSolved} low-confidence solved, of {row.touched} touched
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Activity Heatmap Grid */}
      <div className="panel p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-text-primary flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            Study Activity (Past 60 Days)
          </h2>
          <span className="text-[10px] font-mono text-text-tertiary">
            Derived strictly from recorded practice events
          </span>
        </div>

        {!hasActivity ? (
          <div className="p-8 text-center bg-surface-0/60 rounded-lg border border-dashed border-border/80">
            <AlertCircle className="w-5 h-5 text-text-tertiary mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-text-secondary">
              Zero-state: No study events recorded yet
            </p>
            <p className="text-[11px] font-mono text-text-tertiary mt-1 max-w-sm mx-auto">
              Solve problems or complete spaced revisions to populate your authentic activity ledger.
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto py-2">
              {heatmapDays.map((d) => {
                let bgClass = 'bg-surface-3';
                if (d.count >= 5) bgClass = 'bg-accent shadow-xs shadow-accent/20';
                else if (d.count >= 3) bgClass = 'bg-accent/80';
                else if (d.count >= 1) bgClass = 'bg-accent/40';

                return (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count} actions`}
                    className={`w-3.5 h-3.5 rounded-xs ${bgClass} transition-colors cursor-pointer hover:ring-1 hover:ring-white/40`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary pt-2 border-t border-border/60">
              <span>60 days chronological</span>
              <div className="flex items-center gap-1.5">
                <span>Fewer</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-surface-3" />
                <span className="w-2.5 h-2.5 rounded-xs bg-accent/40" />
                <span className="w-2.5 h-2.5 rounded-xs bg-accent/80" />
                <span className="w-2.5 h-2.5 rounded-xs bg-accent" />
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Difficulty Breakdown & Pattern Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Difficulty BarChart */}
        <div className="panel p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-text-primary flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-accent" />
            Solved vs Total by Difficulty
          </h2>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={difficultyData}
                margin={{ top: 20, right: 15, left: -20, bottom: 5 }}
              >
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pct = data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0;
                      return (
                        <div className="bg-surface-0 border border-border p-2.5 rounded-lg text-xs font-mono shadow-xl space-y-1">
                          <p className="font-bold text-text-primary">{data.name}</p>
                          <p className="text-text-secondary">
                            Solved: <span className="text-accent">{data.solved}</span> / {data.total}
                          </p>
                          <p className="text-text-tertiary">Completion: {pct}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" fill="#181c22" radius={[3, 3, 0, 0]} name="Total" />
                <Bar dataKey="solved" radius={[3, 3, 0, 0]} name="Solved">
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border/60">
            {difficultyData.map((d) => (
              <div key={d.name} className="p-2 rounded-lg bg-surface-0 border border-border-subtle">
                <span className="text-[10px] font-mono text-text-tertiary block">{d.name}</span>
                <span className="text-xs font-mono font-bold text-text-primary mt-0.5 block tnum">
                  {d.solved} / {d.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Mastery Breakdown Leaderboard */}
        <div className="panel p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-text-primary flex items-center gap-2 pb-2 border-b border-border">
            <Layers className="w-3.5 h-3.5 text-accent" />
            Pattern Mastery Leaderboard
          </h2>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {patternProgressData.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-lg bg-surface-0 hover:bg-surface-2 border border-border-subtle transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 track-bar h-1.5">
                      <div
                        className="track-fill bg-accent"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-text-tertiary w-8 text-right tnum">
                      {item.pct}%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-text-tertiary shrink-0 tnum">
                  {item.solved}/{item.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
