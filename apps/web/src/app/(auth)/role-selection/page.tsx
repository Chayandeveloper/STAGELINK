'use client';

import Link from 'next/link';
import { User, Music, Store } from 'lucide-react';

export default function RoleSelectionPage() {
  const roles = [
    {
      id: 'customer',
      title: 'Audience Member',
      description: 'Discover events, book tables, and follow your favorite local artists.',
      icon: User,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
      hoverColor: 'hover:bg-blue-500/20 hover:border-blue-500',
    },
    {
      id: 'performer',
      title: 'Performer',
      description: 'Find gigs, showcase your talent, and connect with premium venues.',
      icon: Music,
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/50',
      hoverColor: 'hover:bg-purple-500/20 hover:border-purple-500',
    },
    {
      id: 'restaurant',
      title: 'Venue Owner',
      description: 'Host events, book talented performers, and attract more customers.',
      icon: Store,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50',
      hoverColor: 'hover:bg-emerald-500/20 hover:border-emerald-500',
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950">
      <div className="w-full max-w-4xl space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white mb-4">
            How do you want to use StageLink?
          </h2>
          <p className="text-lg text-zinc-400">
            Select your account type to get started. You can customize your experience later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Link key={role.id} href={`/register?role=${role.id}`}>
              <div
                className={`flex flex-col items-center p-8 rounded-2xl border transition-all duration-300 cursor-pointer h-full
                  ${role.color} ${role.hoverColor} backdrop-blur-sm group`}
              >
                <div className="p-4 rounded-full bg-zinc-900/50 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <role.icon size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3 text-center">
                  {role.title}
                </h3>
                <p className="text-center text-zinc-300">
                  {role.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
