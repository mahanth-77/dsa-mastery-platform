import React, { useMemo, useState } from 'react';
import { Search, ExternalLink, ShieldAlert, BookOpen, Filter } from 'lucide-react';
import rawCatalogue from '../../data/scenario-catalogue/kattis-41-user-accepted.json';

type ScenarioRecord = {
  id: string; title: string; platform: string; sourceUrl: string;
  primaryPattern: string; secondaryPatterns?: string[];
  catalogueInclusion: string; evidenceGate: string; originalAuditStatus: string;
  review: { scenarioDepth: string; scenarioFidelity: string; rationale: string };
  evidence: { evidenceKind: string; statementExcerpt: string | null; retrievedAt: string | null };
};
const catalogue = rawCatalogue as { counts: { total: number }; records: ScenarioRecord[] };

export default function ScenarioCatalogue() {
  const [query, setQuery] = useState('');
  const [pattern, setPattern] = useState('all');
  const [evidence, setEvidence] = useState('all');
  const records = catalogue.records;
  const patterns = useMemo(() => Array.from(new Set(records.map(r => r.primaryPattern))).sort(), [records]);
  const visible = useMemo(() => records.filter(r => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [r.title, r.id, r.primaryPattern, r.sourceUrl].some(v => v.toLowerCase().includes(q));
    const matchesPattern = pattern === 'all' || r.primaryPattern === pattern;
    const matchesEvidence = evidence === 'all' || (evidence === 'pending' ? r.evidenceGate === 'pending' : r.evidence.statementExcerpt !== null);
    return matchesQuery && matchesPattern && matchesEvidence;
  }), [records, query, pattern, evidence]);

  return <div className="space-y-6 animate-fade-in">
    <header className="space-y-2 border-b border-border pb-5">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">
        <BookOpen className="h-3.5 w-3.5" /> Extended practice collection
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Long-Scenario Catalogue</h1>
          <p className="mt-1 text-sm text-text-secondary">A separate collection of Kattis problems selected by you for VERTEX.</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-xs font-mono">
          <span className="text-text-primary font-semibold">{records.length}</span><span className="text-text-tertiary"> / 41 included</span>
        </div>
      </div>
    </header>
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3">
      <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-primary">User-accepted set · evidence review remains separate</p>
        <p className="text-xs leading-relaxed text-text-secondary">These 41 entries are included because you approved this collection. Some source statements, exact source mappings, or scenario-depth assessments remain incomplete. This catalogue does not label them independently verified and does not change your 21-pattern curriculum, 941 placements, or revision statistics.</p>
      </div>
    </div>
    <section className="panel p-3 space-y-3">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-quaternary" />
          <input aria-label="Search scenarios" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search title, ID, pattern…" className="input-field pl-9 text-xs" />
        </div>
        <select aria-label="Filter by pattern" value={pattern} onChange={e=>setPattern(e.target.value)} className="input-field text-xs lg:w-64">
          <option value="all">All patterns</option>{patterns.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <select aria-label="Filter by evidence" value={evidence} onChange={e=>setEvidence(e.target.value)} className="input-field text-xs lg:w-48">
          <option value="all">All evidence states</option><option value="pending">Evidence pending</option><option value="captured">Statement excerpt captured</option>
        </select>
      </div>
      <p className="text-[11px] text-text-tertiary font-mono">{visible.length} of {records.length} scenarios</p>
    </section>
    <div className="grid gap-3">
      {visible.map(r=><article key={r.id} className="rounded-xl border border-border bg-surface-1/60 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-text-tertiary">{r.id} · KATTIS</div>
            <h2 className="mt-1 text-base font-semibold text-text-primary">{r.title}</h2>
            <p className="mt-1 text-xs text-text-secondary">{r.primaryPattern}</p>
          </div>
          <span className="inline-flex w-fit rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[10px] font-mono text-amber-300">Evidence pending</span>
        </div>
        <p className="text-xs leading-relaxed text-text-secondary">{r.review.rationale}</p>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-text-tertiary">
          <span>Depth: {r.review.scenarioDepth}</span><span>Source: {r.evidence.evidenceKind}</span>
          <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">Open Kattis <ExternalLink className="h-3 w-3" /></a>
        </div>
      </article>)}
      {visible.length===0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-text-tertiary">No scenarios match these filters.</div>}
    </div>
  </div>;
}
