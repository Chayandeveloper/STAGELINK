import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft, ArrowDown } from 'lucide-react';
import { BookTableModal } from '@/components/reservations/BookTableModal';

interface Props {
  userId: string;
}

export function ChatWindow({ userId }: Props) {
  const { 
    activeConversation, 
    setActiveConversation, 
    messages, 
    conversations, 
    onlineUsers,
    typingUsers,
    loadingMessages
  } = useChatStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialScrollRef = useRef(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showMeetupModal, setShowMeetupModal] = useState(false);

  const conversation = conversations.find(c => c._id === activeConversation);
  const otherUser = conversation?.participants.find(p => p._id !== userId) || conversation?.participants[0];
  const isOnline = otherUser ? onlineUsers.has(otherUser._id) : false;
  const isOtherTyping = activeConversation ? !!typingUsers[activeConversation] : false;

  // Track conversation switches
  useEffect(() => {
    isInitialScrollRef.current = true;
    setShowScrollBottom(false);
  }, [activeConversation]);

  // Handle smart scrolling
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setShowScrollBottom(false);
    }
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // If scrolled up more than 150px, show the jump button
    setShowScrollBottom(distanceToBottom > 150);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (isInitialScrollRef.current) {
      // Instant scroll on initial load
      el.scrollTop = el.scrollHeight;
      if (messages.length > 0) {
        isInitialScrollRef.current = false;
      }
      return;
    }

    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage?.sender?._id === userId;

    // Smooth scroll down if user is near bottom OR if user sent the message themselves
    if (distanceToBottom < 160 || isOwnMessage) {
      scrollToBottom('smooth');
    } else {
      setShowScrollBottom(true);
    }
  }, [messages, userId]);

  // Scroll to bottom when other user starts typing if near bottom
  useEffect(() => {
    if (isOtherTyping) {
      const el = scrollContainerRef.current;
      if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) {
        scrollToBottom('smooth');
      }
    }
  }, [isOtherTyping]);

  // Date separator helper
  const formatDateSeparator = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    } catch {
      return '';
    }
  };

  if (!activeConversation) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-black/60 backdrop-blur-xl">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/5">
          <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Your Messages</h3>
        <p className="text-white/40 max-w-sm text-center text-sm leading-relaxed">
          Select a conversation from the list to start chatting in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full min-h-0 overflow-hidden flex flex-col bg-zinc-950/70 backdrop-blur-xl relative">
      {/* Header */}
      <div className="h-[74px] px-4 sm:px-6 border-b border-white/10 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md z-10 w-full shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveConversation(null)}
            className="md:hidden text-zinc-300 hover:text-white hover:bg-white/10 -ml-2 h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
              {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{otherUser?.name || 'Conversation'}</h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
              <p className="text-xs text-zinc-400 truncate">
                {isOtherTyping ? (
                  <span className="text-indigo-400 font-medium animate-pulse">Typing...</span>
                ) : isOnline ? (
                  'Active now'
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowMeetupModal(true)}
            className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/15 h-8 text-xs bg-zinc-900/60 rounded-full shadow-sm"
          >
            <MapPin size={13} className="mr-1.5" /> Meetup
          </Button>
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

      {/* Messages Scroll Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 lg:px-8 py-4 scroll-smooth"
      >
        <div className="flex flex-col min-h-full justify-end">
          {loadingMessages ? (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="flex justify-start">
                <div className="h-10 bg-white/5 rounded-2xl w-48 rounded-bl-sm" />
              </div>
              <div className="flex justify-end">
                <div className="h-14 bg-indigo-500/10 rounded-2xl w-60 rounded-br-sm" />
              </div>
              <div className="flex justify-start">
                <div className="h-10 bg-white/5 rounded-2xl w-36 rounded-bl-sm" />
              </div>
              <div className="flex justify-end">
                <div className="h-10 bg-indigo-500/10 rounded-2xl w-52 rounded-br-sm" />
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center my-auto">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm">No messages yet</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Say hello to {otherUser?.name || 'start chatting'}! Messages are encrypted and delivered in real-time.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender._id === userId;
              
              // Grouping logic: avatar only on first or last in group
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

              const isSameSenderAsNext = nextMessage?.sender?._id === message.sender._id;
              const isLastInGroup = !isSameSenderAsNext;
              const showAvatar = isLastInGroup && !isOwn;

              // Check if date separator is needed
              let dateSeparator: string | null = null;
              if (index === 0) {
                dateSeparator = formatDateSeparator(message.createdAt);
              } else if (prevMessage) {
                const prevDate = new Date(prevMessage.createdAt).toDateString();
                const currDate = new Date(message.createdAt).toDateString();
                if (prevDate !== currDate) {
                  dateSeparator = formatDateSeparator(message.createdAt);
                }
              }

              return (
                <React.Fragment key={message._id || message.tempId || index}>
                  {dateSeparator && (
                    <div className="flex justify-center my-4 select-none">
                      <span className="text-[11px] font-medium text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md shadow-sm">
                        {dateSeparator}
                      </span>
                    </div>
                  )}
                  <MessageBubble 
                    message={message} 
                    isOwnMessage={isOwn} 
                    showAvatar={showAvatar}
                    isLastInGroup={isLastInGroup}
                  />
                </React.Fragment>
              );
            })
          )}

          {/* Real-time Typing Bubble inside chat window */}
          {isOtherTyping && (
            <div className="flex w-full mb-3 justify-start animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs mr-2.5 flex-shrink-0 self-end shadow-md">
                {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="bg-zinc-800/90 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Floating Scroll to Bottom pill */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-20 right-6 z-20 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3.5 py-2 rounded-full shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>New messages</span>
        </button>
      )}

      {/* Chat Input Bar */}
      <ChatInput conversationId={activeConversation} />
    </div>
  );
}
