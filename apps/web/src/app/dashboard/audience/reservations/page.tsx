'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertTriangle, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import Link from 'next/link';
import { BookTableModal } from '@/components/reservations/BookTableModal';

export default function AudienceReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Re-upload state
  const [reuploadingId, setReuploadingId] = useState<string | null>(null);
  const [newScreenshot, setNewScreenshot] = useState('');
  const [newTxnId, setNewTxnId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Book Table Modal state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations/customer');
      setReservations(res.data);
    } catch (error) {
      console.error('Failed to fetch reservations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReupload = async () => {
    if (!reuploadingId || !newScreenshot) return;
    setSubmitting(true);
    try {
      await api.put(`/reservations/${reuploadingId}/screenshot`, {
        paymentScreenshot: newScreenshot,
        transactionId: newTxnId
      });
      setReuploadingId(null);
      setNewScreenshot('');
      setNewTxnId('');
      fetchReservations();
    } catch (error) {
      console.error('Failed to re-upload screenshot', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading your reservations...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Reservations</h1>
          <p className="text-zinc-400 mt-1">Manage your table bookings for upcoming events and restaurants.</p>
        </div>
        <Button 
          onClick={() => setIsBookModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
        >
          Book a Table
        </Button>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl">
          <Calendar className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No reservations found</h3>
          <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
            You haven't booked any tables yet. Browse events to find a gig and reserve your spot!
          </p>
          <Link href="/events">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              Discover Events
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reservations.map((res) => (
            <div key={res._id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {res.event?.title || 'Direct Booking'}
                    </h3>
                    <div className="flex items-center text-zinc-400 mt-1">
                      <MapPin size={14} className="mr-1" />
                      <span className="text-sm">{res.restaurant?.restaurantName || 'Unknown Venue'}</span>
                    </div>
                  </div>
                  
                  {res.reservationStatus === 'pending' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Clock size={12} /> Pending
                    </span>
                  ) : res.reservationStatus === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                      <CheckCircle size={12} /> Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                      <XCircle size={12} /> {res.reservationStatus}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 my-6 bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 text-sm">
                  <div>
                    <p className="text-zinc-500 mb-1">Date & Time</p>
                    <p className="text-white font-medium">
                      {new Date(res.reservationDate).toLocaleDateString()}, {res.reservationTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-1">Table Details</p>
                    <p className="text-white font-medium">
                      Table {res.table?.tableNumber} ({res.guestCount} Guests)
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-1">Advance Paid</p>
                    <p className="text-white font-medium">₹{res.advanceAmount}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-1">Transaction ID</p>
                    <p className="text-white font-medium truncate">{res.transactionId || 'N/A'}</p>
                  </div>
                </div>
                
                {res.reservationStatus === 'rejected' && res.verificationNote && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-200 text-sm flex items-start gap-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
                    <div>
                      <p className="font-semibold text-red-400 mb-1">Reservation Rejected</p>
                      <p>{res.verificationNote}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-3">
                {res.event && (
                  <Link href={`/events/${res.event?._id}`} className="flex-1">
                    <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                      View Event
                    </Button>
                  </Link>
                )}
                
                {res.reservationStatus === 'rejected' && (
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
                    onClick={() => setReuploadingId(res._id)}
                  >
                    <Upload size={16} /> Re-upload Proof
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Re-upload Modal */}
      {reuploadingId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Re-upload Payment Proof</h3>
            <p className="text-zinc-400 text-sm mb-6">Your previous payment proof was rejected. Please upload a clear screenshot of your UPI transaction.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Transaction ID (Optional)</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  value={newTxnId}
                  onChange={(e) => setNewTxnId(e.target.value)}
                  placeholder="e.g. 1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Upload Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewScreenshot(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
                <div className="text-center text-zinc-500 my-2 text-sm">- OR -</div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Paste URL</label>
                <input
                  type="url"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  value={newScreenshot}
                  onChange={(e) => setNewScreenshot(e.target.value)}
                  placeholder="https://example.com/screenshot.png"
                />
                {newScreenshot && (
                  <div className="mt-3 relative h-32 w-32 rounded-lg overflow-hidden border border-zinc-700 mx-auto">
                    <img src={newScreenshot} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setReuploadingId(null)} className="border-zinc-700 text-zinc-300">
                Cancel
              </Button>
              <Button onClick={handleReupload} disabled={!newScreenshot || submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                {submitting ? 'Submitting...' : 'Submit Proof'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Book Table Modal */}
      {isBookModalOpen && (
        <BookTableModal 
          onClose={() => setIsBookModalOpen(false)} 
          onSuccess={() => {
            setIsBookModalOpen(false);
            fetchReservations();
          }} 
        />
      )}
    </div>
  );
}
