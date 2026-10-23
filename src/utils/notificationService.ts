// Notification service handling Web Notifications API & Audio Chimes

export class NotificationService {
  private static audioCtx: AudioContext | null = null;

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  static getPermissionState(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  static playCelebrationChime(): void {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, index) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.1);

        gain.gain.setValueAtTime(0, now + index * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + index * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.5);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.6);
      });
    } catch (e) {
      console.warn('Audio playback not allowed or not supported:', e);
    }
  }

  static showNotification(title: string, body: string, iconUrl?: string, onClick?: () => void): boolean {
    this.playCelebrationChime();

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: iconUrl || '/favicon.ico',
        badge: '/favicon.ico',
        tag: `bad-with-dates-${Date.now()}`,
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
      return true;
    } catch (e) {
      console.warn('Notification creation failed:', e);
      return false;
    }
  }
}
