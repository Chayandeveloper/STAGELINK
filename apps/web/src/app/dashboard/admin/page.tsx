'use client';

import { useEffect, useState } from 'react';
import { Users, Store, Music, LayoutDashboard, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Venues', value: stats?.totalRestaurants || 0, icon: Store, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Performers', value: stats?.totalPerformers || 0, icon: Music, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-zinc-400 mt-1">Platform overview and statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
