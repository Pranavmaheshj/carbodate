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
    <div className="space-y-6 pb-28 md:pb-12 text-left">
      {/* Top Calorie Budget Hero Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Calorie Ring */}
          <div className="flex-shrink-0">
            <CalorieRing
              targetCalories={targetCals}
              eatenCalories={totalEaten}
              burnedCalories={burnedCaloriesToday}
              size={210}
              strokeWidth={14}
            />
          </div>

          {/* Macro breakdown bars & Budget description */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600">
                  Calorie Deficit Budget
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {targetCals} - {totalEaten} + {burnedCaloriesToday} = {Math.max(0, targetCals + burnedCaloriesToday - totalEaten)} kcal left
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {calculations.dailyDeficitOrSurplus < 0
                  ? `Deficit Target: ${Math.abs(calculations.dailyDeficitOrSurplus)} kcal/day`
                  : 'Maintenance / Surplus Target'}
              </h3>
            </div>

            {/* Macro Bars */}
            <div className="space-y-2 pt-1">
              {/* Protein */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-600">Protein</span>
                  <span className="text-slate-800 font-mono">
                    {totalProtein}g <span className="text-slate-400">/ {targetProtein}g</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-600">Carbs</span>
                  <span className="text-slate-800 font-mono">
                    {totalCarbs}g <span className="text-slate-400">/ {targetCarbs}g</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fats */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-teal-600">Fats</span>
                  <span className="text-slate-800 font-mono">
                    {totalFat}g <span className="text-slate-400">/ {targetFat}g</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (totalFat / targetFat) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition shadow-sm"
          >
            <Camera className="w-4 h-4" />
            <span>AI Photo Calorie Scan</span>
          </button>

          <button
            onClick={() => handleOpenAdd('lunch')}
            className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Search or Add Food</span>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Today's Meals</h3>
          <span className="text-xs text-slate-500 font-medium">
            {meals.length} items logged
          </span>
        </div>

        {mealSections.map((sec) => {
          const sectionMeals = meals.filter((m) => m.mealType === sec.type);
          const sectionCals = sectionMeals.reduce((s, m) => s + (m.calories || 0), 0);

          return (
            <div
              key={sec.type}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{sec.title}</h4>
                    <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      {sectionCals} kcal
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">{sec.desc}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveMealTypeForAdd(sec.type);
                      setIsPhotoModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-slate-100 transition"
                    title={`Scan ${sec.title} photo`}
                    aria-label={`Scan ${sec.title} photo`}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenAdd(sec.type)}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-emerald-700 font-bold text-xs flex items-center gap-1 border border-slate-200 transition"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add
                  </button>
                </div>
              </div>

              {/* Section Meals List */}
              {sectionMeals.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  No {sec.title.toLowerCase()} logged yet today.
                </div>
              ) : (
                <div className="space-y-2">
                  {sectionMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs hover:border-slate-300 transition group"
                    >
                      <div className="flex items-center gap-3">
                        {meal.imageUrl ? (
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                            <UtensilsCrossed className="w-4 h-4" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{meal.name}</span>
                            {meal.aiEstimated && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold uppercase">
                                AI Scan
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 text-[11px] block">
                            {meal.portion} • {meal.protein}g P • {meal.carbs}g C • {meal.fat}g F
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-amber-600">
                          {meal.calories} kcal
                        </span>

                        <button
                          onClick={() => onToggleFavorite(meal.id)}
                          className={`p-1.5 rounded-lg transition ${
                            meal.isFavorite ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title="Favorite meal"
                          aria-label="Favorite meal"
                        >
                          <Star className={`w-4 h-4 ${meal.isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          onClick={() => onDeleteMeal(meal.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                          title="Delete meal"
                          aria-label="Delete meal"
                        >
                          <Trash2 className="w-4 h-4" />
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
