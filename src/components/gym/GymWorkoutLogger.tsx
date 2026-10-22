import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Plus,
  Check,
  Trash2,
  Copy,
  Flame,
  Search,
  Trophy,
  Timer,
  X
} from 'lucide-react';
import {
  GymWorkoutSession,
  LoggedExercise,
  ExerciseDefinition,
  UserProfile,
} from '../../types';
import { StorageService } from '../../services/storage';
import { SPLIT_OPTIONS, MUSCLE_GROUPS } from '../../data/exerciseLibrary';
import { RestTimerOverlay } from './RestTimerOverlay';
import { AddCustomExerciseModal } from './AddCustomExerciseModal';
import { formatDuration } from '../../services/calculations';

interface GymWorkoutLoggerProps {
  profile: UserProfile;
  initialSplit?: string;
  onFinishWorkout: (session: GymWorkoutSession) => void;
  onCancel: () => void;
}

export const GymWorkoutLogger: React.FC<GymWorkoutLoggerProps> = ({
  profile,
  initialSplit = 'Push (Chest/Shoulder/Triceps)',
  onFinishWorkout,
  onCancel,
}) => {
  const [split, setSplit] = useState<string>(initialSplit);
  const [workoutTitle, setWorkoutTitle] = useState<string>(`${initialSplit} Session`);
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRestTimerOpen, setIsRestTimerOpen] = useState<boolean>(false);
  const [restSeconds, setRestSeconds] = useState<number>(90);

  // Exercise picker modal state
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('All');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  const allExercises = StorageService.getAllExercises();
  const pastSessions = StorageService.getGymSessions();

  // Live workout timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter exercises
  const filteredLibrary = allExercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscleFilter === 'All' || ex.muscleGroup === selectedMuscleFilter;
    return matchesSearch && matchesMuscle;
  });

  const durationMins = elapsedSeconds / 60;
  const estimatedCalories = Math.round(
    5.5 * (profile.currentWeightKg || 75) * (durationMins / 60)
  );

  const handleAddExercise = (def: ExerciseDefinition) => {
    let prevWeight = 40;
    let prevReps = 10;

    for (const session of pastSessions) {
      const match = session.exercises.find((e) => e.name === def.name || e.exerciseId === def.id);
      if (match && match.sets.length > 0) {
        prevWeight = match.sets[0].weightKg;
        prevReps = match.sets[0].reps;
        break;
      }
    }

    const newLogEx: LoggedExercise = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      exerciseId: def.id,
      name: def.name,
      muscleGroup: def.muscleGroup,
      sets: [
        { setNumber: 1, reps: prevReps, weightKg: prevWeight, completed: false },
        { setNumber: 2, reps: prevReps, weightKg: prevWeight, completed: false },
        { setNumber: 3, reps: prevReps, weightKg: prevWeight, completed: false },
      ],
    };

    setExercises([...exercises, newLogEx]);
    setIsPickerOpen(false);
  };

  const handleCopyLastSession = () => {
    const lastMatch = pastSessions.find((s) => s.split.toLowerCase().includes(split.toLowerCase()));
    if (!lastMatch || lastMatch.exercises.length === 0) {
      alert('No previous session found for this split to copy from.');
      return;
    }

    const clonedExercises: LoggedExercise[] = lastMatch.exercises.map((e) => ({
      ...e,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sets: e.sets.map((s) => ({ ...s, completed: false, isPR: false })),
    }));

    setExercises(clonedExercises);
    alert(`Copied ${clonedExercises.length} exercises from previous ${lastMatch.title}!`);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    const target = updated[exerciseIndex];
    const lastSet = target.sets[target.sets.length - 1];
    const nextSetNumber = target.sets.length + 1;

    target.sets.push({
      setNumber: nextSetNumber,
      reps: lastSet ? lastSet.reps : 10,
      weightKg: lastSet ? lastSet.weightKg : 40,
      completed: false,
    });

    setExercises(updated);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.splice(setIndex, 1);
    updated[exerciseIndex].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });
    setExercises(updated);
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    const updated = [...exercises];
    updated.splice(exerciseIndex, 1);
    setExercises(updated);
  };

  const handleToggleSetCompleted = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    const currentSet = updated[exerciseIndex].sets[setIndex];
    const nextState = !currentSet.completed;
    currentSet.completed = nextState;

    if (nextState) {
      const exName = updated[exerciseIndex].name;
      let maxPastWeight = 0;
      pastSessions.forEach((sess) => {
        sess.exercises.forEach((pastEx) => {
          if (pastEx.name === exName) {
            pastEx.sets.forEach((ps) => {
              if (ps.weightKg > maxPastWeight) maxPastWeight = ps.weightKg;
            });
          }
        });
      });

      if (maxPastWeight > 0 && currentSet.weightKg > maxPastWeight) {
        currentSet.isPR = true;
      }

      setIsRestTimerOpen(true);
    }

    setExercises(updated);
  };

  const handleAdjustWeight = (exerciseIndex: number, setIndex: number, delta: number) => {
    const updated = [...exercises];
    const current = updated[exerciseIndex].sets[setIndex];
    current.weightKg = Math.max(0, Math.round((current.weightKg + delta) * 10) / 10);
    setExercises(updated);
  };

  const handleAdjustReps = (exerciseIndex: number, setIndex: number, delta: number) => {
    const updated = [...exercises];
    const current = updated[exerciseIndex].sets[setIndex];
    current.reps = Math.max(1, current.reps + delta);
    setExercises(updated);
  };

  const handleFinish = () => {
    if (exercises.length === 0) {
      alert('Please add at least one exercise before completing the workout.');
      return;
    }

    const session: GymWorkoutSession = {
      id: `gym_${Date.now()}`,
      userId: profile.id,
      title: workoutTitle,
      split,
      startTime: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      caloriesBurned: Math.max(estimatedCalories, 20),
      exercises,
      notes: `Completed ${exercises.length} exercises with ${exercises.reduce((s, e) => s + e.sets.filter((x) => x.completed).length, 0)} completed sets.`,
    };

    onFinishWorkout(session);
  };

  return (
    <div className="space-y-6 pb-28 md:pb-12 text-left">
      {/* Top Session HUD Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Active Workout Session
              </span>
            </div>

            <input
              type="text"
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none transition w-full"
            />

            {/* Split Selector dropdown */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">Split:</span>
              <select
                value={split}
                onChange={(e) => {
                  setSplit(e.target.value);
                  setWorkoutTitle(`${e.target.value} Session`);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
              >
                {SPLIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* HUD Live Duration & Calorie Stats */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
                Duration
              </span>
              <span className="text-xl font-bold text-slate-900 font-mono">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
                Burned
              </span>
              <span className="text-xl font-bold text-amber-600 flex items-center justify-center gap-0.5">
                <Flame className="w-4 h-4 fill-current text-amber-500" /> {estimatedCalories}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons bar */}
        <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={() => setIsPickerOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Exercise</span>
          </button>

          <button
            onClick={handleCopyLastSession}
            className="py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Last Session</span>
          </button>

          <button
            onClick={() => setIsRestTimerOpen(true)}
            className="py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 transition"
          >
            <Timer className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rest Timer</span>
          </button>

          <div className="flex-1" />

          <button
            onClick={handleFinish}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Finish Workout</span>
          </button>

          <button
            onClick={onCancel}
            className="py-2.5 px-3 rounded-xl text-slate-500 hover:text-slate-800 text-xs transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Exercises List */}
      {exercises.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500 shadow-sm">
          <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No exercises added yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
            Tap "Add Exercise" to search the 60+ movement library or "Copy Last Session" to preload previous weights.
          </p>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Browse Exercise Library</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {exercises.map((ex, exIndex) => (
            <div
              key={ex.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm"
            >
              {/* Exercise Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-sm">
                    {exIndex + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{ex.name}</h4>
                    <span className="text-xs text-slate-500">{ex.muscleGroup}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveExercise(exIndex)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                  title="Remove exercise"
                  aria-label="Remove exercise"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sets Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-1 sm:gap-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 px-1 sm:px-2">
                  <span className="col-span-2">Set</span>
                  <span className="col-span-4 text-center">Weight (kg)</span>
                  <span className="col-span-4 text-center">Reps</span>
                  <span className="col-span-2 text-center">Done</span>
                </div>

                {ex.sets.map((set, setIndex) => (
                  <div
                    key={set.setNumber}
                    className={`grid grid-cols-12 gap-1 sm:gap-2 items-center p-1.5 sm:p-2 rounded-2xl border transition ${
                      set.completed
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="col-span-2 flex items-center gap-1">
                      <span className="font-bold text-xs text-slate-700 ml-0.5">
                        {set.setNumber}
                      </span>
                      {set.isPR && (
                        <span className="bg-amber-100 text-amber-800 text-[8px] sm:text-[9px] font-black px-1 rounded flex items-center gap-0.5 border border-amber-200">
                          <Trophy className="w-2.5 h-2.5" /> PR
                        </span>
                      )}
                    </div>

                    {/* Weight stepper */}
                    <div className="col-span-4 flex items-center justify-center gap-0.5 sm:gap-1">
                      <button
                        onClick={() => handleAdjustWeight(exIndex, setIndex, -2.5)}
                        className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step={0.5}
                        value={set.weightKg}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIndex].sets[setIndex].weightKg = Number(e.target.value);
                          setExercises(updated);
                        }}
                        className="w-10 sm:w-14 bg-white border border-slate-200 rounded-lg py-1 text-center font-mono text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleAdjustWeight(exIndex, setIndex, 2.5)}
                        className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Reps stepper */}
                    <div className="col-span-4 flex items-center justify-center gap-0.5 sm:gap-1">
                      <button
                        onClick={() => handleAdjustReps(exIndex, setIndex, -1)}
                        className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIndex].sets[setIndex].reps = Number(e.target.value);
                          setExercises(updated);
                        }}
                        className="w-9 sm:w-12 bg-white border border-slate-200 rounded-lg py-1 text-center font-mono text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleAdjustReps(exIndex, setIndex, 1)}
                        className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Complete button */}
                    <div className="col-span-2 flex items-center justify-center">
                      <button
                        onClick={() => handleToggleSetCompleted(exIndex, setIndex)}
                        className={`w-7 sm:w-8 h-7 sm:h-8 rounded-xl flex items-center justify-center transition active:scale-90 ${
                          set.completed
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-400'
                        }`}
                        title="Mark set complete"
                        aria-label="Mark set complete"
                      >
                        <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Set button */}
              <div className="mt-3 flex justify-between items-center">
                <button
                  onClick={() => handleAddSet(exIndex)}
                  className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-emerald-700 flex items-center gap-1.5 transition border border-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Set</span>
                </button>
                <span className="text-[11px] text-slate-500">
                  Total Volume: {ex.sets.reduce((s, x) => s + (x.completed ? x.reps * x.weightKg : 0), 0)} kg
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EXERCISE PICKER MODAL */}
      <AnimatePresence>
        {isPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative text-left max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-emerald-600" />
                  <span>Exercise Library</span>
                </h3>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="py-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search barbell, squat, row, curls..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Muscle Group Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-none mb-1">
                {['All', ...MUSCLE_GROUPS].map((mg) => (
                  <button
                    key={mg}
                    onClick={() => setSelectedMuscleFilter(mg)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      selectedMuscleFilter === mg
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mg}
                  </button>
                ))}
              </div>

              {/* Exercise Items List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {filteredLibrary.map((def) => (
                  <div
                    key={def.id}
                    onClick={() => handleAddExercise(def)}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                          {def.name}
                        </span>
                        {def.isCustom && (
                          <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-semibold">
                            Custom
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 capitalize">
                        {def.muscleGroup} • {def.equipment}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Exercise trigger */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Can't find your exercise?
                </span>
                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Custom Exercise</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RestTimerOverlay
        isOpen={isRestTimerOpen}
        onClose={() => setIsRestTimerOpen(false)}
        initialSeconds={restSeconds}
      />

      <AddCustomExerciseModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAdd={(newEx) => {
          StorageService.saveCustomExercise(newEx);
          handleAddExercise(newEx);
        }}
      />
    </div>
  );
};
