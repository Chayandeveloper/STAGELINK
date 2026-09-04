'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Briefcase, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function PostGigPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [budget, setBudget] = useState('');
  const [genres, setGenres] = useState('');
  const [description, setDescription] = useState('');

  const [gigs, setGigs] = useState<any[]>([]);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [restaurantId, setRestaurantId] = useState('');

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoadingGigs(true);
        const profileRes = await api.get('/profile/me');
        if (profileRes.data && profileRes.data._id) {
          const rId = profileRes.data._id;
          setRestaurantId(rId);
          const gigsRes = await api.get(`/gigs?restaurant=${rId}`);
          setGigs(gigsRes.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch opportunities', err);
      } finally {
        setLoadingGigs(false);
      }
    };
    fetchGigs();
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/gigs', {
        title,
        date: new Date(date).toISOString(),
        time,
        duration,
        budget: Number(budget),
        requiredSkill: genres,
        description
      });
      // Reset form fields
      setTitle('');
      setDate('');
      setTime('');
      setDuration('');
      setBudget('');
      setGenres('');
      setDescription('');
      
      // Switch back to opportunities list
      setActiveTab('list');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post gig');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Opportunities</h1>
        <p className="text-zinc-400 mt-1">Broadcast opportunities and manage your posted gigs.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 flex space-x-8">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'list'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          My Opportunities
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'create'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Create Opportunity
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-6">
          {loadingGigs ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          ) : gigs.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl">
              <Briefcase className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No opportunities posted</h3>
              <p className="text-zinc-400 mb-6">Start broadcasting gigs to find local performers for your venue.</p>
              <Button onClick={() => setActiveTab('create')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Post Your First Gig
              </Button>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="divide-y divide-zinc-800">
                {gigs.map((opp) => (
                  <div key={opp._id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{opp.title}</h3>
                        <p className="text-sm text-zinc-400">
                          {new Date(opp.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {opp.time} • Duration: {opp.duration} • Budget: ${opp.budget}
                        </p>
                        {opp.requiredSkill && (
                          <p className="text-xs text-indigo-400 mt-1 font-medium">Genres: {opp.requiredSkill}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="text-center px-4 py-2 bg-zinc-800/50 rounded-lg">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-green-400">Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Gig Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Acoustic Friday Nights"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Budget ($)</label>
                <input
                  type="number"
                  required
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="200"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Duration</label>
                <input
                  type="text"
                  required
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 2 hours"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Required Genres (Comma separated)</label>
              <input
                type="text"
                required
                value={genres}
                onChange={e => setGenres(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Acoustic, Pop, Indie"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Description & Requirements</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Looking for a solo guitarist to play for 3 hours. Must bring own PA system."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post Gig Broadcast'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
