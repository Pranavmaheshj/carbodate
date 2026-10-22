import React from 'react';
import { Dumbbell, Play } from 'lucide-react';
import { WorkoutPlan, WorkoutPlanDay } from '../../types';

interface TodayWorkoutWidgetProps {
  plan: WorkoutPlan | null;
  onStartWorkout: (day: WorkoutPlanDay) => void;
}

export const TodayWorkoutWidget: React.FC<TodayWorkoutWidgetProps> = ({
  plan,
  onStartWorkout,
}) => {
  const todayDayOfWeek = new Date().getDay();
  const todayDay = plan?.days.find((d) => d.dayOfWeek === todayDayOfWeek);

  if (!todayDay) return null;

  return (
    <div className="clay-card-lilac rounded-clay-card p-6 text-left transition-transform hover:scale-[1.01]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full clay-pebble bg-white/80 dark:bg-[#252840]/80 text-clay-text flex items-center justify-center font-bold flex-shrink-0">
            <Dumbbell className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-heading font-black uppercase tracking-wider text-clay-text/80">
                Today's Scheduled Routine
              </span>
              {todayDay.isRestDay ? (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-black/30 text-clay-text border border-white/50">
                  Rest & Recovery
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
                ? 'Active recovery day. Go for a brisk outdoor walk or stretch.'
                : todayDay.exercises.map((e) => e.name).slice(0, 3).join(', ') +
                  (todayDay.exercises.length > 3 ? '...' : '')}
            </span>
          </div>
        </div>

        {!todayDay.isRestDay && (
          <button
            onClick={() => onStartWorkout(todayDay)}
            className="py-3 px-6 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 group shadow-sm flex-shrink-0"
          >
            <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
            <span>Start Routine</span>
          </button>
        )}
      </div>
    </div>
  );
};
