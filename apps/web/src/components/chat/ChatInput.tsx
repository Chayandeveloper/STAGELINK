import React, { useState, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Paperclip, Send, Smile } from 'lucide-react';

interface Props {
  conversationId: string;
}

export function ChatInput({ conversationId }: Props) {
  const [content, setContent] = useState('');
  const { sendMessage, socket } = useChatStore();

  useEffect(() => {
    // Handle typing indicator logic
    if (content.length > 0) {
      socket?.emit('typing_start', { conversationId });
      
      const timeout = setTimeout(() => {
        socket?.emit('typing_stop', { conversationId });
      }, 2000);

      return () => clearTimeout(timeout);
    } else {
      socket?.emit('typing_stop', { conversationId });
    }
  }, [content, conversationId, socket]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    sendMessage(conversationId, content);
    setContent('');
    socket?.emit('typing_stop', { conversationId });
  };

  return (
    <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10">
      <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
        <button 
          type="button" 
          className="p-3 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/5 flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[48px] max-h-[120px]"
            rows={1}
          />
          <button 
            type="button"
            className="absolute right-3 bottom-3 text-white/50 hover:text-white transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <button 
          type="submit"
          disabled={!content.trim()}
          className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(var(--primary),0.3)] flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
