export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
export type FitnessGoal = 'lose' | 'maintain' | 'gain';
export type UnitSystem = 'metric' | 'imperial';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: Gender;
  heightCm: number; // Stored in cm
  currentWeightKg: number; // Stored in kg
  targetWeightKg: number; // Stored in kg
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  targetPaceKgPerWeek: number; // e.g., 0.5 kg/week, max 1.0 kg/week
  unitSystem: UnitSystem;
  dailyWaterGoalMl: number;
  cuisinePreference?: string;
  isDemoUser?: boolean;
  createdAt: string;
}

export interface BodyCalculations {
  bmi: number;
  bmiCategory: 'Underweight' | 'Healthy' | 'Overweight' | 'Obesity';
  bmr: number;
  tdee: number;
  idealWeightRangeKg: { min: number; max: number };
  weightDifferenceKg: number; // Positive = gain needed, negative = lose needed, 0 = in range
  dailyCalorieTarget: number;
  dailyDeficitOrSurplus: number; // Negative = deficit, positive = surplus
  safetyFloor: number;
  isSafetyWarning: boolean;
  safetyWarningMessage?: string;
  estimatedGoalDate: string; // ISO date string or formatted date
  estimatedWeeks: number;
}

export type ActivityType = 'running' | 'jogging' | 'walking' | 'cycling' | 'swimming';
export type ActivityEnvironment = 'outdoor' | 'indoor';

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
  altitude?: number;
  speed?: number; // m/s
  accuracy?: number;
}

export interface SplitRecord {
  km: number;
  durationSeconds: number;
  paceMinPerKm: string;
  elevationGainMeters: number;
  avgHeartRate?: number;
}

export interface ActivityRecord {
  id: string;
  userId: string;
  type: ActivityType;
  environment: ActivityEnvironment;
  title: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  distanceMeters: number;
  caloriesBurned: number;
  elevationGainMeters: number;
  avgSpeedKmh: number;
  avgPaceMinPerKm: string;
  splits: SplitRecord[];
  routePoints: RoutePoint[];
  steps?: number;
  indoorDetails?: {
    treadmillIncline?: number;
    speedKmh?: number;
    resistanceLevel?: number;
    machineType?: string;
    steps?: number;
    cadenceSpm?: number;
    strideLengthMeters?: number;
  };
  swimmingDetails?: {
    stroke: 'freestyle' | 'breaststroke' | 'backstroke' | 'butterfly' | 'mixed';
    laps?: number;
    poolLengthMeters?: number;
    waterType: 'pool' | 'open_water';
  };
  notes?: string;
}

export type MuscleGroup = 'Chest' | 'Back' | 'Shoulder' | 'Legs' | 'Arms' | 'Core' | 'Full body';

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell' | 'other';
  instructions?: string;
  isCustom?: boolean;
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  isPR?: boolean;
  completed: boolean;
}

export interface LoggedExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: WorkoutSet[];
  notes?: string;
}

export interface GymWorkoutSession {
  id: string;
  userId: string;
  title: string;
  split: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  caloriesBurned: number;
  exercises: LoggedExercise[];
  notes?: string;
}

export interface WorkoutPlanDay {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  split: string;
  isRestDay: boolean;
  exercises: {
    name: string;
    muscleGroup: MuscleGroup;
    targetSets: number;
    targetReps: number;
  }[];
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  days: WorkoutPlanDay[];
  createdAt: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealItem {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  isFavorite?: boolean;
  imageUrl?: string;
  aiEstimated?: boolean;
  detectedIngredients?: string[];
  createdAt: string;
}

export interface WaterLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
}

export interface WeightRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
}

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'calorie' | 'distance' | 'workout' | 'streak' | 'general';
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface DetectedFoodCandidate {
  name: string;
  portion: string;
  grams?: number;
  alternatives?: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  confidence: number;
}

export interface DayDeficitRecord {
  dateStr: string;
  dayName: string; // 'Mon', 'Tue', etc.
  dayIndex: number; // 0 for Mon ... 6 for Sun
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  eaten: number;
  burned: number;
  netCalories: number;
  achievedDeficit: number;
  targetDeficit: number;
  status: 'completed' | 'shortfall' | 'surplus_banked' | 'pending';
  shortfallOrSurplus: number; // achievedDeficit - targetDeficit
}

export interface WeeklyDeficitSummary {
  weekStartDate: string;
  weekEndDate: string;
  days: DayDeficitRecord[];
  dailyDeficitTarget: number;
  weeklyDeficitTarget: number;
  totalDeficitAchievedSoFar: number;
  weeklyProgressPercent: number;
  remainingDeficitNeeded: number;
  elapsedDaysCount: number;
  remainingDaysCount: number; // days remaining in week (including today if pending)
  futureDaysCount: number; // days strictly after today
  currentWeeklyBalance: number; // totalDeficitAchievedSoFar - (dailyDeficitTarget * elapsedDaysCount)
  hasShortfall: boolean;
  shortfallCalories: number;
  bankedCalories: number;
  adjustedDailyCalorieTarget: number;
  standardDailyCalorieTarget: number;
  singleDayCatchupDeficit: number;
  safetyFloorEnforced: boolean;
  recommendedCatchupAdvice: string;
}

