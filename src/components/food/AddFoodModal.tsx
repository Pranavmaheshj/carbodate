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
  Edit2,
  CheckCircle2,
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
  onOpenAiScan?: () => void;
}

export interface MealIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  userId,
  defaultMealType = 'breakfast',
  favoriteMeals = [],
  onOpenAiScan,
}) => {
  const [tab, setTab] = useState<'manual' | 'search' | 'favorites'>('manual');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [mealName, setMealName] = useState<string>('Oats & Banana Breakfast Bowl');

  // Multi-item meal builder state with realistic starting defaults
  const [ingredients, setIngredients] = useState<MealIngredient[]>([
    {
      id: 'ing_1',
      name: 'High Protein Oats',
      quantity: 50,
      unit: 'g',
      calories: 205,
      protein: 12.25,
      carbs: 31.0,
      fiber: 5.5,
      fat: 3.8,
    },
    {
      id: 'ing_2',
      name: 'Fresh Banana',
      quantity: 1,
      unit: 'medium',
      calories: 105,
      protein: 1.3,
      carbs: 27.0,
      fiber: 3.1,
      fat: 0.3,
    },
    {
      id: 'ing_3',
      name: 'Natural Peanut Butter',
      quantity: 20,
      unit: 'g',
      calories: 120,
      protein: 5.5,
      carbs: 4.0,
      fiber: 1.6,
      fat: 10.0,
    },
  ]);

  // Form inputs for adding a new item to the meal builder
  const [inputFoodName, setInputFoodName] = useState<string>('High Protein Oats');
  const [inputQuantity, setInputQuantity] = useState<number>(50);
  const [inputUnit, setInputUnit] = useState<string>('g');
  const [inputCalories, setInputCalories] = useState<number>(205);
  const [inputProtein, setInputProtein] = useState<number>(12.25);
  const [inputCarbs, setInputCarbs] = useState<number>(31.0);
  const [inputFiber, setInputFiber] = useState<number>(5.5);
  const [inputFat, setInputFat] = useState<number>(3.8);

  // In-line editing state for existing ingredients
  const [editingId, setEditingId] = useState<string | null>(null);

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
  const totalProtein = Math.round(ingredients.reduce((sum, item) => sum + item.protein, 0) * 100) / 100;
  const totalCarbs = Math.round(ingredients.reduce((sum, item) => sum + item.carbs, 0) * 10) / 10;
  const totalFiber = Math.round(ingredients.reduce((sum, item) => sum + item.fiber, 0) * 10) / 10;
  const totalFat = Math.round(ingredients.reduce((sum, item) => sum + item.fat, 0) * 10) / 10;

  // Add ingredient into meal builder
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
      fiber: Math.max(0, inputFiber),
      fat: Math.max(0, inputFat),
    };

    setIngredients([...ingredients, newIng]);
    setInputFoodName('');
    setInputQuantity(100);
    setInputCalories(150);
    setInputProtein(10);
    setInputCarbs(18);
    setInputFiber(3);
    setInputFat(4);
  };

  // Remove an ingredient
  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((item) => item.id !== id));
  };

  // Update an already-added ingredient directly
  const handleUpdateExistingIngredient = (
    id: string,
    field: keyof MealIngredient,
    value: string | number
  ) => {
    setIngredients(
      ingredients.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Quick preset chips that auto-calculate macros based on quantity
  const handlePickQuickPreset = (template: FoodItemTemplate) => {
    setInputFoodName(template.name);
    setInputUnit('g');
    setInputQuantity(template.baseWeightGrams);
    setInputCalories(template.calories);
    setInputProtein(template.protein);
    setInputCarbs(template.carbs);
    setInputFiber(template.fiber);
    setInputFat(template.fat);
  };

  // Recalculate input macros when quantity changes for a known database item
  const handleQuantityChange = (newQty: number) => {
    setInputQuantity(newQty);
    const matched = FOOD_DATABASE.find(
      (f) => f.name.toLowerCase() === inputFoodName.trim().toLowerCase()
    );
    if (matched && matched.baseWeightGrams > 0) {
      const ratio = newQty / matched.baseWeightGrams;
      setInputCalories(Math.round(matched.calories * ratio));
      setInputProtein(Math.round(matched.protein * ratio * 100) / 100);
      setInputCarbs(Math.round(matched.carbs * ratio * 10) / 10);
      setInputFiber(Math.round(matched.fiber * ratio * 10) / 10);
      setInputFat(Math.round(matched.fat * ratio * 10) / 10);
    }
  };

  // Add item from database search into the multi-item builder
  const handleAddTemplateToBuilder = (template: FoodItemTemplate, grams: number) => {
    const ratio = grams / template.baseWeightGrams;
    const newIng: MealIngredient = {
      id: `ing_${Date.now()}_${Math.random()}`,
      name: template.name,
      quantity: grams,
      unit: 'g',
      calories: Math.round(template.calories * ratio),
      protein: Math.round(template.protein * ratio * 100) / 100,
      carbs: Math.round(template.carbs * ratio * 10) / 10,
      fiber: Math.round(template.fiber * ratio * 10) / 10,
      fat: Math.round(template.fat * ratio * 10) / 10,
    };
    setIngredients([...ingredients, newIng]);
    setSelectedTemplate(null);
    setTab('manual'); // Return to builder so user can see and edit the item!
  };

  // Save the entire composed meal to the user's daily diary
  const handleSaveComposedMeal = () => {
    if (ingredients.length === 0) return;

    const portionSummary = ingredients
      .map((i) => `${i.quantity}${i.unit} ${i.name}`)
      .join(' + ');

    const finalTitle =
      mealName && mealName.trim() !== ''
        ? mealName.trim()
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
      fiber: totalFiber,
      fat: totalFat,
      isFavorite: false,
      detectedIngredients: ingredients.map(
        (i) => `${i.name} (${i.quantity}${i.unit}): ${i.calories} kcal, ${i.protein}g P, ${i.carbs}g C, ${i.fiber}g Fiber, ${i.fat}g F`
      ),
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
      protein: Math.round(selectedTemplate.protein * ratio * 100) / 100,
      carbs: Math.round(selectedTemplate.carbs * ratio * 10) / 10,
      fiber: Math.round(selectedTemplate.fiber * ratio * 10) / 10,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl clay-card rounded-clay-card p-5 sm:p-7 shadow-2xl relative text-left my-auto max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 clay-pebble w-9 h-9 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-90 z-20"
              aria-label="Close add food"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header - Always Fixed & Visible */}
            <div className="flex items-center gap-3.5 mb-4 pr-10 flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl clay-card-lime text-clay-text flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                <Utensils className="w-6 h-6 stroke-[2.3]" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-clay-text dark:text-white font-heading tracking-tight">
                  Add Food & Exact Quantities
                </h3>
                <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400 block">
                  Add custom food items, edit Carbs, Fiber & Protein live, or log composed bowls
                </span>
              </div>
            </div>

            {/* Meal Type Pill Selector - Fixed & Visible */}
            <div className="clay-sunken p-1.5 rounded-2xl flex gap-1 mb-4 flex-shrink-0">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-heading font-black capitalize transition active:scale-95 text-center ${
                    mealType === type
                      ? 'clay-btn-lime text-clay-text scale-[1.02]'
                      : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Navigation Tabs - Fixed & Visible */}
            <div className="clay-sunken p-1.5 rounded-2xl flex gap-1.5 mb-4 flex-shrink-0">
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
                <span>Add My Own Food</span>
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

            {/* TAB 1: ADD MY OWN FOOD & QUANTITY BUILDER */}
            {tab === 'manual' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Meal Title / Name */}
                <div>
                  <label className="block text-[11px] font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Meal / Recipe Title
                  </label>
                  <input
                    type="text"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="e.g. Oats with Banana & 20g Peanut Butter"
                    className="clay-input w-full px-4 py-2.5 text-sm font-heading font-black text-clay-text dark:text-white rounded-2xl"
                  />
                </div>

                {/* Quick Food Presets (Tap to fill & scale) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-heading font-black text-clay-text/70 dark:text-slate-400 uppercase tracking-wider block">
                      Quick Presets (Tap to auto-fill & customize):
                    </span>
                    {onOpenAiScan && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAiScan();
                        }}
                        className="text-[11px] font-heading font-bold text-clay-lime-dark dark:text-clay-lime hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Use AI Vision</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {FOOD_DATABASE.slice(0, 9).map((food) => (
                      <button
                        key={food.name}
                        type="button"
                        onClick={() => handlePickQuickPreset(food)}
                        className={`px-2.5 py-1 rounded-xl clay-btn text-[11px] font-heading font-bold active:scale-95 transition ${
                          inputFoodName.toLowerCase() === food.name.toLowerCase()
                            ? 'clay-btn-lime text-clay-text font-black'
                            : 'text-clay-text dark:text-slate-200'
                        }`}
                      >
                        + {food.name} ({food.baseWeightGrams}g)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Food & Quantity Input Card */}
                <div className="p-4 sm:p-5 rounded-3xl clay-card-flat space-y-3.5 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-black text-clay-text dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-clay-lime-dark dark:text-clay-lime" />
                      <span>Custom Food & Editable Macros:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Editable Carbs, Fiber, Protein & Fats
                    </span>
                  </div>

                  {/* Row 1: Food Name + Quantity + Unit */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-heading font-bold text-clay-text/60 dark:text-slate-400 uppercase mb-1">
                        Food / Brand Name
                      </label>
                      <input
                        type="text"
                        value={inputFoodName}
                        onChange={(e) => setInputFoodName(e.target.value)}
                        placeholder="e.g. High Protein Oats or Peanut Butter"
                        className="clay-input w-full px-3 py-2 text-xs font-bold text-clay-text dark:text-white rounded-xl"
                      />
                    </div>

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
                          className="clay-input w-20 px-2.5 py-2 text-xs font-mono font-bold text-clay-text dark:text-white rounded-xl text-center"
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

                  {/* Row 2: Editable Calories, Protein, Carbs, Fiber, Fat */}
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-clay-text/60 dark:text-slate-400 uppercase mb-1.5">
                      Live Calculated Macros (Freely Edit to match your brand):
                    </label>

                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {/* Calories */}
                      <div className="clay-sunken p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-rose-500 block mb-0.5">Calories</span>
                        <input
                          type="number"
                          min={0}
                          value={inputCalories}
                          onChange={(e) => setInputCalories(Number(e.target.value))}
                          className="w-full bg-transparent text-center text-xs font-mono font-black text-clay-coral-dark dark:text-clay-coral focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-400 block font-bold">kcal</span>
                      </div>

                      {/* Protein */}
                      <div className="clay-sunken p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-coral-600 dark:text-coral-400 block mb-0.5">
                          Protein
                        </span>
                        <input
                          type="number"
                          step={0.05}
                          min={0}
                          value={inputProtein}
                          onChange={(e) => setInputProtein(Number(e.target.value))}
                          className="w-full bg-transparent text-center text-xs font-mono font-black text-clay-text dark:text-white focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-400 block font-bold">grams</span>
                      </div>

                      {/* Carbs */}
                      <div className="clay-sunken p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-500 block mb-0.5">Carbs</span>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={inputCarbs}
                          onChange={(e) => setInputCarbs(Number(e.target.value))}
                          className="w-full bg-transparent text-center text-xs font-mono font-black text-clay-text dark:text-white focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-400 block font-bold">grams</span>
                      </div>

                      {/* Fiber */}
                      <div className="clay-sunken p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                          Fiber
                        </span>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={inputFiber}
                          onChange={(e) => setInputFiber(Number(e.target.value))}
                          className="w-full bg-transparent text-center text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-400 block font-bold">grams</span>
                      </div>

                      {/* Fat */}
                      <div className="clay-sunken p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-sky-500 block mb-0.5">Fat</span>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={inputFat}
                          onChange={(e) => setInputFat(Number(e.target.value))}
                          className="w-full bg-transparent text-center text-xs font-mono font-black text-clay-text dark:text-white focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-400 block font-bold">grams</span>
                      </div>
                    </div>
                  </div>

                  {/* Add Item Button */}
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    disabled={!inputFoodName.trim()}
                    className="w-full py-3 rounded-2xl clay-btn-sky text-clay-text font-heading font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition disabled:opacity-50 shadow-sm"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>
                      Add to Meal ({inputQuantity}{inputUnit} {inputFoodName || 'Item'} • {inputCalories} kcal)
                    </span>
                  </button>
                </div>

                {/* Composed Meal Items List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-heading font-black text-clay-text dark:text-white uppercase tracking-wider">
                      Ingredients in this Meal ({ingredients.length})
                    </span>
                    <span className="text-[11px] font-mono font-black text-clay-coral-dark dark:text-clay-coral">
                      Total: {totalCalories} kcal
                    </span>
                  </div>

                  {ingredients.length === 0 ? (
                    <div className="p-5 rounded-2xl clay-sunken text-center text-xs text-slate-400 font-bold">
                      No ingredients added yet. Enter a food name and quantity above to build your meal.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {ingredients.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl clay-card-flat flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            {editingId === item.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) =>
                                    handleUpdateExistingIngredient(item.id, 'name', e.target.value)
                                  }
                                  className="clay-input w-full px-2 py-1 text-xs font-bold rounded-lg"
                                />
                                <div className="grid grid-cols-5 gap-1 text-[10px] font-mono font-bold">
                                  <div>
                                    <span className="text-rose-500 block">Kcal</span>
                                    <input
                                      type="number"
                                      value={item.calories}
                                      onChange={(e) =>
                                        handleUpdateExistingIngredient(
                                          item.id,
                                          'calories',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="clay-input w-full px-1 py-0.5 text-center rounded"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-coral-500 block">Protein</span>
                                    <input
                                      type="number"
                                      step={0.1}
                                      value={item.protein}
                                      onChange={(e) =>
                                        handleUpdateExistingIngredient(
                                          item.id,
                                          'protein',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="clay-input w-full px-1 py-0.5 text-center rounded"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-amber-500 block">Carbs</span>
                                    <input
                                      type="number"
                                      step={0.1}
                                      value={item.carbs}
                                      onChange={(e) =>
                                        handleUpdateExistingIngredient(
                                          item.id,
                                          'carbs',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="clay-input w-full px-1 py-0.5 text-center rounded"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-emerald-500 block">Fiber</span>
                                    <input
                                      type="number"
                                      step={0.1}
                                      value={item.fiber}
                                      onChange={(e) =>
                                        handleUpdateExistingIngredient(
                                          item.id,
                                          'fiber',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="clay-input w-full px-1 py-0.5 text-center rounded"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-sky-500 block">Fat</span>
                                    <input
                                      type="number"
                                      step={0.1}
                                      value={item.fat}
                                      onChange={(e) =>
                                        handleUpdateExistingIngredient(
                                          item.id,
                                          'fat',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="clay-input w-full px-1 py-0.5 text-center rounded"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="font-heading font-black text-clay-text dark:text-white block text-sm">
                                  {item.name}
                                </span>
                                <div className="text-[11px] font-bold text-clay-text/60 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-clay-text dark:text-slate-200">
                                    {item.quantity}{item.unit}
                                  </span>
                                  <span>•</span>
                                  <span className="text-coral-600 dark:text-coral-400">{item.protein}g P</span>
                                  <span>•</span>
                                  <span className="text-amber-600 dark:text-amber-400">{item.carbs}g C</span>
                                  <span>•</span>
                                  <span className="text-emerald-600 dark:text-emerald-400">{item.fiber}g Fiber</span>
                                  <span>•</span>
                                  <span className="text-sky-600 dark:text-sky-400">{item.fat}g F</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-clay-coral-dark dark:text-clay-coral text-sm">
                              {item.calories} kcal
                            </span>

                            <button
                              type="button"
                              onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                              className="w-8 h-8 rounded-xl clay-pebble flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 active:scale-90"
                              title={editingId === item.id ? 'Done editing' : 'Edit macros'}
                            >
                              {editingId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                              ) : (
                                <Edit2 className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(item.id)}
                              className="w-8 h-8 rounded-xl clay-pebble flex items-center justify-center text-rose-500 hover:text-rose-700 active:scale-90"
                              title="Remove ingredient"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Composed Meal Nutrition Card */}
                <div className="p-4 sm:p-5 rounded-3xl clay-card-lime text-clay-text shadow-sm">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider block text-slate-800">
                        Total {mealType.toUpperCase()} Nutrition
                      </span>
                      <span className="text-3xl font-heading font-black font-mono block">
                        {totalCalories}{' '}
                        <span className="text-xs font-bold font-sans">kcal</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-slate-800 font-mono text-xs">
                      <div className="bg-white/40 dark:bg-black/10 px-2 py-1 rounded-xl">
                        <span className="text-[10px] block font-heading font-bold">Protein</span>
                        <span className="font-black text-sm">{totalProtein}g</span>
                      </div>
                      <div className="bg-white/40 dark:bg-black/10 px-2 py-1 rounded-xl">
                        <span className="text-[10px] block font-heading font-bold">Carbs</span>
                        <span className="font-black text-sm">{totalCarbs}g</span>
                      </div>
                      <div className="bg-white/40 dark:bg-black/10 px-2 py-1 rounded-xl">
                        <span className="text-[10px] block font-heading font-bold text-emerald-800 dark:text-emerald-300">Fiber</span>
                        <span className="font-black text-sm text-emerald-900 dark:text-emerald-200">{totalFiber}g</span>
                      </div>
                      <div className="bg-white/40 dark:bg-black/10 px-2 py-1 rounded-xl">
                        <span className="text-[10px] block font-heading font-bold">Fat</span>
                        <span className="font-black text-sm">{totalFat}g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Meal Button */}
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

            {/* TAB 2: SEARCH FOOD DATABASE WITH VISIBLE CATEGORIES & SCALER */}
            {tab === 'search' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search foods (High Protein Oats, Peanut Butter, Salmon...)"
                    className="clay-input w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-clay-text dark:text-white"
                  />
                </div>

                {/* Category Pills - Using flex-wrap so NO category is clipped or hidden! */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategoryFilter(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-heading font-black transition active:scale-95 ${
                        categoryFilter === c
                          ? 'clay-btn-lime text-clay-text shadow-sm'
                          : 'clay-btn text-clay-text/70 dark:text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Selected Food Customizer */}
                {selectedTemplate && (
                  <div className="p-4 sm:p-5 rounded-3xl clay-card-lime space-y-3.5 text-clay-text shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-black text-sm block">
                        Customize Portion for {selectedTemplate.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate(null)}
                        className="text-xs font-bold underline text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold">Portion in Grams:</span>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={selectedQuantityGrams}
                        onChange={(e) => setSelectedQuantityGrams(Number(e.target.value))}
                        className="clay-input w-24 px-3 py-1.5 text-center font-mono font-black text-sm text-clay-text rounded-xl"
                      />
                      <span className="font-mono text-sm font-black">
                        ={' '}
                        {Math.round(
                          selectedTemplate.calories *
                            (selectedQuantityGrams / selectedTemplate.baseWeightGrams)
                        )}{' '}
                        kcal
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono font-bold bg-white/40 dark:bg-black/10 p-2.5 rounded-2xl">
                      <div>
                        <span className="text-[10px] block font-heading">Protein</span>
                        <span>
                          {Math.round(
                            selectedTemplate.protein *
                              (selectedQuantityGrams / selectedTemplate.baseWeightGrams) *
                              10
                          ) / 10}
                          g
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] block font-heading">Carbs</span>
                        <span>
                          {Math.round(
                            selectedTemplate.carbs *
                              (selectedQuantityGrams / selectedTemplate.baseWeightGrams) *
                              10
                          ) / 10}
                          g
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] block font-heading text-emerald-800">Fiber</span>
                        <span className="text-emerald-900">
                          {Math.round(
                            selectedTemplate.fiber *
                              (selectedQuantityGrams / selectedTemplate.baseWeightGrams) *
                              10
                          ) / 10}
                          g
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] block font-heading">Fat</span>
                        <span>
                          {Math.round(
                            selectedTemplate.fat *
                              (selectedQuantityGrams / selectedTemplate.baseWeightGrams) *
                              10
                          ) / 10}
                          g
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleAddTemplateToBuilder(selectedTemplate, selectedQuantityGrams)
                        }
                        className="flex-1 py-3 rounded-xl clay-btn-sky font-heading font-black text-xs text-clay-text flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Add to My Meal Builder</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveSelectedFromSearch}
                        className="flex-1 py-3 rounded-xl clay-btn font-heading font-black text-xs text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Log Directly to {mealType}</span>
                      </button>
                    </div>
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
                      className="p-3.5 rounded-2xl clay-card-flat flex items-center justify-between gap-3 text-xs cursor-pointer hover:scale-[1.01] transition"
                    >
                      <div className="min-w-0">
                        <span className="font-heading font-black text-clay-text dark:text-white block text-sm truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-bold text-clay-text/60 dark:text-slate-400 font-mono block mt-0.5">
                          {item.portion} • {item.protein}g P • {item.carbs}g C • {item.fiber}g Fiber • {item.fat}g F
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span className="font-mono font-black text-clay-coral-dark dark:text-clay-coral text-sm">
                          {item.calories} kcal
                        </span>
                        <div className="clay-pebble w-8 h-8 rounded-xl flex items-center justify-center text-clay-text">
                          <Plus className="w-4 h-4 stroke-[3]" />
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
                  <div className="p-8 rounded-2xl clay-sunken text-center text-xs text-slate-400 font-bold space-y-2">
                    <Star className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                    <div>No favorite meals saved yet.</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      Click the star icon on any logged meal to save it for quick 1-click logging!
                    </div>
                  </div>
                ) : (
                  favoriteMeals.map((fav) => (
                    <div
                      key={fav.id}
                      onClick={() => handleSelectFavorite(fav)}
                      className="p-3.5 rounded-2xl clay-card-flat flex items-center justify-between gap-3 text-xs cursor-pointer hover:scale-[1.01] transition"
                    >
                      <div className="min-w-0">
                        <span className="font-heading font-black text-clay-text dark:text-white block text-sm truncate">
                          {fav.name}
                        </span>
                        <span className="text-[11px] font-bold text-clay-text/60 dark:text-slate-400 font-mono block mt-0.5">
                          {fav.portion} • {fav.protein}g P • {fav.carbs}g C • {fav.fiber || 0}g Fiber • {fav.fat}g F
                        </span>
                      </div>
                      <span className="font-mono font-black text-clay-coral-dark dark:text-clay-coral text-sm">
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
