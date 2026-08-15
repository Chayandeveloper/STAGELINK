'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, UserCircle, Calendar, Users, Ticket, Link as LinkIcon } from 'lucide-react';
import api from '@/lib/api';

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    profilePicture: '',
    bio: '',
    totalGigs: 0,
    lastPerformed: '',
    ticketsSold: 0,
    instagram: '',
    youtube: ''
  });

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await api.get('/profile/performer/portfolio');
        const performer = response.data.performer;
        setFormData({
          profilePicture: performer.profilePicture || '',
          bio: performer.bio || '',
          totalGigs: performer.totalGigs || 0,
          lastPerformed: performer.lastPerformed || '',
          ticketsSold: performer.ticketsSold || 0,
          instagram: performer.socialLinks?.instagram || '',
          youtube: performer.socialLinks?.youtube || ''
        });
      } catch (error) {
        console.error('Failed to fetch portfolio', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalGigs' || name === 'ticketsSold' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profile/performer/portfolio', formData);
      alert('Portfolio updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update portfolio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-zinc-500">Loading your portfolio...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Portfolio & Stats</h1>
          <p className="text-zinc-400 mt-1">Manage your public profile and performance statistics.</p>
        </div>
        <Button type="submit" disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Picture & Social Links */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <UserCircle className="mr-2 text-zinc-500" /> Profile Picture
            </h2>
            <div className="space-y-4">
              {formData.profilePicture ? (
                <div 
                  className="w-full aspect-square rounded-xl bg-cover bg-center border border-zinc-700"
                  style={{ backgroundImage: `url(${formData.profilePicture})` }}
                />
              ) : (
                <div className="w-full aspect-square rounded-xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500">
                  No Image
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Image URL</label>
                <input
                  type="text"
                  name="profilePicture"
                  value={formData.profilePicture}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <LinkIcon className="mr-2 text-zinc-500" /> Social Links
            </h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-zinc-400 mb-1">
                  <LinkIcon size={14} className="mr-2" /> Instagram
                </label>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="instagram.com/yourhandle"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-zinc-400 mb-1">
                  <LinkIcon size={14} className="mr-2" /> YouTube
                </label>
                <input
                  type="text"
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleChange}
                  placeholder="youtube.com/c/yourchannel"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bio & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Bio</h2>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell venues about your style, experience, and what you bring to the stage..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Performance Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-zinc-400 mb-2">
                  <Calendar className="mr-2 text-cyan-500" size={16} /> Total Gigs Performed
                </label>
                <input
                  type="number"
                  name="totalGigs"
                  value={formData.totalGigs}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white text-lg font-bold focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-zinc-400 mb-2">
                  <Ticket className="mr-2 text-cyan-500" size={16} /> Total Tickets Sold
                </label>
                <input
                  type="number"
                  name="ticketsSold"
                  value={formData.ticketsSold}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white text-lg font-bold focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center text-sm font-medium text-zinc-400 mb-2">
                  <Users className="mr-2 text-cyan-500" size={16} /> Last Performed At
                </label>
                <input
                  type="text"
                  name="lastPerformed"
                  value={formData.lastPerformed}
                  onChange={handleChange}
                  placeholder="e.g. The Grand Theater, Sept 2025"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
