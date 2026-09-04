'use client';

import { useState, useEffect } from 'react';
import { Send, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import Link from 'next/link';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'gigs'>('applications');

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

  const acceptedGigs = applications.filter((app) => app.status === 'accepted');

  if (loading) return <div className="text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Applications & Gigs</h1>
          <p className="text-zinc-400 mt-1">Track the status of your applications and manage your upcoming gigs.</p>
        </div>
      </div>

      {/* Sub-tabs Selector */}
      <div className="flex border-b border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2.5 border-b-2 text-sm font-semibold transition-colors ${
            activeTab === 'applications'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          My Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('gigs')}
          className={`px-4 py-2.5 border-b-2 text-sm font-semibold transition-colors ${
            activeTab === 'gigs'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          My Gigs ({acceptedGigs.length})
        </button>
      </div>

      {activeTab === 'applications' ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-zinc-800">
            {applications.length === 0 && (
              <div className="p-6 text-zinc-500 italic text-center">You have not submitted any applications or pitches yet.</div>
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
                      {app.restaurant?.restaurantName || app.restaurant?.user?.name || (app.gig?.restaurant?.restaurantName || app.gig?.restaurant?.user?.name) || 'Unknown Venue'} • {new Date(app.createdAt).toLocaleDateString()}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {acceptedGigs.length === 0 ? (
            <div className="col-span-full bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500 italic">
              You do not have any accepted gigs at the moment.
            </div>
          ) : (
            acceptedGigs.map((app) => {
              const gigTitle = app.gig ? app.gig.title : 'Direct Pitch';
              const venueName = app.restaurant?.restaurantName || app.restaurant?.user?.name || app.gig?.restaurant?.restaurantName || 'Unknown Venue';
              const location = app.restaurant?.location || app.gig?.restaurant?.location || 'Location TBD';
              const dateStr = app.gig?.date ? new Date(app.gig.date).toLocaleDateString() : 'Date TBD';
              const timeStr = app.gig?.time || 'Time TBD';
              const budgetStr = app.gig?.budget ? `$${app.gig.budget}` : (app.price ? `$${app.price}` : 'Budget TBD');

              return (
                <div key={app._id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-xl bg-green-500/10 flex flex-col items-center justify-center text-green-400 border border-green-500/20">
                        <CheckCircle size={24} />
                      </div>
                      <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                        {budgetStr}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{gigTitle}</h3>
                    
                    <div className="space-y-2 text-sm text-zinc-400">
                      <span className="flex items-center"><MapPin size={16} className="mr-2 text-zinc-500" /> {venueName} ({location})</span>
                      <span className="flex items-center"><Clock size={16} className="mr-2 text-zinc-500" /> {dateStr} • {timeStr}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800">
                    <Link href="/dashboard/messages" className="flex-1">
                      <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                        Contact Venue
                      </Button>
                    </Link>
                    {app.gig && (
                      <Link href={`/dashboard/performer/gigs`} className="flex-1">
                        <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                          View Gigs Feed
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
