import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Waves, Clock, Check } from 'lucide-react';
import { ActivityRecord, UserProfile } from '../../types';
import { estimateActivityCalories, formatPace } from '../../services/calculations';

interface SwimmingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: ActivityRecord) => void;
  profile: UserProfile;
}

export const SwimmingModal: React.FC<SwimmingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profile,
}) => {
  const [waterType, setWaterType] = useState<'pool' | 'open_water'>('pool');
  const [poolLength, setPoolLength] = useState<number>(25);
  const [laps, setLaps] = useState<number>(30);
  const [openWaterDistanceMeters, setOpenWaterDistanceMeters] = useState<number>(1000);
  const [durationMins, setDurationMins] = useState<number>(30);
  const [stroke, setStroke] = useState<'freestyle' | 'breaststroke' | 'backstroke' | 'butterfly' | 'mixed'>('freestyle');
  const [notes, setNotes] = useState<string>('');

  const totalMeters = waterType === 'pool' ? laps * poolLength : openWaterDistanceMeters;

  const estimatedCalories = estimateActivityCalories(
    'swimming',
    durationMins,
    profile.currentWeightKg || 75,
    stroke === 'butterfly' ? 'vigorous' : 'default'
  );

  const handleSave = () => {
    const durationSeconds = durationMins * 60;
    const distanceKm = totalMeters / 1000;
    const avgSpeed = durationMins > 0 ? distanceKm / (durationMins / 60) : 1.5;
    const avgPaceSec = distanceKm > 0 ? durationSeconds / distanceKm : 0;

    const record: ActivityRecord = {
      id: `act_swim_${Date.now()}`,
      userId: profile.id,
      type: 'swimming',
      environment: waterType === 'pool' ? 'indoor' : 'outdoor',
      title: `${waterType === 'pool' ? 'Pool Laps' : 'Open Water Swim'} - ${stroke.charAt(0).toUpperCase() + stroke.slice(1)}`,
      startTime: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds,
      distanceMeters: totalMeters,
      caloriesBurned: estimatedCalories,
      elevationGainMeters: 0,
      avgSpeedKmh: Math.round(avgSpeed * 100) / 100,
      avgPaceMinPerKm: formatPace(avgPaceSec),
      splits: [],
      routePoints: [],
      swimmingDetails: {
        waterType,
        stroke,
        laps: waterType === 'pool' ? laps : undefined,
        poolLengthMeters: waterType === 'pool' ? poolLength : undefined,
      },
      notes: notes || `${laps} laps in ${poolLength}m pool with ${stroke} stroke.`,
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
              <div className="w-11 h-11 rounded-2xl clay-pebble text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Waves className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-display">Log Swim Workout</h3>
                <span className="text-xs font-bold text-slate-400">Track pool laps, stroke type & hydrodynamic output</span>
              </div>
            </div>

            {/* Water Type */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setWaterType('pool')}
                className={`py-3 px-4 rounded-2xl text-center text-xs font-black transition active:scale-95 ${
                  waterType === 'pool'
                    ? 'clay-btn-sky'
                    : 'clay-btn text-slate-600 dark:text-slate-300'
                }`}
              >
                Swimming Pool
              </button>
              <button
                type="button"
                onClick={() => setWaterType('open_water')}
                className={`py-3 px-4 rounded-2xl text-center text-xs font-black transition active:scale-95 ${
                  waterType === 'open_water'
                    ? 'clay-btn-sky'
                    : 'clay-btn text-slate-600 dark:text-slate-300'
                }`}
              >
                Open Water (Lake / Ocean)
              </button>
            </div>

            {/* Stroke Type */}
            <div className="mb-5">
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-2">
                Primary Stroke
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-center">
                {(['freestyle', 'breaststroke', 'backstroke', 'butterfly', 'mixed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStroke(s)}
                    className={`py-2 px-1 text-xs rounded-xl capitalize transition active:scale-95 ${
                      stroke === s
                        ? 'clay-btn-sky font-black'
                        : 'clay-btn text-slate-600 dark:text-slate-300 font-bold'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance & Laps Controls */}
            <div className="space-y-4 mb-6">
              {waterType === 'pool' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                      Pool Length
                    </label>
                    <select
                      value={poolLength}
                      onChange={(e) => setPoolLength(Number(e.target.value))}
                      className="clay-input w-full rounded-2xl px-3 py-2.5 text-slate-800 dark:text-slate-100 text-sm font-bold border-none cursor-pointer"
                    >
                      <option value={25} className="bg-white dark:bg-slate-800">25 Meters (Standard)</option>
                      <option value={50} className="bg-white dark:bg-slate-800">50 Meters (Olympic)</option>
                      <option value={20} className="bg-white dark:bg-slate-800">20 Meters</option>
                      <option value={33} className="bg-white dark:bg-slate-800">33 Yards</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                      Total Laps
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={laps}
                      onChange={(e) => setLaps(Math.max(1, Number(e.target.value)))}
                      className="clay-input w-full rounded-2xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono text-sm font-bold border-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                    Open Water Distance (Meters)
                  </label>
                  <input
                    type="number"
                    step={50}
                    min={50}
                    value={openWaterDistanceMeters}
                    onChange={(e) => setOpenWaterDistanceMeters(Number(e.target.value))}
                    className="clay-input w-full rounded-2xl px-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono text-sm font-bold border-none"
                  />
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                  Duration (Minutes)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={durationMins}
                    onChange={(e) => setDurationMins(Math.max(1, Number(e.target.value)))}
                    className="clay-input w-full rounded-2xl pl-10 pr-3 py-2.5 text-slate-800 dark:text-slate-100 font-mono text-sm font-bold border-none"
                  />
                </div>
              </div>
            </div>

            {/* Total Distance & Calorie Card */}
            <div className="p-4 rounded-2xl clay-sunken flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-slate-400 block font-display">Total Swim Volume</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {totalMeters.toLocaleString()} <span className="text-xs font-bold text-sky-600 dark:text-sky-400">m</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block font-display">Caloric Output</span>
                <span className="text-2xl font-black text-coral-600 dark:text-coral-400 font-mono">
                  {estimatedCalories} <span className="text-xs font-bold text-slate-400">kcal</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-4 rounded-clay-btn clay-btn-sky font-black flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Swim Workout</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
