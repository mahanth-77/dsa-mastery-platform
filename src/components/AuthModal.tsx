import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const { signIn, signUp, resendConfirmation, error: authError, clearError, isConfigured } = useAuth();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
      setSuccessMessage(null);
      setNeedsEmailConfirmation(false);
      clearError();
      setTimeout(() => emailInputRef.current?.focus(), 50);
    }
  }, [isOpen, clearError]);

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    const trimmedEmail = email.trim();
    if (mode === 'signup' && !fullName.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!trimmedEmail) {
      setLocalError('Please enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter a password.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const res = await signIn(trimmedEmail, password);
        if (res.success) {
          onClose();
        } else {
          setLocalError(res.error || 'Failed to sign in.');
          setNeedsEmailConfirmation(res.code === 'email_not_confirmed');
        }
      } else {
        const res = await signUp(trimmedEmail, password, fullName);
        if (res.success) {
          setNeedsEmailConfirmation(true);
          setSuccessMessage(`Your VERTEX account has been created. We sent a verification link to ${trimmedEmail}. Verify your email before signing in.`);
        } else {
          setLocalError(res.error || 'Failed to create account.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const activeError = localError || authError;

  const handleResendConfirmation = async () => {
    setResendingConfirmation(true);
    setLocalError(null);
    const result = await resendConfirmation(email.trim());
    setResendingConfirmation(false);
    if (result.success) {
      setSuccessMessage(`A new verification email has been sent to ${email.trim()}. Check your inbox and spam folder.`);
    } else {
      setLocalError(result.error || 'Unable to resend the verification email.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-sm bg-surface-1 border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-surface-2 border border-border flex items-center justify-center text-accent">
              {mode === 'signin' ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            </div>
            <h2 id="auth-modal-title" className="text-sm font-semibold text-text-primary tracking-wide">
              {mode === 'signin' ? 'Sign In to VERTEX' : 'Create VERTEX Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border bg-surface-0/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setLocalError(null);
              clearError();
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
              mode === 'signin'
                ? 'bg-surface-2 text-text-primary shadow-xs'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLocalError(null);
              clearError();
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
              mode === 'signup'
                ? 'bg-surface-2 text-text-primary shadow-xs'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isConfigured && (
            <div className="p-2.5 rounded bg-warning-muted border border-warning-border flex items-start gap-2 text-xxs text-warning">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Authentication is unavailable because Supabase is not configured. You can still explore the curriculum; existing local progress remains preserved.
              </span>
            </div>
          )}

          {activeError && (
            <div className="p-2.5 rounded bg-danger-muted border border-danger-border flex items-start gap-2 text-xxs text-danger animate-in fade-in duration-100">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{activeError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-2.5 rounded bg-success-muted border border-success-border flex items-start gap-2 text-xxs text-success animate-in fade-in duration-100">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label htmlFor="auth-full-name" className="block text-xxs font-medium text-text-secondary uppercase tracking-wider font-mono">
                Full Name
              </label>
              <input
                id="auth-full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                disabled={submitting}
                className="input-field"
                required
              />
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="block text-xxs font-medium text-text-secondary uppercase tracking-wider font-mono">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-quaternary">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                id="auth-email"
                ref={emailInputRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                disabled={submitting}
                className="input-field pl-8"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="block text-xxs font-medium text-text-secondary uppercase tracking-wider font-mono">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-quaternary">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
                className="input-field pl-8 pr-8"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-text-quaternary hover:text-text-secondary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password input (Signup mode only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5 animate-in fade-in duration-100">
              <label htmlFor="auth-confirm-password" className="block text-xxs font-medium text-text-secondary uppercase tracking-wider font-mono">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-quaternary">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                  className="input-field pl-8"
                  required
                />
              </div>
            </div>
          )}

          {needsEmailConfirmation && (
            <div className="space-y-2">
              <p className="text-[10px] text-text-secondary">Haven't received the verification email?</p>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendingConfirmation || !email.trim()}
                className="btn-secondary w-full py-2 text-xs disabled:opacity-50"
              >
                {resendingConfirmation ? 'Sending verification email…' : 'Resend verification email'}
              </button>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{mode === 'signin' ? 'Authenticating...' : 'Creating Account...'}</span>
                </>
              ) : (
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </div>

          <p className="text-[10px] text-text-tertiary text-center leading-relaxed">
            Your account is secured with email verification. Sign in after confirming your email address.
          </p>
        </form>
      </div>
    </div>
  );
}

