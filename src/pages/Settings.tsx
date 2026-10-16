import React, { useState, useRef } from 'react';
import { useApp } from '../context';
import { exportProgress, importProgress } from '../store';
import {
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Database,
  Target,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

export default function Settings() {
  const { state, dispatch } = useApp();
  const { curriculum, progress } = state;

  const [dailyGoal, setDailyGoal] = useState<number>(progress.settings?.dailyGoal || 5);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { dailyGoal: Number(dailyGoal) },
    });
    setStatusMessage({ type: 'success', text: 'Daily targets updated successfully.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExport = () => {
    try {
      const jsonStr = exportProgress(progress);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vertex_dsa_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: 'Progress data exported successfully.' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Export failed: ${err.message}` });
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = importProgress(content);
        dispatch({ type: 'SET_PROGRESS', payload: imported });
        setStatusMessage({
          type: 'success',
          text: `Import verified! Restored progress for ${Object.keys(imported.problems).length} problems.`,
        });
        setTimeout(() => setStatusMessage(null), 4000);
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: `Import rejected: ${err.message}` });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmReset = () => {
    dispatch({ type: 'CLEAR_PROGRESS' });
    setShowResetConfirm(false);
    setStatusMessage({ type: 'success', text: 'All personal progress has been reset.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-accent font-semibold">
              PREFERENCES & BACKUP
            </span>
            <span className="text-border">·</span>
            <span className="text-[10px] font-mono text-text-tertiary">
              LOCAL PERSISTENCE ENGINE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Settings & Data Management
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure your daily practice targets, export solution notes, and manage local storage.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded border flex items-center gap-2 text-xs font-mono animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-success-muted text-success border-success-border'
              : 'bg-danger-muted text-danger border-danger-border'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Target Config */}
      <div className="panel p-5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-text-primary flex items-center gap-2 pb-2 border-b border-border">
          <Target className="w-3.5 h-3.5 text-accent" />
          Daily Practice Goal
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-3 max-w-sm pt-1">
          <div>
            <label className="text-[11px] font-mono text-text-tertiary block mb-1">
              Target Problems / Day
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field text-xs font-mono w-24"
              />
              <span className="text-xs font-mono text-text-secondary">problems</span>
            </div>
          </div>

          <button type="submit" className="btn-primary text-xs">
            Save Target
          </button>
        </form>
      </div>

      {/* Data Backup & Portability */}
      <div className="panel p-5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-text-primary flex items-center gap-2 pb-2 border-b border-border">
          <Database className="w-3.5 h-3.5 text-accent" />
          Data Portability & Backup
        </h2>
        <p className="text-xs text-text-secondary">
          Your solution notes, approach invariants, Big-O complexities, and spaced repetition schedules are persisted in your browser's localStorage. Export a backup JSON to sync across machines or prevent browser cache clearing.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            Export Progress JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-accent" />
            Import Backup JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Curriculum Metadata Summary */}
      {curriculum && (
        <div className="panel p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-text-primary flex items-center gap-2 pb-2 border-b border-border">
            <FileCheck className="w-3.5 h-3.5 text-success" />
            Curriculum Verification
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 bg-surface-0 rounded border border-border-subtle">
              <span className="text-[10px] font-mono text-text-tertiary block">CURRICULUM</span>
              <p className="text-xs font-semibold text-text-primary truncate mt-0.5">
                {curriculum.title}
              </p>
            </div>
            <div className="p-2.5 bg-surface-0 rounded border border-border-subtle">
              <span className="text-[10px] font-mono text-text-tertiary block">LANGUAGE / VER</span>
              <p className="text-xs font-mono font-semibold text-text-primary mt-0.5">
                {curriculum.language} (v{curriculum.version})
              </p>
            </div>
            <div className="p-2.5 bg-surface-0 rounded border border-border-subtle">
              <span className="text-[10px] font-mono text-text-tertiary block">PATTERNS / VARS</span>
              <p className="text-xs font-mono font-semibold text-text-primary mt-0.5 tnum">
                {curriculum.patterns.length} / {curriculum.patterns.reduce((s, p) => s + p.variations.length, 0)}
              </p>
            </div>
            <div className="p-2.5 bg-surface-0 rounded border border-border-subtle">
              <span className="text-[10px] font-mono text-text-tertiary block">TOTAL PROBLEMS</span>
              <p className="text-xs font-mono font-semibold text-accent mt-0.5 tnum">
                {curriculum.patterns.reduce(
                  (s, p) => s + p.variations.reduce((vs, v) => vs + v.problems.length, 0),
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone: Reset Progress */}
      <div className="panel p-5 border-danger/30 bg-danger-muted/5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-danger flex items-center gap-2 pb-2 border-b border-danger/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          Danger Zone
        </h2>
        <p className="text-xs text-text-secondary">
          Erases your recorded attempts, solution notes, and spaced repetition calendar. The underlying 575 curriculum problems remain 100% intact.
        </p>

        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="btn-danger text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All Progress...
          </button>
        ) : (
          <div className="p-3.5 rounded bg-surface-0 border border-danger/40 space-y-2.5 animate-fade-in max-w-md">
            <p className="text-xs text-danger font-medium font-mono">
              Confirm reset: All your personal solution notes and dates will be permanently removed.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmReset}
                className="btn-danger text-xs py-1 px-3"
              >
                Yes, Reset Everything
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary text-xs py-1 px-3"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
