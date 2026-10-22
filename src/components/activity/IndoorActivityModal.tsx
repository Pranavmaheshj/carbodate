import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Clock, Dumbbell, Check, Compass } from 'lucide-react';
import { ActivityRecord, ActivityType, UserProfile } from '../../types';
import { estimateActivityCalories, formatPace } from '../../services/calculations';

interface IndoorActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: ActivityRecord) => void;
  profile: UserProfile;
}

export const IndoorActivityModal: React.FC<IndoorActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profile,
}) => {
  const [activityType, setActivityType] = useState<ActivityType>('running');
  const [machineType, setMachineType] = useState<'Treadmill' | 'Stationary Bike' | 'Elliptical' | 'Stair Climber'>('Treadmill');
  const [durationMins, setDurationMins] = useState<number>(30);
  const [distanceKm, setDistanceKm] = useState<number>(3.0);
  const [inclinePercent, setInclinePercent] = useState<number>(2.0);
  const [speedKmh, setSpeedKmh] = useState<number>(8.0);
  const [resistanceLevel, setResistanceLevel] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');

  const estimatedCalories = estimateActivityCalories(
    activityType,
    durationMins,
    profile.currentWeightKg || 75,
    'default',
    machineType === 'Treadmill' ? inclinePercent : 0
  );

  const handleSave = () => {
    const durationSeconds = durationMins * 60;
    const distanceMeters = Math.round(distanceKm * 1000);
    const avgSpeed = durationMins > 0 ? (distanceKm / (durationMins / 60)) : speedKmh;
    const avgPaceSec = distanceKm > 0 ? durationSeconds / distanceKm : 0;

    const record: ActivityRecord = {
      id: `act_indoor_${Date.now()}`,
      userId: profile.id,
      type: activityType,
      environment: 'indoor',
      title: `Indoor ${machineType}`,
      startTime: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds,
      distanceMeters,
      caloriesBurned: estimatedCalories,
      elevationGainMeters: machineType === 'Treadmill' ? Math.round(distanceMeters * (inclinePercent / 100)) : 0,
      avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
      avgPaceMinPerKm: formatPace(avgPaceSec),
      splits: [],
      routePoints: [],
      indoorDetails: {
        machineType,
        treadmillIncline: machineType === 'Treadmill' ? inclinePercent : undefined,
        speedKmh,
        resistanceLevel: machineType !== 'Treadmill' ? resistanceLevel : undefined,
      },
      notes: notes || undefined,
    };

    onSave(record);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg clay-card rounded-clay-card p-6 sm:p-7 shadow-2xl relative text-left my-auto max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 clay-pebble w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl clay-pebble text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-display">Log Indoor Cardio</h3>
                <span className="text-xs font-bold text-slate-400">Treadmill, bike, or elliptical with MET calculation</span>
              </div>
            </div>

            {/* Machine Type Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              {[
                { label: 'Treadmill', type: 'running' as ActivityType },
                { label: 'Stationary Bike', type: 'cycling' as ActivityType },
                { label: 'Elliptical', type: 'jogging' as ActivityType },
                { label: 'Stair Climber', type: 'walking' as ActivityType },
              ].map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => {
                    setMachineType(m.label as any);
                    setActivityType(m.type);
                  }}
                  className={`p-3 rounded-2xl text-center text-xs font-black transition active:scale-95 ${
                    machineType === m.label
                      ? 'clay-btn-lime'
                      : 'clay-btn text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Input Controls */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                    Duration (Minutes)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      min={1}
                      max={360}
                      value={durationMins}
                      onChange={(e) => setDurationMins(Math.max(1, Number(e.target.value)))}
                      className="clay-input w-full rounded-2xl pl-10 pr-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono text-sm font-bold border-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                    Distance (km)
                  </label>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(Number(e.target.value))}
                      className="clay-input w-full rounded-2xl pl-10 pr-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono text-sm font-bold border-none"
                    />
                  </div>
                </div>
              </div>

              {machineType === 'Treadmill' ? (
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Treadmill Incline: {inclinePercent}%</span>
                    <span className="text-lime-600 dark:text-lime-400 font-mono font-black">+{inclinePercent * 0.35} MET boost</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    step={0.5}
                    value={inclinePercent}
                    onChange={(e) => setInclinePercent(Number(e.target.value))}
                    className="w-full accent-lime-500 cursor-pointer"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Resistance Level: {resistanceLevel}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={resistanceLevel}
                    onChange={(e) => setResistanceLevel(Number(e.target.value))}
                    className="w-full accent-lime-500 cursor-pointer"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                  Workout Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Zone 2 steady cardio, felt great"
                  className="clay-input w-full rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 border-none"
                />
              </div>
            </div>

            {/* Estimated Calorie Burn Preview Card */}
            <div className="p-4 rounded-2xl clay-sunken flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl clay-pebble text-coral-500 flex items-center justify-center">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block font-display">Calculated Caloric Output</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                    {estimatedCalories} <span className="text-xs font-bold text-lime-600 dark:text-lime-400">kcal</span>
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400 font-mono">
                {profile.currentWeightKg} kg
              </span>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-4 rounded-clay-btn clay-btn-lime font-black flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Indoor Workout</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
