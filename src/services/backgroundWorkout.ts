/**
 * Background Workout Manager & MediaSession Controller
 * Enables PWAs to continue calculating metrics, keep JS execution alive when
 * phone screen is turned off, and display live lock-screen controls (Play / Pause).
 */

export interface ActiveWorkoutMetrics {
  title: string;
  type: string;
  durationSeconds: number;
  caloriesBurned: number;
  distanceMeters?: number;
  steps?: number;
  speedKmh?: number;
  paceMinPerKm?: string;
  isPaused: boolean;
  notes?: string;
}

class BackgroundWorkoutManager {
  private wakeLock: any = null;
  private audioElement: HTMLAudioElement | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private onPauseCallback: (() => void) | null = null;
  private onResumeCallback: (() => void) | null = null;
  private onStopCallback: (() => void) | null = null;
  private lastMetrics: ActiveWorkoutMetrics | null = null;
  private swMessageAttached: boolean = false;

  /**
   * Initializes silent background audio loop and requests Screen Wake Lock.
   * Mobile browsers (iOS Safari & Android Chrome) keep background JS timers alive
   * as long as an active audio pipeline is playing.
   */
  async startWorkout(options: {
    title: string;
    type: string;
    onPause: () => void;
    onResume: () => void;
    onStop?: () => void;
  }): Promise<boolean> {
    this.isRunning = true;
    this.isPaused = false;
    this.onPauseCallback = options.onPause;
    this.onResumeCallback = options.onResume;
    this.onStopCallback = options.onStop || null;

    // Attach service worker message listener for notification bar action clicks
    this.setupServiceWorkerListener();

    // Request Notification permission silently if not already asked
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted' && this.lastMetrics) {
          this.updateMetrics(this.lastMetrics);
        }
      } catch {}
    }

    // 1. Request Screen Wake Lock (keeps display active while exercising)
    await this.acquireWakeLock();

    // 2. Start imperceptible silent audio loop to preserve background execution
    this.startSilentAudio();

    // 3. Register Lock-Screen MediaSession action handlers
    this.setupMediaSession(options.title, options.type);

    // 4. Immediately initialize and display ongoing notification card in notification shade & lockscreen
    this.updateMetrics({
      title: options.title,
      type: options.type,
      durationSeconds: 0,
      caloriesBurned: 0,
      distanceMeters: 0,
      steps: 0,
      speedKmh: 0,
      paceMinPerKm: '--:--',
      isPaused: false,
    });

    return true;
  }

  /**
   * Updates live workout metrics for lock-screen & notification bar display
   */
  updateMetrics(metrics: ActiveWorkoutMetrics): void {
    if (!this.isRunning) return;
    this.lastMetrics = metrics;
    this.isPaused = metrics.isPaused;

    const mins = Math.floor(metrics.durationSeconds / 60);
    const secs = metrics.durationSeconds % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const distStr = metrics.distanceMeters !== undefined && metrics.distanceMeters > 0
      ? `${(metrics.distanceMeters / 1000).toFixed(2)} km`
      : '0.00 km';
    const paceStr = metrics.paceMinPerKm || '--:--';
    const speedStr = metrics.speedKmh ? `${metrics.speedKmh.toFixed(1)} km/h` : '0.0 km/h';
    const calStr = `${metrics.caloriesBurned} kcal`;

    // 1. Native Mobile MediaSession (Lock Screen & Notification Shade Player)
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = metrics.isPaused ? 'paused' : 'playing';

        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${metrics.title} • ${distStr}`,
          artist: `${timeStr} • Pace: ${paceStr} • ${calStr}`,
          album: `${speedStr} • ${metrics.isPaused ? '⏸️ PAUSED' : '⚡ ACTIVE'}`,
          artwork: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        });
      } catch (err) {
        // MediaSession not supported or throttled
      }
    }

    // 2. Silent Persistent Ongoing Notification Bar Card (Like Strava)
    this.updateNotificationBar(metrics, timeStr, distStr, paceStr, calStr, speedStr);
  }

  /**
   * Updates or maintains a silent ongoing notification in the system notification shade
   */
  private async updateNotificationBar(
    metrics: ActiveWorkoutMetrics,
    timeStr: string,
    distStr: string,
    paceStr: string,
    calStr: string,
    speedStr: string
  ): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration || !registration.showNotification) {
          registration = await navigator.serviceWorker.ready;
        }
        if (registration && registration.showNotification) {
          const statusPrefix = metrics.isPaused ? '⏸️ PAUSED' : '⚡ RECORDING';
          const bodyText = `${distStr} • Pace: ${paceStr} • ${calStr} • ${speedStr}`;

          await registration.showNotification(`${metrics.title} • ${timeStr} (${statusPrefix})`, {
            body: bodyText,
            icon: '/pwa-192x192.png',
            badge: '/favicon.svg',
            tag: 'carbodate-live-workout-tracker', // Replaces notification silently in-place
            silent: true,                         // Absolutely NO beep, sound, or vibrate
            renotify: false,                      // NO drop-down heads-up alert banner
            requireInteraction: false,
            // Ongoing is supported by Chrome and Chromium browsers on mobile devices
            ongoing: true as any,
            actions: [
              {
                action: metrics.isPaused ? 'workout-resume' : 'workout-pause',
                title: metrics.isPaused ? '▶️ Resume' : '⏸️ Pause',
              },
            ],
          } as any);
        }
      }
    } catch {
      // Notification API silently fallback
    }
  }

  /**
   * Clears the ongoing notification from the notification shade
   */
  private async clearNotificationBar(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const notifications = await reg.getNotifications({ tag: 'carbodate-live-workout-tracker' });
      notifications.forEach((n) => n.close());
    } catch {}
  }

  private setupServiceWorkerListener(): void {
    if (this.swMessageAttached || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    this.swMessageAttached = true;
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'WORKOUT_NOTIFICATION_ACTION') {
        if (event.data.action === 'pause') {
          this.pauseWorkout();
          if (this.onPauseCallback) this.onPauseCallback();
        } else if (event.data.action === 'resume') {
          this.resumeWorkout();
          if (this.onResumeCallback) this.onResumeCallback();
        }
      }
    });
  }

  /**
   * Pauses the background audio and lock screen state
   */
  pauseWorkout(): void {
    this.isPaused = true;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  /**
   * Resumes the background audio and lock screen state
   */
  resumeWorkout(): void {
    this.isPaused = false;
    if (this.audioElement) {
      this.audioElement.play().catch(() => {});
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
  }

  /**
   * Stops background session and releases all lock screen resources
   */
  stopWorkout(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.onPauseCallback = null;
    this.onResumeCallback = null;
    this.onStopCallback = null;
    this.lastMetrics = null;

    this.releaseWakeLock();
    this.clearNotificationBar();

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.src = '';
        this.audioElement.remove();
      } catch {}
      this.audioElement = null;
    }

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
      } catch {}
    }
  }

  // --- Internal implementation helpers ---

  private async acquireWakeLock(): Promise<void> {
    if ('wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (err) {
        console.warn('Wake Lock request could not be granted:', err);
      }
    }
  }

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
  }

  private startSilentAudio(): void {
    try {
      if (!this.audioElement) {
        this.audioElement = document.createElement('audio');
        this.audioElement.setAttribute('playsinline', '');
        this.audioElement.setAttribute('webkit-playsinline', '');
        this.audioElement.loop = true;
        this.audioElement.preload = 'auto';
        // Base64 encoding of a 1-second 8kHz silent WAV file
        this.audioElement.src =
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      }

      this.audioElement.play().catch((err) => {
        // May require direct user tap gesture, safely handled on start button
        console.warn('Silent background audio autostart notice:', err);
      });
    } catch (e) {
      console.warn('Background audio initialization error:', e);
    }
  }

  private setupMediaSession(title: string, type: string): void {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.playbackState = 'playing';

      navigator.mediaSession.setActionHandler('play', () => {
        this.resumeWorkout();
        if (this.onResumeCallback) {
          this.onResumeCallback();
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.pauseWorkout();
        if (this.onPauseCallback) {
          this.onPauseCallback();
        }
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        if (this.onStopCallback) {
          this.onStopCallback();
        } else if (this.onPauseCallback) {
          this.onPauseCallback();
        }
      });
    } catch (e) {
      console.warn('MediaSession action handler setup notice:', e);
    }
  }
}

export const backgroundWorkout = new BackgroundWorkoutManager();

