import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Plus,
  Star,
  Check,
  Flame,
  Utensils,
  Sparkles
} from 'lucide-react';
import { MealItem, MealType } from '../../types';
import { FOOD_DATABASE, FoodItemTemplate } from '../../data/foodDatabase';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: MealItem) => void;
  userId: string;
  defaultMealType?: MealType;
  favoriteMeals?: MealItem[];
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  userId,
  defaultMealType = 'lunch',
  favoriteMeals = [],
}) => {
  const [tab, setTab] = useState<'search' | 'favorites' | 'manual'>('search');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Quantity multiplier
  const [multiplier, setMultiplier] = useState<number>(1);

  // Manual entry state
  const [manualName, setManualName] = useState('');
  const [manualPortion, setManualPortion] = useState('1 serving');
  const [manualCalories, setManualCalories] = useState<number>(250);
  const [manualProtein, setManualProtein] = useState<number>(20);
  const [manualCarbs, setManualCarbs] = useState<number>(25);
  const [manualFat, setManualFat] = useState<number>(8);

  const categories = ['All', 'Protein', 'Carbs', 'Fats', 'Produce', 'Meals', 'Snacks'];

  const filteredFoods = FOOD_DATABASE.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || f.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleSelectFoodItem = (template: FoodItemTemplate) => {
    const meal: MealItem = {
      id: `meal_${Date.now()}`,
      userId,
      date: new Date().toISOString().split('T')[0],
      mealType,
      name: template.name,
      portion: multiplier === 1 ? template.portion : `${multiplier}x (${template.portion})`,
      calories: Math.round(template.calories * multiplier),
      protein: Math.round(template.protein * multiplier * 10) / 10,
      carbs: Math.round(template.carbs * multiplier * 10) / 10,
      fat: Math.round(template.fat * multiplier * 10) / 10,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    onSaveMeal(meal);
    onClose();
  };

  const handleSelectFavorite = (fav: MealItem) => {
    const meal: MealItem = {
      ...fav,
      id: `meal_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      mealType,
      createdAt: new Date().toISOString(),
    };
    onSaveMeal(meal);
    onClose();
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const meal: MealItem = {
      id: `meal_${Date.now()}`,
      userId,
      date: new Date().toISOString().split('T')[0],
      mealType,
      name: manualName.trim(),
      portion: manualPortion.trim(),
      calories: manualCalories,
      protein: manualProtein,
      carbs: manualCarbs,
      fat: manualFat,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    onSaveMeal(meal);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative text-left max-h-[85vh] flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition z-10"
              aria-label="Close add food"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Log Food & Calories</h3>
                <span className="text-xs text-slate-500">Search database, favorites or manual macro entry</span>
              </div>
            </div>

            {/* Meal Type & Portion Multiplier selector */}
            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMealType(m)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize transition ${
                      mealType === m
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {tab === 'search' && (
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200">
                  <span className="text-slate-500">Qty:</span>
                  <button
                    onClick={() => setMultiplier(Math.max(0.5, multiplier - 0.5))}
                    className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-200 text-slate-800"
                  >
                    -
                  </button>
                  <span className="font-mono text-emerald-700 font-bold">{multiplier}x</span>
                  <button
                    onClick={() => setMultiplier(multiplier + 0.5)}
                    className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-200 text-slate-800"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mt-3">
              <button
                onClick={() => setTab('search')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${
                  tab === 'search'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Food Library
              </button>
              <button
                onClick={() => setTab('favorites')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${
                  tab === 'favorites'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Saved Favorites ({favoriteMeals.length})
              </button>
              <button
                onClick={() => setTab('manual')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${
                  tab === 'manual'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Custom Entry
              </button>
            </div>

            {/* TAB 1: Search library */}
            {tab === 'search' && (
              <div className="flex-1 overflow-hidden flex flex-col pt-3">
                {/* Search Input */}
                <div className="relative mb-2.5">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chicken, rice, eggs, protein..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-1">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                        categoryFilter === c
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Food List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {filteredFoods.map((item) => {
                    const scaledCals = Math.round(item.calories * multiplier);
                    const scaledP = Math.round(item.protein * multiplier * 10) / 10;
                    const scaledC = Math.round(item.carbs * multiplier * 10) / 10;
                    const scaledF = Math.round(item.fat * multiplier * 10) / 10;

                    return (
                      <div
                        key={item.name}
                        onClick={() => handleSelectFoodItem(item)}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition block">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.portion} • {scaledP}g P • {scaledC}g C • {scaledF}g F
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-amber-600">
                            {scaledCals} <span className="text-[10px] text-slate-400">kcal</span>
                          </span>
                          <button
                            type="button"
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 flex items-center justify-center transition shadow-xs"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Favorites */}
            {tab === 'favorites' && (
              <div className="flex-1 overflow-y-auto pt-3 space-y-2 pr-1">
                {favoriteMeals.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No favorite meals saved yet. Tap the star icon on any logged meal to save it here for 1-tap logging.
                  </div>
                ) : (
                  favoriteMeals.map((fav) => (
                    <div
                      key={fav.id}
                      onClick={() => handleSelectFavorite(fav)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition block">
                          {fav.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {fav.portion} • {fav.protein}g P • {fav.carbs}g C • {fav.fat}g F
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-amber-600">
                          {fav.calories} kcal
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: Manual Entry */}
            {tab === 'manual' && (
              <form onSubmit={handleSaveManual} className="flex-1 overflow-y-auto pt-3 space-y-3.5 pr-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Food / Dish Name
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Homemade Turkey Sandwich"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Portion Size
                    </label>
                    <input
                      type="text"
                      value={manualPortion}
                      onChange={(e) => setManualPortion(e.target.value)}
                      placeholder="e.g. 1 bowl (300g)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Calories (kcal)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={manualCalories}
                      onChange={(e) => setManualCalories(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-amber-600 font-bold font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Macro breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-rose-600 mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={manualProtein}
                      onChange={(e) => setManualProtein(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-600 mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={manualCarbs}
                      onChange={(e) => setManualCarbs(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-teal-600 mb-1">
                      Fats (g)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={manualFat}
                      onChange={(e) => setManualFat(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition text-xs shadow-sm mt-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Log Food Item</span>
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
