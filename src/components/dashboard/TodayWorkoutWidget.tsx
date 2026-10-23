import React from 'react';
import { Dumbbell, Play, Moon, Calendar, RefreshCw } from 'lucide-react';
import { WorkoutPlan, WorkoutPlanDay } from '../../types';

interface TodayWorkoutWidgetProps {
  plan: WorkoutPlan | null;
  onStartWorkout: (day: WorkoutPlanDay) => void;
  onToggleRestDay?: () => void;
  onNavigateToPlans?: () => void;
}

export const TodayWorkoutWidget: React.FC<TodayWorkoutWidgetProps> = ({
  plan,
  onStartWorkout,
  onToggleRestDay,
  onNavigateToPlans,
}) => {
  const todayDayOfWeek = new Date().getDay();
  const todayDay = plan?.days.find((d) => d.dayOfWeek === todayDayOfWeek);

  if (!todayDay) return null;

  return (
    <div className="clay-card-lilac rounded-clay-card p-6 text-left transition-transform hover:scale-[1.01]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full clay-pebble bg-white/80 dark:bg-[#252840]/80 text-clay-text flex items-center justify-center font-bold flex-shrink-0">
            {todayDay.isRestDay ? (
              <Moon className="w-6 h-6 stroke-[2.2] text-purple-600 dark:text-purple-400" />
            ) : (
              <Dumbbell className="w-6 h-6 stroke-[2.2] text-lilac-700 dark:text-lilac-300" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-heading font-black uppercase tracking-wider text-clay-text/80">
                Today's Schedule ({todayDay.dayName})
              </span>
              {todayDay.isRestDay ? (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200/50">
                  Rest & Recovery Day
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-clay-lime text-clay-text border border-white/60">
                  {todayDay.exercises.length} Movements
                </span>
              )}
            </div>

            <h4 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight">
              {todayDay.split}
            </h4>
            <span className="text-xs font-sans text-clay-text/70 dark:text-slate-300">
              {todayDay.isRestDay
                ? 'Active recovery window. Focus on light walking, mobility, stretching, and hitting your calorie deficit.'
                : todayDay.exercises.map((e) => e.name).slice(0, 3).join(', ') +
                  (todayDay.exercises.length > 3 ? '...' : '')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap flex-shrink-0">
          {onToggleRestDay && (
            <button
              onClick={onToggleRestDay}
              className="py-2.5 px-3.5 rounded-clay-btn clay-btn text-clay-text dark:text-slate-200 font-heading font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
              title={todayDay.isRestDay ? 'Switch today to a workout session' : 'Set today as your rest day'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{todayDay.isRestDay ? 'Work Out Today' : 'Make Rest Day'}</span>
            </button>
          )}

          {!todayDay.isRestDay ? (
            <button
              onClick={() => onStartWorkout(todayDay)}
              className="py-3 px-6 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 group shadow-sm flex-shrink-0"
            >
              <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
              <span>Start Routine</span>
            </button>
          ) : (
            onNavigateToPlans && (
              <button
                onClick={onNavigateToPlans}
                className="py-2.5 px-4 rounded-clay-btn clay-btn text-clay-text dark:text-slate-200 font-heading font-black text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Set Rest Days</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
