'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Calendar, Filter, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function GigsFeedPage() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const { data } = await api.get('/gigs');
        // Let's filter out anything that isn't 'open'
        setGigs(data.filter((gig: any) => gig.status === 'open'));
      } catch (err) {
        console.error('Failed to fetch gigs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  const handleApply = async (id: string) => {
    setApplying(id);
    try {
      await api.post(`/applications/gig/${id}`, { coverNote: 'I would love to perform for this gig!' });
      alert('Application Sent! Check My Applications to track its status.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to apply for gig');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Available Gigs</h1>
          <p className="text-zinc-400 mt-1">Browse and apply to local opportunities.</p>
        </div>
        <Button variant="outline" className="border-zinc-700 text-zinc-300">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-zinc-400">Loading gigs...</div>
        ) : gigs.length === 0 ? (
          <div className="text-zinc-500 italic">No available gigs found right now. Check back later!</div>
        ) : (
          gigs.map((gig) => (
            <div key={gig._id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-zinc-700">
              <div className="space-y-4 flex-1">
                <div>
                  <h2 className="text-xl font-bold text-white">{gig.title}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mt-2">
                    <span className="flex items-center"><MapPin size={16} className="mr-1 text-zinc-500" /> {gig.restaurant?.restaurantName || 'Unknown'} ({gig.restaurant?.location || 'Unknown'})</span>
                    <span className="flex items-center"><Calendar size={16} className="mr-1 text-zinc-500" /> {new Date(gig.date).toLocaleDateString()}</span>
                    <span className="flex items-center"><Clock size={16} className="mr-1 text-zinc-500" /> {gig.time} ({gig.duration})</span>
                    <span className="flex items-center text-green-400"><DollarSign size={16} className="mr-1" /> {gig.budget}</span>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm max-w-3xl">
                  {gig.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {gig.requiredSkill && gig.requiredSkill.split(',').map((genre: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md">
                      {genre.trim()}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button 
                  onClick={() => handleApply(gig._id)}
                  disabled={applying === gig._id}
                  className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {applying === gig._id ? 'Applying...' : 'Apply for Gig'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
