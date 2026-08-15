'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Store, MapPin, Map, Utensils } from 'lucide-react';
import api from '@/lib/api';

export default function VenueSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [cuisine, setCuisine] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/profile/create', { 
        restaurantName, 
        address, 
        city,
        cuisine,
        stageAvailable: true 
      });
      router.push('/dashboard/restaurant');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create profile');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-purple-400 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
            <Store size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Set up your Venue Profile
          </h2>
          <p className="mt-2 text-zinc-400">
            Tell performers about your space.
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
              <label className="block text-sm font-medium text-zinc-300 mb-1">Venue Name</label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="The Daily Grind Cafe"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Street Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={16} className="text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-3 py-2 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="123 Main St"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Map size={16} className="text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-3 py-2 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="e.g. New York, NY"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Cuisine / Vibe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Utensils size={16} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-3 py-2 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Italian, Coffee Shop, Dive Bar..."
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={loading}
          >
            {loading ? 'Creating Profile...' : 'Complete Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}
