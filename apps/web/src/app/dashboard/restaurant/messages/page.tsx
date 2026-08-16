'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';

export default function RestaurantMessagesPage() {
  return (
    <div className="h-full">
      <div className="mb-6 hidden md:block">
        <h1 className="text-3xl font-bold text-white tracking-tight">Messages</h1>
        <p className="text-zinc-400 mt-1">Chat directly with applicants and booked performers.</p>
      </div>
      <ChatInterface roleTitle="Venue" />
    </div>
  );
}
