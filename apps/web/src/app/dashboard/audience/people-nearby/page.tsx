'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, CheckCircle2, MapPin, UserPlus, Users, 
  MessageSquare, Award, Star, Calendar, Mic2, 
  Coffee, Utensils, Smile, Laptop, Gamepad2, 
  Camera, Palette, BookOpen, Dumbbell, Plane,
  BadgeCheck, Heart, X, Flame, ShieldAlert, HeartCrack, Clock,
  Sparkles, UtensilsCrossed, Ticket, Building2, Check, ExternalLink,
  SlidersHorizontal, Filter, UserCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

const INTEREST_CATEGORIES = [
  { id: 'All', label: 'All Explorers', icon: Users },
  { id: 'Live Music', label: 'Live Music', icon: Mic2 },
  { id: 'Coffee', label: 'Coffee', icon: Coffee },
  { id: 'Food', label: 'Food', icon: Utensils },
  { id: 'Comedy', label: 'Comedy', icon: Smile },
  { id: 'Tech', label: 'Tech', icon: Laptop },
  { id: 'Gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'Photography', label: 'Photography', icon: Camera },
  { id: 'Art', label: 'Art', icon: Palette },
  { id: 'Books', label: 'Books', icon: BookOpen },
  { id: 'Fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'Travel', label: 'Travel', icon: Plane }
];

const getCosmetics = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0; 
  }
  
  const absHash = Math.abs(hash);
  
  const reasons = [
    "Both enjoy live music",
    "Both attended similar events",
    "Looking for networking partners",
    "Active this evening",
    "Shared interest in exploring cafes",
    "Both recently attended a comedy show",
    "High community engagement",
    "Similar activity patterns on weekends"
  ];
  
  const activities = [
    { label: "Active 5m ago", color: "text-emerald-400" },
    { label: "Going out tonight", color: "text-indigo-400" },
    { label: "Attending live show", color: "text-amber-400" },
    { label: "Exploring cafes", color: "text-pink-400" }
  ];
  
  return {
    reason: reasons[absHash % reasons.length],
    activity: activities[absHash % activities.length]
  };
};

const getInterestIcon = (tag: string) => {
  const lower = (tag || '').toLowerCase();
  if (lower.includes('coffee') || lower.includes('cafe')) return Coffee;
  if (lower.includes('food') || lower.includes('dine') || lower.includes('cook') || lower.includes('eat')) return Utensils;
  if (lower.includes('music') || lower.includes('sing') || lower.includes('band') || lower.includes('concert')) return Mic2;
  if (lower.includes('book') || lower.includes('read')) return BookOpen;
  if (lower.includes('fitness') || lower.includes('gym') || lower.includes('workout') || lower.includes('sport')) return Dumbbell;
  if (lower.includes('art') || lower.includes('paint') || lower.includes('design')) return Palette;
  if (lower.includes('photo')) return Camera;
  if (lower.includes('tech') || lower.includes('code') || lower.includes('program')) return Laptop;
  if (lower.includes('game') || lower.includes('gaming')) return Gamepad2;
  if (lower.includes('travel') || lower.includes('trip')) return Plane;
  if (lower.includes('comedy') || lower.includes('laugh')) return Smile;
  return Sparkles;
};

