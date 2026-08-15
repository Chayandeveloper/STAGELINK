'use client';

import { useState, useEffect } from 'react';
import { UserCircle, DollarSign, Camera, Link as LinkIcon, Phone, Save, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function PerformerProfilePage() {
  const [profileData, setProfileData] = useState({
    displayName: '',
    genres: '',
    pricing: '',
    bio: '',
    phone: '',
    profilePicture: '',
    instagram: '',
    youtube: '',
    website: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile/me');

        if (res.data) {
          setProfileData({
            displayName: res.data.displayName || '',
            genres: res.data.genres ? res.data.genres.join(', ') : '',
            pricing: res.data.pricing || '',
            bio: res.data.bio || '',
            profilePicture: res.data.profilePicture || '',
            instagram: res.data.socialLinks?.instagram || '',
            youtube: res.data.socialLinks?.youtube || '',
            website: res.data.socialLinks?.website || '',
            phone: res.data.user?.phone || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage({ text: '', type: '' });
    try {
      const payload = {
        displayName: profileData.displayName,
        genres: profileData.genres.split(',').map((g) => g.trim()).filter(Boolean),
        pricing: profileData.pricing,
        bio: profileData.bio,
        profilePicture: profileData.profilePicture,
        phone: profileData.phone,
        socialLinks: {
          instagram: profileData.instagram,
          youtube: profileData.youtube,
          website: profileData.website
        }
      };

      await api.put('/profile/update', payload);
      setSaveMessage({ text: 'Profile updated successfully!', type: 'success' });
      
      // clear message after 3 seconds
      setTimeout(() => setSaveMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Failed to update profile', error);
      setSaveMessage({ text: 'Failed to update profile. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Artist Profile</h1>
          <p className="text-zinc-400 mt-1">Manage your public artist persona and contact info.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving || loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {saveMessage.text && (
        <div className={`p-4 rounded-lg border ${
          saveMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {loading ? (
        <div className="text-zinc-500 py-10">Loading profile data...</div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          
          <div className="p-8 border-b border-zinc-800">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Camera size={20} className="text-indigo-400" />
              Profile Photo
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div 
                className="h-32 w-32 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-zinc-700 overflow-hidden shrink-0 bg-cover bg-center"
                style={profileData.profilePicture ? { backgroundImage: `url(${profileData.profilePicture})` } : {}}
              >
                {!profileData.profilePicture && <UserCircle size={48} className="text-zinc-600" />}
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="block text-sm font-medium text-zinc-300">Upload Image</label>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
                        setSaveMessage({ text: 'Unsupported image format. Please upload a standard JPEG or PNG image.', type: 'error' });
                        e.target.value = ''; // clear input
                        return;
                      }
                      setSaveMessage({ text: '', type: '' }); // clear any previous errors
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProfileData(prev => ({ ...prev, profilePicture: (reader.result as string) || '' }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-zinc-400 focus:border-indigo-500 focus:outline-none transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-zinc-200 hover:file:bg-zinc-600 cursor-pointer"
                />
                
                <div className="flex items-center gap-2 py-2">
                  <div className="h-px bg-zinc-800 flex-1"></div>
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">OR</span>
                  <div className="h-px bg-zinc-800 flex-1"></div>
                </div>

                <label className="block text-sm font-medium text-zinc-300">Paste Image URL</label>
                <input
                  type="url"
                  name="profilePicture"
                  value={profileData.profilePicture || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-zinc-500 pt-1">Provide a direct link or upload an image file (JPEG, PNG). We recommend a square image.</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div>
              <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                <Edit3 size={20} className="text-indigo-400" />
                Basic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Stage Name *</label>
                  <input
                    type="text"
                    name="displayName"
                    value={profileData.displayName || ''}
                    onChange={handleChange}
                    placeholder="Your performer name"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Genres</label>
                  <input
                    type="text"
                    name="genres"
                    value={profileData.genres || ''}
                    onChange={handleChange}
                    placeholder="Rock, Acoustic, Jazz (comma separated)"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Bio / About Me</label>
                  <textarea
                    name="bio"
                    value={profileData.bio || ''}
                    onChange={handleChange}
                    placeholder="Tell your audience and venues about yourself..."
                    rows={4}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors resize-y"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Base Rate / Gig</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      name="pricing"
                      value={profileData.pricing || ''}
                      onChange={handleChange}
                      placeholder="e.g. 500"
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800/80 pl-10 pr-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={16} className="text-zinc-500" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone || ''}
                      onChange={handleChange}
                      placeholder="Phone number for bookings"
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800/80 pl-10 pr-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-zinc-800">
              <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                <LinkIcon size={20} className="text-indigo-400" />
                Social Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Instagram Handle or URL</label>
                  <input
                    type="text"
                    name="instagram"
                    value={profileData.instagram || ''}
                    onChange={handleChange}
                    placeholder="@username or https://..."
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">YouTube URL</label>
                  <input
                    type="text"
                    name="youtube"
                    value={profileData.youtube || ''}
                    onChange={handleChange}
                    placeholder="https://youtube.com/..."
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Personal Website</label>
                  <input
                    type="url"
                    name="website"
                    value={profileData.website || ''}
                    onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
