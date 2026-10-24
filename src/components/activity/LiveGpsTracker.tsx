import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Lock,
  Flame,
  Gauge,
  TrendingUp,
  Clock,
  Compass,
  X,
  Bike,
  Footprints,
  Mountain,
  CheckCircle2,
  AlertCircle,
  Activity,
  RotateCcw,
  Flag,
  Crosshair,
} from 'lucide-react';
import L from 'leaflet';
import { geoTracker, TrackerState } from '../../services/geoTracker';
import {
  ActivityRecord,
  ActivityType,
  UserProfile,
} from '../../types';
import {
  formatDuration,
  formatPace,
  estimateActivityCalories,
} from '../../services/calculations';
import { backgroundWorkout } from '../../services/backgroundWorkout';

interface LiveGpsTrackerProps {
  activityType: ActivityType;
  profile: UserProfile;
  onFinish: (activity: ActivityRecord) => void;
  onCancel: () => void;
}

const OUTDOOR_ACTIVITIES: { id: ActivityType; label: string; icon: any; unit: string }[] = [
  { id: 'running', label: 'Running', icon: Footprints, unit: 'Pace (min/km)' },
  { id: 'jogging', label: 'Jogging', icon: Footprints, unit: 'Pace (min/km)' },
  { id: 'walking', label: 'Walking', icon: Compass, unit: 'Steps' },
  { id: 'cycling', label: 'Cycling', icon: Bike, unit: 'Speed (km/h)' },
];

