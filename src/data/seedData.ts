import {
  UserProfile,
  ActivityRecord,
  GymWorkoutSession,
  WorkoutPlan,
  MealItem,
  WeightRecord,
  WaterLog,
  MilestoneBadge
} from '../types';
import { INITIAL_BADGES } from './badges';

export const SEED_PROFILE: UserProfile = {
  id: 'usr_demo_carbodate',
  email: 'alex.morgan@carbodate.io',
  name: 'Alex Morgan',
  age: 27,
  gender: 'male',
  heightCm: 178,
  currentWeightKg: 78.4,
  targetWeightKg: 73.0,
  activityLevel: 'moderate',
  goal: 'lose',
  targetPaceKgPerWeek: 0.5,
  unitSystem: 'metric',
  dailyWaterGoalMl: 2750,
  isDemoUser: true,
  createdAt: '2026-10-01T08:00:00Z',
};

// Route points for a scenic 5.2km outdoor run (Central Park reservoir / loop style)
export const SEED_RUN_ROUTE = [
  { lat: 40.7829, lng: -73.9654, timestamp: 1761033600000, altitude: 28, speed: 3.1 },
  { lat: 40.7836, lng: -73.9642, timestamp: 1761033720000, altitude: 29, speed: 3.2 },
  { lat: 40.7850, lng: -73.9625, timestamp: 1761033900000, altitude: 31, speed: 3.3 },
  { lat: 40.7868, lng: -73.9610, timestamp: 1761034100000, altitude: 34, speed: 3.1 },
  { lat: 40.7885, lng: -73.9605, timestamp: 1761034300000, altitude: 36, speed: 3.2 },
  { lat: 40.7902, lng: -73.9612, timestamp: 1761034520000, altitude: 38, speed: 3.0 },
  { lat: 40.7915, lng: -73.9630, timestamp: 1761034750000, altitude: 37, speed: 3.2 },
  { lat: 40.7920, lng: -73.9655, timestamp: 1761034980000, altitude: 35, speed: 3.4 },
  { lat: 40.7912, lng: -73.9680, timestamp: 1761035200000, altitude: 32, speed: 3.2 },
  { lat: 40.7895, lng: -73.9698, timestamp: 1761035420000, altitude: 30, speed: 3.3 },
  { lat: 40.7872, lng: -73.9705, timestamp: 1761035650000, altitude: 29, speed: 3.1 },
  { lat: 40.7848, lng: -73.9692, timestamp: 1761035880000, altitude: 28, speed: 3.2 },
  { lat: 40.7832, lng: -73.9670, timestamp: 1761036100000, altitude: 28, speed: 3.0 },
  { lat: 40.7829, lng: -73.9654, timestamp: 1761036300000, altitude: 28, speed: 3.1 },
];

