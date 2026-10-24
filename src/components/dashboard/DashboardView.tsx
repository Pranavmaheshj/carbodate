import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Utensils,
  Compass,
  Dumbbell,
  Scale,
  Plus,
  Play,
  Camera,
  Droplets,
  ChevronRight,
  Sparkles,
  Trophy,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import {
  UserProfile,
  BodyCalculations,
  MealItem,
  ActivityRecord,
  GymWorkoutSession,
  WorkoutPlan,
  WorkoutPlanDay,
  WeightRecord,
} from '../../types';
import { CalorieRing } from '../common/CalorieRing';
import { TodayWorkoutWidget } from './TodayWorkoutWidget';
import { WeightLogModal } from './WeightLogModal';
import { RestDaysModal } from './RestDaysModal';
import { WeeklyDeficitWidget } from './WeeklyDeficitWidget';
import { StorageService } from '../../services/storage';
import { formatDuration, calculateWeeklyDeficitSummary, formatLocalDate } from '../../services/calculations';

interface DashboardViewProps {
  profile: UserProfile;
  calculations: BodyCalculations;
  meals: MealItem[];
  allMeals?: MealItem[];
  activities: ActivityRecord[];
  gymSessions: GymWorkoutSession[];
  workoutPlan: WorkoutPlan | null;
  weights: WeightRecord[];
  waterCurrentMl: number;
  onNavigateTab: (tab: any) => void;
  onStartScheduledWorkout: (day: WorkoutPlanDay) => void;
  onStartOutdoorRun: () => void;
  onOpenPhotoScan: () => void;
  onSaveWeight: (record: WeightRecord) => void;
  onAddWater: (amount: number) => void;
  onUpdateWorkoutPlan?: (plan: WorkoutPlan) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  calculations,
  meals,
  allMeals,
  activities,
  gymSessions,
  workoutPlan,
  weights,
  waterCurrentMl,
  onNavigateTab,
  onStartScheduledWorkout,
  onStartOutdoorRun,
  onOpenPhotoScan,
  onSaveWeight,
  onAddWater,
  onUpdateWorkoutPlan,
  onUpdateProfile,
}) => {
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isRestDaysModalOpen, setIsRestDaysModalOpen] = useState(false);

  // Compute today's totals
  const todayDateStr = formatLocalDate();
  const todayWeightRecord = weights.find((w) => w.date === todayDateStr);
  const prevWeightRecord = weights.filter((w) => w.date < todayDateStr).slice(-1)[0];
  const dailyWeightDelta =
    todayWeightRecord && prevWeightRecord
      ? Math.round((todayWeightRecord.weightKg - prevWeightRecord.weightKg) * 10) / 10
      : null;

  const handleToggleTodayRest = () => {
    const todayDayOfWeek = new Date().getDay();
    const currentRest = profile?.restDays || [0, 4];
    const isNowRest = !currentRest.includes(todayDayOfWeek);
    const newRest = isNowRest
      ? Array.from(new Set([...currentRest, todayDayOfWeek]))
      : currentRest.filter((x) => x !== todayDayOfWeek);

    if (onUpdateProfile && profile) {
      const updatedProfile = { ...profile, restDays: newRest };
      StorageService.saveProfile(updatedProfile);
      onUpdateProfile(updatedProfile);
    }

    if (workoutPlan && onUpdateWorkoutPlan) {
      const updatedDays = workoutPlan.days.map((d) =>
        d.dayOfWeek === todayDayOfWeek ? { ...d, isRestDay: isNowRest } : d
      );
      const updatedPlan = { ...workoutPlan, days: updatedDays };
      StorageService.saveWorkoutPlan(updatedPlan);
      onUpdateWorkoutPlan(updatedPlan);
    }
  };
  const todayMeals = meals.filter((m) => m.date === todayDateStr);
  const eatenCaloriesToday = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);

  const todayActivities = activities.filter((a) => a.startTime.startsWith(todayDateStr));
  const cardioCaloriesBurned = todayActivities.reduce((s, a) => s + (a.caloriesBurned || 0), 0);

  const todayGymSessions = gymSessions.filter((g) => g.startTime.startsWith(todayDateStr));
  const gymCaloriesBurned = todayGymSessions.reduce((s, g) => s + (g.caloriesBurned || 0), 0);

  const totalCaloriesBurnedToday = cardioCaloriesBurned + gymCaloriesBurned;

  // Deficit target & calculation
  const targetCals = calculations.dailyCalorieTarget;
  const netCalories = eatenCaloriesToday - totalCaloriesBurnedToday;
  const deficitToday = calculations.tdee - netCalories;

  // Weekly Deficit & Rollover Banking Summary
  const weeklySummary = useMemo(() => {
    return calculateWeeklyDeficitSummary(
      calculations,
      allMeals && allMeals.length > 0 ? allMeals : meals,
      activities,
      gymSessions,
      new Date(),
      profile?.createdAt,
      profile?.restDays
    );
  }, [calculations, allMeals, meals, activities, gymSessions, profile?.createdAt, profile?.restDays]);

  // Most recent weight
  const latestWeight =
    weights.length > 0
      ? weights[weights.length - 1].weightKg
      : profile.currentWeightKg;
  const targetWeight = profile.targetWeightKg;
  const kgLeft = Math.round(Math.abs(latestWeight - targetWeight) * 10) / 10;

  // Weekly Activity Puffy Bars Calculation (Past 7 days)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIndex = new Date().getDay();
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = formatLocalDate(d);
    const dayBurn =
      activities
        .filter((a) => a.startTime.startsWith(dateStr))
        .reduce((s, a) => s + (a.caloriesBurned || 0), 0) +
      gymSessions
        .filter((g) => g.startTime.startsWith(dateStr))
        .reduce((s, g) => s + (g.caloriesBurned || 0), 0);
    return {
      name: daysOfWeek[d.getDay()],
      dateStr,
      isToday: dateStr === todayDateStr,
      burn: dayBurn,
    };
  });
  const maxWeeklyBurn = Math.max(500, ...past7Days.map((d) => d.burn));

  // Compute streak (consecutive active days)
  const activeDates = new Set([
    ...activities.map((a) => a.startTime.split('T')[0]),
    ...gymSessions.map((g) => g.startTime.split('T')[0]),
    ...meals.map((m) => m.date),
  ]);
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const str = formatLocalDate(checkDate);
    if (activeDates.has(str)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  const displayStreak = Math.max(1, streak);

  return (
    <div className="space-y-7 pb-28 md:pb-12 text-left">
      {/* 1. GREETING & CONTEXT HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="clay-chip bg-clay-butter text-clay-text text-xs">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{profile.goal === 'lose' ? 'Deficit Target Active' : 'Fueling & Performance'}</span>
            </span>
            <span className="text-xs font-heading font-black text-clay-text/60 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-clay-text dark:text-white tracking-tight">
            Hello, {profile.name || 'Athlete'}! ✨
          </h1>
        </div>

        {/* Target goal countdown badge */}
        <div className="clay-card rounded-2xl px-4 py-2.5 flex items-center gap-3 self-start sm:self-auto">
          <div className="w-10 h-10 rounded-full clay-pebble bg-clay-lime text-clay-text flex items-center justify-center">
            <TrendingDown className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-heading font-black uppercase tracking-wider text-clay-text/60 dark:text-slate-400 block">
              Estimated Goal
            </span>
            <span className="text-sm font-heading font-black text-clay-text dark:text-white">
              {calculations.estimatedGoalDate}
            </span>
          </div>
        </div>
      </div>

      {/* 2. HERO TILE: Calorie Ring Bento Tile */}
      <div className="clay-card rounded-clay-card p-6 sm:p-8 relative overflow-hidden transition-transform">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Calorie Ring Donut */}
          <div className="flex-shrink-0">
            <CalorieRing
              targetCalories={targetCals}
              eatenCalories={eatenCaloriesToday}
              burnedCalories={totalCaloriesBurnedToday}
              size={240}
              strokeWidth={17}
            />
          </div>

          {/* Metrics & Deficit Info */}
          <div className="flex-1 w-full space-y-5 text-center lg:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clay-lime/30 border border-clay-lime/50 text-clay-text text-xs font-heading font-black mb-2">
                <Sparkles className="w-4 h-4 text-[#85C722]" />
                <span>
                  {calculations.dailyDeficitOrSurplus < 0
                    ? `${Math.abs(calculations.dailyDeficitOrSurplus)} kcal/day Planned Deficit`
                    : 'Maintenance Calorie Plan'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-clay-text dark:text-white tracking-tight">
                {profile.goal === 'lose' ? 'Calorie Deficit Progression' : 'Nutrition & Fueling'}
              </h2>
              <p className="text-xs sm:text-sm font-sans text-clay-text/70 dark:text-slate-300 mt-1 max-w-lg">
                Your body burns <strong className="font-heading font-black text-clay-text dark:text-white">{calculations.tdee} kcal</strong> baseline daily (TDEE). Keep your intake on target to reach {targetWeight} kg on schedule.
              </p>
            </div>

            {/* Clay Pebble Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Eaten */}
              <div className="clay-card-lime rounded-2xl p-3 sm:p-4 text-center">
                <div className="w-8 h-8 rounded-full clay-pebble bg-white/80 mx-auto mb-1 flex items-center justify-center text-clay-text">
                  <Utensils className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-clay-text/70 block">
                  Eaten
                </span>
                <span className="text-lg sm:text-xl font-heading font-black text-clay-text block font-mono">
                  {eatenCaloriesToday}
                </span>
                <span className="text-[10px] font-sans text-clay-text/60">kcal</span>
              </div>

              {/* Burned */}
              <div className="clay-card-coral rounded-2xl p-3 sm:p-4 text-center">
                <div className="w-8 h-8 rounded-full clay-pebble bg-white/80 mx-auto mb-1 flex items-center justify-center text-clay-text">
                  <Flame className="w-4 h-4 stroke-[2.2] fill-current" />
                </div>
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-clay-text/70 block">
                  Burned
                </span>
                <span className="text-lg sm:text-xl font-heading font-black text-clay-text block font-mono">
                  {totalCaloriesBurnedToday}
                </span>
                <span className="text-[10px] font-sans text-clay-text/60">kcal active</span>
              </div>

              {/* Net Deficit */}
              <div className="clay-card-sky rounded-2xl p-3 sm:p-4 text-center">
                <div className="w-8 h-8 rounded-full clay-pebble bg-white/80 mx-auto mb-1 flex items-center justify-center text-clay-text">
                  <Sparkles className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-clay-text/70 block">
                  Net Deficit
                </span>
                <span className="text-lg sm:text-xl font-heading font-black text-clay-text block font-mono">
                  {deficitToday > 0 ? `-${deficitToday}` : `+${Math.abs(deficitToday)}`}
                </span>
                <span className="text-[10px] font-sans text-clay-text/60">kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Clay Launchers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={onStartOutdoorRun}
            className="p-3 sm:p-3.5 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black text-xs flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Outdoor GPS</span>
          </button>

          <button
            onClick={onOpenPhotoScan}
            className="p-3 sm:p-3.5 rounded-clay-btn clay-btn-sky text-clay-text font-heading font-black text-xs flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>AI Food Scan</span>
          </button>

          <button
            onClick={() => onAddWater(250)}
            className="p-3 sm:p-3.5 rounded-clay-btn clay-btn-coral text-clay-text font-heading font-black text-xs flex items-center justify-center gap-2 transition active:scale-95"
            title="Log 250ml water for today"
          >
            <Droplets className="w-4 h-4 stroke-[2.5]" />
            <span>+250ml Water {waterCurrentMl > 0 ? `(${waterCurrentMl} ml)` : ''}</span>
          </button>

          <button
            onClick={() => setIsWeightModalOpen(true)}
            className={`p-3 sm:p-3.5 rounded-clay-btn font-heading font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 ${
              todayWeightRecord
                ? 'clay-btn-lime text-clay-text'
                : 'clay-btn-butter text-clay-text'
            }`}
          >
            <Scale className="w-4 h-4 stroke-[2.5]" />
            <span>{todayWeightRecord ? `${todayWeightRecord.weightKg} kg` : 'Weigh-In'}</span>
          </button>
        </div>
      </div>

      {/* 2.5 WEEKLY CALORIE DEFICIT & ROLLOVER ENGINE */}
      <WeeklyDeficitWidget
        weeklySummary={weeklySummary}
        onOpenRestDaysModal={() => setIsRestDaysModalOpen(true)}
      />

      {/* 3. TODAY'S SCHEDULED WORKOUT (Lilac Bento Tile) */}
      <TodayWorkoutWidget
        plan={workoutPlan}
        onStartWorkout={onStartScheduledWorkout}
        onToggleRestDay={handleToggleTodayRest}
        onNavigateToPlans={() => setIsRestDaysModalOpen(true)}
      />

      {/* 4. BENTO GRID: Weekly Puffy Activity Bars + Streak (Butter) + Weight Progression */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bento Tile 1: Weekly Puffy Activity Bars (2 cols on md) */}
        <div className="md:col-span-2 clay-card rounded-clay-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full clay-pebble bg-clay-lime text-clay-text flex items-center justify-center">
                <Compass className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-black text-clay-text dark:text-white">
                  Weekly Activity Rhythm
                </h3>
                <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400">
                  Daily active energy expenditure
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('activity')}
              className="text-xs font-heading font-black text-clay-text dark:text-white hover:opacity-80 flex items-center gap-1"
            >
              <span>View details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Puffy Rounded Bars */}
          <div className="flex items-end justify-between gap-2.5 pt-4 pb-2 px-1">
            {past7Days.map((d) => {
              const heightPct = Math.max(12, Math.round((d.burn / maxWeeklyBurn) * 100));
              return (
                <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 group">
                  {/* Puffy 3D Clay Bar in Sunken Slot */}
                  <div className="w-full h-32 clay-sunken rounded-full flex flex-col justify-end p-1 relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                      className={`w-full rounded-full transition-all ${
                        d.isToday ? 'clay-btn-lime' : d.burn > 0 ? 'clay-btn-sky' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                    {d.burn > 0 && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 clay-card px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-clay-text whitespace-nowrap z-20 pointer-events-none">
                        {d.burn} kcal
                      </span>
                    )}
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-[11px] font-heading font-black ${
                      d.isToday
                        ? 'text-clay-text dark:text-clay-lime underline underline-offset-4 decoration-2'
                        : 'text-clay-text/60 dark:text-slate-400'
                    }`}
                  >
                    {d.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bento Tile 2: Butter Streak Card */}
        <div className="clay-card-butter rounded-clay-card p-6 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-full clay-pebble bg-white/80 text-clay-text flex items-center justify-center mb-3">
              <Flame className="w-6 h-6 stroke-[2.2] fill-current text-amber-500" />
            </div>

            <span className="text-[11px] font-heading font-black uppercase tracking-wider text-clay-text/70 block">
              Daily Momentum
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-heading font-black text-clay-text font-mono">
                {displayStreak}
              </span>
              <span className="text-base font-heading font-black text-clay-text/80">
                {displayStreak === 1 ? 'Day Streak' : 'Days Streak'}
              </span>
            </div>
            <p className="text-xs font-sans text-clay-text/80 mt-2">
              Every logged workout and meal builds long-term consistency. Keep the fire burning!
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between">
            <span className="text-[10px] font-heading font-black text-clay-text/70 uppercase">
              Current Rank
            </span>
            <span className="clay-chip bg-white/80 text-clay-text text-xs">
              <Trophy className="w-3.5 h-3.5" />
              <span>Dedicated</span>
            </span>
          </div>
        </div>
      </div>

      {/* 5. WEIGHT PROGRESSION TILE */}
      <div className="clay-card rounded-clay-card p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full clay-pebble bg-clay-lime text-clay-text flex items-center justify-center">
              <Scale className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[11px] font-heading font-black uppercase tracking-wider text-clay-text/60 dark:text-slate-400 block">
                Target Weight Progression
              </span>
              <h4 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight">
                {latestWeight} kg{' '}
                <span className="text-sm font-heading font-black text-clay-text/60 dark:text-slate-400">
                  → Goal: {targetWeight} kg
                </span>
              </h4>
            </div>
          </div>

          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="py-2 px-4 rounded-clay-btn clay-btn text-xs font-heading font-black text-clay-text flex items-center gap-2 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Weight</span>
          </button>
        </div>

        {/* Daily Weigh-In Status Strip */}
        <div className="p-3.5 rounded-2xl clay-sunken flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                todayWeightRecord ? 'clay-btn-lime text-clay-text' : 'clay-pebble text-amber-500'
              }`}
            >
              <Scale className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-heading font-black text-clay-text dark:text-white">
                  {todayWeightRecord
                    ? `Today's Weight: ${todayWeightRecord.weightKg} kg`
                    : "Today's Weight: Not Logged Yet"}
                </span>
                {todayWeightRecord ? (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    ✓ Logged Today
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    Due Daily
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-sans block mt-0.5">
                {todayWeightRecord
                  ? dailyWeightDelta !== null
                    ? `${dailyWeightDelta > 0 ? `+${dailyWeightDelta}` : dailyWeightDelta} kg change vs previous weigh-in. Daily TDEE calibrated.`
                    : 'Daily baseline calibrated for today.'
                  : 'Weigh in daily to update your body calculations, TDEE, and weekly deficit.'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsWeightModalOpen(true)}
            className={`py-2 px-3.5 rounded-xl text-xs font-heading font-black transition active:scale-95 flex-shrink-0 ${
              todayWeightRecord
                ? 'clay-btn text-clay-text dark:text-slate-200'
                : 'clay-btn-lime text-clay-text shadow-sm'
            }`}
          >
            {todayWeightRecord ? 'Update Today' : 'Weigh In Today'}
          </button>
        </div>

        {/* Sunken Clay Progress Track with Puffy Lime Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-heading font-black text-clay-text/70 dark:text-slate-300">
            <span>{latestWeight} kg Current</span>
            <span className="text-[#85C722] font-black">{kgLeft} kg remaining</span>
            <span>{targetWeight} kg Target</span>
          </div>

          <div className="h-4 w-full clay-sunken rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.max(10, Math.min(100, (1 - kgLeft / (latestWeight || 1)) * 100))}%`,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="h-full rounded-full clay-btn-lime"
            />
          </div>
        </div>
      </div>

      {/* 6. RECENT ACTIVITY FEED (Clay Cards with Pebble Icons) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-heading font-black text-clay-text dark:text-white tracking-tight">
            Recent Activity Feed
          </h3>
          <button
            onClick={() => onNavigateTab('activity')}
            className="text-xs font-heading font-black text-clay-text dark:text-white hover:opacity-80 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="clay-card rounded-clay-card p-8 sm:p-10 text-center text-clay-text">
            <div className="w-16 h-16 rounded-full clay-pebble bg-clay-coral/30 text-clay-text mx-auto mb-3 flex items-center justify-center">
              <Compass className="w-8 h-8 stroke-[2]" />
            </div>
            <p className="text-base font-heading font-black text-clay-text dark:text-white">
              No activities logged yet
            </p>
            <p className="text-xs font-sans text-clay-text/70 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Tap "Outdoor GPS" or use the Start button to record your first workout session.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {activities.slice(0, 3).map((act) => (
              <div
                key={act.id}
                onClick={() => onNavigateTab('activity')}
                className="p-4 sm:p-5 rounded-clay-card clay-card flex items-center justify-between transition cursor-pointer hover:scale-[1.01] active:scale-95 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full clay-pebble bg-clay-sky text-clay-text flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Compass className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h5 className="font-heading font-black text-clay-text dark:text-white text-base">
                      {act.title}
                    </h5>
                    <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400">
                      {new Date(act.startTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      • {formatDuration(act.durationSeconds)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-heading font-black text-clay-text dark:text-white block font-mono">
                    {(act.distanceMeters / 1000).toFixed(2)} km
                  </span>
                  <span className="text-xs font-heading font-black text-clay-text/80 flex items-center justify-end gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current text-amber-500" /> {act.caloriesBurned} kcal
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weight Log Modal */}
      <WeightLogModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onSaveWeight={onSaveWeight}
        profile={profile}
      />

      {/* Rest Days Configuration Modal */}
      {onUpdateProfile && onUpdateWorkoutPlan && (
        <RestDaysModal
          isOpen={isRestDaysModalOpen}
          onClose={() => setIsRestDaysModalOpen(false)}
          profile={profile}
          workoutPlan={workoutPlan}
          onUpdateProfile={onUpdateProfile}
          onUpdateWorkoutPlan={onUpdateWorkoutPlan}
        />
      )}
    </div>
  );
};
