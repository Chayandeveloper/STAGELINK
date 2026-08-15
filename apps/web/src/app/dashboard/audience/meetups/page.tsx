'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, MapPin, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { MeetupVerification } from '@/components/meetups/MeetupVerification';

export default function MeetupsPage() {
  const [meetups, setMeetups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchMeetups();
  }, []);

  const fetchMeetups = async () => {
    try {
      const res = await api.get('/meetups');
      setMeetups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmMeetup = async (meetupId: string, didMeet: boolean) => {
    try {
      await api.post(`/meetups/${meetupId}/confirm`, { didMeet });
      fetchMeetups();
      if (didMeet) {
        alert("Awesome! You've both confirmed the meetup and earned an XP boost!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">My Meetups</h1>
        <p className="text-zinc-400 mt-1">Keep track of your scheduled meetups with other fans.</p>
      </div>

      {meetups.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-400">You don't have any meetups scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetups.map((meetup) => {
            const otherUser = meetup.participants.find((p: any) => p._id !== user?._id);
            const myConfirmation = meetup.confirmations.find((c: any) => c.user === user?._id);
            const isConfirmed = myConfirmation?.confirmedMet !== undefined && myConfirmation?.confirmedMet !== null;

            return (
              <div key={meetup._id} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {otherUser?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{otherUser?.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          meetup.status === 'scheduled' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                          meetup.status === 'completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                          'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {meetup.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                    <div className="flex items-center text-sm">
                      <Calendar className="text-purple-400 mr-3 w-4 h-4" />
                      <span className="text-zinc-300">
                        {new Date(meetup.dateTime).toLocaleDateString()} at {new Date(meetup.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="text-indigo-400 mr-3 w-4 h-4" />
                      <span className="text-zinc-300">
                        {meetup.venueId?.restaurantName || 'StageLink Cafe (Demo)'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 pl-7">
                      Purpose: {meetup.purpose}
                    </div>
                  </div>
                </div>

                {meetup.status === 'scheduled' && (
                  <div className="pt-4 border-t border-zinc-800/50">
                    <MeetupVerification meetupId={meetup._id} onVerified={fetchMeetups} />
                  </div>
                )}

                {meetup.status === 'verified' && (
                  <div className="pt-4 border-t border-zinc-800/50">
                    {isConfirmed ? (
                      <p className="text-center text-sm text-zinc-500">Waiting for {otherUser?.name} to confirm...</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-center text-xs text-zinc-400 mb-2">Did you meet {otherUser?.name}?</p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => confirmMeetup(meetup._id, true)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
                          >
                            <Check className="mr-2 h-4 w-4" /> Yes, we met!
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => confirmMeetup(meetup._id, false)}
                            className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <X className="mr-2 h-4 w-4" /> No show
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
