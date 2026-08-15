'use client';

import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const { data } = await api.get(`/applications/venue?_t=${Date.now()}`);
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await api.put(`/applications/${id}/status`, { status });
      fetchApplications();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="text-zinc-400">Loading applications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Applications</h1>
          <p className="text-zinc-400 mt-1">Review performers who applied to your gigs or pitched directly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {applications.length === 0 && (
          <div className="text-zinc-500 italic">No applications found.</div>
        )}
        {applications.map((app) => (
          <div key={app._id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6">
            <div className="h-24 w-24 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center border-2 border-zinc-700">
              <Users size={32} className="text-zinc-500" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{app.performer?.user?.name || 'Unknown Performer'}</h3>
                  <p className="text-sm text-indigo-400 font-medium">
                    Applied for: {app.gig ? app.gig.title : 'Direct Pitch'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  app.status === 'accepted' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                  {app.status.toUpperCase()}
                </div>
              </div>
              
              <p className="text-zinc-300 text-sm bg-zinc-800/50 p-3 rounded-lg italic">
                "{app.coverNote || 'No cover note provided.'}"
              </p>
            </div>

            <div className="flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6 w-full md:w-32">
              {app.status === 'pending' && (
                <>
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleUpdateStatus(app._id, 'accepted')}
                  >
                    <CheckCircle size={16} className="mr-2" /> Accept
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-900/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => handleUpdateStatus(app._id, 'rejected')}
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
