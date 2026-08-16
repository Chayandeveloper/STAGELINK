'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) return null;

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-12 text-zinc-400 text-sm">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <span className="text-xl font-bold tracking-tight text-zinc-50 mb-4 block">
            Stage<span className="text-indigo-500">Link</span>
          </span>
          <p className="max-w-xs">
            Connecting venues, performers, and audiences. Discover live entertainment happening near you.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-50 mb-4">Discover</h3>
          <ul className="space-y-2">
            <li><Link href="/events" className="hover:text-indigo-400">Events Tonight</Link></li>
            <li><Link href="/performers" className="hover:text-indigo-400">Find Performers</Link></li>
            <li><Link href="/venues" className="hover:text-indigo-400">Explore Venues</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-50 mb-4">For Performers</h3>
          <ul className="space-y-2">
            <li><Link href="/register" className="hover:text-indigo-400">Join as Performer</Link></li>
            <li><Link href="/gigs" className="hover:text-indigo-400">Find Gigs</Link></li>
            <li><Link href="/resources" className="hover:text-indigo-400">Artist Resources</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-50 mb-4">For Venues</h3>
          <ul className="space-y-2">
            <li><Link href="/register" className="hover:text-indigo-400">Register Venue</Link></li>
            <li><Link href="/post-gig" className="hover:text-indigo-400">Post a Gig</Link></li>
            <li><Link href="/pricing" className="hover:text-indigo-400">Pricing</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center">
        <p>© 2026 StageLink. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link href="/terms" className="hover:text-zinc-50">Terms</Link>
          <Link href="/privacy" className="hover:text-zinc-50">Privacy</Link>
          <Link href="/contact" className="hover:text-zinc-50">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
