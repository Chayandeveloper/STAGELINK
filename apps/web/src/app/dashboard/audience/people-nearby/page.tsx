'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, CheckCircle2, MapPin, UserPlus, Users, 
  MessageSquare, Award, Star, Calendar, Mic2, 
  Coffee, Utensils, Smile, Laptop, Gamepad2, 
  Camera, Palette, BookOpen, Dumbbell, Plane,
  BadgeCheck, Heart, X, Flame, ShieldAlert, HeartCrack, Clock,
  Sparkles, UtensilsCrossed, Ticket, Building2, Check, ExternalLink
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

export default function DiscoverCommunityPage() {
  const [nearbyPeople, setNearbyPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [selectedInterest, setSelectedInterest] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
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
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Discover Your Community</h1>
          <p className="text-zinc-400">
            Meet people who share your interests, attend similar experiences, and explore your city together.{' '}
            <Link href="/dashboard/audience/profile" className="text-indigo-400 hover:underline">
              Update visibility settings.
            </Link>
          </p>
        </div>

        {/* Status Indicator (without raw numbers) */}
        {swipeStats.likesRemaining <= 0 && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button 
              type="button"
              onClick={() => setShowLikeLimitModal(true)}
              className="bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-lg transition-all shrink-0 cursor-pointer"
            >
              <HeartCrack className="w-4 h-4 text-rose-400" />
              <span>Out of Likes</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenGetLikes('restaurants')}
              className="bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-lg shadow-pink-900/30 transition-all shrink-0 cursor-pointer animate-pulse"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Get Likes</span>
            </button>
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

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-6 space-x-8">
        <button
          onClick={() => setActiveTab('discover')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'discover' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'sent' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Sent Requests
        </button>
      </div>

      {/* Filters (Gender) */}
      {activeTab === 'discover' && (
        <div className="flex space-x-2 mb-4">
          {['All', 'Male', 'Female', 'Other'].map(gender => (
            <button
              key={gender}
              onClick={() => setSelectedGender(gender)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                selectedGender === gender
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      )}

      {/* Interest Explorer (Wrapped) */}
      {activeTab === 'discover' && (
      <div className="relative mb-6">
        <div className="flex flex-wrap gap-3">
          {INTEREST_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedInterest === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedInterest(category.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 border ${
                  isSelected 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] scale-105' 
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Community Cards */}
      <div className="space-y-6">
        {(() => {
          const profilesPerPage = isMobile ? 1 : 2;
          const displayList = activeTab === 'discover' 
            ? filteredPeople.slice(currentPage * profilesPerPage, (currentPage + 1) * profilesPerPage) 
            : sentRequests.map(r => ({ ...r.recipient, _sentReqRef: r })).filter(r => r && r._id);
            
          return displayList.length > 0 ? (
            displayList.map((person) => {
              const sentReq = person._sentReqRef || sentRequests.find(r => r.recipient?._id === person._id || r.recipient === person._id);
            const isRequested = !!sentReq;
            const cosmetics = getCosmetics(person._id);
            const stats = person.stats || {
              level: 1, repScore: 5.0, eventsAttended: 0, meetupsCompleted: 0, reviewsWritten: 0, isVerified: false
            };
            
            return (
              <div 
                key={person._id} 
                className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-[24px] p-6 transition-all duration-300 hover:bg-zinc-900/60 hover:border-zinc-700 hover:shadow-2xl hover:shadow-indigo-900/10 group flex flex-col md:flex-row gap-6"
              >
                {/* Left Column: Avatar & Basic Info */}
                <div className="flex flex-col items-center md:items-start md:w-64 shrink-0">
                  <div className="relative mb-4">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-inner ring-4 ring-zinc-950 group-hover:scale-105 transition-transform duration-500">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    {stats.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-1">
                        <BadgeCheck className="text-blue-500 w-7 h-7 fill-blue-500/20" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white text-center md:text-left">{person.name}</h3>
                  <p className="text-sm text-zinc-400 flex items-center mt-1 text-center md:text-left">
                    <MapPin size={14} className="mr-1" /> {person.city} • Approx 2km
                  </p>
                  
                  <div className="mt-3 bg-zinc-950/50 px-3 py-1.5 rounded-full border border-zinc-800/50 flex items-center justify-center w-max mx-auto md:mx-0">
                    <span className={`text-[11px] font-medium tracking-wide ${cosmetics.activity.color}`}>
                      {cosmetics.activity.label}
                    </span>
                  </div>
                </div>

                {/* Middle Column: Details & Stats */}
                <div className="flex-1 flex flex-col justify-center space-y-5">
                  
                  {/* Shared Interests */}
                  {((person.lookingFor && person.lookingFor.length > 0) || (person.interests && person.interests.length > 0)) && (
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Shared Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set([...(person.interests || []), ...(person.lookingFor || [])])).slice(0, 6).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs bg-zinc-800/50 border-zinc-700/50 text-zinc-300 px-3 py-1 rounded-full">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Community Stats */}
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Community Score</h4>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-lg">
                        <Award size={14} />
                        <span className="text-xs font-bold">Lvl {stats.level}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 px-2.5 py-1 rounded-lg">
                        <Star size={14} className="text-yellow-500" />
                        <span className="text-xs font-bold">{stats.repScore}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 px-2.5 py-1 rounded-lg">
                        <Calendar size={14} className="text-indigo-400" />
                        <span className="text-xs font-medium">{stats.eventsAttended} Events</span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 px-2.5 py-1 rounded-lg">
                        <Users size={14} className="text-emerald-400" />
                        <span className="text-xs font-medium">{stats.meetupsCompleted} Meetups</span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 px-2.5 py-1 rounded-lg hidden sm:flex">
                        <MessageSquare size={14} className="text-blue-400" />
                        <span className="text-xs font-medium">{stats.reviewsWritten} Reviews</span>
                      </div>
                    </div>
                  </div>

                  {/* Why You Might Connect */}
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3">
                    <p className="text-sm text-indigo-300 flex items-center">
                      <span className="mr-2">✨</span> {cosmetics.reason}
                    </p>
                  </div>
                  
                </div>

                {/* Right Column: Actions */}
                <div className="flex flex-col gap-3 justify-center md:w-48 shrink-0 border-t md:border-t-0 md:border-l border-zinc-800/50 pt-4 md:pt-0 md:pl-6">
                  {!isRequested ? (
                    <div className="flex flex-col gap-2.5">
                      <Button 
                        variant="default"
                        onClick={() => handleSwipeAction(person._id, 'like')}
                        className="w-full rounded-xl py-5 text-sm font-semibold transition-all duration-300 bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-900/30 text-white flex items-center justify-center gap-2"
                      >
                        <Heart size={18} className="fill-pink-400/30 text-pink-400" /> Like
                      </Button>

                      <Button 
                        variant="outline"
                        onClick={() => handleSwipeAction(person._id, 'dislike')}
                        className="w-full rounded-xl py-5 text-sm font-semibold border-zinc-700 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800 hover:text-white flex items-center justify-center gap-2"
                      >
                        <X size={18} className="text-zinc-400" /> Pass
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center text-xs font-semibold mb-2">
                        {sentReq.status === 'accepted' ? (
                          <span className="text-green-400 flex items-center"><CheckCircle2 size={14} className="mr-1"/> Connected</span>
                        ) : sentReq.status === 'rejected' ? (
                          <span className="text-red-400 flex items-center">Rejected</span>
                        ) : sentReq.isViewed ? (
                          <span className="text-blue-400 flex items-center">Viewed</span>
                        ) : (
                          <span className="text-zinc-400 flex items-center">Sent</span>
                        )}
                      </div>
                      {sentReq.status === 'pending' && (
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden flex">
                          <div className={`h-full ${sentReq.isViewed ? 'w-full bg-blue-500' : 'w-1/2 bg-indigo-500'} transition-all duration-500`}></div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    variant="outline"
                    className="w-full rounded-xl bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-24 flex flex-col items-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[24px]">
            <div className="w-24 h-24 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
              <Users size={40} className="text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {activeTab === 'discover' ? 'No explorers found nearby' : 'No sent requests'}
            </h3>
            <p className="text-zinc-500 max-w-sm">
              {activeTab === 'discover' 
                ? 'Try another interest category or expand your discovery radius to find more community members.'
                : 'When you invite someone to connect, they will appear here.'}
            </p>
          </div>
        );
        })()}
      </div>

      {activeTab === 'discover' && filteredPeople.length > (isMobile ? 1 : 2) && (
        <div className="flex justify-center space-x-4 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredPeople.length / (isMobile ? 1 : 2)) - 1, p + 1))}
            disabled={currentPage >= Math.ceil(filteredPeople.length / (isMobile ? 1 : 2)) - 1}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Next Profiles
          </Button>
        </div>
      )}

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
    </div>
  );
}
