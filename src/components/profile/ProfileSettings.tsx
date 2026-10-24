import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Scale,
  ShieldAlert,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Key,
  Check,
  Flame,
  Calendar,
  AlertTriangle,
  Info,
  Sun,
  Moon,
  Palette,
  Minus,
  Plus,
  Mail,
  ChevronRight,
  Cloud,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import {
  UserProfile,
  Gender,
  ActivityLevel,
  FitnessGoal,
  UnitSystem,
  BodyCalculations
} from '../../types';
import {
  computeProfileCalculations,
  kgToLb,
  lbToKg,
  cmToFtIn,
  ftInToCm,
  formatLocalDate
} from '../../services/calculations';
import { StorageService } from '../../services/storage';
import { CloudSync } from '../../services/cloudSync';
import { WeightGauge } from '../common/WeightGauge';

interface ProfileSettingsProps {
  profile: UserProfile;
  calculations: BodyCalculations;
  onUpdateProfile: (profile: UserProfile) => void;
  onOpenDisclaimer: () => void;
  onResetAllData?: () => void;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profile,
  calculations,
  onUpdateProfile,
  onOpenDisclaimer,
  onResetAllData,
  onOpenAuth,
  onSignOut,
  isDark,
  onToggleTheme,
}) => {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(profile.unitSystem || 'metric');
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [age, setAge] = useState(profile.age);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [heightCm, setHeightCm] = useState(profile.heightCm);

  // Imperial height helper states
  const initialFtIn = cmToFtIn(profile.heightCm);
  const [heightFeet, setHeightFeet] = useState(initialFtIn.feet);
  const [heightInches, setHeightInches] = useState(initialFtIn.inches);

  const [currentWeightKg, setCurrentWeightKg] = useState(profile.currentWeightKg);
  const [weightLbs, setWeightLbs] = useState(Math.round(kgToLb(profile.currentWeightKg)));

  const [targetWeightKg, setTargetWeightKg] = useState(profile.targetWeightKg);
  const [targetWeightLbs, setTargetWeightLbs] = useState(Math.round(kgToLb(profile.targetWeightKg)));

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [targetPaceKgPerWeek, setTargetPaceKgPerWeek] = useState(profile.targetPaceKgPerWeek);
  const [restDays, setRestDays] = useState<number[]>(() => {
    if (Array.isArray(profile.restDays)) return profile.restDays;
    return [0]; // default Sunday
  });
  const [geminiApiKey, setGeminiApiKey] = useState(
    localStorage.getItem('carbodate_gemini_api_key') || ''
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dynamic preview calculations
  const previewCalc = computeProfileCalculations({
    age,
    gender,
    heightCm,
    currentWeightKg,
    targetWeightKg,
    activityLevel,
    goal,
    targetPaceKgPerWeek,
  });

  const handleUnitToggle = (newUnit: UnitSystem) => {
    setUnitSystem(newUnit);
    if (newUnit === 'imperial') {
      const fi = cmToFtIn(heightCm);
      setHeightFeet(fi.feet);
      setHeightInches(fi.inches);
      setWeightLbs(Math.round(kgToLb(currentWeightKg)));
      setTargetWeightLbs(Math.round(kgToLb(targetWeightKg)));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name,
      email,
      age,
      gender,
      heightCm,
      currentWeightKg,
      targetWeightKg,
      activityLevel,
      goal,
      targetPaceKgPerWeek,
      unitSystem,
      restDays,
    };

    onUpdateProfile(updated);

    // If current weight changed, save today's weight record automatically
    if (currentWeightKg !== profile.currentWeightKg) {
      const today = formatLocalDate();
      StorageService.saveWeightRecord({
        id: `w_${Date.now()}`,
        userId: profile.id,
        date: today,
        weightKg: currentWeightKg,
        note: 'Daily weigh-in via Settings',
      });
    }

    // Sync workout plan rest days if plan exists
    const plan = StorageService.getWorkoutPlan();
    if (plan && plan.days) {
      const updatedPlanDays = plan.days.map((d) => ({
        ...d,
        isRestDay: restDays.includes(d.dayOfWeek),
        split: restDays.includes(d.dayOfWeek)
          ? d.split === 'Rest & Recovery' || d.split === 'Rest'
            ? d.split
            : 'Rest & Recovery'
          : d.split === 'Rest & Recovery' || d.split === 'Rest'
          ? 'Full Body Workout'
          : d.split,
      }));
      StorageService.saveWorkoutPlan({ ...plan, days: updatedPlanDays });
    }
    if (geminiApiKey) {
      localStorage.setItem('carbodate_gemini_api_key', geminiApiKey);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportData = () => {
    const json = StorageService.exportAllDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbodate-backup-${formatLocalDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const success = StorageService.importDataJson(reader.result as string);
        if (success) {
          alert('Carbodate data successfully imported!');
          window.location.reload();
        } else {
          alert('Invalid Carbodate backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 pb-28 md:pb-12 text-left max-w-3xl mx-auto">
      {/* Header Card */}
      <div className="clay-card rounded-clay-card p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full clay-card-lime flex items-center justify-center font-heading font-black text-2xl text-clay-text shadow-sm">
              {profile.name.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight">
                  {profile.name}
                </h3>
              </div>
              <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400">{profile.email}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Theme Toggle Pill */}
            {onToggleTheme && (
              <div className="clay-sunken p-1 rounded-full flex self-start sm:self-center">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`py-1.5 px-3 text-xs font-heading font-black rounded-full transition flex items-center gap-1.5 ${
                    !isDark
                      ? 'clay-btn-butter text-clay-text scale-105'
                      : 'text-clay-text/60 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`py-1.5 px-3 text-xs font-heading font-black rounded-full transition flex items-center gap-1.5 ${
                    isDark
                      ? 'clay-btn-lime text-clay-text scale-105'
                      : 'text-clay-text/60 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            )}

            {/* Unit Toggle Pill */}
            <div className="clay-sunken p-1 rounded-full flex self-start sm:self-center">
              <button
                type="button"
                onClick={() => handleUnitToggle('metric')}
                className={`py-1.5 px-3 text-xs font-heading font-black rounded-full transition ${
                  unitSystem === 'metric'
                    ? 'clay-btn-sky text-clay-text scale-105'
                    : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                }`}
              >
                Metric (kg/cm)
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('imperial')}
                className={`py-1.5 px-3 text-xs font-heading font-black rounded-full transition ${
                  unitSystem === 'imperial'
                    ? 'clay-btn-sky text-clay-text scale-105'
                    : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                }`}
              >
                Imperial (lb/ft)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Weight & BMI Analysis Gauge */}
      <WeightGauge
        currentWeightKg={currentWeightKg}
        heightCm={heightCm}
        calculations={previewCalc}
        unitSystem={unitSystem}
      />

      {/* Profile Form */}
      <form onSubmit={handleSave} className="clay-card rounded-clay-card p-6 sm:p-7 space-y-7">
        <h4 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
          Metabolic & Demographic Settings
        </h4>

        {/* Name and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 w-8 h-8 rounded-full clay-pebble flex items-center justify-center text-slate-500 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="clay-input w-full pl-13 pr-4 py-3.5 text-sm font-bold text-clay-text dark:text-white rounded-2xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 w-8 h-8 rounded-full clay-pebble flex items-center justify-center text-slate-500 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="clay-input w-full pl-13 pr-4 py-3.5 text-sm font-bold text-clay-text dark:text-white rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* Age & Biological Sex in Clay Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          {/* Age Stepper */}
          <div className="p-4 rounded-2xl clay-card-flat space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider">
                Age
              </label>
              <span className="text-xs font-bold text-slate-400">Years old</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAge(Math.max(14, age - 1))}
                className="w-11 h-11 rounded-2xl clay-btn flex items-center justify-center text-clay-text dark:text-slate-200 active:scale-95 transition"
                aria-label="Decrease age"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div className="clay-sunken flex-1 py-2 px-3 rounded-2xl text-center">
                <span className="text-3xl font-heading font-black text-clay-text dark:text-white font-mono">
                  {age}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAge(Math.min(100, age + 1))}
                className="w-11 h-11 rounded-2xl clay-btn flex items-center justify-center text-clay-text dark:text-slate-200 active:scale-95 transition"
                aria-label="Increase age"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
            {/* Quick jump chips */}
            <div className="flex justify-between gap-1.5 pt-1">
              {[18, 24, 30, 40, 50].map((quickAge) => (
                <button
                  key={quickAge}
                  type="button"
                  onClick={() => setAge(quickAge)}
                  className={`flex-1 py-1 text-xs rounded-xl font-mono font-bold transition active:scale-95 ${
                    age === quickAge
                      ? 'clay-btn-lime font-black'
                      : 'clay-btn text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {quickAge}
                </button>
              ))}
            </div>
          </div>

          {/* Biological Sex Clay Segments */}
          <div className="p-4 rounded-2xl clay-card-flat space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider">
                Biological Sex
              </label>
              <span className="text-xs font-bold text-slate-400">For BMR equation</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'male' as Gender, label: 'Male', icon: '♂' },
                { id: 'female' as Gender, label: 'Female', icon: '♀' },
                { id: 'other' as Gender, label: 'Other', icon: '⚥' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGender(item.id)}
                  className={`py-3 px-2 rounded-2xl text-center flex flex-col items-center justify-center transition active:scale-95 ${
                    gender === item.id
                      ? 'clay-btn-lime font-black'
                      : 'clay-btn text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span className="text-lg leading-none font-bold mb-1">{item.icon}</span>
                  <span className="text-xs font-heading font-black">{item.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 font-bold">
              Mifflin-St Jeor formula applies biological factors for basal metabolic burn.
            </p>
          </div>
        </div>

        {/* Height & Current Weight Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          {/* Height Picker */}
          <div className="p-4 rounded-2xl clay-card-flat space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider">
                Stature (Height)
              </label>
              <div className="clay-sunken px-3 py-1 rounded-xl text-clay-sky-dark dark:text-clay-sky font-black font-mono text-base">
                {unitSystem === 'metric'
                  ? `${heightCm} cm`
                  : `${heightFeet}′ ${heightInches}″ (${heightCm} cm)`}
              </div>
            </div>

            {unitSystem === 'metric' ? (
              <>
                <input
                  type="range"
                  min={120}
                  max={230}
                  step={1}
                  value={heightCm}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setHeightCm(val);
                    const fi = cmToFtIn(val);
                    setHeightFeet(fi.feet);
                    setHeightInches(fi.inches);
                  }}
                  className="clay-range my-2"
                />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const v = Math.max(120, heightCm - 5);
                        setHeightCm(v);
                      }}
                      className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                    >
                      -5cm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const v = Math.max(120, heightCm - 1);
                        setHeightCm(v);
                      }}
                      className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                    >
                      -1cm
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const v = Math.min(230, heightCm + 1);
                        setHeightCm(v);
                      }}
                      className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                    >
                      +1cm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const v = Math.min(230, heightCm + 5);
                        setHeightCm(v);
                      }}
                      className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                    >
                      +5cm
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between clay-sunken p-2.5 rounded-2xl">
                    <span className="text-xs font-bold text-slate-400 pl-1">Feet</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const newFt = Math.max(3, heightFeet - 1);
                          setHeightFeet(newFt);
                          setHeightCm(ftInToCm(newFt, heightInches));
                        }}
                        className="w-8 h-8 rounded-xl clay-btn flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 active:scale-90"
                      >
                        -
                      </button>
                      <span className="font-mono font-black text-lg w-7 text-center text-clay-text dark:text-white">
                        {heightFeet}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newFt = Math.min(7, heightFeet + 1);
                          setHeightFeet(newFt);
                          setHeightCm(ftInToCm(newFt, heightInches));
                        }}
                        className="w-8 h-8 rounded-xl clay-btn flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between clay-sunken p-2.5 rounded-2xl">
                    <span className="text-xs font-bold text-slate-400 pl-1">Inches</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const newIn = heightInches === 0 ? 11 : heightInches - 1;
                          setHeightInches(newIn);
                          setHeightCm(ftInToCm(heightFeet, newIn));
                        }}
                        className="w-8 h-8 rounded-xl clay-btn flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 active:scale-90"
                      >
                        -
                      </button>
                      <span className="font-mono font-black text-lg w-7 text-center text-clay-text dark:text-white">
                        {heightInches}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newIn = heightInches === 11 ? 0 : heightInches + 1;
                          setHeightInches(newIn);
                          setHeightCm(ftInToCm(heightFeet, newIn));
                        }}
                        className="w-8 h-8 rounded-xl clay-btn flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current Weight Picker */}
          <div className="p-4 rounded-2xl clay-card-flat space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider">
                Current Weight
              </label>
              <div className="clay-sunken px-3 py-1 rounded-xl text-clay-lime-dark dark:text-clay-lime font-black font-mono text-base">
                {unitSystem === 'metric'
                  ? `${currentWeightKg} kg`
                  : `${weightLbs} lbs`}
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
                    setWeightLbs(Math.round(kgToLb(val)));
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
                        setWeightLbs(Math.round(kgToLb(v)));
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
                        setWeightLbs(Math.round(kgToLb(v)));
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
                        setWeightLbs(Math.round(kgToLb(v)));
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
                        setWeightLbs(Math.round(kgToLb(v)));
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
        </div>

        {/* Fitness Goal & Target Weight */}
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-2">
              Fitness Goal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'lose' as FitnessGoal, label: 'Lose Fat', desc: 'Calorie Deficit' },
                { id: 'maintain' as FitnessGoal, label: 'Maintain', desc: 'Energy Balance' },
                { id: 'gain' as FitnessGoal, label: 'Build Mass', desc: 'Lean Surplus' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGoal(item.id)}
                  className={`p-3.5 rounded-2xl text-left transition flex items-center justify-between active:scale-95 ${
                    goal === item.id
                      ? 'clay-btn-lime font-black'
                      : 'clay-card-flat text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-heading font-black text-sm block">{item.label}</span>
                    <span className="text-[11px] font-bold opacity-80 block">{item.desc}</span>
                  </div>
                  {goal === item.id && (
                    <div className="w-6 h-6 rounded-full clay-pebble flex items-center justify-center text-slate-900">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Target Weight and Deficit Pace Controls */}
          {goal !== 'maintain' && (
            <div className="p-4 rounded-2xl clay-card-flat space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider">
                    Target Goal Weight
                  </label>
                  <span className="text-xs font-bold text-slate-400">
                    Fit range ({unitSystem === 'metric' ? `${previewCalc.idealWeightRangeKg.min} - ${previewCalc.idealWeightRangeKg.max} kg` : `${kgToLb(previewCalc.idealWeightRangeKg.min)} - ${kgToLb(previewCalc.idealWeightRangeKg.max)} lbs`})
                  </span>
                </div>
                <div className="clay-sunken px-3.5 py-1.5 rounded-2xl text-clay-lime-dark dark:text-clay-lime font-black font-mono text-base">
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
                      setTargetWeightLbs(Math.round(kgToLb(v)));
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
                          setTargetWeightLbs(Math.round(kgToLb(v)));
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
                          setTargetWeightLbs(Math.round(kgToLb(v)));
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
                          setTargetWeightLbs(Math.round(kgToLb(v)));
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
                          setTargetWeightLbs(Math.round(kgToLb(v)));
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

              {/* Deficit Pace Slider */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider">
                    Weekly Pace: <span className="text-clay-text dark:text-white font-mono">{targetPaceKgPerWeek} kg/wk</span>
                  </span>
                  <span className="text-xs text-clay-lime-dark dark:text-clay-lime font-mono font-black clay-sunken px-2.5 py-0.5 rounded-lg">
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
        </div>

        {/* Weekly Rest Days Configuration */}
        <div className="p-4 sm:p-5 rounded-2xl clay-card-flat space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[2.5]" />
                <label className="text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider block">
                  Weekly Scheduled Rest Days
                </label>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Choose which days you want as rest & recovery days
              </span>
            </div>
            <div className="clay-sunken px-3 py-1 rounded-xl text-purple-700 dark:text-purple-300 font-black text-xs font-heading self-start sm:self-auto">
              {restDays.length} {restDays.length === 1 ? 'Rest Day' : 'Rest Days'} / Week
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
            {[
              { dayNum: 1, name: 'Mon' },
              { dayNum: 2, name: 'Tue' },
              { dayNum: 3, name: 'Wed' },
              { dayNum: 4, name: 'Thu' },
              { dayNum: 5, name: 'Fri' },
              { dayNum: 6, name: 'Sat' },
              { dayNum: 0, name: 'Sun' },
            ].map((d) => {
              const isRest = restDays.includes(d.dayNum);
              return (
                <button
                  key={d.dayNum}
                  type="button"
                  onClick={() => {
                    const nextRest = isRest
                      ? restDays.filter((x) => x !== d.dayNum)
                      : [...restDays, d.dayNum];
                    setRestDays(nextRest);
                    const updated = { ...profile, restDays: nextRest };
                    StorageService.saveProfile(updated);
                    onUpdateProfile(updated);

                    const plan = StorageService.getWorkoutPlan();
                    if (plan) {
                      const updatedPlanDays = plan.days.map((pd) => ({
                        ...pd,
                        isRestDay: nextRest.includes(pd.dayOfWeek),
                        split: nextRest.includes(pd.dayOfWeek)
                          ? pd.split === 'Rest & Recovery' || pd.split === 'Rest'
                            ? pd.split
                            : 'Rest & Recovery'
                          : pd.split === 'Rest & Recovery' || pd.split === 'Rest'
                          ? 'Full Body Workout'
                          : pd.split,
                      }));
                      StorageService.saveWorkoutPlan({ ...plan, days: updatedPlanDays });
                    }
                  }}
                  className={`py-3 px-1 rounded-2xl text-center flex flex-col items-center justify-center transition active:scale-95 ${
                    isRest
                      ? 'clay-btn-lilac text-purple-950 dark:text-purple-100 font-black ring-2 ring-purple-400/50 shadow-xs'
                      : 'clay-pebble text-clay-text/70 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-heading font-black">{d.name}</span>
                  <span className="text-[9px] font-mono mt-0.5 font-bold opacity-80">
                    {isRest ? 'Rest' : 'Train'}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Tap any day to toggle between <strong className="text-purple-600 dark:text-purple-400">Rest Day</strong> and <strong className="text-lime-600 dark:text-lime-400">Training Day</strong>. Your daily routine, dashboard, and week pacing will adapt automatically.
          </p>
        </div>

        {/* Live Recomputed Blueprint preview in Sunken Groove */}
        <div className="p-4 rounded-2xl clay-sunken grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="text-[10px] uppercase font-heading font-black text-clay-text/60 dark:text-slate-400 block">BMR</span>
            <span className="text-base font-heading font-black text-clay-text dark:text-white font-mono">{previewCalc.bmr} kcal</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-heading font-black text-clay-text/60 dark:text-slate-400 block">TDEE</span>
            <span className="text-base font-heading font-black text-clay-text dark:text-white font-mono">{previewCalc.tdee} kcal</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-heading font-black text-clay-lime-dark dark:text-clay-lime block">Daily Target</span>
            <span className="text-base font-heading font-black text-clay-lime-dark dark:text-clay-lime font-mono">{previewCalc.dailyCalorieTarget} kcal</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-heading font-black text-clay-sky-dark dark:text-clay-sky block">Safety Floor</span>
            <span className="text-base font-heading font-black text-clay-sky-dark dark:text-clay-sky font-mono">{previewCalc.safetyFloor} kcal</span>
          </div>
        </div>

        {/* Optional Gemini API Key */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
          <label className="block text-xs font-heading font-bold text-clay-text dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-clay-lime-dark" />
            <span>Optional Custom Gemini Vision API Key</span>
          </label>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="AIzaSy... (leave blank to use built-in simulator)"
            className="clay-input w-full px-4 py-3 text-xs text-clay-text dark:text-white placeholder:text-clay-text/40 font-mono rounded-2xl"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black flex items-center justify-center gap-2 active:scale-95 transition text-sm shadow-md"
        >
          {saveSuccess ? (
            <>
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <span>Save Profile Settings</span>
          )}
        </button>
      </form>

      {/* Account & Supabase Cloud Storage */}
      <div className="clay-card rounded-clay-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
          <div>
            <h4 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight flex items-center gap-2">
              <Cloud className="w-6 h-6 text-clay-sky-dark dark:text-clay-sky" />
              <span>Account & Cloud Storage</span>
            </h4>
            <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400">
              Personalized data persistence powered by Supabase
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
              Supabase Connected
            </span>
          </div>
        </div>

        {/* Account Details Tile */}
        <div className="p-4 rounded-2xl clay-sunken flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl clay-card-lime flex items-center justify-center text-clay-text font-heading font-black text-lg">
              {profile.name.charAt(0) || 'U'}
            </div>
            <div>
              <span className="font-heading font-black text-sm text-clay-text dark:text-white block">
                {profile.name}
              </span>
              <span className="text-xs font-mono text-clay-text/60 dark:text-slate-400 block">
                {profile.email}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSyncing}
              onClick={async () => {
                setIsSyncing(true);
                const ok = await CloudSync.pushToCloud(StorageService.getFullPayload());
                setIsSyncing(false);
                if (ok) {
                  setSyncSuccess(true);
                  setTimeout(() => setSyncSuccess(false), 2500);
                }
              }}
              className="py-2 px-3.5 rounded-xl clay-btn text-clay-text dark:text-slate-200 font-heading font-bold text-xs flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncSuccess ? 'Synced!' : isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>

            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="py-2 px-3.5 rounded-xl clay-btn-sky text-clay-text font-heading font-bold text-xs flex items-center gap-1.5 active:scale-95"
              >
                <span>Switch / Login</span>
              </button>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to sign out from this account?')) {
                    onSignOut();
                  }
                }}
                className="py-2 px-3 rounded-xl clay-btn text-rose-500 font-heading font-bold text-xs flex items-center gap-1 active:scale-95"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] font-bold text-clay-text/60 dark:text-slate-400">
          Your profile, calorie target, logged meals, gym workouts, body weights, and activity routes are permanently saved to your account.
        </p>
      </div>

      {/* Data Management */}
      <div className="clay-card rounded-clay-card p-6 sm:p-7 space-y-5">
        <h4 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
          Data Backup & Management
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportData}
            className="p-3.5 rounded-clay-btn clay-btn text-clay-text dark:text-white font-heading font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Download className="w-4 h-4 text-clay-lime-dark" />
            <span>Export Backup</span>
          </button>

          <label className="p-3.5 rounded-clay-btn clay-btn text-clay-text dark:text-white font-heading font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer">
            <Upload className="w-4 h-4 text-clay-sky-dark" />
            <span>Import Backup</span>
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>

          {onResetAllData && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all data and reset the app?')) {
                  onResetAllData();
                }
              }}
              className="p-3.5 rounded-clay-btn clay-btn text-rose-500 font-heading font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Data</span>
            </button>
          )}
        </div>

        {/* Disclaimer button */}
        <div className="pt-3 flex justify-between items-center text-xs border-t border-slate-200/60 dark:border-slate-700/60">
          <span className="text-clay-text/60 dark:text-slate-400 font-sans">Legal & Clinical Guidance</span>
          <button
            onClick={onOpenDisclaimer}
            className="text-clay-lime-dark dark:text-clay-lime font-heading font-black flex items-center gap-1.5 hover:underline"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Read Health Disclaimer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
