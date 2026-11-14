import React, { useMemo, useState } from 'react';
import { Search, ExternalLink, ShieldAlert, CheckCircle2, BookOpen, RotateCcw } from 'lucide-react';
import rawCatalogue from '../../data/scenario-catalogue/scenario-catalogue.json';

type ScenarioRecord = {
  id: string;
  title: string;
  platform: string;
  sourceUrl: string;
  difficulty?: string | null;
  primaryPattern: string;
  secondaryPatterns?: string[];
  factualScenarioSummary?: string | null;
  catalogueInclusion: string;
  evidenceGate: string;
  originalAuditStatus: string;
  sourceVerification?: string;
  scenarioDepth: string;
  reviewStatus: string;
  importApproved: boolean;
  evidence: {
    observedTitle?: string | null;
    observedUrl?: string | null;
    statementExcerpt: string | null;
    inputObserved?: boolean;
    outputObserved?: boolean;
    constraintsObserved?: boolean;
    retrievedAt: string | null;
    evidenceKind: string;
    contestSource?: string | null;
  };
  review: {
    scenarioFidelity?: string;
    scenarioDepth: string;
    disposition?: string;
    rationale: string;
    reviewedAt?: string | null;
    reviewer?: string | null;
  };
};

type CatalogueData = {
  schemaVersion: string;
  catalogue: string;
  counts: {
    total: number;
    historicalCertified: number;
    userAccepted: number;
    byPlatform: Record<string, number>;
    byEvidenceGate: Record<string, number>;
    byDepth: Record<string, number>;
    coreCurriculumImports: number;
  };
  records: ScenarioRecord[];
};

const catalogue = rawCatalogue as unknown as CatalogueData;

