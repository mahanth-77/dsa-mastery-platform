import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context';
import { getCurriculumStats, countLabel } from '../lib/curriculumStats';
import {
  getPatternStats,
  getEffectiveStatus,
  difficultyBg,
  statusLabel,
} from '../store';
import type { Difficulty, StatusOption, CurriculumProblem } from '../types';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  List,
  LayoutGrid,
  X,
} from 'lucide-react';
import ProblemWorkspaceModal from '../components/ProblemWorkspaceModal';

export default function PatternExplorer() {
  const { state } = useApp();
  const { curriculum, progress } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | Difficulty>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | StatusOption>('All');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'default' | 'progress-asc' | 'progress-desc' | 'problems-desc' | 'name'>('default');
  const [expandedPatterns, setExpandedPatterns] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'comfortable' | 'compact'>('comfortable');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected problem for modal workspace
  const [activeWorkspace, setActiveWorkspace] = useState<{
    problem: CurriculumProblem;
    patternId: string;
    patternName: string;
    variationName: string;
  } | null>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.metaKey && e.key === 'k')) && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!curriculum) return null;
  const curriculumStats = getCurriculumStats(curriculum);

  const togglePattern = (patternId: string) => {
    setExpandedPatterns((prev) => ({
      ...prev,
      [patternId]: !prev[patternId],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    curriculum.patterns.forEach((p) => {
      all[p.id] = true;
    });
    setExpandedPatterns(all);
  };

  const collapseAll = () => {
    setExpandedPatterns({});
  };

  // Filter & search
  const filteredPatterns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return curriculum.patterns
      .filter((pattern) => {
        if (selectedPatternId !== 'All' && pattern.id !== selectedPatternId) {
          return false;
        }
        return true;
      })
      .map((pattern) => {
        const stats = getPatternStats(pattern, progress);

        const matchingVariations = pattern.variations
          .map((variation) => {
            const matchingProblems = variation.problems.filter((problem) => {
              const probStatus = getEffectiveStatus(progress, problem.id);
              if (statusFilter !== 'All' && probStatus !== statusFilter) {
                return false;
              }
              if (difficultyFilter !== 'All' && problem.difficulty !== difficultyFilter) {
                return false;
              }
              if (query) {
                const matchesProblem = problem.title.toLowerCase().includes(query);
                const matchesVariation = variation.name.toLowerCase().includes(query);
                const matchesPattern = pattern.name.toLowerCase().includes(query);
                return matchesProblem || matchesVariation || matchesPattern;
              }
              return true;
            });

            return {
              ...variation,
              problems: matchingProblems,
            };
          })
          .filter((v) => v.problems.length > 0 || !query);

        const hasMatch =
          query === ''
            ? true
            : matchingVariations.some((v) => v.problems.length > 0) ||
              pattern.name.toLowerCase().includes(query);

        return {
          pattern,
          stats,
          variations: matchingVariations,
          hasMatch,
        };
      })
      .filter((item) => (searchQuery ? item.hasMatch : true))
      .sort((a, b) => {
        if (sortBy === 'name') return a.pattern.name.localeCompare(b.pattern.name);
        const aPct = a.stats.total > 0 ? a.stats.solved / a.stats.total : 0;
        const bPct = b.stats.total > 0 ? b.stats.solved / b.stats.total : 0;
        if (sortBy === 'progress-asc') return aPct - bPct;
        if (sortBy === 'progress-desc') return bPct - aPct;
        if (sortBy === 'problems-desc') return b.stats.total - a.stats.total;
        return 0;
      });
  }, [curriculum, progress, searchQuery, difficultyFilter, statusFilter, selectedPatternId, sortBy]);

  const totalMatchingProblems = useMemo(() => {
    return filteredPatterns.reduce(
      (sum, p) => sum + p.variations.reduce((vSum, v) => vSum + v.problems.length, 0),
      0
    );
  }, [filteredPatterns]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-accent font-semibold">
              CURRICULUM REPOSITORY
            </span>
            <span className="text-border">·</span>
            <span className="text-[10px] font-mono text-text-tertiary">
              {countLabel(curriculumStats.patternCount, 'PATTERN', 'PATTERNS').toUpperCase()} · {countLabel(curriculumStats.variationCount, 'VARIATION', 'VARIATIONS').toUpperCase()} · {countLabel(curriculumStats.placementCount, 'PLACEMENT', 'PLACEMENTS').toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Pattern Explorer
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Indexed by algorithmic invariants. Search, filter, inspect sub-variations, and track deliberate practice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={expandAll} className="btn-subtle text-xxs">
            Expand All
          </button>
          <button onClick={collapseAll} className="btn-subtle text-xxs">
            Collapse All
          </button>
          <div className="border-l border-border h-4 mx-0.5" />
          <button
            onClick={() => setViewMode(viewMode === 'comfortable' ? 'compact' : 'comfortable')}
            className="btn-secondary text-xxs flex items-center gap-1.5"
            title="Toggle compact or comfortable display"
          >
            {viewMode === 'comfortable' ? (
              <>
                <List className="w-3 h-3" /> Compact
              </>
            ) : (
              <>
                <LayoutGrid className="w-3 h-3" /> Comfortable
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-2.5">
          {/* Search box with shortcut hint */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-text-quaternary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Filter by problem, pattern, or variation (Press '/' to focus)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 pr-14 text-xs font-sans"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-text-tertiary bg-surface-2 border border-border rounded">
                  /
                </kbd>
              </div>
            )}
          </div>

          {/* Pattern family selector */}
          <div className="w-full lg:w-56 shrink-0">
            <select
              value={selectedPatternId}
              onChange={(e) => setSelectedPatternId(e.target.value)}
              className="input-field text-xs cursor-pointer font-sans"
            >
              <option value="All">All 21 Patterns</option>
              {curriculum.patterns.map((p, idx) => (
                <option key={p.id} value={p.id}>
                  {String(idx + 1).padStart(2, '0')}. {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sorter */}
          <div className="w-full lg:w-44 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-field text-xs cursor-pointer font-sans"
            >
              <option value="default">Default Order</option>
              <option value="progress-asc">Weakest First</option>
              <option value="progress-desc">Most Completed First</option>
              <option value="problems-desc">Most Problems First</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Filter Pills row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary font-medium">
              Difficulty:
            </span>
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2 py-0.5 text-xxs font-mono rounded-md transition-colors ${
                  difficultyFilter === diff
                    ? 'bg-accent text-accent-text font-bold shadow-xs'
                    : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary font-medium">
              Status:
            </span>
            {(['All', 'not_started', 'attempted', 'solved', 'revisit'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 text-xxs font-mono rounded-md transition-colors ${
                  statusFilter === st
                    ? 'bg-accent text-accent-text font-bold shadow-xs'
                    : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle'
                }`}
              >
                {st === 'All' ? 'All' : statusLabel(st)}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-text-tertiary ml-auto tnum">
            {countLabel(totalMatchingProblems, 'PLACEMENT', 'PLACEMENTS')} MATCHED
          </span>
        </div>
      </div>

      {/* Pattern Tree Catalog */}
      <div className="space-y-3">
        {filteredPatterns.length === 0 ? (
          <div className="panel p-12 text-center text-text-tertiary space-y-2">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-text-quaternary" />
            <p className="text-sm font-semibold text-text-secondary">No matching patterns found</p>
            <p className="text-xs text-text-tertiary">Adjust your search query or reset your filters.</p>
          </div>
        ) : (
          filteredPatterns.map(({ pattern, stats, variations }) => {
            const isExpanded = expandedPatterns[pattern.id] ?? false;
            const completionPct = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

            return (
              <div
                key={pattern.id}
                className="panel overflow-hidden transition-all duration-150 border-border hover:border-border-hover"
              >
                {/* Pattern Row Header */}
                <div
                  onClick={() => togglePattern(pattern.id)}
                  className="px-4 py-3 bg-surface-1 hover:bg-surface-2/70 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className="p-1 text-text-tertiary hover:text-text-primary rounded transition-colors"
                      aria-label="Toggle pattern accordion"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-accent" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary hover:text-accent transition-colors truncate tracking-tight">
                          {pattern.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 text-text-tertiary border border-border">
                          {pattern.variations.length} vars
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-text-tertiary mt-0.5 tnum">
                        {stats.solved}/{stats.total} solved (Easy: {stats.easySolved}/{stats.easy} · Med: {stats.mediumSolved}/{stats.medium} · Hard: {stats.hardSolved}/{stats.hard})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 shrink-0 self-end sm:self-center">
                    <div className="w-24 sm:w-32 flex flex-col items-end gap-1">
                      <div className="w-full track-bar h-1.5">
                        <div
                          className="track-fill bg-accent"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-text-tertiary tnum">
                        {completionPct}% Complete
                      </span>
                    </div>

                    <Link
                      to={`/patterns/${pattern.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="btn-secondary text-xxs py-1 px-2.5 font-mono"
                    >
                      Open Detail →
                    </Link>
                  </div>
                </div>

                {/* Sub-variations and Problem list */}
                {isExpanded && (
                  <div className="border-t border-border bg-surface-0/60 p-4 space-y-3">
                    {variations.length === 0 ? (
                      <p className="text-xs text-text-tertiary italic py-2">
                        No problems match the current filter in this pattern.
                      </p>
                    ) : (
                      variations.map((variation) => (
                        <div
                          key={variation.id}
                          className="rounded-lg border border-border/80 bg-surface-1/70 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                            <span className="text-xs font-semibold text-text-primary flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                              {variation.name}
                            </span>
                            <span className="text-[10px] font-mono text-text-tertiary">
                              {variation.problems.length} problems
                            </span>
                          </div>

                          <div
                            className={
                              viewMode === 'comfortable'
                                ? 'space-y-1'
                                : 'grid grid-cols-1 sm:grid-cols-2 gap-1.5'
                            }
                          >
                            {variation.problems.map((problem) => {
                              const probStatus = getEffectiveStatus(progress, problem.id);
                              return (
                                <div
                                  key={problem.id}
                                  className="flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-md bg-surface-0/80 hover:bg-surface-2 border border-border/40 hover:border-border transition-colors group"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <StatusDot status={probStatus} />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveWorkspace({
                                          problem,
                                          patternId: pattern.id,
                                          patternName: pattern.name,
                                          variationName: variation.name,
                                        })
                                      }
                                      className="text-xs text-text-primary group-hover:text-accent font-medium text-left truncate transition-colors"
                                      title="Open problem workspace"
                                    >
                                      {problem.title}
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`badge ${difficultyBg(problem.difficulty)} text-[9px]`}>
                                      {problem.difficulty}
                                    </span>
                                    <a
                                      href={problem.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 text-text-tertiary hover:text-accent transition-colors"
                                      title="Open original LeetCode link"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Problem Workspace Modal */}
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

function StatusDot({ status }: { status: StatusOption }) {
  switch (status) {
    case 'solved':
      return <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Solved" />;
    case 'attempted':
      return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Attempted" />;
    case 'revisit':
      return <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" title="Needs Revision" />;
    default:
      return <span className="w-2 h-2 rounded-full bg-surface-4 shrink-0" title="Not Started" />;
  }
}
