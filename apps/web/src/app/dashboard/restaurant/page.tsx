'use client';

import { Button } from '@/components/ui/button';
import { Plus, Users, Calendar, TrendingUp, Music, Star, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RestaurantDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [performers, setPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appsRes, perfRes] = await Promise.all([
          api.get('/applications/venue'),
          api.get('/discovery/performers')
        ]);
        setApplications(appsRes.data);
        setPerformers((perfRes.data.performers || []).slice(0, 3)); // Only show top 3 performers
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  // Let's grab the 3 most recent applications to show on the dashboard
  const recentApplications = [...applications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  const handleReview = () => {
    router.push('/dashboard/restaurant/applications');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Venue Overview</h1>
          <p className="text-zinc-400 mt-1">Manage your upcoming gigs and applications.</p>
        </div>
        <Link 
          href="/dashboard/restaurant/performers"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg"
        >
          <Users className="mr-2 h-4 w-4" />
          Find Performers
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Active Gigs</p>
            <h3 className="text-2xl font-bold text-white">0</h3>
          </div>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Pending Applications</p>
            <h3 className="text-2xl font-bold text-white">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Total Tickets Sold</p>
            <h3 className="text-2xl font-bold text-white">0</h3>
          </div>
        </div>
      </div>

      {/* NEW: Top Local Performers Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Top Local Performers</h2>
          <Link href="/dashboard/restaurant/performers" className="text-indigo-400 text-sm hover:text-indigo-300 font-medium">
            View All →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-zinc-400">Loading performers...</div>
          ) : performers.length === 0 ? (
            <div className="col-span-3 text-zinc-500 italic">No performers found nearby.</div>
          ) : (
            performers.map((performer) => (
              <div key={performer._id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-indigo-500/20">
                      <Music size={24} className="text-indigo-400" />
                    </div>
                    <div className="bg-yellow-500/10 px-2 py-1 rounded flex items-center">
                      <Star size={12} className="text-yellow-400 mr-1 fill-yellow-400" />
                      <span className="text-xs font-bold text-yellow-400">5.0</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white truncate">{performer.user?.name || 'Unknown Performer'}</h3>
                  <p className="text-xs text-zinc-400 flex items-center mt-1">
                    <MapPin size={12} className="mr-1" /> {performer.user?.city || 'Unknown City'}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-4 mb-4">
                    {performer.genres && performer.genres.map((genre: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] uppercase tracking-wider font-bold rounded-md">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <Link 
                    href={`/dashboard/restaurant/performers`} 
                    className="flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors w-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Recent Applications</h2>
          <Button variant="ghost" className="text-indigo-400 hover:text-indigo-300" onClick={handleReview}>View All</Button>
        </div>
        <div className="divide-y divide-zinc-800">
          {loading ? (
             <div className="p-6 text-zinc-400">Loading applications...</div>
          ) : recentApplications.length === 0 ? (
             <div className="p-6 text-zinc-500 italic">No applications found. Reach out to local performers!</div>
          ) : (
            recentApplications.map((app) => (
              <div key={app._id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Music className="text-zinc-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{app.performer?.user?.name || 'Unknown Performer'}</h4>
                    <p className="text-sm text-zinc-400">
                      Applied for: {app.gig ? app.gig.title : 'Direct Pitch'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={handleReview}>Review</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Removed duplicate import
