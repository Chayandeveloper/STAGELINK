import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Message, useChatStore } from '@/store/useChatStore';
import { Check, CheckCheck, Clock, AlertCircle, RotateCcw, ZoomIn } from 'lucide-react';
import { ImageLightboxModal } from './ImageLightboxModal';

interface Props {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  isLastInGroup?: boolean;
}

export function MessageBubble({ message, isOwnMessage, showAvatar = false, isLastInGroup = true }: Props) {
  const { resendMessage } = useChatStore();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
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

  // Check if message is an image
  const isImageMessage = 
    message.messageType === 'image' || 
    Boolean(message.image) || 
    message.content.startsWith('data:image/') ||
    message.content.includes('|||CAPTION|||');

  let imageSrc = '';
  let captionText = '';

  if (isImageMessage) {
    if (message.content.includes('|||CAPTION|||')) {
      const parts = message.content.split('|||CAPTION|||');
      imageSrc = parts[0];
      captionText = parts.slice(1).join('|||CAPTION|||');
    } else if (message.image) {
      imageSrc = message.image;
      if (message.content !== message.image && !message.content.startsWith('data:image/')) {
        captionText = message.content;
      }
    } else {
      imageSrc = message.content;
    }
  }

  return (
    <>
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

        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[72%]">
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

          {isImageMessage ? (
            /* Instagram-Style Image Bubble */
            <div 
              onClick={() => setIsLightboxOpen(true)}
              className={cn(
                "relative rounded-2xl overflow-hidden cursor-pointer group shadow-lg transition-transform active:scale-[0.99] border border-white/10",
                isOwnMessage ? "rounded-br-sm bg-indigo-950/40" : "rounded-bl-sm bg-zinc-900/60",
                isError && "border-2 border-red-500/50 bg-red-950/30",
                isSending && "opacity-90"
              )}
            >
              <div className="relative overflow-hidden bg-black/50 max-w-[280px] sm:max-w-[340px]">
                <img 
                  src={imageSrc} 
                  alt="Shared photo" 
                  className="w-full h-auto max-h-[420px] object-cover transition-transform duration-300 group-hover:scale-[1.02] select-none"
                  loading="lazy"
                />
                
                {/* Instagram Hover Zoom Aura */}
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md rounded-full p-2.5 text-white shadow-xl">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Optional Caption */}
              {captionText && (
                <div className={cn(
                  "px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
                  isOwnMessage ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white" : "bg-zinc-800 text-zinc-100"
                )}>
                  {captionText}
                </div>
              )}

              {/* Time & Read Receipts */}
              <div className={cn(
                "flex items-center gap-1.5 text-[10px] select-none",
                captionText 
                  ? (isOwnMessage ? "justify-end px-3 pb-2 bg-gradient-to-br from-indigo-600 to-indigo-700 text-indigo-200/90" : "justify-start px-3 pb-2 bg-zinc-800 text-zinc-400")
                  : "absolute bottom-2 right-2 bg-black/65 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white/95 shadow-md border border-white/10"
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
          ) : (
            /* Regular Text Message Bubble */
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
          )}
        </div>
      </div>

      {/* Fullscreen Photo Lightbox */}
      {isImageMessage && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          imageSrc={imageSrc}
          caption={captionText}
          senderName={message.sender?.name}
          time={time}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
}

