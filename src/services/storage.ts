import {
  UserProfile,
  ActivityRecord,
  GymWorkoutSession,
  WorkoutPlan,
  MealItem,
  WeightRecord,
  WaterLog,
  MilestoneBadge,
  ExerciseDefinition
} from '../types';
import { INITIAL_BADGES } from '../data/badges';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { formatLocalDate } from './calculations';

const STORAGE_KEYS = {
  PROFILE: 'carbodate_profile_v2',
  ACTIVITIES: 'carbodate_activities_v2',
  GYM_SESSIONS: 'carbodate_gym_sessions_v2',
  WORKOUT_PLAN: 'carbodate_workout_plan_v2',
  MEALS: 'carbodate_meals_v2',
  WEIGHTS: 'carbodate_weights_v2',
  WATER: 'carbodate_water_v2',
  WATER_HISTORY: 'carbodate_water_history_v2',
  BADGES: 'carbodate_badges_v2',
  CUSTOM_EXERCISES: 'carbodate_custom_exercises_v2',
  IS_INITIALIZED: 'carbodate_is_initialized_v2',
};

// Safe JSON get
function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Error reading key ${key} from storage:`, err);
    return fallback;
  }
}

// Safe JSON set
function setJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key} to storage:`, err);
  }
}

export const StorageService = {
  // Ensure initialized without mock data
  ensureInitialized(): void {
    const initialized = localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED);
    if (!initialized) {
      this.clearAllData();
      localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, 'true');
    }
  },

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    // Clear old v1 keys if any
    [
      'carbodate_profile_v1',
      'carbodate_activities_v1',
      'carbodate_gym_sessions_v1',
      'carbodate_workout_plan_v1',
      'carbodate_meals_v1',
      'carbodate_weights_v1',
      'carbodate_water_v1',
      'carbodate_badges_v1',
      'carbodate_custom_exercises_v1',
      'carbodate_is_initialized_v1',
    ].forEach((k) => localStorage.removeItem(k));

    // Initialize fresh empty lists
    setJSON(STORAGE_KEYS.ACTIVITIES, []);
    setJSON(STORAGE_KEYS.GYM_SESSIONS, []);
    setJSON(STORAGE_KEYS.MEALS, []);
    setJSON(STORAGE_KEYS.WEIGHTS, []);
    setJSON(STORAGE_KEYS.BADGES, INITIAL_BADGES);
    setJSON(STORAGE_KEYS.CUSTOM_EXERCISES, []);
  },

  // PROFILE
  getProfile(): UserProfile | null {
    return getJSON<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  },

  saveProfile(profile: UserProfile): void {
    setJSON(STORAGE_KEYS.PROFILE, profile);
  },

  // ACTIVITIES
  getActivities(): ActivityRecord[] {
    return getJSON<ActivityRecord[]>(STORAGE_KEYS.ACTIVITIES, []);
  },

  setActivities(activities: ActivityRecord[]): void {
    setJSON(STORAGE_KEYS.ACTIVITIES, activities);
  },

  saveActivity(activity: ActivityRecord): void {
    const list = this.getActivities();
    const updated = [activity, ...list];
    setJSON(STORAGE_KEYS.ACTIVITIES, updated);
    this.checkAndUpdateBadges(activity);
  },

  deleteActivity(id: string): void {
    const list = this.getActivities().filter((a) => a.id !== id);
    setJSON(STORAGE_KEYS.ACTIVITIES, list);
  },

  // GYM WORKOUT SESSIONS
  getGymSessions(): GymWorkoutSession[] {
    return getJSON<GymWorkoutSession[]>(STORAGE_KEYS.GYM_SESSIONS, []);
  },

  setGymSessions(sessions: GymWorkoutSession[]): void {
    setJSON(STORAGE_KEYS.GYM_SESSIONS, sessions);
  },

  saveGymSession(session: GymWorkoutSession): void {
    const list = this.getGymSessions();
    const updated = [session, ...list];
    setJSON(STORAGE_KEYS.GYM_SESSIONS, updated);
  },

  // EXERCISES (builtin + custom)
  getAllExercises(): ExerciseDefinition[] {
    const custom = getJSON<ExerciseDefinition[]>(STORAGE_KEYS.CUSTOM_EXERCISES, []);
    return [...EXERCISE_LIBRARY, ...custom];
  },

  saveCustomExercise(exercise: ExerciseDefinition): void {
    const custom = getJSON<ExerciseDefinition[]>(STORAGE_KEYS.CUSTOM_EXERCISES, []);
    setJSON(STORAGE_KEYS.CUSTOM_EXERCISES, [...custom, exercise]);
  },

  // WORKOUT PLAN
  getWorkoutPlan(): WorkoutPlan | null {
    const stored = getJSON<WorkoutPlan | null>(STORAGE_KEYS.WORKOUT_PLAN, null);
    if (stored) return stored;

    // Generate sensible default 7-day routine so TodayWorkoutWidget and rest days work out of the box
    const profile = this.getProfile();
    const restDays = Array.isArray(profile?.restDays) ? profile.restDays : [0, 4]; // Sunday & Thursday default

    const dayTemplates = [
      { dayOfWeek: 1, dayName: 'Monday', split: 'Push (Chest & Triceps)', ex: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Tricep Pushdown'] },
      { dayOfWeek: 2, dayName: 'Tuesday', split: 'Pull (Back & Biceps)', ex: ['Lat Pulldown', 'Barbell Bent-Over Row', 'Barbell Bicep Curl'] },
      { dayOfWeek: 3, dayName: 'Wednesday', split: 'Legs & Core', ex: ['Barbell Back Squat', 'Romanian Deadlift (RDL)'] },
      { dayOfWeek: 4, dayName: 'Thursday', split: 'Rest & Recovery', ex: [] },
      { dayOfWeek: 5, dayName: 'Friday', split: 'Shoulders & Arms', ex: ['Overhead Barbell Press', 'Dumbbell Lateral Raise'] },
      { dayOfWeek: 6, dayName: 'Saturday', split: 'Full Body Conditioning', ex: ['Kettlebell Swings', 'Push-ups'] },
      { dayOfWeek: 0, dayName: 'Sunday', split: 'Rest & Recovery', ex: [] },
    ];

    const defaultPlan: WorkoutPlan = {
      id: 'plan_default',
      userId: profile?.id || 'usr_carbodate',
      name: 'Dynamic Weekly Routine',
      description: 'Dynamic weekly resistance & recovery routine',
      createdAt: new Date().toISOString(),
      days: dayTemplates.map((t) => {
        const isRest = restDays.includes(t.dayOfWeek);
        return {
          dayOfWeek: t.dayOfWeek,
          dayName: t.dayName,
          split: isRest ? 'Rest & Recovery' : t.split,
          isRestDay: isRest,
          exercises: isRest ? [] : t.ex.map((name) => ({ name, muscleGroup: 'Full Body' as any, targetSets: 3, targetReps: 10 })),
        };
      }),
    };

    setJSON(STORAGE_KEYS.WORKOUT_PLAN, defaultPlan);
    return defaultPlan;
  },

  saveWorkoutPlan(plan: WorkoutPlan): void {
    setJSON(STORAGE_KEYS.WORKOUT_PLAN, plan);
  },

  // MEALS
  getMeals(dateStr?: string): MealItem[] {
    const all = getJSON<MealItem[]>(STORAGE_KEYS.MEALS, []);
    if (!dateStr) return all;
    return all.filter((m) => m.date === dateStr);
  },

  setMeals(meals: MealItem[]): void {
    setJSON(STORAGE_KEYS.MEALS, meals);
  },

  saveMeal(meal: MealItem): void {
    const all = getJSON<MealItem[]>(STORAGE_KEYS.MEALS, []);
    const updated = [meal, ...all];
    setJSON(STORAGE_KEYS.MEALS, updated);
  },

  deleteMeal(id: string): void {
    const all = getJSON<MealItem[]>(STORAGE_KEYS.MEALS, []).filter((m) => m.id !== id);
    setJSON(STORAGE_KEYS.MEALS, all);
  },

  toggleMealFavorite(id: string): void {
    const all = getJSON<MealItem[]>(STORAGE_KEYS.MEALS, []);
    const updated = all.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
    setJSON(STORAGE_KEYS.MEALS, updated);
  },

  // WATER & HYDRATION (Date-keyed dictionary ensures each day starts at 0ml cleanly)
  getWaterLog(dateStr?: string): number {
    const targetDate = formatLocalDate(dateStr);
    const history = getJSON<Record<string, number>>(STORAGE_KEYS.WATER_HISTORY, {});
    if (typeof history[targetDate] === 'number') {
      return history[targetDate];
    }

    // Migration fallback from single-record legacy WATER key
    const legacy = getJSON<WaterLog | null>(STORAGE_KEYS.WATER, null);
    if (legacy && legacy.date === targetDate && typeof legacy.amountMl === 'number') {
      return legacy.amountMl;
    }
    return 0;
  },

  getAllWaterLogs(): Record<string, number> {
    const history = getJSON<Record<string, number>>(STORAGE_KEYS.WATER_HISTORY, {});
    const legacy = getJSON<WaterLog | null>(STORAGE_KEYS.WATER, null);
    if (legacy && legacy.date && typeof history[legacy.date] !== 'number') {
      history[legacy.date] = legacy.amountMl || 0;
    }
    return history;
  },

  setWater(amountMl: number, dateStr?: string): void {
    const targetDate = formatLocalDate(dateStr);
    const history = getJSON<Record<string, number>>(STORAGE_KEYS.WATER_HISTORY, {});
    history[targetDate] = Math.max(0, amountMl);
    setJSON(STORAGE_KEYS.WATER_HISTORY, history);

    // Keep legacy key updated for current active day
    setJSON<WaterLog>(STORAGE_KEYS.WATER, {
      id: `water_${targetDate}`,
      userId: 'usr_carbodate',
      date: targetDate,
      amountMl: Math.max(0, amountMl),
    });
  },

  addWater(amountMl: number, dateStr?: string): number {
    const targetDate = formatLocalDate(dateStr);
    const current = this.getWaterLog(targetDate);
    const updatedAmount = Math.max(0, current + amountMl);
    this.setWater(updatedAmount, targetDate);
    return updatedAmount;
  },

  // WEIGHTS
  getWeightRecords(): WeightRecord[] {
    return getJSON<WeightRecord[]>(STORAGE_KEYS.WEIGHTS, []);
  },

  setWeights(weights: WeightRecord[]): void {
    setJSON(STORAGE_KEYS.WEIGHTS, weights);
  },

  saveWeightRecord(record: WeightRecord): void {
    const all = this.getWeightRecords();
    const existingIdx = all.findIndex((w) => w.date === record.date);
    let updated: WeightRecord[];
    if (existingIdx >= 0) {
      updated = [...all];
      updated[existingIdx] = record;
    } else {
      updated = [...all, record].sort((a, b) => a.date.localeCompare(b.date));
    }
    setJSON(STORAGE_KEYS.WEIGHTS, updated);

    // Also update current weight on profile
    const profile = this.getProfile();
    if (profile) {
      this.saveProfile({ ...profile, currentWeightKg: record.weightKg });
    }
  },

  // BADGES
  getBadges(): MilestoneBadge[] {
    return getJSON<MilestoneBadge[]>(STORAGE_KEYS.BADGES, INITIAL_BADGES);
  },

  setBadges(badges: MilestoneBadge[]): void {
    setJSON(STORAGE_KEYS.BADGES, badges);
  },

  // FULL STATE PAYLOAD HYDRATION
  getFullPayload(dateStr?: string) {
    const todayStr = formatLocalDate(dateStr);
    return {
      profile: this.getProfile(),
      activities: this.getActivities(),
      gymSessions: this.getGymSessions(),
      workoutPlan: this.getWorkoutPlan(),
      meals: this.getMeals(),
      weights: this.getWeightRecords(),
      waterMl: this.getWaterLog(todayStr),
      waterDate: todayStr,
      waterHistory: this.getAllWaterLogs(),
      badges: this.getBadges(),
      lastSyncedAt: new Date().toISOString(),
    };
  },

  hydrateFromPayload(payload: any): void {
    if (payload.profile) this.saveProfile(payload.profile);
    if (payload.activities) this.setActivities(payload.activities);
    if (payload.gymSessions) this.setGymSessions(payload.gymSessions);
    if (payload.workoutPlan) this.saveWorkoutPlan(payload.workoutPlan);
    if (payload.meals) this.setMeals(payload.meals);
    if (payload.weights) this.setWeights(payload.weights);
    if (payload.badges) this.setBadges(payload.badges);

    // Hydrate water logs safely without overwriting today with yesterday's value
    const currentToday = formatLocalDate();
    if (payload.waterHistory && typeof payload.waterHistory === 'object') {
      const history = getJSON<Record<string, number>>(STORAGE_KEYS.WATER_HISTORY, {});
      const merged = { ...history, ...payload.waterHistory };
      setJSON(STORAGE_KEYS.WATER_HISTORY, merged);
      // Update legacy key for current day
      if (typeof merged[currentToday] === 'number') {
        this.setWater(merged[currentToday], currentToday);
      } else {
        this.setWater(0, currentToday);
      }
    } else if (typeof payload.waterMl === 'number') {
      // ONLY set today if cloud payload explicitly matches today's date!
      if (payload.waterDate && payload.waterDate === currentToday) {
        this.setWater(payload.waterMl, currentToday);
      } else {
        this.setWater(0, currentToday);
      }
    } else {
      const legacy = getJSON<WaterLog | null>(STORAGE_KEYS.WATER, null);
      if (legacy && legacy.date !== currentToday) {
        this.setWater(0, currentToday);
      }
    }
  },

  checkAndUpdateBadges(lastActivity?: ActivityRecord): void {
    const badges = this.getBadges();
    const activities = this.getActivities();
    let hasChanges = false;

    const updated = badges.map((b) => {
      if (b.isUnlocked) return b;

      if (b.id === 'badge_first_run' && activities.length > 0) {
        hasChanges = true;
        return { ...b, progress: 1, isUnlocked: true, unlockedAt: new Date().toISOString() };
      }
      if (b.id === 'badge_5k_club' && lastActivity && lastActivity.distanceMeters >= 5000) {
        hasChanges = true;
        return { ...b, progress: 5, isUnlocked: true, unlockedAt: new Date().toISOString() };
      }
      return b;
    });

    if (hasChanges) {
      setJSON(STORAGE_KEYS.BADGES, updated);
    }
  },

  // EXPORT / IMPORT JSON
  exportAllDataJson(): string {
    const data = {
      profile: this.getProfile(),
      activities: this.getActivities(),
      gymSessions: this.getGymSessions(),
      workoutPlan: this.getWorkoutPlan(),
      meals: this.getMeals(),
      weights: this.getWeightRecords(),
      badges: this.getBadges(),
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
    };
    return JSON.stringify(data, null, 2);
  },

  importDataJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) setJSON(STORAGE_KEYS.PROFILE, data.profile);
      if (data.activities) setJSON(STORAGE_KEYS.ACTIVITIES, data.activities);
      if (data.gymSessions) setJSON(STORAGE_KEYS.GYM_SESSIONS, data.gymSessions);
      if (data.workoutPlan) setJSON(STORAGE_KEYS.WORKOUT_PLAN, data.workoutPlan);
      if (data.meals) setJSON(STORAGE_KEYS.MEALS, data.meals);
      if (data.weights) setJSON(STORAGE_KEYS.WEIGHTS, data.weights);
      if (data.badges) setJSON(STORAGE_KEYS.BADGES, data.badges);
      return true;
    } catch (e) {
      console.error('Failed to import Carbodate backup:', e);
      return false;
    }
  },
};
