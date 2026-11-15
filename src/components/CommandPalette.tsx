import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context';
import type { CurriculumProblem } from '../types';
import { useNavigate } from 'react-router-dom';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { difficultyBg, getEffectiveStatus } from '../store';
import { getCurriculumStats, countLabel } from '../lib/curriculumStats';
import oaCatalogue from '../../data/oa-ques/oa-ques.json';
import oaHackerRank from '../../data/oa-ques/hackerrank-kit.json';
import oaHackerRankChallenges from '../../data/oa-ques/hackerrank-challenges.json';
import oaCodeforces from '../../data/oa-ques/codeforces-sponsored-contests.json';
import oaAtCoder from '../../data/oa-ques/atcoder-sponsored-contests.json';
import oaTcs from '../../data/oa-ques/candidate-tcs-pyqs.json';
import scenarioCatalogue from '../../data/scenario-catalogue/scenario-catalogue.json';

type OARecord = { id: string; title: string; company: string | null; assessmentType: string; difficulty: string | null; sourceUrl: string; statement: string | null };
type ScenarioRecord = { id: string; title: string; platform: string; sourceUrl: string; difficulty?: string | null; factualScenarioSummary?: string | null; evidence: { statementExcerpt: string | null; contestSource?: string | null } };
type SearchItem =
  | { kind: 'curriculum'; key: string; title: string; subtitle: string; problem: CurriculumProblem; patternId: string; patternName: string; variationName: string }
  | { kind: 'oa'; key: string; title: string; subtitle: string; difficulty: string | null; id: string; searchText: string }
  | { kind: 'scenario'; key: string; title: string; subtitle: string; difficulty: string | null; id: string; searchText: string };

