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
  ftInToCm
} from '../../services/calculations';
import { StorageService } from '../../services/storage';
import { WeightGauge } from '../common/WeightGauge';

interface ProfileSettingsProps {
  profile: UserProfile;
  calculations: BodyCalculations;
  onUpdateProfile: (profile: UserProfile) => void;
  onOpenDisclaimer: () => void;
  onResetAllData?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profile,
  calculations,
  onUpdateProfile,
  onOpenDisclaimer,
  onResetAllData,
  isDark,
  onToggleTheme,
}) => {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(profile.unitSystem || 'metric');
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [currentWeightKg, setCurrentWeightKg] = useState(profile.currentWeightKg);
  const [targetWeightKg, setTargetWeightKg] = useState(profile.targetWeightKg);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [targetPaceKgPerWeek, setTargetPaceKgPerWeek] = useState(profile.targetPaceKgPerWeek);
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
    };

    onUpdateProfile(updated);
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
    a.download = `carbodate-backup-${new Date().toISOString().split('T')[0]}.json`;
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
      <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-200">
          Metabolic & Demographic Settings
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
            <input
              type="number"
              min={14}
              max={100}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Biological Sex</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Height ({unitSystem === 'metric' ? 'cm' : 'cm (equiv)'})
            </label>
            <input
              type="number"
              min={100}
              max={230}
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Weight ({unitSystem === 'metric' ? 'kg' : 'kg'})
            </label>
            <input
              type="number"
              step={0.1}
              min={35}
              max={250}
              value={currentWeightKg}
              onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Goals & Pace */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fitness Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as FitnessGoal)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="lose">Lose Fat (Calorie Deficit)</option>
              <option value="maintain">Maintain Body Weight</option>
              <option value="gain">Build Mass (Lean Surplus)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Weight (kg)</label>
            <input
              type="number"
              step={0.5}
              min={35}
              max={250}
              value={targetWeightKg}
              onChange={(e) => setTargetWeightKg(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pace ({targetPaceKgPerWeek} kg/week)
            </label>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.1}
              value={targetPaceKgPerWeek}
              onChange={(e) => setTargetPaceKgPerWeek(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer mt-2"
            />
          </div>
        </div>

        {/* Live Recomputed Blueprint preview */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">BMR</span>
            <span className="text-base font-bold text-slate-900">{previewCalc.bmr} kcal</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">TDEE</span>
            <span className="text-base font-bold text-slate-900">{previewCalc.tdee} kcal</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Daily Target</span>
            <span className="text-base font-extrabold text-emerald-600">{previewCalc.dailyCalorieTarget} kcal</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Safety Floor</span>
            <span className="text-base font-bold text-teal-700">{previewCalc.safetyFloor} kcal</span>
          </div>
        </div>

        {/* Optional Gemini API Key */}
        <div className="pt-2 border-t border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-600" />
            <span>Optional Custom Gemini Vision API Key</span>
          </label>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="AIzaSy... (leave blank to use built-in simulator)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition shadow-sm"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <span>Save Profile Settings</span>
          )}
        </button>
      </form>

      {/* Data Management */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight pb-2 border-b border-slate-200">
          Data Backup & Management
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportData}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Backup</span>
          </button>

          <label className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
            <Upload className="w-4 h-4 text-teal-600" />
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
              className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Reset All Data</span>
            </button>
          )}
        </div>

        {/* Disclaimer button */}
        <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-100">
          <span className="text-slate-500">Legal & Clinical Guidance</span>
          <button
            onClick={onOpenDisclaimer}
            className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Read Health Disclaimer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
