import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Flame,
  Utensils,
  Compass,
  Dumbbell,
  Cloud,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Play,
  Layers,
  Award,
  Zap,
  Coffee,
  Droplets,
  MapPin,
  Activity,
  Check,
  ShieldCheck,
  Sun,
  Moon,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Target
} from 'lucide-react';
import { NavTab } from '../layout/BottomNav';

interface AppTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

interface TourStep {
  title: string;
  badge: string;
  desc: string;
  highlight: string;
  icon: React.ElementType;
  accentBg: string;
  accentText: string;
  relatedTab?: NavTab;
  features: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Carbodate',
    badge: 'Your Clay Fitness Hub',
    desc: 'Carbodate is your all-in-one companion for deficit pacing, live cardio tracking, gym workouts, and smart nutrition.',
    highlight: 'Built with organic clay aesthetics, instant offline storage, and seamless cloud sync.',
    icon: Sparkles,
    accentBg: 'clay-card-lime',
    accentText: 'text-clay-text',
    features: [
      'Accurate personalized BMR, TDEE, and daily deficit targets',
      'Real-time OpenStreetMap live GPS route tracker',
      'Live steps, speed, and elevation gain calorie calculation',
      'Instant food & drink nutrition calculation for any meal',
    ],
  },
  {
    title: 'Today Overview & Calorie Ring',
    badge: 'Step 1 of 5',
    desc: 'Your dashboard keeps you in control of your daily calorie budget at a glance.',
    highlight: 'The live Calorie Ring balances what you eat against what you burn in real-time.',
    icon: Flame,
    accentBg: 'clay-card-coral',
    accentText: 'text-white',
    relatedTab: 'dashboard',
    features: [
      'Visual progress ring: Target, Eaten, and Burned calories',
      'Target pace indicator: shows if you are safely in deficit or surplus',
      '1-tap water hydration tracker with daily goal milestones',
      '7-day puffy activity bars visualizing your weekly consistency',
    ],
  },
  {
    title: 'Nutrition, Meals & Drinks Diary',
    badge: 'Step 2 of 5',
    desc: 'Log food, snacks, coffee, tea, and drinks effortlessly by typing or scanning with AI.',
    highlight: 'Type any food or drink to auto-calculate calories, protein, carbs, fiber, and fat!',
    icon: Utensils,
    accentBg: 'clay-card-butter',
    accentText: 'text-slate-900',
    relatedTab: 'food',
    features: [
      'Auto-Nutrition Calculator: type "coffee", "oats", "chai", or "banana" to auto-fill nutrition',
      'Fully editable macros: customize protein, carbs, fiber, and calories anytime',
      'Organized meal sections: Breakfast, Lunch, Dinner, and Snacks & Drinks',
      'AI Vision scanner: take a photo of your meal for instant automated portion breakdowns',
    ],
  },
  {
    title: 'Outdoor GPS & Indoor Activity',
    badge: 'Step 3 of 5',
    desc: 'Strava-style tracking with live map routes, auto-pause/resume, elevation, and steps.',
    highlight: 'Choose your activity first, review meters, and track with precision on free OpenStreetMap.',
    icon: Compass,
    accentBg: 'clay-card-sky',
    accentText: 'text-slate-900',
    relatedTab: 'activity',
    features: [
      'Pre-start activity picker: Running, Jogging, Walking, and Cycling',
      'Fast Auto-Pause & Auto-Resume: stops when you pause and resumes immediately when you walk',
      'Fake-step reduction via GPS displacement cross-validation',
      'Lap tracker (+LAP button) to record splits with pace and elevation gain',
    ],
  },
  {
    title: 'Gym Logger & Workout Plans',
    badge: 'Step 4 of 5',
    desc: 'Structure your strength training with customizable splits and interactive loggers.',
    highlight: 'Track sets, weights, reps, PR personal records, and total volume lifted.',
    icon: Dumbbell,
    accentBg: 'clay-card-lilac',
    accentText: 'text-slate-900',
    relatedTab: 'gym',
    features: [
      'Push / Pull / Legs and custom workout day splits',
      'Interactive set logger with check-off marks and rest timers',
      'PR badges: automatically rewards you when you lift heavier',
      'Volume analytics to monitor progressive overload over time',
    ],
  },
  {
    title: 'Cloud Sync & Data Security',
    badge: 'Step 5 of 5',
    desc: 'Your data is saved locally on your device and can sync securely to the cloud.',
    highlight: 'Sign in with Google or Email via Supabase to keep all your history safe across devices.',
    icon: Cloud,
    accentBg: 'clay-card-lime',
    accentText: 'text-clay-text',
    relatedTab: 'profile',
    features: [
      'Automatic offline-first storage: works anytime, even without internet',
      '1-click Google Sign-In or Magic Link via Supabase Cloud Sync',
      'Dark Clay & Light Clay theme toggle for day/night comfort',
      'Full data privacy: backup or export your diary anytime as JSON',
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* ANIMATED PREVIEW COMPONENTS FOR EACH STEP                                  */
/* -------------------------------------------------------------------------- */

const Step0WelcomePreview: React.FC = () => {
  return (
    <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-lime-100/80 via-emerald-50/50 to-lime-200/60 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-lime-950/40 p-4 flex items-center justify-center overflow-hidden clay-sunken border border-lime-300/40 dark:border-lime-500/20">
      {/* Background glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-36 h-36 rounded-full bg-lime-400/30 blur-2xl -top-6 -left-6 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-36 h-36 rounded-full bg-sky-400/25 blur-2xl -bottom-6 -right-6 pointer-events-none"
      />

      {/* Center clay badge */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-300 to-lime-500 shadow-xl flex items-center justify-center text-slate-950 relative"
        >
          <Sparkles className="w-8 h-8 stroke-[2.4]" />
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl border-2 border-lime-300"
          />
        </motion.div>
        <div className="mt-2 text-center">
          <div className="text-sm font-black font-heading text-slate-900 dark:text-white">Carbodate</div>
          <div className="text-[10px] font-bold text-lime-700 dark:text-lime-400 uppercase tracking-wider">Deficit & Motion Engine</div>
        </div>
      </motion.div>

      {/* Orbiting Feature Pills */}
      <motion.div
        animate={{ y: [-4, 4, -4], x: [-2, 2, -2] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-2.5 left-3 z-10 px-2.5 py-1 rounded-xl clay-card text-[10px] font-heading font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-sm border border-white/60 dark:border-slate-700"
      >
        <Flame className="w-3.5 h-3.5 text-rose-500" />
        <span>-500 Deficit</span>
      </motion.div>

      <motion.div
        animate={{ y: [4, -4, 4], x: [2, -2, 2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute bottom-3 left-4 z-10 px-2.5 py-1 rounded-xl clay-card text-[10px] font-heading font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-sm border border-white/60 dark:border-slate-700"
      >
        <MapPin className="w-3.5 h-3.5 text-sky-500" />
        <span>Live GPS</span>
      </motion.div>

      <motion.div
        animate={{ y: [-3, 3, -3], x: [2, -2, 2] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-xl clay-card text-[10px] font-heading font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-sm border border-white/60 dark:border-slate-700"
      >
        <Utensils className="w-3.5 h-3.5 text-amber-500" />
        <span>Auto-Macros</span>
      </motion.div>

      <motion.div
        animate={{ y: [3, -3, 3], x: [-2, 2, -2] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-xl clay-card text-[10px] font-heading font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-sm border border-white/60 dark:border-slate-700"
      >
        <Dumbbell className="w-3.5 h-3.5 text-purple-500" />
        <span>PR Tracker</span>
      </motion.div>
    </div>
  );
};

const Step1CalorieRingPreview: React.FC = () => {
  return (
    <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-rose-50/70 via-orange-50/50 to-amber-100/60 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-rose-950/40 p-3 sm:p-4 flex items-center justify-between overflow-hidden clay-sunken border border-rose-200/50 dark:border-rose-500/20">
      {/* Mini Animated Calorie Ring */}
      <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200 dark:text-slate-700/60"
          />
          {/* Animated active stroke */}
          <motion.circle
            cx="50"
            cy="50"
            r="38"
            stroke="url(#ringGradient)"
            strokeWidth="8"
            strokeDasharray={238.76}
            strokeDashoffset={238.76}
            strokeLinecap="round"
            fill="transparent"
            initial={{ strokeDashoffset: 238.76 }}
            animate={{ strokeDashoffset: [238.76, 75, 75] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#a3e635" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Ring Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Flame className="w-5 h-5 text-rose-500 fill-rose-500" />
          </motion.div>
          <span className="text-xs font-black font-heading text-slate-900 dark:text-white mt-0.5">
            1,480
          </span>
          <span className="text-[8px] font-bold text-slate-500 uppercase">kcal left</span>
        </div>
      </div>

      {/* Right side live metrics breakdown */}
      <div className="flex-1 pl-3 sm:pl-4 space-y-1.5 z-10">
        <motion.div
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-1.5 px-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-xs flex items-center justify-between border border-slate-200/50 dark:border-slate-700"
        >
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">🍽️ Eaten</span>
          <span className="text-xs font-black text-rose-600 dark:text-rose-400">1,520 kcal</span>
        </motion.div>

        <motion.div
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-1.5 px-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-xs flex items-center justify-between border border-slate-200/50 dark:border-slate-700"
        >
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">⚡ Burned</span>
          <span className="text-xs font-black text-lime-600 dark:text-lime-400">540 kcal</span>
        </motion.div>

        {/* Hydration Pill */}
        <motion.div
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="p-1.5 px-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 shadow-xs flex items-center justify-between border border-sky-200 dark:border-sky-800"
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300">
            <Droplets className="w-3 h-3 text-sky-500 fill-sky-500" />
            <span>Water</span>
          </div>
          <span className="text-xs font-black text-sky-600 dark:text-sky-400">2,250 ml</span>
        </motion.div>
      </div>
    </div>
  );
};

const Step2FoodNutritionPreview: React.FC = () => {
  return (
    <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-amber-50/80 via-yellow-50/50 to-orange-100/60 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-amber-950/40 p-3 sm:p-4 flex flex-col justify-between overflow-hidden clay-sunken border border-amber-200/60 dark:border-amber-500/20">
      {/* Simulated Typing Input */}
      <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700">
        <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <div className="flex-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center">
          <span>Coffee with Milk & 50g Oats</span>
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-1.5 h-3.5 bg-amber-500 ml-1 rounded-xs"
          />
        </div>
        <span className="text-[9px] font-black font-heading px-2 py-0.5 rounded-full bg-lime-400 text-slate-950 uppercase">
          Auto-Calc
        </span>
      </div>

      {/* Dynamic Animated Macro Bars */}
      <div className="space-y-1.5 pt-1">
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-0.5 text-slate-700 dark:text-slate-300">
            <span>Protein (18.5g)</span>
            <span className="text-sky-600 dark:text-sky-400 font-black">High</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: ['0%', '75%', '75%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="h-full bg-sky-500 rounded-full"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-bold mb-0.5 text-slate-700 dark:text-slate-300">
            <span>Carbs (42g)</span>
            <span className="text-amber-600 dark:text-amber-400 font-black">Clean</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: ['0%', '60%', '60%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.15 }}
              className="h-full bg-amber-500 rounded-full"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-bold mb-0.5 text-slate-700 dark:text-slate-300">
            <span>Fiber (6.2g)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">Optimal</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: ['0%', '50%', '50%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.3 }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] font-heading font-black text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50 pt-1">
        <span>⚡ 310 KCAL CALCULATED</span>
        <span className="text-lime-600 dark:text-lime-400">TAP ANY VALUE TO CUSTOMIZE</span>
      </div>
    </div>
  );
};

const Step3GpsActivityPreview: React.FC = () => {
  return (
    <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-sky-50/80 via-blue-50/50 to-indigo-100/60 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-sky-950/40 p-3 sm:p-4 flex flex-col justify-between overflow-hidden clay-sunken border border-sky-200/60 dark:border-sky-500/20">
      {/* Simulated GPS SVG Map Track */}
      <div className="relative w-full h-20 rounded-xl bg-slate-900/90 dark:bg-slate-950 p-2 overflow-hidden flex items-center justify-center">
        {/* Map grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415515_1px,transparent_1px),linear-gradient(to_bottom,#33415515_1px,transparent_1px)] bg-[size:12px_12px]" />

        <svg className="w-full h-full" viewBox="0 0 200 60">
          {/* Route path */}
          <path
            d="M 10 30 C 40 10, 70 50, 100 25 C 130 5, 160 45, 190 20"
            fill="transparent"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Animated runner dot */}
          <motion.circle
            r="4.5"
            fill="#a3e635"
            stroke="#020617"
            strokeWidth="2"
            animate={{
              cx: [10, 50, 100, 150, 190],
              cy: [30, 25, 25, 22, 20],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>

        {/* Live Status Pill */}
        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-full border border-sky-500/30">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-lime-400">AUTO-RESUME ACTIVE</span>
        </div>

        {/* Lap Pill */}
        <div className="absolute top-1.5 right-2 flex items-center gap-1 bg-lime-400/90 text-slate-950 px-2 py-0.5 rounded-full font-heading font-black text-[9px] shadow-xs">
          <span>+ LAP 1: 1.0 km</span>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
        <div className="p-1 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700">
          <div className="text-[8px] font-bold text-slate-500">DIST</div>
          <div className="text-xs font-black text-slate-900 dark:text-white">4.2 km</div>
        </div>
        <div className="p-1 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700">
          <div className="text-[8px] font-bold text-slate-500">PACE</div>
          <div className="text-xs font-black text-sky-600 dark:text-sky-400">5&apos;14&quot;</div>
        </div>
        <div className="p-1 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700">
          <div className="text-[8px] font-bold text-slate-500">STEPS</div>
          <div className="text-xs font-black text-lime-600 dark:text-lime-400">5,410</div>
        </div>
        <div className="p-1 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700">
          <div className="text-[8px] font-bold text-slate-500">ELEV</div>
          <div className="text-xs font-black text-amber-600 dark:text-amber-400">+112m</div>
        </div>
      </div>
    </div>
  );
};

const Step4GymWorkoutPreview: React.FC = () => {
  return (
    <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-purple-50/80 via-pink-50/50 to-indigo-100/60 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-purple-950/40 p-3 sm:p-4 flex flex-col justify-between overflow-hidden clay-sunken border border-purple-200/60 dark:border-purple-500/20">
      {/* Exercise Title & PR Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black font-heading text-slate-900 dark:text-white">Bench Press</div>
            <div className="text-[9px] font-bold text-slate-500">Chest & Triceps</div>
          </div>
        </div>

        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-heading font-black shadow-xs"
        >
          <Award className="w-3 h-3 text-slate-950" />
          <span>NEW PR! 85 KG</span>
        </motion.div>
      </div>

      {/* Interactive Set Checklist */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between p-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/50 dark:border-slate-700 text-xs">
          <span className="font-bold text-slate-600 dark:text-slate-300">Set 1: 70 kg × 10 reps</span>
          <span className="w-5 h-5 rounded-full bg-lime-400 text-slate-950 flex items-center justify-center font-black text-[10px]">✓</span>
        </div>

        <div className="flex items-center justify-between p-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/50 dark:border-slate-700 text-xs">
          <span className="font-bold text-slate-600 dark:text-slate-300">Set 2: 80 kg × 8 reps</span>
          <span className="w-5 h-5 rounded-full bg-lime-400 text-slate-950 flex items-center justify-center font-black text-[10px]">✓</span>
        </div>

        <motion.div
          animate={{ backgroundColor: ['rgba(255, 255, 255, 0.9)', 'rgba(234, 179, 8, 0.15)', 'rgba(255, 255, 255, 0.9)'] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center justify-between p-1.5 px-3 rounded-xl shadow-xs border border-amber-300 dark:border-amber-600 text-xs"
        >
          <span className="font-black text-amber-600 dark:text-amber-400">Set 3: 85 kg × 6 reps</span>
          <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px]">✓</span>
        </motion.div>
      </div>

      {/* Rest Timer Bar */}
      <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-purple-500" />
          <span>REST TIMER: 0:45</span>
        </span>
        <span className="text-purple-600 dark:text-purple-400 font-bold font-heading">VOLUME: 1,850 KG</span>
      </div>
    </div>
  );
};

const Step5CloudSyncPreview: React.FC = () => {
  return (
    <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-lime-50/80 via-emerald-50/50 to-teal-100/60 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-emerald-950/40 p-3 sm:p-4 flex flex-col justify-between overflow-hidden clay-sunken border border-lime-200/60 dark:border-lime-500/20">
      {/* Center Animated Cloud with Radio Waves */}
      <div className="relative flex items-center justify-center py-2">
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute w-24 h-24 rounded-full border-2 border-lime-400"
        />
        <motion.div
          animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          className="absolute w-24 h-24 rounded-full border border-teal-400"
        />

        <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 flex items-center justify-center shadow-lg">
          <Cloud className="w-6 h-6 stroke-[2.5]" />
        </div>
      </div>

      {/* Cloud Status Indicators */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div className="text-[10px] leading-tight">
            <div className="font-black text-slate-900 dark:text-white">Offline-First</div>
            <div className="text-slate-500">Instant local save</div>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-sky-500 flex-shrink-0 animate-spin" />
          <div className="text-[10px] leading-tight">
            <div className="font-black text-slate-900 dark:text-white">Cloud Synced</div>
            <div className="text-slate-500">Supabase secured</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 text-[10px] font-heading font-black text-slate-600 dark:text-slate-300 pt-0.5">
        <span className="flex items-center gap-1">
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light Clay</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dark Clay</span>
        </span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN APP TOUR MODAL COMPONENT                                              */
/* -------------------------------------------------------------------------- */

export const AppTourModal: React.FC<AppTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setDirection(1);
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setDirection(-1);
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('carbodate_tour_completed_v1', 'true');
    } catch {
      // storage unavailable
    }
    onClose();
  };

  const handleJumpToTab = (tab?: NavTab) => {
    if (tab && onNavigateTab) {
      onNavigateTab(tab);
      handleComplete();
    }
  };

  const IconComponent = currentStep.icon;

  // Slide variant animation for smooth horizontal translation
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 28 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 28 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg clay-card rounded-clay-card p-5 sm:p-7 shadow-2xl relative text-left my-auto"
        >
          {/* Close / Skip Button */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 clay-pebble w-9 h-9 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-90 z-20 cursor-pointer"
            aria-label="Skip tour"
            title="Skip tour"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Header Pill & Icon */}
          <div className="flex items-center gap-3.5 mb-4">
            <motion.div
              key={`icon-${currentStepIndex}`}
              initial={{ rotate: -15, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`w-12 h-12 rounded-2xl ${currentStep.accentBg} ${currentStep.accentText} flex items-center justify-center shadow-sm flex-shrink-0`}
            >
              <IconComponent className="w-6 h-6 stroke-[2.4]" />
            </motion.div>
            <div className="pr-8">
              <span className="text-[10px] font-heading font-black px-2.5 py-0.5 rounded-full clay-sunken uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {currentStep.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-heading text-clay-text dark:text-white tracking-tight mt-0.5">
                {currentStep.title}
              </h3>
            </div>
          </div>

          {/* Animated Interactive Preview Component */}
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={`preview-${currentStepIndex}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="mb-4"
            >
              {currentStepIndex === 0 && <Step0WelcomePreview />}
              {currentStepIndex === 1 && <Step1CalorieRingPreview />}
              {currentStepIndex === 2 && <Step2FoodNutritionPreview />}
              {currentStepIndex === 3 && <Step3GpsActivityPreview />}
              {currentStepIndex === 4 && <Step4GymWorkoutPreview />}
              {currentStepIndex === 5 && <Step5CloudSyncPreview />}
            </motion.div>
          </AnimatePresence>

          {/* Body Description & Highlight */}
          <div className="space-y-3 mb-5">
            <p className="text-xs sm:text-sm font-sans text-clay-text/80 dark:text-slate-300 leading-relaxed font-medium">
              {currentStep.desc}
            </p>

            <div className="p-3 rounded-2xl clay-sunken text-xs font-heading font-bold text-slate-800 dark:text-slate-200 leading-relaxed border-l-4 border-lime-400">
              {currentStep.highlight}
            </div>

            {/* Feature Bullet Points */}
            <div className="space-y-1.5 pt-0.5">
              {currentStep.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-clay-text/90 dark:text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-lime-400 text-slate-900 flex items-center justify-center font-black flex-shrink-0 mt-0.5 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Indicator Dots */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mb-4">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentStepIndex ? 1 : -1);
                    setCurrentStepIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-7 bg-slate-900 dark:bg-lime-400'
                      : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {currentStep.relatedTab && (
              <button
                type="button"
                onClick={() => handleJumpToTab(currentStep.relatedTab)}
                className="text-xs font-heading font-bold text-lime-600 dark:text-lime-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Jump to this view</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              className={`py-2.5 px-4 rounded-2xl clay-btn font-heading font-black text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                isFirst ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'text-clay-text dark:text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleComplete}
                className="py-2.5 px-3.5 rounded-2xl text-xs font-heading font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              >
                Skip
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-5 sm:px-6 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 font-heading font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
              >
                <span>{isLast ? 'Get Started' : 'Next Step'}</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
