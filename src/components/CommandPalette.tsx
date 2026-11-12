import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context';
import type { CurriculumProblem } from '../types';
import {
  Search,
  X,
  ChevronRight,
  ArrowRight,
  Layers,
  Sparkles,
  CornerDownLeft,
} from 'lucide-react';
import { difficultyBg, getEffectiveStatus } from '../store';
import { getCurriculumStats, countLabel } from '../lib/curriculumStats';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProblem: (problem: CurriculumProblem, patternId: string, patternName: string, variationName: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onSelectProblem }: CommandPaletteProps) {
  const { state } = useApp();
  const { curriculum, progress } = state;
  const curriculumStats = curriculum ? getCurriculumStats(curriculum) : null;

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Flatten all problems with pattern metadata
  const allProblems = useMemo(() => {
    if (!curriculum) return [];
    const list: {
      problem: CurriculumProblem;
      patternId: string;
      patternName: string;
      variationName: string;
    }[] = [];

    for (const pattern of curriculum.patterns) {
      for (const variation of pattern.variations) {
        for (const problem of variation.problems) {
          list.push({
            problem,
            patternId: pattern.id,
            patternName: pattern.name,
            variationName: variation.name,
          });
        }
      }
    }
    return list;
  }, [curriculum]);

  // Filter problems by query
  const filteredProblems = useMemo(() => {
    if (!query.trim()) return allProblems.slice(0, 8);
    const q = query.toLowerCase().trim();
    return allProblems
      .filter(
        (item) =>
          item.problem.title.toLowerCase().includes(q) ||
          item.patternName.toLowerCase().includes(q) ||
          item.variationName.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [allProblems, query]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredProblems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredProblems.length) % Math.max(1, filteredProblems.length));
      } else if (e.key === 'Enter' && filteredProblems[selectedIndex]) {
        e.preventDefault();
        const sel = filteredProblems[selectedIndex];
        onSelectProblem(sel.problem, sel.patternId, sel.patternName, sel.variationName);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredProblems, onClose, onSelectProblem]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-surface-1 border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface-0">
          <Search className="w-4 h-4 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a problem name, pattern, or variation..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-quaternary focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-text-tertiary hover:text-text-primary rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary bg-surface-2 border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredProblems.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-tertiary space-y-1">
              <p className="text-text-secondary font-medium">No problems matched "{query}".</p>
              <p className="text-[11px] text-text-quaternary font-mono">
                Search examples: "Two Sum", "Sliding Window", "Graph", "DFS", "Binary Search".
              </p>
            </div>
          ) : (
            filteredProblems.map((item, idx) => {
              const status = getEffectiveStatus(progress, item.problem.id);
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.problem.id}
                  onClick={() => {
                    onSelectProblem(item.problem, item.patternId, item.patternName, item.variationName);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-surface-2 border border-border shadow-xs'
                      : 'hover:bg-surface-2/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        status === 'solved'
                          ? 'bg-emerald-400'
                          : status === 'attempted'
                          ? 'bg-amber-400'
                          : status === 'revisit'
                          ? 'bg-indigo-400'
                          : 'bg-surface-4'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {item.problem.title}
                      </p>
                      <p className="text-[10px] font-mono text-text-tertiary truncate">
                        {item.patternName} &rsaquo; {item.variationName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge ${difficultyBg(item.problem.difficulty)} text-[9px]`}>
                      {item.problem.difficulty}
                    </span>
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-accent">
                        Open <CornerDownLeft className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-border bg-surface-0/60 flex items-center justify-between text-[10px] font-mono text-text-tertiary">
          <span>Navigate with ↑ and ↓ · ↵ to select</span>
          <span>
            {curriculumStats
              ? `${countLabel(curriculumStats.placementCount, 'placement', 'placements')} · ${countLabel(curriculumStats.uniqueCanonicalProblemCount, 'unique problem', 'unique problems')}`
              : 'No curriculum loaded'}
          </span>
        </div>
      </div>
    </div>
  );
}
