'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PortfolioPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/performer/profile');
  }, [router]);

  return (
    <div className="text-center py-20 text-zinc-500">
      Redirecting to Profile page...
    </div>
  );
}
