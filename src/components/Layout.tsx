import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { getStreak } from '../store';
import CommandPalette from './CommandPalette';
import ProblemWorkspaceModal from './ProblemWorkspaceModal';
import type { CurriculumProblem } from '../types';

const navItems = [
  { to: '/', label: 'Today', shortcut: '1' },
  { to: '/patterns', label: 'Index', shortcut: '2' },
  { to: '/revisions', label: 'Review', shortcut: '3' },
  { to: '/analytics', label: 'Ledger', shortcut: '4' },
  { to: '/settings', label: 'Settings', shortcut: '5' },
  { to: '/scenarios', label: 'Scenarios' },
  { to: '/oa-ques', label: 'OA' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<{
    problem: CurriculumProblem;
    patternId: string;
    patternName: string;
    variationName: string;
  } | null>(null);

  const navigate = useNavigate();
  const { state } = useApp();
  const { progress } = state;
  const streak = getStreak(progress);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K for search, Alt+1-5 for nav)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.altKey) && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const item = navItems.find((n) => n.shortcut === e.key);
        if (item) navigate(item.to);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-canvas text-text-primary antialiased">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-10">
        {/* Running head */}
        <header className="font-serif flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-5 border-b border-border">
          <Link to="/" className="flex items-baseline gap-3.5 group">
            <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true" className="self-center">
              <line x1="1" y1="7" x2="25" y2="7" stroke="#e9e4d8" strokeWidth="1.2" opacity="0.6" />
              <circle cx="19" cy="7" r="3.2" className="fill-accent" />
            </svg>
            <span className="font-mono text-[13px] font-medium tracking-[0.22em]">VERTEX</span>
            <span className="lbl hidden sm:inline">Codex · Vol. I</span>
          </Link>

          <nav aria-label="Primary" className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `text-[16px] transition-colors ${
                    isActive ? 'text-text-primary italic' : 'text-text-tertiary hover:text-text-primary'
                  }`
                }
              >
                {item.label}
                {item.shortcut && (
                  <sup className="font-mono text-[9px] ml-0.5 opacity-70">⌥{item.shortcut}</sup>
                )}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Search the codex"
            className="flex items-center justify-between gap-3 min-w-[200px] py-1.5 border-b border-border-hover text-[15px] italic text-text-tertiary hover:text-text-primary hover:border-text-primary transition-colors"
          >
            Search the codex
            <kbd className="kbd-key not-italic">⌘K</kbd>
          </button>
        </header>

        <main>{children}</main>

        <footer className="mt-24 py-7 border-t border-border-hover flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <span className="lbl">VERTEX Codex · progress is kept on this device</span>
          <span className="lbl tnum">
            {streak.current} day run · best {streak.best}
          </span>
        </footer>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectProblem={(problem, patternId, patternName, variationName) => {
          setActiveWorkspace({
            problem,
            patternId,
            patternName,
            variationName,
          });
        }}
      />

      {/* Global Workspace Modal when opened via Command Palette */}
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
