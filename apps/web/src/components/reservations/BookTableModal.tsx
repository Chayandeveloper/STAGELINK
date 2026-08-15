'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Store, Calendar, Users, Clock, Upload, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/store/useLocationStore';
import api from '@/lib/api';

interface BookTableModalProps {
  onClose: () => void;
  onSuccess: () => void;
  meetupRecipient?: any;
  onMessageSent?: (msgContent: string) => void;
}

export function BookTableModal({ onClose, onSuccess, meetupRecipient, onMessageSent }: BookTableModalProps) {
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Restaurant Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);

  // Step 2: Table Selection
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  // Step 3: Payment
  const [screenshot, setScreenshot] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const bookingAdvance = 200; // Fixed booking advance for direct table bookings

  useEffect(() => {
    if (step === 1) {
      fetchVenues();
    } else if (step === 2 && selectedVenue) {
      fetchTables();
    }
  }, [step, selectedCity, selectedVenue]);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const url = selectedCity ? `/discovery/venues?city=${encodeURIComponent(selectedCity)}` : '/discovery/venues';
      const res = await api.get(url);
      setVenues(res.data.venues || []);
    } catch (error) {
      console.error('Failed to fetch venues', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    if (!selectedVenue?.user?._id) return; // Note: In Restaurant model, we need to pass the restaurant's _id. Wait, getVenuesByCity returns Restaurant documents.
    // Let's use venue.user._id if that's how tables are linked, or venue._id.
    // In server/src/models/Table.ts, restaurant is a ref to 'Restaurant'. So we use venue._id.
    setLoading(true);
    try {
      const res = await api.get(`/tables/restaurant/${selectedVenue._id}`);
      setTables(res.data || []);
    } catch (error) {
      console.error('Failed to fetch tables', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = venues.filter(v => 
    v.restaurantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedVenue || !selectedTable || !date || !time || !screenshot) return;
    setLoading(true);
    try {
      await api.post('/reservations', {
        restaurant: selectedVenue._id,
        table: selectedTable._id,
        guestCount,
        reservationDate: date,
        reservationTime: time,
        bookingAmount: bookingAdvance,
        advanceAmount: bookingAdvance,
        paymentScreenshot: screenshot,
        transactionId
      });

      if (meetupRecipient) {
        // Also create a Meetup proposal
        await api.post('/meetups', {
          recipientId: meetupRecipient._id,
          venueId: selectedVenue._id,
          dateTime: `${date}T${time}:00`,
          purpose: 'Chat Meetup'
        });
        
        // Let the parent component send the message via websockets
        if (onMessageSent) {
          onMessageSent(`I've booked a table for us at ${selectedVenue.restaurantName} on ${date} at ${time}. Looking forward to our meetup!`);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to submit booking', error);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h2 className="text-xl font-bold text-white tracking-tight">{meetupRecipient ? `Book Meetup with ${meetupRecipient.name}` : 'Book a Table'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === i ? 'bg-indigo-600 text-white' : 
                  step > i ? 'bg-indigo-900 text-indigo-300' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {step > i ? <CheckCircle size={16} /> : i}
                </div>
                {i < 3 && (
                  <div className={`w-12 h-1 mx-2 rounded-full ${
                    step > i ? 'bg-indigo-900' : 'bg-zinc-800'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  placeholder={`Search restaurants in ${selectedCity || 'all cities'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {loading ? (
                <div className="text-center py-8 text-zinc-400">Loading restaurants...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVenues.map((venue) => (
                    <div 
                      key={venue._id} 
                      onClick={() => setSelectedVenue(venue)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedVenue?._id === venue._id 
                          ? 'border-indigo-500 bg-indigo-500/10' 
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {venue.images?.[0] ? (
                            <img src={venue.images[0]} alt={venue.restaurantName} className="w-full h-full object-cover" />
                          ) : (
                            <Store size={24} className="text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white line-clamp-1">{venue.restaurantName}</h3>
                          <div className="flex items-center text-zinc-400 text-xs mt-1">
                            <MapPin size={12} className="mr-1" />
                            <span className="line-clamp-1">{venue.user?.city || 'Unknown Location'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredVenues.length === 0 && (
                    <div className="col-span-full text-center py-8 text-zinc-500">
                      No restaurants found matching your search.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 flex items-center gap-3">
                <Store size={20} className="text-indigo-400" />
                <span className="text-white font-medium">Booking at {selectedVenue?.restaurantName}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Number of Guests</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="number" 
                      min="1"
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">Select a Table</label>
                {loading ? (
                  <div className="text-zinc-500 text-sm">Loading tables...</div>
                ) : tables.length === 0 ? (
                  <div className="text-amber-400 text-sm bg-amber-400/10 p-3 rounded-lg border border-amber-400/20">
                    No tables available for this restaurant.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {tables.map(table => {
                      const isSuitable = table.capacity >= guestCount;
                      return (
                        <div 
                          key={table._id}
                          onClick={() => isSuitable && setSelectedTable(table)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            !isSuitable ? 'opacity-50 border-zinc-800 bg-zinc-900 cursor-not-allowed' :
                            selectedTable?._id === table._id ? 'border-indigo-500 bg-indigo-500/10 cursor-pointer' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500 cursor-pointer'
                          }`}
                        >
                          <div className="font-bold text-white">Table {table.tableNumber}</div>
                          <div className="text-xs text-zinc-400 mt-1">Cap: {table.capacity} | {table.tableType}</div>
                          {!isSuitable && <div className="text-[10px] text-red-400 mt-1">Too small</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-center">
                <p className="text-indigo-200 text-sm mb-1">Booking Advance Required</p>
                <p className="text-3xl font-bold text-indigo-400">₹{bookingAdvance}</p>
                <p className="text-indigo-200/70 text-xs mt-2">Pay via UPI to confirm your table</p>
              </div>

              <div className="bg-zinc-800 p-6 rounded-xl text-center border border-zinc-700">
                <div className="inline-block p-4 bg-white rounded-lg mb-4">
                  <div className="w-40 h-40 bg-zinc-200 flex items-center justify-center text-zinc-500 flex-col">
                     <span className="font-bold mb-2">UPI QR Code</span>
                     <span className="text-xs">Scan to pay ₹{bookingAdvance}</span>
                  </div>
                </div>
                <p className="text-zinc-300 font-medium">UPI ID: stagelink@upi</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Transaction ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1234567890"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Upload Payment Screenshot *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setScreenshot((reader.result as string) || '');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                  />
                  <div className="text-center text-zinc-500 my-2 text-sm">- OR -</div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Paste URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/screenshot.png"
                    value={screenshot}
                    onChange={(e) => setScreenshot(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                  {screenshot && (
                    <div className="mt-3 relative h-32 w-32 rounded-lg overflow-hidden border border-zinc-700 mx-auto">
                      <img src={screenshot} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => step === 1 ? onClose() : setStep(step - 1)}
            className="border-zinc-700 text-zinc-300"
            disabled={loading}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {step < 3 ? (
            <Button 
              onClick={() => setStep(step + 1)} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={(step === 1 && !selectedVenue) || (step === 2 && (!date || !time || !selectedTable)) || loading}
            >
              Continue
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!screenshot || loading}
            >
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