export const SEED_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'act_demo_run_1',
    userId: 'usr_demo_carbodate',
    type: 'running',
    environment: 'outdoor',
    title: 'Morning Park Tempo Run',
    startTime: '2026-10-21T07:15:00Z',
    endTime: '2026-10-21T07:44:00Z',
    durationSeconds: 1740, // 29 mins
    distanceMeters: 5240, // 5.24 km
    caloriesBurned: 420,
    elevationGainMeters: 48,
    avgSpeedKmh: 10.84,
    avgPaceMinPerKm: '5:32 /km',
    splits: [
      { km: 1, durationSeconds: 342, paceMinPerKm: '5:42 /km', elevationGainMeters: 12 },
      { km: 2, durationSeconds: 334, paceMinPerKm: '5:34 /km', elevationGainMeters: 15 },
      { km: 3, durationSeconds: 326, paceMinPerKm: '5:26 /km', elevationGainMeters: 8 },
      { km: 4, durationSeconds: 330, paceMinPerKm: '5:30 /km', elevationGainMeters: 9 },
      { km: 5, durationSeconds: 322, paceMinPerKm: '5:22 /km', elevationGainMeters: 4 },
    ],
    routePoints: SEED_RUN_ROUTE,
    notes: 'Felt very smooth and energetic. Kept heart rate in zone 3.',
  },
  {
    id: 'act_demo_cycle_1',
    userId: 'usr_demo_carbodate',
    type: 'cycling',
    environment: 'outdoor',
    title: 'River Greenway Ride',
    startTime: '2026-10-19T16:30:00Z',
    endTime: '2026-10-19T17:15:00Z',
    durationSeconds: 2700,
    distanceMeters: 15200,
    caloriesBurned: 395,
    elevationGainMeters: 62,
    avgSpeedKmh: 20.26,
    avgPaceMinPerKm: '2:57 /km',
    splits: [
      { km: 1, durationSeconds: 180, paceMinPerKm: '3:00 /km', elevationGainMeters: 5 },
      { km: 2, durationSeconds: 175, paceMinPerKm: '2:55 /km', elevationGainMeters: 6 },
    ],
    routePoints: SEED_RUN_ROUTE.slice(0, 10),
    notes: 'Wind was breezy on return.',
  },
  {
    id: 'act_demo_treadmill_1',
    userId: 'usr_demo_carbodate',
    type: 'running',
    environment: 'indoor',
    title: 'Incline Treadmill Intervals',
    startTime: '2026-10-17T18:00:00Z',
    endTime: '2026-10-17T18:35:00Z',
    durationSeconds: 2100,
    distanceMeters: 4500,
    caloriesBurned: 380,
    elevationGainMeters: 90,
    avgSpeedKmh: 7.71,
    avgPaceMinPerKm: '7:46 /km',
    splits: [],
    routePoints: [],
    indoorDetails: {
      treadmillIncline: 3.5,
      speedKmh: 9.0,
      machineType: 'Commercial Treadmill',
    },
    notes: 'Steady fat burning session with 3.5% incline.',
  },
  {
    id: 'act_demo_swim_1',
    userId: 'usr_demo_carbodate',
    type: 'swimming',
    environment: 'indoor',
    title: 'Pool Laps - Freestyle & Breaststroke',
    startTime: '2026-10-15T09:00:00Z',
    endTime: '2026-10-15T09:40:00Z',
    durationSeconds: 2400,
    distanceMeters: 1250,
    caloriesBurned: 320,
    elevationGainMeters: 0,
    avgSpeedKmh: 1.87,
    avgPaceMinPerKm: '32:00 /km',
    splits: [],
    routePoints: [],
    swimmingDetails: {
      stroke: 'freestyle',
      laps: 50,
      poolLengthMeters: 25,
      waterType: 'pool',
    },
    notes: '50 laps in 25m pool.',
  },
];

export const SEED_GYM_SESSIONS: GymWorkoutSession[] = [
  {
    id: 'gym_demo_1',
    userId: 'usr_demo_carbodate',
    title: 'Push Power Hypertrophy',
    split: 'Push (Chest/Shoulder/Triceps)',
    startTime: '2026-10-20T17:15:00Z',
    endTime: '2026-10-20T18:10:00Z',
    durationMinutes: 55,
    caloriesBurned: 345,
    notes: 'Hit a PR on bench press 90kg x 6! Solid pump.',
    exercises: [
      {
        id: 'log_ex_1',
        exerciseId: 'ex_c1',
        name: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { setNumber: 1, reps: 10, weightKg: 70, completed: true },
          { setNumber: 2, reps: 8, weightKg: 80, completed: true },
          { setNumber: 3, reps: 6, weightKg: 90, isPR: true, completed: true },
          { setNumber: 4, reps: 8, weightKg: 80, completed: true },
        ],
      },
      {
        id: 'log_ex_2',
        exerciseId: 'ex_s1',
        name: 'Overhead Barbell Press',
        muscleGroup: 'Shoulder',
        sets: [
          { setNumber: 1, reps: 10, weightKg: 45, completed: true },
          { setNumber: 2, reps: 8, weightKg: 50, completed: true },
          { setNumber: 3, reps: 8, weightKg: 50, completed: true },
        ],
      },
      {
        id: 'log_ex_3',
        exerciseId: 'ex_c3',
        name: 'Cable Chest Fly',
        muscleGroup: 'Chest',
        sets: [
          { setNumber: 1, reps: 12, weightKg: 15, completed: true },
          { setNumber: 2, reps: 12, weightKg: 17.5, completed: true },
          { setNumber: 3, reps: 10, weightKg: 17.5, completed: true },
        ],
      },
      {
        id: 'log_ex_4',
        exerciseId: 'ex_a3',
        name: 'Tricep Rope Pushdown',
        muscleGroup: 'Arms',
        sets: [
          { setNumber: 1, reps: 15, weightKg: 22.5, completed: true },
          { setNumber: 2, reps: 12, weightKg: 25, completed: true },
          { setNumber: 3, reps: 12, weightKg: 25, completed: true },
        ],
      },
    ],
  },
  {
    id: 'gym_demo_2',
    userId: 'usr_demo_carbodate',
    title: 'Pull & Lats Density',
    split: 'Pull (Back/Biceps)',
    startTime: '2026-10-18T18:00:00Z',
    endTime: '2026-10-18T18:50:00Z',
    durationMinutes: 50,
    caloriesBurned: 310,
    notes: 'Good lat mind-muscle connection.',
    exercises: [
      {
        id: 'log_ex_5',
        exerciseId: 'ex_b1',
        name: 'Barbell Deadlift',
        muscleGroup: 'Back',
        sets: [
          { setNumber: 1, reps: 8, weightKg: 100, completed: true },
          { setNumber: 2, reps: 6, weightKg: 120, completed: true },
          { setNumber: 3, reps: 5, weightKg: 130, isPR: true, completed: true },
        ],
      },
      {
        id: 'log_ex_6',
        exerciseId: 'ex_b3',
        name: 'Lat Pulldown',
        muscleGroup: 'Back',
        sets: [
          { setNumber: 1, reps: 10, weightKg: 60, completed: true },
          { setNumber: 2, reps: 10, weightKg: 65, completed: true },
          { setNumber: 3, reps: 8, weightKg: 70, completed: true },
        ],
      },
      {
        id: 'log_ex_7',
        exerciseId: 'ex_a1',
        name: 'Barbell Bicep Curl',
        muscleGroup: 'Arms',
        sets: [
          { setNumber: 1, reps: 12, weightKg: 30, completed: true },
          { setNumber: 2, reps: 10, weightKg: 35, completed: true },
          { setNumber: 3, reps: 8, weightKg: 35, completed: true },
        ],
      },
    ],
  },
];

