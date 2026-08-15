'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreditCard, IndianRupee, Save } from 'lucide-react';
import api from '@/lib/api';

export default function PaymentSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [advancePaymentType, setAdvancePaymentType] = useState('fixed');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advancePercentage, setAdvancePercentage] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [advanceBookingEnabled, setAdvanceBookingEnabled] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile/me');
        if (res.data) {
          setUpiId(res.data.upiId || '');
          setAccountHolderName(res.data.accountHolderName || '');
          setAdvancePaymentType(res.data.advancePaymentType || 'fixed');
          setAdvanceAmount(res.data.advanceAmount?.toString() || '');
          setAdvancePercentage(res.data.advancePercentage?.toString() || '');
          setPaymentInstructions(res.data.paymentInstructions || '');
          setAdvanceBookingEnabled(res.data.advanceBookingEnabled || false);
        }
      } catch (err: any) {
        console.error('Failed to fetch profile', err);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await api.put('/profile/update', { 
        upiId,
        accountHolderName,
        advancePaymentType,
        advanceAmount: advanceAmount ? Number(advanceAmount) : undefined,
        advancePercentage: advancePercentage ? Number(advancePercentage) : undefined,
        paymentInstructions,
        advanceBookingEnabled
      });
      setSuccess('Payment settings updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update payment settings');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-zinc-400">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CreditCard className="text-purple-400" />
          Payment & Reservation Settings
        </h1>
        <p className="text-zinc-400 mt-2">Configure UPI details for manual advance table bookings.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-md">
              {success}
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <input
              type="checkbox"
              id="advanceBookingEnabled"
              checked={advanceBookingEnabled}
              onChange={(e) => setAdvanceBookingEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-zinc-900"
            />
            <label htmlFor="advanceBookingEnabled" className="text-white font-medium cursor-pointer">
              Enable Advance Table Booking
            </label>
          </div>

          <div className={`space-y-6 transition-opacity ${!advanceBookingEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g. venue@upi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                  placeholder="Legal name on bank account"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Advance Payment Type</label>
                <select
                  value={advancePaymentType}
                  onChange={(e) => setAdvancePaymentType(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="fixed">Fixed Amount per Booking</option>
                  <option value="percentage">Percentage of Total Bill</option>
                </select>
              </div>

              {advancePaymentType === 'fixed' ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Advance Amount (₹)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee size={16} className="text-zinc-500" />
                    </div>
                    <input
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Advance Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={advancePercentage}
                    onChange={(e) => setAdvancePercentage(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="20"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Payment Instructions for Customer</label>
              <textarea
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                placeholder="E.g. Please mention your name and booking date in the UPI remarks."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
