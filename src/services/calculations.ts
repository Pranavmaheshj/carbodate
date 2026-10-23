import {
  UserProfile,
  BodyCalculations,
  ActivityType,
  ActivityLevel,
  Gender,
  RoutePoint
} from '../types';

// Mifflin-St Jeor BMR calculation
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') {
    return Math.round(base + 5);
  } else if (gender === 'female') {
    return Math.round(base - 161);
  } else {
    // Non-binary/other: midpoint
    return Math.round(base - 78);
  }
}

// Activity multiplier
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // Little or no exercise
  light: 1.375, // 1-3 days/week
  moderate: 1.55, // 3-5 days/week
  very_active: 1.725, // 6-7 days/week
  extra_active: 1.9, // Very active + physical job or 2x/day
};

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.375));
}

// BMI & Categories
export function calculateBMI(weightKg: number, heightCm: number): {
  bmi: number;
  category: 'Underweight' | 'Healthy' | 'Overweight' | 'Obesity';
} {
  const heightMeters = heightCm / 100;
  if (heightMeters <= 0) return { bmi: 0, category: 'Healthy' };
  const rawBmi = weightKg / (heightMeters * heightMeters);
  const bmi = Math.round(rawBmi * 10) / 10;

  let category: 'Underweight' | 'Healthy' | 'Overweight' | 'Obesity' = 'Healthy';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25.0) category = 'Healthy';
  else if (bmi < 30.0) category = 'Overweight';
  else category = 'Obesity';

  return { bmi, category };
}

// Healthy/ideal weight range (BMI 18.5 to 24.9)
export function calculateIdealWeightRange(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100;
  const min = Math.round(18.5 * heightM * heightM * 10) / 10;
  const max = Math.round(24.9 * heightM * heightM * 10) / 10;
  return { min, max };
}

// Safety floor minimums
export function getSafetyFloorCalories(gender: Gender): number {
  if (gender === 'female') return 1200;
  if (gender === 'male') return 1500;
  return 1350;
}

// Full body calculations bundle
export function computeProfileCalculations(profile: Partial<UserProfile>): BodyCalculations {
  const weight = profile.currentWeightKg || 70;
  const height = profile.heightCm || 175;
  const age = profile.age || 26;
  const gender = profile.gender || 'male';
  const activityLevel = profile.activityLevel || 'moderate';
  const goal = profile.goal || 'lose';
  const pace = Math.min(Math.max(profile.targetPaceKgPerWeek || 0.5, 0.1), 1.0);
  const targetWeight = profile.targetWeightKg || weight;

  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const { bmi, category } = calculateBMI(weight, height);
  const idealRange = calculateIdealWeightRange(height);

  // Weight to ideal range
  let weightDifferenceKg = 0;
  if (weight > idealRange.max) {
    weightDifferenceKg = -(Math.round((weight - idealRange.max) * 10) / 10); // needs to lose
  } else if (weight < idealRange.min) {
    weightDifferenceKg = Math.round((idealRange.min - weight) * 10) / 10; // needs to gain
  }

  // Daily calorie deficit/surplus: 7700 kcal approx per 1 kg body fat
  // Deficit/surplus per day = (7700 * pace) / 7 = 1100 * pace
  const dailyDelta = Math.round((7700 * pace) / 7);

  let rawTarget = tdee;
  let dailyDeficitOrSurplus = 0;

  if (goal === 'lose') {
    rawTarget = tdee - dailyDelta;
    dailyDeficitOrSurplus = -dailyDelta;
  } else if (goal === 'gain') {
    rawTarget = tdee + dailyDelta;
    dailyDeficitOrSurplus = dailyDelta;
  } else {
    rawTarget = tdee;
    dailyDeficitOrSurplus = 0;
  }

  const safetyFloor = getSafetyFloorCalories(gender);
  let isSafetyWarning = false;
  let safetyWarningMessage: string | undefined = undefined;

  if (goal === 'lose' && rawTarget < safetyFloor) {
    isSafetyWarning = true;
    safetyWarningMessage = `Your suggested deficit would put daily intake below the safe clinical floor of ${safetyFloor} kcal. For safe metabolic health, Carbodate adjusted your target to ${safetyFloor} kcal. Consider increasing exercise or choosing a gentler pace.`;
  } else if (pace > 0.8 && goal === 'lose') {
    isSafetyWarning = true;
    safetyWarningMessage = `A pace above 0.8 kg/week is aggressive. Rapid weight loss can increase muscle loss and fatigue. Sustainable health is best achieved around 0.5 kg/week.`;
  }

  const dailyCalorieTarget = Math.max(rawTarget, safetyFloor);

  // Estimated Date Projection
  const kgDelta = Math.abs(weight - targetWeight);
  const weeksNeeded = pace > 0 ? Math.ceil(kgDelta / pace) : 0;
  const estimatedDateObj = new Date();
  estimatedDateObj.setDate(estimatedDateObj.getDate() + weeksNeeded * 7);

  const estimatedGoalDate = weeksNeeded > 0
    ? estimatedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Goal reached!';

  return {
    bmi,
    bmiCategory: category,
    bmr,
    tdee,
    idealWeightRangeKg: idealRange,
    weightDifferenceKg,
    dailyCalorieTarget,
    dailyDeficitOrSurplus,
    safetyFloor,
    isSafetyWarning,
    safetyWarningMessage,
    estimatedGoalDate,
    estimatedWeeks: weeksNeeded,
  };
}

