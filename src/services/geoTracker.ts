import { ActivityType, RoutePoint, SplitRecord } from '../types';
import {
  calculateStrideLengthMeters,
  filterGpsPoints,
  formatPace,
  haversineDistanceMeters,
} from './calculations';

export interface TrackerState {
  status: 'idle' | 'tracking' | 'paused' | 'finished';
  activityType: ActivityType;
  distanceMeters: number;
  durationSeconds: number;
  elevationGainMeters: number;
  currentSpeedKmh: number;
  currentPaceSecPerKm: number;
  steps: number;
  cadenceSpm: number;
  routePoints: RoutePoint[];
  splits: SplitRecord[];
  isAutoPaused: boolean;
  wakeLockActive: boolean;
  gpsSignal: 'searching' | 'locked' | 'error' | 'simulated';
  gpsAccuracyMeters?: number;
  errorMessage?: string;
}

export type TrackerUpdateListener = (state: TrackerState) => void;

export class GeoTrackerService {
  private watchId: number | null = null;
  private timerId: number | null = null;
  private simTimerId: number | null = null;
  private wakeLockSentinel: any = null;

  private state: TrackerState = {
    status: 'idle',
    activityType: 'running',
    distanceMeters: 0,
    durationSeconds: 0,
    elevationGainMeters: 0,
    currentSpeedKmh: 0,
    currentPaceSecPerKm: 0,
    steps: 0,
    cadenceSpm: 0,
    routePoints: [],
    splits: [],
    isAutoPaused: false,
    wakeLockActive: false,
    gpsSignal: 'searching',
  };

  private listeners: Set<TrackerUpdateListener> = new Set();
  private autoPauseThresholdSec = 6;
  private stationaryCounter = 0;
  private currentSplitStartMeters = 0;
  private currentSplitStartTime = 0;
  private currentSplitStartElevation = 0;
  private lastAltitude: number | null = null;
  private userHeightCm: number = 175;

  // Step detection accelerometer state
  private lastAccelTime = 0;
  private lastAccelMagnitude = 9.8;
  private recentStepTimestamps: number[] = [];

  // Simulator route for indoor / desktop testing
  private simIndex = 0;
  private isSimulated = false;

  // Wall-clock tracking for screen-off and background persistence
  private startTimeMs: number | null = null;
  private totalPausedMs: number = 0;
  private pauseStartTimeMs: number | null = null;
  private visibilityListenerAttached: boolean = false;

