import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';

const STATUS_TEXT: Record<string, string> = {
  off: 'Not syncing',
  syncing: 'Syncing…',
  synced: 'Up to date',
  offline: 'Offline: will retry',
  error: 'Sync problem: will retry',
};

/** Account and cross-device sync controls for the Settings page. */
export default function AccountPanel({ onSignInClick }: { onSignInClick: () => void }) {
  const { user, available } = useAuth();
  const { status, lastSyncedAt, syncNow, signOut, deleteAccount } = useSync();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!available) return null;

  const doSignOut = async () => {
    setBusy(true);
    const r = await signOut();
    setBusy(false);
    setMessage(r.clearedLocal ? 'Signed out. This device’s copy was removed; it stays in your account.' : 'Signed out. Progress could not be saved first, so this device keeps its copy.');
  };

  const doDelete = async () => {
    setBusy(true);
    const ok = await deleteAccount();
    setBusy(false);
    setConfirmDelete(false);
    setMessage(ok ? 'Account deleted. Progress on this device was kept.' : 'Could not delete the account. Please try again.');
  };

  return (
    <section className="panel p-5 space-y-3" aria-labelledby="account-title">
      <h2 id="account-title" className="text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary pb-2 border-b border-border">
        Account & sync
      </h2>
      {user ? (
        <>
          <p className="text-xs text-text-secondary">
            Signed in as <span className="text-text-primary">{user.email}</span>. {STATUS_TEXT[status]}
            {lastSyncedAt && status !== 'syncing' ? ` · last synced ${new Date(lastSyncedAt).toLocaleString()}` : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-xs" disabled={busy || status === 'syncing'} onClick={() => void syncNow()}>Sync now</button>
            <button type="button" className="btn-secondary text-xs" disabled={busy} onClick={() => void doSignOut()}>Sign out</button>
            {!confirmDelete ? (
              <button type="button" className="btn-danger text-xs" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete account…</button>
            ) : (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-danger">Deletes your account and saved progress from our servers.</span>
                <button type="button" className="btn-danger text-xs py-1 px-3" disabled={busy} onClick={() => void doDelete()}>Yes, delete</button>
                <button type="button" className="btn-secondary text-xs py-1 px-3" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-text-secondary">Sign in to keep your progress in step across your devices.</p>
          <button type="button" className="btn-secondary text-xs" onClick={onSignInClick}>Sign in</button>
        </>
      )}
      {message && <p role="status" className="text-xs text-text-secondary">{message}</p>}
    </section>
  );
}
