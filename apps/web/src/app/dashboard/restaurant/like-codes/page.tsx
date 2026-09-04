'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  HeartHandshake, Sparkles, CheckCircle2, ShieldAlert, 
  Copy, Check, Loader2, Phone, Receipt, History, User
} from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface LikeCodeItem {
  _id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  billAmount: number;
  likesAwarded: number;
  durationDays?: number;
  status: 'active' | 'redeemed' | 'expired';
  createdAt: string;
}

export default function RestaurantLikeCodesPage() {
  const [phone, setPhone] = useState('');
  const [billAmount, setBillAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<any | null>(null);
  const [history, setHistory] = useState<LikeCodeItem[]>([]);
  const [copied, setCopied] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/connections/restaurant/codes');
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to fetch code history', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedCode(null);

    if (!phone.trim()) {
      setError('Please enter the customer registered phone number');
      return;
    }

    const numBill = parseFloat(billAmount);
    if (isNaN(numBill) || numBill <= 0) {
      setError('Please enter a valid bill amount');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/connections/restaurant/generate-code', {
        phone: phone.trim(),
        billAmount: numBill
      });

      setGeneratedCode(res.data);
      setPhone('');
      setBillAmount('');
      fetchHistory();
    } catch (err: any) {
      console.error('Failed to generate like code', err);
      const msg = err.response?.data?.message || 'Failed to generate code. Please verify details and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <HeartHandshake className="w-8 h-8 text-pink-400" />
          Customer Like Codes
        </h1>
        <p className="text-zinc-400 mt-1">
          Reward your dining guests with extra connection likes on StageLink based on their bill amount.
        </p>
      </div>

      {/* Generator Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xl">
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Issue Code to Customer
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              The phone number must be registered to the customer in the StageLink app.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 animate-in fade-in">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400" />
                Customer Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                StageLink will verify that this phone is registered before generating the voucher.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Dining Bill Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-zinc-500 text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="e.g. 1250"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none font-semibold"
                  required
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Extra likes awarded are automatically calculated according to admin bill tier rules.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="py-6 px-8 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-pink-900/20 transition-all text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Verifying & Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Customer Like Code
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Success Modal / Display */}
        {generatedCode && (
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-pink-500/30 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-3">
              <CheckCircle2 className="w-5 h-5" />
              Code Successfully Generated for Customer!
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
                <span className="text-xs text-zinc-400 block mb-0.5 flex items-center gap-1.5">
                  <User size={13} /> Customer
                </span>
                <span className="text-sm font-bold text-white">{generatedCode.customerName}</span>
                <span className="text-xs text-zinc-500 block">{generatedCode.customerPhone}</span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
                <span className="text-xs text-zinc-400 block mb-0.5">Bill Amount</span>
                <span className="text-sm font-bold text-white">₹{generatedCode.billAmount}</span>
              </div>
              <div className="bg-zinc-900/80 border border-pink-500/20 p-3.5 rounded-xl">
                <span className="text-xs text-pink-300 block mb-0.5">Extra Daily Likes</span>
                <span className="text-sm font-extrabold text-pink-400">+{generatedCode.likesAwarded} / day</span>
              </div>
              <div className="bg-zinc-900/80 border border-indigo-500/20 p-3.5 rounded-xl">
                <span className="text-xs text-indigo-300 block mb-0.5">Validity Duration</span>
                <span className="text-sm font-extrabold text-indigo-400">{generatedCode.durationDays || 7} Days</span>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                  Customer Voucher Code:
                </span>
                <span className="text-2xl font-mono font-black text-pink-400 tracking-wider select-all">
                  {generatedCode.code}
                </span>
              </div>
              <Button
                onClick={() => handleCopy(generatedCode.code)}
                variant="outline"
                className="border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/20 text-pink-200 rounded-xl px-5 py-2.5 flex items-center gap-2 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>

            <p className="text-xs text-zinc-400 mt-3 text-center sm:text-left">
              Share this code with the customer. When they redeem it in the "People Nearby" section of StageLink, they will receive +{generatedCode.likesAwarded} extra likes every day for {generatedCode.durationDays || 7} days!
            </p>
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          Issued Codes History
        </h2>

        {fetchingHistory ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-sm">
            No like codes issued yet. Generate your first code above!
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/70 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Bill</th>
                    <th className="px-5 py-3.5">Bonus / Day</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {history.map((item) => (
                    <tr key={item._id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-5 py-4 font-mono font-bold text-pink-300">
                        {item.code}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-white font-medium">{item.customerName}</div>
                        <div className="text-xs text-zinc-500">{item.customerPhone}</div>
                      </td>
                      <td className="px-5 py-4 text-zinc-300 font-semibold">
                        ₹{item.billAmount}
                      </td>
                      <td className="px-5 py-4 font-bold text-pink-400">
                        +{item.likesAwarded}/day
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-indigo-300">
                        {item.durationDays || 7} days
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={`text-xs px-2.5 py-0.5 rounded-full capitalize ${
                            item.status === 'redeemed'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
