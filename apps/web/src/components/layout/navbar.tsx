'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

const COMMON_CITIES = [
  'New Delhi',
  'Mumbai',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad'
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const detectLocation = useLocationStore((state) => state.detectLocation);
  const isDetecting = useLocationStore((state) => state.isDetecting);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!selectedCity) {
      detectLocation();
    }
  }, [selectedCity, detectLocation]);

  const navLinks = [
    { 
      label: 'Events', 
      href: isAuthenticated && user?.role === 'customer' ? '/dashboard/audience/events' 
          : isAuthenticated && user?.role === 'performer' ? '/dashboard/performer/events'
          : isAuthenticated && user?.role === 'restaurant' ? '/dashboard/restaurant/events-browse'
          : '/events' 
    },
    { 
      label: 'Performers', 
      href: isAuthenticated && user?.role === 'restaurant' ? '/dashboard/restaurant/performers'
          : '/performers' 
    },
    { 
      label: 'Venues', 
      href: isAuthenticated && user?.role === 'performer' ? '/dashboard/performer/venues'
          : '/venues' 
    }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-zinc-50">
              Stage<span className="text-indigo-500">Link</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-zinc-300">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-zinc-50">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* City Selector (Hidden on very small screens, moved to menu) */}
          <div className="relative hidden sm:flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400 absolute left-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <select 
              value={selectedCity || ''}
              onChange={(e) => setSelectedCity(e.target.value)}
              suppressHydrationWarning
              className="pl-8 pr-8 py-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="">{isDetecting ? 'Detecting...' : 'All Cities'}</option>
              {selectedCity && !COMMON_CITIES.includes(selectedCity) && (
                <option value={selectedCity}>{selectedCity}</option>
              )}
              <optgroup label="Popular Cities">
                {COMMON_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </optgroup>
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400 absolute right-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href={user?.role === 'restaurant' ? '/dashboard/restaurant' : user?.role === 'performer' ? '/dashboard/performer' : user?.role === 'customer' ? '/dashboard/audience' : user?.role === 'admin' ? '/dashboard/admin' : '/role-selection'}>
                  <Button variant="ghost" className="text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800">
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={() => { logout(); window.location.href = '/login'; }} className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800">
                    Log in
                  </Button>
                </Link>
                <Link href="/role-selection">
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            suppressHydrationWarning={true}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-zinc-950 border-b border-zinc-800 shadow-xl flex flex-col p-4 space-y-4 z-50">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                className="text-zinc-300 hover:text-white py-2 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="h-px w-full bg-zinc-800 my-2"></div>
          
          <div className="relative flex items-center w-full sm:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400 absolute left-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <select 
              value={selectedCity || ''}
              onChange={(e) => setSelectedCity(e.target.value)}
              suppressHydrationWarning
              className="pl-9 pr-8 py-2 w-full bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="">{isDetecting ? 'Detecting...' : 'All Cities'}</option>
              {selectedCity && !COMMON_CITIES.includes(selectedCity) && (
                <option value={selectedCity}>{selectedCity}</option>
              )}
              <optgroup label="Popular Cities">
                {COMMON_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </optgroup>
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400 absolute right-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div className="flex flex-col space-y-2 mt-2">
            {isAuthenticated ? (
              <>
                <Link href={user?.role === 'restaurant' ? '/dashboard/restaurant' : user?.role === 'performer' ? '/dashboard/performer' : user?.role === 'customer' ? '/dashboard/audience' : user?.role === 'admin' ? '/dashboard/admin' : '/role-selection'} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white">
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={() => { logout(); window.location.href = '/login'; }} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20">
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white">
                    Log in
                  </Button>
                </Link>
                <Link href="/role-selection" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
