import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Flame,
  Clock,
  Dumbbell,
  Check,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Footprints,
  TrendingUp,
  Gauge,
  Zap,
  Activity,
  Sliders,
  Plus,
  Minus,
  Award
} from 'lucide-react';
import { ActivityRecord, ActivityType, UserProfile } from '../../types';
import {
  calculateTreadmillCalories,
  formatDuration,
  formatPace,
} from '../../services/calculations';

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
  // Mode: Live treadmill meter vs Manual summary log
  const [tabMode, setTabMode] = useState<'live' | 'manual'>('live');

  // Activity & Machine
  const [machineType, setMachineType] = useState<'Treadmill' | 'Stationary Bike' | 'Elliptical' | 'Stair Climber'>('Treadmill');
  const [activityType, setActivityType] = useState<ActivityType>('walking');

  // Treadmill Controls (Incline up to 18%)
  const [inclinePercent, setInclinePercent] = useState<number>(3.0);
  const [targetCadenceSpm, setTargetCadenceSpm] = useState<number>(115); // steps per min (100 - 180 spm)
  const [notes, setNotes] = useState<string>('');

  // Live Tracking States (driven by steps, stride, duration, and incline)
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeDurationSeconds, setActiveDurationSeconds] = useState<number>(0);
  const [liveSteps, setLiveSteps] = useState<number>(0);

  // Manual Form State
  const [manualDurationMins, setManualDurationMins] = useState<number>(30);
  const [manualSteps, setManualSteps] = useState<number>(3500);

  // Stride length derived from user height: typical human walking stride is ~0.415 of height
  const userHeightCm = profile.heightCm || 175;
  const strideLengthMeters = Math.round(((userHeightCm * 0.415) / 100) * 100) / 100; // e.g. 0.73m

  // Derived Metrics from Steps & Active Time
  const liveDistanceMeters = Math.round(liveSteps * strideLengthMeters);
  const liveDistanceKm = liveDistanceMeters / 1000;
  
  // Calculate speed directly from steps and active duration: Speed = Distance / Time
  const liveSpeedKmh = activeDurationSeconds > 0
    ? Math.round(((liveDistanceMeters / 1000) / (activeDurationSeconds / 3600)) * 10) / 10
    : Math.round(((targetCadenceSpm * 60 * strideLengthMeters) / 1000) * 10) / 10;

  // Elevation climb on treadmill = distance * incline%
  const liveElevationGainMeters = Math.round(liveDistanceMeters * (inclinePercent / 100));

  // Calories burned via clinical ACSM treadmill equation
  const liveCalories = calculateTreadmillCalories(
    Math.max(1.0, liveSpeedKmh),
    inclinePercent,
    profile.currentWeightKg || 70,
    activeDurationSeconds
  );

  const timerIntervalRef = useRef<any>(null);
  const stepIntervalRef = useRef<any>(null);

  // Reset live tracking when modal closes
  useEffect(() => {
    if (!isOpen) {
      handleResetLiveTracker();
    }
  }, [isOpen]);

  // Master 1-second workout timer
  useEffect(() => {
    if (!isLiveActive || isPaused) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setActiveDurationSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isLiveActive, isPaused]);

  // Live Step accumulator based on walking cadence
  useEffect(() => {
    if (!isLiveActive || isPaused) {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      return;
    }

    // Convert Cadence (steps/min) to millisecond tick per step
    const msPerStep = Math.round(60000 / Math.max(60, targetCadenceSpm));
    stepIntervalRef.current = setInterval(() => {
      setLiveSteps((prev) => prev + 1);
    }, msPerStep);

    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, [isLiveActive, isPaused, targetCadenceSpm]);

  // Start / Pause / Reset Handlers
  const handleStartLive = () => {
    setIsLiveActive(true);
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleResetLiveTracker = () => {
    setIsLiveActive(false);
    setIsPaused(false);
    setActiveDurationSeconds(0);
    setLiveSteps(0);
  };

  // Adjust steps manually (e.g. sync with treadmill console)
  const handleAdjustSteps = (delta: number) => {
    setLiveSteps((prev) => Math.max(0, prev + delta));
  };

  // Save Workout Record
  const handleSaveWorkout = () => {
    const isLive = tabMode === 'live';
    const durationSeconds = isLive ? Math.max(10, activeDurationSeconds) : manualDurationMins * 60;
    const steps = isLive ? liveSteps : manualSteps;
    const distanceM = isLive ? liveDistanceMeters : Math.round(steps * strideLengthMeters);
    const speed = durationSeconds > 0 ? (distanceM / 1000) / (durationSeconds / 3600) : 4.5;
    const caloriesBurned = calculateTreadmillCalories(
      Math.max(1.0, speed),
      inclinePercent,
      profile.currentWeightKg || 70,
      durationSeconds
    );

    const record: ActivityRecord = {
      id: `act_indoor_${Date.now()}`,
      userId: profile.id,
      type: speed >= 7.5 ? 'running' : speed >= 5.5 ? 'jogging' : 'walking',
      environment: 'indoor',
      title: `Treadmill Walk (${inclinePercent}% Incline)`,
      startTime: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds,
      distanceMeters: distanceM,
      caloriesBurned: Math.max(1, caloriesBurned),
      elevationGainMeters: Math.round(distanceM * (inclinePercent / 100)),
      avgSpeedKmh: Math.round(speed * 10) / 10,
      avgPaceMinPerKm: formatPace(distanceM > 0 ? durationSeconds / (distanceM / 1000) : 0),
      splits: [],
      routePoints: [],
      steps: steps > 0 ? steps : undefined,
      indoorDetails: {
        machineType,
        treadmillIncline: inclinePercent,
        speedKmh: Math.round(speed * 10) / 10,
        steps,
        strideLengthMeters,
      },
      notes: notes || undefined,
    };

    onSave(record);
    handleResetLiveTracker();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-xl clay-card rounded-clay-card p-5 sm:p-7 shadow-2xl relative text-left my-auto max-h-[92vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                handleResetLiveTracker();
                onClose();
              }}
              className="absolute top-5 right-5 clay-pebble w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-90 cursor-pointer z-10"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5 pr-8">
              <div className="w-12 h-12 rounded-2xl clay-card-lime text-clay-text flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                <Gauge className="w-6 h-6 stroke-[2.3]" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-clay-text dark:text-white font-heading tracking-tight">
                  Treadmill Step Tracker
                </h3>
                <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400">
                  Step-driven distance, speed & incline calculation without device tracking
                </span>
              </div>
            </div>

            {/* Mode Selector Tabs: Live Treadmill Meter vs Manual Console Log */}
            <div className="clay-sunken p-1.5 rounded-full flex gap-1.5 mb-5">
              <button
                type="button"
                onClick={() => setTabMode('live')}
                className={`flex-1 py-2 rounded-full text-xs font-heading font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  tabMode === 'live'
                    ? 'clay-btn-lime text-clay-text scale-[1.02]'
                    : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Live Treadmill Meter</span>
              </button>

              <button
                type="button"
                onClick={() => setTabMode('manual')}
                className={`flex-1 py-2 rounded-full text-xs font-heading font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  tabMode === 'manual'
                    ? 'clay-btn-lime text-clay-text scale-[1.02]'
                    : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Console Step Summary</span>
              </button>
            </div>

            {/* TREADMILL INCLINE CONTROLS (0% - 18%) */}
            <div className="space-y-3.5 p-4 rounded-2xl clay-card-flat mb-5 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs font-heading font-black">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span className="text-clay-text dark:text-white uppercase tracking-wider">
                    Treadmill Incline:
                  </span>
                  <span className="font-mono text-base font-black text-amber-600 dark:text-amber-400">
                    {inclinePercent}%
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{Math.round(inclinePercent * 5.2)}% Calorie Burn Boost
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={18}
                step={0.5}
                value={inclinePercent}
                onChange={(e) => setInclinePercent(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2.5 rounded-lg bg-slate-200 dark:bg-slate-700"
              />

              {/* Quick Incline Preset Buttons */}
              <div className="grid grid-cols-6 gap-1.5 pt-0.5">
                {[
                  { label: '0%', val: 0 },
                  { label: '3%', val: 3 },
                  { label: '6%', val: 6 },
                  { label: '10%', val: 10 },
                  { label: '14%', val: 14 },
                  { label: '18%', val: 18 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setInclinePercent(p.val)}
                    className={`py-1.5 rounded-xl text-xs font-heading font-black transition active:scale-95 cursor-pointer ${
                      inclinePercent === p.val
                        ? 'clay-btn-lime text-clay-text font-black'
                        : 'clay-btn text-clay-text/70 dark:text-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: LIVE TREADMILL METER (Step & Incline Driven) */}
            {tabMode === 'live' && (
              <div className="space-y-4">
                {/* Walking Cadence / Pace Pace Setter */}
                <div className="p-3.5 rounded-2xl clay-sunken flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-heading font-black text-slate-800 dark:text-slate-200 block">
                      Walking Pace / Cadence
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Stride length: {Math.round(strideLengthMeters * 100)} cm
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'Gentle (100 spm)', spm: 100 },
                      { label: 'Brisk (120 spm)', spm: 120 },
                      { label: 'Power (140 spm)', spm: 140 },
                      { label: 'Jog (160 spm)', spm: 160 },
                    ].map((cad) => (
                      <button
                        key={cad.spm}
                        type="button"
                        onClick={() => setTargetCadenceSpm(cad.spm)}
                        className={`text-[10px] px-2 py-1 rounded-xl font-heading font-black transition active:scale-95 cursor-pointer ${
                          targetCadenceSpm === cad.spm
                            ? 'bg-slate-900 text-lime-400 dark:bg-lime-400 dark:text-slate-950'
                            : 'clay-btn text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cad.spm} spm
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Bento Live Display: Steps, Distance, Speed, Calories */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Step Count (Primary Hero) */}
                  <div className="p-4 rounded-2xl clay-card-lime text-clay-text col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Footprints className="w-4 h-4 text-slate-900" />
                        <span>Steps Counted</span>
                      </span>
                      {isLiveActive && !isPaused && (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-lime-300 text-slate-950 px-2 py-0.5 rounded-full animate-pulse">
                          ● WALKING
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-heading font-black font-mono">
                        {liveSteps.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-700">steps</span>
                    </div>

                    {/* Step Quick Adjust Steppers */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-900/10">
                      <span className="text-[10px] font-bold text-slate-700">Quick adjust:</span>
                      <button
                        type="button"
                        onClick={() => handleAdjustSteps(50)}
                        className="px-2 py-0.5 rounded-lg clay-btn text-[10px] font-black font-mono cursor-pointer active:scale-90"
                      >
                        +50
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustSteps(100)}
                        className="px-2 py-0.5 rounded-lg clay-btn text-[10px] font-black font-mono cursor-pointer active:scale-90"
                      >
                        +100
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustSteps(500)}
                        className="px-2 py-0.5 rounded-lg clay-btn text-[10px] font-black font-mono cursor-pointer active:scale-90"
                      >
                        +500
                      </button>
                    </div>
                  </div>

                  {/* Calculated Distance */}
                  <div className="p-4 rounded-2xl clay-card-sky text-slate-900">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider text-sky-900">
                        Distance
                      </span>
                      <Compass className="w-4 h-4 text-sky-800" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-heading font-black font-mono block">
                      {liveDistanceKm.toFixed(2)}{' '}
                      <span className="text-xs font-bold font-sans">km</span>
                    </span>
                    <span className="text-[10px] font-bold text-sky-900">
                      From step count
                    </span>
                  </div>

                  {/* Calculated Speed */}
                  <div className="p-4 rounded-2xl clay-card-butter text-slate-900">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider text-amber-900">
                        Speed
                      </span>
                      <Zap className="w-4 h-4 text-amber-800" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-heading font-black font-mono block">
                      {liveSpeedKmh.toFixed(1)}{' '}
                      <span className="text-xs font-bold font-sans">km/h</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-900">
                      Pace ~{formatPace(liveSpeedKmh > 0 ? 3600 / liveSpeedKmh : 0)}
                    </span>
                  </div>

                  {/* Active Duration */}
                  <div className="p-4 rounded-2xl clay-sunken">
                    <div className="flex items-center justify-between mb-1 text-slate-500">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider">
                        Workout Time
                      </span>
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-2xl font-heading font-black font-mono text-clay-text dark:text-white block">
                      {formatDuration(activeDurationSeconds)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Timer active
                    </span>
                  </div>

                  {/* Calories Burned via ACSM Incline Formula */}
                  <div className="p-4 rounded-2xl clay-card-coral text-slate-900">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider text-rose-900">
                        Calories
                      </span>
                      <Flame className="w-4 h-4 text-rose-800 fill-current" />
                    </div>
                    <span className="text-2xl font-heading font-black font-mono block">
                      {liveCalories} <span className="text-xs font-sans">kcal</span>
                    </span>
                    <span className="text-[10px] font-bold text-rose-900">
                      ACSM Treadmill eq.
                    </span>
                  </div>

                  {/* Elevation Climb */}
                  <div className="p-4 rounded-2xl clay-sunken col-span-2">
                    <div className="flex items-center justify-between mb-1 text-slate-500">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider">
                        Vertical Elevation Climb
                      </span>
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-2xl font-heading font-black font-mono text-amber-600 dark:text-amber-400 block">
                      +{liveElevationGainMeters} meters
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Calculated from {inclinePercent}% grade
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons: Start / Pause / Finish */}
                <div className="flex items-center gap-3 pt-2">
                  {!isLiveActive ? (
                    <button
                      type="button"
                      onClick={handleStartLive}
                      className="flex-1 py-4 rounded-clay-btn clay-btn-lime font-heading font-black text-clay-text flex items-center justify-center gap-2.5 text-base shadow-md active:scale-95 transition cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>Start Treadmill Walk</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleTogglePause}
                        className={`flex-1 py-4 rounded-clay-btn font-heading font-black flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 transition cursor-pointer ${
                          isPaused
                            ? 'clay-btn-lime text-clay-text'
                            : 'clay-btn-butter text-slate-900'
                        }`}
                      >
                        {isPaused ? (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>Resume</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4 fill-current" />
                            <span>Pause</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveWorkout}
                        className="flex-1 py-4 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 transition cursor-pointer"
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>Finish & Save ({liveCalories} kcal)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetLiveTracker}
                        className="w-12 h-12 rounded-2xl clay-btn flex items-center justify-center text-slate-500 hover:text-rose-500 active:scale-90 cursor-pointer"
                        title="Reset live tracking"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL CONSOLE LOG */}
            {tabMode === 'manual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Treadmill Steps
                    </label>
                    <div className="relative">
                      <Footprints className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={manualSteps}
                        onChange={(e) => setManualSteps(Math.max(0, Number(e.target.value)))}
                        className="clay-input w-full rounded-2xl pl-10 pr-3 py-2.5 font-mono text-sm font-bold text-clay-text dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Duration (Minutes)
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="number"
                        min={1}
                        max={360}
                        value={manualDurationMins}
                        onChange={(e) => setManualDurationMins(Math.max(1, Number(e.target.value)))}
                        className="clay-input w-full rounded-2xl pl-10 pr-3 py-2.5 font-mono text-sm font-bold text-clay-text dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculated Output Pill for Manual Mode */}
                <div className="p-4 rounded-2xl clay-card-flat flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Calculated Distance</span>
                    <span className="font-heading font-black text-sm text-clay-text dark:text-white">
                      {((manualSteps * strideLengthMeters) / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Calculated Speed</span>
                    <span className="font-heading font-black text-sm text-clay-text dark:text-white">
                      {manualDurationMins > 0 ? (((manualSteps * strideLengthMeters) / 1000) / (manualDurationMins / 60)).toFixed(1) : 0} km/h
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Est. Calories</span>
                    <span className="font-heading font-black text-sm text-lime-600 dark:text-lime-400">
                      {calculateTreadmillCalories(
                        manualDurationMins > 0 ? (((manualSteps * strideLengthMeters) / 1000) / (manualDurationMins / 60)) : 4.5,
                        inclinePercent,
                        profile.currentWeightKg || 70,
                        manualDurationMins * 60
                      )} kcal
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveWorkout}
                  className="w-full py-4 rounded-clay-btn clay-btn-lime font-heading font-black text-clay-text flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 transition cursor-pointer"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Log Treadmill Workout</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
