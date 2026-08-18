import React from 'react';
import { cn } from '@/lib/utils';
import { Conversation, useChatStore } from '@/store/useChatStore';

interface Props {
  conversations: Conversation[];
  userId: string;
}

export function ConversationList({ conversations, userId }: Props) {
  const { activeConversation, setActiveConversation, onlineUsers, typingUsers } = useChatStore();

  return (
    <div className={cn(
      "w-full md:w-80 border-r border-white/10 bg-black/40 backdrop-blur-xl h-full min-h-0 flex flex-col shrink-0",
      activeConversation ? "hidden md:flex" : "flex"
    )}>
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">Messages</h2>
        <input 
          type="text" 
          placeholder="Search..." 
          className="mt-4 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-2 space-y-1">
        {conversations.map((conv) => {
          const isActive = activeConversation === conv._id;
          
          // Get the other participant (assuming 1-on-1 for now)
          const otherUser = conv.participants.find(p => p._id !== userId) || conv.participants[0];
          const isOnline = onlineUsers.has(otherUser._id);
          const isTyping = typingUsers[conv._id];
          const unreadCount = conv.unreadCount?.[userId] || 0;

          return (
            <button
              key={conv._id}
              onClick={() => setActiveConversation(conv._id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left",
                isActive ? "bg-primary/20 hover:bg-primary/30" : "hover:bg-white/5"
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-semibold text-white truncate">{otherUser.name}</h3>
                  {conv.lastMessageAt && (
                    <span className="text-xs text-white/40 flex-shrink-0">
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className={cn(
                    "text-xs truncate max-w-[140px]",
                    unreadCount > 0 ? "text-white font-medium" : "text-white/50"
                  )}>
                    {isTyping ? <span className="text-primary italic animate-pulse">Typing...</span> : (conv.lastMessage || 'No messages yet')}
                  </p>
                  {unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {conversations.length === 0 && (
          <div className="text-center text-white/40 mt-10 text-sm">
            No conversations yet
          </div>
        )}
      </div>
    </div>
  );
}
