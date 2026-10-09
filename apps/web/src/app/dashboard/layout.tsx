'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Music, Calendar, Settings, MessageSquare, LogOut, Star, UserCircle, Search, Send, CalendarCheck, Image, PlusCircle, Briefcase, Users, Store, MapPin, ReceiptText, Menu, X, UserPlus, Home, HeartHandshake, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { requestNotificationPermission, setupForegroundListener, removeNotificationToken } from '@/lib/firebase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const activeConversation = useChatStore((state) => state.activeConversation);
  const [isMounted, setIsMounted] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [foregroundToast, setForegroundToast] = useState<{ title: string; body: string; url: string } | null>(null);

  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  useEffect(() => {
    if (foregroundToast) {
      const timer = setTimeout(() => setForegroundToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [foregroundToast]);

  useEffect(() => {
    setIsMounted(true);

    if (user) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          setShowNotificationPrompt(true);
        } else if (Notification.permission === 'granted') {
          requestNotificationPermission();
        }
      }

      // Listen for foreground notifications when tab is open
      const unsubscribe = setupForegroundListener((payload) => {
        const title = payload.notification?.title || payload.data?.senderName || 'StageLink Message';
        const body = payload.notification?.body || payload.data?.messageText || 'You received a new message';
        const targetUrl = payload.data?.click_action || '/dashboard/messages';

        // 1. Play audio chime
        playNotificationChime();

        // 2. Trigger native OS notification via Service Worker
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              vibrate: [200, 100, 200],
              requireInteraction: true,
              tag: 'stagelink_foreground',
              data: { url: targetUrl },
            } as any);
          }).catch(() => {
            try {
              new Notification(title, { body, icon: '/favicon.ico' });
            } catch {}
          });
        }

        // 3. Show prominent in-app toast
        setForegroundToast({ title, body, url: targetUrl });
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user]);

  const handleEnableNotifications = async () => {
    setEnablingNotifications(true);
    try {
      const token = await requestNotificationPermission();
      if (token || (typeof window !== 'undefined' && Notification.permission === 'granted')) {
        setShowNotificationPrompt(false);
      }
    } finally {
      setEnablingNotifications(false);
    }
  };

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
    { label: 'System Settings', href: '/dashboard/admin/settings', icon: Settings },
  ];

  const performerNav = [
    { label: 'Dashboard', href: '/dashboard/performer', icon: LayoutDashboard },
    { label: 'Opportunity Feed', href: '/dashboard/performer/gigs', icon: Search },
    { label: 'Local Venues', href: '/dashboard/performer/venues', icon: MapPin },
    { label: 'Applications & Gigs', href: '/dashboard/performer/applications', icon: Send },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Reviews', href: '/dashboard/performer/reviews', icon: Star },
    { label: 'Profile', href: '/dashboard/performer/profile', icon: UserCircle },
  ];

  const venueNav = [
    { label: 'Dashboard', href: '/dashboard/restaurant', icon: LayoutDashboard },
    { label: 'Create Opportunity', href: '/dashboard/restaurant/post-gig', icon: PlusCircle },
    { label: 'Local Performers', href: '/dashboard/restaurant/performers', icon: MapPin },
    { label: 'Applications', href: '/dashboard/restaurant/applications', icon: Users },
    { label: 'Events', href: '/dashboard/restaurant/events', icon: Calendar },
    { label: 'Table Bookings', href: '/dashboard/restaurant/tables-booking', icon: ReceiptText },
    { label: 'Customer Like Codes', href: '/dashboard/restaurant/like-codes', icon: HeartHandshake },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
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

  const venueBottomNav = [
    { label: 'Home', href: '/dashboard/restaurant', icon: Home },
    { label: 'Bookings', href: '/dashboard/restaurant/tables-booking', icon: ReceiptText },
    { label: 'Application', href: '/dashboard/restaurant/applications', icon: Users },
    { label: 'Performers', href: '/dashboard/restaurant/performers', icon: MapPin },
    { label: 'Profile', href: '/dashboard/restaurant/profile', icon: Store },
  ];

  const performerBottomNav = [
    { label: 'Home', href: '/dashboard/performer', icon: Home },
    { label: 'Venues', href: '/dashboard/performer/venues', icon: MapPin },
    { label: 'Applications', href: '/dashboard/performer/applications', icon: Send },
    { label: 'Profile', href: '/dashboard/performer/profile', icon: UserCircle },
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
      {isSidebarOpen && !isAudience && !isVenue && !isPerformer && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out border-r border-zinc-800 bg-zinc-900 flex flex-col lg:relative lg:translate-x-0 ${
        isSidebarOpen && !isAudience && !isVenue && !isPerformer ? 'translate-x-0' : '-translate-x-full'
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
            onClick={async () => {
              await removeNotificationToken();
              logout();
              if (typeof window !== 'undefined') {
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
      <main className={`flex-1 flex flex-col min-w-0 h-full ${(isAudience || isVenue || isPerformer) && !isChatActiveOnMobile ? 'pb-16 lg:pb-0' : ''}`}>
        {showNotificationPrompt && (
          <div className="bg-gradient-to-r from-indigo-950 via-purple-950/70 to-indigo-950 border-b border-indigo-500/30 px-4 py-2 flex items-center justify-between text-xs sm:text-sm text-indigo-100 shrink-0 z-30">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <span>
                <strong className="font-semibold text-white">Enable Notifications:</strong> Get real-time alerts for incoming messages and gig updates.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                disabled={enablingNotifications}
                className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full cursor-pointer shadow-lg shadow-indigo-600/30 shrink-0"
              >
                {enablingNotifications ? 'Enabling...' : 'Enable Now 🔔'}
              </Button>
              <button
                onClick={() => setShowNotificationPrompt(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full cursor-pointer"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Real-time In-App Notification Toast */}
        {foregroundToast && (
          <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-zinc-900/95 border border-indigo-500/50 rounded-2xl shadow-2xl shadow-indigo-950/80 p-4 backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm truncate">{foregroundToast.title}</h4>
                <p className="text-zinc-300 text-xs mt-0.5 line-clamp-2">{foregroundToast.body}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <Link
                    href={foregroundToast.url}
                    onClick={() => setForegroundToast(null)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    View Message
                  </Link>
                  <button
                    onClick={() => setForegroundToast(null)}
                    className="text-xs text-zinc-400 hover:text-white px-2 py-1.5"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={() => setForegroundToast(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        {!isAudience && !isVenue && !isPerformer && !isChatActiveOnMobile && (
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
      {(isAudience || isVenue || isPerformer) && !(pathname === '/dashboard/messages' && activeConversation) && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-4 py-2 pb-3">
          <div className="flex items-center justify-around h-12">
            {(isAudience ? audienceBottomNav : isVenue ? venueBottomNav : performerBottomNav).map((item) => {
              const Icon = item.icon;
              const isActive = isAudience
                ? (item.href === '/dashboard/audience'
                  ? pathname === '/dashboard/audience' || 
                    pathname.startsWith('/dashboard/audience/saved') || 
                    pathname.startsWith('/dashboard/audience/reservations') || 
                    pathname.startsWith('/dashboard/audience/connection-requests')
                  : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                : isVenue
                ? (item.href === '/dashboard/restaurant'
                  ? pathname === '/dashboard/restaurant'
                  : item.href === '/dashboard/restaurant/profile'
                  ? pathname.startsWith('/dashboard/restaurant/profile') || 
                    pathname.startsWith('/dashboard/restaurant/post-gig') || 
                    pathname.startsWith('/dashboard/restaurant/events') || 
                    pathname.startsWith('/dashboard/restaurant/payment-settings')
                  : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                : (item.href === '/dashboard/performer'
                  ? pathname === '/dashboard/performer' || 
                    pathname.startsWith('/dashboard/performer/gigs') || 
                    pathname.startsWith('/dashboard/performer/calendar')
                  : item.href === '/dashboard/performer/profile'
                  ? pathname.startsWith('/dashboard/performer/profile') || 
                    pathname.startsWith('/dashboard/performer/portfolio') || 
                    pathname.startsWith('/dashboard/performer/reviews')
                  : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));
              
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
