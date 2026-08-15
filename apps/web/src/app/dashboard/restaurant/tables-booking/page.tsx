'use client';

import { useState, useEffect } from 'react';
import { Calendar, User, CheckCircle, XCircle, Clock, MapPin, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function TableBookingsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [restaurantId, setRestaurantId] = useState('');

  const fetchReservations = async () => {
    try {
      // First get profile to get restaurant ID
      const profileRes = await api.get('/profile/me');
      const rId = profileRes.data._id;
      setRestaurantId(rId);

      const res = await api.get(`/reservations/restaurant/${rId}`);
      setReservations(res.data);
    } catch (err) {
      console.error('Failed to fetch reservations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    try {
      const paymentStatus = status === 'confirmed' ? 'verified' : 'rejected';
      await api.put(`/reservations/${id}/status`, { status, paymentStatus });
      fetchReservations();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (filterDate) {
      const resDate = new Date(res.reservationDate).toISOString().split('T')[0];
      return resDate === filterDate;
    }
    return true;
  });

  if (loading) return <div className="text-zinc-400">Loading table bookings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Table Bookings</h1>
          <p className="text-zinc-400 mt-1">Manage all table reservations made by customers.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-zinc-500" />
            </div>
            <input
              type="date"
              className="w-full md:w-auto rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          {filterDate && (
            <Button variant="outline" onClick={() => setFilterDate('')} className="border-zinc-700 text-zinc-300">
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredReservations.length === 0 && (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
            <ReceiptText size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-lg">No reservations found.</p>
          </div>
        )}
        
        {filteredReservations.map((res) => (
          <div key={res._id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <User size={20} className="text-indigo-400" />
                    {res.customer?.name || 'Customer'}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1">
                    <MapPin size={14} /> Table {res.table?.tableNumber} ({res.table?.tableType}) • {res.guestCount} Guests
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  res.reservationStatus === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  res.reservationStatus === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                  {res.reservationStatus.toUpperCase()}
                </div>
              </div>
              
              <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-zinc-500 mb-1">Event</p>
                  <p className="text-zinc-200 font-medium">{res.event?.title || 'Unknown Event'}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Date & Time</p>
                  <p className="text-zinc-200 font-medium flex items-center gap-1">
                    <Calendar size={14} className="text-zinc-400" /> {new Date(res.reservationDate).toLocaleDateString()}
                    <span className="mx-1 text-zinc-600">|</span>
                    <Clock size={14} className="text-zinc-400" /> {res.reservationTime}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Payment</p>
                  <p className="text-zinc-200 font-medium">₹{res.advanceAmount} ({res.paymentStatus})</p>
                </div>
              </div>

              {res.paymentScreenshot && (
                <div className="mt-2">
                  <p className="text-zinc-400 text-sm mb-2">Payment Proof (TxID: {res.transactionId || 'N/A'})</p>
                  <img src={res.paymentScreenshot} alt="Payment Proof" className="h-24 rounded-lg border border-zinc-700 object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(res.paymentScreenshot, '_blank')} />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6 w-full md:w-36 shrink-0">
              {res.reservationStatus === 'pending' && (
                <>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleUpdateStatus(res._id, 'confirmed')}
                  >
                    <CheckCircle size={16} className="mr-2" /> Confirm
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-900/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => handleUpdateStatus(res._id, 'rejected')}
                  >
                    <XCircle size={16} className="mr-2" /> Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
