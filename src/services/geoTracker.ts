import { RoutePoint, SplitRecord } from '../types';
import { filterGpsPoints, formatPace, haversineDistanceMeters } from './calculations';

export interface TrackerState {
  status: 'idle' | 'tracking' | 'paused' | 'finished';
  distanceMeters: number;
  durationSeconds: number;
  elevationGainMeters: number;
  currentSpeedKmh: number;
  currentPaceSecPerKm: number;
  routePoints: RoutePoint[];
  splits: SplitRecord[];
  isAutoPaused: boolean;
  wakeLockActive: boolean;
}

export type TrackerUpdateListener = (state: TrackerState) => void;

export class GeoTrackerService {
  private watchId: number | null = null;
  private timerId: number | null = null;
  private simTimerId: number | null = null;
  private wakeLockSentinel: any = null;

  private state: TrackerState = {
    status: 'idle',
    distanceMeters: 0,
    durationSeconds: 0,
    elevationGainMeters: 0,
    currentSpeedKmh: 0,
    currentPaceSecPerKm: 0,
    routePoints: [],
    splits: [],
    isAutoPaused: false,
    wakeLockActive: false,
  };

  private listeners: Set<TrackerUpdateListener> = new Set();
  private autoPauseThresholdSec = 4;
  private stationaryCounter = 0;
  private currentSplitStartMeters = 0;
  private currentSplitStartTime = 0;
  private currentSplitStartElevation = 0;
  private lastAltitude: number | null = null;

  // Simulator route for indoor / desktop testing
  private simIndex = 0;
  private isSimulated = false;

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

  // Request Screen Wake Lock so screen doesn't turn off while running
  public async requestWakeLock(): Promise<boolean> {
    if ('wakeLock' in navigator) {
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

  // Start tracking
  public async start(simulated: boolean = false): Promise<void> {
    this.isSimulated = simulated;
    this.state = {
      status: 'tracking',
      distanceMeters: 0,
      durationSeconds: 0,
      elevationGainMeters: 0,
      currentSpeedKmh: 0,
      currentPaceSecPerKm: 0,
      routePoints: [],
      splits: [],
      isAutoPaused: false,
      wakeLockActive: false,
    };
    this.currentSplitStartMeters = 0;
    this.currentSplitStartTime = 0;
    this.currentSplitStartElevation = 0;
    this.lastAltitude = null;
    this.stationaryCounter = 0;

    await this.requestWakeLock();
    this.startTimer();

    if (simulated || !navigator.geolocation) {
      this.startSimulation();
    } else {
      this.startNativeGeolocation();
    }

    this.notify();
  }

  // Pause
  public pause(): void {
    if (this.state.status === 'tracking') {
      this.state.status = 'paused';
      this.stopTimer();
      this.notify();
    }
  }

  // Resume
  public resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'tracking';
      this.state.isAutoPaused = false;
      this.stationaryCounter = 0;
      this.startTimer();
      this.notify();
    }
  }

  // Finish
  public async finish(): Promise<TrackerState> {
    this.stopNativeGeolocation();
    this.stopSimulation();
    this.stopTimer();
    await this.releaseWakeLock();

    // Check if there is an unfinalized final split
    const finalDist = this.state.distanceMeters;
    const splitDelta = finalDist - this.currentSplitStartMeters;
    if (splitDelta > 200) {
      const splitTimeSec = this.state.durationSeconds - this.currentSplitStartTime;
      const paceSec = splitDelta > 0 ? (splitTimeSec / splitDelta) * 1000 : 0;
      this.state.splits.push({
        km: Math.round((finalDist / 1000) * 10) / 10,
        durationSeconds: splitTimeSec,
        paceMinPerKm: formatPace(paceSec),
        elevationGainMeters: Math.max(0, this.state.elevationGainMeters - this.currentSplitStartElevation),
      });
    }

    this.state.status = 'finished';
    this.notify();
    return { ...this.state };
  }

