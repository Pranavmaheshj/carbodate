import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { backgroundWorkout } from '../../services/backgroundWorkout';

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
  const startTimeRef = React.useRef<number>(Date.now());

  // Live wall-clock workout timer with background session & lock screen controller
  useEffect(() => {
    backgroundWorkout.startWorkout({
      title: `Gym: ${split || 'Resistance Training'}`,
      type: 'gym',
      onPause: () => {
        backgroundWorkout.pauseWorkout();
      },
      onResume: () => {
        backgroundWorkout.resumeWorkout();
      },
      onStop: () => {
        backgroundWorkout.pauseWorkout();
      },
    });

    const syncTimer = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
      setElapsedSeconds(elapsed);

      const mins = elapsed / 60;
      const cals = Math.round(5.5 * (profile.currentWeightKg || 75) * (mins / 60));
      backgroundWorkout.updateMetrics({
        title: `Gym: ${split || 'Workout'}`,
        type: 'gym',
        durationSeconds: elapsed,
        caloriesBurned: cals,
        isPaused: false,
      });
    };

    const timer = setInterval(syncTimer, 1000);
    const handleVis = () => syncTimer();
    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('focus', handleVis);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('focus', handleVis);
      backgroundWorkout.stopWorkout();
    };
  }, [split, profile.currentWeightKg]);

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
      <div className="clay-card rounded-clay-card p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-wider text-lime-700 dark:text-lime-400 font-display">
                Active Workout Session
              </span>
            </div>

            <input
              type="text"
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              className="clay-sunken rounded-2xl px-4 py-2 text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-display tracking-tight w-full focus:outline-none transition border-none"
            />

            {/* Split Selector dropdown */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-display">Split:</span>
              <select
                value={split}
                onChange={(e) => {
                  setSplit(e.target.value);
                  setWorkoutTitle(`${e.target.value} Session`);
                }}
                className="clay-sunken rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none border-none cursor-pointer"
              >
                {SPLIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* HUD Live Duration & Calorie Stats */}
          <div className="flex items-center gap-4 clay-sunken p-3.5 rounded-2xl self-start sm:self-auto">
            <div className="text-center px-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-bold font-display">
                Duration
              </span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-300 dark:bg-slate-700" />
            <div className="text-center px-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-bold font-display">
                Burned
              </span>
              <span className="text-xl font-black text-coral-600 dark:text-coral-400 flex items-center justify-center gap-1 font-mono">
                <Flame className="w-4 h-4 fill-current text-coral-500" /> {estimatedCalories}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons bar */}
        <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <button
            onClick={() => setIsPickerOpen(true)}
            className="clay-btn-lime py-2.5 px-4 rounded-clay-btn text-xs font-black flex items-center gap-2 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Exercise</span>
          </button>

          <button
            onClick={handleCopyLastSession}
            className="clay-btn py-2.5 px-3.5 rounded-clay-btn text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Last</span>
          </button>

          <button
            onClick={() => setIsRestTimerOpen(true)}
            className="clay-btn py-2.5 px-3.5 rounded-clay-btn text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
          >
            <Timer className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
            <span>Rest Timer</span>
          </button>

          <div className="flex-1" />

          <button
            onClick={handleFinish}
            className="clay-btn-lime py-2.5 px-5 rounded-clay-btn text-xs font-black flex items-center gap-2 active:scale-95 transition shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Finish Workout</span>
          </button>

          <button
            onClick={onCancel}
            className="py-2.5 px-3 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Exercises List */}
      {exercises.length === 0 ? (
        <div className="clay-card rounded-clay-card p-10 text-center">
          <div className="w-16 h-16 clay-pebble rounded-full flex items-center justify-center mx-auto mb-3">
            <Dumbbell className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-display">No exercises added yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-5">
            Tap "Add Exercise" to search the 60+ movement library or "Copy Last" to preload your previous weights and sets.
          </p>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="clay-btn-lime py-3 px-6 rounded-clay-btn font-black text-xs inline-flex items-center gap-2 active:scale-95 transition"
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
              className="clay-card rounded-clay-card p-5 space-y-4"
            >
              {/* Exercise Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="clay-pebble w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm text-slate-800 dark:text-slate-100 font-mono">
                    {exIndex + 1}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-base font-display">{ex.name}</h4>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ex.muscleGroup}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveExercise(exIndex)}
                  className="clay-pebble w-8 h-8 rounded-full text-slate-400 hover:text-rose-500 flex items-center justify-center transition active:scale-90"
                  title="Remove exercise"
                  aria-label="Remove exercise"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sets Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-1 sm:gap-2 text-[10px] uppercase font-black tracking-wider text-slate-400 px-2 font-display">
                  <span className="col-span-2">Set</span>
                  <span className="col-span-4 text-center">Weight (kg)</span>
                  <span className="col-span-4 text-center">Reps</span>
                  <span className="col-span-2 text-center">Done</span>
                </div>

                {ex.sets.map((set, setIndex) => (
                  <div
                    key={set.setNumber}
                    className={`grid grid-cols-12 gap-1 sm:gap-2 items-center p-2 rounded-2xl clay-sunken transition ${
                      set.completed ? 'ring-2 ring-lime-400/50' : ''
                    }`}
                  >
                    <div className="col-span-2 flex items-center gap-1">
                      <span className="font-black text-xs text-slate-700 dark:text-slate-200 ml-1 font-mono">
                        #{set.setNumber}
                      </span>
                      {set.isPR && (
                        <span className="clay-card-butter text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Trophy className="w-2.5 h-2.5 text-amber-700" /> PR
                        </span>
                      )}
                    </div>

                    {/* Weight stepper */}
                    <div className="col-span-4 flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleAdjustWeight(exIndex, setIndex, -2.5)}
                        className="clay-btn w-6 sm:w-7 h-6 sm:h-7 rounded-lg text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-xs active:scale-90"
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
                        className="clay-input w-12 sm:w-16 rounded-lg py-1 text-center font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-black border-none"
                      />
                      <button
                        onClick={() => handleAdjustWeight(exIndex, setIndex, 2.5)}
                        className="clay-btn w-6 sm:w-7 h-6 sm:h-7 rounded-lg text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-xs active:scale-90"
                      >
                        +
                      </button>
                    </div>

                    {/* Reps stepper */}
                    <div className="col-span-4 flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleAdjustReps(exIndex, setIndex, -1)}
                        className="clay-btn w-6 sm:w-7 h-6 sm:h-7 rounded-lg text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-xs active:scale-90"
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
                        className="clay-input w-10 sm:w-14 rounded-lg py-1 text-center font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-black border-none"
                      />
                      <button
                        onClick={() => handleAdjustReps(exIndex, setIndex, 1)}
                        className="clay-btn w-6 sm:w-7 h-6 sm:h-7 rounded-lg text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-xs active:scale-90"
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
                            ? 'clay-btn-lime'
                            : 'clay-btn text-slate-400 dark:text-slate-500'
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
              <div className="mt-3 flex justify-between items-center pt-2">
                <button
                  onClick={() => handleAddSet(exIndex)}
                  className="clay-btn py-1.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
                  <span>Add Set</span>
                </button>
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  Volume: {ex.sets.reduce((s, x) => s + (x.completed ? x.reps * x.weightKg : 0), 0)} kg
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EXERCISE PICKER MODAL (Portaled to document.body to ensure complete elevation above all navigation bars) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isPickerOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md pb-safe">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-xl clay-card rounded-clay-card p-4 sm:p-6 shadow-2xl relative text-left h-[86dvh] max-h-[86dvh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 font-display">
                      <div className="w-8 h-8 clay-pebble rounded-full flex items-center justify-center text-lime-600 dark:text-lime-400">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <span>Exercise Library</span>
                    </h3>
                    <button
                      onClick={() => setIsPickerOpen(false)}
                      className="clay-pebble w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="py-2.5 sm:py-3 flex-shrink-0">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search barbell, squat, row, curls..."
                        className="clay-input w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none border-none"
                      />
                    </div>
                  </div>

                  {/* Muscle Group Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 sm:pb-3 scrollbar-none mb-1 flex-shrink-0">
                    {['All', ...MUSCLE_GROUPS].map((mg) => (
                      <button
                        key={mg}
                        onClick={() => setSelectedMuscleFilter(mg)}
                        className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition ${
                          selectedMuscleFilter === mg
                            ? 'clay-btn-lime'
                            : 'clay-btn text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {mg}
                      </button>
                    ))}
                  </div>

                  {/* Exercise Items List */}
                  <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
                    {filteredLibrary.map((def) => (
                      <div
                        key={def.id}
                        onClick={() => handleAddExercise(def)}
                        className="clay-card-flat p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between group hover:scale-[1.01]"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 dark:text-slate-100 text-sm group-hover:text-lime-600 dark:group-hover:text-lime-400 transition font-display">
                              {def.name}
                            </span>
                            {def.isCustom && (
                              <span className="text-[9px] clay-card-sky px-2 py-0.5 rounded-full font-black">
                                Custom
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-400 capitalize">
                            {def.muscleGroup} • {def.equipment}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="clay-pebble w-8 h-8 rounded-xl group-hover:clay-btn-lime flex items-center justify-center transition"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Custom Exercise trigger */}
                  <div className="pt-3 pb-3 sm:pb-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2 flex-shrink-0 bg-inherit">
                    <span className="text-xs font-bold text-slate-400 truncate">
                      Can't find your exercise?
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomModalOpen(true)}
                      className="clay-btn-sky px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 active:scale-95 transition flex-shrink-0 shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Create Custom</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

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
