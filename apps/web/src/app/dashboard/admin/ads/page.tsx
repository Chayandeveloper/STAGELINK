'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Edit, Save, X, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function AdminAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newAd, setNewAd] = useState<{ title: string, imageUrl: string, targets: { role: string, module: string }[], durationMs: number, isActive: boolean }>({ title: '', imageUrl: '', targets: [{ role: 'all', module: 'all' }], durationMs: 5000, isActive: true });

  const fetchAds = async () => {
    try {
      const res = await api.get('/ads');
      setAds(res.data);
    } catch (err) {
      console.error('Failed to fetch ads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await api.post('/ads', newAd);
      setAds([res.data, ...ads]);
      setIsCreating(false);
      setNewAd({ title: '', imageUrl: '', targets: [{ role: 'all', module: 'all' }], durationMs: 5000, isActive: true });
    } catch (err) {
      console.error('Failed to create ad', err);
      alert('Failed to create ad');
    }
  };

  const handleToggleActive = async (ad: any) => {
    try {
      const res = await api.put(`/ads/${ad._id}`, { isActive: !ad.isActive });
      setAds(ads.map(a => a._id === ad._id ? res.data : a));
    } catch (err) {
      console.error('Failed to toggle ad', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    try {
      await api.delete(`/ads/${id}`);
      setAds(ads.filter(a => a._id !== id));
    } catch (err) {
      console.error('Failed to delete ad', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Manage Pop-up Ads</h1>
          <p className="text-zinc-400 mt-1">Create and control global pop-up advertisements.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Create Ad
        </Button>
      </div>

      {isCreating && (
        <div className="bg-zinc-900 border border-indigo-500/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-white mb-4">New Pop-up Ad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Title (Internal reference)</label>
              <input 
                type="text" 
                value={newAd.title}
                onChange={e => setNewAd({...newAd, title: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                placeholder="e.g. Summer Festival Promo"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Image (URL or File Upload)</label>
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={newAd.imageUrl}
                  onChange={e => setNewAd({...newAd, imageUrl: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  placeholder="https://example.com/image.png"
                />
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs uppercase font-medium">OR</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp, image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewAd({...newAd, imageUrl: reader.result as string});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                />
              </div>
            </div>
            <div className="col-span-full">
              <label className="block text-sm text-zinc-400 mb-2">Target Audience (Rows)</label>
              <div className="space-y-3">
                {newAd.targets.map((target, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <select 
                      value={target.role}
                      onChange={e => {
                        const newTargets = [...newAd.targets];
                        newTargets[idx] = { role: e.target.value, module: 'all' };
                        setNewAd({...newAd, targets: newTargets});
                      }}
                      className="w-full sm:w-1/3 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="all">Everyone</option>
                      <option value="public">Logged Out / Public</option>
                      <option value="customer">Customer (Audience)</option>
                      <option value="performer">Performer</option>
                      <option value="restaurant">Venue</option>
                    </select>
                    
                    <select 
                      value={target.module}
                      onChange={e => {
                        const newTargets = [...newAd.targets];
                        newTargets[idx].module = e.target.value;
                        setNewAd({...newAd, targets: newTargets});
                      }}
                      className="w-full flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                      disabled={target.role === 'all'}
                    >
                      <option value="all">All Modules</option>
                      {target.role === 'public' && (
                        <>
                          <option value="/">Home Page (/)</option>
                          <option value="/events">Tonight Near Me (Public)</option>
                          <option value="/performers">Performers Directory</option>
                        </>
                      )}
                      {target.role === 'customer' && (
                        <>
                          <option value="/dashboard/audience">Dashboard Home</option>
                          <option value="/dashboard/audience/events">Tonight Near Me</option>
                          <option value="/dashboard/audience/saved">Saved Events</option>
                          <option value="/dashboard/audience/reservations">My Reservations</option>
                        </>
                      )}
                      {target.role === 'performer' && (
                        <>
                          <option value="/dashboard/performer">Dashboard Home</option>
                          <option value="/dashboard/performer/gigs">Opportunity Feed</option>
                          <option value="/dashboard/performer/venues">Local Venues</option>
                          <option value="/dashboard/performer/calendar">Accepted Gigs</option>
                        </>
                      )}
                      {target.role === 'restaurant' && (
                        <>
                          <option value="/dashboard/restaurant">Dashboard Home</option>
                          <option value="/dashboard/restaurant/post-gig">Create Opportunity</option>
                          <option value="/dashboard/restaurant/performers">Local Performers</option>
                          <option value="/dashboard/restaurant/events">Events</option>
                        </>
                      )}
                    </select>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0" 
                      onClick={() => {
                        if (newAd.targets.length > 1) {
                          setNewAd({...newAd, targets: newAd.targets.filter((_, i) => i !== idx)});
                        }
                      }}
                      disabled={newAd.targets.length === 1}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-white"
                  onClick={() => setNewAd({...newAd, targets: [...newAd.targets, { role: 'all', module: 'all' }]})}
                >
                  <Plus size={16} className="mr-2" /> Add Target Row
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Duration (milliseconds)</label>
              <input 
                type="number" 
                value={newAd.durationMs}
                onChange={e => setNewAd({...newAd, durationMs: parseInt(e.target.value) || 5000})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700" disabled={!newAd.title || !newAd.imageUrl}>
              Save Ad
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <div key={ad._id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="h-40 bg-zinc-800 relative">
              {ad.imageUrl ? (
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-zinc-600">
                  <ImageIcon size={48} />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold shadow-lg ${ad.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {ad.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-white">{ad.title}</h3>
              <div className="mt-2 space-y-1 flex-1">
                <div className="text-sm text-zinc-400 space-y-1">
                  <span className="text-zinc-500 block mb-1">Targets:</span> 
                  {ad.targets && ad.targets.map((t: any, i: number) => (
                    <div key={i} className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs inline-block mr-1 mb-1">
                      {t.role} &rarr; {t.module}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-zinc-400 mt-2"><span className="text-zinc-500">Duration:</span> {ad.durationMs / 1000}s</p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={ad.isActive ? "text-red-400 border-red-500/30 hover:bg-red-500/10" : "text-green-400 border-green-500/30 hover:bg-green-500/10"}
                  onClick={() => handleToggleActive(ad)}
                >
                  {ad.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleDelete(ad._id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {ads.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
            No ads configured yet. Click "Create Ad" to start.
          </div>
        )}
      </div>
    </div>
  );
}
