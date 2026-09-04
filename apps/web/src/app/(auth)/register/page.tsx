'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { Mail, KeyRound, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || 'customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('male');
  
  // Verification states
  const [step, setStep] = useState<'form' | 'verify'>(
    searchParams.get('verify') === 'true' ? 'verify' : 'form'
  );
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  const { setAuth } = useAuthStore();

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'verify' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const { data } = await api.post('/auth/register', { name, email, password, phone, role, gender });
      if (data.requiresVerification) {
        setStep('verify');
        setCountdown(60);
        setSuccessMsg(data.message || 'Verification code sent to your email.');
      } else {
        // Fallback for direct registration if ever returned
        setAuth(data, data.token);
        redirectUser(data.role);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
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

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data } = await api.post('/auth/verify-email', { email, otp: otp.trim() });
      setAuth(data, data.token);
      setSuccessMsg('Email verified successfully! Redirecting...');
      setTimeout(() => {
        redirectUser(data.role);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data } = await api.post('/auth/resend-otp', { email });
      setSuccessMsg(data.message || 'A new verification code has been sent.');
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const redirectUser = (userRole?: string | null) => {
    if (userRole === 'restaurant') {
      router.push('/dashboard/restaurant/profile');
    } else if (userRole === 'performer') {
      router.push('/dashboard/performer/profile');
    } else if (userRole === 'customer') {
      router.push('/dashboard/audience/profile');
    } else if (userRole === 'admin') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard/audience/profile');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm shadow-2xl">
        
        {step === 'form' ? (
          <>
            <div>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-white">
                Create an account
              </h2>
              <p className="mt-2 text-center text-sm text-zinc-400">
                Join StageLink today & explore live music
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleRegisterSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3.5 rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4 rounded-md shadow-sm">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Account Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setRole('customer')}
                      className={`py-2 px-1 rounded-lg border text-center text-xs font-medium transition-all ${
                        role === 'customer'
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      Audience
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setRole('performer')}
                      className={`py-2 px-1 rounded-lg border text-center text-xs font-medium transition-all ${
                        role === 'performer'
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      Performer
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setRole('restaurant')}
                      className={`py-2 px-1 rounded-lg border text-center text-xs font-medium transition-all ${
                        role === 'restaurant'
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      Venue Owner
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="sr-only">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    suppressHydrationWarning
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="relative block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    suppressHydrationWarning
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="sr-only">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    suppressHydrationWarning
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="relative block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="sr-only">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    suppressHydrationWarning
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="relative block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm appearance-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    suppressHydrationWarning
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base font-semibold shadow-lg shadow-indigo-600/20"
                  disabled={loading}
                >
                  {loading ? 'Sending verification code...' : 'Continue with Email'}
                </Button>
              </div>
            </form>
            
            <div className="mt-6 text-center text-sm text-zinc-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
                Sign in
              </Link>
            </div>
          </>
        ) : (
          /* OTP Verification Step */
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 text-indigo-400 shadow-inner">
                <Mail className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Verify your email
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                We've sent a 6-digit verification code to
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

              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3.5 rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label htmlFor="otp-input" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 text-center">
                  Enter 6-Digit Code
                </label>
                <div className="relative">
                  <input
                    id="otp-input"
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
                  Verification code expires in 10 minutes
                </p>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base font-semibold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    'Verifying...'
                  ) : (
                    <>
                      Verify & Activate Account <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError('');
                    setSuccessMsg('');
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

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8"><div className="text-white">Loading...</div></div>}>
      <RegisterForm />
    </Suspense>
  );
}
