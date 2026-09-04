'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Save, Heart, Flame, ShieldAlert, CheckCircle2, Loader2, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

interface RewardTier {
  minBill: number;
  maxBill: number;
  extraLikes: number;
  durationDays: number;
}

export default function AdminSettingsPage() {
  const [maxDailyLikes, setMaxDailyLikes] = useState<number>(15);
  const [maxDailySwipes, setMaxDailySwipes] = useState<number>(50);
  const [likeRewardTiers, setLikeRewardTiers] = useState<RewardTier[]>([
    { minBill: 100, maxBill: 500, extraLikes: 5, durationDays: 3 },
    { minBill: 501, maxBill: 1500, extraLikes: 15, durationDays: 7 },
    { minBill: 1501, maxBill: 3000, extraLikes: 30, durationDays: 14 },
    { minBill: 3001, maxBill: 100000, extraLikes: 50, durationDays: 30 }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });

  const user = useAuthStore(state => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/login');
      return;
    }

    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data) {
          setMaxDailyLikes(res.data.maxDailyLikes ?? 15);
          setMaxDailySwipes(res.data.maxDailySwipes ?? 50);
          if (Array.isArray(res.data.likeRewardTiers) && res.data.likeRewardTiers.length > 0) {
            setLikeRewardTiers(res.data.likeRewardTiers.map((t: any) => ({
              minBill: t.minBill,
              maxBill: t.maxBill,
              extraLikes: t.extraLikes,
              durationDays: t.durationDays || 7
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin settings', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchSettings();
    }
  }, [user, router]);

  const handleAddTier = () => {
    const lastTier = likeRewardTiers[likeRewardTiers.length - 1];
    const nextMin = lastTier ? lastTier.maxBill + 1 : 100;
    const nextMax = nextMin + 1000;
    const nextLikes = lastTier ? lastTier.extraLikes + 10 : 10;
    const nextDays = lastTier ? (lastTier.durationDays || 7) + 7 : 7;
    setLikeRewardTiers([...likeRewardTiers, { minBill: nextMin, maxBill: nextMax, extraLikes: nextLikes, durationDays: nextDays }]);
  };

  const handleRemoveTier = (index: number) => {
    if (likeRewardTiers.length <= 1) {
      setMessage({ text: 'Must keep at least one bill reward tier', type: 'error' });
      return;
    }
    setLikeRewardTiers(likeRewardTiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof RewardTier, val: number) => {
    const updated = [...likeRewardTiers];
    updated[index] = { ...updated[index], [field]: val };
    setLikeRewardTiers(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: 'success' });

    if (maxDailyLikes < 1 || maxDailySwipes < 1) {
      setMessage({ text: 'Limits must be positive numbers greater than 0', type: 'error' });
      setSaving(false);
      return;
    }

    if (maxDailyLikes > maxDailySwipes) {
      setMessage({ text: 'Max Daily Likes cannot exceed Max Daily Swipes', type: 'error' });
      setSaving(false);
      return;
    }

    for (const tier of likeRewardTiers) {
      if (tier.minBill < 0 || tier.maxBill <= tier.minBill || tier.extraLikes < 1 || tier.durationDays < 1) {
        setMessage({ text: 'Each tier must have Min Bill >= 0, Max Bill > Min Bill, Extra Likes >= 1, and Validity Days >= 1', type: 'error' });
        setSaving(false);
        return;
      }
    }

    try {
      const res = await api.put('/admin/settings', {
        maxDailyLikes,
        maxDailySwipes,
        likeRewardTiers
      });
      if (res.data) {
        setMaxDailyLikes(res.data.maxDailyLikes);
        setMaxDailySwipes(res.data.maxDailySwipes);
        if (res.data.likeRewardTiers) {
          setLikeRewardTiers(res.data.likeRewardTiers);
        }
        setMessage({ text: 'System settings & bill reward tiers saved successfully!', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
      }
    } catch (err: any) {
      console.error('Failed to update system settings', err);
      setMessage({
        text: err.response?.data?.message || 'Failed to update system settings',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-500" />
          System & Audience Settings
        </h1>
        <p className="text-zinc-400 mt-1">
          Configure default platform limits and restaurant dining reward tiers for extra likes.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Interaction Limits */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-indigo-400" />
              Audience Daily Interaction Limits
            </h2>
            <p className="text-zinc-400 text-sm">
              Control how many default likes and total profile swipes an audience member can perform per day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Max Daily Likes / Accounts
                </label>
                <span className="text-xs font-mono text-zinc-500">Default: 15</span>
              </div>
              <input
                type="number"
                min={1}
                value={maxDailyLikes}
                onChange={(e) => setMaxDailyLikes(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white font-bold text-lg focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-xs text-zinc-500">
                Maximum number of connection invitations / likes an audience user can send in 24 hours.
              </p>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Max Total Daily Swipes
                </label>
                <span className="text-xs font-mono text-zinc-500">Default: 50</span>
              </div>
              <input
                type="number"
                min={1}
                value={maxDailySwipes}
                onChange={(e) => setMaxDailySwipes(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white font-bold text-lg focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-xs text-zinc-500">
                Maximum total profile interactions (Likes + Passes/Dislikes combined) per user per day.
              </p>
            </div>
          </div>
        </div>

        {/* Restaurant Bill Extra Likes Tiers */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                <UtensilsCrossed className="w-5 h-5 text-pink-400" />
                Restaurant Bill Extra Likes Tiers
              </h2>
              <p className="text-zinc-400 text-sm">
                Set the bill amount ranges and the corresponding extra likes customer will receive upon code redemption.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleAddTier}
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Range Tier
            </Button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2">
              <div className="col-span-3">Min Bill Amount (₹)</div>
              <div className="col-span-3">Max Bill Amount (₹)</div>
              <div className="col-span-3">Extra Likes/Day</div>
              <div className="col-span-2">Validity (Days)</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {likeRewardTiers.map((tier, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3">
                <div className="col-span-3">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={tier.minBill}
                      onChange={(e) => handleTierChange(idx, 'minBill', parseInt(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-medium text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
                    <input
                      type="number"
                      min={1}
                      value={tier.maxBill}
                      onChange={(e) => handleTierChange(idx, 'maxBill', parseInt(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-medium text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={tier.extraLikes}
                      onChange={(e) => handleTierChange(idx, 'extraLikes', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg border border-pink-500/40 bg-zinc-900 text-pink-300 font-bold text-sm focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={tier.durationDays || 7}
                      onChange={(e) => handleTierChange(idx, 'durationDays', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg border border-indigo-500/40 bg-zinc-900 text-indigo-300 font-bold text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(idx)}
                    disabled={likeRewardTiers.length <= 1}
                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 disabled:opacity-30 transition"
                    title="Remove tier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-500 italic">
            When a restaurant owner inputs a customer's bill, the system automatically awards extra daily likes matching these ranges for the specified duration of days.
          </p>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings & Tiers'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
