'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

const INTEREST_OPTIONS = ['Live Music', 'Comedy', 'Open Mic', 'Theatre', 'Food Tasting', 'Networking', 'Developer Meetups', 'Gaming'];
const LOOKING_FOR_OPTIONS = ['Make Friends', 'Event Buddy', 'Networking', 'Developer Buddy', 'Coffee Buddy'];

export default function AudienceProfileSetup() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'invisible' | 'nearby' | 'everyone'>('nearby');
  const [city, setCity] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      if (res.data) {
        setName(res.data.name || (user as any)?.name || '');
        setEmail(res.data.email || (user as any)?.email || '');
        setPhone(res.data.phone || '');
        setGender(res.data.gender || 'male');
        setInterests(res.data.interests || []);
        setLookingFor(res.data.lookingFor || []);
        setVisibility(res.data.privacySettings?.visibility || 'nearby');
        setCity(res.data.city || (user as any)?.city || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Auto-fix: if user has no role yet, assign 'customer' first
      if (!user?.role) {
        await api.post('/profile/role', { role: 'customer' });
      }
      await api.put('/profile/update', {
        name,
        phone,
        gender,
        interests,
        lookingFor,
        privacySettings: { visibility },
        city
      });
      router.push('/dashboard/audience');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (item: string, array: string[], setter: (val: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Community Profile</h1>
        <p className="text-zinc-400">Set up your preferences to find the perfect event buddies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="text-sm font-medium text-zinc-400">Full Name</label>
          <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="bg-transparent border-none outline-none text-white w-full placeholder:text-zinc-600"
              placeholder="Your full name"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium text-zinc-400">Email Address (Read-only)</label>
          <div className="flex items-center space-x-2 bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl opacity-70">
            <input 
              type="email" 
              value={email} 
              disabled
              className="bg-transparent border-none outline-none text-white w-full placeholder:text-zinc-600 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium text-zinc-400">Phone Number</label>
          <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              className="bg-transparent border-none outline-none text-white w-full placeholder:text-zinc-600"
              placeholder="Your phone number"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium text-zinc-400">Gender</label>
          <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="bg-transparent border-none outline-none text-white w-full appearance-none"
            >
              <option value="male" className="bg-zinc-900">Male</option>
              <option value="female" className="bg-zinc-900">Female</option>
              <option value="other" className="bg-zinc-900">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium text-zinc-400">Your City</label>
        <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
          <MapPin className="text-indigo-500" size={18} />
          <input 
            type="text" 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-zinc-600"
            placeholder="e.g. New York, London, Berlin"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">What are your interests?</h3>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map(opt => (
            <Badge 
              key={opt}
              onClick={() => toggleArrayItem(opt, interests, setInterests)}
              className={`cursor-pointer px-4 py-2 text-sm transition ${interests.includes(opt) ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
              variant={interests.includes(opt) ? 'default' : 'outline'}
            >
              {opt}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">What are you looking for?</h3>
        <p className="text-xs text-zinc-500 -mt-2 mb-2">This is NOT a dating app. Select how you want to connect.</p>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR_OPTIONS.map(opt => (
            <Badge 
              key={opt}
              onClick={() => toggleArrayItem(opt, lookingFor, setLookingFor)}
              className={`cursor-pointer px-4 py-2 text-sm transition ${lookingFor.includes(opt) ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
              variant={lookingFor.includes(opt) ? 'default' : 'outline'}
            >
              {opt}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4 border-t border-zinc-800 pt-6">
        <h3 className="text-lg font-semibold text-white">Privacy & Visibility</h3>
        <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800">
          <div>
            <p className="text-white font-medium">Visible to Nearby Fans</p>
            <p className="text-xs text-zinc-500 mt-1">Allow others in your city to see your profile and send connection requests. Precise location is NEVER shared.</p>
          </div>
          <Switch 
            checked={visibility !== 'invisible'} 
            onCheckedChange={(c: boolean) => setVisibility(c ? 'nearby' : 'invisible')} 
          />
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-white text-black hover:bg-zinc-200 px-8">
          {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
