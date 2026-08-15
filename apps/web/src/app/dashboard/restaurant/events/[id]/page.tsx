'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import Image from 'next/image';

interface Reservation {
  _id: string;
  customer: { _id: string; name: string; email: string };
  table: { _id: string; tableNumber: string; capacity: number; tableType: string };
  guestCount: number;
  reservationDate: string;
  reservationTime: string;
  bookingAmount: number;
  advanceAmount: number;
  paymentMethod: string;
  paymentScreenshot?: string;
  transactionId?: string;
  paymentStatus: string;
  reservationStatus: string;
  verificationNote?: string;
}

export default function EventReservationsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState('');

  // Modals state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await api.get('/profile/me');
        if (profileRes.data) {
          setRestaurantId(profileRes.data._id);
          fetchEventDetails();
          fetchReservations(profileRes.data._id);
        }
      } catch (error) {
        console.error('Failed to initialize', error);
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (error) {
      console.error('Failed to fetch event details', error);
    }
  };

  const fetchReservations = async (rId: string) => {
    try {
      const res = await api.get(`/reservations/restaurant/${rId}`);
      // Filter for this event
      const eventReservations = res.data.filter((r: any) => r.event._id === id || r.event === id);
      setReservations(eventReservations);
    } catch (error) {
      console.error('Failed to fetch reservations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reservationId: string) => {
    try {
      await api.put(`/reservations/${reservationId}/status`, {
        status: 'confirmed',
        paymentStatus: 'verified'
      });
      fetchReservations(restaurantId);
    } catch (error) {
      console.error('Failed to approve reservation', error);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason) return;
    try {
      await api.put(`/reservations/${rejectingId}/status`, {
        status: 'rejected',
        paymentStatus: 'rejected',
        verificationNote: rejectReason
      });
      setRejectingId(null);
      setRejectReason('');
      fetchReservations(restaurantId);
    } catch (error) {
      console.error('Failed to reject reservation', error);
    }
  };

  const handleToggleReservations = async () => {
    if (!event) return;
    try {
      const updatedEvent = await api.put(`/events/${id}`, {
        enableReservation: !event.enableReservation
      });
      setEvent(updatedEvent.data);
    } catch (error) {
      console.error('Failed to toggle reservations', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Events
      </button>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Event Reservations</h1>
          {event && (
            <p className="text-zinc-400 mt-2">
              Managing reservations for <strong className="text-purple-400">{event.title}</strong>
            </p>
          )}
        </div>
        
        {event && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between w-full md:w-auto gap-6">
            <div>
              <h3 className="text-white font-medium text-sm">Accept Reservations</h3>
              <p className="text-zinc-500 text-xs mt-1">Allow customers to book tables</p>
            </div>
            <button 
              onClick={handleToggleReservations}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${event.enableReservation ? 'bg-purple-600' : 'bg-zinc-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${event.enableReservation ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Reservation Requests</h2>
        </div>
        
        {reservations.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No reservations yet</h3>
            <p className="text-zinc-400">When customers book a table for this event, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/50 text-zinc-400 text-sm">
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Table & Guests</th>
                  <th className="p-4 font-medium">Advance Paid</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {reservations.map((res) => (
                  <tr key={res._id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{res.customer?.name || 'Unknown'}</div>
                      <div className="text-sm text-zinc-500">{res.customer?.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">Table {res.table?.tableNumber}</div>
                      <div className="text-sm text-zinc-400">{res.guestCount} Guests</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">₹{res.advanceAmount}</div>
                      <div className="text-xs text-zinc-500">Txn: {res.transactionId || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      {res.reservationStatus === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Clock size={12} /> Pending Verification
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
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {res.paymentScreenshot && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedImage(res.paymentScreenshot || null)}
                          className="border-zinc-700 text-zinc-300 hover:text-white"
                        >
                          <Eye size={14} className="mr-2" /> View Proof
                        </Button>
                      )}
                      
                      {res.reservationStatus === 'pending' && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleApprove(res._id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setRejectingId(res._id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-zinc-900 p-2 rounded-xl border border-zinc-700 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-lg font-medium text-white">Payment Screenshot</h3>
              <button onClick={() => setSelectedImage(null)} className="text-zinc-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            <div className="relative flex-1 overflow-hidden rounded-lg flex items-center justify-center bg-black">
              {/* Note: In a real app, use next/image with proper domain config, using img for simplicity */}
              <img 
                src={selectedImage} 
                alt="Payment proof" 
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Reject Reservation</h3>
            <p className="text-zinc-400 text-sm mb-4">Please provide a reason for rejecting this reservation. The customer will be able to re-upload their payment proof if needed.</p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid screenshot, wrong amount paid, etc."
              className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-red-500 focus:outline-none mb-4"
              rows={4}
            />
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectingId(null)} className="border-zinc-700 text-zinc-300">
                Cancel
              </Button>
              <Button onClick={handleReject} disabled={!rejectReason} className="bg-red-600 hover:bg-red-700 text-white">
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
