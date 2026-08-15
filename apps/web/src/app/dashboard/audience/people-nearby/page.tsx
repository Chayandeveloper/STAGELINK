'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, CheckCircle2, MapPin, UserPlus, Users, 
  MessageSquare, Award, Star, Calendar, Mic2, 
  Coffee, Utensils, Smile, Laptop, Gamepad2, 
  Camera, Palette, BookOpen, Dumbbell, Plane,
  BadgeCheck
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';

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
    { label: "🟢 Exploring Today", color: "text-emerald-400" },
    { label: "🟡 Weekend Explorer", color: "text-amber-400" },
    { label: "🟣 Active Evening", color: "text-purple-400" },
    { label: "🔵 Local Guide", color: "text-blue-400" }
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedInterest, selectedGender, activeTab, isMobile]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nearbyRes, sentRes] = await Promise.all([
          api.get('/engagement/nearby'),
          api.get('/connections/sent')
        ]);
        setNearbyPeople(nearbyRes.data.people || []);
        setSentRequests(sentRes.data || []);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sendConnectionRequest = async (receiverId: string) => {
    try {
      const res = await api.post('/connections/request', { recipientId: receiverId });
      setSentRequests([...sentRequests, res.data]);
    } catch (err) {
      console.error('Failed to send request', err);
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Discover Your Community</h1>
        <p className="text-zinc-400">
          Meet people who share your interests, attend similar experiences, and explore your city together.{' '}
          <Link href="/dashboard/audience/profile" className="text-indigo-400 hover:underline">
            Update visibility settings.
          </Link>
        </p>
      </div>

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
                    <Button 
                      variant="default"
                      onClick={() => sendConnectionRequest(person._id)}
                      className="w-full rounded-xl py-6 text-sm font-semibold transition-all duration-300 bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-900/30 text-white"
                    >
                      <UserPlus size={18} className="mr-2"/> Invite
                    </Button>
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
    </div>
  );
}
