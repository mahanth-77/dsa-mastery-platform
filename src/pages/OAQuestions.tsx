import React, { useMemo, useState } from 'react';
import { Search, ExternalLink, ClipboardList, ShieldCheck, Clock3, Building2, RotateCcw } from 'lucide-react';
import rawCatalogue from '../../data/oa-ques/oa-ques.json';
import rawHackerRank from '../../data/oa-ques/hackerrank-kit.json';

type OAQuestion = {
  id: string; title: string; company: string | null; assessmentType: string;
  difficulty: string | null; sourceUrl: string;
  sourceType: 'company_verified' | 'candidate_reported_actual_oa' | 'oa_style_practice';
  evidenceNote?: string;
  verificationStatus: 'verified' | 'pending_review';
  durationMinutes: number | null; statement: string | null;
};
type OACatalogue = { schemaVersion?: string; catalogue?: string; records: OAQuestion[] };
const catalogue = rawCatalogue as OACatalogue;
const hackerRankCatalogue = rawHackerRank as { records: OAQuestion[] };
const leetcodeBatches = import.meta.glob('../../data/oa-ques/leetcode-batches/*.json', { eager: true, import: 'default' }) as Record<string, { records: OAQuestion[] }>;
const allRecords: OAQuestion[] = [
  ...catalogue.records,
  ...Object.values(leetcodeBatches).flatMap((batch) => batch.records),
  ...hackerRankCatalogue.records,
];

