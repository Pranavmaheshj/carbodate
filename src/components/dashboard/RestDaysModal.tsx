import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Calendar, X, Check, Dumbbell, Sparkles } from 'lucide-react';
import { UserProfile, WorkoutPlan, WorkoutPlanDay } from '../../types';
import { StorageService } from '../../services/storage';

interface RestDaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  workoutPlan: WorkoutPlan | null;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateWorkoutPlan: (plan: WorkoutPlan) => void;
}

const DAYS_OF_WEEK = [
  { dayNum: 1, name: 'Monday', short: 'Mon' },
  { dayNum: 2, name: 'Tuesday', short: 'Tue' },
  { dayNum: 3, name: 'Wednesday', short: 'Wed' },
  { dayNum: 4, name: 'Thursday', short: 'Thu' },
  { dayNum: 5, name: 'Friday', short: 'Fri' },
  { dayNum: 6, name: 'Saturday', short: 'Sat' },
  { dayNum: 0, name: 'Sunday', short: 'Sun' },
];

export const RestDaysModal: React.FC<RestDaysModalProps> = ({
  isOpen,
  onClose,
  profile,
  workoutPlan,
  onUpdateProfile,
  onUpdateWorkoutPlan,
}) => {
  const currentRestDays = Array.isArray(profile.restDays) ? profile.restDays : [0, 4];

  const handleToggleDay = (dayNum: number) => {
    const isCurrentlyRest = currentRestDays.includes(dayNum);
    const newRestDays = isCurrentlyRest
      ? currentRestDays.filter((d) => d !== dayNum)
      : [...currentRestDays, dayNum];

    // 1. Update Profile immediately in state and storage
    const updatedProfile: UserProfile = {
      ...profile,
      restDays: newRestDays,
    };
    StorageService.saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);

    // 2. Synchronize Workout Plan
    const effectivePlan: WorkoutPlan = workoutPlan || {
      id: 'plan_default',
      userId: profile.id || 'usr_carbodate',
      name: 'Custom Weekly Schedule',
      description: 'Weekly resistance & recovery plan',
      createdAt: new Date().toISOString(),
      days: DAYS_OF_WEEK.map((d) => ({
        dayOfWeek: d.dayNum,
        dayName: d.name,
        split: newRestDays.includes(d.dayNum) ? 'Rest & Recovery' : 'Workout Session',
        isRestDay: newRestDays.includes(d.dayNum),
        exercises: [],
      })),
    };

    const updatedDays: WorkoutPlanDay[] = effectivePlan.days.map((d) => {
      const isRest = newRestDays.includes(d.dayOfWeek);
      return {
        ...d,
        isRestDay: isRest,
        split: isRest
          ? (d.split === 'Rest & Recovery' || d.split === 'Rest' ? d.split : 'Rest & Recovery')
          : (d.split === 'Rest & Recovery' || d.split === 'Rest' ? 'Full Body Workout' : d.split),
      };
    });

    const updatedPlan: WorkoutPlan = {
      ...effectivePlan,
      days: updatedDays,
    };

    StorageService.saveWorkoutPlan(updatedPlan);
    onUpdateWorkoutPlan(updatedPlan);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md clay-card rounded-3xl p-6 sm:p-7 relative shadow-2xl text-left border border-white/20 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl clay-pebble bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                  <Moon className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-black text-clay-text dark:text-white">
                    Scheduled Rest Days
                  </h3>
                  <p className="text-[11px] font-sans text-slate-400">
                    Pick your weekly rest & active recovery days
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full clay-sunken flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Days Selector */}
            <div className="mt-5 space-y-2.5">
              {DAYS_OF_WEEK.map((d) => {
                const isRest = currentRestDays.includes(d.dayNum);
                return (
                  <button
                    key={d.dayNum}
                    type="button"
                    onClick={() => handleToggleDay(d.dayNum)}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] ${
                      isRest
                        ? 'clay-btn-lilac text-purple-950 dark:text-purple-100 ring-2 ring-purple-400/50 shadow-xs'
                        : 'clay-pebble text-clay-text dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          isRest
                            ? 'bg-purple-200 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200'
                            : 'bg-lime-200 dark:bg-lime-950/60 text-lime-900 dark:text-lime-300'
                        }`}
                      >
                        {isRest ? <Moon className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-heading font-black block">
                          {d.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {isRest ? 'Rest & Recovery Day' : 'Scheduled Training Day'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                          isRest
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isRest ? 'Rest Day' : 'Workout'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Summary & Done */}
            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <span className="text-xs font-sans text-slate-400">
                <strong className="text-purple-500 font-bold">{currentRestDays.length}</strong> rest days •{' '}
                <strong className="text-lime-500 font-bold">{7 - currentRestDays.length}</strong> training days
              </span>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black text-xs shadow-md transition active:scale-95"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
