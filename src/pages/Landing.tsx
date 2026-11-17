import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context';
import { getCurriculumStats } from '../lib/curriculumStats';
import PatternGlyph from '../components/PatternGlyph';

export const ENTERED_KEY = 'vertex-entered';

/** True when this browser has never opened the app and holds no progress yet. */
export function isFirstVisit(hasProgress: boolean): boolean {
  if (hasProgress) return false;
  try {
    return localStorage.getItem(ENTERED_KEY) !== '1';
  } catch {
    return false;
  }
}

const STEPS = [
  ['Learn the shape', 'Each of the 21 patterns is a mechanism: a window, a pointer, a stack. Learn the mechanism once and many problems become one problem.'],
  ['Practise in order', 'Variations run from the plain form to the tricky ones, so every problem teaches something the last one did not.'],
  ['Review on schedule', 'Solved problems come back on a spaced schedule, so the pattern is still there on the day of the test.'],
];

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const { state } = useApp();
  const curriculum = state.curriculum;
  const stats = curriculum ? getCurriculumStats(curriculum) : null;
  const patterns = curriculum?.patterns ?? [];

  return (
    <div className="font-serif animate-fade-in">
      <section className="pt-16 sm:pt-24 pb-14 border-b border-border">
        <p className="lbl mb-6">Data structures &amp; algorithms · pattern by pattern</p>
        <h1 className="font-display text-[44px] sm:text-[76px] leading-[0.98] max-w-4xl">
          Stop memorising problems.<br />
          <em className="italic">Learn the 21 shapes</em> behind them.
        </h1>
        <p className="mt-8 max-w-2xl text-[19px] leading-relaxed text-text-secondary">
          VERTEX organises {stats ? `${stats.uniqueCanonicalProblemCount} ` : ''}interview and placement problems into
          {patterns.length || 21} patterns, tracks what you have solved, and brings each one back just before you would forget it.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            to={`/patterns/${patterns[0]?.id ?? ''}`}
            onClick={onEnter}
            className="px-7 py-3 bg-text-primary text-canvas text-[16px] hover:bg-accent hover:text-canvas transition-colors"
          >
            Start the first pattern
          </Link>
          <Link to="/learn/" className="text-[16px] italic text-text-secondary hover:text-text-primary border-b border-border-hover">
            Read the pattern guide
          </Link>
        </div>
        <p className="lbl mt-6">Free to start · no sign-up needed · progress is kept on this device</p>
      </section>

      <section className="py-14 border-b border-border grid gap-10 sm:grid-cols-3">
        {STEPS.map(([title, body], i) => (
          <div key={title}>
            <span className="lbl">0{i + 1}</span>
            <h2 className="text-[24px] mt-2 mb-3">{title}</h2>
            <p className="text-[16px] leading-relaxed text-text-secondary">{body}</p>
          </div>
        ))}
      </section>

      <section className="py-14" aria-labelledby="landing-index">
        <h2 id="landing-index" className="text-[28px] mb-8">The index</h2>
        <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 border border-border">
          {patterns.map((p) => (
            <li key={p.id} className="bg-canvas">
              <Link to={`/patterns/${p.id}`} onClick={onEnter} className="group flex items-center gap-4 p-5 hover:bg-surface-1 transition-colors">
                <PatternGlyph patternId={p.id} className="w-12 h-12 shrink-0" />
                <span className="text-[17px]">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
