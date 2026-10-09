'use client';

import React, { useState } from 'react';
import { X, Send, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  imageDataUrl: string | null;
  onClose: () => void;
  onSend: (imageDataUrl: string, caption?: string) => void;
}

export function ImagePreviewModal({ isOpen, imageDataUrl, onClose, onSend }: Props) {
  const [caption, setCaption] = useState('');

  if (!isOpen || !imageDataUrl) return null;

  const handleSend = () => {
    onSend(imageDataUrl, caption);
    setCaption('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950/80">
          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span>Send Photo</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="p-4 flex items-center justify-center bg-black/60 overflow-hidden min-h-[260px] max-h-[460px]">
          <img
            src={imageDataUrl}
            alt="Preview"
            className="w-full h-auto max-h-[440px] object-contain rounded-2xl shadow-lg select-none"
          />
        </div>

        {/* Caption & Actions */}
        <div className="p-4 bg-zinc-950 border-t border-white/10 space-y-3">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a message... (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            autoFocus
          />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-5 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSend}
              className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-pink-900/40 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
