import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  CheckCircle2,
  Sparkles,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import L from 'leaflet';
import { ActivityRecord } from '../../types';
import { formatDuration } from '../../services/calculations';

interface ActivitySummaryModalProps {
  activity: ActivityRecord | null;
  onClose: () => void;
}

export const ActivitySummaryModal: React.FC<ActivitySummaryModalProps> = ({
  activity,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (activity) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#059669', '#0D9488', '#F59E0B'],
        });
      } catch (e) {
        // Safe ignore
      }
    }
  }, [activity]);

  // Leaflet summary route map preview (Clean Light map)
  useEffect(() => {
    if (!activity || !mapContainerRef.current) return;

    if (activity.routePoints && activity.routePoints.length > 1) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const points = activity.routePoints.map((p) => [p.lat, p.lng] as [number, number]);
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const polyline = L.polyline(points, {
        color: '#059669',
        weight: 5,
        opacity: 0.95,
      }).addTo(map);

      // Start marker
      L.circleMarker(points[0], {
        radius: 6,
        fillColor: '#10B981',
        fillOpacity: 1,
        color: '#FFFFFF',
        weight: 2,
      }).addTo(map);

      // End marker
      L.circleMarker(points[points.length - 1], {
        radius: 6,
        fillColor: '#EF4444',
        fillOpacity: 1,
        color: '#FFFFFF',
        weight: 2,
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [25, 25] });
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activity]);

  if (!activity) return null;

  const distanceKm = (activity.distanceMeters / 1000).toFixed(2);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Carbodate ${activity.title}`,
          text: `Crushed a ${distanceKm} km ${activity.type} in ${formatDuration(activity.durationSeconds)} burning ${activity.caloriesBurned} kcal with Carbodate!`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      alert(`Summary copied! ${activity.title}: ${distanceKm} km in ${formatDuration(activity.durationSeconds)} (${activity.caloriesBurned} kcal).`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg clay-card rounded-clay-card p-6 sm:p-7 relative text-left my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full clay-pebble flex items-center justify-center text-clay-text/60 hover:text-clay-text dark:text-slate-400 dark:hover:text-white transition z-10"
          aria-label="Close summary"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Header & Celebration */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-full clay-pebble bg-clay-lime text-clay-text flex items-center justify-center font-bold">
            <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs uppercase font-heading font-black tracking-wider text-clay-text/60 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-clay-butter fill-current" /> Activity Saved
            </span>
            <h3 className="text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight">
              {activity.title}
            </h3>
          </div>
        </div>

        {/* Shareable Card Canvas Container */}
        <div className="clay-sunken rounded-2xl overflow-hidden mb-5 relative p-1">
          {activity.routePoints && activity.routePoints.length > 1 ? (
            <div ref={mapContainerRef} className="h-44 w-full rounded-xl relative z-0 overflow-hidden" />
          ) : (
            <div className="h-28 w-full rounded-xl flex items-center justify-center text-clay-text/60 dark:text-slate-400 text-xs gap-2">
              <Award className="w-5 h-5 text-clay-lime-dark" />
              <span>Cardio logged without GPS polyline</span>
            </div>
          )}

          {/* Stats Bar */}
          <div className="p-4 clay-card rounded-xl mt-1">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-clay-text/60 dark:text-slate-400 block font-heading font-black">
                  Distance
                </span>
                <span className="text-base font-heading font-black text-clay-text dark:text-white font-mono">
                  {distanceKm} km
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-clay-text/60 dark:text-slate-400 block font-heading font-black">
                  Duration
                </span>
                <span className="text-base font-heading font-black text-clay-text dark:text-white font-mono">
                  {formatDuration(activity.durationSeconds)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-clay-text/60 dark:text-slate-400 block font-heading font-black">
                  Avg Pace
                </span>
                <span className="text-base font-heading font-black text-clay-lime-dark dark:text-clay-lime font-mono">
                  {activity.avgPaceMinPerKm.split(' ')[0]}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-clay-text/60 dark:text-slate-400 block font-heading font-black">
                  Calories
                </span>
                <span className="text-base font-heading font-black text-clay-coral-dark dark:text-clay-coral font-mono">
                  {activity.caloriesBurned}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Indoor Treadmill / Cardio Details */}
        {activity.indoorDetails && (
          <div className="mb-5 p-3.5 rounded-2xl clay-sunken">
            <span className="text-[10px] uppercase tracking-wider font-heading font-black text-clay-text/60 dark:text-slate-400 block mb-2">
              Indoor Session Metrics
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              {activity.indoorDetails.treadmillIncline !== undefined && (
                <div className="p-2 rounded-xl clay-card">
                  <span className="text-[10px] text-clay-text/60 dark:text-slate-400 block font-heading font-bold">Incline</span>
                  <span className="text-sm font-heading font-black text-amber-600 dark:text-amber-400 font-mono">
                    {activity.indoorDetails.treadmillIncline}%
                  </span>
                </div>
              )}
              {activity.indoorDetails.steps !== undefined && (
                <div className="p-2 rounded-xl clay-card">
                  <span className="text-[10px] text-clay-text/60 dark:text-slate-400 block font-heading font-bold">Steps</span>
                  <span className="text-sm font-heading font-black text-clay-lime-dark dark:text-clay-lime font-mono">
                    {activity.indoorDetails.steps.toLocaleString()}
                  </span>
                </div>
              )}
              {activity.indoorDetails.cadenceSpm !== undefined && (
                <div className="p-2 rounded-xl clay-card">
                  <span className="text-[10px] text-clay-text/60 dark:text-slate-400 block font-heading font-bold">Cadence</span>
                  <span className="text-sm font-heading font-black text-clay-sky-dark dark:text-clay-sky font-mono">
                    {activity.indoorDetails.cadenceSpm} spm
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Splits Table if available */}
        {activity.splits && activity.splits.length > 0 && (
          <div className="mb-5">
            <span className="text-xs uppercase tracking-wider font-heading font-black text-clay-text/60 dark:text-slate-400 block mb-2">
              Kilometer Splits
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {activity.splits.map((s) => (
                <div
                  key={s.km}
                  className="flex items-center justify-between text-xs py-2.5 px-3.5 rounded-xl clay-sunken font-mono"
                >
                  <span className="font-heading font-black text-clay-text dark:text-white">{s.km} km</span>
                  <span className="text-clay-lime-dark dark:text-clay-lime font-bold">{s.paceMinPerKm}</span>
                  <span className="text-clay-text/60 dark:text-slate-400">{formatDuration(s.durationSeconds)}</span>
                  <span className="text-clay-text/50">+{s.elevationGainMeters}m</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {activity.notes && (
          <div className="p-3.5 rounded-xl clay-sunken text-xs text-clay-text/70 dark:text-slate-300 mb-6 italic">
            "{activity.notes}"
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3.5 px-4 rounded-clay-btn clay-btn text-clay-text dark:text-white font-heading font-black flex items-center justify-center gap-2 transition text-sm active:scale-95"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>Share Summary</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3.5 px-4 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black flex items-center justify-center gap-2 transition text-sm shadow-sm active:scale-95"
          >
            <span>Done</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
