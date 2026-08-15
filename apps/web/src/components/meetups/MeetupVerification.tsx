'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Loader2, QrCode, Scan, CheckCircle2, Users } from 'lucide-react';
import api from '@/lib/api';
import io from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Success Popup ────────────────────────────────────────────────────────────
function SuccessPopup({ name, onClose }: { name?: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" style={{ animation: 'fade-in 0.2s ease both' }}>
      <div
        className="relative bg-zinc-900 border border-green-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl shadow-green-500/10"
        style={{ animation: 'popup-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div className="absolute inset-0 rounded-2xl bg-green-500/5 pointer-events-none" />

        {/* Animated check circle */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="absolute w-24 h-24 rounded-full bg-green-500/10 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="relative w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
        </div>

        {/* Confetti strip */}
        <div className="flex justify-center gap-3 text-2xl mb-4">
          {['🎉', '🤝', '🎊'].map((emoji, i) => (
            <span key={emoji} style={{ display: 'inline-block', animation: `bounce 0.6s ${0.1 + i * 0.1}s both` }}>{emoji}</span>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Meetup Verified!</h2>
        <p className="text-zinc-400 text-sm mb-6">
          {name
            ? `You and ${name} have successfully met. Enjoy your time together!`
            : 'Your meetup has been verified successfully. Enjoy your time!'}
        </p>

        <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold">
          <Users className="w-4 h-4 mr-2" /> Awesome!
        </Button>

        {/* Auto-dismiss progress bar */}
        <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full" style={{ animation: 'shrink 4s linear forwards' }} />
        </div>
        <p className="text-xs text-zinc-600 mt-1">Closes automatically…</p>
      </div>

      <style>{`
        @keyframes popup-in {
          0%   { opacity: 0; transform: scale(0.7) translateY(30px); }
          100% { opacity: 1; transform: scale(1)  translateY(0);     }
        }
        @keyframes shrink {
          0%   { width: 100%; }
          100% { width: 0%;   }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);    }
          50%       { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

interface MeetupVerificationProps {
  meetupId: string;
  onVerified: () => void;
}

export function MeetupVerification({ meetupId, onVerified }: MeetupVerificationProps) {
  const [mode, setMode] = useState<'idle' | 'generate' | 'scan'>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [otherPersonName, setOtherPersonName] = useState<string | undefined>();
  const { user } = useAuthStore();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Setup socket connection
    const defaultUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : '';
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || defaultUrl;
    const socket = io(socketUrl, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socket.on('verification_request_received', async (data: { meetupId: string; scannerId: string; scannerName?: string }) => {
      if (data.meetupId === meetupId) {
        try {
          setLoading(true);
          await api.post(`/meetups/${meetupId}/qr/confirm`);
          setOtherPersonName(data.scannerName);
          setMode('idle');
          setShowSuccess(true);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Error confirming verification');
        } finally {
          setLoading(false);
        }
      }
    });

    socket.on('meetup_verified', (data: { meetupId: string; verifiedByName?: string }) => {
      if (data.meetupId === meetupId) {
        setOtherPersonName(data.verifiedByName);
        setShowSuccess(true);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [meetupId, onVerified]);

  useEffect(() => {
    if (timeLeft > 0 && mode === 'generate') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && mode === 'generate' && token) {
      setToken(null);
      setError('QR code expired. Please generate a new one.');
    }
  }, [timeLeft, mode, token]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`/meetups/${meetupId}/qr/generate`);
      setToken(res.data.qrToken);
      setTimeLeft(120); // 2 minutes
      setMode('generate');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate QR');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = () => {
    setMode('scan');
    setError(null);
  };

  useEffect(() => {
    if (mode === 'scan') {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [mode]);

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.pause(true);
    }
    try {
      setLoading(true);
      setError(null);
      await api.post(`/meetups/${meetupId}/qr/scan`, { token: decodedText });
      setMode('idle');
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to scan QR');
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error: any) => {
    // Ignore frequent scan failures (no QR found)
  };

  if (loading && mode !== 'scan') {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onVerified();
  };

  return (
    <>
      {showSuccess && (
        <SuccessPopup name={otherPersonName} onClose={handleSuccessClose} />
      )}

      <div className="w-full flex flex-col items-center p-4 bg-zinc-950 rounded-xl border border-zinc-800">
      <h3 className="text-lg font-bold text-white mb-4">Secure Verification</h3>
      
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg mb-4 text-center w-full">
          {error}
        </div>
      )}

      {mode === 'idle' && (
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button onClick={handleGenerate} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            <QrCode className="w-4 h-4 mr-2" /> Show QR
          </Button>
          <Button onClick={startScanner} variant="outline" className="flex-1 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10">
            <Scan className="w-4 h-4 mr-2" /> Scan QR
          </Button>
        </div>
      )}

      {mode === 'generate' && token && (
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl mb-4">
            <QRCodeSVG value={token} size={200} />
          </div>
          <p className="text-sm text-zinc-400 mb-2">Have your partner scan this code.</p>
          <p className="text-xs text-indigo-400 font-mono">Expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
          
          <Button onClick={() => setMode('idle')} variant="ghost" className="mt-4 text-zinc-400">
            Cancel
          </Button>
        </div>
      )}

      {mode === 'scan' && (
        <div className="w-full max-w-sm flex flex-col items-center">
          <div id="qr-reader" className="w-full overflow-hidden rounded-xl border border-zinc-800"></div>
          
          <Button onClick={() => setMode('idle')} variant="ghost" className="mt-4 text-zinc-400">
            Cancel
          </Button>
        </div>
      )}
    </div>
    </>
  );
}
