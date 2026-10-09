import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Send, Smile, Camera, Image as ImageIcon, Heart } from 'lucide-react';
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

  const { sendMessage, sendImageMessage, socket } = useChatStore();

  // Auto-resize textarea smoothly (compact Instagram style)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 100);
      textarea.style.height = `${Math.max(newHeight, 22)}px`;
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
      textareaRef.current.style.height = '22px';
      textareaRef.current.focus();
    }
  };

  // Handle quick heart like Instagram DM
  const handleSendHeart = () => {
    sendMessage(conversationId, '❤️');
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

  const hasText = content.trim().length > 0;

  return (
    <>
      <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-zinc-950/95 backdrop-blur-xl border-t border-white/5 shrink-0 z-20">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto w-full">
          {/* Instagram Left Camera Button */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            title="Camera"
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Hidden File Input for Gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Instagram Center Capsule Pill */}
          <div className="flex-1 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/80 focus-within:border-zinc-700 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 sm:gap-2 transition-all min-h-[40px]">
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
              placeholder="Message..."
              rows={1}
              className="flex-1 bg-transparent border-0 text-sm text-white placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed py-1 px-1 min-h-[22px] max-h-[100px]"
            />

            {/* Gallery Photo Button (inside pill) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Photos & Gallery"
              className="text-zinc-400 hover:text-white p-1 rounded-full transition-colors shrink-0 active:scale-90 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Emoji Button (inside pill) */}
            <button
              type="button"
              className="text-zinc-400 hover:text-white p-1 rounded-full transition-colors shrink-0 active:scale-90 cursor-pointer"
              title="Emoji"
              onClick={() => setContent((prev) => prev + ' 😊')}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action: Send Button when typing, Heart when empty (like Instagram DM) */}
          {hasText ? (
            <button
              type="submit"
              title="Send message"
              className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-all cursor-pointer animate-in zoom-in-75 duration-150"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendHeart}
              title="Send a like"
              className="w-9 h-9 rounded-full text-zinc-400 hover:text-pink-500 hover:bg-pink-500/10 flex items-center justify-center shrink-0 active:scale-90 transition-all cursor-pointer"
            >
              <Heart className="w-5 h-5 fill-pink-500/30 text-pink-500" />
            </button>
          )}
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

