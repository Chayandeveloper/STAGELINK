'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, ArrowLeft, Armchair, Info, Upload, Users, UserPlus } from 'lucide-react';
import api from '@/lib/api';

export default function EventDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);

  // Booking state
  const [bookingStep, setBookingStep] = useState(1); // 1: Select Table, 2: Advance Payment, 3: Success
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [reservationTime, setReservationTime] = useState('');
  
  // Payment state
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
        if (res.data.restaurant) {
          // If the API populated the restaurant, we might have some info. Let's fetch full profile for UPI
          const rId = typeof res.data.restaurant === 'string' ? res.data.restaurant : res.data.restaurant._id;
          // We need the restaurant's UPI details. Let's assume we can get it via profile or tables API returns it.
          // Wait, we can't easily get another user's profile unless there's a public endpoint.
          // Let's assume the event populates the restaurant, but we need the payment settings.
          // For now, let's fetch tables.
          const [tableRes, attendeesRes] = await Promise.all([
            api.get(`/tables/restaurant/${rId}?eventId=${id}`),
            api.get(`/reservations/event/${id}/attendees`)
          ]);
          setTables(tableRes.data);
          setAttendees(attendeesRes.data);
          setRestaurant(res.data.restaurant); // might need full restaurant object with UPI
        }
      } catch (error) {
        console.error('Failed to fetch event', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [id]);

  const handleBookTable = () => {
    if (!selectedTable || !reservationTime || guestCount < 1) return;
    setBookingStep(2);
  };

  const handleSubmitReservation = async () => {
    if (!paymentScreenshot) {
      alert('Please provide a payment screenshot URL.');
      return;
    }
    
    setSubmitting(true);
    try {
      const advanceAmount = restaurant?.advancePaymentType === 'fixed' 
        ? restaurant?.advanceAmount 
        : 500; // fallback

      await api.post('/reservations', {
        event: id,
        restaurant: typeof event.restaurant === 'string' ? event.restaurant : event.restaurant._id,
        table: selectedTable._id,
        guestCount,
        reservationDate: event.date,
        reservationTime,
        bookingAmount: 0, // Pay at venue
        advanceAmount: advanceAmount,
        paymentScreenshot,
        transactionId
      });
      setBookingStep(3);
    } catch (error) {
      console.error('Failed to submit reservation', error);
      alert('Failed to submit reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading...</div>;
  if (!event) return <div className="p-8 text-center text-zinc-400">Event not found</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-zinc-400 hover:text-white mb-6 transition-colors group"
      >
        <div className="p-1.5 bg-zinc-900 rounded-full mr-3 group-hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={16} />
        </div>
        Back to Events
      </button>

      {bookingStep === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-950 border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl relative">
              {/* Event Cover Image with Gradient Overlay */}
              <div className="relative h-72 w-full group">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${event.coverImage || 'https://images.unsplash.com/photo-1516280440502-613fb25db5cd?w=1000&q=80'})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-6 left-6">
                  <span className="bg-indigo-600/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg border border-indigo-500/30">
                    {event.category || 'Live Event'}
                  </span>
                </div>
              </div>

              <div className="px-8 pb-8 pt-2 relative z-10 -mt-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">{event.title}</h1>
                <p className="text-xl text-indigo-400 font-medium mb-8">
                  {event.performer?.displayName || event.performer?.name || event.performer?.user?.name || 'Various Artists'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-300">
                  <div className="flex items-start bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
                    <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl mr-4 shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Venue</p>
                      <p className="font-medium text-white">{restaurant?.restaurantName || 'Venue TBD'}</p>
                    </div>
                  </div>
                  <div className="flex items-start bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
                    <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl mr-4 shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Date & Time</p>
                      <p className="font-medium text-white">{new Date(event.date).toLocaleDateString()} at {event.time}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-zinc-800/60">
                  <h3 className="text-xl font-bold text-white mb-4">About this Event</h3>
                  <div className="text-zinc-400 leading-relaxed space-y-4 text-[15px]">
                    {event.description ? (
                      event.description.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)
                    ) : (
                      <p>Join us for an amazing night of live entertainment.</p>
                    )}
                  </div>
                </div>


              </div>
            </div>
          </div>

          <div className="space-y-6 sticky top-24 h-fit">
            {event.enableReservation ? (
              <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none -mr-10 -mt-10" />
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <Armchair size={20} />
                  </div>
                  Reserve a Table
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Select Table</label>
                    <select
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                      onChange={(e) => {
                        const table = tables.find(t => t._id === e.target.value);
                        setSelectedTable(table);
                        if (table && guestCount > table.capacity) setGuestCount(table.capacity);
                      }}
                      value={selectedTable?._id || ''}
                    >
                      <option value="">-- Choose a Table --</option>
                      {tables.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.tableNumber} ({t.capacity} seats, {t.tableType})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTable && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Number of Guests</label>
                        <select
                          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                          value={guestCount}
                          onChange={(e) => setGuestCount(Number(e.target.value))}
                        >
                          {Array.from({ length: selectedTable.capacity }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Arrival Time</label>
                        <input
                          type="time"
                          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                          value={reservationTime}
                          onChange={(e) => setReservationTime(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <Button 
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-indigo-500/25 transition-all h-12 rounded-xl"
                  disabled={!selectedTable || !reservationTime}
                  onClick={handleBookTable}
                >
                  Continue to Payment
                </Button>
                
                {tables.length === 0 && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                    <Info size={16} className="mt-0.5 shrink-0 text-red-400" />
                    <p className="text-red-300 text-sm leading-snug">
                      No tables currently available for this event.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-950 border border-zinc-800/60 rounded-3xl p-8 text-center shadow-xl">
                <div className="mx-auto h-16 w-16 bg-zinc-900 text-zinc-600 rounded-full flex items-center justify-center mb-4">
                  <Armchair size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Walk-ins Welcome</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">This event does not require advance table reservations. First come, first served!</p>
              </div>
            )}

            {attendees.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800/60 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="text-indigo-400" size={20} /> Who's Going
                  </h3>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/30 font-medium">
                    {attendees.length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {attendees.map((person) => (
                    <div key={person._id} className="flex items-center space-x-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 hover:border-indigo-500/30 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-inner overflow-hidden shrink-0">
                        {person.profileImage ? (
                          <img src={person.profileImage} alt={person.name} className="h-full w-full object-cover" />
                        ) : (
                          person.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{person.name}</p>
                        {person.city && (
                          <p className="text-[10px] text-zinc-400 flex items-center mt-0.5 truncate">
                            <MapPin size={10} className="mr-1 shrink-0" /> {person.city}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {bookingStep === 2 && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 text-center">
              <h2 className="text-2xl font-bold text-white">Advance Payment</h2>
              <p className="text-zinc-400 mt-1">Pay the advance amount to secure your table.</p>
            </div>
            
            <div className="p-6 space-y-8">
              <div className="bg-zinc-800/50 p-4 rounded-lg flex justify-between items-center border border-zinc-700">
                <div>
                  <p className="text-zinc-400 text-sm">Advance Amount</p>
                  <p className="text-3xl font-bold text-white">
                    ₹{restaurant?.advancePaymentType === 'fixed' ? restaurant?.advanceAmount : 500}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-sm">Table {selectedTable?.tableNumber}</p>
                  <p className="text-white font-medium">{guestCount} Guests</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl mx-auto w-64 h-64 relative">
                {restaurant?.upiQrImage ? (
                  <img src={restaurant.upiQrImage} alt="Venue QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-zinc-800">
                    <p className="font-bold">QR Code Unavailable</p>
                    <p className="text-sm mt-2">Please use the UPI ID below</p>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-zinc-400 mb-1">Venue UPI ID</p>
                <p className="text-xl font-mono text-purple-400 bg-purple-500/10 py-2 px-4 rounded-lg inline-block border border-purple-500/20">
                  {restaurant?.upiId || 'venue@upi'}
                </p>
                {restaurant?.accountHolderName && (
                  <p className="text-zinc-500 mt-2 text-sm">Name: {restaurant.accountHolderName}</p>
                )}
              </div>

              {restaurant?.paymentInstructions && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-blue-200 text-sm flex items-start gap-3">
                  <Info size={16} className="mt-0.5 shrink-0 text-blue-400" />
                  <p>{restaurant.paymentInstructions}</p>
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-zinc-800">
                <h3 className="font-medium text-white">Upload Payment Proof</h3>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Transaction ID (Optional)</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
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
                          setPaymentScreenshot(reader.result as string);
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
                    value={paymentScreenshot}
                    onChange={(e) => setPaymentScreenshot(e.target.value)}
                    placeholder="https://example.com/screenshot.png"
                  />
                  {paymentScreenshot && (
                    <div className="mt-3 relative h-32 w-32 rounded-lg overflow-hidden border border-zinc-700">
                      <img src={paymentScreenshot} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 border-zinc-700 text-zinc-300"
                onClick={() => setBookingStep(1)}
              >
                Back
              </Button>
              <Button 
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleSubmitReservation}
                disabled={submitting || !paymentScreenshot}
              >
                {submitting ? 'Submitting...' : 'Submit Reservation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {bookingStep === 3 && (
        <div className="max-w-md mx-auto mt-12 bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Reservation Submitted!</h2>
          <p className="text-zinc-400 mb-8">
            Your reservation request has been sent to the venue. They will verify your payment and confirm your table shortly.
          </p>
          <Button 
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
            onClick={() => router.push('/dashboard')}
          >
            Go to My Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
