import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Plus,
  Minus,
  Star,
  Check,
  Flame,
  Utensils,
  Sparkles,
  Scale,
  Trash2,
  Layers,
  ChevronRight,
  Info,
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

interface MealIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  userId,
  defaultMealType = 'breakfast',
  favoriteMeals = [],
}) => {
  const [tab, setTab] = useState<'manual' | 'search' | 'favorites'>('manual');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [mealName, setMealName] = useState<string>('Custom Meal');

  // Multi-item meal builder state
  const [ingredients, setIngredients] = useState<MealIngredient[]>([
    {
      id: 'ing_1',
      name: 'Rolled Oats',
      quantity: 50,
      unit: 'g',
      calories: 190,
      protein: 6.6,
      carbs: 33.7,
      fat: 3.5,
    },
    {
      id: 'ing_2',
      name: 'Fresh Banana',
      quantity: 1,
      unit: 'medium',
      calories: 105,
      protein: 1.3,
      carbs: 27.0,
      fat: 0.3,
    },
    {
      id: 'ing_3',
      name: 'Peanut Butter',
      quantity: 20,
      unit: 'g',
      calories: 120,
      protein: 5.0,
      carbs: 4.0,
      fat: 10.0,
    },
  ]);

  // Form inputs for adding an ingredient to the current meal
  const [inputFoodName, setInputFoodName] = useState<string>('');
  const [inputQuantity, setInputQuantity] = useState<number>(100);
  const [inputUnit, setInputUnit] = useState<string>('g');
  const [inputCalories, setInputCalories] = useState<number>(150);
  const [inputProtein, setInputProtein] = useState<number>(10);
  const [inputCarbs, setInputCarbs] = useState<number>(18);
  const [inputFat, setInputFat] = useState<number>(4);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<FoodItemTemplate | null>(null);
  const [selectedQuantityGrams, setSelectedQuantityGrams] = useState<number>(100);

  const categories = ['All', 'Protein', 'Carbs', 'Fats', 'Produce', 'Meals'];

  const filteredFoods = FOOD_DATABASE.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || f.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Calculate totals of all ingredients in the meal
  const totalCalories = ingredients.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = Math.round(ingredients.reduce((sum, item) => sum + item.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(ingredients.reduce((sum, item) => sum + item.carbs, 0) * 10) / 10;
  const totalFat = Math.round(ingredients.reduce((sum, item) => sum + item.fat, 0) * 10) / 10;

  // Add an ingredient to the builder
  const handleAddIngredient = () => {
    if (!inputFoodName.trim()) return;

    const newIng: MealIngredient = {
      id: `ing_${Date.now()}_${Math.random()}`,
      name: inputFoodName.trim(),
      quantity: inputQuantity,
      unit: inputUnit,
      calories: Math.max(0, inputCalories),
      protein: Math.max(0, inputProtein),
      carbs: Math.max(0, inputCarbs),
      fat: Math.max(0, inputFat),
    };

    setIngredients([...ingredients, newIng]);
    setInputFoodName('');
    setInputQuantity(100);
    setInputCalories(150);
    setInputProtein(10);
    setInputCarbs(18);
    setInputFat(4);
  };

  // Remove an ingredient
  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((item) => item.id !== id));
  };

  // Quick preset chips that auto-calculate macros based on quantity
  const handlePickQuickPreset = (template: FoodItemTemplate) => {
    setInputFoodName(template.name);
    setInputUnit('g');
    setInputQuantity(template.baseWeightGrams);
    setInputCalories(template.calories);
    setInputProtein(template.protein);
    setInputCarbs(template.carbs);
    setInputFat(template.fat);
  };

  // Recalculate input macros when quantity changes for a known item
  const handleQuantityChange = (newQty: number) => {
    setInputQuantity(newQty);
    const matched = FOOD_DATABASE.find(
      (f) => f.name.toLowerCase() === inputFoodName.trim().toLowerCase()
    );
    if (matched && matched.baseWeightGrams > 0) {
      const ratio = newQty / matched.baseWeightGrams;
      setInputCalories(Math.round(matched.calories * ratio));
      setInputProtein(Math.round(matched.protein * ratio * 10) / 10);
      setInputCarbs(Math.round(matched.carbs * ratio * 10) / 10);
      setInputFat(Math.round(matched.fat * ratio * 10) / 10);
    }
  };

  // Save the entire composed meal
  const handleSaveComposedMeal = () => {
    if (ingredients.length === 0) return;

    const portionSummary = ingredients
      .map((i) => `${i.quantity}${i.unit} ${i.name}`)
      .join(' + ');

    const finalTitle =
      mealName && mealName !== 'Custom Meal'
        ? mealName
        : ingredients.length === 1
        ? ingredients[0].name
        : `${ingredients[0].name} with ${ingredients.slice(1).map((i) => i.name).join(', ')}`;

    const meal: MealItem = {
      id: `meal_${Date.now()}`,
      userId,
      date: new Date().toISOString().split('T')[0],
      mealType,
      name: finalTitle,
      portion: portionSummary,
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    onSaveMeal(meal);
    onClose();
  };

  // Save directly from search database with exact quantity
  const handleSaveSelectedFromSearch = () => {
    if (!selectedTemplate) return;

    const ratio = selectedQuantityGrams / selectedTemplate.baseWeightGrams;
    const meal: MealItem = {
      id: `meal_${Date.now()}`,
      userId,
      date: new Date().toISOString().split('T')[0],
      mealType,
      name: selectedTemplate.name,
      portion: `${selectedQuantityGrams}g`,
      calories: Math.round(selectedTemplate.calories * ratio),
      protein: Math.round(selectedTemplate.protein * ratio * 10) / 10,
      carbs: Math.round(selectedTemplate.carbs * ratio * 10) / 10,
      fat: Math.round(selectedTemplate.fat * ratio * 10) / 10,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    onSaveMeal(meal);
    setSelectedTemplate(null);
    onClose();
  };

  // Quick log favorite
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-xl clay-card rounded-clay-card p-5 sm:p-7 shadow-2xl relative text-left max-h-[92vh] flex flex-col my-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 clay-pebble w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-90 z-10"
              aria-label="Close add food"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl clay-card-lime text-clay-text flex items-center justify-center font-bold shadow-sm">
                <Utensils className="w-6 h-6 stroke-[2.3]" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-clay-text dark:text-white font-heading tracking-tight">
                  Add Food & Exact Quantities
                </h3>
                <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400">
                  Custom multi-ingredient meal builder, gram scaling & search
                </span>
              </div>
            </div>

            {/* Meal Type Pill Selector (Breakfast, Lunch, Dinner, Snack) */}
            <div className="clay-sunken p-1.5 rounded-full flex gap-1 mb-4">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-heading font-black capitalize transition active:scale-95 text-center ${
                    mealType === type
                      ? 'clay-btn-lime text-clay-text scale-[1.02]'
                      : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Mode Tabs */}
            <div className="clay-sunken p-1.5 rounded-2xl flex gap-1.5 mb-5">
              <button
                type="button"
                onClick={() => setTab('manual')}
                className={`flex-1 py-2 rounded-xl text-xs font-heading font-black transition flex items-center justify-center gap-1.5 ${
                  tab === 'manual'
                    ? 'clay-btn-lime text-clay-text'
                    : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Manual Food & Quantity Builder</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('search')}
                className={`flex-1 py-2 rounded-xl text-xs font-heading font-black transition flex items-center justify-center gap-1.5 ${
                  tab === 'search'
                    ? 'clay-btn-lime text-clay-text'
                    : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Food Database</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('favorites')}
                className={`flex-1 py-2 rounded-xl text-xs font-heading font-black transition flex items-center justify-center gap-1.5 ${
                  tab === 'favorites'
                    ? 'clay-btn-lime text-clay-text'
                    : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Favorites</span>
              </button>
            </div>

            {/* TAB 1: MANUAL FOOD & QUANTITY BUILDER */}
            {tab === 'manual' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Meal Title Input */}
                <div>
                  <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Meal Title (e.g. Oatmeal with Banana & Peanut Butter)
                  </label>
                  <input
                    type="text"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="e.g. Morning Oats Bowl"
                    className="clay-input w-full px-4 py-2.5 text-sm font-heading font-black text-clay-text dark:text-white rounded-2xl"
                  />
                </div>

                {/* Quick Presets Chips */}
                <div>
                  <span className="text-[11px] font-heading font-black text-clay-text/70 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Quick Food Presets (Tap to auto-fill macros):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {FOOD_DATABASE.slice(0, 8).map((food) => (
                      <button
                        key={food.name}
                        type="button"
                        onClick={() => handlePickQuickPreset(food)}
                        className="px-2.5 py-1 rounded-xl clay-btn text-[11px] font-heading font-bold text-clay-text dark:text-slate-200 active:scale-95 transition"
                      >
                        + {food.name} ({food.baseWeightGrams}g)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ingredient Input Box */}
                <div className="p-4 rounded-2xl clay-card-flat space-y-3 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs font-heading font-black text-clay-text dark:text-white block uppercase tracking-wider">
                    Add Food Item & Exact Quantity:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Food Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-heading font-bold text-clay-text/60 dark:text-slate-400 uppercase mb-1">
                        Food / Ingredient Name
                      </label>
                      <input
                        type="text"
                        value={inputFoodName}
                        onChange={(e) => setInputFoodName(e.target.value)}
                        placeholder="e.g. Rolled Oats or Peanut Butter"
                        className="clay-input w-full px-3 py-2 text-xs font-bold text-clay-text dark:text-white rounded-xl"
                      />
                    </div>

                    {/* Quantity & Unit */}
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-clay-text/60 dark:text-slate-400 uppercase mb-1">
                        Quantity & Unit
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          value={inputQuantity}
                          onChange={(e) => handleQuantityChange(Number(e.target.value))}
                          className="clay-input w-20 px-2.5 py-2 text-xs font-mono font-bold text-clay-text dark:text-white rounded-xl"
                        />
                        <select
                          value={inputUnit}
                          onChange={(e) => setInputUnit(e.target.value)}
                          className="clay-input flex-1 px-2 py-2 text-xs font-bold text-clay-text dark:text-white rounded-xl"
                        >
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="tbsp">tbsp</option>
                          <option value="medium">piece</option>
                          <option value="cup">cup</option>
                          <option value="servings">serving</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Macros for this item */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-rose-500 block">Calories</span>
                      <input
                        type="number"
                        min={0}
                        value={inputCalories}
                        onChange={(e) => setInputCalories(Number(e.target.value))}
                        className="clay-input w-full px-2 py-1 text-center text-xs font-mono font-bold text-clay-coral-dark dark:text-clay-coral rounded-xl"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-coral-500 block">Protein (g)</span>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        value={inputProtein}
                        onChange={(e) => setInputProtein(Number(e.target.value))}
                        className="clay-input w-full px-2 py-1 text-center text-xs font-mono font-bold text-clay-text dark:text-white rounded-xl"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-500 block">Carbs (g)</span>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        value={inputCarbs}
                        onChange={(e) => setInputCarbs(Number(e.target.value))}
                        className="clay-input w-full px-2 py-1 text-center text-xs font-mono font-bold text-clay-text dark:text-white rounded-xl"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-sky-500 block">Fat (g)</span>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        value={inputFat}
                        onChange={(e) => setInputFat(Number(e.target.value))}
                        className="clay-input w-full px-2 py-1 text-center text-xs font-mono font-bold text-clay-text dark:text-white rounded-xl"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    disabled={!inputFoodName.trim()}
                    className="w-full py-2.5 rounded-xl clay-btn-sky text-clay-text font-heading font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add Item to Meal ({inputQuantity}{inputUnit} {inputFoodName || 'Item'})</span>
                  </button>
                </div>

                {/* Composed Meal Items List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-heading font-black text-clay-text dark:text-white uppercase tracking-wider">
                      Meal Ingredients ({ingredients.length})
                    </span>
                    <span className="text-[11px] font-mono font-black text-clay-coral-dark dark:text-clay-coral">
                      Total: {totalCalories} kcal
                    </span>
                  </div>

                  {ingredients.length === 0 ? (
                    <div className="p-4 rounded-2xl clay-sunken text-center text-xs text-slate-400">
                      No ingredients added yet. Pick a preset above or type an ingredient name with quantity.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ingredients.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl clay-card-flat flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-heading font-black text-clay-text dark:text-white block truncate">
                              {item.name}
                            </span>
                            <span className="text-[11px] font-bold text-clay-text/60 dark:text-slate-400 font-mono">
                              {item.quantity}{item.unit} • {item.protein}g P • {item.carbs}g C • {item.fat}g F
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-black text-clay-coral-dark dark:text-clay-coral text-sm">
                              {item.calories} kcal
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(item.id)}
                              className="w-7 h-7 rounded-lg clay-btn flex items-center justify-center text-rose-500 hover:text-rose-700 active:scale-90"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Meal Summary Banner */}
                <div className="p-4 rounded-2xl clay-card-lime flex items-center justify-between gap-3 text-clay-text">
                  <div>
                    <span className="text-[10px] font-heading font-black uppercase tracking-wider block text-slate-800">
                      Total {mealType.toUpperCase()} Nutrition
                    </span>
                    <span className="text-2xl font-heading font-black font-mono block">
                      {totalCalories} <span className="text-xs font-bold font-sans">kcal</span>
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs font-bold space-y-0.5 text-slate-800">
                    <div>Protein: <span className="font-black">{totalProtein}g</span></div>
                    <div>Carbs: <span className="font-black">{totalCarbs}g</span></div>
                    <div>Fats: <span className="font-black">{totalFat}g</span></div>
                  </div>
                </div>

                {/* Save Composed Meal Button */}
                <button
                  type="button"
                  onClick={handleSaveComposedMeal}
                  disabled={ingredients.length === 0}
                  className="w-full py-4 rounded-clay-btn clay-btn-lime font-heading font-black text-clay-text flex items-center justify-center gap-2 active:scale-95 transition text-sm shadow-md disabled:opacity-50"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Log Entire Meal ({totalCalories} kcal to {mealType})</span>
                </button>
              </div>
            )}

            {/* TAB 2: SEARCH DATABASE WITH QUANTITY SCALER */}
            {tab === 'search' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search foods (oats, banana, peanut butter, chicken...)"
                    className="clay-input w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-clay-text dark:text-white"
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategoryFilter(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-heading font-black whitespace-nowrap transition active:scale-95 ${
                        categoryFilter === c
                          ? 'clay-btn-lime text-clay-text'
                          : 'clay-btn text-clay-text/60 dark:text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Selected Food Quantity Customizer */}
                {selectedTemplate && (
                  <div className="p-4 rounded-2xl clay-card-lime space-y-3 text-clay-text">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-black text-sm block">
                        Customize Quantity for {selectedTemplate.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate(null)}
                        className="text-xs font-bold underline"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold">Portion in Grams:</span>
                      <input
                        type="number"
                        min={10}
                        step={10}
                        value={selectedQuantityGrams}
                        onChange={(e) => setSelectedQuantityGrams(Number(e.target.value))}
                        className="clay-input w-24 px-3 py-1.5 text-center font-mono font-black text-sm text-clay-text rounded-xl"
                      />
                      <span className="font-mono text-sm font-black">
                        = {Math.round(selectedTemplate.calories * (selectedQuantityGrams / selectedTemplate.baseWeightGrams))} kcal
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSelectedFromSearch}
                      className="w-full py-3 rounded-xl clay-btn-sky font-heading font-black text-xs text-clay-text flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Log {selectedQuantityGrams}g to {mealType}</span>
                    </button>
                  </div>
                )}

                {/* Food List */}
                <div className="space-y-2">
                  {filteredFoods.map((item) => (
                    <div
                      key={item.name}
                      onClick={() => {
                        setSelectedTemplate(item);
                        setSelectedQuantityGrams(item.baseWeightGrams);
                      }}
                      className="p-3 rounded-2xl clay-card-flat flex items-center justify-between gap-3 text-xs cursor-pointer hover:scale-[1.01] transition"
                    >
                      <div>
                        <span className="font-heading font-black text-clay-text dark:text-white block">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-bold text-clay-text/60 dark:text-slate-400 font-mono">
                          {item.portion} • {item.protein}g P • {item.carbs}g C • {item.fat}g F
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-clay-coral-dark dark:text-clay-coral">
                          {item.calories} kcal
                        </span>
                        <div className="clay-pebble w-7 h-7 rounded-xl flex items-center justify-center text-clay-text">
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: FAVORITES */}
            {tab === 'favorites' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {favoriteMeals.length === 0 ? (
                  <div className="p-8 rounded-2xl clay-sunken text-center text-xs text-slate-400">
                    No favorite meals saved yet. Click the star icon on any logged meal to save it for 1-click logging!
                  </div>
                ) : (
                  favoriteMeals.map((fav) => (
                    <div
                      key={fav.id}
                      onClick={() => handleSelectFavorite(fav)}
                      className="p-3 rounded-2xl clay-card-flat flex items-center justify-between gap-3 text-xs cursor-pointer hover:scale-[1.01] transition"
                    >
                      <div>
                        <span className="font-heading font-black text-clay-text dark:text-white block">
                          {fav.name}
                        </span>
                        <span className="text-[11px] font-bold text-clay-text/60 dark:text-slate-400 font-mono">
                          {fav.portion} • {fav.protein}g P • {fav.carbs}g C • {fav.fat}g F
                        </span>
                      </div>
                      <span className="font-mono font-black text-clay-coral-dark dark:text-clay-coral">
                        {fav.calories} kcal
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
