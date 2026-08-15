'use client';

import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AcceptedGigsPage() {
  const upcomingGigs = [
    {
      id: '1',
      title: 'Acoustic Friday Nights',
      venue: 'The Local Bean Cafe',
      location: 'Downtown',
      date: 'This Friday',
      time: '7:00 PM - 10:00 PM',
      payout: '$150',
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Calendar</h1>
          <p className="text-zinc-400 mt-1">Manage your accepted gigs and upcoming performances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingGigs.map((gig) => (
          <div key={gig.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="h-16 w-16 rounded-xl bg-cyan-500/10 flex flex-col items-center justify-center text-cyan-400">
                  <span className="text-xs font-bold uppercase">Oct</span>
                  <span className="text-xl font-bold leading-none">24</span>
                </div>
                <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                  {gig.payout}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{gig.title}</h3>
              
              <div className="space-y-2 text-sm text-zinc-400">
                <span className="flex items-center"><MapPin size={16} className="mr-2 text-zinc-500" /> {gig.venue} ({gig.location})</span>
                <span className="flex items-center"><Clock size={16} className="mr-2 text-zinc-500" /> {gig.time}</span>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800">
              <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300">
                Contact Venue
              </Button>
              <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                View Event
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
