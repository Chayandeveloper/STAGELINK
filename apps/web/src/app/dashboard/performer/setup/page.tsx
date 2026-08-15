'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mic2, Music, Link as LinkIcon, Play } from 'lucide-react';
import api from '@/lib/api';

export default function PerformerSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('Singer');
  const [city, setCity] = useState('');
  const [genres, setGenres] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/profile/create', { 
        displayName, 
        category, 
        city,
        skills: genres.split(',').map(s => s.trim()).filter(Boolean),
        bio,
        instagram,
        youtube
      });
      router.push('/dashboard/performer');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create profile');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-cyan-400 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
            <Mic2 size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Set up your Artist Profile
          </h2>
          <p className="mt-2 text-zinc-400">
            Showcase your talent so venues can book you.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Stage Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="Your performing name"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Singer">Singer / Vocalist</option>
                  <option value="Band">Live Band</option>
                  <option value="DJ">DJ</option>
                  <option value="Stand-up">Stand-up Comedian</option>
                  <option value="Instrumentalist">Instrumentalist</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. New York, NY"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Genres (Comma separated)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Music size={16} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="Rock, Jazz, Pop..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Bio</label>
              <textarea
                required
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="Tell venues and fans about your experience and style..."
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300">Social Links</h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon size={16} className="text-zinc-500" />
                </div>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="Instagram Profile URL"
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Play size={16} className="text-zinc-500" />
                </div>
                <input
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="YouTube Channel or Video Link"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            disabled={loading}
          >
            {loading ? 'Creating Profile...' : 'Complete Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}
