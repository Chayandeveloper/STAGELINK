import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Send, Volume2, VolumeX, Smile, Camera, Image as ImageIcon } from 'lucide-react';
import { CameraModal } from './CameraModal';
import { ImagePreviewModal } from './ImagePreviewModal';
import { compressImage } from '@/lib/imageUtils';

interface Props {
  conversationId: string;
}

export function ChatInput({ conversationId }: Props) {
  const [content, setContent] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const { sendMessage, sendImageMessage, socket, soundEnabled, toggleSound } = useChatStore();

  // Auto-resize textarea smoothly
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 140);
      textarea.style.height = `${Math.max(newHeight, 46)}px`;
    }
  }, [content]);

  // Handle typing indicator logic with debouncing
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    if (val.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socket?.emit('typing_start', { conversationId });
      }

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socket?.emit('typing_stop', { conversationId });
      }, 1500);
    } else if (isTypingRef.current) {
      isTypingRef.current = false;
      socket?.emit('typing_stop', { conversationId });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    // Send immediately via store
    sendMessage(conversationId, trimmed);
    setContent('');

    // Stop typing state immediately
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket?.emit('typing_stop', { conversationId });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }

    // Keep focus and reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = '46px';
      textareaRef.current.focus();
    }
  };

  // Handle photo picked from gallery/files
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1280, 1280, 0.82);
      setPreviewImage(compressed);
    } catch (err) {
      console.error('Failed to process image file:', err);
    } finally {
      // Reset input value so user can select the same image again if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendPhoto = (imageDataUrl: string, caption?: string) => {
    sendImageMessage(conversationId, imageDataUrl, caption);
  };

  // Cleanup typing on unmount or conversation change
  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        socket?.emit('typing_stop', { conversationId });
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [conversationId, socket]);

  return (
    <>
      <div className="p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 shrink-0 z-20">
        <form onSubmit={handleSend} className="flex items-end gap-1.5 sm:gap-2 max-w-4xl mx-auto">
          {/* Sound chime toggle */}
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
            className={`p-2.5 rounded-full transition-all duration-200 flex-shrink-0 ${
              soundEnabled
                ? 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20'
                : 'text-zinc-500 hover:text-zinc-300 bg-white/5 hover:bg-white/10'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Instagram Camera Button */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            title="Take photo with Camera (Instagram style)"
            className="p-2.5 rounded-full text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 transition-all duration-200 flex-shrink-0 active:scale-95"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Gallery / Photos Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Share photo from gallery"
            className="p-2.5 rounded-full text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all duration-200 flex-shrink-0 active:scale-95"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Hidden File Input for Gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Message Text Input */}
          <div className="flex-1 relative flex items-center min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
              className="w-full bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.08] border border-white/10 focus:border-indigo-500/50 rounded-2xl pl-3.5 sm:pl-4 pr-9 sm:pr-10 py-2.5 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none transition-all duration-150 leading-relaxed min-h-[46px] max-h-[140px]"
              rows={1}
            />

            <button
              type="button"
              className="absolute right-2.5 sm:right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              title="Emoji"
              onClick={() => setContent((prev) => prev + ' 😊')}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!content.trim()}
            title="Send message"
            className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-full transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.35)] active:scale-95 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Instagram Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureAndSend={handleSendPhoto}
      />

      {/* Gallery Photo Preview Modal */}
      <ImagePreviewModal
        isOpen={Boolean(previewImage)}
        imageDataUrl={previewImage}
        onClose={() => setPreviewImage(null)}
        onSend={handleSendPhoto}
      />
    </>
  );
}

