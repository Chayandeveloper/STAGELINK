'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isAuthenticated && user) {
      if (user.role === 'restaurant') {
        router.push('/dashboard/restaurant');
      } else if (user.role === 'performer') {
        router.push('/dashboard/performer');
      } else if (user.role === 'customer') {
        router.push('/dashboard/audience');
      } else if (user.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/audience');
      }
    }
  }, [isMounted, isAuthenticated, user, router]);

  if (!isMounted) return null; // Avoid hydration mismatch

  // Hide the landing page if authenticated to prevent flash
  if (isAuthenticated) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="text-center space-y-4 sm:space-y-6 max-w-3xl px-4">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 sm:mb-6 leading-tight">
          The Stage is <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Yours.</span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          StageLink connects premium venues with incredible performers. Discover live events happening tonight near you.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/events">
            <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-6 text-lg shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)]">
              Find Events Tonight
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 py-6 text-lg border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Join as Performer
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Abstract background blobs */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
    </div>
  );
}
