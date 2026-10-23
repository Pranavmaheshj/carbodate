import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { MealItem, MealType, UserProfile, BodyCalculations } from '../../types';
import { CalorieRing } from '../common/CalorieRing';
import { PhotoCalorieEstimator } from './PhotoCalorieEstimator';
import { AddFoodModal } from './AddFoodModal';
import { WaterTracker } from './WaterTracker';

interface FoodTrackerProps {
  meals: MealItem[];
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

  // Today's total consumed calories and macros
  const totalEaten = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = Math.round(meals.reduce((sum, m) => sum + (m.protein || 0), 0));
  const totalCarbs = Math.round(meals.reduce((sum, m) => sum + (m.carbs || 0), 0));
  const totalFat = Math.round(meals.reduce((sum, m) => sum + (m.fat || 0), 0));

  // Recommended targets
  const targetCals = calculations.dailyCalorieTarget;
  const targetProtein = Math.round((targetCals * 0.35) / 4);
  const targetCarbs = Math.round((targetCals * 0.40) / 4);
  const targetFat = Math.round((targetCals * 0.25) / 9);

  // Group meals by mealType
  const mealSections: { type: MealType; title: string; desc: string }[] = [
    { type: 'breakfast', title: 'Breakfast', desc: 'Kickstart morning metabolism' },
    { type: 'lunch', title: 'Lunch', desc: 'Midday sustained fuel' },
    { type: 'dinner', title: 'Dinner', desc: 'Recovery & evening replenishment' },
    { type: 'snack', title: 'Snacks', desc: 'Energy boosts & protein snacks' },
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
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                <span className="clay-chip bg-clay-lime text-clay-text text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Calorie Deficit Budget</span>
                </span>
                <span className="text-xs text-clay-text/60 dark:text-slate-400 font-mono">
                  {targetCals} - {totalEaten} + {burnedCaloriesToday} = <strong className="text-clay-text dark:text-white font-black">{Math.max(0, targetCals + burnedCaloriesToday - totalEaten)} kcal left</strong>
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-clay-text dark:text-white tracking-tight mt-1">
                {calculations.dailyDeficitOrSurplus < 0
                  ? `Deficit Target: ${Math.abs(calculations.dailyDeficitOrSurplus)} kcal/day`
                  : 'Maintenance / Surplus Target'}
              </h3>
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
            </div>
          </div>
        </div>

        {/* Quick Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="py-3 px-5 rounded-clay-btn clay-btn-sky text-clay-text font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-sm"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>AI Photo Calorie Scan</span>
          </button>

          <button
            onClick={() => handleOpenAdd('breakfast')}
            className="py-3 px-5 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Manual Food & Quantity Entry</span>
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
          const sectionMeals = meals.filter((m) => m.mealType === sec.type);
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
                    className="py-2 px-3 rounded-clay-btn clay-btn text-clay-text dark:text-white font-heading font-black text-xs flex items-center gap-1.5 transition active:scale-95"
                    title={`Add food with quantity to ${sec.title}`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Add Food & Qty</span>
                  </button>
                </div>
              </div>

              {/* Section Meals List */}
              {sectionMeals.length === 0 ? (
                <div className="py-4 text-center text-xs font-sans text-clay-text/50 dark:text-slate-400 clay-sunken rounded-2xl">
                  No {sec.title.toLowerCase()} logged yet today.
                </div>
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
                            {meal.portion} • {meal.protein}g P • {meal.carbs}g C • {meal.fat}g F
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
      />

      {/* Search / Manual Add Food Modal */}
      <AddFoodModal
        isOpen={isAddFoodModalOpen}
        onClose={() => setIsAddFoodModalOpen(false)}
        onSaveMeal={onSaveMeal}
        userId={profile.id}
        defaultMealType={activeMealTypeForAdd}
        favoriteMeals={favoriteMeals}
      />
    </div>
  );
};
