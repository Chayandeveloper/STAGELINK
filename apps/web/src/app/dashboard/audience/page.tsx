'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Star, Ticket, Flame, Loader2, CheckCircle2, Circle, MessageCircle, MapPin, Trophy, UserPlus, Send, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Badge } from '@/components/ui/badge';

export default function AudienceDashboard() {
  const [data, setData] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [nearbyPeople, setNearbyPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestedUsers, setRequestedUsers] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [profileRes, engagementRes, nearbyRes] = await Promise.all([
          api.get('/profile/customer/dashboard'),
          api.get('/engagement/dashboard'),
          api.get('/engagement/nearby')
        ]);
        setData(profileRes.data);
        setEngagement(engagementRes.data);
        setNearbyPeople(nearbyRes.data.people || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const completeMission = async (missionId: string) => {
    try {
      const prevLevel = engagement?.level || 1;
      const res = await api.post(`/engagement/missions/${missionId}/complete`);
      setEngagement(res.data);
      
      if (res.data.level > prevLevel) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#a855f7', '#eab308']
        });
      }
    } catch (err) {
      console.error('Failed to complete mission', err);
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    try {
      await api.post('/connections/request', { recipientId: receiverId });
      setRequestedUsers(new Set(requestedUsers).add(receiverId));
    } catch (err) {
      console.error('Failed to send request', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const XP_PER_LEVEL = 500;
  const currentXP = engagement?.xp || 0;
  const currentLevel = engagement?.level || 1;
  const xpForNextLevel = currentLevel * XP_PER_LEVEL;
  const xpProgress = (currentXP % XP_PER_LEVEL) / XP_PER_LEVEL * 100;

  return (
    <div className="space-y-8">
      {/* Header & Level Progress */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Trophy size={120} className="text-yellow-500" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-zinc-400 mt-1">Ready to discover your next favorite artist?</p>
          </div>
          
          <div className="w-full sm:w-1/3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 shadow-inner">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-bold flex items-center">
                <Trophy size={16} className="text-yellow-500 mr-2" /> Level {currentLevel}
              </span>
              <span className="text-xs text-zinc-400 font-medium">{currentXP} / {xpForNextLevel} XP</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.max(xpProgress, 5)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Trending (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center space-x-3 transition hover:border-zinc-700">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><Ticket size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Reservations</p>
                <h3 className="text-xl font-bold text-white">{data?.upcomingReservations || 0}</h3>
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center space-x-3 transition hover:border-zinc-700">
              <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg"><Star size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Saved</p>
                <h3 className="text-xl font-bold text-white">{data?.savedEvents || 0}</h3>
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center space-x-3 transition hover:border-zinc-700">
              <div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><Calendar size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Attended</p>
                <h3 className="text-xl font-bold text-white">{data?.eventsAttended || 0}</h3>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Flame className="text-orange-500 mr-2" size={20} /> Trending This Weekend
              </h2>
              <Link href="/events"><Button variant="ghost" className="text-indigo-400 text-sm h-8">View All</Button></Link>
            </div>
            {data?.trendingEvents?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.trendingEvents.map((event: any) => (
                  <div key={event._id} className="bg-zinc-800/30 border border-zinc-700/50 p-4 rounded-xl hover:bg-zinc-800/50 transition">
                    <h4 className="text-md font-bold text-white truncate">{event.title}</h4>
                    <p className="text-zinc-400 text-xs mt-1">{new Date(event.date).toLocaleDateString()} at {event.time}</p>
                    <p className="text-indigo-400 text-xs mt-2 truncate">{event.restaurant?.restaurantName || 'TBA'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-center py-8 border border-dashed border-zinc-800 rounded-xl text-sm">
                Explore the events page to find trending events near you.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily Missions & Community */}
        <div className="space-y-6">
          {/* Daily Missions */}
          <div className="bg-gradient-to-b from-indigo-900/20 to-zinc-900/50 border border-indigo-500/20 rounded-2xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              Daily Missions
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/30">Reset in 12h</span>
            </h2>
            <div className="space-y-3">
              {engagement?.dailyMissions?.map((mission: any) => (
                <div key={mission.missionId} className="flex items-start p-3 bg-zinc-950/50 border border-zinc-800/50 rounded-xl transition hover:border-indigo-500/30">
                  <button 
                    onClick={() => !mission.completed && completeMission(mission.missionId)}
                    disabled={mission.completed}
                    className="mt-0.5 shrink-0 transition-transform active:scale-90"
                  >
                    {mission.completed ? (
                      <CheckCircle2 className="text-green-500 h-5 w-5" />
                    ) : (
                      <Circle className="text-zinc-500 hover:text-indigo-400 h-5 w-5 transition-colors" />
                    )}
                  </button>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className={`text-sm font-medium ${mission.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                      {mission.title}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{mission.description}</p>
                  </div>
                  <div className="shrink-0 ml-2">
                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">+{mission.xpReward} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Community */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">People Nearby</h2>
              <Link href="/dashboard/audience/connection-requests">
                <Button variant="ghost" size="sm" className="text-indigo-400 h-6 px-2 text-xs">Manage</Button>
              </Link>
            </div>
            <p className="text-xs text-zinc-400 mb-4">Discover people safely. <Link href="/dashboard/audience/profile" className="text-indigo-400 hover:underline">Update visibility settings.</Link></p>
            
            <div className="space-y-3">
              {nearbyPeople.length > 0 ? (
                nearbyPeople.map((person) => {
                  const isRequested = requestedUsers.has(person._id);
                  return (
                    <div key={person._id} className="flex flex-col bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-inner">
                            {person.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{person.name}</p>
                            <p className="text-[10px] text-zinc-400 flex items-center">
                              <MapPin size={10} className="mr-1" /> {person.city} • Approx 2km
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={isRequested ? "secondary" : "default"}
                          onClick={() => !isRequested && sendConnectionRequest(person._id)}
                          disabled={isRequested}
                          className={`h-8 px-3 rounded-lg text-xs ${isRequested ? 'bg-zinc-800 text-zinc-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                          {isRequested ? <CheckCircle2 size={14} className="mr-1"/> : <UserPlus size={14} className="mr-1"/>}
                          {isRequested ? 'Sent' : 'Connect'}
                        </Button>
                      </div>
                      
                      {person.lookingFor && person.lookingFor.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {person.lookingFor.slice(0,2).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-[9px] bg-zinc-900/50 border-zinc-700 text-zinc-300 px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {person.lookingFor.length > 2 && <span className="text-[9px] text-zinc-500">+{person.lookingFor.length - 2}</span>}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-zinc-500 text-sm">
                  No nearby fans found yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
