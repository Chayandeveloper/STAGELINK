'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Send, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/imageUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCaptureAndSend: (imageDataUrl: string, caption?: string) => void;
}

export function CameraModal({ isOpen, onClose, onCaptureAndSend }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);

  // Initialize camera stream
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this device/browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera permissions in your browser or select a photo from your files.'
          : 'Could not access camera. You can still take or select a photo using the file picker.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage, facingMode]);

  // Flip camera (Front <-> Rear)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame from video stream
  const handleSnap = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // If front camera, mirror image for natural selfie feel
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.88);

      // Compress photo for smooth socket transmission
      const compressed = await compressImage(
        await (await fetch(rawDataUrl)).blob(),
        1280,
        1280,
        0.82
      );

      setCapturedImage(compressed);
      stopCamera();
    } catch (err) {
      console.error('Snap photo error:', err);
    }
  };

  // Fallback native photo capture
  const handleNativeFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1280, 1280, 0.82);
      setCapturedImage(compressed);
    } catch (err) {
      console.error('Failed to compress native camera file:', err);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCaption('');
    startCamera(facingMode);
  };

  const handleSend = () => {
    if (!capturedImage) return;
    onCaptureAndSend(capturedImage, caption);
    setCapturedImage(null);
    setCaption('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Top Control Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-2 text-white text-xs font-semibold">
            <Camera className="w-4 h-4 text-pink-400" />
            <span>Camera</span>
          </div>

          <div className="flex items-center gap-2">
            {!capturedImage && !cameraError && (
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Flip camera"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:rotate-180 duration-300"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Captured Photo Area */}
        <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-black flex items-center justify-center overflow-hidden">
          {/* Flash Effect */}
          {isFlashActive && (
            <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-150 pointer-events-none" />
          )}

          {capturedImage ? (
            /* Review Captured Photo */
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain max-h-[520px] select-none"
            />
          ) : cameraError ? (
            /* Fallback Screen if Camera Access is Denied/Unavailable */
            <div className="p-6 text-center max-w-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-white font-bold text-base">Camera Unavailable</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">{cameraError}</p>

              <div className="pt-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-semibold px-5 py-2.5 shadow-lg shadow-pink-900/30"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take or Select Photo
                </Button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {/* Hidden Native File Input Fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleNativeFileCapture}
          />
        </div>

        {/* Bottom Shutter & Action Bar */}
        <div className="p-4 bg-zinc-950/95 border-t border-white/10 shrink-0">
          {capturedImage ? (
            /* Controls after snapping */
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption... (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetake}
                  className="flex-1 py-5 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleSend}
                  className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-pink-900/40 cursor-pointer active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Photo</span>
                </Button>
              </div>
            </div>
          ) : !cameraError ? (
            /* Camera Shutter Bar (Instagram Style) */
            <div className="flex items-center justify-around py-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-zinc-400 hover:text-white flex flex-col items-center gap-1 transition"
                title="Use device gallery"
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-zinc-300" />
                </div>
                <span className="text-[10px]">Gallery</span>
              </button>

              {/* Iconic Center Shutter Button */}
              <button
                type="button"
                onClick={handleSnap}
                className="w-18 h-18 rounded-full border-4 border-white/90 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer shadow-2xl shadow-white/20"
                title="Take photo"
                aria-label="Capture photo"
              >
                <div className="w-full h-full rounded-full bg-white hover:bg-zinc-100 transition-colors" />
              </button>

              <button
                type="button"
                onClick={toggleFacingMode}
                className="text-xs text-zinc-400 hover:text-white flex flex-col items-center gap-1 transition"
                title="Flip camera"
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-zinc-300" />
                </div>
                <span className="text-[10px]">Flip</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white text-xs">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
