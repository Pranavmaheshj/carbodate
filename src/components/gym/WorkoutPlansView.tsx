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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
                Weekly Routine
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {currentPlan?.name || 'Weekly Training Plan'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-md">
              {currentPlan?.description || 'Organize your weekly muscle split and exercises.'}
            </p>
          </div>

          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Plan</span>
          </button>
        </div>

        {/* Day Tabs (Mon - Sun) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-6 pt-5 border-t border-slate-100">
          {orderedDays.map((day, idx) => {
            const isToday =
              (todayDayOfWeek === 0 && day.dayOfWeek === 0) ||
              todayDayOfWeek === day.dayOfWeek;
            const isSelected = selectedDayIndex === idx;

            return (
              <button
                key={day.dayOfWeek}
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-1 sm:p-3 rounded-2xl text-center transition flex flex-col items-center justify-center relative border min-w-0 ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider block truncate max-w-full">
                  {day.dayName.slice(0, 3)}
                </span>
                <span className="text-[8px] sm:text-[10px] mt-0.5 font-medium truncate max-w-full">
                  {day.isRestDay ? 'Rest' : `${day.exercises.length} ex`}
                </span>

                {isToday && (
                  <span className="absolute -top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {activeDay && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeDay.dayName}: {activeDay.split}
                </h4>
                {activeDay.isRestDay && (
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                    Rest Day
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {activeDay.isRestDay
                  ? 'Active recovery window.'
                  : `${activeDay.exercises.length} scheduled resistance movements`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleRestDay}
                className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              >
                {activeDay.isRestDay ? 'Change to Workout' : 'Mark as Rest Day'}
              </button>

              {!activeDay.isRestDay && (
                <button
                  onClick={() => onStartScheduledWorkout(activeDay)}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start This Workout</span>
                </button>
              )}
            </div>
          </div>

          {/* Exercises for this day */}
          <div className="mt-5">
            {activeDay.isRestDay ? (
              <div className="text-center py-10 text-slate-500">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Active Recovery Scheduled</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Take a brisk walk, stretch, and hit your hydration goals.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeDay.exercises.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {exIdx + 1}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{ex.name}</span>
                        <span className="text-xs text-slate-500 capitalize">
                          {ex.muscleGroup} • {ex.targetSets} sets × {ex.targetReps} reps
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveExerciseFromDay(exIdx)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition"
                      aria-label="Remove exercise from day"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={handleAddExerciseToDay}
                  className="w-full py-3 rounded-2xl border border-dashed border-slate-300 hover:border-emerald-500 text-slate-600 hover:text-emerald-700 text-xs font-bold flex items-center justify-center gap-2 transition"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left"
            >
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
                aria-label="Close generator"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Generate Workout Plan</h3>
                  <span className="text-xs text-slate-500">Customized to your goal, schedule, and equipment</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {/* Goal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Training Focus
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'fat_loss' as const, label: 'Fat Loss (Deficit)' },
                      { id: 'hypertrophy' as const, label: 'Hypertrophy' },
                      { id: 'strength' as const, label: 'Strength & Power' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGenGoal(g.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                          genGoal === g.id
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Experience Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setGenLevel(lvl)}
                        className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition text-center ${
                          genLevel === lvl
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Days Per Week */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Days Available Per Week
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 4, 5, 6].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setGenDays(days)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                          genDays === days
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {days} Days/Wk
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Available Equipment
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'full_gym' as const, label: 'Full Gym' },
                      { id: 'dumbbells' as const, label: 'Dumbbells Only' },
                      { id: 'bodyweight' as const, label: 'Calisthenics' },
                    ].map((eq) => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => setGenEquipment(eq.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                          genEquipment === eq.id
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
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
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Apply Generated Split</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
