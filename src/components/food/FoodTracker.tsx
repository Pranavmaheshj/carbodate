import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  Plus,
  Camera,
  Star,
  Trash2,
  Flame,
  PieChart,
  Info,
  Calendar,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import {
  MealItem,
  MealType,
  UserProfile,
  BodyCalculations,
  ActivityRecord,
  GymWorkoutSession,
} from '../../types';
import { CalorieRing } from '../common/CalorieRing';
import { PhotoCalorieEstimator } from './PhotoCalorieEstimator';
import { AddFoodModal } from './AddFoodModal';
import { WaterTracker } from './WaterTracker';
import { calculateWeeklyDeficitSummary } from '../../services/calculations';

interface FoodTrackerProps {
  meals: MealItem[];
  allMeals?: MealItem[];
  allActivities?: ActivityRecord[];
  allGymSessions?: GymWorkoutSession[];
  profile: UserProfile;
  calculations: BodyCalculations;
  burnedCaloriesToday: number;
  waterCurrentMl: number;
  onSaveMeal: (meal: MealItem) => void;
  onDeleteMeal: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddWater: (amount: number) => void;
  onResetWater: () => void;
}

export const FoodTracker: React.FC<FoodTrackerProps> = ({
  meals,
  allMeals,
  allActivities,
  allGymSessions,
  profile,
  calculations,
  burnedCaloriesToday,
  waterCurrentMl,
  onSaveMeal,
  onDeleteMeal,
  onToggleFavorite,
  onAddWater,
  onResetWater,
}) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [activeMealTypeForAdd, setActiveMealTypeForAdd] = useState<MealType>('lunch');
  const [useWeeklyRolloverTarget, setUseWeeklyRolloverTarget] = useState<boolean>(false);

  // Weekly Deficit Summary & Rollover Engine
  const weeklyDeficit = useMemo(() => {
    return calculateWeeklyDeficitSummary(
      calculations,
      allMeals && allMeals.length > 0 ? allMeals : meals,
      allActivities || [],
      allGymSessions || [],
      new Date(),
      profile?.createdAt
    );
  }, [calculations, allMeals, meals, allActivities, allGymSessions, profile?.createdAt]);

  // Today's total consumed calories and macros
  const totalEaten = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = Math.round(meals.reduce((sum, m) => sum + (m.protein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(meals.reduce((sum, m) => sum + (m.carbs || 0), 0) * 10) / 10;
  const totalFiber = Math.round(meals.reduce((sum, m) => sum + (m.fiber || 0), 0) * 10) / 10;
  const totalFat = Math.round(meals.reduce((sum, m) => sum + (m.fat || 0), 0) * 10) / 10;

  // Recommended targets (standard vs weekly rollover dynamic target)
  const standardTargetCals = calculations.dailyCalorieTarget;
  const targetCals = useWeeklyRolloverTarget && weeklyDeficit.hasShortfall
    ? weeklyDeficit.adjustedDailyCalorieTarget
    : standardTargetCals;

  const targetProtein = Math.round((targetCals * 0.35) / 4);
  const targetCarbs = Math.round((targetCals * 0.40) / 4);
  const targetFat = Math.round((targetCals * 0.25) / 9);
  const targetFiber = 30; // 30g daily fiber recommendation

  // Helper to reliably map any meal/drink into one of the four meal sections
  const normalizeMealType = (raw?: string): MealType => {
    if (!raw) return 'snack';
    const clean = raw.toLowerCase().trim();
    if (clean === 'breakfast') return 'breakfast';
    if (clean === 'lunch') return 'lunch';
    if (clean === 'dinner') return 'dinner';
    return 'snack'; // snack, snacks, drinks, drink, beverage, etc. safely map to Snacks & Drinks
  };

  // Group meals by mealType
  const mealSections: { type: MealType; title: string; desc: string }[] = [
    { type: 'breakfast', title: 'Breakfast', desc: 'Kickstart morning metabolism' },
    { type: 'lunch', title: 'Lunch', desc: 'Midday sustained fuel' },
    { type: 'dinner', title: 'Dinner', desc: 'Recovery & evening replenishment' },
    { type: 'snack', title: 'Snacks & Drinks', desc: 'Coffee, tea, drinks, energy boosts & snacks' },
  ];

  const handleOpenAdd = (type: MealType) => {
    setActiveMealTypeForAdd(type);
    setIsAddFoodModalOpen(true);
  };

  const favoriteMeals = meals.filter((m) => m.isFavorite);

  return (
    <div className="space-y-7 pb-28 md:pb-12 text-left">
      {/* Top Calorie Budget Hero Card */}
      <div className="clay-card rounded-clay-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Calorie Ring */}
          <div className="flex-shrink-0">
            <CalorieRing
              targetCalories={targetCals}
              eatenCalories={totalEaten}
              burnedCalories={burnedCaloriesToday}
              size={220}
              strokeWidth={16}
            />
          </div>

          {/* Macro breakdown bars & Budget description */}
          <div className="flex-1 w-full space-y-5">
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className="clay-chip bg-clay-lime text-clay-text text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Calorie Deficit Budget</span>
                </span>

                {/* Target Switcher: Standard vs Weekly Rollover */}
                <div className="flex items-center gap-1 p-1 rounded-xl clay-sunken">
                  <button
                    type="button"
                    onClick={() => setUseWeeklyRolloverTarget(false)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-heading font-black transition ${
                      !useWeeklyRolloverTarget
                        ? 'clay-btn-lime text-clay-text shadow-sm'
                        : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                    }`}
                  >
                    Standard ({standardTargetCals} kcal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseWeeklyRolloverTarget(true)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-heading font-black transition flex items-center gap-1 ${
                      useWeeklyRolloverTarget
                        ? 'clay-btn-lime text-clay-text shadow-sm'
                        : weeklyDeficit.hasShortfall
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>Rollover ({weeklyDeficit.adjustedDailyCalorieTarget} kcal)</span>
                    {weeklyDeficit.hasShortfall && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-0.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-1">
                <h3 className="text-2xl sm:text-3xl font-heading font-black text-clay-text dark:text-white tracking-tight mt-1">
                  {calculations.dailyDeficitOrSurplus < 0
                    ? `Deficit Target: ${Math.abs(calculations.dailyDeficitOrSurplus)} kcal/day`
                    : 'Maintenance / Surplus Target'}
                </h3>
                <span className="text-xs text-clay-text/60 dark:text-slate-400 font-mono">
                  {targetCals} - {totalEaten} + {burnedCaloriesToday} = <strong className="text-clay-text dark:text-white font-black">{Math.max(0, targetCals + burnedCaloriesToday - totalEaten)} kcal left</strong>
                </span>
              </div>
            </div>

            {/* Macro Bars in Sunken Clay Tracks */}
            <div className="space-y-3 pt-1">
              {/* Protein */}
              <div>
                <div className="flex justify-between text-xs font-heading font-bold mb-1.5">
                  <span className="text-clay-coral-dark dark:text-clay-coral">Protein (35%)</span>
                  <span className="text-clay-text dark:text-white font-mono">
                    {totalProtein}g <span className="text-clay-text/50 dark:text-slate-500">/ {targetProtein}g</span>
                  </span>
                </div>
                <div className="h-3.5 w-full clay-sunken rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-clay-coral rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div>
                <div className="flex justify-between text-xs font-heading font-bold mb-1.5">
                  <span className="text-clay-butter-dark dark:text-clay-butter">Carbohydrates (40%)</span>
                  <span className="text-clay-text dark:text-white font-mono">
                    {totalCarbs}g <span className="text-clay-text/50 dark:text-slate-500">/ {targetCarbs}g</span>
                  </span>
                </div>
                <div className="h-3.5 w-full clay-sunken rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-clay-butter rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fats */}
              <div>
                <div className="flex justify-between text-xs font-heading font-bold mb-1.5">
                  <span className="text-clay-sky-dark dark:text-clay-sky">Fats (25%)</span>
                  <span className="text-clay-text dark:text-white font-mono">
                    {totalFat}g <span className="text-clay-text/50 dark:text-slate-500">/ {targetFat}g</span>
                  </span>
                </div>
                <div className="h-3.5 w-full clay-sunken rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-clay-sky rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (totalFat / targetFat) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fiber */}
              <div>
                <div className="flex justify-between text-xs font-heading font-bold mb-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400">Dietary Fiber</span>
                  <span className="text-clay-text dark:text-white font-mono">
                    {totalFiber}g <span className="text-clay-text/50 dark:text-slate-500">/ {targetFiber}g</span>
                  </span>
                </div>
                <div className="h-3.5 w-full clay-sunken rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (totalFiber / targetFiber) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Weekly Deficit Rollover Insight Banner */}
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                weeklyDeficit.hasShortfall
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300/40 text-amber-900 dark:text-amber-200'
                  : 'clay-sunken text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {weeklyDeficit.hasShortfall ? (
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                )}
                <span className="truncate font-sans font-bold text-[11px]">
                  {weeklyDeficit.hasShortfall
                    ? `Weekly Rollover: ${weeklyDeficit.shortfallCalories} kcal shortfall is rolled over to complete by Sunday.`
                    : `Weekly Deficit On Track: ${weeklyDeficit.totalDeficitAchievedSoFar} / ${weeklyDeficit.weeklyDeficitTarget} kcal achieved.`}
                </span>
              </div>
              <span className="font-heading font-black text-[11px] whitespace-nowrap flex-shrink-0 font-mono">
                {weeklyDeficit.weeklyProgressPercent}% of week
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="py-3.5 px-5 rounded-clay-btn clay-btn-sky text-slate-900 font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 active:scale-95 transition shadow-sm"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>AI Photo Calorie Scan</span>
          </button>

          <button
            onClick={() => handleOpenAdd('breakfast')}
            className="py-3.5 px-5 rounded-clay-btn clay-btn-lime text-slate-900 font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 active:scale-95 transition shadow-md border border-lime-400/60"
          >
            <div className="w-5 h-5 rounded-full bg-slate-900 text-lime-400 flex items-center justify-center font-black shadow-xs">
              <Plus className="w-3.5 h-3.5 stroke-[4]" />
            </div>
            <span>Manual Food & Quantity Entry</span>
          </button>
        </div>
      </div>

      {/* Water Tracker Integration */}
      <WaterTracker
        currentMl={waterCurrentMl}
        goalMl={profile.dailyWaterGoalMl || 2750}
        onAddWater={onAddWater}
        onReset={onResetWater}
      />

      {/* Meals Sections: Breakfast, Lunch, Dinner, Snacks */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-heading font-black text-clay-text dark:text-white tracking-tight">
            Today's Meals
          </h3>
          <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400 font-bold">
            {meals.length} items logged
          </span>
        </div>

        {mealSections.map((sec) => {
          const sectionMeals = meals.filter((m) => normalizeMealType(m.mealType) === sec.type);
          const sectionCals = sectionMeals.reduce((s, m) => s + (m.calories || 0), 0);

          return (
            <div
              key={sec.type}
              className="clay-card rounded-clay-card p-5 sm:p-6"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-heading font-black text-clay-text dark:text-white text-lg">
                      {sec.title}
                    </h4>
                    <span className="text-xs font-mono font-black text-clay-coral-dark dark:text-clay-coral px-2.5 py-0.5 rounded-full clay-sunken">
                      {sectionCals} kcal
                    </span>
                  </div>
                  <span className="text-[11px] font-sans text-clay-text/60 dark:text-slate-400 mt-0.5 block">
                    {sec.desc}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveMealTypeForAdd(sec.type);
                      setIsPhotoModalOpen(true);
                    }}
                    className="w-9 h-9 rounded-full clay-pebble text-clay-text/70 hover:text-clay-text dark:text-slate-300 dark:hover:text-white transition"
                    title={`Scan ${sec.title} photo`}
                    aria-label={`Scan ${sec.title} photo`}
                  >
                    <Camera className="w-4 h-4 stroke-[2.2]" />
                  </button>
                  <button
                    onClick={() => handleOpenAdd(sec.type)}
                    className="py-2 px-3.5 rounded-clay-btn bg-slate-900 text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-900 font-heading font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                    title={`Add food with quantity to ${sec.title}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-lime-400 text-slate-900 dark:bg-slate-900 dark:text-lime-400 flex items-center justify-center font-black">
                      <Plus className="w-3 h-3 stroke-[4]" />
                    </div>
                    <span>Add Food</span>
                  </button>
                </div>
              </div>

              {/* Section Meals List */}
              {sectionMeals.length === 0 ? (
                <button
                  type="button"
                  onClick={() => handleOpenAdd(sec.type)}
                  className="w-full py-4 px-4 text-center text-xs font-sans text-clay-text/80 dark:text-slate-300 clay-sunken rounded-2xl hover:border-lime-500/50 border border-dashed border-slate-300 dark:border-slate-700/60 transition flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-lime-400 dark:bg-lime-400 dark:text-slate-900 flex items-center justify-center font-black group-hover:scale-110 transition shadow-sm">
                    <Plus className="w-3.5 h-3.5 stroke-[4]" />
                  </div>
                  <span className="font-heading font-black">No {sec.title.toLowerCase()} logged yet — tap here to add food</span>
                </button>
              ) : (
                <div className="space-y-2.5">
                  {sectionMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-3.5 rounded-2xl clay-card-flat flex items-center justify-between text-xs hover:scale-[1.01] transition group"
                    >
                      <div className="flex items-center gap-3.5">
                        {meal.imageUrl ? (
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-11 h-11 rounded-2xl object-cover shadow-xs border border-white/40"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl clay-pebble bg-clay-lime text-clay-text flex items-center justify-center flex-shrink-0">
                            <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-clay-text dark:text-white text-sm">
                              {meal.name}
                            </span>
                            {meal.aiEstimated && (
                              <span className="text-[9px] font-heading font-black bg-clay-sky text-clay-text px-2 py-0.5 rounded-full uppercase">
                                AI Scan
                              </span>
                            )}
                          </div>
                          <span className="text-clay-text/60 dark:text-slate-400 text-[11px] font-sans block mt-0.5">
                            {meal.portion} • {meal.protein}g P • {meal.carbs}g C • {meal.fiber ? `${meal.fiber}g Fiber • ` : ''}{meal.fat}g F
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-heading font-black text-clay-coral-dark dark:text-clay-coral font-mono">
                          {meal.calories} kcal
                        </span>

                        <button
                          onClick={() => onToggleFavorite(meal.id)}
                          className={`w-8 h-8 rounded-full clay-pebble transition ${
                            meal.isFavorite ? 'text-amber-500 fill-current' : 'text-clay-text/40'
                          }`}
                          title="Favorite meal"
                          aria-label="Favorite meal"
                        >
                          <Star className={`w-4 h-4 ${meal.isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          onClick={() => onDeleteMeal(meal.id)}
                          className="w-8 h-8 rounded-full clay-pebble text-clay-text/40 hover:text-rose-500 transition"
                          title="Delete meal"
                          aria-label="Delete meal"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Photo Calorie Estimator Modal */}
      <PhotoCalorieEstimator
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSaveMeal={onSaveMeal}
        userId={profile.id}
        initialMealType={activeMealTypeForAdd}
        onOpenManualAdd={() => setIsAddFoodModalOpen(true)}
      />

      {/* Search / Manual Add Food Modal */}
      <AddFoodModal
        isOpen={isAddFoodModalOpen}
        onClose={() => setIsAddFoodModalOpen(false)}
        onSaveMeal={onSaveMeal}
        userId={profile.id}
        defaultMealType={activeMealTypeForAdd}
        favoriteMeals={favoriteMeals}
        onOpenAiScan={() => setIsPhotoModalOpen(true)}
      />
    </div>
  );
};
