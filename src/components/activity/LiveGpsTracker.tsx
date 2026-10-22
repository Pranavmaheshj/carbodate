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
  X
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
  estimateActivityCalories
} from '../../services/calculations';

interface LiveGpsTrackerProps {
  activityType: ActivityType;
  profile: UserProfile;
  onFinish: (activity: ActivityRecord) => void;
  onCancel: () => void;
}

export const LiveGpsTracker: React.FC<LiveGpsTrackerProps> = ({
  activityType,
  profile,
  onFinish,
  onCancel,
}) => {
  const [trackerState, setTrackerState] = useState<TrackerState>(geoTracker.getState());
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'map' | 'splits'>('map');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const currentMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    geoTracker.start(isSimulated);

    const unsubscribe = geoTracker.subscribe((state) => {
      setTrackerState(state);
    });

    return () => {
      unsubscribe();
      geoTracker.finish();
    };
  }, [isSimulated]);

  // Leaflet Map Init (Pastel CartoDB Voyager Map with Thick Lime Polyline)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = 40.7829;
      const initialLng = -73.9654;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([initialLat, initialLng], 16);

      // CartoDB Voyager pastel tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
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

      // Current position marble dot
      const marker = L.circleMarker([initialLat, initialLng], {
        radius: 9,
        fillColor: '#B8F25B',
        fillOpacity: 1,
        color: '#2B2D42',
        weight: 3,
      }).addTo(map);

      currentMarkerRef.current = marker;
      mapInstanceRef.current = map;
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

  const durationMins = trackerState.durationSeconds / 60;
  const liveCalories = estimateActivityCalories(
    activityType,
    durationMins,
    profile.currentWeightKg || 75,
    'default'
  );

  const handleFinish = async () => {
    const finalState = await geoTracker.finish();
    const distanceKm = finalState.distanceMeters / 1000;
    const avgSpeed = finalState.durationSeconds > 0
      ? (distanceKm / (finalState.durationSeconds / 3600))
      : 0;

    const avgPaceSec = distanceKm > 0
      ? finalState.durationSeconds / distanceKm
      : 0;

    const activity: ActivityRecord = {
      id: `act_${Date.now()}`,
      userId: profile.id,
      type: activityType,
      environment: 'outdoor',
      title: `Outdoor ${activityType.charAt(0).toUpperCase() + activityType.slice(1)}`,
      startTime: new Date(Date.now() - finalState.durationSeconds * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: finalState.durationSeconds,
      distanceMeters: Math.round(finalState.distanceMeters),
      caloriesBurned: Math.max(liveCalories, 10),
      elevationGainMeters: Math.round(finalState.elevationGainMeters),
      avgSpeedKmh: Math.round(avgSpeed * 100) / 100,
      avgPaceMinPerKm: formatPace(avgPaceSec),
      splits: finalState.splits,
      routePoints: finalState.routePoints,
      notes: isSimulated ? 'Recorded via simulated GPS route.' : 'Recorded via live GPS tracker.',
    };

    onFinish(activity);
  };

  const distKm = (trackerState.distanceMeters / 1000).toFixed(2);
  const speedDisplay = trackerState.currentSpeedKmh.toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-[#EEF0FB] dark:bg-[#151722] flex flex-col text-slate-800 dark:text-slate-100 select-none h-[100dvh]">
      {/* Top Floating HUD bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe px-4 py-3 clay-card rounded-b-3xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl clay-pebble flex items-center justify-center font-bold text-lime-600 dark:text-lime-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-800 dark:text-slate-100 capitalize text-sm font-display">
                Outdoor {activityType}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-ping" />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold">
              {trackerState.wakeLockActive && (
                <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold">
                  <Lock className="w-3 h-3" /> Screen Awake
                </span>
              )}
              {isSimulated && (
                <span className="clay-card-butter px-2 py-0.5 rounded-full font-black text-[10px]">
                  Simulation
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulated(!isSimulated)}
            className="text-[11px] font-black px-3 py-1.5 rounded-full clay-btn text-slate-700 dark:text-slate-200 transition active:scale-95"
          >
            {isSimulated ? 'Real GPS' : 'Simulate'}
          </button>

          <button
            onClick={onCancel}
            className="clay-pebble w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition"
            aria-label="Exit GPS tracker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto Pause Indicator Alert */}
      {trackerState.isAutoPaused && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 clay-card-butter text-slate-900 font-black text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 font-display">
          <Pause className="w-3.5 h-3.5 fill-current" />
          <span>Auto-Paused (Stationary)</span>
        </div>
      )}

      {/* Main Map or Splits View */}
      <div className="flex-1 relative w-full h-full">
        <div
          ref={mapContainerRef}
          className={`w-full h-full ${activeTab === 'map' ? 'block' : 'hidden'}`}
        />

        {/* Splits Overlay Tab */}
        {activeTab === 'splits' && (
          <div className="absolute inset-0 z-10 bg-slate-50/95 dark:bg-[#1E2030]/95 backdrop-blur-md p-6 overflow-y-auto pt-24">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-4 font-display">Kilometer Splits</h3>
            {trackerState.splits.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                Complete your first kilometer to view split paces and elevation metrics.
              </div>
            ) : (
              <div className="space-y-2.5">
                {trackerState.splits.map((s) => (
                  <div
                    key={s.km}
                    className="p-3.5 rounded-2xl clay-card-flat flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl clay-pebble text-lime-700 dark:text-lime-400 font-black flex items-center justify-center text-xs font-mono">
                        {s.km}k
                      </span>
                      <div>
                        <span className="font-black text-slate-800 dark:text-slate-100 font-mono block">{s.paceMinPerKm}</span>
                        <span className="text-xs text-slate-400 font-bold font-mono">
                          {formatDuration(s.durationSeconds)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-bold font-mono">
                      +{s.elevationGainMeters}m elev
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Switcher Floating Pill */}
        <div className="absolute top-20 right-4 z-20 clay-sunken rounded-full p-1 flex gap-1 shadow-md">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1 text-xs font-black rounded-full transition ${
              activeTab === 'map'
                ? 'clay-btn-lime'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('splits')}
            className={`px-3 py-1 text-xs font-black rounded-full transition ${
              activeTab === 'splits'
                ? 'clay-btn-lime'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Splits ({trackerState.splits.length})
          </button>
        </div>
      </div>

      {/* Bottom Live Metrics Dashboard Card */}
      <div className="clay-card rounded-t-[36px] p-5 pb-safe z-20 shadow-2xl">
        {/* Big Numbers HUD */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="clay-sunken rounded-2xl p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-black font-display block truncate">
              Distance
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-mono">
                {distKm}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-lime-600 dark:text-lime-400 font-mono">km</span>
            </div>
          </div>

          <div className="clay-sunken rounded-2xl p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-black font-display block truncate">
              Time
            </span>
            <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                {formatDuration(trackerState.durationSeconds)}
              </span>
            </div>
          </div>

          <div className="clay-sunken rounded-2xl p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-black font-display block truncate">
              Pace
            </span>
            <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                {formatPace(trackerState.currentPaceSecPerKm).split(' ')[0]}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">/km</span>
            </div>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="flex justify-around text-xs text-slate-500 font-bold py-2 border-t border-slate-100 dark:border-slate-800 mb-4">
          <span className="flex items-center gap-1.5 font-mono">
            <Flame className="w-4 h-4 text-coral-500" />
            <strong className="text-slate-800 dark:text-slate-100">{liveCalories}</strong> kcal
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <Gauge className="w-4 h-4 text-sky-500" />
            <strong className="text-slate-800 dark:text-slate-100">{speedDisplay}</strong> km/h
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <TrendingUp className="w-4 h-4 text-lime-500" />
            <strong className="text-slate-800 dark:text-slate-100">{Math.round(trackerState.elevationGainMeters)}</strong>m elev
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {trackerState.status === 'tracking' ? (
            <button
              onClick={() => geoTracker.pause()}
              className="w-full py-4 px-6 rounded-clay-btn clay-btn-coral font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Activity</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => geoTracker.resume()}
                className="flex-1 py-4 px-6 rounded-clay-btn clay-btn-lime font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Resume</span>
              </button>

              <button
                onClick={handleFinish}
                className="flex-1 py-4 px-6 rounded-clay-btn clay-btn text-rose-600 dark:text-rose-400 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>Finish & Save</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