// Unit conversion helpers
export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / 2.20462) * 10) / 10;
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function ftInToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

// MET Values for activities
export const MET_VALUES: Record<ActivityType, { default: number; moderate: number; vigorous: number }> = {
  running: { default: 9.8, moderate: 8.8, vigorous: 11.5 },
  jogging: { default: 7.0, moderate: 6.5, vigorous: 8.0 },
  walking: { default: 3.8, moderate: 3.5, vigorous: 4.8 },
  cycling: { default: 7.5, moderate: 6.0, vigorous: 10.0 },
  swimming: { default: 7.5, moderate: 6.0, vigorous: 10.0 },
};

export function estimateActivityCalories(
  type: ActivityType,
  durationMinutes: number,
  weightKg: number,
  intensity: 'default' | 'moderate' | 'vigorous' = 'default',
  inclinePercent: number = 0
): number {
  let met = MET_VALUES[type]?.[intensity] || 7.0;
  if (inclinePercent > 0) {
    // Add MET multiplier for incline treadmill (supporting up to 18% incline)
    met += inclinePercent * 0.42;
  }
  const hours = durationMinutes / 60;
  return Math.round(met * weightKg * hours);
}

/**
 * Clinical ACSM (American College of Sports Medicine) Treadmill Calorie Equation
 * Incorporates Belt Speed (km/h) and Incline (Grade 0% - 18%+) with body weight.
 */
export function calculateTreadmillCalories(
  speedKmh: number,
  inclinePercent: number,
  weightKg: number,
  durationSeconds: number
): number {
  if (speedKmh <= 0 || durationSeconds <= 0 || weightKg <= 0) return 0;
  const speedMetersPerMin = (speedKmh * 1000) / 60;
  const grade = Math.max(0, Math.min(0.25, inclinePercent / 100)); // up to 18%+ grade

  // ACSM Metabolic Equations:
  // Walking (speed <= 6.5 km/h): VO2 = (0.1 * S) + (1.8 * S * G) + 3.5
  // Running (speed > 6.5 km/h):  VO2 = (0.2 * S) + (0.9 * S * G) + 3.5
  const isWalking = speedKmh <= 6.5;
  const vo2 = isWalking
    ? (0.1 * speedMetersPerMin) + (1.8 * speedMetersPerMin * grade) + 3.5
    : (0.2 * speedMetersPerMin) + (0.9 * speedMetersPerMin * grade) + 3.5;

  // 1 Liter of O2 consumed = ~4.95 kcal
  // kcal/min = (VO2 * weightKg / 1000) * 4.95
  const kcalPerMin = (vo2 * weightKg / 1000) * 4.95;
  const totalCalories = kcalPerMin * (durationSeconds / 60);
  return Math.max(1, Math.round(totalCalories));
}

/**
 * Estimate stride length in meters based on user height and walking/running speed.
 */
export function calculateStrideLengthMeters(heightCm: number, speedKmh: number): number {
  const safeHeight = heightCm && heightCm > 100 ? heightCm : 175;
  const factor = speedKmh > 6.5 ? 0.0045 : 0.00415;
  return Math.round(safeHeight * factor * 100) / 100;
}

// Haversine formula for distance between 2 GPS coordinates in meters
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Pace format: mm:ss per km
export function formatPace(paceSecPerKm: number): string {
  if (!isFinite(paceSecPerKm) || paceSecPerKm <= 0 || paceSecPerKm > 3600) return "--:--";
  const mins = Math.floor(paceSecPerKm / 60);
  const secs = Math.floor(paceSecPerKm % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs} /km`;
}

// Format duration HH:MM:SS or MM:SS
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Filter GPS points to eliminate jitter and noise
export function filterGpsPoints(newPoint: RoutePoint, lastPoint?: RoutePoint): {
  isValid: boolean;
  distanceDelta: number;
} {
  if (!lastPoint) return { isValid: true, distanceDelta: 0 };

  const timeDiffSec = (newPoint.timestamp - lastPoint.timestamp) / 1000;
  if (timeDiffSec <= 0) return { isValid: false, distanceDelta: 0 };

  const distMeters = haversineDistanceMeters(
    lastPoint.lat,
    lastPoint.lng,
    newPoint.lat,
    newPoint.lng
  );

  // Accuracy threshold check: if GPS accuracy reported > 35m, ignore
  if (newPoint.accuracy && newPoint.accuracy > 40) {
    return { isValid: false, distanceDelta: 0 };
  }

  // Micro jitter check: movement under 1.8 meters in short time window
  if (distMeters < 1.8 && timeDiffSec < 3) {
    return { isValid: false, distanceDelta: 0 };
  }

  // Impossibly high speed filter (> 50 km/h for running/walking, approx 14 m/s)
  const speedMps = distMeters / timeDiffSec;
  if (speedMps > 18) {
    return { isValid: false, distanceDelta: 0 };
  }

  return { isValid: true, distanceDelta: distMeters };
}

