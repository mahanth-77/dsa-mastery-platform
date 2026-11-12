import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Binary,
  Clock,
  BarChart2,
  Sliders,
  Menu,
  X,
  Flame,
  Search,
  HardDrive,
  Layers,
} from 'lucide-react';
import { useApp } from '../context';
import { getGlobalStats, getStreak } from '../store';
import { getCurriculumStats, countLabel } from '../lib/curriculumStats';
import CommandPalette from './CommandPalette';
import ProblemWorkspaceModal from './ProblemWorkspaceModal';
import type { CurriculumProblem } from '../types';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, shortcut: '1' },
  { to: '/patterns', label: 'Pattern Explorer', icon: Binary, shortcut: '2' },
  { to: '/revisions', label: 'Revision Queue', icon: Clock, shortcut: '3' },
  { to: '/analytics', label: 'Analytics', icon: BarChart2, shortcut: '4' },
  { to: '/settings', label: 'Settings', icon: Sliders, shortcut: '5' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<{
    problem: CurriculumProblem;
    patternId: string;
    patternName: string;
    variationName: string;
  } | null>(null);

  const navigate = useNavigate();
  const { state } = useApp();
  const { curriculum, progress } = state;

  const stats = curriculum ? getGlobalStats(curriculum, progress) : null;
  const curriculumStats = curriculum ? getCurriculumStats(curriculum) : null;
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
    <div className="flex h-screen overflow-hidden bg-canvas text-text-primary antialiased">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-60 bg-surface-0 border-r border-border
          flex flex-col justify-between
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              {/* Minimalist Vertex geometric glyph */}
              <div className="w-7 h-7 rounded-lg bg-surface-2 border border-border flex items-center justify-center group-hover:border-accent/40 group-hover:bg-surface-3 transition-colors shadow-xs">
                <div className="relative w-3.5 h-3.5">
                  <span className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="absolute inset-0 border-t border-accent/40 rotate-45" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-wider text-text-primary font-mono uppercase">
                    VERTEX
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-accent-muted text-accent border border-accent-border rounded">
                    DSA
                  </span>
                </div>
                <span className="text-[10px] text-text-tertiary font-mono -mt-0.5">
                  PATTERN ENGINE
                </span>
              </div>
            </NavLink>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-text-tertiary hover:text-text-primary rounded-md"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Search Button in Sidebar */}
          <div className="px-3 pt-3 pb-2">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border text-text-tertiary hover:text-text-secondary text-xs font-mono transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-text-quaternary group-hover:text-text-secondary" />
                <span>Quick search...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-surface-2 border border-border rounded text-text-quaternary">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Navigation Section */}
          <nav className="flex-1 px-2.5 py-1.5 space-y-1 overflow-y-auto">
            <div className="px-2 pb-1 pt-1 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-quaternary font-semibold">
                Platform
              </span>
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  isActive ? 'nav-item-active' : 'nav-item'
                }
                end={item.to === '/'}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] font-mono text-text-quaternary group-hover:text-text-tertiary">
                  ⌥{item.shortcut}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer with Streak & Local-First Indicator */}
        <div className="p-3 border-t border-border shrink-0 bg-surface-0 space-y-2">
          {/* Active streak widget */}
          <div className="p-2.5 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-warning-muted border border-warning-border flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-warning" />
              </div>
              <div className="flex flex-col">
                <span className="text-xxs font-semibold text-text-primary">
                  {streak.current} Day Streak
                </span>
                <span className="text-[10px] text-text-tertiary font-mono">
                  Personal Best: {streak.best}d
                </span>
              </div>
            </div>
            {streak.current > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            )}
          </div>

          {/* Local-First Architecture Badge */}
          <div className="px-2.5 py-1.5 rounded-lg bg-surface-1/60 border border-border-subtle flex items-center justify-between text-[10px] font-mono text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-text-quaternary" />
              Local Storage
            </span>
            <span className="text-emerald-400 font-medium">Verified</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 shrink-0 border-b border-border bg-surface-0/90 backdrop-blur-md flex items-center justify-between px-4 lg:px-7 z-10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 text-text-tertiary hover:text-text-primary rounded-md hover:bg-surface-2"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Quick jump search trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-text-quaternary" />
              <span className="font-mono text-[11px]">
                Search {curriculumStats ? countLabel(curriculumStats.placementCount, 'placement', 'placements') : 'placements'}, patterns, invariants...
              </span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-surface-2 border border-border rounded text-text-quaternary ml-4">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3.5">
            {stats && (
              <div className="hidden md:flex items-center gap-3 pr-3 border-r border-border text-xxs font-mono text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Easy: <strong className="text-text-primary tnum">{stats.easySolved}</strong>/{stats.easy}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Med: <strong className="text-text-primary tnum">{stats.mediumSolved}</strong>/{stats.medium}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Hard: <strong className="text-text-primary tnum">{stats.hardSolved}</strong>/{stats.hard}
                </span>
              </div>
            )}

            <div className="text-xxs text-text-tertiary font-mono">
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>

            <div className="pl-3 border-l border-border hidden sm:flex items-center gap-1.5 text-xxs font-mono text-text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Offline-Ready</span>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
            {children}
          </div>
        </main>
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
