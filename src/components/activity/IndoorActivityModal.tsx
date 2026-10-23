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
  AlertTriangle,
  Smartphone,
  Sliders,
} from 'lucide-react';
import { ActivityRecord, ActivityType, UserProfile } from '../../types';
import {
  estimateActivityCalories,
  calculateTreadmillCalories,
  calculateStrideLengthMeters,
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
  // Mode: Live interactive tracker vs Quick manual entry
  const [tabMode, setTabMode] = useState<'live' | 'manual'>('live');

  // Machine & Activity Types
  const [activityType, setActivityType] = useState<ActivityType>('running');
  const [machineType, setMachineType] = useState<'Treadmill' | 'Stationary Bike' | 'Elliptical' | 'Stair Climber'>('Treadmill');

  // Treadmill Controls (Incline up to 18%, Speed 1.0 - 20.0 km/h)
  const [inclinePercent, setInclinePercent] = useState<number>(2.0);
  const [speedKmh, setSpeedKmh] = useState<number>(8.0);
  const [resistanceLevel, setResistanceLevel] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');

  // Live Tracking State
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [isAutoPaused, setIsAutoPaused] = useState<boolean>(false);
  const [manualPause, setManualPause] = useState<boolean>(false);
  const [activeDurationSeconds, setActiveDurationSeconds] = useState<number>(0);
  const [liveSteps, setLiveSteps] = useState<number>(0);
  const [liveCalories, setLiveCalories] = useState<number>(0);
  const [liveDistanceMeters, setLiveDistanceMeters] = useState<number>(0);
  const [cadenceSpm, setCadenceSpm] = useState<number>(0);
  const [sensorPermissionNeeded, setSensorPermissionNeeded] = useState<boolean>(false);
  const [sensorActive, setSensorActive] = useState<boolean>(false);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);

  // Manual Form State
  const [manualDurationMins, setManualDurationMins] = useState<number>(30);
  const [manualDistanceKm, setManualDistanceKm] = useState<number>(3.5);
  const [manualSteps, setManualSteps] = useState<number>(4200);

  // Stride length derived from user profile
  const strideLengthMeters = calculateStrideLengthMeters(profile.heightCm || 175, speedKmh);

  // Sensor and step detection refs
  const lastStepTimeRef = useRef<number>(0);
  const lastMotionDetectedTimeRef = useRef<number>(Date.now());
  const recentStepTimestampsRef = useRef<number[]>([]);
  const lastAccelMagnitudeRef = useRef<number>(9.81);
  const timerIntervalRef = useRef<any>(null);
  const inactivityCheckRef = useRef<any>(null);

  // Reset or start when modal opens
  useEffect(() => {
    if (!isOpen) {
      handleResetLiveTracker();
    }
  }, [isOpen]);

  // Request motion sensor permissions (particularly iOS Safari)
  const requestSensorPermission = async () => {
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === 'granted') {
          setSensorPermissionNeeded(false);
          setSensorActive(true);
        } else {
          setSimulationActive(true);
        }
      } catch {
        setSimulationActive(true);
      }
    } else {
      setSensorActive(true);
    }
  };

  // Accelerometer motion listener for real step detection
  useEffect(() => {
    if (!isLiveActive || manualPause) return;

    let hasRegisteredMotion = false;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      hasRegisteredMotion = true;
      if (!sensorActive) setSensorActive(true);

      const acc = event.acceleration || event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      // Calculate total 3-axis magnitude
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const prevMag = lastAccelMagnitudeRef.current;
      lastAccelMagnitudeRef.current = magnitude;

      // Dynamic peak threshold (handles both pure acceleration and gravity-included sensors)
      const delta = Math.abs(magnitude - prevMag);
      const isPeak = (magnitude > 12.2 && delta > 2.0) || (delta > 3.2);

      const now = Date.now();
      // Debounce window: Human cadence is max ~3.8 steps/sec (~260ms minimum between steps)
      if (isPeak && (now - lastStepTimeRef.current) > 260) {
        lastStepTimeRef.current = now;
        lastMotionDetectedTimeRef.current = now;

        // Auto-resume if stopped
        if (isAutoPaused) {
          setIsAutoPaused(false);
        }

        // Register step
        setLiveSteps((prev) => prev + 1);

        // Keep rolling timestamps for live cadence (steps per minute)
        recentStepTimestampsRef.current.push(now);
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });

    // Fallback detection: If after 2.5s no hardware accelerometer events fire, enable simulation fallback
    const fallbackTimer = setTimeout(() => {
      if (!hasRegisteredMotion && !sensorActive) {
        setSimulationActive(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      clearTimeout(fallbackTimer);
    };
  }, [isLiveActive, manualPause, isAutoPaused, sensorActive]);

  // Cadence simulation helper for testing or when device lacks accelerometer
  useEffect(() => {
    if (!isLiveActive || manualPause || isAutoPaused || !simulationActive) return;

    // Estimate step frequency from belt speed: ~100 spm at 4 km/h to ~165 spm at 10 km/h
    const stepsPerSecond = Math.max(1.2, (speedKmh * 0.28) / strideLengthMeters);
    const intervalMs = Math.round(1000 / stepsPerSecond);

    const simInterval = setInterval(() => {
      const now = Date.now();
      lastMotionDetectedTimeRef.current = now;
      setLiveSteps((prev) => prev + 1);
      recentStepTimestampsRef.current.push(now);
    }, intervalMs);

    return () => clearInterval(simInterval);
  }, [isLiveActive, manualPause, isAutoPaused, simulationActive, speedKmh, strideLengthMeters]);

  // Master 1-second interval: Updates Active Duration, ACSM Live Calories, Distance, Cadence, & Inactivity Auto-Pause
  useEffect(() => {
    if (!isLiveActive || manualPause) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceMotion = now - lastMotionDetectedTimeRef.current;

      // Auto-pause if user stopped walking or jogging for more than 3.5 seconds
      if (timeSinceMotion > 3500 && !simulationActive) {
        if (!isAutoPaused) {
          setIsAutoPaused(true);
          setCadenceSpm(0);
        }
        return; // Halt accumulation while paused
      }

      // If active, accumulate 1 second of active workout time
      setActiveDurationSeconds((prev) => {
        const nextSec = prev + 1;

        // Calculate live calories with clinical ACSM Treadmill equation
        const cal = calculateTreadmillCalories(
          speedKmh,
          inclinePercent,
          profile.currentWeightKg || 75,
          nextSec
        );
        setLiveCalories(cal);

        return nextSec;
      });

      // Calculate Cadence (steps in last 10 seconds scaled to 60s)
      const tenSecsAgo = now - 10000;
      recentStepTimestampsRef.current = recentStepTimestampsRef.current.filter((t) => t > tenSecsAgo);
      const recentCount = recentStepTimestampsRef.current.length;
      const spm = Math.round((recentCount / 10) * 60);
      setCadenceSpm(spm);

    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isLiveActive, manualPause, isAutoPaused, speedKmh, inclinePercent, profile.currentWeightKg, simulationActive]);

  // Sync Live Distance based on steps * stride length (or belt speed)
  useEffect(() => {
    if (liveSteps > 0) {
      const dist = Math.round(liveSteps * strideLengthMeters);
      setLiveDistanceMeters(dist);
    } else if (activeDurationSeconds > 0) {
      const dist = Math.round((speedKmh * 1000 / 3600) * activeDurationSeconds);
      setLiveDistanceMeters(dist);
    }
  }, [liveSteps, activeDurationSeconds, strideLengthMeters, speedKmh]);

  // Start / Pause / Reset Handlers
  const handleStartLive = () => {
    requestSensorPermission();
    setIsLiveActive(true);
    setManualPause(false);
    setIsAutoPaused(false);
    lastMotionDetectedTimeRef.current = Date.now();
  };

  const handleToggleManualPause = () => {
    setManualPause(!manualPause);
    lastMotionDetectedTimeRef.current = Date.now();
  };

  const handleResetLiveTracker = () => {
    setIsLiveActive(false);
    setIsAutoPaused(false);
    setManualPause(false);
    setActiveDurationSeconds(0);
    setLiveSteps(0);
    setLiveCalories(0);
    setLiveDistanceMeters(0);
    setCadenceSpm(0);
    recentStepTimestampsRef.current = [];
  };

  // Save Workout Record
  const handleSaveWorkout = () => {
    const isLive = tabMode === 'live';
    const durationSeconds = isLive ? activeDurationSeconds : manualDurationMins * 60;
    const distanceM = isLive ? liveDistanceMeters : Math.round(manualDistanceKm * 1000);
    const steps = isLive ? liveSteps : manualSteps;

    const caloriesBurned = isLive
      ? liveCalories
      : calculateTreadmillCalories(
          speedKmh,
          inclinePercent,
          profile.currentWeightKg || 75,
          durationSeconds
        );

    const avgSpeed = durationSeconds > 0 ? (distanceM / 1000) / (durationSeconds / 3600) : speedKmh;
    const avgPaceSec = distanceM > 0 ? durationSeconds / (distanceM / 1000) : 0;

    const record: ActivityRecord = {
      id: `act_indoor_${Date.now()}`,
      userId: profile.id,
      type: activityType,
      environment: 'indoor',
      title: `Indoor ${machineType} (${inclinePercent}% Incline)`,
      startTime: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: Math.max(10, durationSeconds),
      distanceMeters: distanceM,
      caloriesBurned: Math.max(1, caloriesBurned),
      elevationGainMeters: machineType === 'Treadmill' ? Math.round(distanceM * (inclinePercent / 100)) : 0,
      avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
      avgPaceMinPerKm: formatPace(avgPaceSec),
      splits: [],
      routePoints: [],
      indoorDetails: {
        machineType,
        treadmillIncline: machineType === 'Treadmill' ? inclinePercent : undefined,
        speedKmh,
        resistanceLevel: machineType !== 'Treadmill' ? resistanceLevel : undefined,
        steps: steps > 0 ? steps : undefined,
        cadenceSpm: cadenceSpm > 0 ? cadenceSpm : undefined,
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
              className="absolute top-5 right-5 clay-pebble w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-90"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl clay-card-lime text-clay-text flex items-center justify-center font-bold shadow-sm">
                <Gauge className="w-6 h-6 stroke-[2.3]" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-clay-text dark:text-white font-heading tracking-tight">
                  Treadmill & Indoor Cardio
                </h3>
                <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400">
                  Live auto-pausing pedometer, 18% incline & ACSM calories
                </span>
              </div>
            </div>

            {/* Mode Selector Tabs: Live Tracker vs Manual Entry */}
            <div className="clay-sunken p-1.5 rounded-full flex gap-1.5 mb-5">
              <button
                type="button"
                onClick={() => setTabMode('live')}
                className={`flex-1 py-2 rounded-full text-xs font-heading font-black transition flex items-center justify-center gap-2 ${
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
                className={`flex-1 py-2 rounded-full text-xs font-heading font-black transition flex items-center justify-center gap-2 ${
                  tabMode === 'manual'
                    ? 'clay-btn-lime text-clay-text scale-[1.02]'
                    : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Manual Summary Log</span>
              </button>
            </div>

            {/* Machine Selector */}
            <div className="grid grid-cols-4 gap-2 mb-5">
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
                  className={`p-2.5 rounded-2xl text-center text-xs font-heading font-black transition active:scale-95 ${
                    machineType === m.label
                      ? 'clay-btn-lime text-clay-text'
                      : 'clay-card-flat text-clay-text/70 dark:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* TREADMILL HARDWARE CONTROLS: Incline (0 - 18%) & Speed */}
            <div className="space-y-4 p-4 rounded-2xl clay-card-flat mb-5">
              {/* Incline Slider & Steppers up to 18% */}
              <div>
                <div className="flex items-center justify-between text-xs font-heading font-black mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
                  className="w-full accent-amber-500 cursor-pointer h-2 rounded-lg bg-slate-200 dark:bg-slate-700"
                />

                {/* Quick Incline Preset Buttons */}
                <div className="flex items-center justify-between gap-1.5 mt-2.5">
                  {[
                    { label: '0% Flat', val: 0 },
                    { label: '3% Low', val: 3 },
                    { label: '6% Hill', val: 6 },
                    { label: '10% Steep', val: 10 },
                    { label: '14% Heavy', val: 14 },
                    { label: '18% Max', val: 18 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setInclinePercent(p.val)}
                      className={`px-2 py-1 rounded-xl text-[11px] font-heading font-black transition active:scale-95 ${
                        inclinePercent === p.val
                          ? 'clay-btn-lime text-clay-text'
                          : 'clay-btn text-clay-text/60 dark:text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Belt Speed (km/h) */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs font-heading font-black mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-clay-sky-dark dark:text-clay-sky" />
                    <span className="text-clay-text dark:text-white uppercase tracking-wider">
                      Belt Speed:
                    </span>
                    <span className="font-mono text-base font-black text-clay-sky-dark dark:text-clay-sky">
                      {speedKmh.toFixed(1)} km/h
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    Pace ~{formatPace(speedKmh > 0 ? 3600 / speedKmh : 0)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSpeedKmh(Math.max(1.0, Math.round((speedKmh - 0.5) * 10) / 10))}
                    className="w-10 h-10 rounded-2xl clay-btn flex items-center justify-center font-heading font-black text-sm active:scale-90"
                  >
                    -
                  </button>

                  <input
                    type="range"
                    min={1.0}
                    max={20.0}
                    step={0.1}
                    value={speedKmh}
                    onChange={(e) => setSpeedKmh(Number(e.target.value))}
                    className="flex-1 accent-sky-500 cursor-pointer h-2 rounded-lg bg-slate-200 dark:bg-slate-700"
                  />

                  <button
                    type="button"
                    onClick={() => setSpeedKmh(Math.min(20.0, Math.round((speedKmh + 0.5) * 10) / 10))}
                    className="w-10 h-10 rounded-2xl clay-btn flex items-center justify-center font-heading font-black text-sm active:scale-90"
                  >
                    +
                  </button>
                </div>

                {/* Quick Speed Presets */}
                <div className="flex items-center justify-between gap-1.5 mt-2.5">
                  {[
                    { label: '4.0 Walk', val: 4.0 },
                    { label: '6.0 Power', val: 6.0 },
                    { label: '8.5 Jog', val: 8.5 },
                    { label: '11.0 Run', val: 11.0 },
                    { label: '14.0 Sprint', val: 14.0 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setSpeedKmh(p.val)}
                      className={`px-2 py-1 rounded-xl text-[11px] font-heading font-black transition active:scale-95 ${
                        Math.abs(speedKmh - p.val) < 0.2
                          ? 'clay-btn-sky text-clay-text'
                          : 'clay-btn text-clay-text/60 dark:text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TAB 1: LIVE INTERACTIVE PEDOMETER & CALORIE METER */}
            {tabMode === 'live' && (
              <div className="space-y-5">
                {/* Auto-Pause & Motion Detection Status Pill */}
                <div className="flex items-center justify-between p-3 rounded-2xl clay-sunken">
                  <div className="flex items-center gap-2.5">
                    {isLiveActive && !manualPause && !isAutoPaused ? (
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                    )}
                    <div>
                      <span className="text-xs font-heading font-black text-clay-text dark:text-white block">
                        {!isLiveActive
                          ? 'Live Sensor Standby'
                          : manualPause
                          ? 'Workout Manually Paused'
                          : isAutoPaused
                          ? 'AUTO-PAUSED: Stopped Moving'
                          : 'ACTIVE: Walking / Jogging Detected'}
                      </span>
                      <span className="text-[10px] text-clay-text/60 dark:text-slate-400 font-bold block">
                        {isAutoPaused
                          ? 'Meter halted automatically. Start walking to resume!'
                          : 'Live accelerometer tracking steps on treadmill'}
                      </span>
                    </div>
                  </div>

                  {/* Sensor Mode Toggle Pill */}
                  <button
                    type="button"
                    onClick={() => setSimulationActive(!simulationActive)}
                    className="clay-chip px-2.5 py-1 text-[10px] font-mono font-bold bg-clay-lilac/30 text-clay-text dark:text-white active:scale-95"
                    title="Toggle hardware accelerometer vs speed-based simulator"
                  >
                    {simulationActive ? 'Simulated Cadence' : 'Hardware Sensor'}
                  </button>
                </div>

                {/* Live Bento Dashboard: Steps, Calories, Distance, Duration, Cadence */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Steps Hero */}
                  <div className="p-4 rounded-2xl clay-card-lime text-clay-text text-center sm:text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider text-slate-700">
                        Live Steps
                      </span>
                      <Footprints className="w-4 h-4 text-slate-800" />
                    </div>
                    <span className="text-3xl font-heading font-black font-mono block">
                      {liveSteps.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700">
                      Stride ~{Math.round(strideLengthMeters * 100)} cm
                    </span>
                  </div>

                  {/* Calories Burned */}
                  <div className="p-4 rounded-2xl clay-card-coral text-slate-900 text-center sm:text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider text-rose-900">
                        Calories Burned
                      </span>
                      <Flame className="w-4 h-4 text-rose-800 fill-current" />
                    </div>
                    <span className="text-3xl font-heading font-black font-mono block">
                      {liveCalories} <span className="text-xs font-bold font-sans">kcal</span>
                    </span>
                    <span className="text-[10px] font-bold text-rose-900">
                      ACSM Incline Formula
                    </span>
                  </div>

                  {/* Distance */}
                  <div className="p-4 rounded-2xl clay-card-sky text-slate-900 text-center sm:text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider text-sky-900">
                        Distance
                      </span>
                      <Compass className="w-4 h-4 text-sky-800" />
                    </div>
                    <span className="text-3xl font-heading font-black font-mono block">
                      {(liveDistanceMeters / 1000).toFixed(2)}{' '}
                      <span className="text-xs font-bold font-sans">km</span>
                    </span>
                    <span className="text-[10px] font-bold text-sky-900">
                      {(liveDistanceMeters * 0.000621371).toFixed(2)} mi
                    </span>
                  </div>

                  {/* Active Duration */}
                  <div className="p-4 rounded-2xl clay-sunken text-center sm:text-left">
                    <div className="flex items-center justify-between mb-1 text-slate-500">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider">
                        Active Time
                      </span>
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-2xl font-heading font-black font-mono text-clay-text dark:text-white block">
                      {formatDuration(activeDurationSeconds)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Auto-pauses when stopped
                    </span>
                  </div>

                  {/* Cadence (Steps per Min) */}
                  <div className="p-4 rounded-2xl clay-sunken text-center sm:text-left">
                    <div className="flex items-center justify-between mb-1 text-slate-500">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider">
                        Cadence
                      </span>
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-2xl font-heading font-black font-mono text-clay-text dark:text-white block">
                      {cadenceSpm} <span className="text-xs font-sans text-slate-400">spm</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Steps per minute
                    </span>
                  </div>

                  {/* Incline Elevation Gain */}
                  <div className="p-4 rounded-2xl clay-sunken text-center sm:text-left">
                    <div className="flex items-center justify-between mb-1 text-slate-500">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider">
                        Vertical Climb
                      </span>
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-2xl font-heading font-black font-mono text-amber-600 dark:text-amber-400 block">
                      {Math.round(liveDistanceMeters * (inclinePercent / 100))} m
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      At {inclinePercent}% grade
                    </span>
                  </div>
                </div>

                {/* Live Action Controls (Start / Pause / Resume / Finish) */}
                <div className="flex items-center gap-3 pt-2">
                  {!isLiveActive ? (
                    <button
                      type="button"
                      onClick={handleStartLive}
                      className="flex-1 py-4 rounded-clay-btn clay-btn-lime font-heading font-black text-clay-text flex items-center justify-center gap-2.5 text-base shadow-md active:scale-95 transition"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>Start Treadmill Workout</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleToggleManualPause}
                        className={`flex-1 py-4 rounded-clay-btn font-heading font-black flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 transition ${
                          manualPause
                            ? 'clay-btn-lime text-clay-text'
                            : 'clay-btn-butter text-slate-900'
                        }`}
                      >
                        {manualPause ? (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>Resume</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4 fill-current" />
                            <span>Manual Pause</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveWorkout}
                        className="flex-1 py-4 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 transition"
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>Finish & Save</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetLiveTracker}
                        className="w-12 h-12 rounded-2xl clay-btn flex items-center justify-center text-slate-500 hover:text-rose-500 active:scale-90"
                        title="Reset live tracking"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL SUMMARY LOG (Quick Console Entry) */}
            {tabMode === 'manual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                  <div>
                    <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Distance (km)
                    </label>
                    <div className="relative">
                      <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        value={manualDistanceKm}
                        onChange={(e) => setManualDistanceKm(Math.max(0, Number(e.target.value)))}
                        className="clay-input w-full rounded-2xl pl-10 pr-3 py-2.5 font-mono text-sm font-bold text-clay-text dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Console Steps
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
                </div>

                {/* Calculated Output Card */}
                <div className="p-4 rounded-2xl clay-sunken flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl clay-card-coral text-slate-900 flex items-center justify-center">
                      <Flame className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400 block font-heading">
                        ACSM Calculated Output ({inclinePercent}% Incline)
                      </span>
                      <span className="text-2xl font-black text-clay-text dark:text-white font-mono">
                        {calculateTreadmillCalories(
                          speedKmh,
                          inclinePercent,
                          profile.currentWeightKg || 75,
                          manualDurationMins * 60
                        )}{' '}
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">kcal</span>
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-clay-text/60 dark:text-slate-400">
                    {profile.currentWeightKg} kg
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Workout Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. 12-3-30 incline workout, steady cadence"
                    className="clay-input w-full rounded-2xl px-4 py-2.5 text-sm text-clay-text dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveWorkout}
                  className="w-full py-4 rounded-clay-btn clay-btn-lime font-heading font-black text-clay-text flex items-center justify-center gap-2 active:scale-95 transition text-sm shadow-md mt-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Indoor Workout Record</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
