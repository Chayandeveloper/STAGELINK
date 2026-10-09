/**
 * Sound Utility for StageLink Chat
 * Uses Web Audio API for zero-latency, high-fidelity, reliable synthesized sound effects.
 * No external audio files required, zero network delays, works across all modern browsers.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private lastNotificationTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('stagelink_chat_sound_enabled');
      this.soundEnabled = stored === null ? true : stored === 'true';

      // Auto-unlock AudioContext on first user interaction to comply with browser autoplay policies
      const unlock = () => {
        this.initContext();
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };

      window.addEventListener('click', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
      window.addEventListener('touchstart', unlock, { once: true, passive: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('stagelink_chat_sound_enabled', enabled ? 'true' : 'false');
    }
  }

  public toggle(): boolean {
    const newState = !this.soundEnabled;
    this.setEnabled(newState);
    if (newState) {
      // Play a quick preview chime so user knows sound is enabled
      this.playNotificationSound();
    }
    return newState;
  }

  /**
   * Plays a crisp, melodic 2-tone incoming message notification chime.
   * Tone 1: 587.33 Hz (D5) -> Tone 2: 880 Hz (A5)
   * Warm, pleasant acoustic envelope.
   */
  public playNotificationSound(): void {
    if (!this.soundEnabled) return;

    // Rate limit: prevent audio overload if multiple messages arrive in quick succession
    const now = Date.now();
    if (now - this.lastNotificationTime < 180) return;
    this.lastNotificationTime = now;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const nowTime = ctx.currentTime;

      // Master output node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.3, nowTime);
      masterGain.connect(ctx.destination);

      // Note 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, nowTime);

      gain1.gain.setValueAtTime(0, nowTime);
      gain1.gain.linearRampToValueAtTime(0.6, nowTime + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.35);

      osc1.connect(gain1);
      gain1.connect(masterGain);

      // Note 2: 880.00 Hz (A5) - starts with slight 90ms offset for harmonic sparkle
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, nowTime + 0.09);

      gain2.gain.setValueAtTime(0, nowTime + 0.09);
      gain2.gain.linearRampToValueAtTime(0.8, nowTime + 0.105);
      gain2.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.55);

      osc2.connect(gain2);
      gain2.connect(masterGain);

      // Start and stop
      osc1.start(nowTime);
      osc1.stop(nowTime + 0.38);

      osc2.start(nowTime + 0.09);
      osc2.stop(nowTime + 0.58);
    } catch (e) {
      console.warn('Notification audio playback failed:', e);
    }
  }

  /**
   * Plays a subtle, tactile 'pop' sound when sending a message.
   * Quick pitch slide giving instant physical confirmation.
   */
  public playSentSound(): void {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const nowTime = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, nowTime);
      osc.frequency.exponentialRampToValueAtTime(880, nowTime + 0.045);

      gain.gain.setValueAtTime(0.12, nowTime);
      gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(nowTime);
      osc.stop(nowTime + 0.065);
    } catch (e) {
      console.warn('Sent audio playback failed:', e);
    }
  }
}

export const soundManager = new SoundManager();
