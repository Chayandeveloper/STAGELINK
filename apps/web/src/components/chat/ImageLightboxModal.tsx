'use client';

import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';

interface Props {
  isOpen: boolean;
  imageSrc: string | null;
  caption?: string;
  senderName?: string;
  time?: string;
  onClose: () => void;
}

export function ImageLightboxModal({ isOpen, imageSrc, caption, senderName, time, onClose }: Props) {
  if (!isOpen || !imageSrc) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `stagelink-photo-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div 
        className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {senderName && (
            <span className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
              {senderName} {time ? `• ${time}` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            title="Download image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            title="Close viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div 
        className="relative max-w-4xl max-h-[85vh] flex flex-col items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageSrc}
          alt="Enlarged photo"
          className="max-w-full max-h-[78vh] object-contain rounded-2xl shadow-2xl select-none"
        />

        {caption && (
          <div className="mt-3 px-4 py-2 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md text-white text-sm max-w-lg text-center">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}
