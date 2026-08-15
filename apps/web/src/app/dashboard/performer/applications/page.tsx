'use client';

import { useState, useEffect } from 'react';
import { Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/applications/performer');
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

  const getStatusIcon = (status: string) => {
    if (status === 'accepted') return <CheckCircle size={16} className="text-green-400 mr-1" />;
    if (status === 'rejected') return <XCircle size={16} className="text-red-400 mr-1" />;
    return <Clock size={16} className="text-yellow-400 mr-1" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'accepted') return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (status === 'rejected') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  };

  if (loading) return <div className="text-zinc-400">Loading applications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Applications</h1>
          <p className="text-zinc-400 mt-1">Track the status of gigs you've applied to or pitched directly.</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-zinc-800">
          {applications.length === 0 && (
            <div className="p-6 text-zinc-500 italic">You have not submitted any applications or pitches yet.</div>
          )}
          {applications.map((app) => (
            <div key={app._id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{app.gig ? app.gig.title : 'Direct Pitch'}</h3>
                  <p className="text-sm text-zinc-400">
                    {app.restaurant?.user?.name || (app.gig?.restaurant?.user?.name) || 'Unknown Venue'} • {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className={`flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(app.status)}`}>
                  {getStatusIcon(app.status)}
                  {app.status.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
