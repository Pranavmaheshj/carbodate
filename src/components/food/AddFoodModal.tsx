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
            className="w-full max-w-lg clay-card rounded-clay-card p-6 shadow-2xl relative text-left max-h-[85vh] flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 clay-pebble w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition z-10"
              aria-label="Close add food"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-display">Log Food & Calories</h3>
                <span className="text-xs font-bold text-slate-400">Search database, favorites or custom macros</span>
              </div>
            </div>

            {/* Meal Type & Portion Multiplier selector */}
            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="clay-sunken p-1 rounded-full flex items-center gap-1">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMealType(m)}
                    className={`px-3 py-1 text-xs font-black rounded-full capitalize transition ${
                      mealType === m
                        ? 'clay-btn-lime'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {tab === 'search' && (
                <div className="flex items-center gap-1.5 clay-sunken px-2.5 py-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Qty:</span>
                  <button
                    onClick={() => setMultiplier(Math.max(0.5, multiplier - 0.5))}
                    className="clay-btn w-5 h-5 rounded-md flex items-center justify-center font-black active:scale-90"
                  >
                    -
                  </button>
                  <span className="font-mono text-lime-600 dark:text-lime-400 font-black">{multiplier}x</span>
                  <button
                    onClick={() => setMultiplier(multiplier + 0.5)}
                    className="clay-btn w-5 h-5 rounded-md flex items-center justify-center font-black active:scale-90"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="clay-sunken p-1 rounded-full flex gap-1 mt-3">
              <button
                onClick={() => setTab('search')}
                className={`flex-1 py-1.5 text-xs font-black rounded-full transition ${
                  tab === 'search'
                    ? 'clay-btn-lime'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Food Library
              </button>
              <button
                onClick={() => setTab('favorites')}
                className={`flex-1 py-1.5 text-xs font-black rounded-full transition ${
                  tab === 'favorites'
                    ? 'clay-btn-lime'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Favorites ({favoriteMeals.length})
              </button>
              <button
                onClick={() => setTab('manual')}
                className={`flex-1 py-1.5 text-xs font-black rounded-full transition ${
                  tab === 'manual'
                    ? 'clay-btn-lime'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
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
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chicken, rice, eggs, protein..."
                    className="clay-input w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none border-none"
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-1">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={`px-3 py-1 rounded-full text-[11px] font-black transition ${
                        categoryFilter === c
                          ? 'clay-btn-lime'
                          : 'clay-btn text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Food List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredFoods.map((item) => {
                    const scaledCals = Math.round(item.calories * multiplier);
                    const scaledP = Math.round(item.protein * multiplier * 10) / 10;
                    const scaledC = Math.round(item.carbs * multiplier * 10) / 10;
                    const scaledF = Math.round(item.fat * multiplier * 10) / 10;

                    return (
                      <div
                        key={item.name}
                        onClick={() => handleSelectFoodItem(item)}
                        className="p-3.5 rounded-2xl clay-card-flat transition cursor-pointer flex items-center justify-between group hover:scale-[1.01]"
                      >
                        <div>
                          <span className="font-black text-slate-800 dark:text-slate-100 text-sm group-hover:text-lime-600 dark:group-hover:text-lime-400 transition font-display block">
                            {item.name}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            {item.portion} • {scaledP}g P • {scaledC}g C • {scaledF}g F
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-coral-600 dark:text-coral-400 font-mono">
                            {scaledCals} <span className="text-[10px] text-slate-400">kcal</span>
                          </span>
                          <button
                            type="button"
                            className="clay-pebble w-8 h-8 rounded-xl group-hover:clay-btn-lime flex items-center justify-center transition"
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
                  <div className="text-center py-10 text-slate-400 text-xs font-bold">
                    No favorite meals saved yet. Tap the star icon on any logged meal to save it here for 1-tap logging.
                  </div>
                ) : (
                  favoriteMeals.map((fav) => (
                    <div
                      key={fav.id}
                      onClick={() => handleSelectFavorite(fav)}
                      className="p-3.5 rounded-2xl clay-card-flat flex items-center justify-between cursor-pointer group hover:scale-[1.01] transition"
                    >
                      <div>
                        <span className="font-black text-slate-800 dark:text-slate-100 text-sm group-hover:text-lime-600 dark:group-hover:text-lime-400 transition font-display block">
                          {fav.name}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {fav.portion} • {fav.protein}g P • {fav.carbs}g C • {fav.fat}g F
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-coral-600 dark:text-coral-400 font-mono">
                          {fav.calories} kcal
                        </span>
                        <div className="clay-pebble w-8 h-8 rounded-xl group-hover:clay-btn-lime flex items-center justify-center transition">
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
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1">
                    Food / Dish Name
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Homemade Turkey Sandwich"
                    className="clay-input w-full rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 border-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1">
                      Portion Size
                    </label>
                    <input
                      type="text"
                      value={manualPortion}
                      onChange={(e) => setManualPortion(e.target.value)}
                      placeholder="e.g. 1 bowl (300g)"
                      className="clay-input w-full rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 border-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1">
                      Calories (kcal)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={manualCalories}
                      onChange={(e) => setManualCalories(Number(e.target.value))}
                      className="clay-input w-full rounded-2xl px-4 py-2.5 text-sm text-coral-600 dark:text-coral-400 font-black font-mono border-none"
                    />
                  </div>
                </div>

                {/* Macro breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-black text-coral-500 font-display mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={manualProtein}
                      onChange={(e) => setManualProtein(Number(e.target.value))}
                      className="clay-input w-full rounded-2xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold border-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-amber-500 font-display mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={manualCarbs}
                      onChange={(e) => setManualCarbs(Number(e.target.value))}
                      className="clay-input w-full rounded-2xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold border-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-sky-500 font-display mb-1">
                      Fats (g)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={manualFat}
                      onChange={(e) => setManualFat(Number(e.target.value))}
                      className="clay-input w-full rounded-2xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold border-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-clay-btn clay-btn-lime font-black flex items-center justify-center gap-2 active:scale-95 transition text-xs shadow-sm mt-3"
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
