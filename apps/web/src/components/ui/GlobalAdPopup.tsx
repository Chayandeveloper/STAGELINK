'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

export function GlobalAdPopup() {
  const pathname = usePathname();
  const user = useAuthStore(state => state.user);
  const [ad, setAd] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // When pathname changes, check if there's an active ad for this page
    const checkAd = async () => {
      try {
        let normalizedPath = pathname;
        if (pathname.endsWith('/events')) normalizedPath = '/events';
        if (pathname.endsWith('/performers')) normalizedPath = '/performers';

        const role = user?.role || 'public';
        const res = await api.get(`/ads/active?module=${encodeURIComponent(normalizedPath)}&role=${role}`);
        if (res.data) {
          setAd(res.data);
          setIsVisible(true);
          
          // Auto-hide after duration
          const timer = setTimeout(() => {
            setIsVisible(false);
          }, res.data.durationMs || 5000);
          
          return () => clearTimeout(timer);
        }
      } catch (err) {
        // 404 means no ad found, which is fine
        setIsVisible(false);
      }
    };
    
    checkAd();
  }, [pathname, user?.role]);

  if (!isVisible || !ad) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative max-w-2xl w-full max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
        >
          <X size={20} />
        </button>
        <img 
          src={ad.imageUrl} 
          alt={ad.title || "Advertisement"} 
          className="w-full h-full object-contain bg-zinc-950" 
        />
        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 w-full animate-shrink-x" style={{ animationDuration: `${ad.durationMs}ms` }} />
      </div>
    </div>
  );
}
