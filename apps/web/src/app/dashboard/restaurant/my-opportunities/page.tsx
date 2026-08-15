'use client';

import { Briefcase, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MyOpportunitiesPage() {
  const opportunities = [
    {
      id: '1',
      title: 'Acoustic Friday Nights',
      date: 'This Friday',
      budget: '$150',
      applicationsCount: 12,
      status: 'Active',
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Opportunities</h1>
          <p className="text-zinc-400 mt-1">Manage the gigs you've posted.</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-zinc-800">
          {opportunities.map((opp) => (
            <div key={opp.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{opp.title}</h3>
                  <p className="text-sm text-zinc-400">{opp.date} • {opp.budget}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-none text-center px-4 py-2 bg-zinc-800/50 rounded-lg">
                  <span className="block text-sm font-medium text-white">{opp.applicationsCount}</span>
                  <span className="block text-xs text-zinc-500">Apps</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="border-zinc-700 text-zinc-300">
                    <Edit size={16} />
                  </Button>
                  <Button variant="outline" size="icon" className="border-red-900/50 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
