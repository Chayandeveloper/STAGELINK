'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Settings, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Event {
  _id: string;
  title: string;
  performer?: { 
    name?: string; 
    displayName?: string; 
    user?: { name: string } 
  };
  date: string;
  status: string;
  bookedSeats: number;
  totalSeats?: number;
  enableReservation?: boolean;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    category: 'Live Music',
    coverImage: '',
    enableReservation: false,
    ticketPrice: 0
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const profileRes = await api.get('/profile/me');
        if (profileRes.data && profileRes.data._id) {
          const res = await api.get(`/events?restaurant=${profileRes.data._id}`);
          setEvents(res.data);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/events', newEvent);
      setShowCreateModal(false);
      setNewEvent({ title: '', description: '', date: '', time: '', category: 'Live Music', coverImage: '', enableReservation: false, ticketPrice: 0 });
      // Refresh events
      const profileRes = await api.get('/profile/me');
      if (profileRes.data && profileRes.data._id) {
        const res = await api.get(`/events?restaurant=${profileRes.data._id}`);
        setEvents(res.data);
      }
    } catch (error) {
      console.error('Failed to create event', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading events...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Manage Events</h1>
          <p className="text-zinc-400 mt-1">Your finalized gigs that are now public events.</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
        >
          <Plus size={18} />
          Create Event
        </Button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
              <th className="p-4 font-medium">Event Name</th>
              <th className="p-4 font-medium">Performer</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Tickets Sold</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  No events found.
                </td>
              </tr>
            )}
            {events.map((ev) => (
              <tr key={ev._id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="p-4">
                  <span className="block font-bold text-white">{ev.title}</span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {ev.status}
                  </span>
                  {ev.enableReservation && (
                    <span className="inline-block ml-2 mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                      Table Booking Active
                    </span>
                  )}
                </td>
                <td className="p-4 text-zinc-300 font-medium">
                  {ev.performer?.displayName || ev.performer?.name || ev.performer?.user?.name || 'TBA'}
                </td>
                <td className="p-4 text-zinc-400 text-sm flex items-center h-full mt-2">
                  <Calendar size={14} className="mr-2" /> 
                  {new Date(ev.date).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <div className="flex items-center text-sm text-zinc-300">
                    <Users size={14} className="mr-2 text-zinc-500" />
                    {ev.bookedSeats} {ev.totalSeats ? `/ ${ev.totalSeats}` : ''}
                  </div>
                  {ev.totalSeats && (
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(ev.bookedSeats / ev.totalSeats) * 100}%` }}></div>
                    </div>
                  )}
                </td>
                <td className="p-4 text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/dashboard/restaurant/events/${ev._id}`)}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 ml-auto"
                  >
                    <Settings size={14} />
                    Manage Tables
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white">Create New Event</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-full p-2 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-zinc-400">Event Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Friday Night Live, Open Mic Night"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    required
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Time <span className="text-red-500">*</span></label>
                  <input 
                    type="time" 
                    required
                    value={newEvent.time}
                    onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Category <span className="text-red-500">*</span></label>
                  <select 
                    value={newEvent.category}
                    onChange={e => setNewEvent({...newEvent, category: e.target.value})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Live Music">Live Music</option>
                    <option value="DJ Night">DJ Night</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Open Mic">Open Mic</option>
                    <option value="Karaoke">Karaoke</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Ticket Price (Optional)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={newEvent.ticketPrice}
                    onChange={e => setNewEvent({...newEvent, ticketPrice: Number(e.target.value)})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="Leave 0 for Free Entry"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-zinc-400">Cover Image URL (Optional)</label>
                  <input 
                    type="url" 
                    value={newEvent.coverImage}
                    onChange={e => setNewEvent({...newEvent, coverImage: e.target.value})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-zinc-400">Description <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    rows={4}
                    value={newEvent.description}
                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none resize-none"
                    placeholder="Tell attendees what to expect..."
                  />
                </div>
                
                <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <div>
                    <h4 className="text-white font-medium">Enable Table Reservations</h4>
                    <p className="text-xs text-zinc-400">Allow customers to book tables for this event.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={newEvent.enableReservation}
                      onChange={e => setNewEvent({...newEvent, enableReservation: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
              </div>
              
              <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 shrink-0 bg-zinc-950 rounded-b-3xl">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowCreateModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                >
                  {submitting ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
