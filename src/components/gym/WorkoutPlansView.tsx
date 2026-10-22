import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Plus,
  Trash2,
  Play,
  Clock,
  X
} from 'lucide-react';
import { WorkoutPlan, WorkoutPlanDay, UserProfile, MuscleGroup } from '../../types';

interface WorkoutPlansViewProps {
  currentPlan: WorkoutPlan | null;
  profile: UserProfile;
  onUpdatePlan: (plan: WorkoutPlan) => void;
  onStartScheduledWorkout: (day: WorkoutPlanDay) => void;
}

export const WorkoutPlansView: React.FC<WorkoutPlansViewProps> = ({
  currentPlan,
  profile,
  onUpdatePlan,
  onStartScheduledWorkout,
}) => {
  const todayDayOfWeek = new Date().getDay();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1
  );

  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);

  const [genGoal, setGenGoal] = useState<'fat_loss' | 'hypertrophy' | 'strength'>('fat_loss');
  const [genLevel, setGenLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [genDays, setGenDays] = useState<number>(4);
  const [genEquipment, setGenEquipment] = useState<'full_gym' | 'dumbbells' | 'bodyweight'>('full_gym');

  const orderedDays = currentPlan?.days
    ? [...currentPlan.days].sort((a, b) => {
        const orderA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
        const orderB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
        return orderA - orderB;
      })
    : [];

  const activeDay = orderedDays[selectedDayIndex] || null;

  const handleToggleRestDay = () => {
    if (!currentPlan || !activeDay) return;
    const updatedDays = currentPlan.days.map((d) =>
      d.dayOfWeek === activeDay.dayOfWeek ? { ...d, isRestDay: !d.isRestDay } : d
    );
    const updatedPlan = { ...currentPlan, days: updatedDays };
    onUpdatePlan(updatedPlan);
  };

  const handleAddExerciseToDay = () => {
    if (!currentPlan || !activeDay) return;
    const exerciseName = prompt('Enter exercise name (e.g. Incline Bench Press):');
    if (!exerciseName) return;

    const updatedDays = currentPlan.days.map((d) => {
      if (d.dayOfWeek === activeDay.dayOfWeek) {
        return {
          ...d,
          exercises: [
            ...d.exercises,
            { name: exerciseName, muscleGroup: 'Chest' as MuscleGroup, targetSets: 3, targetReps: 10 },
          ],
        };
      }
      return d;
    });

    onUpdatePlan({ ...currentPlan, days: updatedDays });
  };

  const handleRemoveExerciseFromDay = (index: number) => {
    if (!currentPlan || !activeDay) return;
    const updatedDays = currentPlan.days.map((d) => {
      if (d.dayOfWeek === activeDay.dayOfWeek) {
        const copy = [...d.exercises];
        copy.splice(index, 1);
        return { ...d, exercises: copy };
      }
      return d;
    });
    onUpdatePlan({ ...currentPlan, days: updatedDays });
  };

  const handleGeneratePlan = () => {
    let daysTemplate: WorkoutPlanDay[] = [];

    if (genDays === 3) {
      daysTemplate = [
        {
          dayOfWeek: 1,
          dayName: 'Monday',
          split: 'Full Body A (Compound)',
          isRestDay: false,
          exercises: [
            { name: 'Barbell Back Squat', muscleGroup: 'Legs', targetSets: 4, targetReps: 8 },
            { name: 'Barbell Bench Press', muscleGroup: 'Chest', targetSets: 4, targetReps: 8 },
            { name: 'Barbell Bent-Over Row', muscleGroup: 'Back', targetSets: 3, targetReps: 10 },
            { name: 'Overhead Barbell Press', muscleGroup: 'Shoulder', targetSets: 3, targetReps: 8 },
          ],
        },
        { dayOfWeek: 2, dayName: 'Tuesday', split: 'Rest & Recovery', isRestDay: true, exercises: [] },
        {
          dayOfWeek: 3,
          dayName: 'Wednesday',
          split: 'Full Body B (Hinge & Pull)',
          isRestDay: false,
          exercises: [
            { name: 'Barbell Deadlift', muscleGroup: 'Back', targetSets: 3, targetReps: 6 },
            { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', targetSets: 3, targetReps: 10 },
            { name: 'Lat Pulldown', muscleGroup: 'Back', targetSets: 3, targetReps: 12 },
            { name: 'Walking Dumbbell Lunges', muscleGroup: 'Legs', targetSets: 3, targetReps: 12 },
          ],
        },
        { dayOfWeek: 4, dayName: 'Thursday', split: 'Rest & Recovery', isRestDay: true, exercises: [] },
        {
          dayOfWeek: 5,
          dayName: 'Friday',
          split: 'Full Body C (Hypertrophy)',
          isRestDay: false,
          exercises: [
            { name: 'Leg Press', muscleGroup: 'Legs', targetSets: 3, targetReps: 12 },
            { name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulder', targetSets: 4, targetReps: 15 },
            { name: 'Tricep Pushdown', muscleGroup: 'Arms', targetSets: 3, targetReps: 12 },
            { name: 'Barbell Bicep Curl', muscleGroup: 'Arms', targetSets: 3, targetReps: 12 },
          ],
        },
        { dayOfWeek: 6, dayName: 'Saturday', split: 'Active Cardio', isRestDay: true, exercises: [] },
        { dayOfWeek: 0, dayName: 'Sunday', split: 'Rest', isRestDay: true, exercises: [] },
      ];
    } else {
      daysTemplate = [
        {
          dayOfWeek: 1,
          dayName: 'Monday',
          split: 'Upper Power (Chest & Back)',
          isRestDay: false,
          exercises: [
            { name: 'Barbell Bench Press', muscleGroup: 'Chest', targetSets: 4, targetReps: 8 },
            { name: 'Barbell Bent-Over Row', muscleGroup: 'Back', targetSets: 4, targetReps: 8 },
            { name: 'Overhead Barbell Press', muscleGroup: 'Shoulder', targetSets: 3, targetReps: 8 },
            { name: 'Lat Pulldown', muscleGroup: 'Back', targetSets: 3, targetReps: 10 },
          ],
        },
        {
          dayOfWeek: 2,
          dayName: 'Tuesday',
          split: 'Lower Strength (Quads & Hamstrings)',
          isRestDay: false,
          exercises: [
            { name: 'Barbell Back Squat', muscleGroup: 'Legs', targetSets: 4, targetReps: 8 },
            { name: 'Romanian Deadlift (RDL)', muscleGroup: 'Legs', targetSets: 3, targetReps: 10 },
            { name: 'Leg Extension', muscleGroup: 'Legs', targetSets: 3, targetReps: 12 },
            { name: 'Standing Calf Raise', muscleGroup: 'Legs', targetSets: 4, targetReps: 15 },
          ],
        },
        { dayOfWeek: 3, dayName: 'Wednesday', split: 'Zone 2 Cardio & Mobility', isRestDay: true, exercises: [] },
        {
          dayOfWeek: 4,
          dayName: 'Thursday',
          split: 'Push Hypertrophy',
          isRestDay: false,
          exercises: [
            { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', targetSets: 3, targetReps: 10 },
            { name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulder', targetSets: 4, targetReps: 12 },
            { name: 'Cable Chest Fly', muscleGroup: 'Chest', targetSets: 3, targetReps: 12 },
            { name: 'Tricep Rope Pushdown', muscleGroup: 'Arms', targetSets: 3, targetReps: 12 },
          ],
        },
        {
          dayOfWeek: 5,
          dayName: 'Friday',
          split: 'Pull & Arms Density',
          isRestDay: false,
          exercises: [
            { name: 'Barbell Deadlift', muscleGroup: 'Back', targetSets: 3, targetReps: 6 },
            { name: 'Seated Cable Row', muscleGroup: 'Back', targetSets: 3, targetReps: 10 },
            { name: 'Barbell Bicep Curl', muscleGroup: 'Arms', targetSets: 3, targetReps: 10 },
            { name: 'Hanging Leg Raise', muscleGroup: 'Core', targetSets: 3, targetReps: 15 },
          ],
        },
        { dayOfWeek: 6, dayName: 'Saturday', split: 'Outdoor Run / Hike', isRestDay: true, exercises: [] },
        { dayOfWeek: 0, dayName: 'Sunday', split: 'Full Rest & Recovery', isRestDay: true, exercises: [] },
      ];
    }

    const generatedPlan: WorkoutPlan = {
      id: `plan_${Date.now()}`,
      userId: profile.id,
      name: `${genDays}-Day ${genGoal === 'fat_loss' ? 'Deficit Preserving' : 'Hypertrophy'} Split`,
      description: `Tailored for ${genLevel} lifters with ${genEquipment.replace('_', ' ')}.`,
      days: daysTemplate,
      createdAt: new Date().toISOString(),
    };

    onUpdatePlan(generatedPlan);
    setIsGeneratorOpen(false);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Plan Header Card */}
      <div className="clay-card rounded-clay-card p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="clay-chip bg-clay-lilac text-clay-text text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Weekly Routine</span>
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-heading font-black text-clay-text dark:text-white tracking-tight">
              {currentPlan?.name || 'Weekly Training Plan'}
            </h3>
            <p className="text-xs sm:text-sm font-sans text-clay-text/70 dark:text-slate-300 mt-1 max-w-md">
              {currentPlan?.description || 'Organize your weekly muscle split and exercises.'}
            </p>
          </div>

          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="py-3 px-5 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Generate Plan</span>
          </button>
        </div>

        {/* Day Tabs (Mon - Sun) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 mt-7 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
          {orderedDays.map((day, idx) => {
            const isToday =
              (todayDayOfWeek === 0 && day.dayOfWeek === 0) ||
              todayDayOfWeek === day.dayOfWeek;
            const isSelected = selectedDayIndex === idx;

            return (
              <button
                key={day.dayOfWeek}
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-2 sm:p-3.5 rounded-2xl text-center transition flex flex-col items-center justify-center relative min-w-0 ${
                  isSelected
                    ? 'clay-btn-lime text-clay-text scale-105 shadow-md'
                    : 'clay-pebble text-clay-text/80 dark:text-slate-300 hover:scale-105'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-heading font-black uppercase tracking-wider block truncate max-w-full">
                  {day.dayName.slice(0, 3)}
                </span>
                <span className="text-[8px] sm:text-[10px] mt-0.5 font-sans font-bold truncate max-w-full opacity-80">
                  {day.isRestDay ? 'Rest' : `${day.exercises.length} ex`}
                </span>

                {isToday && (
                  <span className="absolute -top-1 right-1 w-2.5 h-2.5 rounded-full bg-clay-coral border-2 border-white dark:border-[#252840]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {activeDay && (
        <div className="clay-card rounded-clay-card p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/60 dark:border-slate-700/60">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight">
                  {activeDay.dayName}: {activeDay.split}
                </h4>
                {activeDay.isRestDay && (
                  <span className="text-xs font-heading font-black px-2.5 py-0.5 rounded-full clay-chip bg-clay-butter text-clay-text">
                    Rest Day
                  </span>
                )}
              </div>
              <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400 mt-1 block">
                {activeDay.isRestDay
                  ? 'Active recovery window.'
                  : `${activeDay.exercises.length} scheduled resistance movements`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleRestDay}
                className="py-2.5 px-4 rounded-clay-btn clay-btn text-clay-text dark:text-white text-xs font-heading font-black transition active:scale-95"
              >
                {activeDay.isRestDay ? 'Change to Workout' : 'Mark as Rest Day'}
              </button>

              {!activeDay.isRestDay && (
                <button
                  onClick={() => onStartScheduledWorkout(activeDay)}
                  className="py-2.5 px-5 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start This Workout</span>
                </button>
              )}
            </div>
          </div>

          {/* Exercises for this day */}
          <div className="mt-6">
            {activeDay.isRestDay ? (
              <div className="text-center py-12 text-clay-text">
                <div className="w-14 h-14 rounded-full clay-pebble bg-clay-sky text-clay-text mx-auto mb-3 flex items-center justify-center">
                  <Clock className="w-7 h-7 stroke-[2]" />
                </div>
                <p className="text-base font-heading font-black text-clay-text dark:text-white">
                  Active Recovery Scheduled
                </p>
                <p className="text-xs font-sans text-clay-text/60 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Take a brisk walk, stretch, and hit your hydration goals.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {activeDay.exercises.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="p-4 rounded-2xl clay-card-flat flex items-center justify-between transition hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-full clay-pebble bg-clay-lilac text-clay-text font-heading font-black text-xs flex items-center justify-center">
                        {exIdx + 1}
                      </div>
                      <div>
                        <span className="font-heading font-black text-clay-text dark:text-white text-base block">
                          {ex.name}
                        </span>
                        <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400 capitalize">
                          {ex.muscleGroup} • {ex.targetSets} sets × {ex.targetReps} reps
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveExerciseFromDay(exIdx)}
                      className="w-8 h-8 rounded-full clay-pebble text-clay-text/40 hover:text-rose-500 transition"
                      aria-label="Remove exercise from day"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={handleAddExerciseToDay}
                  className="w-full py-3.5 rounded-2xl clay-sunken text-clay-text dark:text-white hover:opacity-90 text-xs font-heading font-black flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Exercise to {activeDay.dayName}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PLAN GENERATOR MODAL */}
      <AnimatePresence>
        {isGeneratorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg clay-card rounded-clay-card p-6 sm:p-7 relative text-left"
            >
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full clay-pebble flex items-center justify-center text-clay-text/60 hover:text-clay-text dark:text-slate-400 dark:hover:text-white transition"
                aria-label="Close generator"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-12 h-12 rounded-full clay-pebble bg-clay-lime text-clay-text flex items-center justify-center font-bold">
                  <Sparkles className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-2xl font-heading font-black text-clay-text dark:text-white">
                    Generate Workout Plan
                  </h3>
                  <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400">
                    Customized to your goal, schedule, and equipment
                  </span>
                </div>
              </div>

              <div className="space-y-5 mb-6">
                {/* Goal */}
                <div>
                  <label className="block text-xs font-heading font-bold text-clay-text dark:text-slate-300 mb-2">
                    Training Focus
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'fat_loss' as const, label: 'Fat Loss' },
                      { id: 'hypertrophy' as const, label: 'Hypertrophy' },
                      { id: 'strength' as const, label: 'Strength' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGenGoal(g.id)}
                        className={`p-3 rounded-2xl text-xs font-heading font-black transition text-center ${
                          genGoal === g.id
                            ? 'clay-btn-lime text-clay-text scale-105 shadow-sm'
                            : 'clay-pebble text-clay-text dark:text-slate-300'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-xs font-heading font-bold text-clay-text dark:text-slate-300 mb-2">
                    Experience Level
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setGenLevel(lvl)}
                        className={`p-3 rounded-2xl text-xs font-heading font-black capitalize transition text-center ${
                          genLevel === lvl
                            ? 'clay-btn-sky text-clay-text scale-105 shadow-sm'
                            : 'clay-pebble text-clay-text dark:text-slate-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Days Per Week */}
                <div>
                  <label className="block text-xs font-heading font-bold text-clay-text dark:text-slate-300 mb-2">
                    Days Available Per Week
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 4, 5, 6].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setGenDays(days)}
                        className={`p-3 rounded-2xl text-xs font-heading font-black transition text-center ${
                          genDays === days
                            ? 'clay-btn-coral text-clay-text scale-105 shadow-sm'
                            : 'clay-pebble text-clay-text dark:text-slate-300'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <label className="block text-xs font-heading font-bold text-clay-text dark:text-slate-300 mb-2">
                    Available Equipment
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'full_gym' as const, label: 'Full Gym' },
                      { id: 'dumbbells' as const, label: 'Dumbbells' },
                      { id: 'bodyweight' as const, label: 'Bodyweight' },
                    ].map((eq) => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => setGenEquipment(eq.id)}
                        className={`p-3 rounded-2xl text-xs font-heading font-black transition text-center ${
                          genEquipment === eq.id
                            ? 'clay-btn-lilac text-clay-text scale-105 shadow-sm'
                            : 'clay-pebble text-clay-text dark:text-slate-300'
                        }`}
                      >
                        {eq.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGeneratePlan}
                className="w-full py-4 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black flex items-center justify-center gap-2 transition text-sm shadow-md active:scale-95"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Apply Generated Split</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