export const LiveGpsTracker: React.FC<LiveGpsTrackerProps> = ({
  activityType: initialActivityType,
  profile,
  onFinish,
  onCancel,
}) => {
  const [selectedType, setSelectedType] = useState<ActivityType>(initialActivityType || 'running');
  const [trackerState, setTrackerState] = useState<TrackerState>(() => {
    geoTracker.reset(initialActivityType || 'running');
    return geoTracker.getState();
  });
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'map' | 'splits'>('map');
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<any>(null);
  const [lapToast, setLapToast] = useState<string | null>(null);
  const lapToastTimeoutRef = useRef<any>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const currentMarkerRef = useRef<L.CircleMarker | null>(null);

  // Subscribe to geoTracker updates
  useEffect(() => {
    // If not actively tracking, always guarantee a fresh clean idle state
    if (geoTracker.getState().status !== 'tracking') {
      geoTracker.reset(selectedType);
      setTrackerState(geoTracker.getState());
    }

    geoTracker.setUserHeight(profile.heightCm || 175);
    const unsubscribe = geoTracker.subscribe((state) => {
      setTrackerState(state);
      if (state.status === 'tracking' || state.status === 'paused') {
        const durationM = state.durationSeconds / 60;
        const cals = estimateActivityCalories(
          selectedType,
          durationM,
          profile.currentWeightKg || 75,
          'default',
          0,
          state.elevationGainMeters,
          state.steps,
          state.distanceMeters
        );
        const effectivePaceSec = state.currentPaceSecPerKm || state.avgPaceSecPerKm || 0;
        backgroundWorkout.updateMetrics({
          title: `Outdoor ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`,
          type: selectedType,
          durationSeconds: state.durationSeconds,
          caloriesBurned: cals,
          distanceMeters: state.distanceMeters,
          steps: state.steps,
          speedKmh: Math.round(state.currentSpeedKmh * 10) / 10,
          paceMinPerKm: formatPace(effectivePaceSec),
          isPaused: state.status === 'paused' || state.isAutoPaused,
        });
      }
    });

    return () => {
      unsubscribe();
      if (geoTracker.getState().status !== 'tracking') {
        geoTracker.reset();
      }
      backgroundWorkout.stopWorkout();
    };
  }, [profile.heightCm, selectedType, profile.currentWeightKg]);

  // Leaflet Map Init (100% Free OpenStreetMap - No Google API Key Needed)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = 40.7829;
      const initialLng = -73.9654;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([initialLat, initialLng], 16);

      // OpenStreetMap Tiles (100% Free & Open Access)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      // White outline casing for 3D clay look
      const casing = L.polyline([], {
        color: '#FFFFFF',
        weight: 10,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Main thick lime polyline
      const polyline = L.polyline([], {
        color: '#B8F25B', // Clay Lime
        weight: 6,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = polyline;
      (map as any)._casing = casing;

      // Current position marker dot
      const marker = L.circleMarker([initialLat, initialLng], {
        radius: 9,
        fillColor: '#B8F25B',
        fillOpacity: 1,
        color: '#2B2D42',
        weight: 3,
      }).addTo(map);

      currentMarkerRef.current = marker;
      mapInstanceRef.current = map;

      // Invalidate size after layout settles to guarantee crisp tiles on mobile viewports
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 300);

      // Center on user's real GPS position if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([latitude, longitude], 16);
              if (currentMarkerRef.current) {
                currentMarkerRef.current.setLatLng([latitude, longitude]);
              }
            }
          },
          (err) => {
            console.warn('Initial GPS position fix:', err);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map polyline and marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    const polyline = polylineRef.current;
    const marker = currentMarkerRef.current;
    const casing = (map as any)?._casing as L.Polyline | undefined;
    if (!map || !polyline || !marker) return;

    const points = trackerState.routePoints;
    if (points.length > 0) {
      const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
      polyline.setLatLngs(latLngs);
      if (casing) casing.setLatLngs(latLngs);

      const latest = points[points.length - 1];
      marker.setLatLng([latest.lat, latest.lng]);
      map.panTo([latest.lat, latest.lng], { animate: true, duration: 0.5 });
    }
  }, [trackerState.routePoints]);

  // When activity type changes in idle mode
  const handleSelectActivity = (type: ActivityType) => {
    setSelectedType(type);
    if (trackerState.status !== 'tracking') {
      geoTracker.reset(type);
      setTrackerState(geoTracker.getState());
    } else {
      geoTracker.setActivityType(type);
    }
  };

  // Re-center map view to current GPS position
  const handleRecenterMap = () => {
    if (!mapInstanceRef.current) return;
    const points = trackerState.routePoints;
    if (points.length > 0) {
      const latest = points[points.length - 1];
      mapInstanceRef.current.setView([latest.lat, latest.lng], 17, { animate: true });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 17, { animate: true });
          currentMarkerRef.current?.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        },
        undefined,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    }
  };

  // Start with 3-second animated countdown
  const handleTriggerStart = () => {
    // 1. Synchronously request iOS DeviceMotionEvent permissions during the direct user tap gesture
    if (
      typeof (DeviceMotionEvent as any) !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        (DeviceMotionEvent as any).requestPermission().catch(() => {});
      } catch (e) {
        // Ignore iOS permission prompt errors
      }
    }

    // 2. Synchronously request system notification permission directly in user tap gesture
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(() => {});
      } catch (e) {}
    }

    // 3. Immediately start background workout session (audio + lock screen + notification bar)
    // Synchronously starts the silent audio loop so iOS & Android won't block it for autoplay
    backgroundWorkout.startWorkout({
      title: `Outdoor ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`,
      type: selectedType,
      onPause: () => geoTracker.pause(),
      onResume: () => geoTracker.resume(),
      onStop: () => geoTracker.pause(),
    });

    // 4. Begin 3-second visual countdown before activating GPS movement tracker
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(3);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          geoTracker.start(selectedType, isSimulated, profile.heightCm);
          return null;
        }
        return prev - 1;
      });
    }, 900);
  };

  const handleRecordLap = () => {
    const lap = geoTracker.addManualLap();
    const lapNumber = trackerState.splits.length;
    const msg = `Lap ${lapNumber} recorded: ${lap.km} km • ${lap.paceMinPerKm} • ${formatDuration(lap.durationSeconds)}`;
    setLapToast(msg);
    if (lapToastTimeoutRef.current) clearTimeout(lapToastTimeoutRef.current);
    lapToastTimeoutRef.current = setTimeout(() => {
      setLapToast(null);
    }, 3500);
  };

  // Duration and Calorie calculation (Incorporating Distance, Elevation & Steps)
  const durationMins = trackerState.durationSeconds / 60;
  const liveCalories = estimateActivityCalories(
    selectedType,
    durationMins,
    profile.currentWeightKg || 75,
    'default',
    0,
    trackerState.elevationGainMeters,
    trackerState.steps,
    trackerState.distanceMeters
  );

  const handleFinish = async () => {
    backgroundWorkout.stopWorkout();
    // Cannot finish without starting! If no distance or duration, do NOT save an empty record. Cleanly reset & exit.
    if (trackerState.durationSeconds <= 0 && trackerState.distanceMeters <= 0) {
      geoTracker.reset();
      onCancel();
      return;
    }

    const finalState = await geoTracker.finish();
    if (finalState.durationSeconds <= 0 && finalState.distanceMeters <= 0) {
      geoTracker.reset();
      onCancel();
      return;
    }

    const distanceKm = finalState.distanceMeters / 1000;
    const avgSpeed =
      finalState.durationSeconds > 0
        ? distanceKm / (finalState.durationSeconds / 3600)
        : 0;

    const avgPaceSec =
      distanceKm > 0 ? finalState.durationSeconds / distanceKm : 0;

    const activity: ActivityRecord = {
      id: `act_${Date.now()}`,
      userId: profile.id,
      type: selectedType,
      environment: 'outdoor',
      title: `Outdoor ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`,
      startTime: new Date(Date.now() - finalState.durationSeconds * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: finalState.durationSeconds,
      distanceMeters: Math.round(finalState.distanceMeters),
      caloriesBurned: liveCalories,
      elevationGainMeters: Math.round(finalState.elevationGainMeters),
      avgSpeedKmh: Math.round(avgSpeed * 100) / 100,
      avgPaceMinPerKm: formatPace(avgPaceSec),
      splits: finalState.splits,
      routePoints: finalState.routePoints,
      steps: selectedType !== 'cycling' ? finalState.steps : undefined,
      notes: isSimulated
        ? `Recorded via simulated GPS route. ${finalState.elevationGainMeters}m elevation gain.`
        : `Recorded via live GPS tracker. ${finalState.elevationGainMeters}m elevation gain.`,
    };

    onFinish(activity);
  };

  const distKm = (trackerState.distanceMeters / 1000).toFixed(2);
  const speedDisplay = trackerState.currentSpeedKmh.toFixed(1);

  // Robust State Guards: You cannot finish without starting, and cannot be stuck in resume if moving time is 0
  const isActivelyTracking = trackerState.status === 'tracking';
  const isPausedSession = trackerState.status === 'paused' && trackerState.durationSeconds > 0;
  const isPreStart = !isActivelyTracking && !isPausedSession;

  return (
    <div className="fixed inset-0 z-50 bg-[#EEF0FB] dark:bg-[#151722] flex flex-col text-slate-800 dark:text-slate-100 select-none h-[100dvh]">
      {/* 3-2-1 Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white"
          >
            <span className="text-xl font-heading font-black tracking-wider uppercase text-lime-400 mb-2">
              Get Ready
            </span>
            <div className="text-8xl sm:text-9xl font-heading font-black font-mono text-[#B8F25B] drop-shadow-lg">
              {countdown}
            </div>
            <span className="text-sm font-bold text-slate-300 mt-4 capitalize">
              Starting Outdoor {selectedType}...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Floating HUD bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe px-4 py-3 clay-card rounded-b-3xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl clay-card-lime text-clay-text flex items-center justify-center font-bold shadow-xs">
            {selectedType === 'cycling' ? (
              <Bike className="w-5 h-5 stroke-[2.3]" />
            ) : selectedType === 'walking' ? (
              <Compass className="w-5 h-5 stroke-[2.3]" />
            ) : (
              <Footprints className="w-5 h-5 stroke-[2.3]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-clay-text dark:text-white capitalize text-sm">
                Outdoor {selectedType}
              </span>

              {/* Status Pill */}
              {isActivelyTracking && !trackerState.isAutoPaused && (
                <span className="flex items-center gap-1 bg-lime-500/20 text-lime-700 dark:text-lime-300 text-[10px] font-mono font-black px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
                  LIVE GPS
                </span>
              )}
              {isActivelyTracking && trackerState.isAutoPaused && (
                <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-heading font-black px-2.5 py-0.5 rounded-full animate-pulse border border-amber-500/30">
                  <Pause className="w-2.5 h-2.5 fill-current" />
                  AUTO-PAUSED
                </span>
              )}
              {isPausedSession && (
                <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-heading font-bold px-2 py-0.5 rounded-full">
                  PAUSED
                </span>
              )}
              {isPreStart && (
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-heading font-bold px-2 py-0.5 rounded-full">
                  READY
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">
                Real-Time GPS Route
              </span>
              {trackerState.wakeLockActive && (
                <span className="flex items-center gap-0.5 text-teal-600 dark:text-teal-400">
                  <Lock className="w-2.5 h-2.5" /> Awake
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isPreStart && (
            <button
              onClick={() => setIsSimulated(!isSimulated)}
              className="text-[11px] font-heading font-bold px-3 py-1.5 rounded-full clay-btn text-slate-700 dark:text-slate-200 transition active:scale-95"
            >
              {isSimulated ? 'Real GPS' : 'Simulate'}
            </button>
          )}

          <button
            onClick={() => {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              if (trackerState.status === 'tracking') {
                if (window.confirm('Do you want to discard this active workout?')) {
                  geoTracker.reset();
                  backgroundWorkout.stopWorkout();
                  onCancel();
                }
              } else {
                geoTracker.reset();
                backgroundWorkout.stopWorkout();
                onCancel();
              }
            }}
            className="clay-pebble w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-90"
            aria-label="Exit GPS tracker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AUTO-PAUSE & LAP TOAST ALERTS */}
      <AnimatePresence>
        {trackerState.isAutoPaused && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 clay-card-butter text-amber-950 font-heading font-black text-xs px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-amber-400/40"
          >
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <Pause className="w-3.5 h-3.5 fill-current text-amber-800" />
            <span>Auto-Paused (Will resume when you move)</span>
          </motion.div>
        )}

        {lapToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-32 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-lime-400 font-heading font-black text-xs px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-lime-400/50"
          >
            <Flag className="w-3.5 h-3.5 fill-current text-lime-400" />
            <span>{lapToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Map or Splits View */}
      <div className="flex-1 relative w-full h-full">
        <div
          ref={mapContainerRef}
          className={`w-full h-full ${activeTab === 'map' ? 'block' : 'hidden'}`}
        />

        {/* Splits & Laps Overlay Tab */}
        {activeTab === 'splits' && (
          <div className="absolute inset-0 z-10 bg-slate-50/95 dark:bg-[#1E2030]/95 backdrop-blur-md p-6 overflow-y-auto pt-24">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-heading font-black text-clay-text dark:text-white">
                  Laps & Kilometer Splits
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">
                  {trackerState.splits.length} split segments recorded
                </span>
              </div>
              <button
                type="button"
                onClick={handleRecordLap}
                className="py-2 px-3 rounded-xl clay-btn-sky text-slate-900 font-heading font-black text-xs flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                <Flag className="w-3.5 h-3.5 fill-current text-sky-800" />
                <span>+ Record Lap</span>
              </button>
            </div>

            {trackerState.splits.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold space-y-2">
                <div>No laps recorded yet.</div>
                <div className="text-[11px] font-normal text-slate-500">
                  Tap the "+ Lap" button anytime while moving to record individual lap splits, or complete a full kilometer!
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {trackerState.splits.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl clay-card-flat flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl clay-card-lime text-clay-text font-black flex items-center justify-center text-xs font-mono shadow-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-black text-clay-text dark:text-white text-xs">
                            {s.km >= 1 ? `${s.km} km` : `${Math.round(s.km * 1000)} m`}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {formatDuration(s.durationSeconds)}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-black text-clay-coral-dark dark:text-clay-coral block mt-0.5">
                          {s.paceMinPerKm}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-lime-600 dark:text-lime-400">
                      +{s.elevationGainMeters}m elev
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Switcher Floating Pill */}
        {!isPreStart && (
          <div className="absolute top-20 right-4 z-20 clay-sunken rounded-full p-1 flex gap-1 shadow-md">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1 text-xs font-heading font-black rounded-full transition ${
                activeTab === 'map'
                  ? 'clay-btn-lime text-clay-text'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setActiveTab('splits')}
              className={`px-3 py-1 text-xs font-heading font-black rounded-full transition ${
                activeTab === 'splits'
                  ? 'clay-btn-lime text-clay-text'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Laps ({trackerState.splits.length})
            </button>
          </div>
        )}

        {/* Floating GPS Status Badge (Top Left of Map) */}
        <div className="absolute top-20 left-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
          {trackerState.gpsSignal === 'locked' && (
            <div className="clay-card-flat bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>GPS Locked {trackerState.gpsAccuracyMeters ? `(±${Math.round(trackerState.gpsAccuracyMeters)}m)` : ''}</span>
            </div>
          )}
          {trackerState.gpsSignal === 'searching' && (
            <div className="clay-card-flat bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm border border-amber-500/40 text-amber-700 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Acquiring GPS fix...</span>
            </div>
          )}
          {trackerState.gpsSignal === 'simulated' && (
            <div className="clay-card-flat bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm border border-sky-500/40 text-sky-700 dark:text-sky-300">
              <span>Simulated Route Active</span>
            </div>
          )}
        </div>

        {/* Floating Map Re-center Button (Bottom Right of Map) */}
        {activeTab === 'map' && (
          <button
            type="button"
            onClick={handleRecenterMap}
            className="absolute bottom-5 right-4 z-20 clay-card w-11 h-11 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white shadow-xl transition active:scale-95 border border-white/60 dark:border-slate-700"
            title="Re-center on current location"
            aria-label="Re-center location"
          >
            <Crosshair className="w-5 h-5" />
          </button>
        )}

        {/* Error / Location Blocked Alert Banner */}
        {trackerState.errorMessage && (
          <div className="absolute top-32 left-4 right-4 z-20 p-3 rounded-2xl bg-rose-500/95 text-white shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="leading-tight">{trackerState.errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                geoTracker.start(selectedType, true, profile.heightCm);
                setIsSimulated(true);
              }}
              className="px-2.5 py-1 bg-white text-rose-700 font-heading font-black text-[10px] rounded-lg shadow-sm whitespace-nowrap active:scale-95 transition"
            >
              Simulate Route
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROL & HUD DASHBOARD */}
      <div className="clay-card rounded-t-[36px] p-5 pb-safe z-20 shadow-2xl space-y-4">
        {/* PRE-START STATE: ACTIVITY PICKER CAROUSEL (Always shown when not actively running or paused with duration) */}
        {isPreStart && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-heading font-black text-clay-text/70 dark:text-slate-400 uppercase tracking-wider block mb-2 text-center">
                Choose Activity Before Starting:
              </span>

              {/* Activity Selection Carousel */}
              <div className="grid grid-cols-4 gap-2">
                {OUTDOOR_ACTIVITIES.map((act) => {
                  const Icon = act.icon;
                  const isSelected = selectedType === act.id;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => handleSelectActivity(act.id)}
                      className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition active:scale-95 ${
                        isSelected
                          ? 'clay-btn-lime text-clay-text scale-[1.03] shadow-md'
                          : 'clay-btn text-clay-text/70 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.4]" />
                      <span className="text-xs font-heading font-black">{act.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Metric Preview Info */}
            <div className="p-3 rounded-2xl clay-sunken flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>Primary Metric:</span>
              <span className="font-heading font-black text-clay-text dark:text-white capitalize">
                {selectedType === 'cycling'
                  ? 'Speed (km/h) & Elevation'
                  : selectedType === 'walking'
                  ? 'Live Step Count & Pace'
                  : 'Pace (min/km), Steps & Elevation'}
              </span>
            </div>

            {/* BIG START BUTTON */}
            <button
              type="button"
              onClick={handleTriggerStart}
              className="w-full py-4 rounded-clay-btn clay-btn-lime font-heading font-black text-base flex items-center justify-center gap-2 active:scale-95 transition shadow-lg text-clay-text"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>START {selectedType.toUpperCase()}</span>
            </button>
          </div>
        )}

        {/* ACTIVE / PAUSED STATE: METRICS HUD */}
        {!isPreStart && (
          <>
            {/* Primary Numbers HUD - Adapts to Strava Sport Profile */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Box 1: Distance */}
              <div className="clay-sunken rounded-2xl p-2.5 sm:p-3">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-heading font-black block truncate">
                  Distance
                </span>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-heading font-black text-clay-text dark:text-white tracking-tight font-mono">
                    {distKm}
                  </span>
                  <span className="text-[10px] sm:text-xs font-black text-lime-600 dark:text-lime-400 font-mono">
                    km
                  </span>
                </div>
              </div>

              {/* Box 2: Timer Duration */}
              <div className="clay-sunken rounded-2xl p-2.5 sm:p-3">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-heading font-black block truncate">
                  Moving Time
                </span>
                <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-clay-text dark:text-white font-mono tracking-tight">
                    {formatDuration(trackerState.durationSeconds)}
                  </span>
                </div>
              </div>

              {/* Box 3: Sport Specific Gauge (Speed for Cycling, Steps for Walking, Pace for Running) */}
              <div className="clay-sunken rounded-2xl p-2.5 sm:p-3">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-heading font-black block truncate">
                  {selectedType === 'cycling'
                    ? 'Speed'
                    : selectedType === 'walking'
                    ? 'Live Steps'
                    : 'Pace'}
                </span>
                <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                  {selectedType === 'cycling' ? (
                    <>
                      <span className="text-xl sm:text-2xl font-black text-clay-text dark:text-white font-mono tracking-tight">
                        {speedDisplay}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">km/h</span>
                    </>
                  ) : selectedType === 'walking' ? (
                    <>
                      <span className="text-xl sm:text-2xl font-black text-clay-coral-dark dark:text-clay-coral font-mono tracking-tight">
                        {trackerState.steps.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">steps</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl sm:text-2xl font-black text-clay-text dark:text-white font-mono tracking-tight">
                        {formatPace(trackerState.currentPaceSecPerKm).split(' ')[0]}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">/km</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary Metrics Bar: Calories, Speed, Pace/Steps, Elevation */}
            <div className="flex justify-around items-center text-xs text-slate-500 font-bold py-2 border-t border-slate-200/60 dark:border-slate-800">
              {/* Calories (Clinical ACSM Energy Expenditure) */}
              <span className="flex items-center gap-1.5 font-mono" title="Physiological calories burned">
                <Flame className="w-4 h-4 text-coral-500" />
                <strong className="text-clay-text dark:text-white font-black">{liveCalories}</strong> kcal
              </span>

              {/* Speed (Instantaneous smoothed km/h) */}
              <span className="flex items-center gap-1.5 font-mono" title="Current Speed">
                <Gauge className="w-4 h-4 text-sky-500" />
                <strong className="text-clay-text dark:text-white font-black">{speedDisplay}</strong> km/h
              </span>

              {/* Pace (if walking) or Steps (if running/jogging) */}
              {selectedType === 'walking' ? (
                <span className="flex items-center gap-1.5 font-mono" title="Live Pace">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <strong className="text-clay-text dark:text-white font-black">
                    {formatPace(trackerState.currentPaceSecPerKm || trackerState.avgPaceSecPerKm || 0).split(' ')[0]}
                  </strong>
                  /km
                </span>
              ) : selectedType !== 'cycling' ? (
                <span className="flex items-center gap-1.5 font-mono" title="Live steps & cadence">
                  <Footprints className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                  <strong className="text-clay-text dark:text-white font-black">
                    {trackerState.steps.toLocaleString()}
                  </strong>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-mono" title="Average Pace">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <strong className="text-clay-text dark:text-white font-black">
                    {formatPace(trackerState.avgPaceSecPerKm || 0).split(' ')[0]}
                  </strong>
                  /km
                </span>
              )}

              {/* Elevation Gain */}
              <span className="flex items-center gap-1.5 font-mono" title="Total elevation climbed">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <strong className="text-clay-text dark:text-white font-black">
                  +{Math.round(trackerState.elevationGainMeters)}m
                </strong>
              </span>
            </div>

            {/* Tracking Controls */}
            <div className="flex items-center justify-center gap-3 pt-1">
              {trackerState.status === 'tracking' ? (
                <>
                  <button
                    type="button"
                    onClick={handleRecordLap}
                    className="flex-1 py-4 px-4 rounded-clay-btn clay-btn font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition text-slate-800 dark:text-white shadow-md border border-slate-300 dark:border-slate-700"
                    title="Record Lap split"
                  >
                    <Flag className="w-4 h-4 fill-current text-sky-600 dark:text-sky-400" />
                    <span>+ LAP ({trackerState.splits.length + 1})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => geoTracker.pause()}
                    className="flex-1 py-4 px-4 rounded-clay-btn clay-btn-coral font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition text-white shadow-md"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>PAUSE</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => geoTracker.resume()}
                    className="flex-1 py-4 px-6 rounded-clay-btn clay-btn-lime font-heading font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition text-clay-text shadow-md"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>RESUME</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinish}
                    className="flex-1 py-4 px-6 rounded-clay-btn clay-btn text-rose-600 dark:text-rose-400 font-heading font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-sm"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    <span>FINISH & SAVE</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
