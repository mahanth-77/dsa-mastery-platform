import React, { useMemo, useState } from 'react';
import { Search, ExternalLink, ClipboardList, ShieldCheck, Clock3, Building2, RotateCcw } from 'lucide-react';
import rawCatalogue from '../../data/oa-ques/oa-ques.json';

type OAQuestion = {
  id: string;
  title: string;
  company: string | null;
  assessmentType: string;
  difficulty: string | null;
  sourceUrl: string;
  sourceType: 'company_verified' | 'oa_style_practice';
  verificationStatus: 'verified' | 'pending_review';
  durationMinutes: number | null;
  statement: string | null;
};

type OACatalogue = {
  schemaVersion: string;
  catalogue: string;
  counts: {
    total: number;
    companyVerified: number;
    oaStylePractice: number;
    pendingReview: number;
  };
  records: OAQuestion[];
};

const catalogue = rawCatalogue as OACatalogue;

export default function OAQuestions() {
  const [query, setQuery] = useState('');
  const [company, setCompany] = useState('all');
  const [type, setType] = useState('all');
  const [source, setSource] = useState('all');

  const records = catalogue.records;
  const companies = useMemo(
    () => Array.from(new Set(records.map((item) => item.company).filter((value): value is string => Boolean(value)))).sort(),
    [records],
  );

  const visible = useMemo(() => records.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [item.title, item.id, item.company || '', item.assessmentType, item.statement || '']
      .some((value) => value.toLowerCase().includes(q));
    const matchesCompany = company === 'all' || item.company === company;
    const matchesType = type === 'all' || item.assessmentType === type;
    const matchesSource = source === 'all' || item.sourceType === source;
    return matchesQuery && matchesCompany && matchesType && matchesSource;
  }), [records, query, company, type, source]);

  const hasFilters = query !== '' || company !== 'all' || type !== 'all' || source !== 'all';
  const reset = () => {
    setQuery('');
    setCompany('all');
    setType('all');
    setSource('all');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="space-y-2 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">
          <ClipboardList className="h-3.5 w-3.5" /> OA Preparation
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">OA Ques</h1>
            <p className="mt-1 max-w-3xl text-sm text-text-secondary">
              A separate collection for online-assessment coding questions. Browse by company and assessment type without changing your DSA curriculum or Scenario Questions.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-xs font-mono">
            <span className="text-accent font-semibold">{visible.length}</span>
            <span className="text-text-tertiary"> / {records.length} questions</span>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-surface-1/60 p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">Total Questions</p>
          <p className="text-xl font-bold text-text-primary font-mono">{catalogue.counts.total}</p>
          <p className="text-[10px] text-text-quaternary">Separate OA catalogue</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Company Verified</p>
          <p className="text-xl font-bold text-emerald-300 font-mono">{catalogue.counts.companyVerified}</p>
          <p className="text-[10px] text-emerald-400/70">Supported by reliable evidence</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-blue-400">OA-Style Practice</p>
          <p className="text-xl font-bold text-blue-300 font-mono">{catalogue.counts.oaStylePractice}</p>
          <p className="text-[10px] text-blue-400/70">Practice, not claimed as actual OAs</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Pending Review</p>
          <p className="text-xl font-bold text-amber-300 font-mono">{catalogue.counts.pendingReview}</p>
          <p className="text-[10px] text-amber-400/70">Not presented as verified</p>
        </div>
      </section>

      <div className="rounded-xl border border-border bg-surface-1/40 p-4 flex gap-3 text-xs leading-relaxed text-text-secondary">
        <ShieldCheck className="h-5 w-5 shrink-0 text-accent mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">Evidence-first question labels</p>
          <p>
            A question is labelled as a company OA only when its company association is supported by a reliable source. Other useful coding problems will be labelled OA-style practice. A company name or an online discussion alone is not enough to claim that a question appeared in an actual assessment.
          </p>
        </div>
      </div>

      <section className="panel p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-quaternary" />
            <input aria-label="Search OA questions" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Search question, company or assessment..." className="input-field pl-9 text-xs w-full" />
          </div>
          <select aria-label="Filter by company" value={company} onChange={(event) => setCompany(event.target.value)} className="input-field text-xs lg:w-48">
            <option value="all">All companies</option>
            {companies.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select aria-label="Filter by assessment type" value={type} onChange={(event) => setType(event.target.value)} className="input-field text-xs lg:w-48">
            <option value="all">All assessment types</option>
            {Array.from(new Set(records.map((item) => item.assessmentType))).sort().map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select aria-label="Filter by source type" value={source} onChange={(event) => setSource(event.target.value)} className="input-field text-xs lg:w-52">
            <option value="all">All question types</option>
            <option value="company_verified">Company-verified</option>
            <option value="oa_style_practice">OA-style practice</option>
          </select>
          {hasFilters && <button onClick={reset} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 text-xs text-text-secondary transition-colors shrink-0">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>}
        </div>
        <div className="flex items-center justify-between text-[11px] text-text-tertiary font-mono pt-1">
          <span>Showing {visible.length} of {records.length} questions</span>
          {hasFilters && <span className="text-accent">Filtered view active</span>}
        </div>
      </section>

      <div className="grid gap-3.5">
        {visible.map((item) => (
          <article key={item.id} className="rounded-xl border border-border bg-surface-1/60 hover:border-border-focus p-4 space-y-3 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-surface-2 text-text-secondary border border-border">{item.id}</span>
                  {item.company && <span className="px-2 py-0.5 rounded bg-surface-2 text-accent border border-accent/20">{item.company}</span>}
                  <span className="px-2 py-0.5 rounded bg-surface-2 text-text-tertiary border border-border">{item.difficulty || 'Difficulty unverified'}</span>
                  {item.durationMinutes && <span className="inline-flex items-center gap-1 text-text-tertiary"><Clock3 className="h-3 w-3" /> {item.durationMinutes} min</span>}
                </div>
                <h2 className="text-base font-semibold text-text-primary">{item.title}</h2>
                <p className="text-xs text-text-secondary">{item.statement || 'Question statement is available at the original source.'}</p>
              </div>
              <span className="shrink-0 text-[10px] font-mono px-2.5 py-1 rounded border border-border bg-surface-2 text-text-secondary">
                {item.sourceType === 'company_verified' ? 'Company OA · Verified' : 'OA-style practice'}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-[11px] font-mono text-text-tertiary">
              <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {item.assessmentType}</span>
              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline font-medium ml-auto">
                Open original question <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </article>
        ))}
        {visible.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
            <ClipboardList className="h-8 w-8 text-text-quaternary mx-auto" />
            <p className="text-sm font-medium text-text-secondary">{records.length === 0 ? 'OA Ques is ready for its first verified question set.' : 'No OA questions match your filters.'}</p>
            <p className="text-xs text-text-quaternary max-w-xl mx-auto">
              {records.length === 0
                ? 'The section is live as an independent catalogue, but no question records have been added yet. We will add questions only after checking the original problem links and evidence for company attribution.'
                : 'Try clearing a filter or searching for a different keyword.'}
            </p>
            {hasFilters && <button onClick={reset} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-xs text-text-secondary hover:text-text-primary transition-colors"><RotateCcw className="h-3.5 w-3.5" /> Reset filters</button>}
          </div>
        )}
      </div>
    </div>
  );
}