  private startTimer(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = window.setInterval(() => {
      if (this.state.status === 'tracking' && !this.state.isAutoPaused) {
        this.state.durationSeconds += 1;
        // recalculate overall pace
        if (this.state.distanceMeters > 50) {
          this.state.currentPaceSecPerKm =
            (this.state.durationSeconds / this.state.distanceMeters) * 1000;
        }
        this.notify();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private handleNewPoint(lat: number, lng: number, altitude?: number, speedMps?: number, accuracy?: number) {
    if (this.state.status !== 'tracking') return;

    const newPoint: RoutePoint = {
      lat,
      lng,
      timestamp: Date.now(),
      altitude: altitude || 0,
      speed: speedMps || 0,
      accuracy: accuracy || 5,
    };

    const lastPoint = this.state.routePoints[this.state.routePoints.length - 1];
    const { isValid, distanceDelta } = filterGpsPoints(newPoint, lastPoint);

    if (!isValid && this.state.routePoints.length > 0) return;

    // Check speed & auto-pause
    const calcSpeedKmh = speedMps ? speedMps * 3.6 : (distanceDelta > 0 ? (distanceDelta / 2) * 3.6 : 0);
    this.state.currentSpeedKmh = Math.round(calcSpeedKmh * 10) / 10;

    // Auto-pause check: if speed < 0.8 km/h for consecutive pings
    if (calcSpeedKmh < 0.8) {
      this.stationaryCounter += 1;
      if (this.stationaryCounter >= this.autoPauseThresholdSec && !this.state.isAutoPaused) {
        this.state.isAutoPaused = true;
        this.notify();
        return;
      }
    } else {
      if (this.state.isAutoPaused) {
        this.state.isAutoPaused = false;
      }
      this.stationaryCounter = 0;
    }

    if (this.state.isAutoPaused) return;

    // Elevation gain
    if (altitude !== undefined && altitude !== null) {
      if (this.lastAltitude !== null) {
        const diff = altitude - this.lastAltitude;
        if (diff > 1.2 && diff < 30) {
          // valid gradual climb, ignore vertical noise
          this.state.elevationGainMeters += Math.round(diff * 10) / 10;
        }
      }
      this.lastAltitude = altitude;
    }

    this.state.distanceMeters += distanceDelta;
    this.state.routePoints.push(newPoint);

    // Check splits: each full 1000m
    const currentKmMark = Math.floor(this.state.distanceMeters / 1000);
    const existingSplitsCount = this.state.splits.length;

    if (currentKmMark > existingSplitsCount) {
      const splitDist = this.state.distanceMeters - this.currentSplitStartMeters;
      const splitTimeSec = this.state.durationSeconds - this.currentSplitStartTime;
      const splitElevation = this.state.elevationGainMeters - this.currentSplitStartElevation;
      const splitPaceSec = (splitTimeSec / splitDist) * 1000;

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
      this.startSimulation();
      return;
    }

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
        console.warn('Geolocation error:', err);
        // Fallback to simulation if user denied permission or on desktop
        if (this.state.routePoints.length === 0) {
          this.startSimulation();
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  }

  private stopNativeGeolocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Realistic Simulation for Demo / Desktop testing
  private startSimulation(): void {
    this.stopSimulation();
    this.simIndex = 0;

    // Base coordinates around a scenic park loop
    const baseLat = 40.7829;
    const baseLng = -73.9654;
    let currLat = baseLat;
    let currLng = baseLng;
    let angle = 0;

    this.simTimerId = window.setInterval(() => {
      if (this.state.status !== 'tracking' || this.state.isAutoPaused) return;

      // Move approx 6 meters every 2 seconds (~10.8 km/h running pace)
      angle += 0.04;
      currLat += Math.sin(angle) * 0.00018 + (Math.random() - 0.5) * 0.00002;
      currLng += Math.cos(angle) * 0.00024 + (Math.random() - 0.5) * 0.00002;
      const simAlt = 28 + Math.sin(angle * 2) * 6;
      const simSpeedMps = 3.0 + Math.sin(angle) * 0.3;

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

