'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, KeyRound, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Unverified account handling state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  const { setAuth } = useAuthStore();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (needsVerification && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [needsVerification, countdown]);

  const redirectUser = (userRole?: string | null) => {
    if (userRole === 'restaurant') {
      router.push('/dashboard/restaurant');
    } else if (userRole === 'performer') {
      router.push('/dashboard/performer');
    } else if (userRole === 'customer') {
      router.push('/dashboard/audience');
    } else if (userRole === 'admin') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard/audience');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data, data.token);
      redirectUser(data.role);
    } catch (err: any) {
      console.error('LOGIN ERROR:', err);
      const resData = err.response?.data;
      
      if (resData?.requiresVerification) {
        setNeedsVerification(true);
        setCountdown(60);
        setError(resData.message || 'Please verify your email before logging in. A new OTP has been sent.');
      } else {
        const msg = resData?.message 
          || resData?.error
          || 'Invalid email or password';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyLoading(true);
    setError('');
    setVerifySuccess('');

    try {
      const { data } = await api.post('/auth/verify-email', { email, otp: otp.trim() });
      setAuth(data, data.token);
      setVerifySuccess('Email verified! Signing you in...');
      setTimeout(() => {
        redirectUser(data.role);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');

    try {
      const { data } = await api.post('/auth/resend-otp', { email });
      setVerifySuccess(data.message || 'A new verification code has been sent.');
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
        
        {!needsVerification ? (
          <>
            <div>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="mt-2 text-center text-sm text-zinc-400">
                Sign in to your StageLink account
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3.5 rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4 rounded-md shadow-sm">
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    suppressHydrationWarning
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    suppressHydrationWarning
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-indigo-400 hover:text-indigo-300">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base font-semibold shadow-lg shadow-indigo-600/20"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>
            
            <div className="mt-6 text-center text-sm text-zinc-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
                Sign up
              </Link>
            </div>
          </>
        ) : (
          /* Unverified Account OTP Entry Flow */
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-4 text-amber-400 shadow-inner">
                <Mail className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Account Verification Required
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                A verification code has been dispatched to
              </p>
              <div className="mt-1 font-semibold text-indigo-300 text-sm bg-indigo-950/40 border border-indigo-800/40 rounded-lg py-1 px-3 inline-block">
                {email}
              </div>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleVerifySubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3.5 rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {verifySuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3.5 rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                  <span>{verifySuccess}</span>
                </div>
              )}

              <div>
                <label htmlFor="otp-input-login" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 text-center">
                  Enter 6-Digit Code
                </label>
                <div className="relative">
                  <input
                    id="otp-input-login"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="block w-full text-center text-3xl font-mono tracking-[0.6em] py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-800/80 text-white placeholder-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all"
                  />
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
                </div>
                <p className="mt-2 text-xs text-zinc-500 text-center">
                  Code expires in 10 minutes
                </p>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base font-semibold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  disabled={verifyLoading || otp.length !== 6}
                >
                  {verifyLoading ? (
                    'Verifying...'
                  ) : (
                    <>
                      Verify & Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNeedsVerification(false);
                    setError('');
                    setVerifySuccess('');
                  }}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  &larr; Back to sign in
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

      </div>
    </div>
  );
}
