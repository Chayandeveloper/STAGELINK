import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, Loader2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { BookTableModal } from '@/components/reservations/BookTableModal';

interface Props {
  userId: string;
}

export function ChatWindow({ userId }: Props) {
  const { activeConversation, setActiveConversation, messages, conversations, onlineUsers } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMeetupModal, setShowMeetupModal] = React.useState(false);
  const [proposing, setProposing] = React.useState(false);

  const conversation = conversations.find(c => c._id === activeConversation);
  const otherUser = conversation?.participants.find(p => p._id !== userId) || conversation?.participants[0];
  const isOnline = otherUser ? onlineUsers.has(otherUser._id) : false;

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleProposeMeetup = async () => {
    // Deprecated in favor of BookTableModal
  };

  if (!activeConversation) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-black/60 backdrop-blur-xl">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Your Messages</h3>
        <p className="text-white/40 max-w-sm text-center">
          Select a conversation from the list to start chatting or discover new people nearby.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full min-h-0 overflow-hidden flex flex-col bg-black/60 backdrop-blur-xl relative">
      {/* Header */}
      <div className="h-[76px] px-6 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md absolute top-0 w-full z-10">
        <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveConversation(null)}
            className="md:hidden text-white hover:bg-white/10 -ml-2 h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {otherUser?.name.charAt(0).toUpperCase()}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{otherUser?.name}</h3>
            <p className="text-xs text-white/50">{isOnline ? 'Active now' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowMeetupModal(true)}
            className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 h-8 text-xs bg-black/50"
          >
            <MapPin size={14} className="mr-1" /> Meetup
          </Button>
          <button className="text-white/50 hover:text-white transition-colors p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {showMeetupModal && (
        <BookTableModal 
          onClose={() => setShowMeetupModal(false)}
          onSuccess={() => setShowMeetupModal(false)}
          meetupRecipient={otherUser}
          onMessageSent={(msgContent) => {
            if (activeConversation) {
              useChatStore.getState().sendMessage(activeConversation, msgContent);
            }
          }}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 pt-24 pb-4">
        <div className="flex flex-col">
          {messages.map((message, index) => {
            const isOwn = message.sender._id === userId;
            const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;
            
            return (
              <MessageBubble 
                key={message._id || index} 
                message={message} 
                isOwnMessage={isOwn} 
                showAvatar={showAvatar}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput conversationId={activeConversation} />
    </div>
  );
}
