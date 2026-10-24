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

    // 1. Request Screen Wake Lock (keeps display active while exercising)
    await this.acquireWakeLock();

    // 2. Start imperceptible silent audio loop to preserve background execution
    this.startSilentAudio();

    // 3. Register Lock-Screen MediaSession action handlers
    this.setupMediaSession(options.title, options.type);

    return true;
  }

  /**
   * Updates live workout metrics for lock-screen display (MediaSession metadata)
   */
  updateMetrics(metrics: ActiveWorkoutMetrics): void {
    if (!this.isRunning) return;
    this.lastMetrics = metrics;
    this.isPaused = metrics.isPaused;

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = metrics.isPaused ? 'paused' : 'playing';

        const mins = Math.floor(metrics.durationSeconds / 60);
        const secs = metrics.durationSeconds % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        // Build concise, readable lock screen summary
        const statParts: string[] = [];
        if (typeof metrics.caloriesBurned === 'number' && metrics.caloriesBurned > 0) {
          statParts.push(`${metrics.caloriesBurned} kcal`);
        }
        if (typeof metrics.distanceMeters === 'number' && metrics.distanceMeters > 0) {
          statParts.push(`${(metrics.distanceMeters / 1000).toFixed(2)} km`);
        }
        if (typeof metrics.steps === 'number' && metrics.steps > 0) {
          statParts.push(`${metrics.steps.toLocaleString()} steps`);
        }
        if (typeof metrics.speedKmh === 'number' && metrics.speedKmh > 0) {
          statParts.push(`${metrics.speedKmh.toFixed(1)} km/h`);
        }

        const statsLine = statParts.length > 0 ? statParts.join(' • ') : 'Workout in progress';

        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${metrics.title} [${timeStr}]`,
          artist: `Carbodate Workout • ${metrics.isPaused ? '⏸️ PAUSED' : '⚡ ACTIVE'}`,
          album: statsLine,
          artwork: [
            {
              src: '/favicon.svg',
              sizes: '96x96 128x128 192x192 256x256 512x512',
              type: 'image/svg+xml',
            },
          ],
        });
      } catch (err) {
        // MediaSession not supported or metadata update throttled
      }
    }
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
