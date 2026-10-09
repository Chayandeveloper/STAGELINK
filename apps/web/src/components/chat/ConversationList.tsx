import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Conversation, useChatStore } from '@/store/useChatStore';
import { Search } from 'lucide-react';

interface Props {
  conversations: Conversation[];
  userId: string;
}

export function ConversationList({ conversations, userId }: Props) {
  const { activeConversation, setActiveConversation, onlineUsers, typingUsers } = useChatStore();
  const [search, setSearch] = useState('');

  const formatMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m`;
      
      const isToday = now.toDateString() === date.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (yesterday.toDateString() === date.toDateString()) {
        return 'Yesterday';
      }

      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((conv) => {
      const otherUser = conv.participants.find((p) => p._id !== userId) || conv.participants[0];
      return (
        otherUser?.name?.toLowerCase().includes(q) ||
        conv.lastMessage?.toLowerCase().includes(q)
      );
    });
  }, [conversations, search, userId]);

  return (
    <div className={cn(
      "w-full md:w-80 border-r border-white/10 bg-zinc-950/80 backdrop-blur-xl h-full min-h-0 flex flex-col shrink-0",
      activeConversation ? "hidden md:flex" : "flex"
    )}>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Messages</h2>
          <span className="text-xs font-medium text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            {conversations.length}
          </span>
        </div>
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-2 space-y-1">
        {filteredConversations.map((conv) => {
          const isActive = activeConversation === conv._id;
          const otherUser = conv.participants.find(p => p._id !== userId) || conv.participants[0];
          const isOnline = otherUser ? onlineUsers.has(otherUser._id) : false;
          const isTyping = typingUsers[conv._id];
          const unreadCount = conv.unreadCount?.[userId] || 0;

          return (
            <button
              key={conv._id}
              onClick={() => setActiveConversation(conv._id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 text-left relative group",
                isActive 
                  ? "bg-indigo-600/20 hover:bg-indigo-600/25 border border-indigo-500/30" 
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                  {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={cn(
                    "text-sm font-semibold truncate",
                    isActive ? "text-white" : "text-zinc-200"
                  )}>
                    {otherUser?.name || 'User'}
                  </h3>
                  {conv.lastMessageAt && (
                    <span className="text-[11px] text-zinc-400 flex-shrink-0 ml-1">
                      {formatMessageTime(conv.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className={cn(
                    "text-xs truncate max-w-[150px]",
                    unreadCount > 0 ? "text-white font-medium" : "text-zinc-400"
                  )}>
                    {isTyping ? (
                      <span className="text-indigo-400 font-medium italic animate-pulse">Typing...</span>
                    ) : conv.lastMessage?.startsWith('data:image/') || conv.lastMessage?.includes('|||CAPTION|||') || conv.lastMessage === '📷 Photo' ? (
                      <span className="text-zinc-300 font-medium flex items-center gap-1">📷 Photo</span>
                    ) : (
                      conv.lastMessage || 'No messages yet'
                    )}
                  </p>
                  {unreadCount > 0 && (
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredConversations.length === 0 && (
          <div className="text-center text-zinc-400 mt-12 text-sm px-4">
            {search ? 'No conversations match your search.' : 'No conversations yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
