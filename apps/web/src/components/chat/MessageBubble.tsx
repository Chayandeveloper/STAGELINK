import React from 'react';
import { cn } from '@/lib/utils';
import { Message, useChatStore } from '@/store/useChatStore';
import { Check, CheckCheck, Clock, AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  isLastInGroup?: boolean;
}

export function MessageBubble({ message, isOwnMessage, showAvatar = false, isLastInGroup = true }: Props) {
  const { resendMessage } = useChatStore();
  
  // Format time gracefully
  const time = React.useMemo(() => {
    try {
      const date = new Date(message.createdAt);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [message.createdAt]);

  const isError = message.status === 'error';
  const isSending = message.status === 'sending';

  return (
    <div className={cn(
      "flex w-full animate-in fade-in-50 slide-in-from-bottom-1.5 duration-200 fill-mode-both",
      isLastInGroup ? "mb-3" : "mb-1",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      {!isOwnMessage && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs mr-2.5 flex-shrink-0 self-end shadow-md">
          {message.sender?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      {!isOwnMessage && !showAvatar && <div className="w-8 mr-2.5 flex-shrink-0" />}

      <div className="flex items-end gap-2 max-w-[78%] sm:max-w-[70%]">
        {isOwnMessage && isError && (
          <button
            onClick={() => resendMessage(message._id)}
            title="Failed to send. Click to retry."
            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-full transition-colors self-center"
          >
            <RotateCcw className="w-3 h-3 animate-spin-reverse" />
            <span>Retry</span>
          </button>
        )}

        <div className={cn(
          "rounded-2xl px-4 py-2.5 relative group shadow-md transition-all duration-150",
          isOwnMessage 
            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm shadow-indigo-950/20" 
            : "bg-zinc-800/90 hover:bg-zinc-800 backdrop-blur-md text-zinc-100 rounded-bl-sm border border-white/10",
          isError && "border border-red-500/50 bg-red-950/30",
          isSending && "opacity-90"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words select-text">
            {message.content}
          </p>
          
          <div className={cn(
            "flex items-center gap-1.5 mt-1 text-[10px] select-none",
            isOwnMessage ? "justify-end text-indigo-200/80" : "justify-start text-zinc-400"
          )}>
            {time && <span>{time}</span>}
            
            {isOwnMessage && (
              <span className="flex items-center ml-0.5">
                {isSending && (
                  <Clock className="w-3 h-3 text-indigo-300 animate-pulse" />
                )}
                {message.status === 'sent' && (
                  <Check className="w-3.5 h-3.5 text-indigo-200" />
                )}
                {message.status === 'delivered' && (
                  <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />
                )}
                {message.status === 'read' && (
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-300 drop-shadow-[0_0_4px_rgba(103,232,249,0.7)]" />
                )}
                {isError && (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
