'use client';

import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Star, Music, MapPin, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function PerformerDashboard() {
  const [acceptedGigs, setAcceptedGigs] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appsRes, venuesRes] = await Promise.all([
          api.get('/applications/performer'),
          api.get('/discovery/venues')
        ]);
        
        const accepted = appsRes.data.filter((app: any) => app.status === 'accepted');
        setAcceptedGigs(accepted);
        setVenues((venuesRes.data.venues || []).slice(0, 3)); // Only show top 3 venues
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Artist Overview</h1>
          <p className="text-zinc-400 mt-1">Track your upcoming gigs and earnings.</p>
        </div>
        <Link 
          href="/dashboard/performer/venues"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-lg"
        >
          <Music className="mr-2 h-4 w-4" />
          Find Venues
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Upcoming Gigs</p>
            <h3 className="text-2xl font-bold text-white">{acceptedGigs.length}</h3>
          </div>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Total Earnings</p>
            <h3 className="text-2xl font-bold text-white">$0</h3>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Average Rating</p>
            <h3 className="text-2xl font-bold text-white">5.0 / 5</h3>
          </div>
        </div>
      </div>

      {/* NEW: Discover Local Venues Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Discover Local Venues</h2>
          <Link href="/dashboard/performer/venues" className="text-cyan-400 text-sm hover:text-cyan-300 font-medium">
            View All →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-zinc-400">Loading venues...</div>
          ) : venues.length === 0 ? (
            <div className="col-span-3 text-zinc-500 italic">No venues found nearby.</div>
          ) : (
            venues.map((venue) => (
              <div key={venue._id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
                <div className="h-32 bg-zinc-800 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-bold text-white truncate">{venue.restaurantName}</h3>
                    <p className="text-xs text-zinc-300 flex items-center mt-1">
                      <MapPin size={12} className="mr-1" /> {venue.location}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {venue.preferredGenres && venue.preferredGenres.map((genre: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] uppercase tracking-wider font-bold rounded-md">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <Link 
                    href={`/dashboard/performer/venues`} 
                    className="flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors w-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    View & Pitch
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Upcoming Schedule</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {loading ? (
            <div className="p-6 text-zinc-400">Loading schedule...</div>
          ) : acceptedGigs.length === 0 ? (
            <div className="p-6 text-zinc-500 italic">No upcoming gigs found. Pitch to venues to book gigs!</div>
          ) : (
            acceptedGigs.map((app) => {
              const date = new Date(app.updatedAt);
              const month = date.toLocaleString('default', { month: 'short' });
              const day = date.getDate();
              const venueName = app.restaurant?.user?.name || app.gig?.restaurant?.user?.name || 'Unknown Venue';
              const title = app.gig ? app.gig.title : 'Direct Booking';
              const price = app.gig ? `$${app.gig.budget}` : 'TBD';

              return (
                <div key={app._id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-xl bg-zinc-800 flex flex-col items-center justify-center text-zinc-300">
                      <span className="text-xs font-bold uppercase">{month}</span>
                      <span className="text-lg font-bold leading-none">{day}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{title}</h4>
                      <p className="text-sm text-zinc-400">{venueName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3 text-right">
                    <div>
                      <span className="block text-green-400 font-medium">{price}</span>
                      <span className="block text-xs text-zinc-500">Confirmed</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