export default function ScenarioCatalogue() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('all');
  const [pattern, setPattern] = useState('all');
  const [evidence, setEvidence] = useState('all');
  const [depth, setDepth] = useState('all');

  const records = catalogue.records;

  const platforms = useMemo(() => {
    return Array.from(new Set(records.map(r => r.platform))).sort();
  }, [records]);

  const patterns = useMemo(() => {
    return Array.from(new Set(records.map(r => r.primaryPattern))).sort();
  }, [records]);

  const visible = useMemo(() => {
    return records.filter(r => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || [
        r.title,
        r.id,
        r.primaryPattern,
        r.platform,
        r.sourceUrl,
        r.factualScenarioSummary || '',
        r.evidence.contestSource || ''
      ].some(v => v.toLowerCase().includes(q));

      const matchesPlatform = platform === 'all' || r.platform.toLowerCase() === platform.toLowerCase();
      const matchesPattern = pattern === 'all' || r.primaryPattern === pattern;
      const matchesEvidence = evidence === 'all' || r.evidenceGate === evidence;
      const matchesDepth = depth === 'all' || r.scenarioDepth.toUpperCase() === depth.toUpperCase();

      return matchesQuery && matchesPlatform && matchesPattern && matchesEvidence && matchesDepth;
    });
  }, [records, query, platform, pattern, evidence, depth]);

  const hasActiveFilters = query !== '' || platform !== 'all' || pattern !== 'all' || evidence !== 'all' || depth !== 'all';

  const resetFilters = () => {
    setQuery('');
    setPlatform('all');
    setPattern('all');
    setEvidence('all');
    setDepth('all');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <header className="space-y-2 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">
          <BookOpen className="h-3.5 w-3.5" /> Extended practice collection
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Long-Scenario Catalogue</h1>
            <p className="mt-1 text-sm text-text-secondary">
              A searchable collection of {records.length} problem records from competitive programming platforms, with evidence status shown separately for every record.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-xs font-mono">
              <span className="text-accent font-semibold">{visible.length}</span>
              <span className="text-text-tertiary"> / {records.length} visible</span>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-surface-1/60 p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">Total Records</p>
          <p className="text-xl font-bold text-text-primary font-mono">{catalogue.counts.total}</p>
          <p className="text-[10px] text-text-quaternary">Across {platforms.length} platforms</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Statement Captured</p>
          <p className="text-xl font-bold text-emerald-300 font-mono">{catalogue.counts.byEvidenceGate.statement_captured || 0}</p>
          <p className="text-[10px] text-emerald-400/70">Verbatim statement on disk</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-blue-400">Metadata Verified</p>
          <p className="text-xl font-bold text-blue-300 font-mono">{catalogue.counts.byEvidenceGate.metadata_verified || 0}</p>
          <p className="text-[10px] text-blue-400/70">Platform, URL & domain summary verified</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400">User-Accepted</p>
          <p className="text-xl font-bold text-amber-300 font-mono">{catalogue.counts.userAccepted}</p>
          <p className="text-[10px] text-amber-400/70">Kattis collection pending deep audit</p>
        </div>
      </div>

      {/* Scope and Evidence Notice */}
      <div className="rounded-xl border border-border bg-surface-1/40 p-4 flex gap-3 text-xs leading-relaxed text-text-secondary">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-text-primary">Evidence Stratification & Complete Curriculum Isolation</p>
          <p>
            This catalogue contains <strong>162 problems</strong> across 3 evidentiary tiers:
            <strong> 7 replacement problems</strong> with verified verbatim statement captures and constraint audits;
            <strong> 114 historical problems</strong> with verified canonical URLs, platform identities, and factual summaries (raw statement text unextracted);
            and <strong>41 user-accepted Kattis problems</strong> included per user approval with source review pending.
            <strong> None of these 162 problems are imported into the 21-pattern curriculum, 115 variations, or 941 placements.</strong>
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <section className="panel p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-2.5">
          {/* Query input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-quaternary" />
            <input
              aria-label="Search scenarios"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search title, ID, pattern, context, contest..."
              className="input-field pl-9 text-xs w-full"
            />
          </div>

          {/* Platform filter */}
          <select
            aria-label="Filter by platform"
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="input-field text-xs lg:w-44"
          >
            <option value="all">All platforms ({records.length})</option>
            {platforms.map(p => {
              const count = records.filter(r => r.platform.toLowerCase() === p.toLowerCase()).length;
              return (
                <option key={p} value={p}>
                  {p} ({count})
                </option>
              );
            })}
          </select>

          {/* Pattern filter */}
          <select
            aria-label="Filter by pattern"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            className="input-field text-xs lg:w-60"
          >
            <option value="all">All patterns</option>
            {patterns.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Evidence filter */}
          <select
            aria-label="Filter by evidence"
            value={evidence}
            onChange={e => setEvidence(e.target.value)}
            className="input-field text-xs lg:w-52"
          >
            <option value="all">All evidence states</option>
            <option value="statement_captured">Statement Captured ({catalogue.counts.byEvidenceGate.statement_captured || 0})</option>
            <option value="metadata_verified">Metadata & URL Verified ({catalogue.counts.byEvidenceGate.metadata_verified || 0})</option>
            <option value="pending">User-Accepted / Pending ({catalogue.counts.userAccepted})</option>
          </select>

          {/* Depth filter */}
          <select
            aria-label="Filter by scenario depth"
            value={depth}
            onChange={e => setDepth(e.target.value)}
            className="input-field text-xs lg:w-36"
          >
            <option value="all">All depths</option>
            <option value="STRONG">Strong ({catalogue.counts.byDepth.STRONG || 0})</option>
            <option value="MODERATE">Moderate ({catalogue.counts.byDepth.MODERATE || 0})</option>
          </select>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 text-xs text-text-secondary hover:text-text-primary transition-colors shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-tertiary font-mono pt-1">
          <span>
            Showing {visible.length} of {records.length} problems
          </span>
          {hasActiveFilters && (
            <span className="text-accent">Filtered view active</span>
          )}
        </div>
      </section>

      {/* Problem Cards */}
      <div className="grid gap-3.5">
        {visible.map(r => {
          const depthBadge = r.evidenceGate === 'pending' ? 'Depth Pending Review' : (r.scenarioDepth === 'STRONG' ? 'Recorded: Strong' : 'Recorded: Moderate');

          return (
            <article
              key={r.id}
              className="rounded-xl border border-border bg-surface-1/60 hover:border-border-focus p-4 space-y-3 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-2 text-text-secondary border border-border">
                      {r.id}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-surface-2 text-accent border border-accent/20">
                      {r.platform}
                    </span>
                    {r.difficulty && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-text-tertiary border border-border">
                        {r.difficulty}
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-text-quaternary border border-border">
                      {depthBadge}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-text-primary tracking-tight">
                    {r.title}
                  </h2>
                  <p className="text-xs font-medium text-accent">
                    {r.primaryPattern}
                  </p>
                </div>

                {/* Evidence tier badge */}
                <div className="shrink-0">
                  {r.evidenceGate === 'statement_captured' ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Statement Captured
                    </span>
                  ) : r.evidenceGate === 'metadata_verified' ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-mono text-blue-300">
                      <BookOpen className="h-3.5 w-3.5" />
                      Metadata & URL Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-mono text-amber-300">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      User-Accepted · Evidence Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Factual Scenario Context / Statement Excerpt */}
              <div className="text-xs leading-relaxed text-text-secondary space-y-1">
                {r.evidence.statementExcerpt ? (
                  <p className="line-clamp-3 italic text-text-primary/90">"{r.evidence.statementExcerpt}"</p>
                ) : r.factualScenarioSummary ? (
                  <p className="line-clamp-3">{r.factualScenarioSummary}</p>
                ) : (
                  <p className="line-clamp-3 text-text-tertiary">{r.review.rationale}</p>
                )}
              </div>

              {/* Secondary patterns if present */}
              {r.secondaryPatterns && r.secondaryPatterns.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {r.secondaryPatterns.map(sp => (
                    <span
                      key={sp}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2/60 text-text-tertiary border border-border/60"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-[11px] font-mono text-text-tertiary">
                <div className="flex flex-wrap items-center gap-3">
                  {r.evidence.contestSource && (
                    <span className="text-text-quaternary truncate max-w-xs sm:max-w-md">
                      Source: {r.evidence.contestSource}
                    </span>
                  )}
                  <span>Status: {r.catalogueInclusion === 'historical_certified' ? 'Historical Catalogue Record' : 'User-Accepted'}</span>
                </div>
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline font-medium ml-auto"
                >
                  Open on {r.platform} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </article>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-2">
            <p className="text-sm font-medium text-text-secondary">No scenarios match your search or filter criteria.</p>
            <p className="text-xs text-text-quaternary">Try clearing some filters or searching for a different keyword.</p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