  public subscribe(listener: TrackerUpdateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn({ ...this.state }));
  }

  public getState(): TrackerState {
    return { ...this.state };
  }

  public setActivityType(type: ActivityType): void {
    this.state.activityType = type;
    this.notify();
  }

  public setUserHeight(heightCm: number): void {
    if (heightCm && heightCm > 100) {
      this.userHeightCm = heightCm;
    }
  }

  // Request Screen Wake Lock so screen doesn't turn off while exercising
  public async requestWakeLock(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.state.wakeLockActive = true;
        this.wakeLockSentinel.addEventListener('release', () => {
          this.state.wakeLockActive = false;
          this.notify();
        });
        this.notify();
        return true;
      } catch (err) {
        console.warn('Wake Lock request error:', err);
      }
    }
    return false;
  }

  public async releaseWakeLock(): Promise<void> {
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      } catch (err) {
        console.warn('Wake Lock release error:', err);
      }
      this.state.wakeLockActive = false;
      this.notify();
    }
  }

  // Reset to initial clean idle state
  public reset(type?: ActivityType): void {
    this.stopNativeGeolocation();
    this.stopSimulation();
    this.stopTimer();
    this.stopStepSensor();
    this.startTimeMs = null;
    this.totalPausedMs = 0;
    this.pauseStartTimeMs = null;

    this.state = {
      status: 'idle',
      activityType: type || this.state.activityType,
      distanceMeters: 0,
      durationSeconds: 0,
      elevationGainMeters: 0,
      currentSpeedKmh: 0,
      currentPaceSecPerKm: 0,
      steps: 0,
      cadenceSpm: 0,
      routePoints: [],
      splits: [],
      isAutoPaused: false,
      wakeLockActive: false,
      gpsSignal: 'searching',
    };
    this.currentSplitStartMeters = 0;
    this.currentSplitStartTime = 0;
    this.currentSplitStartElevation = 0;
    this.lastAltitude = null;
    this.stationaryCounter = 0;
    this.recentStepTimestamps = [];
    this.notify();
  }

  // Start tracking explicitly upon user action
  public async start(type?: ActivityType, simulated: boolean = false, heightCm?: number): Promise<void> {
    if (heightCm) this.setUserHeight(heightCm);
    if (type) this.state.activityType = type;
    this.isSimulated = simulated;
    this.startTimeMs = Date.now();
    this.totalPausedMs = 0;
    this.pauseStartTimeMs = null;

    this.state = {
      status: 'tracking',
      activityType: type || this.state.activityType,
      distanceMeters: 0,
      durationSeconds: 0,
      elevationGainMeters: 0,
      currentSpeedKmh: 0,
      currentPaceSecPerKm: 0,
      steps: 0,
      cadenceSpm: 0,
      routePoints: [],
      splits: [],
      isAutoPaused: false,
      wakeLockActive: false,
      gpsSignal: simulated ? 'simulated' : 'searching',
    };
    this.currentSplitStartMeters = 0;
    this.currentSplitStartTime = 0;
    this.currentSplitStartElevation = 0;
    this.lastAltitude = null;
    this.stationaryCounter = 0;
    this.recentStepTimestamps = [];

    await this.requestWakeLock();
    this.startTimer();
    this.startStepSensor();

    if (simulated || !navigator.geolocation) {
      this.startSimulation();
    } else {
      this.startNativeGeolocation();
    }

    this.notify();
  }

  // Pause explicitly
  public pause(): void {
    if (this.state.status === 'tracking') {
      this.state.status = 'paused';
      this.pauseStartTimeMs = Date.now();
      this.stopTimer();
      this.notify();
    }
  }

  // Resume explicitly
  public resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'tracking';
      this.state.isAutoPaused = false;
      this.stationaryCounter = 0;
      if (this.pauseStartTimeMs) {
        this.totalPausedMs += Date.now() - this.pauseStartTimeMs;
        this.pauseStartTimeMs = null;
      }
      this.startTimer();
      this.notify();
    }
  }

  // Manual Lap recording feature requested by user
  public addManualLap(): SplitRecord {
    const currentDist = this.state.distanceMeters;
    const currentTime = this.state.durationSeconds;
    const currentElevation = this.state.elevationGainMeters;

    const lapDist = Math.max(0, currentDist - this.currentSplitStartMeters);
    const lapTimeSec = Math.max(1, currentTime - this.currentSplitStartTime);
    const lapElevation = Math.max(0, Math.round(currentElevation - this.currentSplitStartElevation));
    const lapPaceSec = lapDist > 0 ? (lapTimeSec / lapDist) * 1000 : 0;

    const lapNumber = this.state.splits.length + 1;
    const lapRecord: SplitRecord = {
      km: Math.round((currentDist / 1000) * 100) / 100 || lapNumber,
      durationSeconds: lapTimeSec,
      paceMinPerKm: formatPace(lapPaceSec),
      elevationGainMeters: lapElevation,
    };

    this.state.splits = [...this.state.splits, lapRecord];
    this.currentSplitStartMeters = currentDist;
    this.currentSplitStartTime = currentTime;
    this.currentSplitStartElevation = currentElevation;

    this.notify();
    return lapRecord;
  }

  // Finish activity & summarize final splits
  public async finish(): Promise<TrackerState> {
    this.stopNativeGeolocation();
    this.stopSimulation();
    this.stopTimer();
    this.stopStepSensor();
    await this.releaseWakeLock();

    // Check if there is an unfinalized final split (> 150m)
    const finalDist = this.state.distanceMeters;
    const splitDelta = finalDist - this.currentSplitStartMeters;
    if (splitDelta > 150) {
      const splitTimeSec = this.state.durationSeconds - this.currentSplitStartTime;
      const paceSec = splitDelta > 0 ? (splitTimeSec / splitDelta) * 1000 : 0;
      this.state.splits.push({
        km: Math.round((finalDist / 1000) * 10) / 10,
        durationSeconds: splitTimeSec,
        paceMinPerKm: formatPace(paceSec),
        elevationGainMeters: Math.max(0, Math.round(this.state.elevationGainMeters - this.currentSplitStartElevation)),
      });
    }

    this.state.status = 'finished';
    this.notify();
    return { ...this.state };
  }

  private syncWallClockTime(): void {
    if (this.state.status === 'tracking' && !this.state.isAutoPaused && this.startTimeMs) {
      const now = Date.now();
      const effectiveNow = this.pauseStartTimeMs ? this.pauseStartTimeMs : now;
      this.state.durationSeconds = Math.max(
        0,
        Math.floor((effectiveNow - this.startTimeMs - this.totalPausedMs) / 1000)
      );

      // Recalculate average pace
      if (this.state.distanceMeters > 30) {
        this.state.currentPaceSecPerKm =
          (this.state.durationSeconds / this.state.distanceMeters) * 1000;
      }

      // Clean up old step timestamps older than 6 seconds to maintain live cadence
      this.recentStepTimestamps = this.recentStepTimestamps.filter((t) => now - t <= 6000);
      if (this.state.activityType !== 'cycling') {
        this.state.cadenceSpm = Math.round((this.recentStepTimestamps.length / 6) * 60);
      }

      this.notify();
    }
  }

  private startTimer(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.syncWallClockTime();
    this.timerId = window.setInterval(() => {
      this.syncWallClockTime();
    }, 1000);

    if (!this.visibilityListenerAttached && typeof document !== 'undefined') {
      this.visibilityListenerAttached = true;
      document.addEventListener('visibilitychange', () => {
        this.syncWallClockTime();
      });
      window.addEventListener('focus', () => {
        this.syncWallClockTime();
      });
    }
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // Physical motion step counting with strict GPS cross-validation to eliminate fake shaking steps
  private handleDeviceMotion = (e: DeviceMotionEvent) => {
    if (this.state.status !== 'tracking' || this.state.isAutoPaused) return;
    if (this.state.activityType === 'cycling') return; // Cycling doesn't count walking steps

    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    const now = Date.now();

    // Rhythmic step peak detection:
    // Requires a debounce interval of at least 280ms (max ~214 steps/min)
    // and distinct vertical footstep impulse above 11.6 m/s² following a dip <= 10.1 m/s²
    if (magnitude > 11.6 && this.lastAccelMagnitude <= 10.1 && now - this.lastAccelTime > 280) {
      const strideMeters = calculateStrideLengthMeters(this.userHeightCm, this.state.currentSpeedKmh) || 0.73;

      // ANTI-SHAKE MAP CROSS-VALIDATION:
      // If user is stationary on the map (distance < 2.5m or speed < 0.7 km/h),
      // shaking phone or wearable will NOT count as steps!
      const isStationaryOnMap = this.state.distanceMeters < 2.5 || this.state.currentSpeedKmh < 0.7;
      const expectedSteps = Math.round(this.state.distanceMeters / strideMeters);
      const maxAllowedSteps = expectedSteps + 2;

      // When stationary or when steps already match/exceed plausible distance, discard fake shake!
      if (isStationaryOnMap || this.state.steps >= maxAllowedSteps) {
        this.lastAccelMagnitude = magnitude;
        return;
      }

      this.state.steps += 1;
      this.lastAccelTime = now;
      this.recentStepTimestamps.push(now);

      this.notify();
    }
    this.lastAccelMagnitude = magnitude;
  };

  private startStepSensor(): void {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      try {
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          (DeviceMotionEvent as any).requestPermission().catch(() => {});
        }
        window.addEventListener('devicemotion', this.handleDeviceMotion, false);
      } catch (err) {
        console.warn('Device motion sensor not available:', err);
      }
    }
  }

  private stopStepSensor(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.handleDeviceMotion, false);
    }
  }

  private handleNewPoint(
    lat: number,
    lng: number,
    altitude?: number,
    speedMps?: number,
    accuracy?: number
  ) {
    if (this.state.status !== 'tracking') return;

    this.state.gpsSignal = 'locked';
    this.state.gpsAccuracyMeters = accuracy;
    this.state.errorMessage = undefined;

    const newPoint: RoutePoint = {
      lat,
      lng,
      timestamp: Date.now(),
      altitude: altitude || 0,
      speed: speedMps || 0,
      accuracy: accuracy || 5,
    };

    const lastPoint = this.state.routePoints[this.state.routePoints.length - 1];
    const { isValid, distanceDelta } = filterGpsPoints(newPoint, lastPoint, this.state.activityType);

    if (!isValid && this.state.routePoints.length > 0) return;

    // Current speed calculation
    const calcSpeedKmh = speedMps !== undefined && speedMps >= 0
      ? speedMps * 3.6
      : distanceDelta > 0
      ? (distanceDelta / 2) * 3.6
      : 0;
    this.state.currentSpeedKmh = Math.round(calcSpeedKmh * 10) / 10;

    // Fast Auto-Resume / Auto-Pause (lenient 6-second threshold, never discards moving distance)
    const pauseThresholdKmh = this.state.activityType === 'cycling' ? 2.0 : 0.6;
    if (this.state.isAutoPaused) {
      if (calcSpeedKmh >= 0.8 || distanceDelta >= 0.8) {
        this.state.isAutoPaused = false;
        this.stationaryCounter = 0;
      }
    } else if (calcSpeedKmh < pauseThresholdKmh && distanceDelta < 0.5) {
      this.stationaryCounter += 1;
      if (this.stationaryCounter >= this.autoPauseThresholdSec) {
        this.state.isAutoPaused = true;
      }
    } else {
      this.stationaryCounter = 0;
      this.state.isAutoPaused = false;
    }

    // Elevation Gain Calculation
    if (altitude !== undefined && altitude !== null) {
      if (this.lastAltitude !== null) {
        const diff = altitude - this.lastAltitude;
        if (diff > 0.8 && diff < 25) {
          this.state.elevationGainMeters += Math.round(diff * 10) / 10;
        }
      }
      this.lastAltitude = altitude;
    }

    this.state.distanceMeters += distanceDelta;
    this.state.routePoints.push(newPoint);

    // Harmonized Step & Distance Sensor Fusion:
    // Cross-validate steps against ground map distance so they are 100% physically consistent and similar!
    if (this.state.activityType !== 'cycling') {
      const strideMeters = calculateStrideLengthMeters(this.userHeightCm, this.state.currentSpeedKmh) || 0.73;
      const expectedSteps = Math.round(this.state.distanceMeters / strideMeters);

      if (this.state.distanceMeters <= 2) {
        // Stationary on map = 0 steps (completely removes any false shake artifacts)
        this.state.steps = 0;
      } else if (Math.abs(this.state.steps - expectedSteps) > 2) {
        // Reconcile and snap steps to match true ground track distance exactly
        this.state.steps = expectedSteps;
      }
    }

    // Splits: Every full 1,000 meters (1 km)
    const currentKmMark = Math.floor(this.state.distanceMeters / 1000);
    const existingSplitsCount = this.state.splits.length;

    if (currentKmMark > existingSplitsCount) {
      const splitDist = this.state.distanceMeters - this.currentSplitStartMeters;
      const splitTimeSec = this.state.durationSeconds - this.currentSplitStartTime;
      const splitElevation = this.state.elevationGainMeters - this.currentSplitStartElevation;
      const splitPaceSec = splitDist > 0 ? (splitTimeSec / splitDist) * 1000 : 0;

      this.state.splits.push({
        km: currentKmMark,
        durationSeconds: splitTimeSec,
        paceMinPerKm: formatPace(splitPaceSec),
        elevationGainMeters: Math.max(0, Math.round(splitElevation)),
      });

      this.currentSplitStartMeters = this.state.distanceMeters;
      this.currentSplitStartTime = this.state.durationSeconds;
      this.currentSplitStartElevation = this.state.elevationGainMeters;
    }

    this.notify();
  }

  private startNativeGeolocation(): void {
    if (!navigator.geolocation) {
      this.state.gpsSignal = 'error';
      this.state.errorMessage = 'Geolocation is not supported by your browser.';
      this.notify();
      return;
    }

    this.state.gpsSignal = 'searching';
    this.state.errorMessage = undefined;
    this.notify();

    // Fast initial location lock attempt
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.handleNewPoint(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.altitude || undefined,
          pos.coords.speed || undefined,
          pos.coords.accuracy || undefined
        );
      },
      (err) => {
        console.warn('Initial GPS single-fix attempt notice:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    // Continuous location tracking
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.handleNewPoint(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.altitude || undefined,
          pos.coords.speed || undefined,
          pos.coords.accuracy || undefined
        );
      },
      (err) => {
        console.warn('Geolocation watch error / status update:', err);
        if (err.code === 1) {
          this.state.gpsSignal = 'error';
          this.state.errorMessage =
            'Location permission is blocked. Please allow location access in your browser or phone settings.';
          this.notify();
        } else if (err.code === 2) {
          this.state.gpsSignal = 'searching';
          this.state.errorMessage =
            'GPS satellite signal unavailable. Please ensure location/GPS is toggled ON in device settings.';
          this.notify();
        } else if (err.code === 3) {
          // Timeout: Keep searching, do NOT abort to simulated NY!
          this.state.gpsSignal = 'searching';
          this.notify();
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 25000,
      }
    );
  }

  private stopNativeGeolocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Realistic Simulation for Desktop/Laptop testing
  private startSimulation(): void {
    this.stopSimulation();
    this.simIndex = 0;

    const baseLat = 40.7829;
    const baseLng = -73.9654;
    let currLat = baseLat;
    let currLng = baseLng;
    let angle = 0;

    this.simTimerId = window.setInterval(() => {
      if (this.state.status !== 'tracking' || this.state.isAutoPaused) return;

      angle += 0.04;
      currLat += Math.sin(angle) * 0.00018 + (Math.random() - 0.5) * 0.00002;
      currLng += Math.cos(angle) * 0.00024 + (Math.random() - 0.5) * 0.00002;
      const simAlt = 28 + Math.sin(angle * 2) * 8; // Simulates scenic elevation changes

      const simSpeedMps =
        this.state.activityType === 'cycling'
          ? 6.5 + Math.sin(angle) * 0.8
          : this.state.activityType === 'walking'
          ? 1.4 + Math.sin(angle) * 0.2
          : 3.1 + Math.sin(angle) * 0.4;

      // Simulate steps when running/walking
      if (this.state.activityType !== 'cycling') {
        const addedSteps = this.state.activityType === 'walking' ? 3 : 5;
        this.state.steps += addedSteps;
        for (let i = 0; i < addedSteps; i++) {
          this.recentStepTimestamps.push(Date.now());
        }
      }

      this.handleNewPoint(currLat, currLng, simAlt, simSpeedMps, 3);
    }, 2000);
  }

  private stopSimulation(): void {
    if (this.simTimerId !== null) {
      clearInterval(this.simTimerId);
      this.simTimerId = null;
    }
  }
}

export const geoTracker = new GeoTrackerService();
