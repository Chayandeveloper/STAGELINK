'use client';

import { useState, useEffect } from 'react';
import { Store, MapPin, Send, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function BrowseVenuesPage() {
  const [requesting, setRequesting] = useState<string | null>(null);
  const [localVenues, setLocalVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [pitchData, setPitchData] = useState({
    proposedTitle: '',
    proposedDate: '',
    proposedTime: '',
    coverNote: ''
  });

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await api.get('/discovery/venues');
        setLocalVenues(response.data.venues || []);
      } catch (error) {
        console.error('Failed to fetch venues', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue) return;

    setRequesting(selectedVenue._id);
    try {
      await api.post('/applications/direct', {
        targetId: selectedVenue._id,
        initiatorRole: 'performer',
        ...pitchData
      });
      alert('Pitch Sent Successfully! Check My Applications to track its status.');
      setSelectedVenue(null);
      setPitchData({ proposedTitle: '', proposedDate: '', proposedTime: '', coverNote: '' });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send pitch');
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Local Venues</h1>
          <p className="text-zinc-400 mt-1">Discover and pitch to venues in your city.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading local venues...</div>
      ) : localVenues.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl">
          <p>No venues found in your city yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localVenues.map((venue) => (
            <div key={venue._id} className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
              <div 
                className="h-40 w-full bg-zinc-800 bg-cover bg-center"
                style={{ backgroundImage: `url(https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80)` }} // Placeholder image since we don't have images uploaded yet
              />
              <div className="p-6 relative">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{venue.restaurantName || venue.user?.name}</h3>
                  <div className="flex items-center text-yellow-400 text-sm font-bold bg-yellow-500/10 px-2 py-1 rounded">
                    <Star size={14} className="mr-1 fill-yellow-400" /> 4.8
                  </div>
                </div>
                
                <div className="space-y-1 mb-4 text-sm text-zinc-400">
                  <div className="flex items-center"><Store size={14} className="mr-2 text-zinc-500" /> Venue</div>
                  <div className="flex items-center"><MapPin size={14} className="mr-2 text-zinc-500" /> {venue.user?.city || 'Your City'}</div>
                </div>

                <p className="text-zinc-300 text-sm mb-6 h-10 line-clamp-2">
                  {venue.address}
                </p>
                
                <Button 
                  onClick={() => setSelectedVenue(venue)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  <Send size={16} className="mr-2" /> Draft Pitch
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-2">Pitch to {selectedVenue.restaurantName || selectedVenue.user?.name}</h2>
            <p className="text-sm text-zinc-400 mb-6">Propose a date and time for your performance.</p>
            
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Event Title</label>
                <input 
                  required
                  type="text" 
                  value={pitchData.proposedTitle}
                  onChange={(e) => setPitchData({...pitchData, proposedTitle: e.target.value})}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Acoustic Sunset Session"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Date</label>
                  <input 
                    required
                    type="date" 
                    value={pitchData.proposedDate}
                    onChange={(e) => setPitchData({...pitchData, proposedDate: e.target.value})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Time</label>
                  <input 
                    required
                    type="time" 
                    value={pitchData.proposedTime}
                    onChange={(e) => setPitchData({...pitchData, proposedTime: e.target.value})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">What will you perform?</label>
                <textarea 
                  required
                  value={pitchData.coverNote}
                  onChange={(e) => setPitchData({...pitchData, coverNote: e.target.value})}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-h-[100px]"
                  placeholder="Describe your set list or performance style..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setSelectedVenue(null)} 
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={requesting === selectedVenue._id}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {requesting === selectedVenue._id ? 'Sending...' : 'Send Pitch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
