'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Music, Calendar, Settings, MessageSquare, LogOut, Star, UserCircle, Search, Send, CalendarCheck, Image, PlusCircle, Briefcase, Users, Store, MapPin, ReceiptText, Menu, X, UserPlus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const activeConversation = useChatStore((state) => state.activeConversation);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isMessagesPage = isMounted && pathname === '/dashboard/messages';
  const isChatActiveOnMobile = isMessagesPage && activeConversation;
  
  // Detection of role based on user state, fallback to URL for UI purposes
  const isPerformer = user?.role === 'performer' || pathname.includes('/dashboard/performer');
  const isAudience = user?.role === 'customer' || pathname.includes('/dashboard/audience');
  const isAdmin = user?.role === 'admin' || pathname.includes('/dashboard/admin');
  const isVenue = user?.role === 'restaurant' || pathname.includes('/dashboard/restaurant');
  const audienceNav = [
    { label: 'Home', href: '/dashboard/audience', icon: LayoutDashboard },
    { label: 'Tonight Near Me', href: '/dashboard/audience/events', icon: Music },
    { label: 'Saved Events', href: '/dashboard/audience/saved', icon: Star },
    { label: 'My Reservations', href: '/dashboard/audience/reservations', icon: Calendar },
    { label: 'Meetups', href: '/dashboard/audience/meetups', icon: Users },
    { label: 'Connection Requests', href: '/dashboard/audience/connection-requests', icon: UserPlus },
    { label: 'People Nearby', href: '/dashboard/audience/people-nearby', icon: MapPin },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Profile', href: '/dashboard/audience/profile', icon: UserCircle },
  ];

  const adminNav = [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Manage Users', href: '/dashboard/admin/users', icon: Users },
    { label: 'Manage Ads', href: '/dashboard/admin/ads', icon: Image },
  ];

  const performerNav = [
    { label: 'Dashboard', href: '/dashboard/performer', icon: LayoutDashboard },
    { label: 'Opportunity Feed', href: '/dashboard/performer/gigs', icon: Search },
    { label: 'Local Venues', href: '/dashboard/performer/venues', icon: MapPin },
    { label: 'My Applications', href: '/dashboard/performer/applications', icon: Send },
    { label: 'Accepted Gigs', href: '/dashboard/performer/calendar', icon: CalendarCheck },
    { label: 'Portfolio', href: '/dashboard/performer/portfolio', icon: Image },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Reviews', href: '/dashboard/performer/reviews', icon: Star },
    { label: 'Profile', href: '/dashboard/performer/profile', icon: UserCircle },
  ];

  const venueNav = [
    { label: 'Dashboard', href: '/dashboard/restaurant', icon: LayoutDashboard },
    { label: 'Create Opportunity', href: '/dashboard/restaurant/post-gig', icon: PlusCircle },
    { label: 'Local Performers', href: '/dashboard/restaurant/performers', icon: MapPin },
    { label: 'My Opportunities', href: '/dashboard/restaurant/my-opportunities', icon: Briefcase },
    { label: 'Applications', href: '/dashboard/restaurant/applications', icon: Users },
    { label: 'Events', href: '/dashboard/restaurant/events', icon: Calendar },
    { label: 'Table Bookings', href: '/dashboard/restaurant/tables-booking', icon: ReceiptText },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Reviews', href: '/dashboard/restaurant/reviews', icon: Star },
    { label: 'Payment Settings', href: '/dashboard/restaurant/payment-settings', icon: Settings },
    { label: 'Venue Profile', href: '/dashboard/restaurant/profile', icon: Store },
  ];

  const audienceBottomNav = [
    { label: 'Home', href: '/dashboard/audience', icon: Home },
    { label: 'Local', href: '/dashboard/audience/people-nearby', icon: MapPin },
    { label: 'Tonight', href: '/dashboard/audience/events', icon: Music },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Profile', href: '/dashboard/audience/profile', icon: UserCircle },
  ];

  let navItems = venueNav;
  if (isPerformer) navItems = performerNav;
  if (isAudience) navItems = audienceNav;
  if (isAdmin) navItems = adminNav;

  const roleTitle = isAdmin ? 'Admin Panel' : isPerformer ? 'Artist Hub' : isAudience ? 'Audience' : 'Venue Hub';

  return (
    <div className={`flex bg-zinc-950 relative ${
      isMessagesPage 
        ? isChatActiveOnMobile 
          ? 'h-[100dvh] md:h-[calc(100dvh-4rem)] w-full' 
          : 'h-[calc(100dvh-4rem)] w-full'
        : 'min-h-[calc(100vh-4rem)]'
    }`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && !isAudience && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out border-r border-zinc-800 bg-zinc-900 flex flex-col lg:relative lg:translate-x-0 ${
        isSidebarOpen && !isAudience ? 'translate-x-0' : '-translate-x-full'
      } lg:bg-zinc-900/50`}>
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {roleTitle}
          </h2>
          <button 
            suppressHydrationWarning={true}
            className="lg:hidden text-zinc-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsSidebarOpen(false)}>
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50">
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }
            }}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 h-full ${isAudience && !isChatActiveOnMobile ? 'pb-16 lg:pb-0' : ''}`}>
        {!isAudience && !isChatActiveOnMobile && (
          <div className="lg:hidden p-4 flex items-center border-b border-zinc-800 bg-zinc-950">
            <button 
              suppressHydrationWarning={true}
              className="text-zinc-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="ml-4 font-bold text-lg text-white">{roleTitle}</h1>
          </div>
        )}
        <div className={
          isMessagesPage
            ? "flex-1 min-h-0 flex flex-col p-0 overflow-hidden"
            : "p-4 md:p-8 flex-1 overflow-auto"
        }>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Instagram Style) */}
      {isAudience && !(pathname === '/dashboard/messages' && activeConversation) && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-4 py-2 pb-3">
          <div className="flex items-center justify-around h-12">
            {audienceBottomNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/dashboard/audience'
                ? pathname === '/dashboard/audience' || 
                  pathname.startsWith('/dashboard/audience/saved') || 
                  pathname.startsWith('/dashboard/audience/reservations') || 
                  pathname.startsWith('/dashboard/audience/connection-requests')
                : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center">
                  <div className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                    isActive ? 'text-indigo-400 font-semibold scale-105' : 'text-zinc-400 hover:text-zinc-200'
                  }`}>
                    <Icon size={20} className={isActive ? 'text-indigo-400 animate-pulse' : 'text-zinc-400'} />
                    <span className="text-[10px] tracking-tight">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
