import React from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/store/useChatStore';
import { Check, CheckCheck } from 'lucide-react';

interface Props {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isOwnMessage, showAvatar = false }: Props) {
  // Format time (e.g. 10:42 AM)
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={cn(
      "flex w-full mb-4",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      {!isOwnMessage && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm mr-2 flex-shrink-0 self-end">
          {message.sender?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      {!isOwnMessage && !showAvatar && <div className="w-10" />}

      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-2.5 relative group shadow-sm",
        isOwnMessage 
          ? "bg-primary text-primary-foreground rounded-br-sm" 
          : "bg-white/10 backdrop-blur-md text-white rounded-bl-sm border border-white/5"
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap word-break-words">{message.content}</p>
        
        <div className={cn(
          "flex items-center gap-1 mt-1 text-[10px]",
          isOwnMessage ? "justify-end text-primary-foreground/70" : "justify-start text-white/40"
        )}>
          <span>{time}</span>
          {isOwnMessage && (
            <span className="ml-1">
              {message.status === 'sent' && <Check className="w-3.5 h-3.5" />}
              {message.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5" />}
              {message.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-blue-300 drop-shadow-[0_0_2px_rgba(147,197,253,0.5)]" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
