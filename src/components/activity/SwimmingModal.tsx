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
            className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-2xl relative text-left my-auto max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                <Waves className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Log Swim Workout</h3>
                <span className="text-xs text-slate-500">Track pool laps, stroke type & hydrodynamic output</span>
              </div>
            </div>

            {/* Water Type */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setWaterType('pool')}
                className={`py-3 px-4 rounded-2xl border text-center text-xs font-bold transition ${
                  waterType === 'pool'
                    ? 'bg-sky-50 border-sky-400 text-sky-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Swimming Pool
              </button>
              <button
                type="button"
                onClick={() => setWaterType('open_water')}
                className={`py-3 px-4 rounded-2xl border text-center text-xs font-bold transition ${
                  waterType === 'open_water'
                    ? 'bg-sky-50 border-sky-400 text-sky-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Open Water (Lake / Ocean)
              </button>
            </div>

            {/* Stroke Type */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Primary Stroke
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-center">
                {(['freestyle', 'breaststroke', 'backstroke', 'butterfly', 'mixed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStroke(s)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl capitalize transition border ${
                      stroke === s
                        ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pool Length
                    </label>
                    <select
                      value={poolLength}
                      onChange={(e) => setPoolLength(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                    >
                      <option value={25}>25 Meters (Standard)</option>
                      <option value={50}>50 Meters (Olympic)</option>
                      <option value={20}>20 Meters</option>
                      <option value={33}>33 Yards</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total Laps
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={laps}
                      onChange={(e) => setLaps(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Open Water Distance (Meters)
                  </label>
                  <input
                    type="number"
                    step={50}
                    min={50}
                    value={openWaterDistanceMeters}
                    onChange={(e) => setOpenWaterDistanceMeters(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (Minutes)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={durationMins}
                    onChange={(e) => setDurationMins(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Total Distance & Calorie Card */}
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between mb-6">
              <div>
                <span className="text-xs text-slate-600 block">Total Swim Volume</span>
                <span className="text-2xl font-black text-slate-900">
                  {totalMeters.toLocaleString()} <span className="text-xs font-bold text-sky-700">m</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-600 block">Caloric Output</span>
                <span className="text-2xl font-black text-amber-600">
                  {estimatedCalories} <span className="text-xs font-bold text-slate-500">kcal</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-sm"
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
