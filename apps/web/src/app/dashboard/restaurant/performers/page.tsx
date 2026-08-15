'use client';

import { useState, useEffect } from 'react';
import { UserCircle, MapPin, Send, Star, Music, Ticket, Calendar, Users, X, Phone, Camera, PlayCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function BrowsePerformersPage() {
  const [requesting, setRequesting] = useState<string | null>(null);
  const [localPerformers, setLocalPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile View Modal
  const [profilePerformer, setProfilePerformer] = useState<any>(null);

  // Proposal Modal State
  const [selectedPerformer, setSelectedPerformer] = useState<any>(null);
  const [pitchData, setPitchData] = useState({
    proposedTitle: '',
    proposedDate: '',
    proposedTime: '',
    coverNote: ''
  });

  useEffect(() => {
    const fetchPerformers = async () => {
      try {
        const response = await api.get('/discovery/performers');
        setLocalPerformers(response.data.performers || []);
      } catch (error) {
        console.error('Failed to fetch performers', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformers();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerformer) return;

    setRequesting(selectedPerformer._id);
    try {
      await api.post('/applications/direct', {
        targetId: selectedPerformer._id,
        initiatorRole: 'restaurant',
        ...pitchData
      });
      alert('Proposal Sent Successfully! Check Applications to track its status.');
      setSelectedPerformer(null);
      setPitchData({ proposedTitle: '', proposedDate: '', proposedTime: '', coverNote: '' });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send proposal');
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Local Performers</h1>
          <p className="text-zinc-400 mt-1">Discover and send proposals to talent in your city.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading local performers...</div>
      ) : localPerformers.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl">
          <p>No performers found in your city yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localPerformers.map((performer) => (
            <div key={performer._id} className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col">
              {/* Cover header with avatar */}
              <div
                className="h-28 w-full bg-gradient-to-br from-rose-950 via-fuchsia-900 to-violet-900 shrink-0 relative cursor-pointer"
                onClick={() => setProfilePerformer(performer)}
              >
                {/* Circular avatar anchored at bottom-center */}
                <div
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-zinc-800 bg-cover bg-center border-4 border-zinc-900 shadow-xl"
                  style={{ backgroundImage: `url(${performer.profilePicture || 'https://images.unsplash.com/photo-1516280440502-613fb25db5cd?w=200&q=80'})` }}
                />
              </div>

              <div className="px-5 pt-12 pb-5 relative flex flex-col flex-1 text-center">
                <div className="absolute top-3 right-4 bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Negotiable
                </div>

                <div className="mb-1">
                  <button
                    onClick={() => setProfilePerformer(performer)}
                    className="text-lg font-bold text-white hover:text-indigo-300 transition-colors"
                  >
                    {performer.displayName || performer.user?.name}
                  </button>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 text-xs font-bold">4.9</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 mb-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1"><Music size={12} className="text-zinc-500" /> {performer.category || 'Live Music'}</span>
                  <span className="text-zinc-700">•</span>
                  <span className="flex items-center gap-1"><MapPin size={12} className="text-zinc-500" /> {performer.user?.city || 'Your City'}</span>
                </div>

                {/* Performer Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 text-xs">
                  <div className="flex flex-col items-center">
                    <span className="text-zinc-500 flex items-center mb-1"><Calendar size={12} className="mr-1" /> Performances</span>
                    <span className="text-white font-bold text-base">{performer.totalGigs || 0}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-zinc-500 flex items-center mb-1"><Ticket size={12} className="mr-1" /> Tickets Sold</span>
                    <span className="text-white font-bold text-base">{performer.ticketsSold || 0}</span>
                  </div>
                  {(performer.lastPerformed || performer.socialLinks?.instagram) && (
                    <div className="col-span-2 pt-2 mt-2 border-t border-zinc-800/50 flex flex-col items-center gap-1">
                      {performer.lastPerformed && (
                        <span className="text-zinc-400 truncate flex items-center text-xs"><Users size={12} className="mr-1 shrink-0" /> Last seen at {performer.lastPerformed}</span>
                      )}
                      {performer.socialLinks?.instagram && (
                        <span className="text-zinc-400 truncate text-xs">IG: {performer.socialLinks.instagram}</span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-zinc-400 text-sm mb-5 flex-1 line-clamp-2">
                  {performer.bio || 'Ready to rock your venue! Contact me for bookings.'}
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setProfilePerformer(performer)}
                    variant="outline"
                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <UserCircle size={16} className="mr-2" /> View Profile
                  </Button>
                  <Button
                    onClick={() => setSelectedPerformer(performer)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
                  >
                    <Send size={16} className="mr-2" /> Propose
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== PERFORMER PROFILE MODAL ===== */}
      {profilePerformer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg relative shadow-2xl max-h-[90vh] flex flex-col">

            {/* Header gradient banner with avatar */}
            <div className="bg-gradient-to-br from-rose-950 via-fuchsia-900 to-violet-900 rounded-t-3xl px-6 pt-5 pb-6 relative shrink-0" style={{ minHeight: '120px' }}>
              <button
                onClick={() => setProfilePerformer(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all z-10"
              >
                <X size={20} />
              </button>
              {/* Avatar anchored at bottom-left */}
              <div
                className="absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-zinc-800 bg-cover bg-center border-4 border-zinc-950 shadow-2xl"
                style={{ backgroundImage: `url(${profilePerformer.profilePicture || 'https://images.unsplash.com/photo-1516280440502-613fb25db5cd?w=500&q=80'})` }}
              />
            </div>

            {/* Name row */}
            <div className="px-6 pt-12 pb-2 shrink-0">
              <h2 className="text-xl font-bold text-white tracking-tight">{profilePerformer.displayName || 'Various Artists'}</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-full text-xs border border-indigo-500/20">{profilePerformer.category || 'Live Music'}</span>
                {profilePerformer.genres && profilePerformer.genres.length > 0 && (
                  <span className="text-zinc-400 text-xs">• {profilePerformer.genres.join(', ')}</span>
                )}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">

              {/* Contact & Socials */}
              {(profilePerformer.user?.phone || profilePerformer.socialLinks?.instagram || profilePerformer.socialLinks?.youtube || profilePerformer.socialLinks?.website) && (
                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/60">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-3">Contact & Socials</h4>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {profilePerformer.user?.phone && (
                      <a href={`tel:${profilePerformer.user.phone}`} className="flex items-center gap-2 text-zinc-300 text-sm hover:text-emerald-300 transition-colors">
                        <Phone size={15} className="text-emerald-400 shrink-0" />
                        {profilePerformer.user.phone}
                      </a>
                    )}
                    {profilePerformer.socialLinks?.instagram && (
                      <a href={profilePerformer.socialLinks.instagram.startsWith('http') ? profilePerformer.socialLinks.instagram : `https://instagram.com/${profilePerformer.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-300 text-sm hover:text-pink-400 transition-colors">
                        <Camera size={15} className="text-pink-500 shrink-0" />
                        {profilePerformer.socialLinks.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '') || profilePerformer.socialLinks.instagram}
                      </a>
                    )}
                    {profilePerformer.socialLinks?.youtube && (
                      <a href={profilePerformer.socialLinks.youtube.startsWith('http') ? profilePerformer.socialLinks.youtube : `https://youtube.com/${profilePerformer.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-300 text-sm hover:text-red-400 transition-colors">
                        <PlayCircle size={15} className="text-red-500 shrink-0" />
                        {profilePerformer.socialLinks.youtube.replace(/^https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|user\/|@)?/, '').replace(/\/$/, '') || 'YouTube'}
                      </a>
                    )}
                    {profilePerformer.socialLinks?.website && (
                      <a href={profilePerformer.socialLinks.website.startsWith('http') ? profilePerformer.socialLinks.website : `https://${profilePerformer.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-300 text-sm hover:text-blue-300 transition-colors">
                        <Globe size={15} className="text-blue-400 shrink-0" />
                        {profilePerformer.socialLinks.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 text-center">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-1 mb-1"><Calendar size={12} /> Performances</p>
                  <p className="text-2xl text-white font-bold">{profilePerformer.totalGigs || 0}</p>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 text-center">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-1 mb-1"><Ticket size={12} /> Tickets Sold</p>
                  <p className="text-2xl text-white font-bold">{profilePerformer.ticketsSold || 0}</p>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 text-center">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-1 mb-1"><Users size={12} /> Avg / Show</p>
                  <p className="text-2xl text-white font-bold">
                    {profilePerformer.totalGigs && profilePerformer.ticketsSold
                      ? Math.round(profilePerformer.ticketsSold / profilePerformer.totalGigs)
                      : 0}
                  </p>
                </div>
              </div>

              {/* Last Performed */}
              {profilePerformer.lastPerformed && (
                <div className="flex items-center gap-3 bg-indigo-500/10 text-indigo-300 p-4 rounded-xl border border-indigo-500/20">
                  <Users size={18} className="shrink-0 text-indigo-400" />
                  <p className="text-sm"><span className="font-semibold text-indigo-200">Last performed at:</span> {profilePerformer.lastPerformed}</p>
                </div>
              )}

              {/* Bio */}
              <div>
                <h3 className="text-white font-bold text-base mb-2">About the Artist</h3>
                <div className="text-zinc-400 text-sm leading-relaxed space-y-2">
                  {profilePerformer.bio ? (
                    profilePerformer.bio.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)
                  ) : (
                    <p className="italic text-zinc-500">This performer has not provided a bio yet.</p>
                  )}
                </div>
              </div>

              {/* CTA to draft proposal */}
              <Button
                onClick={() => { setProfilePerformer(null); setSelectedPerformer(profilePerformer); }}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Send size={16} className="mr-2" /> Draft Proposal
              </Button>

            </div>
          </div>
        </div>
      )}

      {/* ===== PROPOSAL MODAL ===== */}
      {selectedPerformer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-2">Proposal to {selectedPerformer.displayName || selectedPerformer.user?.name}</h2>
            <p className="text-sm text-zinc-400 mb-6">Propose a date and time for them to perform at your venue.</p>

            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Event Title</label>
                <input
                  required
                  type="text"
                  value={pitchData.proposedTitle}
                  onChange={(e) => setPitchData({...pitchData, proposedTitle: e.target.value})}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Friday Night Live"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Date</label>
                  <input
                    required
                    type="date"
                    value={pitchData.proposedDate}
                    onChange={(e) => setPitchData({...pitchData, proposedDate: e.target.value})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Time</label>
                  <input
                    required
                    type="time"
                    value={pitchData.proposedTime}
                    onChange={(e) => setPitchData({...pitchData, proposedTime: e.target.value})}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Details & Requirements</label>
                <textarea
                  required
                  value={pitchData.coverNote}
                  onChange={(e) => setPitchData({...pitchData, coverNote: e.target.value})}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-h-[100px]"
                  placeholder="Tell them what kind of set you're looking for..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() => setSelectedPerformer(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={requesting === selectedPerformer._id}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {requesting === selectedPerformer._id ? 'Sending...' : 'Send Proposal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
