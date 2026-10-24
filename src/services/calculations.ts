import {
  UserProfile,
  BodyCalculations,
  ActivityType,
  ActivityLevel,
  Gender,
  RoutePoint,
  MealItem,
  ActivityRecord,
  GymWorkoutSession,
  DayDeficitRecord,
  WeeklyDeficitSummary
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
  inclinePercent: number = 0,
  elevationGainMeters: number = 0,
  steps: number = 0,
  distanceMeters?: number
): number {
  if (durationMinutes <= 0 || weightKg <= 0) return 0;
  let met = MET_VALUES[type]?.[intensity] || 7.0;
  if (inclinePercent > 0) {
    // Add MET multiplier for incline treadmill (supporting up to 18% incline)
    met += inclinePercent * 0.42;
  }
  const hours = durationMinutes / 60;
  let calories = met * weightKg * hours;

  // Exact gravitational work for elevation climb:
  // W = m * g * h (Joules). With ~24% human muscular efficiency:
  // vertical Kcal = (weightKg * 9.80665 * elevationGainMeters) / (4184 * 0.24) ~ 0.00976 * weightKg * elevationGainMeters
  if (elevationGainMeters > 0) {
    const verticalCalories = weightKg * elevationGainMeters * 0.00976;
    calories += verticalCalories;
  }

  // Exact distance-based energetic expenditure (Compendium of Physical Activities & ACSM):
  if (distanceMeters && distanceMeters > 0) {
    const distanceKm = distanceMeters / 1000;
    let distKcal = 0;
    if (type === 'running') {
      // ACSM Running: ~1.03 kcal/kg/km
      distKcal = distanceKm * weightKg * 1.03;
    } else if (type === 'jogging') {
      // ACSM Jogging: ~0.92 kcal/kg/km
      distKcal = distanceKm * weightKg * 0.92;
    } else if (type === 'walking') {
      // ACSM Walking: ~0.73 kcal/kg/km
      distKcal = distanceKm * weightKg * 0.73;
    } else if (type === 'cycling') {
      // Outdoor Cycling average: ~0.35 kcal/kg/km
      distKcal = distanceKm * weightKg * 0.35;
    }

    if (distKcal > 0) {
      // Blend 60% distance work and 40% duration MET to account for speed variation and physiological demand
      calories = (distKcal * 0.6) + (calories * 0.4);
      if (elevationGainMeters > 0) {
        calories += weightKg * elevationGainMeters * 0.00976;
      }
    }
  } else if (steps > 0 && (type === 'walking' || type === 'running' || type === 'jogging')) {
    // If steps are available and activity is walking/running, incorporate step work:
    const stepKcal = steps * (weightKg / 70) * (type === 'walking' ? 0.038 : 0.052);
    calories = Math.max(calories, (calories * 0.65) + (stepKcal * 0.35));
  }

  return Math.max(0, Math.round(calories));
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

// Filter GPS points to eliminate jitter and noise while keeping natural walking and running movements
export function filterGpsPoints(
  newPoint: RoutePoint,
  lastPoint?: RoutePoint,
  activityType?: ActivityType
): {
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

  // 1. Accuracy threshold check: discard readings with accuracy error worse than 45m
  if (newPoint.accuracy && newPoint.accuracy > 45) {
    return { isValid: false, distanceDelta: 0 };
  }

  // 2. Maximum plausible speed filter tailored to human biomechanics:
  // Walking: max ~9.5 km/h (2.65 m/s). Anything faster is a GPS jump/glitch!
  // Running/Jogging: max ~25 km/h (6.95 m/s).
  // Cycling: max ~65 km/h (18.0 m/s).
  const maxSpeedMps = activityType === 'walking'
    ? 2.65
    : activityType === 'running' || activityType === 'jogging'
    ? 6.95
    : 18.0;

  const speedMps = distMeters / timeDiffSec;
  if (speedMps > maxSpeedMps) {
    return { isValid: false, distanceDelta: 0 };
  }

  // 3. Stationary GPS drift filter:
  // When standing still, GPS coordinates drift in small random bubbles (~1-2m).
  // If displacement is small and accuracy is wide (> 12m) or speed is below human walking creep (< 0.6 km/h = 0.17 m/s),
  // do NOT add false distance!
  if (distMeters < 1.8 && (newPoint.accuracy || 10) > 12) {
    return { isValid: false, distanceDelta: 0 };
  }

  if (distMeters < 0.6 && timeDiffSec < 1.5) {
    return { isValid: false, distanceDelta: 0 };
  }

  return { isValid: true, distanceDelta: distMeters };
}

/**
 * Formats a Date or date string into standard local YYYY-MM-DD format.
 * Prevents timezone offset shifts where UTC conversion (toISOString) subtracts
 * a day for users in timezones ahead of UTC (e.g. IST UTC+5:30).
 */
export function formatLocalDate(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely extracts the local date string (YYYY-MM-DD) from an activity or session timestamp.
 * Prevents UTC-offset bugs where early morning or late night sessions appear under the wrong day.
 */
export function getActivityLocalDate(dateOrIsoString?: string | Date): string {
  if (!dateOrIsoString) return '';
  const d = typeof dateOrIsoString === 'string' ? new Date(dateOrIsoString) : dateOrIsoString;
  if (isNaN(d.getTime())) {
    return String(dateOrIsoString).split('T')[0] || '';
  }
  return formatLocalDate(d);
}

/**
 * Calculates current 7-day Monday-to-Sunday weekly calorie deficit progression,
 * tracking daily deficit completion and flexible single-day or even catch-up balance.
 * If a user created their account partway through the week (e.g. at the end of the week),
 * progress is tracked strictly from their started day forward without mock data.
 */
export function calculateWeeklyDeficitSummary(
  calculations: BodyCalculations,
  allMeals: MealItem[],
  allActivities: ActivityRecord[],
  allGymSessions: GymWorkoutSession[],
  referenceDate: Date = new Date(),
  userCreatedAt?: string,
  restDays?: number[]
): WeeklyDeficitSummary {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Find Monday of current reference week (centered at local noon 12:00:00 to prevent any timezone shifts)
  const ref = new Date(referenceDate);
  const currentDayOfWeek = ref.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + diffToMonday, 12, 0, 0);

  const todayStr = formatLocalDate(ref);

  // User join/start date (if created at the end of the week, e.g. Saturday, track from that day)
  const userStartDate = userCreatedAt ? userCreatedAt.split('T')[0] : todayStr;

  // Daily target and deficit
  const tdee = calculations.tdee;
  const standardDailyCalorieTarget = calculations.dailyCalorieTarget;
  const dailyDeficitTarget = Math.max(150, Math.abs(calculations.dailyDeficitOrSurplus) || 500);
  const safetyFloor = calculations.safetyFloor || 1200;

  const days: DayDeficitRecord[] = [];
  let totalDeficitAchievedSoFar = 0;
  let elapsedDaysCount = 0;
  let activeDaysThisWeek = 0;
  let todayIndex = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
    const dateStr = formatLocalDate(d);
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;
    const isFuture = dateStr > todayStr;
    const isBeforeUserJoined = dateStr < userStartDate;
    const isRestDay = Array.isArray(restDays) ? restDays.includes(d.getDay()) : false;

    if (isToday) todayIndex = i;

    // Meals for this day
    const dayMeals = allMeals.filter((m) => m.date === dateStr);
    const eaten = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);

    // Activities for this day
    const dayActivities = allActivities.filter((a) => getActivityLocalDate(a.startTime) === dateStr);
    const cardioBurn = dayActivities.reduce((s, a) => s + (a.caloriesBurned || 0), 0);

    // Gym sessions for this day
    const dayGym = allGymSessions.filter((g) => getActivityLocalDate(g.startTime) === dateStr);
    const gymBurn = dayGym.reduce((s, g) => s + (g.caloriesBurned || 0), 0);

    const burned = cardioBurn + gymBurn;
    const netCalories = eaten - burned;

    let achievedDeficit = 0;
    let status: 'completed' | 'shortfall' | 'surplus_banked' | 'pending' | 'untracked' = 'pending';
    let shortfallOrSurplus = 0;

    if (isBeforeUserJoined) {
      // Days before user created account: NOT part of the user's journey, do NOT use mock data!
      status = 'untracked';
      achievedDeficit = 0;
      shortfallOrSurplus = 0;
    } else {
      activeDaysThisWeek++;

      if (isPast) {
        if (eaten > 0 || burned > 0) {
          achievedDeficit = tdee - netCalories;
          shortfallOrSurplus = achievedDeficit - dailyDeficitTarget;
          totalDeficitAchievedSoFar += achievedDeficit;
          elapsedDaysCount++;
          status = achievedDeficit >= dailyDeficitTarget ? 'completed' : 'shortfall';
        } else {
          // Unlogged past day
          status = 'untracked';
          achievedDeficit = 0;
          shortfallOrSurplus = -dailyDeficitTarget;
          elapsedDaysCount++;
        }
      } else if (isToday) {
        elapsedDaysCount++;
        if (eaten > 0 || burned > 0) {
          achievedDeficit = tdee - netCalories;
          shortfallOrSurplus = achievedDeficit - dailyDeficitTarget;
          totalDeficitAchievedSoFar += achievedDeficit;
          status = achievedDeficit >= dailyDeficitTarget ? 'completed' : 'pending';
        } else {
          status = 'pending';
          achievedDeficit = 0;
        }
      } else {
        // Future days
        status = 'pending';
        achievedDeficit = 0;
      }
    }

    days.push({
      dateStr,
      dayName: dayNames[i],
      dayIndex: i,
      isPast,
      isToday,
      isFuture,
      isBeforeUserJoined,
      isRestDay,
      eaten,
      burned,
      netCalories,
      achievedDeficit,
      targetDeficit: isBeforeUserJoined ? 0 : dailyDeficitTarget,
      status,
      shortfallOrSurplus,
    });
  }

  const weekStartDate = days[0].dateStr;
  const weekEndDate = days[6].dateStr;

  // Active weekly target: only from the day the user actually started!
  const effectiveActiveDays = Math.max(1, activeDaysThisWeek);
  const weeklyDeficitTarget = dailyDeficitTarget * effectiveActiveDays;

  // Remaining days in week: from today through Sunday
  const remainingDaysCount = Math.max(1, 7 - todayIndex);
  const futureDaysCount = Math.max(0, 6 - todayIndex);

  // Expected deficit up to today (only for elapsed active days)
  const cumulativeExpected = dailyDeficitTarget * Math.max(1, elapsedDaysCount);
  const currentWeeklyBalance = totalDeficitAchievedSoFar - cumulativeExpected;

  const hasShortfall = currentWeeklyBalance < -50;
  const shortfallCalories = hasShortfall ? Math.abs(currentWeeklyBalance) : 0;
  const bankedCalories = 0; // Removed mock/inflated banked buffer note per user request

  const remainingDeficitNeeded = Math.max(0, weeklyDeficitTarget - totalDeficitAchievedSoFar);
  const weeklyProgressPercent = weeklyDeficitTarget > 0
    ? Math.min(100, Math.max(0, Math.round((totalDeficitAchievedSoFar / weeklyDeficitTarget) * 100)))
    : 0;

  // Adjusted daily deficit distributed across remaining days
  const adjustedDailyDeficit = Math.round(remainingDeficitNeeded / remainingDaysCount);
  let adjustedDailyCalorieTarget = tdee - adjustedDailyDeficit;
  let safetyFloorEnforced = false;

  if (adjustedDailyCalorieTarget < safetyFloor) {
    adjustedDailyCalorieTarget = safetyFloor;
    safetyFloorEnforced = true;
  }

  // Single-day catchup deficit
  const singleDayCatchupDeficit = Math.round(shortfallCalories);

  // Catchup advice formulation without mock banked buffer notes
  let recommendedCatchupAdvice = '';
  if (hasShortfall) {
    if (safetyFloorEnforced) {
      recommendedCatchupAdvice = `You're ${shortfallCalories} kcal behind target this week. Due to safe calorie minimums (${safetyFloor} kcal/day), complete the remaining deficit by adding a 35-min brisk walk or treadmill workout (-${Math.min(shortfallCalories, 350)} kcal) on any upcoming day!`;
    } else {
      recommendedCatchupAdvice = `You're ${shortfallCalories} kcal behind target. Complete it by eating ~${adjustedDailyCalorieTarget} kcal/day for the remaining ${remainingDaysCount} days, or make it all up on any single day (e.g. ${days[Math.min(6, todayIndex + 1)]?.dayName || 'Sunday'}) with an active workout!`;
    }
  } else {
    const startedDayName = days.find((d) => !d.isBeforeUserJoined)?.dayName || 'Today';
    recommendedCatchupAdvice = `Progress is tracked starting from ${startedDayName} (${effectiveActiveDays} active day${effectiveActiveDays > 1 ? 's' : ''} this week). Daily target: ${dailyDeficitTarget} kcal deficit.`;
  }

  return {
    weekStartDate,
    weekEndDate,
    days,
    dailyDeficitTarget,
    weeklyDeficitTarget,
    totalDeficitAchievedSoFar,
    weeklyProgressPercent,
    remainingDeficitNeeded,
    elapsedDaysCount,
    remainingDaysCount,
    futureDaysCount,
    activeDaysThisWeek: effectiveActiveDays,
    currentWeeklyBalance,
    hasShortfall,
    shortfallCalories,
    bankedCalories,
    adjustedDailyCalorieTarget,
    standardDailyCalorieTarget,
    singleDayCatchupDeficit,
    safetyFloorEnforced,
    recommendedCatchupAdvice,
  };
}