export default function DiscoverCommunityPage() {
  const [nearbyPeople, setNearbyPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [selectedInterest, setSelectedInterest] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'sent'>('discover');
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [showLikeLimitModal, setShowLikeLimitModal] = useState(false);
  const [showGetLikesModal, setShowGetLikesModal] = useState(false);
  const [getLikesTab, setGetLikesTab] = useState<'restaurants' | 'redeem'>('restaurants');
  const [cityVenues, setCityVenues] = useState<any[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [swipeStats, setSwipeStats] = useState({
    likesToday: 0,
    swipesToday: 0,
    maxDailyLikes: 15,
    maxDailySwipes: 50,
    likesRemaining: 15,
    swipesRemaining: 50
  });

  const activeFilterCount = (selectedGender !== 'All' ? 1 : 0) + (selectedInterest !== 'All' ? 1 : 0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedInterest, selectedGender, activeTab, isMobile]);

  const fetchData = async () => {
    try {
      const [nearbyRes, sentRes, statsRes] = await Promise.all([
        api.get('/engagement/nearby'),
        api.get('/connections/sent'),
        api.get('/connections/swipe-stats')
      ]);
      setNearbyPeople(nearbyRes.data.people || []);
      setSentRequests(sentRes.data || []);
      if (statsRes.data) {
        setSwipeStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCityVenues = async () => {
    setLoadingVenues(true);
    try {
      const res = await api.get('/discovery/venues');
      setCityVenues(res.data.venues || []);
    } catch (err) {
      console.error('Failed to fetch city venues', err);
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleOpenGetLikes = (tab: 'restaurants' | 'redeem' = 'restaurants') => {
    setGetLikesTab(tab);
    setRedeemMessage(null);
    setShowGetLikesModal(true);
    fetchCityVenues();
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setRedeeming(true);
    setRedeemMessage(null);
    try {
      const res = await api.post('/connections/redeem-code', { code: voucherCode.trim() });
      if (res.data?.stats) {
        setSwipeStats(res.data.stats);
      }
      setLimitError(null);
      const msg = res.data.message || `Redeemed +${res.data.likesAwarded} extra likes every day for ${res.data.durationDays || 7} days!`;
      setRedeemMessage({ text: msg, type: 'success' });
      setVoucherCode('');
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        setShowGetLikesModal(false);
        setRedeemMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to redeem code', err);
      setRedeemMessage({
        text: err.response?.data?.message || 'Failed to redeem code. Please check the code and try again.',
        type: 'error'
      });
    } finally {
      setRedeeming(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSwipeAction = async (targetId: string, action: 'like' | 'dislike') => {
    setLimitError(null);

    // Client-side quick check for out of likes
    if (action === 'like' && swipeStats.likesRemaining <= 0) {
      const errorMsg = "You're out of likes now! Please try again tomorrow!";
      setLimitError(errorMsg);
      setShowLikeLimitModal(true);
      return;
    }

    // Client-side quick check for out of swipes
    if (swipeStats.swipesRemaining <= 0) {
      const errorMsg = "You're out of swipes now! Please try again tomorrow!";
      setLimitError(errorMsg);
      return;
    }

    try {
      const res = await api.post('/connections/swipe', { targetId, action });
      if (res.data?.stats) {
        setSwipeStats(res.data.stats);
      }
      if (res.data?.connectionRequest) {
        setSentRequests(prev => [...prev, res.data.connectionRequest]);
      }
      if (action === 'like') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#ec4899', '#8b5cf6', '#6366f1']
        });
      }
      if (viewingProfile?._id === targetId) {
        setViewingProfile(null);
      }
      setNearbyPeople(prev => prev.filter(p => p._id !== targetId));
    } catch (err: any) {
      const msg = err.response?.data?.message || `Failed to ${action} profile`;
      setLimitError(msg);
      if (msg.toLowerCase().includes('out of likes') || msg.toLowerCase().includes('like limit')) {
        setShowLikeLimitModal(true);
      }
    }
  };

  const filteredPeople = nearbyPeople.filter(person => {
    let matchesInterest = true;
    if (selectedInterest !== 'All') {
      const combinedTags = [...(person.interests || []), ...(person.lookingFor || [])].map(t => t.toLowerCase());
      matchesInterest = combinedTags.includes(selectedInterest.toLowerCase());
    }
    
    let matchesGender = true;
    if (selectedGender !== 'All') {
      matchesGender = person.gender?.toLowerCase() === selectedGender.toLowerCase();
    }
    
    return matchesInterest && matchesGender;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Discover People
          </h1>
          {activeTab === 'discover' && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
              {filteredPeople.length} nearby
            </span>
          )}
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2">
          {swipeStats.likesRemaining <= 0 && (
            <>
              <button 
                type="button"
                onClick={() => setShowLikeLimitModal(true)}
                className="bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
              >
                <HeartCrack className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Out of Likes</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenGetLikes('restaurants')}
                className="bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-pink-900/30 transition cursor-pointer animate-pulse"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Get Likes</span>
              </button>
            </>
          )}

          {activeTab === 'discover' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterModal(true)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Segmented Tab Navigation & Status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-950/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Discover</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'discover' ? 'bg-white/20 text-white font-extrabold' : 'bg-zinc-800 text-zinc-400'}`}>
              {filteredPeople.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-950/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sent Requests</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'sent' ? 'bg-white/20 text-white font-extrabold' : 'bg-zinc-800 text-zinc-400'}`}>
              {sentRequests.length}
            </span>
          </button>
        </div>

        {/* Daily Likes Status Badge */}
        {activeTab === 'discover' && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 px-3.5 py-1.5 rounded-full">
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/20" />
            <span>
              Daily Likes: <strong className="text-white">{swipeStats.likesRemaining}</strong> / {swipeStats.maxDailyLikes}
            </span>
          </div>
        )}
      </div>

      {limitError && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/15 via-rose-500/10 to-red-500/5 border border-red-500/30 text-red-300 flex items-center justify-between gap-4 shadow-lg shadow-red-950/20 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <HeartCrack className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <span>You're out of likes now!</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-medium">Daily Limit Reached</span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">Please try again tomorrow or visit a partner restaurant for extra likes!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => handleOpenGetLikes('restaurants')} 
              className="text-xs bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-pink-900/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Get Likes
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLikeLimitModal(true)} 
              className="text-xs border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-200 rounded-xl"
            >
              Details
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLimitError(null)} className="text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl px-3">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeTab === 'discover' && activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap -mt-2 animate-in fade-in duration-200">
          <span className="text-xs text-zinc-500 font-medium">Filtered by:</span>
          {selectedGender !== 'All' && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full">
              Gender: {selectedGender}
              <button 
                onClick={() => setSelectedGender('All')} 
                className="hover:text-white p-0.5 cursor-pointer"
                title="Remove gender filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {selectedInterest !== 'All' && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full">
              Interest: {selectedInterest}
              <button 
                onClick={() => setSelectedInterest('All')} 
                className="hover:text-white p-0.5 cursor-pointer"
                title="Remove interest filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSelectedGender('All');
              setSelectedInterest('All');
            }}
            className="text-xs text-zinc-400 hover:text-indigo-400 underline ml-1 cursor-pointer font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div>
        {activeTab === 'discover' ? (
          filteredPeople.length > 0 ? (
            <div className="space-y-6">
              {(() => {
                const person = filteredPeople[currentPage] || filteredPeople[0];
                if (!person) return null;

                const sentReq = sentRequests.find(r => r.recipient?._id === person._id || r.recipient === person._id);
                const isRequested = !!sentReq;
                const cosmetics = getCosmetics(person._id);
                const stats = person.stats || {
                  level: 1, repScore: 5.0, eventsAttended: 0, meetupsCompleted: 0, reviewsWritten: 0, isVerified: false
                };

                return (
                  <div className="max-w-md mx-auto">
                    <div className="relative rounded-[32px] bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950/95 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden group transition-all duration-300 hover:border-zinc-700/80">
                      {/* Ambient Glowing Aura */}
                      <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-44 bg-gradient-to-b from-indigo-500/25 via-pink-500/15 to-transparent blur-3xl" />

                      {/* Card Top Header: Activity & Verification */}
                      <div className="relative pt-6 px-6 sm:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-950/70 border border-white/5 backdrop-blur-md shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          <span className={cosmetics.activity.color}>{cosmetics.activity.label}</span>
                        </div>

                        {stats.isVerified && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-300">
                            <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span>Verified</span>
                          </div>
                        )}
                      </div>

                      {/* Card Body: Avatar, Name, Location */}
                      <div className="relative px-6 sm:px-8 pt-2 pb-6 flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="relative mb-3.5 group-hover:scale-105 transition-transform duration-500">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-pink-500 p-1 shadow-2xl shadow-indigo-950/60">
                            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-white text-3xl sm:text-4xl font-black tracking-tight select-none">
                              {person.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>

                        {/* Name & Demographics */}
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                          {person.name}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{person.city || 'Guwahati'}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-300">Approx 2km away</span>
                        </div>

                        {/* Connection Reason Banner */}
                        <div className="w-full mt-4 p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-center text-xs text-indigo-200 flex items-center justify-center gap-2 shadow-inner">
                          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                          <span className="font-medium">{cosmetics.reason}</span>
                        </div>

                        {/* Shared Interests Chips */}
                        {((person.lookingFor && person.lookingFor.length > 0) || (person.interests && person.interests.length > 0)) && (
                          <div className="w-full mt-4 text-left">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 text-center">
                              Shared Interests
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                              {Array.from(new Set([...(person.interests || []), ...(person.lookingFor || [])])).slice(0, 5).map((tag: string) => {
                                const Icon = getInterestIcon(tag);
                                return (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900/90 border border-zinc-700/60 text-zinc-200 shadow-sm"
                                  >
                                    <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span>{tag}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Community Highlights */}
                        <div className="w-full mt-4 pt-3.5 border-t border-zinc-800/60">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded-xl text-xs font-bold">
                              <Award size={13} className="text-amber-400" />
                              <span>Lvl {stats.level}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-2.5 py-1 rounded-xl text-xs font-bold">
                              <Star size={13} className="text-yellow-400 fill-yellow-400/40" />
                              <span>{stats.repScore} Rep</span>
                            </div>
                            {stats.eventsAttended > 0 && (
                              <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-xl text-xs font-medium">
                                <Calendar size={13} className="text-indigo-400" />
                                <span>{stats.eventsAttended} Events</span>
                              </div>
                            )}
                            {stats.meetupsCompleted > 0 && (
                              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-xl text-xs font-medium">
                                <Users size={13} className="text-emerald-400" />
                                <span>{stats.meetupsCompleted} Meetups</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tactile Action Dock */}
                      <div className="relative px-6 sm:px-8 py-5 bg-zinc-950/70 border-t border-white/5 flex items-center justify-center gap-4 sm:gap-6">
                        {!isRequested ? (
                          <>
                            {/* Pass Button */}
                            <button
                              type="button"
                              onClick={() => handleSwipeAction(person._id, 'dislike')}
                              className="w-14 h-14 rounded-full border border-zinc-800 bg-zinc-900/90 hover:bg-rose-500/15 hover:border-rose-500/50 text-zinc-400 hover:text-rose-400 transition-all duration-200 flex flex-col items-center justify-center shadow-lg active:scale-90 group cursor-pointer"
                              title="Pass profile"
                              aria-label="Pass"
                            >
                              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] font-semibold tracking-wider text-zinc-500 group-hover:text-rose-400 uppercase mt-0.5">Pass</span>
                            </button>

                            {/* View Profile Button (Center pill) */}
                            <button
                              type="button"
                              onClick={() => setViewingProfile(person)}
                              className="h-12 px-5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-indigo-500/50 text-zinc-200 hover:text-white font-semibold text-xs flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-md cursor-pointer"
                              title="View profile details"
                            >
                              <UserCircle className="w-4 h-4 text-indigo-400" />
                              <span>View Profile</span>
                            </button>

                            {/* Like Button */}
                            <button
                              type="button"
                              onClick={() => handleSwipeAction(person._id, 'like')}
                              className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-600 via-rose-500 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-xl shadow-pink-900/40 hover:shadow-pink-600/50 transition-all duration-200 flex flex-col items-center justify-center active:scale-90 group cursor-pointer"
                              title="Like and send connection request"
                              aria-label="Like"
                            >
                              <Heart className="w-5 h-5 fill-white/30 group-hover:fill-white group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] font-bold tracking-wider text-white/90 uppercase mt-0.5">Like</span>
                            </button>
                          </>
                        ) : (
                          <div className="w-full flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 bg-zinc-900/80 px-4 py-2.5 rounded-full border border-zinc-800">
                              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                              <span>Request Sent</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setViewingProfile(person)}
                              className="px-4 py-2.5 rounded-full bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700 transition cursor-pointer"
                            >
                              View Profile
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pagination / Deck Navigation */}
                    {filteredPeople.length > 1 && (
                      <div className="flex items-center justify-between gap-3 pt-5 px-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                          className="border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                          <span>Previous</span>
                        </Button>

                        <div className="text-xs font-medium text-zinc-400 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/80">
                          Profile <strong className="text-white">{currentPage + 1}</strong> of <strong className="text-white">{filteredPeople.length}</strong>
                        </div>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(filteredPeople.length - 1, p + 1))}
                          disabled={currentPage >= filteredPeople.length - 1}
                          className="border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Next</span>
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-20 flex flex-col items-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[28px] max-w-md mx-auto p-8">
              <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-5">
                <Users size={36} className="text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Explorers Found Nearby</h3>
              <p className="text-xs text-zinc-500 max-w-xs mb-6">
                Try resetting your filters or checking back soon as more people join the local community.
              </p>
              {activeFilterCount > 0 && (
                <Button
                  onClick={() => {
                    setSelectedGender('All');
                    setSelectedInterest('All');
                  }}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          )
        ) : (
          /* Sent Requests Tab */
          sentRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sentRequests.map((req) => {
                const person = req.recipient;
                if (!person || !person._id) return null;
                const stats = person.stats || { level: 1, repScore: 5.0 };
                return (
                  <div 
                    key={req._id || person._id} 
                    className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 flex items-center justify-between gap-4 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-0.5 shrink-0">
                        <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-white text-base font-bold">
                          {person.name?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-white text-sm truncate">{person.name}</h3>
                          {stats.isVerified && <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />}
                        </div>
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin size={12} className="text-indigo-400 shrink-0" /> {person.city || 'Guwahati'}
                        </p>
                        <div className="mt-2">
                          {req.status === 'accepted' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 size={12} /> Connected
                            </span>
                          ) : req.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                              <X size={12} /> Passed
                            </span>
                          ) : req.isViewed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                              <Clock size={12} /> Viewed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 bg-zinc-800/60 px-2.5 py-0.5 rounded-full border border-zinc-700/60">
                              <Clock size={12} /> Sent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {req.status === 'accepted' && (
                        <Link
                          href={`/dashboard/messages?recipientId=${person._id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold hover:from-indigo-500 hover:to-violet-500 transition text-center shadow-md shadow-indigo-950/40"
                        >
                          Chat
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingProfile(person)}
                        className="text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl px-3 py-1.5"
                      >
                        Profile
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 flex flex-col items-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[28px] max-w-md mx-auto p-8">
              <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-5">
                <Users size={36} className="text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Sent Requests Yet</h3>
              <p className="text-xs text-zinc-500 max-w-xs">
                When you like someone in the Discover tab, your connection requests will show up here.
              </p>
            </div>
          )
        )}
      </div>

      {/* Out of Likes Alert Modal */}
      {showLikeLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <button 
              type="button"
              onClick={() => setShowLikeLimitModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="text-center pt-2 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-4 shadow-inner">
                <HeartCrack className="w-8 h-8 text-rose-400 animate-pulse" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">You're Out of Likes Now!</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                You've reached your daily like limit. Please try again tomorrow when your daily likes reset!
              </p>

              <div className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center text-xs text-zinc-400 mb-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock size={13} className="text-rose-400" /> Daily Likes Status
                  </span>
                  <span className="font-bold text-rose-400">
                    Limit Reached
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full w-full" />
                </div>
                <div className="flex justify-between items-center mt-3 text-[11px] text-zinc-500">
                  <span>Daily quota exhausted</span>
                  <span className="text-zinc-400 font-medium">Refreshes at midnight</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  onClick={() => {
                    setShowLikeLimitModal(false);
                    handleOpenGetLikes('restaurants');
                  }}
                  className="w-full py-5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold transition shadow-lg shadow-pink-900/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Get Likes at Restaurants
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLikeLimitModal(false);
                    setActiveTab('sent');
                  }}
                  className="w-full py-5 rounded-xl border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-200"
                >
                  Sent Requests
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Get Extra Likes Modal */}
      {showGetLikesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 max-w-xl w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <button 
              type="button"
              onClick={() => setShowGetLikesModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Get Extra Daily Connection Likes
                </h3>
                <p className="text-xs text-zinc-400">
                  Dine at city restaurants to earn extra likes every day for multiple days!
                </p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-800 mb-5 gap-6 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setGetLikesTab('restaurants')}
                className={`pb-2.5 transition border-b-2 flex items-center gap-2 ${
                  getLikesTab === 'restaurants'
                    ? 'border-pink-500 text-pink-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <UtensilsCrossed size={16} />
                City Partner Restaurants
              </button>
              <button
                type="button"
                onClick={() => setGetLikesTab('redeem')}
                className={`pb-2.5 transition border-b-2 flex items-center gap-2 ${
                  getLikesTab === 'redeem'
                    ? 'border-pink-500 text-pink-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Ticket size={16} />
                Redeem Voucher Code
              </button>
            </div>

            {/* Tab 1: Restaurants List */}
            {getLikesTab === 'restaurants' && (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-3.5 text-xs text-pink-300 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">How it works:</strong>
                    Visit any partner restaurant listed below. Upon paying your bill, provide your registered StageLink phone number to the manager. You will receive a code that increases your daily like quota every single day for the full validity duration!
                  </div>
                </div>

                {loadingVenues ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-7 h-7 animate-spin text-pink-500" />
                  </div>
                ) : cityVenues.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-sm bg-zinc-950/50 rounded-2xl border border-dashed border-zinc-800">
                    No partner restaurants found yet. Check back soon!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cityVenues.map((venue) => (
                      <div
                        key={venue._id}
                        className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700 transition"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">{venue.restaurantName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                              Partner
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 flex items-center gap-1">
                            <MapPin size={12} className="text-zinc-500" /> {venue.address}
                          </p>
                          {venue.cuisine && venue.cuisine.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {venue.cuisine.slice(0, 3).map((c: string) => (
                                <span key={c} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setGetLikesTab('redeem')}
                          className="rounded-xl bg-pink-600/20 border border-pink-500/30 hover:bg-pink-600/30 text-pink-300 text-xs font-semibold shrink-0"
                        >
                          Have a bill? Redeem
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Redeem Code */}
            {getLikesTab === 'redeem' && (
              <div className="space-y-5 py-2">
                <div className="text-center space-y-1">
                  <h4 className="text-lg font-bold text-white">Enter Your Restaurant Bill Code</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Enter the code given by the restaurant manager after verifying your registered StageLink phone number.
                  </p>
                </div>

                {redeemMessage && (
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in ${
                    redeemMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}>
                    {redeemMessage.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium">{redeemMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleRedeemCode} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. STG-3210-0903-1250-ABC"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="w-full text-center tracking-wider font-mono font-bold text-lg py-3.5 px-4 rounded-2xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:border-pink-500 focus:outline-none uppercase"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={redeeming || !voucherCode.trim()}
                    className="w-full py-6 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-pink-900/20 transition-all flex items-center justify-center gap-2"
                  >
                    {redeeming ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Validating Voucher...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Redeem Likes
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-[11px] text-zinc-500 text-center">
                  Vouchers are tied to your registered account phone and can be redeemed once.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Filter Explorers</h3>
                  <p className="text-xs text-zinc-400">Discover people matching your preferences</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition cursor-pointer"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Content */}
            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              {/* Gender Filter */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3">
                  Gender
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['All', 'Male', 'Female', 'Other'].map((gender) => {
                    const isSelected = selectedGender === gender;
                    return (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setSelectedGender(gender)}
                        className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/30'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {gender}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interests Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Interest Category
                  </label>
                  {selectedInterest !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setSelectedInterest('All')}
                      className="text-xs text-indigo-400 hover:underline cursor-pointer"
                    >
                      Reset to All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {INTEREST_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedInterest === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedInterest(category.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/30'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        <Icon size={16} className={isSelected ? 'text-white' : 'text-zinc-400 shrink-0'} />
                        <span className="text-xs font-medium truncate">{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4 mt-5 shrink-0 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedGender('All');
                  setSelectedInterest('All');
                }}
                disabled={activeFilterCount === 0}
                className="text-xs text-zinc-400 hover:text-white disabled:opacity-30"
              >
                Reset All
              </Button>

              <Button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-950/40 cursor-pointer"
              >
                Apply Filters ({filteredPeople.length} results)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Detail Modal */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-white/10 max-w-md w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Ambient background glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-36 bg-gradient-to-b from-indigo-500/25 via-pink-500/15 to-transparent blur-3xl pointer-events-none" />

            {/* Close button */}
            <button 
              type="button"
              onClick={() => setViewingProfile(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition z-10 cursor-pointer"
              aria-label="Close profile"
            >
              <X size={18} />
            </button>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto pr-1 space-y-6 pt-2">
              {/* Hero Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-pink-500 p-1 shadow-xl mb-3">
                  <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-white text-3xl font-black">
                    {viewingProfile.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  {viewingProfile.name}
                  {viewingProfile.stats?.isVerified && (
                    <BadgeCheck className="w-5 h-5 text-blue-400" />
                  )}
                </h3>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin size={13} className="text-indigo-400" /> {viewingProfile.city || 'Guwahati'} • Approx 2km away
                </p>
                {viewingProfile.gender && (
                  <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800/60 border border-zinc-700/60 px-2.5 py-0.5 rounded-full mt-2 capitalize">
                    {viewingProfile.gender}
                  </span>
                )}
              </div>

              {/* Connection Spark */}
              {(() => {
                const cosmetics = getCosmetics(viewingProfile._id || '');
                return (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-center text-xs text-indigo-200 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                    <span>{cosmetics.reason}</span>
                  </div>
                );
              })()}

              {/* Interests & Looking For */}
              {((viewingProfile.interests && viewingProfile.interests.length > 0) || (viewingProfile.lookingFor && viewingProfile.lookingFor.length > 0)) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Interests & Vibes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set([...(viewingProfile.interests || []), ...(viewingProfile.lookingFor || [])])).map((tag: string) => {
                      const Icon = getInterestIcon(tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-700/80 text-zinc-200"
                        >
                          <Icon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{tag}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Community Score Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Community Profile & Trust
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-bold">Community Level</div>
                      <div className="text-sm font-extrabold text-white">Lvl {viewingProfile.stats?.level || 1} Explorer</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400/30 shrink-0" />
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-bold">Reputation</div>
                      <div className="text-sm font-extrabold text-white">{viewingProfile.stats?.repScore || 5.0} / 5.0</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-bold">Events</div>
                      <div className="text-sm font-extrabold text-white">{viewingProfile.stats?.eventsAttended || 0} Attended</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-bold">Meetups</div>
                      <div className="text-sm font-extrabold text-white">{viewingProfile.stats?.meetupsCompleted || 0} Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-zinc-800/80 mt-4 flex items-center gap-3">
              {sentRequests.some(r => r.recipient?._id === viewingProfile._id || r.recipient === viewingProfile._id) ? (
                <div className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-300">
                  <CheckCircle2 size={16} className="text-indigo-400" />
                  <span>Connection Request Sent</span>
                </div>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleSwipeAction(viewingProfile._id, 'dislike');
                      setViewingProfile(null);
                    }}
                    className="flex-1 py-5 rounded-2xl border-zinc-700 bg-zinc-900/60 hover:bg-rose-500/10 hover:border-rose-500/40 text-zinc-300 hover:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X size={16} />
                    <span>Pass</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      handleSwipeAction(viewingProfile._id, 'like');
                      setViewingProfile(null);
                    }}
                    className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-900/30 cursor-pointer"
                  >
                    <Heart size={16} className="fill-white/30" />
                    <span>Like & Connect</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