export default function OAQuestions() {
  const [query, setQuery] = useState('');
  const [company, setCompany] = useState('all');
  const [type, setType] = useState('all');
  const [source, setSource] = useState('all');
  const records = allRecords;

  const companyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((item) => {
      const name = item.company?.trim();
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);
  const companies = companyCounts.map((item) => item.name);
  const verifiedCount = records.filter((item) => item.sourceType === 'company_verified' && item.verificationStatus === 'verified').length;
  const candidateReportedCount = records.filter((item) => item.sourceType === 'candidate_reported_actual_oa').length;
  const practiceCount = records.filter((item) => item.sourceType === 'oa_style_practice').length;
  const pendingCount = records.filter((item) => item.verificationStatus === 'pending_review').length;
  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((item) => counts.set(item.assessmentType, (counts.get(item.assessmentType) || 0) + 1));
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [records]);

  const visible = useMemo(() => records.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [item.title, item.id, item.company || '', item.assessmentType, item.statement || ''].some((value) => value.toLowerCase().includes(q));
    const matchesCompany = company === 'all' || item.company?.trim() === company;
    const matchesType = type === 'all' || item.assessmentType === type;
    const matchesSource = source === 'all' || item.sourceType === source;
    return matchesQuery && matchesCompany && matchesType && matchesSource;
  }), [records, query, company, type, source]);

  const hasFilters = query !== '' || company !== 'all' || type !== 'all' || source !== 'all';
  const reset = () => { setQuery(''); setCompany('all'); setType('all'); setSource('all'); };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="space-y-2 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-accent font-semibold"><ClipboardList className="h-3.5 w-3.5" /> OA Preparation</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">OA Ques</h1>
            <p className="mt-1 max-w-3xl text-sm text-text-secondary">Browse employer-evidenced and community-reported OA questions alongside clearly labelled company-tagged and platform practice. Practice tags do not prove a question appeared in an actual employer assessment.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-xs font-mono"><span className="text-accent font-semibold">{visible.length}</span><span className="text-text-tertiary"> / {records.length} questions shown</span></div>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-border bg-surface-1/60 p-3 space-y-1"><p className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">Total Questions</p><p className="text-xl font-bold text-text-primary font-mono">{records.length}</p><p className="text-[10px] text-text-quaternary">All sourced records</p></div>
        <div className="rounded-xl border border-border bg-surface-1/60 p-3 space-y-1"><p className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">Companies</p><p className="text-xl font-bold text-text-primary font-mono">{companies.length}</p><p className="text-[10px] text-text-quaternary">With company associations</p></div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1"><p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Company Verified</p><p className="text-xl font-bold text-emerald-300 font-mono">{verifiedCount}</p><p className="text-[10px] text-emerald-400/70">Verified company attribution</p></div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-1"><p className="text-[10px] font-mono uppercase tracking-wider text-violet-400">Candidate-reported OA</p><p className="text-xl font-bold text-violet-300 font-mono">{candidateReportedCount}</p><p className="text-[10px] text-violet-400/70">Community evidence, not employer-published</p></div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-1"><p className="text-[10px] font-mono uppercase tracking-wider text-blue-400">OA-Style Practice</p><p className="text-xl font-bold text-blue-300 font-mono">{practiceCount}</p><p className="text-[10px] text-blue-400/70">Not claimed as actual OAs</p></div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1"><p className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Pending Review</p><p className="text-xl font-bold text-amber-300 font-mono">{pendingCount}</p><p className="text-[10px] text-amber-400/70">Awaiting evidence review</p></div>
      </section>

      <div className="rounded-xl border border-border bg-surface-1/40 p-4 flex gap-3 text-xs leading-relaxed text-text-secondary">
        <ShieldCheck className="h-5 w-5 shrink-0 text-accent mt-0.5" />
        <div className="space-y-1"><p className="text-sm font-semibold text-text-primary">Evidence-first question labels</p><p>Candidate-reported records are linked to public placement repositories and cohort references where available; this is not the same as employer-published confirmation. Questions without a campus or year tag remain pending review. LeetCode company tags and HackerRank preparation-kit problems are practice evidence only, not proof of actual employer OA use. Sponsored contests are not counted as hiring OAs.</p></div>
      </div>

      <section className="space-y-3">
        <div><h2 className="text-sm font-semibold text-text-primary">Question counts by source</h2><p className="text-xs text-text-tertiary">Counts update from the imported catalogue. Company-tagged practice is not employer-confirmed OA evidence.</p></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sourceCounts.map((item) => <div key={item.name} className="rounded-lg border border-border bg-surface-1/50 px-3 py-2.5 flex items-center justify-between gap-3"><span className="text-xs text-text-secondary">{item.name}</span><span className="font-mono text-sm font-semibold text-text-primary tabular-nums">{item.count}</span></div>)}
        </div>
      </section>

      <section className="panel p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-2.5">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-quaternary" /><input aria-label="Search OA questions" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search question or company name (e.g. Amazon)..." className="input-field pl-9 text-xs w-full" /></div>
          <select aria-label="Filter by company" value={company} onChange={(event) => setCompany(event.target.value)} className="input-field text-xs lg:w-48"><option value="all">All companies</option>{companies.map((name) => <option key={name} value={name}>{name} ({companyCounts.find((item) => item.name === name)?.count || 0})</option>)}</select>
          <select aria-label="Filter by assessment type" value={type} onChange={(event) => setType(event.target.value)} className="input-field text-xs lg:w-48"><option value="all">All assessment types</option>{Array.from(new Set(records.map((item) => item.assessmentType))).sort().map((name) => <option key={name} value={name}>{name}</option>)}</select>
          <select aria-label="Filter by source type" value={source} onChange={(event) => setSource(event.target.value)} className="input-field text-xs lg:w-52"><option value="all">All question types</option><option value="company_verified">Employer-verified</option><option value="candidate_reported_actual_oa">Candidate-reported OA</option><option value="oa_style_practice">OA-style practice</option></select>
          {hasFilters && <button onClick={reset} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 text-xs text-text-secondary transition-colors shrink-0"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>}
        </div>
        <div className="flex items-center justify-between text-[11px] text-text-tertiary font-mono pt-1"><span>Showing {visible.length} of {records.length} questions</span>{hasFilters && <span className="text-accent">Filtered view active</span>}</div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2"><div><h2 className="text-sm font-semibold text-text-primary">Questions by company</h2><p className="text-xs text-text-tertiary">Select a company to show all of its tagged questions.</p></div><span className="text-[11px] font-mono text-text-tertiary">{companies.length} companies</span></div>
        {companyCounts.length > 0 ? <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[1fr_auto] gap-3 bg-surface-2 px-4 py-2 text-[10px] uppercase tracking-wider font-mono text-text-tertiary"><span>Company</span><span>Questions</span></div>
          {companyCounts.map((item) => <button key={item.name} onClick={() => { setCompany(item.name); setQuery(''); }} className={`grid w-full grid-cols-[1fr_auto] gap-3 px-4 py-3 text-left text-xs border-t border-border/70 hover:bg-surface-2 transition-colors ${company === item.name ? 'bg-accent/5' : ''}`}><span className="font-medium text-text-primary">{item.name}</span><span className="font-mono tabular-nums text-accent">{item.count}</span></button>)}
        </div> : <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-text-tertiary">No company counts yet. Counts will appear automatically as company-tagged OA questions are added.</div>}
      </section>

      <div className="grid gap-3.5">
        {visible.map((item) => <article key={item.id} className="rounded-xl border border-border bg-surface-1/60 hover:border-border-focus p-4 space-y-3 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="space-y-1 min-w-0"><div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-surface-2 text-text-secondary border border-border">{item.id}</span>
              {item.company && <button onClick={() => { setCompany(item.company!.trim()); setQuery(''); }} className="px-2 py-0.5 rounded bg-surface-2 text-accent border border-accent/20 hover:bg-accent/10">{item.company}</button>}
              <span className="px-2 py-0.5 rounded bg-surface-2 text-text-tertiary border border-border">{item.difficulty || 'Difficulty unverified'}</span>
              {item.durationMinutes && <span className="inline-flex items-center gap-1 text-text-tertiary"><Clock3 className="h-3 w-3" /> {item.durationMinutes} min</span>}
            </div><h2 className="text-base font-semibold text-text-primary">{item.title}</h2><p className="text-xs text-text-secondary">{item.statement || 'Question statement is available at the original source.'}</p>{item.evidenceNote && <p className="text-[10px] text-text-tertiary">Source context: {item.evidenceNote}</p>}</div>
            <span className="shrink-0 text-[10px] font-mono px-2.5 py-1 rounded border border-border bg-surface-2 text-text-secondary">{item.sourceType === 'company_verified' && item.verificationStatus === 'verified' ? 'Employer-verified OA' : item.sourceType === 'company_verified' ? 'Employer attribution · Pending review' : item.sourceType === 'candidate_reported_actual_oa' ? (item.verificationStatus === 'verified' ? 'Candidate-reported OA · Evidence linked' : 'Candidate-reported OA · Pending review') : 'OA-style practice'}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-[11px] font-mono text-text-tertiary"><span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {item.assessmentType}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline font-medium ml-auto">Open original question <ExternalLink className="h-3 w-3" /></a></div>
        </article>)}
        {visible.length === 0 && <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3"><ClipboardList className="h-8 w-8 text-text-quaternary mx-auto" /><p className="text-sm font-medium text-text-secondary">{records.length === 0 ? 'OA Ques is ready for its first question set.' : 'No OA questions match your search or filters.'}</p><p className="text-xs text-text-quaternary max-w-xl mx-auto">{records.length === 0 ? 'There are currently no question records in this catalogue. Company tags, searchable company names and per-company counts will populate automatically when questions are added.' : 'Try clearing a filter or searching for a different keyword.'}</p>{hasFilters && <button onClick={reset} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-xs text-text-secondary hover:text-text-primary transition-colors"><RotateCcw className="h-3.5 w-3.5" /> Reset filters</button>}</div>}
      </div>
    </div>
  );
}