const oaLeetCode = import.meta.glob('../../data/oa-ques/leetcode-batches/*.json', { eager: true, import: 'default' }) as Record<string, { records: OARecord[] }>;
const oaCandidateBatches = import.meta.glob('../../data/oa-ques/candidate-placement-reports-batch-*.json', { eager: true, import: 'default' }) as Record<string, { records: OARecord[] }>;
const allOARecords: OARecord[] = [
  ...(oaCatalogue as { records: OARecord[] }).records,
  ...Object.values(oaLeetCode).flatMap(batch => batch.records),
  ...(oaHackerRank as { records: OARecord[] }).records,
  ...(oaHackerRankChallenges as { records: OARecord[] }).records,
  ...(oaCodeforces as { records: OARecord[] }).records,
  ...(oaAtCoder as { records: OARecord[] }).records,
  ...(oaTcs as { records: OARecord[] }).records,
  ...Object.values(oaCandidateBatches).flatMap(batch => batch.records),
];
const allScenarioRecords = (scenarioCatalogue as { records: ScenarioRecord[] }).records;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProblem: (problem: CurriculumProblem, patternId: string, patternName: string, variationName: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onSelectProblem }: CommandPaletteProps) {
  const { state } = useApp();
  const navigate = useNavigate();
  const { curriculum, progress } = state;
  const curriculumStats = curriculum ? getCurriculumStats(curriculum) : null;
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allItems = useMemo<SearchItem[]>(() => {
    const list: SearchItem[] = [];
    if (curriculum) {
      for (const pattern of curriculum.patterns) {
        for (const variation of pattern.variations) {
          for (const problem of variation.problems) {
            list.push({ kind: 'curriculum', key: 'dsa:' + problem.id, title: problem.title, subtitle: 'DSA Curriculum · ' + pattern.name + ' › ' + variation.name, problem, patternId: pattern.id, patternName: pattern.name, variationName: variation.name });
          }
        }
      }
    }
    for (const item of allOARecords) {
      list.push({ kind: 'oa', key: 'oa:' + item.id, title: item.title, subtitle: 'OA Ques · ' + (item.company || item.assessmentType) + ' · ' + item.assessmentType, difficulty: item.difficulty, id: item.id, searchText: [item.id, item.company || '', item.assessmentType, item.statement || '', item.sourceUrl].join(' ') });
    }
    for (const item of allScenarioRecords) {
      list.push({ kind: 'scenario', key: 'scenario:' + item.id, title: item.title, subtitle: 'Long Scenario Questions · ' + item.platform, difficulty: item.difficulty ?? null, id: item.id, searchText: [item.id, item.platform, item.sourceUrl, item.factualScenarioSummary || '', item.evidence.statementExcerpt || '', item.evidence.contestSource || ''].join(' ') });
    }
    return list;
  }, [curriculum]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches = allItems.filter(item => {
      const extra = item.kind === 'curriculum'
        ? [item.patternName, item.variationName, item.problem.url]
        : [item.id, item.subtitle, item.searchText];
      return [item.title, item.subtitle, ...extra].some(value => String(value || '').toLowerCase().includes(q));
    });

    // Put the requested catalogue first for section-specific searches. Otherwise
    // retain relevance across all three catalogues instead of letting the 941
    // curriculum placements crowd OA and scenario results out of the shortlist.
    const sectionBoost = (item: SearchItem) => {
      if (/^(oa|oas|online assessment|online assessments)$/.test(q)) return item.kind === 'oa' ? 100 : 0;
      if (/^(scenario|scenarios|long scenario|long scenario questions)$/.test(q)) return item.kind === 'scenario' ? 100 : 0;
      if (/^(dsa|curriculum|placements|patterns)$/.test(q)) return item.kind === 'curriculum' ? 100 : 0;
      return 0;
    };
    const score = (item: SearchItem) => {
      const title = item.title.toLowerCase();
      const subtitle = item.subtitle.toLowerCase();
      return sectionBoost(item) + (title === q ? 80 : title.startsWith(q) ? 40 : title.includes(q) ? 20 : 0) + (subtitle.includes(q) ? 5 : 0);
    };
    return matches.sort((a, b) => score(b) - score(a)).slice(0, 50);
  }, [allItems, query]);

  const selectItem = (item: SearchItem) => {
    if (item.kind === 'curriculum') {
      onSelectProblem(item.problem, item.patternId, item.patternName, item.variationName);
    } else if (item.kind === 'oa') {
      navigate('/oa-ques?search=' + encodeURIComponent(item.id));
    } else {
      navigate('/scenarios?search=' + encodeURIComponent(item.id));
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        selectItem(filteredItems[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  useEffect(() => setSelectedIndex(0), [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-surface-1 border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface-0">
          <Search className="w-4 h-4 text-accent shrink-0" />
          <input ref={inputRef} type="text" placeholder="Search any question, company, pattern, platform..." value={query} onChange={e => setQuery(e.target.value)} className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-quaternary focus:outline-none font-sans" />
          {query && <button onClick={() => setQuery('')} className="p-1 text-text-tertiary hover:text-text-primary rounded" title="Clear search"><X className="w-3.5 h-3.5" /></button>}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary bg-surface-2 border border-border rounded">ESC</kbd>
        </div>
        <div className="max-h-[min(65vh,32rem)] overflow-y-auto p-2 space-y-1">
          {!query.trim() ? (
            <div className="py-10 text-center text-xs text-text-tertiary">Search across DSA Curriculum, OA Ques and Long Scenario Questions.</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-tertiary"><p className="text-text-secondary font-medium">No questions matched "{query}".</p><p className="mt-1 text-[11px]">Try a title, company, platform, pattern or keyword.</p></div>
          ) : filteredItems.map((item, idx) => {
            const status = item.kind === 'curriculum' ? getEffectiveStatus(progress, item.problem.id) : null;
            const active = idx === selectedIndex;
            return <button key={item.key} onClick={() => selectItem(item)} onMouseEnter={() => setSelectedIndex(idx)} className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${active ? 'bg-surface-2 border border-border shadow-xs' : 'hover:bg-surface-2/60 border border-transparent'}`}>
              <span className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.kind === 'curriculum' ? (status === 'solved' ? 'bg-emerald-400' : status === 'attempted' ? 'bg-amber-400' : 'bg-surface-4') : item.kind === 'oa' ? 'bg-violet-400' : 'bg-sky-400'}`} />
                <span className="min-w-0"><span className="block text-xs font-semibold text-text-primary truncate">{item.title}</span><span className="block text-[10px] font-mono text-text-tertiary truncate">{item.subtitle}</span></span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {item.kind !== 'curriculum' && item.difficulty && <span className={`badge ${difficultyBg(item.difficulty as any)} text-[9px]`}>{item.difficulty}</span>}
                <span className="text-[9px] uppercase tracking-wide font-mono text-accent">{item.kind === 'curriculum' ? 'DSA' : item.kind === 'oa' ? 'OA' : 'Scenario'}</span>
                {active && <CornerDownLeft className="w-3 h-3 text-accent" />}
              </span>
            </button>;
          })}
        </div>
        <div className="px-4 py-2 border-t border-border bg-surface-0/60 flex items-center justify-between text-[10px] font-mono text-text-tertiary">
          <span>Navigate with ↑ and ↓ · ↵ to open</span>
          <span>{allItems.length.toLocaleString()} searchable questions</span>
        </div>
      </div>
    </div>
  );
}
