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
  Info
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
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 text-slate-800 py-6 sm:py-10">
      {/* Top Progress bar */}
      <div className="w-full max-w-xl mb-4 sm:mb-6 text-left">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
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
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-8 shadow-xl relative overflow-hidden text-left">
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
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Welcome to Carbodate
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Let's personalize your metabolic profile and caloric deficit targets.
                </p>
              </div>

              {/* Unit System Toggle */}
              <div className="p-1 bg-slate-100 rounded-2xl flex border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('metric')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    unitSystem === 'metric'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Metric (kg, cm)
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('imperial')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    unitSystem === 'imperial'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Imperial (lbs, ft/in)
                </button>
              </div>

              {/* Name & Email */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      min={14}
                      max={95}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Biological Sex
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Non-binary</option>
                    </select>
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
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Height & Current Weight
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Used in the Mifflin-St Jeor equation to compute your basal metabolic rate.
                </p>
              </div>

              {/* Height input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Height ({unitSystem === 'metric' ? 'cm' : 'feet & inches'})
                </label>
                {unitSystem === 'metric' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={120}
                      max={220}
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="flex-1 accent-emerald-500 cursor-pointer"
                    />
                    <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-lg font-bold font-mono text-emerald-700 w-24 text-center">
                      {heightCm} <span className="text-xs text-slate-500">cm</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 mb-1 block">Feet</span>
                      <input
                        type="number"
                        min={3}
                        max={7}
                        value={feet}
                        onChange={(e) => {
                          const f = Number(e.target.value);
                          setFeet(f);
                          setHeightCm(ftInToCm(f, inches));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono focus:bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 mb-1 block">Inches</span>
                      <input
                        type="number"
                        min={0}
                        max={11}
                        value={inches}
                        onChange={(e) => {
                          const i = Number(e.target.value);
                          setInches(i);
                          setHeightCm(ftInToCm(feet, i));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono focus:bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Current Weight input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                </label>
                {unitSystem === 'metric' ? (
                  <div className="flex items-center gap-3">
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
                      className="flex-1 accent-emerald-500 cursor-pointer"
                    />
                    <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-lg font-bold font-mono text-emerald-700 w-28 text-center">
                      {currentWeightKg} <span className="text-xs text-slate-500">kg</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
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
                      className="flex-1 accent-emerald-500 cursor-pointer"
                    />
                    <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-lg font-bold font-mono text-emerald-700 w-28 text-center">
                      {weightLbs} <span className="text-xs text-slate-500">lbs</span>
                    </div>
                  </div>
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
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lifestyle & Goal
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  How active are you, and what is your desired outcome?
                </p>
              </div>

              {/* Goal Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
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
                      className={`p-3 rounded-2xl border text-left transition flex flex-row sm:flex-col justify-between items-center sm:items-start ${
                        goal === item.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{item.label}</span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">{item.desc}</span>
                      </div>
                      {goal === item.id && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center sm:hidden">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Level Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
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
                      className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                        activityLevel === level.id
                          ? 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{level.title}</span>
                        <span className="text-xs text-slate-500">{level.desc}</span>
                      </div>
                      {activityLevel === level.id && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Weight & Deficit Pace Slider (if lose/gain) */}
              {goal !== 'maintain' && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                        Target Goal Weight
                      </span>
                      <span className="text-xs text-slate-500">
                        Aim within healthy range ({calculations.idealWeightRangeKg.min} - {calculations.idealWeightRangeKg.max} kg)
                      </span>
                    </div>
                    <div className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl text-emerald-700 font-bold font-mono">
                      {unitSystem === 'metric'
                        ? `${targetWeightKg} kg`
                        : `${targetWeightLbs} lbs`}
                    </div>
                  </div>

                  <input
                    type="range"
                    min={45}
                    max={120}
                    step={0.5}
                    value={targetWeightKg}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setTargetWeightKg(v);
                      setTargetWeightLbs(kgToLb(v));
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />

                  {/* Pace Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Weekly Pace: {targetPaceKgPerWeek} kg/week ({Math.round(targetPaceKgPerWeek * 2.2 * 10) / 10} lbs/wk)
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        ~{Math.round((7700 * targetPaceKgPerWeek) / 7)} kcal/day deficit
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={1.0}
                      step={0.1}
                      value={targetPaceKgPerWeek}
                      onChange={(e) => setTargetPaceKgPerWeek(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                      <span>0.2 kg/wk (Gentle)</span>
                      <span className="text-emerald-700 font-semibold">0.5 kg/wk (Default)</span>
                      <span>1.0 kg/wk (Aggressive max)</span>
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
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <span>Your Metabolic Blueprint</span>
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Calculated based on Mifflin-St Jeor and dynamic deficit pacing.
                </p>
              </div>

              {/* Safety Warning Banner if applicable */}
              {calculations.isSafetyWarning && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-800">Safety Floor Enforced</span>
                    <p className="mt-0.5 leading-relaxed">{calculations.safetyWarningMessage}</p>
                  </div>
                </div>
              )}

              {/* Target Calorie Hero Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 rounded-3xl p-6 text-center relative overflow-hidden shadow-sm">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
                  Daily Calorie Target
                </span>
                <div className="flex items-baseline justify-center gap-1.5 mt-1">
                  <span className="text-5xl font-black text-slate-900 tracking-tight">
                    {calculations.dailyCalorieTarget.toLocaleString()}
                  </span>
                  <span className="text-lg font-bold text-emerald-600">kcal/day</span>
                </div>

                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-600 pt-3 border-t border-emerald-200/60">
                  <div>
                    <span className="text-slate-500 block text-[11px]">BMR</span>
                    <strong className="text-slate-800">{calculations.bmr} kcal</strong>
                  </div>
                  <div className="h-4 w-px bg-slate-300" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">TDEE Maintenance</span>
                    <strong className="text-slate-800">{calculations.tdee} kcal</strong>
                  </div>
                  <div className="h-4 w-px bg-slate-300" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Safety Floor</span>
                    <strong className="text-emerald-700">{calculations.safetyFloor} kcal</strong>
                  </div>
                </div>
              </div>

              {/* Target Date & Projection Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Estimated Goal Date</span>
                    <span className="text-base font-bold text-slate-900">
                      {calculations.estimatedGoalDate}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Duration</span>
                  <span className="text-sm font-semibold text-emerald-700">
                    ~{calculations.estimatedWeeks} Weeks
                  </span>
                </div>
              </div>

              {/* Macronutrient Split Recommendation */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-600 block mb-2.5">
                  Macro Distribution (Suggested 35P / 40C / 25F)
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[11px] text-rose-700 font-semibold block">Protein</span>
                    <span className="text-sm font-bold text-slate-900">
                      {Math.round((calculations.dailyCalorieTarget * 0.35) / 4)}g
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[11px] text-amber-700 font-semibold block">Carbs</span>
                    <span className="text-sm font-bold text-slate-900">
                      {Math.round((calculations.dailyCalorieTarget * 0.40) / 4)}g
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-teal-50 border border-teal-200">
                    <span className="text-[11px] text-teal-700 font-semibold block">Healthy Fat</span>
                    <span className="text-sm font-bold text-slate-900">
                      {Math.round((calculations.dailyCalorieTarget * 0.25) / 9)}g
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 transition text-sm hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-sm hover:bg-slate-100"
              >
                Skip / Cancel
              </button>
            ) : <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold flex items-center gap-2 hover:brightness-105 active:scale-95 transition-all text-sm shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="py-3 px-7 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold flex items-center gap-2 hover:brightness-105 active:scale-95 transition-all text-sm shadow-sm"
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
