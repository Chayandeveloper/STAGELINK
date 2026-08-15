'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { MapPin, Clock, Search, Map as MapIcon, List as ListIcon, X, UserCircle, Calendar, Ticket, Users, Link as LinkIcon, Phone, Camera, PlayCircle, Globe, Bookmark, BookmarkCheck } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocationStore } from '@/store/useLocationStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function EventsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const user = useAuthStore((state) => state.user);
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerformer, setSelectedPerformer] = useState<any>(null);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect authenticated users to their dashboard wrapper to preserve the sidebar
  useEffect(() => {
    if (isMounted && user && pathname === '/events') {
      if (user.role === 'customer') router.replace('/dashboard/audience/events');
      if (user.role === 'performer') router.replace('/dashboard/performer/events');
      if (user.role === 'restaurant') router.replace('/dashboard/restaurant/events-browse');
    }
  }, [isMounted, user, pathname, router]);

  useEffect(() => {
    if (!isMounted) return;

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const cityQuery = selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : '';
        const response = await api.get(`/events?status=upcoming${cityQuery}`);
        setLiveEvents(response.data);
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSaved = async () => {
      if (!user) return;
      try {
        const res = await api.get('/events/saved/me');
        setSavedEventIds(new Set((res.data as any[]).map((e: any) => e._id)));
      } catch (e) {
        // not logged in or error — saved state stays empty
      }
    };

    fetchEvents();
    fetchSaved();
  }, [selectedCity, isMounted, user]);

  const formatTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    return `${isToday ? 'Tonight' : date.toLocaleDateString()}, ${timeStr}`;
  };

  const handleSave = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    setSavingId(eventId);
    try {
      if (savedEventIds.has(eventId)) {
        await api.delete(`/events/${eventId}/save`);
        setSavedEventIds(prev => { const next = new Set(prev); next.delete(eventId); return next; });
      } else {
        await api.post(`/events/${eventId}/save`);
        setSavedEventIds(prev => new Set(prev).add(eventId));
      }
    } catch (e) {
      console.error('Failed to save event', e);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 md:px-2 md:py-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Tonight Near Me</h1>
          <p className="text-zinc-400 mt-2 text-lg">Discover live music and events happening right now.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-zinc-500" />
            </div>
            <input
              suppressHydrationWarning={true}
              type="text"
              className="w-full rounded-full border border-zinc-700 bg-zinc-800/50 pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Search genres, artists..."
            />
          </div>
          
          <div className="bg-zinc-800/50 p-1 rounded-lg border border-zinc-700 flex">
            <button
              suppressHydrationWarning={true}
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              <ListIcon size={18} />
            </button>
            <button
              suppressHydrationWarning={true}
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              <MapIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="w-full h-[600px] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500">
          <MapIcon size={64} className="mb-4 opacity-50" />
          <p className="text-xl font-medium text-white mb-2">Map View</p>
          <p className="max-w-md text-center text-sm">
            Google Maps API integration placeholder. In a production environment, this will render a dynamic map with pins for all live events.
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-20 text-zinc-500">Loading events...</div>
      ) : liveEvents.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl">
          <p>No upcoming events found. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveEvents.map((event) => {
            const performerName = event.performer?.displayName || event.performer?.user?.name || 'Various Artists';
            const venueName = event.restaurant?.restaurantName || 'Unknown Venue';
            const location = event.restaurant?.location || 'Unknown Location';
            const price = event.ticketPrice ? `$${event.ticketPrice}` : 'Free Entry';
            const image = event.coverImage || 'https://images.unsplash.com/photo-1516280440502-613fb25db5cd?w=500&q=80';
            
            return (
            <div key={event._id} className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer">
              <div className="relative">
                <div 
                  className="h-48 w-full bg-zinc-800 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url(${image})` }}
                />
                {/* Save button */}
                <button
                  onClick={(e) => handleSave(e, event._id)}
                  disabled={savingId === event._id}
                  title={savedEventIds.has(event._id) ? 'Unsave event' : 'Save event'}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-lg
                    ${savedEventIds.has(event._id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
                    }`}
                >
                  {savedEventIds.has(event._id)
                    ? <BookmarkCheck size={18} />
                    : <Bookmark size={18} />
                  }
                </button>
              </div>
              <div className="p-6 relative bg-zinc-900/50">
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {price}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
                <button 
                  onClick={() => event.performer && setSelectedPerformer(event.performer)}
                  className="text-indigo-400 text-sm font-medium mb-4 hover:underline text-left"
                >
                  {performerName}
                </button>
                
                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-zinc-500" />
                    <span>{venueName} <span className="text-zinc-600 px-1">•</span> {location}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-zinc-500" />
                    {formatTime(event.date, event.time)}
                  </div>
                </div>
                
                <Button 
                  onClick={() => router.push(`/events/${event._id}`)}
                  className="w-full mt-6 bg-zinc-800 hover:bg-indigo-600 text-white transition-colors"
                >
                  View Details
                </Button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {selectedPerformer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg relative shadow-2xl max-h-[90vh] flex flex-col">
            
            {/* Header gradient banner with avatar anchored inside */}
            <div className="bg-gradient-to-br from-rose-950 via-fuchsia-900 to-violet-900 rounded-t-3xl px-6 pt-5 pb-6 relative shrink-0" style={{ minHeight: '120px' }}>
              <button 
                onClick={() => setSelectedPerformer(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all z-10"
              >
                <X size={20} />
              </button>
              {/* Avatar absolutely positioned at bottom-left of header */}
              <div
                className="absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-zinc-800 bg-cover bg-center border-4 border-zinc-950 shadow-2xl"
                style={{ backgroundImage: `url(${selectedPerformer.profilePicture || 'https://images.unsplash.com/photo-1516280440502-613fb25db5cd?w=500&q=80'})` }}
              />
            </div>

            {/* Name row — padded left to clear the avatar */}
            <div className="px-6 pt-12 pb-2 shrink-0">
              <h2 className="text-xl font-bold text-white tracking-tight leading-snug">{selectedPerformer.displayName || 'Various Artists'}</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-full text-xs border border-indigo-500/20">{selectedPerformer.category || 'Live Music'}</span>
                {selectedPerformer.genres && selectedPerformer.genres.length > 0 && (
                  <span className="text-zinc-400 text-xs">• {selectedPerformer.genres.join(', ')}</span>
                )}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">

              {/* Contact & Socials */}
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/60">
                <h4 className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-1">Contact & Socials</h4>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {selectedPerformer.user?.phone && (
                    <div className="flex items-center gap-2 text-zinc-300 text-sm">
                      <Phone size={16} className="text-emerald-400" />
                      <a href={`tel:${selectedPerformer.user.phone}`} className="hover:text-emerald-300 transition-colors">
                        {selectedPerformer.user.phone}
                      </a>
                    </div>
                  )}
                  {selectedPerformer.socialLinks?.instagram && (
                    <div className="flex items-center gap-2 text-zinc-300 text-sm">
                      <Camera size={16} className="text-pink-500" />
                      <a href={selectedPerformer.socialLinks.instagram.startsWith('http') ? selectedPerformer.socialLinks.instagram : `https://instagram.com/${selectedPerformer.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
                        {selectedPerformer.socialLinks.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '') || selectedPerformer.socialLinks.instagram}
                      </a>
                    </div>
                  )}
                  {selectedPerformer.socialLinks?.youtube && (
                    <div className="flex items-center gap-2 text-zinc-300 text-sm">
                      <PlayCircle size={16} className="text-red-500" />
                      <a href={selectedPerformer.socialLinks.youtube.startsWith('http') ? selectedPerformer.socialLinks.youtube : `https://youtube.com/${selectedPerformer.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors">
                        {selectedPerformer.socialLinks.youtube.replace(/^https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|user\/|@)?/, '').replace(/\/$/, '') || 'YouTube'}
                      </a>
                    </div>
                  )}
                  {selectedPerformer.socialLinks?.website && (
                    <div className="flex items-center gap-2 text-zinc-300 text-sm">
                      <Globe size={16} className="text-blue-400" />
                      <a href={selectedPerformer.socialLinks.website.startsWith('http') ? selectedPerformer.socialLinks.website : `https://${selectedPerformer.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition-colors">
                        {selectedPerformer.socialLinks.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 flex flex-col items-center justify-center text-center">
                  <span className="text-zinc-500 flex items-center justify-center mb-1 text-xs uppercase tracking-wider font-bold">
                    <Calendar size={12} className="mr-1" /> Performances
                  </span>
                  <span className="text-2xl text-white font-bold">{selectedPerformer.totalGigs || 0}</span>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 flex flex-col items-center justify-center text-center">
                  <span className="text-zinc-500 flex items-center justify-center mb-1 text-xs uppercase tracking-wider font-bold">
                    <Ticket size={12} className="mr-1" /> Tickets Sold
                  </span>
                  <span className="text-2xl text-white font-bold">{selectedPerformer.ticketsSold || 0}</span>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 flex flex-col items-center justify-center text-center">
                  <span className="text-zinc-500 flex items-center justify-center mb-1 text-xs uppercase tracking-wider font-bold">
                    <Users size={12} className="mr-1" /> Avg / Show
                  </span>
                  <span className="text-2xl text-white font-bold">
                    {selectedPerformer.totalGigs && selectedPerformer.ticketsSold
                      ? Math.round(selectedPerformer.ticketsSold / selectedPerformer.totalGigs)
                      : 0}
                  </span>
                </div>
              </div>

              {/* Last Performed */}
              {selectedPerformer.lastPerformed && (
                <div className="flex items-center gap-3 bg-indigo-500/10 text-indigo-300 p-4 rounded-xl border border-indigo-500/20">
                  <Users size={18} className="shrink-0 text-indigo-400" />
                  <p className="text-sm"><span className="font-semibold text-indigo-200">Last performed at:</span> {selectedPerformer.lastPerformed}</p>
                </div>
              )}

              {/* Bio */}
              <div>
                <h3 className="text-white font-bold text-base mb-2">About the Artist</h3>
                <div className="text-zinc-400 text-sm leading-relaxed space-y-2">
                  {selectedPerformer.bio ? (
                    selectedPerformer.bio.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)
                  ) : (
                    <p className="italic text-zinc-500">This performer has not provided a bio yet.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
