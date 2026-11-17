import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_START_URL } from '../lib/accountApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Sign in with Google, or with a 6-digit code sent by email. */
export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { startEmail, verifyEmail } = useAuth();
  const [step, setStep] = useState<'choose' | 'code'>('choose');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('choose');
    setCode('');
    setError(null);
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await startEmail(email.trim());
    setBusy(false);
    if (res.ok) setStep('code');
    else setError(res.error);
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await verifyEmail(email.trim(), code.trim());
    setBusy(false);
    if (res.ok) onClose();
    else setError(res.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="auth-title" className="w-full max-w-md bg-canvas border border-border-hover p-7 font-serif">
        <div className="flex items-baseline justify-between mb-5">
          <h2 id="auth-title" className="text-[26px] leading-tight">Keep your place</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="lbl hover:text-text-primary">Esc</button>
        </div>
        <p className="text-[15px] text-text-secondary mb-6">
          Sign in to continue on any device. Your progress is saved to your account and merged with what is on this device.
        </p>

        {step === 'choose' ? (
          <div className="space-y-5">
            <a href={GOOGLE_START_URL} className="flex items-center justify-center w-full py-2.5 border border-border-hover hover:border-text-primary transition-colors text-[15px]">
              Continue with Google
            </a>
            <div className="flex items-center gap-3"><span className="flex-1 h-px bg-border" /><span className="lbl">or</span><span className="flex-1 h-px bg-border" /></div>
            <form onSubmit={sendCode} className="space-y-3">
              <label htmlFor="auth-email" className="lbl block">Email</label>
              <input ref={firstFieldRef} id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-border-hover focus:border-text-primary outline-none py-1.5 text-[16px]" placeholder="you@example.com" />
              <button type="submit" disabled={busy || !email} className="w-full py-2.5 bg-text-primary text-canvas text-[15px] disabled:opacity-50">
                {busy ? 'Sending…' : 'Email me a code'}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={submitCode} className="space-y-3">
            <p className="text-[15px]">We sent a 6-digit code to <span className="italic">{email}</span>. It expires in 10 minutes.</p>
            <label htmlFor="auth-code" className="lbl block">Code</label>
            <input ref={firstFieldRef} id="auth-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-transparent border-b border-border-hover focus:border-text-primary outline-none py-1.5 text-[22px] font-mono tracking-[0.4em]" />
            <button type="submit" disabled={busy || code.length !== 6} className="w-full py-2.5 bg-text-primary text-canvas text-[15px] disabled:opacity-50">
              {busy ? 'Checking…' : 'Sign in'}
            </button>
            <button type="button" onClick={() => { setStep('choose'); setCode(''); setError(null); }} className="lbl hover:text-text-primary">Use a different email</button>
          </form>
        )}

        <p role="alert" className="min-h-[1.25rem] mt-4 text-[14px] text-accent">{error}</p>
        <p className="lbl mt-2">We store your email and progress only. Nothing is sold or shared.</p>
      </div>
    </div>
  );
}
