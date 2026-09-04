'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, KeyRound, Mail, ArrowRight, Lock, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  
  // Step 2 state
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'verify' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage(data.message || 'Password reset code sent to your email.');
      setStep('verify');
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset code. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit reset code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setMessage(data.message || 'Password reset successfully!');
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');

    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage(data.message || 'A new reset code has been sent.');
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm shadow-2xl">
        
        {/* Step 1: Request Reset Code */}
        {step === 'request' && (
          <div className="animate-in fade-in duration-200">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 text-indigo-400 shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Forgot your password?
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Enter your account email and we'll send you a 6-digit OTP to reset your password.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleRequestOtp}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3.5 rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="reset-email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 pl-10 text-white placeholder-zinc-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter your registered email"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base font-semibold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? 'Sending code...' : (
                    <>
                      Send Reset Code <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-sm">
                <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  &larr; Back to sign in
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Enter OTP & New Password */}
        {step === 'verify' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 text-indigo-400 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Set new password
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Enter the code sent to:
              </p>
              <div className="mt-1 font-semibold text-indigo-300 text-sm bg-indigo-950/40 border border-indigo-800/40 rounded-lg py-1 px-3 inline-block">
                {email}
              </div>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleResetPassword}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3.5 rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm p-3.5 rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in">
                  <CheckCircle2 size={18} className="shrink-0 text-indigo-400" />
                  <span>{message}</span>
                </div>
              )}

              <div>
                <label htmlFor="reset-otp" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 text-center">
                  Enter 6-Digit Reset Code
                </label>
                <div className="relative">
                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="block w-full text-center text-3xl font-mono tracking-[0.6em] py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800/80 text-white placeholder-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all"
                  />
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor="new-password" className="block text-xs font-semibold text-zinc-400 mb-1">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-semibold text-zinc-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base font-semibold shadow-lg shadow-indigo-600/20"
                  disabled={loading || otp.length !== 6 || !newPassword || !confirmPassword}
                >
                  {loading ? 'Resetting password...' : 'Update Password'}
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setError('');
                    setMessage('');
                  }}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  &larr; Change Email
                </button>

                <button
                  type="button"
                  disabled={countdown > 0 || resending}
                  onClick={handleResendOtp}
                  className={`flex items-center gap-1.5 font-medium transition-colors ${
                    countdown > 0 || resending
                      ? 'text-zinc-500 cursor-not-allowed'
                      : 'text-indigo-400 hover:text-indigo-300'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success Screen */}
        {step === 'success' && (
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-200 py-4">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Password Reset Complete!
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Your password has been successfully reset. You can now sign in with your new credentials.
              </p>
            </div>

            <div>
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base font-semibold shadow-lg shadow-indigo-600/20"
              >
                Sign in to your account
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
