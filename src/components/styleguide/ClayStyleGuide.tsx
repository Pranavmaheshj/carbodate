import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Utensils,
  Compass,
  Dumbbell,
  Play,
  Heart,
  Sparkles,
  Trophy,
  Droplets,
  Star,
  Check,
  Search,
  Sliders,
  Palette,
  Moon,
  Sun
} from 'lucide-react';
import { CalorieRing } from '../common/CalorieRing';
import { WeightGauge } from '../common/WeightGauge';
import { BodyCalculations } from '../../types';

interface ClayStyleGuideProps {
  onBackToDashboard?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const ClayStyleGuide: React.FC<ClayStyleGuideProps> = ({
  onBackToDashboard,
  isDark,
  onToggleTheme,
}) => {
  const [sampleInput, setSampleInput] = useState('');
  const [selectedChip, setSelectedChip] = useState('Lime');
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  // Mock body calculations for Gauge preview
  const mockCalc: BodyCalculations = {
    bmr: 1680,
    tdee: 2350,
    bmi: 22.4,
    bmiCategory: 'Healthy',
    idealWeightRangeKg: { min: 61.5, max: 74.8 },
    weightDifferenceKg: 0,
    dailyCalorieTarget: 1850,
    dailyDeficitOrSurplus: -500,
    estimatedWeeks: 12,
    estimatedGoalDate: 'Jan 15, 2027',
    isSafetyWarning: false,
    safetyFloor: 1500,
  };

  const palette = [
    {
      name: 'Lime (Primary)',
      role: 'Start, Success, Progress',
      base: '#B8F25B',
      light: '#D2F88D',
      dark: '#85C722',
      badgeClass: 'clay-card-lime',
      btnClass: 'clay-btn-lime',
    },
    {
      name: 'Sky',
      role: 'Water, Cycling, Swimming',
      base: '#7CCBFF',
      light: '#B2E1FF',
      dark: '#40A2EB',
      badgeClass: 'clay-card-sky',
      btnClass: 'clay-btn-sky',
    },
    {
      name: 'Peach / Coral',
      role: 'Calories Burned, Alerts',
      base: '#FF9F8A',
      light: '#FFC2B5',
      dark: '#E76E55',
      badgeClass: 'clay-card-coral',
      btnClass: 'clay-btn-coral',
    },
    {
      name: 'Lilac',
      role: 'Gym, Resistance Workouts',
      base: '#B9A4FF',
      light: '#D7CBFF',
      dark: '#8B6DFF',
      badgeClass: 'clay-card-lilac',
      btnClass: 'clay-btn-lilac',
    },
    {
      name: 'Butter',
      role: 'PRs, Badges, Streaks',
      base: '#FFD76B',
      light: '#FFE79E',
      dark: '#E5B42C',
      badgeClass: 'clay-card-butter',
      btnClass: 'clay-btn-butter',
    },
  ];

  return (
    <div className="space-y-10 pb-28 md:pb-12 text-left relative z-10 max-w-5xl mx-auto">
      {/* Hero Intro Banner */}
      <div className="clay-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full clay-card-butter text-[#2B2D42] text-xs font-heading font-black shadow-sm">
              <Palette className="w-3.5 h-3.5" />
              <span>Claymorphism Design System</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-heading text-clay-text dark:text-white tracking-tight">
              Puffy, Squishy 3D Clay UI
            </h2>
            <p className="text-sm text-clay-text-sub dark:text-slate-300 max-w-xl leading-relaxed">
              Every element looks like soft inflated rubber or sculpted tactile clay: chunky, rounded,
              floating with 3D inset highlights and ambient pastel drop shadows. No sharp corners, no flat cards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="py-3 px-5 rounded-clay-btn clay-btn text-clay-text dark:text-white font-heading font-black text-sm active:scale-95 transition-transform flex items-center gap-2"
                title="Toggle Theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-clay-butter stroke-[2.5]" />
                ) : (
                  <Moon className="w-4 h-4 text-clay-lilac stroke-[2.5]" />
                )}
                <span>{isDark ? 'Light Clay' : 'Dark Clay'}</span>
              </button>
            )}

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="py-3 px-6 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black text-sm active:scale-95 transition-transform shadow-md"
              >
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. PALETTE TOKENS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full clay-pebble text-clay-lime-dark">
            <Sparkles className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl font-black font-heading text-clay-text dark:text-white tracking-tight">
              Clay Palette Tokens
            </h3>
            <span className="text-xs text-clay-text-sub dark:text-slate-400 font-semibold">
              Base tone + lighter specular highlight + darker bottom shadow
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {palette.map((p) => (
            <div key={p.name} className={`${p.badgeClass} p-5 flex flex-col justify-between h-44 shadow-clay-card`}>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#2B2D42]/80 font-heading block">
                  {p.role}
                </span>
                <h4 className="text-lg font-black font-heading text-[#2B2D42] mt-0.5">
                  {p.name.split(' ')[0]}
                </h4>
              </div>

              <div className="bg-white/70 dark:bg-black/30 p-2.5 rounded-2xl space-y-1 text-[11px] font-mono font-bold text-[#2B2D42]">
                <div className="flex justify-between">
                  <span className="text-[#2B2D42]/70">Base:</span>
                  <span>{p.base}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B2D42]/70">Light:</span>
                  <span>{p.light}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B2D42]/70">Dark:</span>
                  <span>{p.dark}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. CLAY BUTTONS & INTERACTION STATES */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full clay-pebble text-clay-coral-dark">
            <Play className="w-4 h-4 stroke-[2.2] fill-current" />
          </div>
          <div>
            <h3 className="text-xl font-black font-heading text-clay-text dark:text-white tracking-tight">
              Buttons & Press States (Squash Spring)
            </h3>
            <span className="text-xs text-clay-text-sub dark:text-slate-400 font-semibold">
              3D tactile buttons with springy squash effect when pressed
            </span>
          </div>
        </div>

        <div className="clay-card p-6 space-y-6">
          {/* Colored clay buttons row */}
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-clay-text-sub dark:text-slate-400 font-heading block mb-3">
              Colored Clay Buttons (Hover & Click to Squash)
            </span>
            <div className="flex flex-wrap gap-3">
              <button className="py-3 px-6 clay-btn-lime flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                <span>Primary Lime</span>
              </button>

              <button className="py-3 px-6 clay-btn-sky flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                <span>Sky Button</span>
              </button>

              <button className="py-3 px-6 clay-btn-coral flex items-center gap-2">
                <Flame className="w-4 h-4" />
                <span>Coral Button</span>
              </button>

              <button className="py-3 px-6 clay-btn-lilac flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                <span>Lilac Button</span>
              </button>

              <button className="py-3 px-6 clay-btn-butter flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>Butter Button</span>
              </button>

              <button className="py-3 px-6 clay-btn flex items-center gap-2">
                <span>Raised White Clay</span>
              </button>

              <button className="py-3 px-6 clay-btn clay-pressed flex items-center gap-2">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Pressed Inset State</span>
              </button>
            </div>
          </div>

          {/* Pebble circular icon buttons */}
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-clay-text-sub dark:text-slate-400 font-heading block mb-3">
              Clay Pebble Circles (Lucide 2px stroke inside raised/pressed spheres)
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-12 h-12 clay-pebble text-clay-coral-dark" title="Pebble">
                <Flame className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="w-12 h-12 clay-pebble text-clay-sky-dark" title="Pebble">
                <Droplets className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="w-12 h-12 clay-pebble text-clay-lilac-dark" title="Pebble">
                <Dumbbell className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="w-12 h-12 clay-pebble text-clay-butter-dark" title="Pebble">
                <Star className="w-5 h-5 stroke-[2.2] fill-current" />
              </div>
              <div className="w-12 h-12 clay-pebble text-clay-lime-dark" title="Pebble">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>

              {/* Tinted pebbles */}
              <div className="w-12 h-12 rounded-full clay-card-lime flex items-center justify-center text-clay-text font-black text-sm">
                42
              </div>
              <div className="w-12 h-12 rounded-full clay-card-sky flex items-center justify-center text-clay-text font-black text-sm">
                10k
              </div>
              <div className="w-12 h-12 rounded-full clay-card-lilac flex items-center justify-center text-clay-text font-black text-sm">
                PR
              </div>
            </div>
          </div>

          {/* Chips & Filter Pills */}
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-clay-text-sub dark:text-slate-400 font-heading block mb-3">
              Clay Chips & Tags
            </span>
            <div className="flex flex-wrap gap-2.5">
              {['Lime', 'Sky', 'Coral', 'Lilac', 'Butter', 'Neutral'].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedChip(c)}
                  className={`clay-chip ${selectedChip === c ? 'active' : ''}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{c} Filter</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. CLAY INPUTS & SUNKEN TRACKS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full clay-pebble text-clay-sky-dark">
            <Sliders className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl font-black font-heading text-clay-text dark:text-white tracking-tight">
              Inputs & Sunken Grooves
            </h3>
            <span className="text-xs text-clay-text-sub dark:text-slate-400 font-semibold">
              Deep inner shadows that look pressed into the surface
            </span>
          </div>
        </div>

        <div className="clay-card p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading font-extrabold text-clay-text dark:text-white mb-2">
                Sunken Clay Text Input
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-clay-text-sub absolute left-4 top-3.5 stroke-[2.2]" />
                <input
                  type="text"
                  value={sampleInput}
                  onChange={(e) => setSampleInput(e.target.value)}
                  placeholder="Type to test lime focus ring glow..."
                  className="w-full clay-input py-3 pl-11 pr-4 text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-heading font-extrabold text-clay-text dark:text-white mb-2">
                Sunken Segmented Pill Control
              </label>
              <div className="clay-sunken p-1.5 flex items-center justify-between gap-1">
                {['Daily', 'Weekly', 'Monthly'].map((period, i) => (
                  <button
                    key={period}
                    className={`flex-1 py-2 text-xs font-heading font-black rounded-full transition-all ${
                      i === 1
                        ? 'clay-btn-lime shadow-sm text-clay-text'
                        : 'text-clay-text-sub dark:text-slate-400 hover:text-clay-text'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DONUT RING & WEIGHT GAUGE PREVIEW */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full clay-pebble text-clay-lime-dark">
            <Flame className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl font-black font-heading text-clay-text dark:text-white tracking-tight">
              Interactive Component Previews
            </h3>
            <span className="text-xs text-clay-text-sub dark:text-slate-400 font-semibold">
              Thick 18px Clay Tube Donut & Sunken Marble Gauge
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calorie Donut Ring Preview Card */}
          <div className="clay-card p-6 flex flex-col items-center justify-between text-center">
            <div className="w-full text-left mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-clay-lime-dark dark:text-clay-lime font-heading block">
                Clay Donut Tube
              </span>
              <h4 className="text-xl font-black font-heading text-clay-text dark:text-white">
                3-Layer Concentric Rings
              </h4>
              <span className="text-xs text-clay-text-sub dark:text-slate-400">
                Outer (Lime) = Eaten, Middle (Coral) = Burned, Inner (Sky) = Budget
              </span>
            </div>

            <div className="py-4 w-full flex items-center justify-center">
              <CalorieRing
                targetCalories={2100}
                eatenCalories={1420}
                burnedCalories={480}
                size={250}
                strokeWidth={14}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 w-full pt-4 border-t border-slate-200/60 dark:border-slate-700/50 text-center">
              <div className="clay-card-flat p-2.5">
                <span className="text-[10px] font-heading font-black text-clay-text-sub block">Target</span>
                <span className="font-heading font-black text-sm text-clay-text dark:text-white">2,100</span>
              </div>
              <div className="clay-card-flat p-2.5">
                <span className="text-[10px] font-heading font-black text-clay-lime-dark block">Eaten</span>
                <span className="font-heading font-black text-sm text-clay-lime-dark">1,420</span>
              </div>
              <div className="clay-card-flat p-2.5">
                <span className="text-[10px] font-heading font-black text-clay-coral-dark block">Burned</span>
                <span className="font-heading font-black text-sm text-clay-coral-dark">480</span>
              </div>
            </div>
          </div>

          {/* Weight Gauge Preview */}
          <div className="space-y-4">
            <WeightGauge
              currentWeightKg={68.5}
              heightCm={175}
              calculations={mockCalc}
              unitSystem="metric"
            />

            {/* Overhanging Start FAB mini preview */}
            <div className="clay-card p-6">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-clay-text-sub dark:text-slate-400 font-heading block mb-2">
                Floating Bottom Nav Pill & 64px Lime FAB Preview
              </span>
              <div className="clay-card rounded-full px-4 py-2.5 h-[72px] flex items-center justify-around relative max-w-sm mx-auto shadow-clay-card mt-6">
                <div className="w-10 h-10 rounded-full clay-pressed bg-clay-lime/30 text-clay-text flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="relative -top-5 flex flex-col items-center">
                  <button className="w-16 h-16 rounded-full clay-btn-lime flex items-center justify-center text-clay-text shadow-lg border-4 border-white dark:border-[#252840]">
                    <Play className="w-7 h-7 fill-current translate-x-0.5" />
                  </button>
                  <span className="text-[10px] font-heading font-black text-clay-text dark:text-white mt-0.5">Start</span>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-clay-text-sub">
                  <Dumbbell className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
