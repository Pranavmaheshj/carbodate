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

  // Leaflet Map Init (Crisp clean light map)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = 40.7829;
      const initialLng = -73.9654;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([initialLat, initialLng], 16);

      // Clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Polyline for route
      const polyline = L.polyline([], {
        color: '#059669', // Emerald
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = polyline;

      // Current position marker
      const marker = L.circleMarker([initialLat, initialLng], {
        radius: 9,
        fillColor: '#10B981',
        fillOpacity: 1,
        color: '#FFFFFF',
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
    if (!map || !polyline || !marker) return;

    const points = trackerState.routePoints;
    if (points.length > 0) {
      const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
      polyline.setLatLngs(latLngs);

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
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col text-slate-900 select-none h-[100dvh]">
      {/* Top Floating HUD bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe px-4 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 capitalize text-sm">
                Outdoor {activityType}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              {trackerState.wakeLockActive && (
                <span className="flex items-center gap-1 text-teal-700 font-medium">
                  <Lock className="w-3 h-3" /> Screen Awake
                </span>
              )}
              {isSimulated && (
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold text-[10px]">
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
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
          >
            {isSimulated ? 'Use Real GPS' : 'Simulate Run'}
          </button>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
            aria-label="Exit GPS tracker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Auto Pause Indicator Alert */}
      {trackerState.isAutoPaused && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
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
          <div className="absolute inset-0 z-10 bg-white/95 p-6 overflow-y-auto pt-20">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Kilometer Splits</h3>
            {trackerState.splits.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Complete your first kilometer to view split paces and elevation metrics.
              </div>
            ) : (
              <div className="space-y-2.5">
                {trackerState.splits.map((s) => (
                  <div
                    key={s.km}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {s.km}k
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 block">{s.paceMinPerKm}</span>
                        <span className="text-xs text-slate-500">
                          {formatDuration(s.durationSeconds)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      +{s.elevationGainMeters}m elev
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Switcher Floating Pill */}
        <div className="absolute top-20 right-4 z-20 bg-white border border-slate-200 rounded-xl p-1 flex gap-1 shadow-md">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('splits')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              activeTab === 'splits'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Splits ({trackerState.splits.length})
          </button>
        </div>
      </div>

      {/* Bottom Live Metrics Dashboard Card */}
      <div className="bg-white border-t border-slate-200 p-5 pb-safe z-20 shadow-lg">
        {/* Big Numbers HUD */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center mb-4">
          <div className="bg-slate-50 rounded-2xl p-2 sm:p-3 border border-slate-200/80">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-semibold block truncate">
              Distance
            </span>
            <div className="flex items-baseline justify-center gap-0.5 sm:gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {distKm}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700">km</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-2 sm:p-3 border border-slate-200/80">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-semibold block truncate">
              Time
            </span>
            <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
              <span className="text-xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {formatDuration(trackerState.durationSeconds)}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-2 sm:p-3 border border-slate-200/80">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-semibold block truncate">
              Pace
            </span>
            <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                {formatPace(trackerState.currentPaceSecPerKm).split(' ')[0]}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500">/km</span>
            </div>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="flex justify-around text-xs text-slate-600 py-2 border-t border-slate-100 mb-4">
          <span className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <strong className="text-slate-900">{liveCalories}</strong> kcal
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-600" />
            <strong className="text-slate-900">{speedDisplay}</strong> km/h
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <strong className="text-slate-900">{Math.round(trackerState.elevationGainMeters)}</strong>m elev
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {trackerState.status === 'tracking' ? (
            <button
              onClick={() => geoTracker.pause()}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Activity</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => geoTracker.resume()}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Resume</span>
              </button>

              <button
                onClick={handleFinish}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
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