export const SEED_WORKOUT_PLAN: WorkoutPlan = {
  id: 'plan_demo_ppl',
  userId: 'usr_demo_carbodate',
  name: '4-Day Athletic Hypertrophy & Fat Loss',
  description: 'Balanced strength and calorie-burning split for lean muscle preservation in deficit.',
  createdAt: '2026-10-05T00:00:00Z',
  days: [
    {
      dayOfWeek: 1, // Monday
      dayName: 'Monday',
      split: 'Push Power (Chest & Shoulders)',
      isRestDay: false,
      exercises: [
        { name: 'Barbell Bench Press', muscleGroup: 'Chest', targetSets: 4, targetReps: 8 },
        { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', targetSets: 3, targetReps: 10 },
        { name: 'Overhead Barbell Press', muscleGroup: 'Shoulder', targetSets: 3, targetReps: 8 },
        { name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulder', targetSets: 4, targetReps: 12 },
        { name: 'Tricep Rope Pushdown', muscleGroup: 'Arms', targetSets: 3, targetReps: 12 },
      ],
    },
    {
      dayOfWeek: 2, // Tuesday
      dayName: 'Tuesday',
      split: 'Pull Strength (Back & Biceps)',
      isRestDay: false,
      exercises: [
        { name: 'Barbell Deadlift', muscleGroup: 'Back', targetSets: 3, targetReps: 6 },
        { name: 'Lat Pulldown', muscleGroup: 'Back', targetSets: 4, targetReps: 10 },
        { name: 'Seated Cable Row', muscleGroup: 'Back', targetSets: 3, targetReps: 10 },
        { name: 'Face Pulls', muscleGroup: 'Shoulder', targetSets: 3, targetReps: 15 },
        { name: 'Barbell Bicep Curl', muscleGroup: 'Arms', targetSets: 3, targetReps: 10 },
      ],
    },
    {
      dayOfWeek: 3, // Wednesday
      dayName: 'Wednesday',
      split: 'Active Recovery & Cardio',
      isRestDay: true,
      exercises: [],
    },
    {
      dayOfWeek: 4, // Thursday
      dayName: 'Thursday',
      split: 'Legs & Core Foundation',
      isRestDay: false,
      exercises: [
        { name: 'Barbell Back Squat', muscleGroup: 'Legs', targetSets: 4, targetReps: 8 },
        { name: 'Romanian Deadlift (RDL)', muscleGroup: 'Legs', targetSets: 3, targetReps: 10 },
        { name: 'Leg Press', muscleGroup: 'Legs', targetSets: 3, targetReps: 12 },
        { name: 'Standing Calf Raise', muscleGroup: 'Legs', targetSets: 4, targetReps: 15 },
        { name: 'Hanging Leg Raise', muscleGroup: 'Core', targetSets: 3, targetReps: 15 },
      ],
    },
    {
      dayOfWeek: 5, // Friday
      dayName: 'Friday',
      split: 'Upper Pump & Arms',
      isRestDay: false,
      exercises: [
        { name: 'Cable Chest Fly', muscleGroup: 'Chest', targetSets: 3, targetReps: 12 },
        { name: 'Single-Arm Dumbbell Row', muscleGroup: 'Back', targetSets: 3, targetReps: 10 },
        { name: 'Dips (Chest Focus)', muscleGroup: 'Chest', targetSets: 3, targetReps: 10 },
        { name: 'Hammer Curls', muscleGroup: 'Arms', targetSets: 3, targetReps: 12 },
        { name: 'Skull Crushers', muscleGroup: 'Arms', targetSets: 3, targetReps: 12 },
      ],
    },
    {
      dayOfWeek: 6, // Saturday
      dayName: 'Saturday',
      split: 'Outdoor Zone 2 Run / Hike',
      isRestDay: true,
      exercises: [],
    },
    {
      dayOfWeek: 0, // Sunday
      dayName: 'Sunday',
      split: 'Full Rest & Meal Prep',
      isRestDay: true,
      exercises: [],
    },
  ],
};

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

export const SEED_MEALS: MealItem[] = [
  {
    id: 'meal_1',
    userId: 'usr_demo_carbodate',
    date: getTodayDateStr(),
    mealType: 'breakfast',
    name: 'Protein Berry Oatmeal Bowl',
    portion: '1 bowl (300g)',
    calories: 385,
    protein: 28,
    carbs: 52,
    fat: 6,
    isFavorite: true,
    aiEstimated: false,
    createdAt: '2026-10-22T08:15:00Z',
  },
  {
    id: 'meal_2',
    userId: 'usr_demo_carbodate',
    date: getTodayDateStr(),
    mealType: 'lunch',
    name: 'Grilled Salmon with Quinoa & Steamed Greens',
    portion: '1 plate (350g)',
    calories: 540,
    protein: 42,
    carbs: 38,
    fat: 22,
    isFavorite: true,
    aiEstimated: true,
    detectedIngredients: ['Atlantic Salmon 180g', 'Cooked Quinoa 120g', 'Broccoli & Asparagus 100g'],
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-22T13:00:00Z',
  },
  {
    id: 'meal_3',
    userId: 'usr_demo_carbodate',
    date: getTodayDateStr(),
    mealType: 'snack',
    name: 'Greek Yogurt 0% with Honey & Almonds',
    portion: '200g yogurt + 15g almonds',
    calories: 220,
    protein: 22,
    carbs: 18,
    fat: 6,
    isFavorite: false,
    aiEstimated: false,
    createdAt: '2026-10-22T16:30:00Z',
  },
];

export const SEED_WEIGHTS: WeightRecord[] = [
  { id: 'w_1', userId: 'usr_demo_carbodate', date: '2026-10-01', weightKg: 80.2, note: 'Starting baseline' },
  { id: 'w_2', userId: 'usr_demo_carbodate', date: '2026-10-05', weightKg: 79.8, note: 'Water weight drop' },
  { id: 'w_3', userId: 'usr_demo_carbodate', date: '2026-10-09', weightKg: 79.4, note: 'Steady progress' },
  { id: 'w_4', userId: 'usr_demo_carbodate', date: '2026-10-13', weightKg: 79.0, note: 'Post gym workout' },
  { id: 'w_5', userId: 'usr_demo_carbodate', date: '2026-10-17', weightKg: 78.7, note: 'Energy high' },
  { id: 'w_6', userId: 'usr_demo_carbodate', date: '2026-10-20', weightKg: 78.5, note: 'Waist down 2cm' },
  { id: 'w_7', userId: 'usr_demo_carbodate', date: '2026-10-22', weightKg: 78.4, note: 'Today morning weigh-in' },
];

export const SEED_WATER_LOG: WaterLog = {
  id: 'water_today',
  userId: 'usr_demo_carbodate',
  date: getTodayDateStr(),
  amountMl: 1750, // 1750 ml logged out of 2750 ml
};

