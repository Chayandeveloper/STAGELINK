'use client';

import { useState, useEffect } from 'react';
import { BookmarkCheck, MapPin, Calendar, Clock, Trash2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function SavedEventsPage() {
  const router = useRouter();
  const [savedEvents, setSavedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await api.get('/events/saved/me');
        setSavedEvents(res.data);
      } catch (e) {
        console.error('Failed to fetch saved events', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const handleUnsave = async (eventId: string) => {
    setRemovingId(eventId);
    try {
      await api.delete(`/events/${eventId}/save`);
      setSavedEvents(prev => prev.filter((e: any) => e._id !== eventId));
    } catch (e) {
      console.error('Failed to unsave', e);
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return 'Tonight';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Saved Events</h1>
        <p className="text-zinc-400 mt-1">Events you've bookmarked for later.</p>
      </div>

      {loading ? (
        <div className="text-zinc-500 py-16 text-center">Loading saved events...</div>
      ) : savedEvents.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
          <BookmarkCheck size={48} className="text-zinc-700" />
          <p className="text-white font-medium text-lg">No saved events yet</p>
          <p className="text-zinc-500 text-sm max-w-xs">Browse events and click the bookmark icon to save them here.</p>
          <Button onClick={() => router.push('/events')} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
            Explore Events
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedEvents.map((event: any) => {
            const venueName = event.restaurant?.restaurantName || 'Unknown Venue';
            const location = event.restaurant?.location || '';
            const performerName = event.performer?.displayName || null;
            const image = event.coverImage || 'https://images.unsplash.com/photo-1516280440502-613fb25db5cd?w=500&q=80';
            const price = event.ticketPrice ? `₹${event.ticketPrice}` : 'Free Entry';

            return (
              <div key={event._id} className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
                {/* Cover image */}
                <div
                  className="h-40 w-full bg-zinc-800 bg-cover bg-center"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div className="p-5">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{event.title}</h3>
                      {performerName && (
                        <p className="text-indigo-400 text-sm flex items-center gap-1 mt-0.5">
                          <Music size={13} /> {performerName}
                        </p>
                      )}
                    </div>
                    <span className="bg-indigo-600/20 text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-500/20 shrink-0">{price}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-sm text-zinc-400 mb-4">
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-zinc-500 shrink-0" />
                      {venueName}{location ? ` • ${location}` : ''}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar size={14} className="text-zinc-500 shrink-0" />
                      {formatDate(event.date)}{event.time ? ` at ${event.time}` : ''}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-zinc-800">
                    <Button
                      variant="ghost"
                      disabled={removingId === event._id}
                      onClick={() => handleUnsave(event._id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3"
                    >
                      <Trash2 size={16} />
                    </Button>
                    <Button
                      onClick={() => router.push(`/events/${event._id}`)}
                      className="flex-1 bg-zinc-800 hover:bg-indigo-600 text-white transition-colors"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
