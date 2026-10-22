import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Flame,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Scale,
  Calendar,
  Zap,
  Info,
  User,
} from 'lucide-react';
import {
  UserProfile,
  Gender,
  ActivityLevel,
  FitnessGoal,
  UnitSystem
} from '../../types';
import {
  computeProfileCalculations,
  kgToLb,
  lbToKg,
  cmToFtIn,
  ftInToCm
} from '../../services/calculations';
import { WeightGauge } from '../common/WeightGauge';

interface OnboardingWizardProps {
  initialProfile?: UserProfile | null;
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialProfile,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialProfile?.unitSystem || 'metric');
  const [name, setName] = useState<string>(initialProfile?.name || '');
  const [email, setEmail] = useState<string>(initialProfile?.email || '');
  const [age, setAge] = useState<number>(initialProfile?.age || 26);
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || 'male');
  const [heightCm, setHeightCm] = useState<number>(initialProfile?.heightCm || 175);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(initialProfile?.currentWeightKg || 78);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(initialProfile?.targetWeightKg || 72);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialProfile?.activityLevel || 'moderate');
  const [goal, setGoal] = useState<FitnessGoal>(initialProfile?.goal || 'lose');
  const [targetPaceKgPerWeek, setTargetPaceKgPerWeek] = useState<number>(
    initialProfile?.targetPaceKgPerWeek || 0.5
  );

  // Imperial helper state
  const { feet: initialFeet, inches: initialInches } = cmToFtIn(heightCm);
  const [feet, setFeet] = useState<number>(initialFeet);
  const [inches, setInches] = useState<number>(initialInches);
  const [weightLbs, setWeightLbs] = useState<number>(kgToLb(currentWeightKg));
  const [targetWeightLbs, setTargetWeightLbs] = useState<number>(kgToLb(targetWeightKg));

  // Compute live calculations
  const calculations = computeProfileCalculations({
    age,
    gender,
    heightCm,
    currentWeightKg,
    targetWeightKg,
    activityLevel,
    goal,
    targetPaceKgPerWeek,
  });

  // Handle unit switch
  const handleUnitToggle = (newUnit: UnitSystem) => {
    setUnitSystem(newUnit);
    if (newUnit === 'imperial') {
      const { feet: f, inches: i } = cmToFtIn(heightCm);
      setFeet(f);
      setInches(i);
      setWeightLbs(kgToLb(currentWeightKg));
      setTargetWeightLbs(kgToLb(targetWeightKg));
    } else {
      setHeightCm(ftInToCm(feet, inches));
      setCurrentWeightKg(lbToKg(weightLbs));
      setTargetWeightKg(lbToKg(targetWeightLbs));
    }
  };

  const handleFinish = () => {
    const finalProfile: UserProfile = {
      id: initialProfile?.id || `usr_${Date.now()}`,
      email: email || 'user@carbodate.io',
      name: name || 'Fitness Explorer',
      age,
      gender,
      heightCm: unitSystem === 'metric' ? heightCm : ftInToCm(feet, inches),
      currentWeightKg: unitSystem === 'metric' ? currentWeightKg : lbToKg(weightLbs),
      targetWeightKg: unitSystem === 'metric' ? targetWeightKg : lbToKg(targetWeightLbs),
      activityLevel,
      goal,
      targetPaceKgPerWeek,
      unitSystem,
      dailyWaterGoalMl: Math.round(currentWeightKg * 35),
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      isDemoUser: false,
    };
    onComplete(finalProfile);
  };

  return (
    <div className="min-h-[100dvh] bg-[#EEF0FB] dark:bg-[#151722] flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 text-slate-800 dark:text-slate-100 py-6 sm:py-10">
      {/* Top Progress bar */}
      <div className="w-full max-w-xl mb-4 sm:mb-6 text-left">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-display font-black">
          <span className="flex items-center gap-1.5 text-lime-700 dark:text-lime-400">
            <Sparkles className="w-4 h-4" />
            <span>Step {step} of 4</span>
          </span>
          <span className="truncate ml-2">
            {step === 1 && 'Basic Bio & Units'}
            {step === 2 && 'Body Composition'}
            {step === 3 && 'Activity & Goals'}
            {step === 4 && 'Calculated Deficit Plan'}
          </span>
        </div>
        <div className="h-3 w-full clay-sunken rounded-full overflow-hidden p-0.5">
          <motion.div
            className="h-full rounded-full bg-[#B8F25B]"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="w-full max-w-xl clay-card rounded-clay-card p-5 sm:p-8 shadow-2xl relative overflow-hidden text-left">
        <AnimatePresence mode="wait">
          {/* STEP 1: Basic Bio & Unit Toggle */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-display">
                  Welcome to Carbodate
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Let's personalize your metabolic profile and caloric deficit targets.
                </p>
              </div>

              {/* Unit System Toggle */}
              <div className="clay-sunken p-1.5 rounded-full flex gap-1">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('metric')}
                  className={`flex-1 py-2 text-xs font-black rounded-full transition ${
                    unitSystem === 'metric'
                      ? 'clay-btn-lime'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Metric (kg, cm)
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('imperial')}
                  className={`flex-1 py-2 text-xs font-black rounded-full transition ${
                    unitSystem === 'imperial'
                      ? 'clay-btn-lime'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Imperial (lbs, ft/in)
                </button>
              </div>

              {/* Name & Email */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display mb-1.5">
                    Your Name
                  </label>
                  <div className="relative flex items-center">
                    <div className="w-10 h-10 clay-pebble rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-300 absolute left-2 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="clay-input w-full rounded-2xl pl-14 pr-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 font-bold border-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <div className="w-10 h-10 clay-pebble rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-300 absolute left-2 pointer-events-none">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="clay-input w-full rounded-2xl pl-14 pr-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 font-bold border-none transition"
                    />
                  </div>
                </div>

                {/* Age & Biological Sex in Clay Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Age Selector */}
                  <div className="clay-card-flat p-4 rounded-2xl">
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display mb-2">
                      Age (Years)
                    </label>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setAge(Math.max(14, age - 1))}
                        className="clay-btn w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-slate-700 dark:text-slate-200 active:scale-90"
                      >
                        -
                      </button>
                      <div className="clay-sunken flex-1 py-1.5 rounded-xl text-center">
                        <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">{age}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">yrs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAge(Math.min(95, age + 1))}
                        className="clay-btn w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-slate-700 dark:text-slate-200 active:scale-90"
                      >
                        +
                      </button>
                    </div>
                    {/* Quick age jumps */}
                    <div className="flex justify-between gap-1 mt-2.5">
                      {[18, 24, 28, 35, 45].map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAge(a)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition ${
                            age === a ? 'clay-btn-lime' : 'clay-sunken text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Biological Sex */}
                  <div className="clay-card-flat p-4 rounded-2xl">
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display mb-2">
                      Biological Sex
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'male' as Gender, label: 'Male', symbol: '♂' },
                        { id: 'female' as Gender, label: 'Female', symbol: '♀' },
                        { id: 'other' as Gender, label: 'Other', symbol: '⚥' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setGender(s.id)}
                          className={`py-2 px-1 rounded-xl text-center font-display font-black text-xs transition active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                            gender === s.id
                              ? 'clay-btn-lime'
                              : 'clay-btn text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-base leading-none">{s.symbol}</span>
                          <span className="text-[11px]">{s.label}</span>
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-2 text-center">
                      Used for Mifflin-St Jeor basal caloric math
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Height & Current Weight */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-display">
                  Height & Current Weight
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Used in the Mifflin-St Jeor equation to compute your basal metabolic rate.
                </p>
              </div>

              {/* Height Clay Control */}
              <div className="clay-card-flat p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display block">
                      Stature / Height
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {unitSystem === 'metric' ? 'Metric' : 'Imperial'} format
                    </span>
                  </div>
                  <div className="clay-sunken px-4 py-1.5 rounded-2xl text-center">
                    <span className="text-2xl font-black font-mono text-lime-700 dark:text-lime-400">
                      {unitSystem === 'metric' ? heightCm : `${feet}'${inches}"`}
                    </span>
                    <span className="text-xs font-bold text-slate-400 ml-1">
                      {unitSystem === 'metric' ? 'cm' : `(${heightCm} cm)`}
                    </span>
                  </div>
                </div>

                {unitSystem === 'metric' ? (
                  <>
                    <input
                      type="range"
                      min={120}
                      max={220}
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="clay-range my-2"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHeightCm(Math.max(120, heightCm - 5))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          -5cm
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeightCm(Math.max(120, heightCm - 1))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          -1cm
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHeightCm(Math.min(220, heightCm + 1))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          +1cm
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeightCm(Math.min(220, heightCm + 5))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          +5cm
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="clay-sunken p-3 rounded-2xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Feet:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newF = Math.max(3, feet - 1);
                            setFeet(newF);
                            setHeightCm(ftInToCm(newF, inches));
                          }}
                          className="clay-btn w-7 h-7 rounded-lg font-black text-xs"
                        >
                          -
                        </button>
                        <span className="text-lg font-mono font-black text-slate-800 dark:text-slate-100">{feet}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newF = Math.min(7, feet + 1);
                            setFeet(newF);
                            setHeightCm(ftInToCm(newF, inches));
                          }}
                          className="clay-btn w-7 h-7 rounded-lg font-black text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="clay-sunken p-3 rounded-2xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Inches:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newI = Math.max(0, inches - 1);
                            setInches(newI);
                            setHeightCm(ftInToCm(feet, newI));
                          }}
                          className="clay-btn w-7 h-7 rounded-lg font-black text-xs"
                        >
                          -
                        </button>
                        <span className="text-lg font-mono font-black text-slate-800 dark:text-slate-100">{inches}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newI = Math.min(11, inches + 1);
                            setInches(newI);
                            setHeightCm(ftInToCm(feet, newI));
                          }}
                          className="clay-btn w-7 h-7 rounded-lg font-black text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Weight Clay Control */}
              <div className="clay-card-flat p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display block">
                      Current Body Weight
                    </label>
                    <span className="text-[11px] text-slate-400">Morning weigh-in baseline</span>
                  </div>
                  <div className="clay-sunken px-4 py-1.5 rounded-2xl text-center">
                    <span className="text-2xl font-black font-mono text-lime-700 dark:text-lime-400">
                      {unitSystem === 'metric' ? currentWeightKg : weightLbs}
                    </span>
                    <span className="text-xs font-bold text-slate-400 ml-1">
                      {unitSystem === 'metric' ? 'kg' : 'lbs'}
                    </span>
                  </div>
                </div>

                {unitSystem === 'metric' ? (
                  <>
                    <input
                      type="range"
                      min={40}
                      max={180}
                      step={0.5}
                      value={currentWeightKg}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCurrentWeightKg(val);
                        setTargetWeightKg(Math.min(targetWeightKg, val));
                      }}
                      className="clay-range my-2"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.max(40, Math.round((currentWeightKg - 2) * 10) / 10);
                            setCurrentWeightKg(v);
                          }}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          -2kg
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.max(40, Math.round((currentWeightKg - 0.5) * 10) / 10);
                            setCurrentWeightKg(v);
                          }}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          -0.5kg
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.min(180, Math.round((currentWeightKg + 0.5) * 10) / 10);
                            setCurrentWeightKg(v);
                          }}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          +0.5kg
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.min(180, Math.round((currentWeightKg + 2) * 10) / 10);
                            setCurrentWeightKg(v);
                          }}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          +2kg
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="range"
                      min={90}
                      max={400}
                      step={1}
                      value={weightLbs}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setWeightLbs(val);
                        setCurrentWeightKg(lbToKg(val));
                      }}
                      className="clay-range my-2"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.max(90, weightLbs - 5);
                            setWeightLbs(v);
                            setCurrentWeightKg(lbToKg(v));
                          }}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          -5lbs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.max(90, weightLbs - 1);
                            setWeightLbs(v);
                            setCurrentWeightKg(lbToKg(v));
                          }}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          -1lb
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.min(400, weightLbs + 1);
                            setWeightLbs(v);
                            setCurrentWeightKg(lbToKg(v));
                          }}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          +1lb
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.min(400, weightLbs + 5);
                            setWeightLbs(v);
                            setCurrentWeightKg(lbToKg(v));
                          }}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          +5lbs
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Live Weight Gauge Preview */}
              <WeightGauge
                currentWeightKg={currentWeightKg}
                heightCm={heightCm}
                calculations={calculations}
                unitSystem={unitSystem}
              />
            </motion.div>
          )}

          {/* STEP 3: Activity Level & Goal Selection */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-display">
                  Lifestyle & Goal
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  How active are you, and what is your desired outcome?
                </p>
              </div>

              {/* Goal Selection */}
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display mb-2">
                  Primary Fitness Objective
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { id: 'lose' as FitnessGoal, label: 'Lose Fat', desc: 'Calorie Deficit' },
                    { id: 'maintain' as FitnessGoal, label: 'Maintain', desc: 'Energy Balance' },
                    { id: 'gain' as FitnessGoal, label: 'Build Mass', desc: 'Lean Surplus' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGoal(item.id)}
                      className={`p-3.5 rounded-2xl text-left transition flex flex-row sm:flex-col justify-between items-center sm:items-start active:scale-95 ${
                        goal === item.id
                          ? 'clay-card-lime font-black'
                          : 'clay-card-flat text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="font-black text-sm block font-display">{item.label}</span>
                        <span className="text-[11px] font-bold opacity-80 mt-0.5 block">{item.desc}</span>
                      </div>
                      {goal === item.id && (
                        <div className="w-6 h-6 rounded-full clay-pebble flex items-center justify-center sm:hidden text-slate-900">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Level Selection */}
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display mb-2">
                  Current Activity Level
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'sedentary' as ActivityLevel, title: 'Sedentary', desc: 'Desk job, little to no structured workouts' },
                    { id: 'light' as ActivityLevel, title: 'Lightly Active', desc: 'Light exercise / sports 1–3 days/week' },
                    { id: 'moderate' as ActivityLevel, title: 'Moderately Active', desc: 'Gym / cardio training 3–5 days/week (Recommended)' },
                    { id: 'very_active' as ActivityLevel, title: 'Very Active', desc: 'Intense training 6–7 days/week' },
                  ].map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setActivityLevel(level.id)}
                      className={`w-full p-3.5 rounded-2xl text-left transition flex items-center justify-between active:scale-95 ${
                        activityLevel === level.id
                          ? 'clay-card-lime font-black'
                          : 'clay-card-flat text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="font-black text-sm block font-display">{level.title}</span>
                        <span className="text-xs font-bold opacity-80">{level.desc}</span>
                      </div>
                      {activityLevel === level.id && (
                        <div className="w-6 h-6 rounded-full clay-pebble flex items-center justify-center text-slate-900">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Weight & Deficit Pace Slider (if lose/gain) */}
              {goal !== 'maintain' && (
                <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-display">
                        Target Goal Weight
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Healthy ({unitSystem === 'metric' ? `${calculations.idealWeightRangeKg.min} - ${calculations.idealWeightRangeKg.max} kg` : `${kgToLb(calculations.idealWeightRangeKg.min)} - ${kgToLb(calculations.idealWeightRangeKg.max)} lbs`})
                      </span>
                    </div>
                    <div className="clay-sunken px-3.5 py-1.5 rounded-2xl text-lime-700 dark:text-lime-400 font-black font-mono text-base">
                      {unitSystem === 'metric'
                        ? `${targetWeightKg} kg`
                        : `${targetWeightLbs} lbs`}
                    </div>
                  </div>

                  {unitSystem === 'metric' ? (
                    <>
                      <input
                        type="range"
                        min={40}
                        max={160}
                        step={0.5}
                        value={targetWeightKg}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setTargetWeightKg(v);
                          setTargetWeightLbs(kgToLb(v));
                        }}
                        className="clay-range my-2"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const v = Math.max(40, Math.round((targetWeightKg - 2) * 10) / 10);
                              setTargetWeightKg(v);
                              setTargetWeightLbs(kgToLb(v));
                            }}
                            className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                          >
                            -2kg
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const v = Math.max(40, Math.round((targetWeightKg - 0.5) * 10) / 10);
                              setTargetWeightKg(v);
                              setTargetWeightLbs(kgToLb(v));
                            }}
                            className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                          >
                            -0.5kg
                          </button>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const v = Math.min(160, Math.round((targetWeightKg + 0.5) * 10) / 10);
                              setTargetWeightKg(v);
                              setTargetWeightLbs(kgToLb(v));
                            }}
                            className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                          >
                            +0.5kg
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const v = Math.min(160, Math.round((targetWeightKg + 2) * 10) / 10);
                              setTargetWeightKg(v);
                              setTargetWeightLbs(kgToLb(v));
                            }}
                            className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                          >
                            +2kg
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type="range"
                        min={90}
                        max={350}
                        step={1}
                        value={targetWeightLbs}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setTargetWeightLbs(v);
                          setTargetWeightKg(lbToKg(v));
                        }}
                        className="clay-range my-2"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const v = Math.max(90, targetWeightLbs - 5);
                              setTargetWeightLbs(v);
                              setTargetWeightKg(lbToKg(v));
                            }}
                            className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                          >
                            -5lbs
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const v = Math.max(90, targetWeightLbs - 1);
                              setTargetWeightLbs(v);
                              setTargetWeightKg(lbToKg(v));
                            }}
                            className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                          >
                            -1lb
                          </button>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const v = Math.min(350, targetWeightLbs + 1);
                              setTargetWeightLbs(v);
                              setTargetWeightKg(lbToKg(v));
                            }}
                            className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                          >
                            +1lb
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const v = Math.min(350, targetWeightLbs + 5);
                              setTargetWeightLbs(v);
                              setTargetWeightKg(lbToKg(v));
                            }}
                            className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                          >
                            +5lbs
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Pace Slider */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">
                        Weekly Pace: <span className="text-slate-800 dark:text-slate-100 font-mono">{targetPaceKgPerWeek} kg/wk</span>
                      </span>
                      <span className="text-xs text-lime-600 dark:text-lime-400 font-mono font-black clay-sunken px-2 py-0.5 rounded-lg">
                        ~{Math.round((7700 * targetPaceKgPerWeek) / 7)} kcal/day
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={1.0}
                      step={0.1}
                      value={targetPaceKgPerWeek}
                      onChange={(e) => setTargetPaceKgPerWeek(Number(e.target.value))}
                      className="clay-range my-2"
                    />
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {[
                        { val: 0.2, label: '0.2 Gentle' },
                        { val: 0.5, label: '0.5 Optimal' },
                        { val: 0.8, label: '0.8 Steady' },
                        { val: 1.0, label: '1.0 Fast' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setTargetPaceKgPerWeek(item.val)}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-bold text-center transition active:scale-95 ${
                            targetPaceKgPerWeek === item.val
                              ? 'clay-btn-lime font-black'
                              : 'clay-btn text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: Comprehensive Metabolic Calculations & Safety Plan */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2 font-display">
                  <span>Your Metabolic Blueprint</span>
                  <Sparkles className="w-5 h-5 text-lime-500" />
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Calculated based on Mifflin-St Jeor and dynamic deficit pacing.
                </p>
              </div>

              {/* Safety Warning Banner if applicable */}
              {calculations.isSafetyWarning && (
                <div className="p-4 rounded-2xl clay-card-butter flex items-start gap-3 text-xs text-slate-900">
                  <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block font-display">Safety Floor Enforced</span>
                    <p className="mt-0.5 leading-relaxed font-bold">{calculations.safetyWarningMessage}</p>
                  </div>
                </div>
              )}

              {/* Target Calorie Hero Card */}
              <div className="clay-card-lime rounded-clay-card p-6 text-center relative overflow-hidden shadow-lg">
                <span className="text-xs uppercase font-black tracking-wider text-slate-800 font-display">
                  Daily Calorie Target
                </span>
                <div className="flex items-baseline justify-center gap-1.5 mt-1">
                  <span className="text-5xl font-black text-slate-900 tracking-tight font-mono">
                    {calculations.dailyCalorieTarget.toLocaleString()}
                  </span>
                  <span className="text-lg font-black text-slate-800">kcal/day</span>
                </div>

                <div className="flex items-center justify-center gap-4 mt-3 text-xs font-bold pt-3 border-t border-slate-800/20 text-slate-800">
                  <div>
                    <span className="block text-[11px] opacity-80">BMR</span>
                    <strong className="font-mono">{calculations.bmr} kcal</strong>
                  </div>
                  <div className="h-4 w-px bg-slate-800/30" />
                  <div>
                    <span className="block text-[11px] opacity-80">TDEE</span>
                    <strong className="font-mono">{calculations.tdee} kcal</strong>
                  </div>
                  <div className="h-4 w-px bg-slate-800/30" />
                  <div>
                    <span className="block text-[11px] opacity-80">Safety Floor</span>
                    <strong className="font-mono">{calculations.safetyFloor} kcal</strong>
                  </div>
                </div>
              </div>

              {/* Target Date & Projection Card */}
              <div className="clay-card-flat rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl clay-pebble text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold block font-display">Estimated Goal Date</span>
                    <span className="text-base font-black text-slate-800 dark:text-slate-100 font-display">
                      {calculations.estimatedGoalDate}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold block font-display">Duration</span>
                  <span className="text-sm font-black text-lime-600 dark:text-lime-400 font-mono">
                    ~{calculations.estimatedWeeks} Weeks
                  </span>
                </div>
              </div>

              {/* Macronutrient Split Recommendation */}
              <div className="clay-sunken rounded-2xl p-4">
                <span className="text-xs uppercase tracking-wider font-black text-slate-500 dark:text-slate-400 font-display block mb-2.5">
                  Macro Distribution (Suggested 35P / 40C / 25F)
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl clay-card-coral">
                    <span className="text-[11px] font-black block text-slate-900 font-display">Protein</span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {Math.round((calculations.dailyCalorieTarget * 0.35) / 4)}g
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl clay-card-butter">
                    <span className="text-[11px] font-black block text-slate-900 font-display">Carbs</span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {Math.round((calculations.dailyCalorieTarget * 0.40) / 4)}g
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl clay-card-sky">
                    <span className="text-[11px] font-black block text-slate-900 font-display">Fats</span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {Math.round((calculations.dailyCalorieTarget * 0.25) / 9)}g
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="clay-btn py-2.5 px-4 rounded-clay-btn text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 transition text-xs active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="py-2.5 px-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold text-xs"
              >
                Skip / Cancel
              </button>
            ) : <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="clay-btn-lime py-3 px-6 rounded-clay-btn text-xs font-black flex items-center gap-2 active:scale-95 transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="clay-btn-lime py-3 px-7 rounded-clay-btn text-xs font-black flex items-center gap-2 active:scale-95 transition shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Launch Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
