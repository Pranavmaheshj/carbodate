import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Info,
  Zap,
  Award,
} from 'lucide-react';
import { WeeklyDeficitSummary, DayDeficitRecord } from '../../types';

interface WeeklyDeficitWidgetProps {
  weeklySummary: WeeklyDeficitSummary;
  onSelectCatchupDay?: (dayName: string) => void;
  onApplyRolloverTarget?: (newTarget: number) => void;
}

export const WeeklyDeficitWidget: React.FC<WeeklyDeficitWidgetProps> = ({
  weeklySummary,
  onSelectCatchupDay,
  onApplyRolloverTarget,
}) => {
  const [selectedCatchupDay, setSelectedCatchupDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'balance' | 'calendar'>('balance');

  const {
    days,
    dailyDeficitTarget,
    weeklyDeficitTarget,
    totalDeficitAchievedSoFar,
    weeklyProgressPercent,
    remainingDeficitNeeded,
    remainingDaysCount,
    hasShortfall,
    shortfallCalories,
    bankedCalories,
    adjustedDailyCalorieTarget,
    standardDailyCalorieTarget,
    safetyFloorEnforced,
    recommendedCatchupAdvice,
  } = weeklySummary;

  // Single-day catchup day defaults to next upcoming day or Saturday
  const upcomingDays = days.filter((d) => d.isFuture);
  const activeCatchupDay =
    selectedCatchupDay ||
    upcomingDays.find((d) => d.dayName === 'Sat')?.dayName ||
    upcomingDays[0]?.dayName ||
    'Weekend';

  const handlePickCatchupDay = (dayName: string) => {
    setSelectedCatchupDay(dayName);
    if (onSelectCatchupDay) {
      onSelectCatchupDay(dayName);
    }
  };

  return (
    <div className="clay-card rounded-clay-card p-6 sm:p-7 relative overflow-hidden text-left space-y-6">
      {/* Header with Title & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clay-lime/30 border border-clay-lime/50 text-clay-text text-xs font-heading font-black mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-lime-400" />
            <span>Weekly Calorie Banking & Deficit Balance</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight">
            Weekly Deficit & Rollover Engine
          </h3>
          <p className="text-xs text-clay-text/70 dark:text-slate-400 mt-0.5">
            Missed your target on any day? Deficit shortfalls roll over so you can complete them on{' '}
            <strong className="text-clay-text dark:text-white font-black">any day of the week</strong>!
          </p>
        </div>

        {/* Status Pill Badge */}
        <div className="flex-shrink-0">
          {hasShortfall ? (
            <div className="clay-chip bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs px-3 py-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Rollover Active: -{shortfallCalories} kcal</span>
            </div>
          ) : (
            <div className="clay-chip bg-lime-500/15 border border-lime-500/30 text-lime-800 dark:text-lime-300 text-xs px-3 py-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-lime-400" />
              <span>Weekly Deficit On Track</span>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Progress Bar & Key Numbers */}
      <div className="p-4 sm:p-5 rounded-2xl clay-sunken space-y-3">
        <div className="flex items-center justify-between text-xs font-heading font-bold">
          <span className="text-clay-text/80 dark:text-slate-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-clay-coral-dark dark:text-clay-coral fill-current" />
            <span>Weekly Cumulative Net Deficit:</span>
          </span>
          <span className="font-mono text-sm text-clay-text dark:text-white font-black">
            {totalDeficitAchievedSoFar} / {weeklyDeficitTarget}{' '}
            <span className="text-xs font-normal text-slate-400">kcal ({weeklyProgressPercent}%)</span>
          </span>
        </div>

        {/* Progress bar track */}
        <div className="h-3.5 w-full clay-sunken rounded-full overflow-hidden p-0.5 bg-slate-200/50 dark:bg-slate-800/80">
          <motion.div
            className={`h-full rounded-full transition-all duration-700 ${
              hasShortfall
                ? 'bg-gradient-to-r from-amber-400 to-lime-400'
                : 'bg-gradient-to-r from-emerald-400 to-lime-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(5, weeklyProgressPercent))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-0.5">
          <span>{remainingDeficitNeeded} kcal remaining this week</span>
          <span>{remainingDaysCount} days left in current cycle</span>
        </div>
      </div>

      {/* 7-Day Interactive Week Calendar Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-heading font-black text-clay-text dark:text-slate-200">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-clay-lime-dark dark:text-clay-lime" />
            <span>Current Week Pacing (Mon – Sun):</span>
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            Target: ~{dailyDeficitTarget} kcal/day deficit
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((day) => {
            const isCompleted = day.status === 'completed' || day.status === 'surplus_banked';
            const isShortfall = day.status === 'shortfall';
            const isSelectedCatchup = day.dayName === activeCatchupDay && day.isFuture;

            return (
              <div
                key={day.dateStr}
                onClick={() => {
                  if (day.isFuture) handlePickCatchupDay(day.dayName);
                }}
                className={`p-2 sm:p-2.5 rounded-2xl text-center transition-all flex flex-col justify-between min-h-[90px] sm:min-h-[102px] ${
                  day.isToday
                    ? 'clay-card-lime ring-2 ring-lime-500/80 scale-[1.02] shadow-md'
                    : isSelectedCatchup
                    ? 'clay-card-coral ring-2 ring-rose-400 scale-[1.02] cursor-pointer'
                    : day.isPast
                    ? isCompleted
                      ? 'clay-sunken bg-emerald-500/5'
                      : isShortfall
                      ? 'clay-sunken bg-amber-500/10 border border-amber-400/40'
                      : 'clay-sunken'
                    : 'clay-card-flat hover:scale-[1.02] cursor-pointer'
                }`}
              >
                <div>
                  <span
                    className={`text-[11px] sm:text-xs font-heading font-black block uppercase ${
                      day.isToday
                        ? 'text-slate-950 font-black'
                        : isSelectedCatchup
                        ? 'text-rose-900 dark:text-rose-200'
                        : 'text-clay-text/70 dark:text-slate-400'
                    }`}
                  >
                    {day.dayName}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-mono">
                    {day.dateStr.slice(8)}
                  </span>
                </div>

                {/* Day status indicator */}
                <div className="my-1 flex items-center justify-center">
                  {day.isBeforeUserJoined ? (
                    <span className="text-[9px] text-slate-400 font-bold">Not Started</span>
                  ) : day.isToday ? (
                    <span className="text-[9px] font-black uppercase text-slate-900 bg-lime-300 dark:bg-lime-400 px-1.5 py-0.5 rounded-full">
                      Today
                    </span>
                  ) : day.isPast ? (
                    day.status === 'untracked' ? (
                      <span className="text-[9px] text-slate-400 font-bold">—</span>
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : isShortfall ? (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )
                  ) : isSelectedCatchup ? (
                    <span className="text-[9px] font-black uppercase text-rose-800 dark:text-rose-300 bg-rose-200 dark:bg-rose-900/60 px-1 rounded-full">
                      Target
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-bold">Planned</span>
                  )}
                </div>

                {/* Deficit Numbers */}
                <div className="font-mono text-[10px] sm:text-[11px] font-black">
                  {day.isBeforeUserJoined ? (
                    <span className="text-slate-400 font-normal">—</span>
                  ) : day.isPast ? (
                    day.status === 'untracked' ? (
                      <span className="text-slate-400 font-normal">—</span>
                    ) : (
                      <span
                        className={
                          day.achievedDeficit >= day.targetDeficit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {day.achievedDeficit > 0 ? `-${day.achievedDeficit}` : `+${Math.abs(day.achievedDeficit)}`}
                      </span>
                    )
                  ) : day.isToday ? (
                    day.eaten > 0 || day.burned > 0 ? (
                      <span
                        className={
                          day.achievedDeficit >= day.targetDeficit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-clay-text dark:text-white'
                        }
                      >
                        {day.achievedDeficit > 0 ? `-${day.achievedDeficit}` : `+${Math.abs(day.achievedDeficit)}`}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">0 kcal</span>
                    )
                  ) : (
                    <span className="text-slate-400">-{day.targetDeficit}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Catch-up & Rollover Recommendation Card */}
      {hasShortfall ? (
        <div className="p-4 sm:p-5 rounded-2xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/40 text-amber-950 dark:text-amber-100 transition-all">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold bg-amber-400 text-slate-950 shadow-sm">
              <Zap className="w-5 h-5 fill-current" />
            </div>

            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-heading font-black text-sm uppercase tracking-wide">
                  Weekly Deficit Catch-Up Options
                </span>
                {safetyFloorEnforced && (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-300/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-rose-600" />
                    <span>Safety Floor Enforced</span>
                  </span>
                )}
              </div>

              <p className="text-clay-text/80 dark:text-slate-300 leading-relaxed font-sans">
                {recommendedCatchupAdvice}
              </p>

              {/* Show 2 actionable catch-up strategies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 mt-2 border-t border-amber-300/30 dark:border-amber-700/30">
                {/* Option 1: Even spread */}
                <div className="p-3 rounded-xl clay-sunken space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-heading font-black uppercase text-amber-600 dark:text-amber-400">
                      Option A: Spread Evenly
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      Next {remainingDaysCount} days
                    </span>
                  </div>
                  <div className="text-base font-heading font-black text-clay-text dark:text-white font-mono">
                    {adjustedDailyCalorieTarget}{' '}
                    <span className="text-xs font-normal text-slate-400">kcal/day</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Slightly reduces daily intake by ~{Math.round(shortfallCalories / remainingDaysCount)} kcal to hit 100% goal by Sunday.
                  </p>
                  {onApplyRolloverTarget && (
                    <button
                      type="button"
                      onClick={() => onApplyRolloverTarget(adjustedDailyCalorieTarget)}
                      className="mt-1.5 w-full py-1.5 px-2 rounded-lg bg-slate-900 text-white dark:bg-lime-400 dark:text-slate-950 font-heading font-black text-[10px] active:scale-95 transition"
                    >
                      Apply {adjustedDailyCalorieTarget} kcal to Today
                    </button>
                  )}
                </div>

                {/* Option 2: Single-day catchup on chosen day */}
                <div className="p-3 rounded-xl clay-sunken space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-heading font-black uppercase text-rose-600 dark:text-rose-400">
                      Option B: Catch Up on {activeCatchupDay}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      1 Single Day
                    </span>
                  </div>
                  <div className="text-base font-heading font-black text-rose-600 dark:text-rose-400 font-mono">
                    +{shortfallCalories}{' '}
                    <span className="text-xs font-normal text-slate-400">kcal deficit needed</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Keep your standard {standardDailyCalorieTarget} kcal target and make up {shortfallCalories} kcal on {activeCatchupDay} via an extra walk or gym workout!
                  </p>
                  <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                    <span className="text-[9px] text-slate-400 font-bold mr-1">Switch Day:</span>
                    {upcomingDays.map((d) => (
                      <button
                        key={d.dayName}
                        type="button"
                        onClick={() => handlePickCatchupDay(d.dayName)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black transition ${
                          activeCatchupDay === d.dayName
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-clay-text dark:text-slate-300'
                        }`}
                      >
                        {d.dayName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl clay-sunken flex items-center gap-2.5 text-xs text-clay-text/80 dark:text-slate-300">
          <Info className="w-4 h-4 text-clay-lime-dark dark:text-clay-lime flex-shrink-0" />
          <span>{recommendedCatchupAdvice}</span>
        </div>
      )}
    </div>
  );
};

