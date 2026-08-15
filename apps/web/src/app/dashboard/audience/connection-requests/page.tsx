'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function ConnectionsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/connections/pending');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterId: string) => {
    try {
      await api.post('/connections/accept', { requesterId });
      fetchRequests();
      // Optionally redirect to chat or show toast
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (requesterId: string) => {
    try {
      await api.post('/connections/reject', { requesterId });
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Connection Requests</h1>
        <p className="text-zinc-400 mt-1">Review requests from nearby fans who want to connect with you.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-400">You don't have any pending requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((request) => (
            <div key={request._id} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold shadow-inner">
                    {request.requester?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{request.requester?.name}</h3>
                    <p className="text-xs text-zinc-400 flex items-center">
                      <MapPin size={12} className="mr-1" /> {request.requester?.city || 'Unknown Location'}
                    </p>
                  </div>
                </div>

                {request.requester?.lookingFor && request.requester.lookingFor.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-zinc-500 mb-1 font-semibold uppercase tracking-wider">Looking For</p>
                    <div className="flex flex-wrap gap-1.5">
                      {request.requester.lookingFor.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {request.requester?.interests && request.requester.interests.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-zinc-500 mb-1 font-semibold uppercase tracking-wider">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {request.requester.interests.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-800/50">
                <Button 
                  onClick={() => handleAccept(request.requester._id)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
                >
                  <Check className="mr-2 h-4 w-4" /> Accept
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleReject(request.requester._id)}
                  className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
