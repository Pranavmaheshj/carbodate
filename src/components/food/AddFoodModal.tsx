import React, { useState, useEffect } from 'react';
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
  Zap,
} from 'lucide-react';
import { MealItem, MealType } from '../../types';
import {
  FOOD_DATABASE,
  FoodItemTemplate,
  calculateFoodNutrition,
  extractFoodQueryAndQuantity,
  findFoodDatabaseMatch,
} from '../../data/foodDatabase';
import { calculateMealTextWithAi } from '../../services/aiVision';

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
  const [tab, setTab] = useState<'ai' | 'manual' | 'search' | 'favorites'>('ai');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [mealName, setMealName] = useState<string>('');

  // AI Natural Language Meal Logger States
  const [aiMealText, setAiMealText] = useState<string>('');
  const [isCalculatingAi, setIsCalculatingAi] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [aiModelUsed, setAiModelUsed] = useState<string>('');

  // Fast suggestion chips tailored to each meal
  const mealSuggestions: Record<MealType, string[]> = {
    dinner: [
      '3 Rotis with Paneer Butter Masala, 1 bowl Yellow Dal and Cucumber Salad',
      'Grilled Chicken Breast (200g) with 1 cup Steamed Rice and Broccoli',
      '2 Masala Dosas with Coconut Chutney and Sambar',
      '2 Aloo Parathas with 1 cup Curd and Pickle',
    ],
    breakfast: [
      '3 Steamed Idlis with Sambar and Coconut Chutney',
      '2 Masala Dosas with Sambar and Chutney',
      'Oatmeal Bowl (50g oats) with 1 Banana, 20g Peanut Butter and Milk',
      '3 Egg Omelette with 2 slices of Whole Wheat Toast',
    ],
    lunch: [
      '1 Bowl Rice with Dal Tadka, Mixed Vegetable Sabzi and Curd',
      '2 Rotis with Chicken Curry and Fresh Salad',
      'Curd Rice with Pickle and 1 Roasted Papad',
      'Rajma Chawal (1 bowl rajma + 1 bowl steamed basmati rice)',
    ],
    snack: [
      '1 Cup Milk Tea with 2 Marie Biscuits',
      'Handful Roasted Almonds (25g) and 1 Apple',
      '1 Scoop Whey Protein Shake in Water',
      'Sprouted Moong Chaat with Onion, Tomato and Lemon',
    ],
  };

  // Synchronize mealType when modal opens or defaultMealType changes from section clicked
  useEffect(() => {
    if (isOpen) {
      setMealType(defaultMealType || 'breakfast');
    }
  }, [isOpen, defaultMealType]);

  // Handle calculating meal nutrition via Gemini AI
  const handleCalculateMealWithAi = async (textToCalculate?: string) => {
    const query = (textToCalculate ?? aiMealText).trim();
    if (!query) return;

    setIsCalculatingAi(true);
    try {
      const cuisineContext =
        (typeof localStorage !== 'undefined'
          ? localStorage.getItem('carbodate_cuisine_context')
          : null) || 'Indian / Regional & Global';
      const customApiKey =
        (typeof localStorage !== 'undefined'
          ? localStorage.getItem('carbodate_gemini_api_key')
          : null) || undefined;

      const res = await calculateMealTextWithAi(query, mealType, cuisineContext, customApiKey);

      if (res.items && res.items.length > 0) {
        const generated: MealIngredient[] = res.items.map((it, idx) => ({
          id: `ai_ing_${Date.now()}_${idx}`,
          name: it.name,
          quantity: it.grams || 100,
          unit: it.grams ? 'g' : 'serving',
          calories: it.calories,
          protein: it.protein,
          carbs: it.carbs,
          fiber: it.fiber || 0,
          fat: it.fat,
        }));
        setIngredients(generated);
        setMealName(res.mealTitle);
        setAiInsight(res.insight);
        setAiModelUsed(res.modelUsed || '');
      }
    } catch (err) {
      console.error('AI meal calculation error:', err);
    } finally {
      setIsCalculatingAi(false);
    }
  };

  // Starts completely clean & empty as requested (no pre-set items!)
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);

  // Form inputs for current food item - starts completely empty
  const [inputFoodName, setInputFoodName] = useState<string>('');
  const [inputQuantity, setInputQuantity] = useState<number>(100);
  const [inputUnit, setInputUnit] = useState<string>('g');
  const [inputCalories, setInputCalories] = useState<number>(0);
  const [inputProtein, setInputProtein] = useState<number>(0);
  const [inputCarbs, setInputCarbs] = useState<number>(0);
  const [inputFiber, setInputFiber] = useState<number>(0);
  const [inputFat, setInputFat] = useState<number>(0);

  // Auto-calculated state tracking
  const [autoMatchedTemplate, setAutoMatchedTemplate] = useState<FoodItemTemplate | null>(null);
  const [userHasEditedMacros, setUserHasEditedMacros] = useState<boolean>(false);

  // In-line editing state for existing ingredients
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<FoodItemTemplate | null>(null);
  const [selectedQuantityGrams, setSelectedQuantityGrams] = useState<number>(100);

  const categories = ['All', 'Drinks', 'Snacks', 'Protein', 'Carbs', 'Fats', 'Produce', 'Meals'];

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

  // Multiple candidates for suggestions pill row
  const getSuggestions = (query: string): FoodItemTemplate[] => {
    const { cleanName } = extractFoodQueryAndQuantity(query);
    const q = (cleanName || query).trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return FOOD_DATABASE.filter((f) => {
      const fName = f.name.toLowerCase();
      if (fName.includes(q)) return true;
      const tokens = q.split(/[\s,()/-]+/).filter((t) => t.length >= 2);
      return tokens.some((token) => fName.includes(token));
    }).slice(0, 5);
  };

  // Called when user types into the Food Name field
  const handleFoodNameChange = (name: string) => {
    setInputFoodName(name);

    if (!name.trim()) {
      setAutoMatchedTemplate(null);
      setUserHasEditedMacros(false);
      setInputCalories(0);
      setInputProtein(0);
      setInputCarbs(0);
      setInputFiber(0);
      setInputFat(0);
      return;
    }

    // Check for auto-extracted quantity & unit if user typed e.g. "50g oats" or "200ml coffee"
    const { quantity: extractedQty, unit: extractedUnit } = extractFoodQueryAndQuantity(name);
    let targetQty = inputQuantity;
    let targetUnit = inputUnit;

    if (extractedQty !== null && extractedQty > 0) {
      targetQty = extractedQty;
      setInputQuantity(extractedQty);
    }
    if (extractedUnit !== null) {
      targetUnit = extractedUnit;
      setInputUnit(extractedUnit);
    }

    // Auto-calculate nutrition using our Universal Nutrition Calculator
    const result = calculateFoodNutrition(name, targetQty, targetUnit);

    if (result.matchedTemplate) {
      setAutoMatchedTemplate(result.matchedTemplate);
      // If it's a beverage drink and user is currently on 'g', automatically switch unit to 'ml' for user convenience!
      if (result.matchedTemplate.category === 'Drinks' && targetUnit === 'g' && extractedUnit === null) {
        setInputUnit('ml');
        setInputQuantity(result.matchedTemplate.baseWeightGrams);
        targetUnit = 'ml';
        targetQty = result.matchedTemplate.baseWeightGrams;
      }
    } else {
      setAutoMatchedTemplate(null);
    }

    setUserHasEditedMacros(false);
    setInputCalories(result.calories);
    setInputProtein(result.protein);
    setInputCarbs(result.carbs);
    setInputFiber(result.fiber);
    setInputFat(result.fat);
  };

  // Called when user selects a suggested food match
  const handleSelectSuggestedFood = (food: FoodItemTemplate) => {
    setInputFoodName(food.name);
    setAutoMatchedTemplate(food);
    setUserHasEditedMacros(false);

    // Choose sensible default unit based on category
    const defaultUnit = food.category === 'Drinks' ? 'ml' : 'g';
    setInputUnit(defaultUnit);

    const targetQty = food.baseWeightGrams > 0 ? food.baseWeightGrams : 100;
    setInputQuantity(targetQty);

    const ratio = targetQty / food.baseWeightGrams;
    setInputCalories(Math.round(food.calories * ratio));
    setInputProtein(Math.round(food.protein * ratio * 100) / 100);
    setInputCarbs(Math.round(food.carbs * ratio * 10) / 10);
    setInputFiber(Math.round(food.fiber * ratio * 10) / 10);
    setInputFat(Math.round(food.fat * ratio * 10) / 10);
  };

  // Recalculate input macros when quantity changes
  const handleQuantityChange = (newQty: number) => {
    const safeQty = Math.max(1, newQty);
    setInputQuantity(safeQty);

    if (!userHasEditedMacros && inputFoodName.trim()) {
      const result = calculateFoodNutrition(inputFoodName, safeQty, inputUnit);
      setInputCalories(result.calories);
      setInputProtein(result.protein);
      setInputCarbs(result.carbs);
      setInputFiber(result.fiber);
      setInputFat(result.fat);
    } else if (autoMatchedTemplate && autoMatchedTemplate.baseWeightGrams > 0) {
      const ratio = safeQty / autoMatchedTemplate.baseWeightGrams;
      setInputCalories(Math.round(autoMatchedTemplate.calories * ratio));
      setInputProtein(Math.round(autoMatchedTemplate.protein * ratio * 100) / 100);
      setInputCarbs(Math.round(autoMatchedTemplate.carbs * ratio * 10) / 10);
      setInputFiber(Math.round(autoMatchedTemplate.fiber * ratio * 10) / 10);
      setInputFat(Math.round(autoMatchedTemplate.fat * ratio * 10) / 10);
    }
  };

  // Recalculate input macros when unit changes (e.g. g <-> ml <-> cup)
  const handleUnitChange = (newUnit: string) => {
    setInputUnit(newUnit);

    if (!userHasEditedMacros && inputFoodName.trim()) {
      const result = calculateFoodNutrition(inputFoodName, inputQuantity, newUnit);
      setInputCalories(result.calories);
      setInputProtein(result.protein);
      setInputCarbs(result.carbs);
      setInputFiber(result.fiber);
      setInputFat(result.fat);
    }
  };

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
    setAutoMatchedTemplate(null);
    setUserHasEditedMacros(false);
    setInputQuantity(100);
    setInputCalories(0);
    setInputProtein(0);
    setInputCarbs(0);
    setInputFiber(0);
    setInputFat(0);
  };

  // Universal one-click save: logs any typed item AND/OR composed ingredients directly
  const handleSaveMealNow = () => {
    const itemsToSave: MealIngredient[] = [...ingredients];

    // If user currently has food typed in the input box, include it automatically!
    if (inputFoodName.trim()) {
      itemsToSave.push({
        id: `ing_${Date.now()}_input`,
        name: inputFoodName.trim(),
        quantity: inputQuantity,
        unit: inputUnit,
        calories: Math.max(0, inputCalories),
        protein: Math.max(0, inputProtein),
        carbs: Math.max(0, inputCarbs),
        fiber: Math.max(0, inputFiber),
        fat: Math.max(0, inputFat),
      });
    }

    if (itemsToSave.length === 0) return;

    const totalCals = itemsToSave.reduce((sum, item) => sum + item.calories, 0);
    const totalProt = Math.round(itemsToSave.reduce((sum, item) => sum + item.protein, 0) * 100) / 100;
    const totalCrbs = Math.round(itemsToSave.reduce((sum, item) => sum + item.carbs, 0) * 10) / 10;
    const totalFbr = Math.round(itemsToSave.reduce((sum, item) => sum + item.fiber, 0) * 10) / 10;
    const totalFt = Math.round(itemsToSave.reduce((sum, item) => sum + item.fat, 0) * 10) / 10;

    const finalTitle =
      mealName && mealName.trim() !== ''
        ? mealName.trim()
        : itemsToSave.length === 1
        ? itemsToSave[0].name
        : `${itemsToSave[0].name} with ${itemsToSave.slice(1).map((i) => i.name).join(', ')}`;

    const portionSummary = itemsToSave
      .map((i) => `${i.quantity}${i.unit} ${i.name}`)
      .join(' + ');

    const meal: MealItem = {
      id: `meal_${Date.now()}`,
      userId,
      date: new Date().toISOString().split('T')[0],
      mealType,
      name: finalTitle,
      portion: portionSummary,
      calories: totalCals,
      protein: totalProt,
      carbs: totalCrbs,
      fiber: totalFbr,
      fat: totalFt,
      isFavorite: false,
      detectedIngredients: itemsToSave.map(
        (i) => `${i.name} (${i.quantity}${i.unit}): ${i.calories} kcal, ${i.protein}g P, ${i.carbs}g C, ${i.fiber}g Fiber, ${i.fat}g F`
      ),
      createdAt: new Date().toISOString(),
    };

    onSaveMeal(meal);
    onClose();
  };

  // Quick 1-tap direct log without building a multi-item list
  const handleLogSingleFoodDirectly = () => {
    handleSaveMealNow();
  };

  // Remove an ingredient from builder
  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((item) => item.id !== id));
  };

  // Adjust calorie count on an existing ingredient
  const handleAdjustIngredientCalories = (id: string, delta: number) => {
    setIngredients(
      ingredients.map((item) => {
        if (item.id === id) {
          const newCals = Math.max(0, item.calories + delta);
          const ratio = item.calories > 0 ? newCals / item.calories : 1;
          return {
            ...item,
            calories: newCals,
            protein: Math.round(item.protein * ratio * 10) / 10,
            carbs: Math.round(item.carbs * ratio * 10) / 10,
            fat: Math.round(item.fat * ratio * 10) / 10,
          };
        }
        return item;
      })
    );
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
    setTab('manual');
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

  const suggestions = getSuggestions(inputFoodName);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2.5 sm:p-5 bg-slate-900/70 backdrop-blur-md overflow-y-auto pb-safe">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl clay-card rounded-clay-card p-4 sm:p-7 shadow-2xl relative text-left my-auto h-[90dvh] max-h-[90dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 clay-pebble w-9 h-9 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-90 z-20"
              aria-label="Close add food"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header - Fixed & Fully Visible */}
            <div className="flex items-center gap-3.5 mb-4 pr-10 flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl clay-card-lime text-clay-text flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                <Utensils className="w-6 h-6 stroke-[2.3]" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-clay-text dark:text-white font-heading tracking-tight">
                  Add Food & Exact Quantities
                </h3>
                <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400 block">
                  Type your food to auto-calculate nutrition, customize if needed, or save as it is
                </span>
              </div>
            </div>

            {/* Meal Type Pill Selector - Fixed & Visible */}
            <div className="clay-sunken p-1.5 rounded-2xl flex gap-1 mb-4 flex-shrink-0">
              {[
                { type: 'breakfast' as MealType, label: 'Breakfast' },
                { type: 'lunch' as MealType, label: 'Lunch' },
                { type: 'dinner' as MealType, label: 'Dinner' },
                { type: 'snack' as MealType, label: 'Snacks & Drinks' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-heading font-black transition active:scale-95 text-center ${
                    mealType === type
                      ? 'clay-btn-lime text-clay-text scale-[1.02]'
                      : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Navigation Tabs - Fixed & Visible */}
            <div className="clay-sunken p-1.5 rounded-2xl flex gap-1.5 mb-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setTab('ai')}
                className={`flex-1 py-2 rounded-xl text-xs font-heading font-black transition flex items-center justify-center gap-1.5 ${
                  tab === 'ai'
                    ? 'clay-btn-lime text-clay-text shadow-sm'
                    : 'text-clay-text/60 dark:text-slate-400 hover:text-clay-text'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-lime-400" />
                <span>AI Meal Assistant</span>
              </button>

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
                <span>Custom Items</span>
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
                <span>Database</span>
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

            {/* TAB 0: AI NATURAL MEAL LOGGER (DEFAULT) */}
            {tab === 'ai' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* AI Input Card */}
                <div className="p-4 sm:p-5 rounded-3xl clay-card-flat space-y-3.5 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-black text-clay-text dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-lime-400" />
                      <span>What did you eat for {mealType === 'snack' ? 'Snacks' : mealType}?</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-600" />
                      <span>Natural Language Nutrition</span>
                    </span>
                  </div>

                  {/* Textarea for natural meal description */}
                  <div className="clay-sunken p-3 rounded-2xl">
                    <textarea
                      rows={3}
                      value={aiMealText}
                      onChange={(e) => setAiMealText(e.target.value)}
                      placeholder={
                        mealType === 'dinner'
                          ? 'e.g. 3 rotis with paneer butter masala, 1 bowl dal and cucumber salad'
                          : mealType === 'breakfast'
                          ? 'e.g. 2 masala dosas with coconut chutney and sambar'
                          : mealType === 'lunch'
                          ? 'e.g. 1 bowl rice with dal tadka, mixed veg and curd'
                          : 'e.g. 1 cup milk tea with 2 marie biscuits'
                      }
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-clay-text dark:text-white placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCalculateMealWithAi();
                        }
                      }}
                    />
                  </div>

                  {/* Fast 1-Tap Example Suggestions */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Quick Suggestions (Tap to calculate):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(mealSuggestions[mealType] || mealSuggestions.dinner).map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAiMealText(chip);
                            handleCalculateMealWithAi(chip);
                          }}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-clay-text dark:text-slate-200 transition active:scale-95 text-left border border-slate-200/50 dark:border-slate-700/50"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Calculate Button */}
                  <button
                    type="button"
                    onClick={() => handleCalculateMealWithAi()}
                    disabled={!aiMealText.trim() || isCalculatingAi}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-slate-950 font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isCalculatingAi ? 'animate-spin' : ''}`} />
                    <span>
                      {isCalculatingAi
                        ? 'Calculating Nutrition with Gemini AI...'
                        : '✨ Calculate Nutrition with AI'}
                    </span>
                  </button>
                </div>

                {/* AI Calculated Results Display */}
                {ingredients.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-3xl clay-card space-y-4 border border-slate-200/60 dark:border-slate-700/60">
                    {/* Meal Title & Insight */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Calculated {mealType === 'snack' ? 'Snack' : mealType} Meal
                        </span>
                        {aiModelUsed && (
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {aiModelUsed}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={mealName}
                        onChange={(e) => setMealName(e.target.value)}
                        placeholder="Meal Title"
                        className="w-full bg-transparent font-heading font-black text-base sm:text-lg text-clay-text dark:text-white focus:outline-none border-b border-dashed border-slate-300 dark:border-slate-700 pb-1"
                      />
                      {aiInsight && (
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{aiInsight}</span>
                        </p>
                      )}
                    </div>

                    {/* Macro Summary Grid */}
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div className="clay-sunken p-2 rounded-2xl bg-amber-500/5">
                        <span className="text-[10px] font-bold text-amber-500 block mb-0.5 flex items-center justify-center gap-0.5">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>Calories</span>
                        </span>
                        <span className="text-sm sm:text-base font-mono font-black text-clay-text dark:text-white">
                          {totalCalories}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-bold">kcal</span>
                      </div>

                      <div className="clay-sunken p-2 rounded-2xl bg-cyan-500/5">
                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 block mb-0.5">
                          Protein
                        </span>
                        <span className="text-sm sm:text-base font-mono font-black text-cyan-600 dark:text-cyan-400">
                          {totalProtein}g
                        </span>
                        <span className="text-[9px] text-slate-400 block font-bold">muscle</span>
                      </div>

                      <div className="clay-sunken p-2 rounded-2xl bg-amber-500/5">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                          Carbs
                        </span>
                        <span className="text-sm sm:text-base font-mono font-black text-amber-600 dark:text-amber-400">
                          {totalCarbs}g
                        </span>
                        <span className="text-[9px] text-slate-400 block font-bold">energy</span>
                      </div>

                      <div className="clay-sunken p-2 rounded-2xl bg-emerald-500/5">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                          Fiber
                        </span>
                        <span className="text-sm sm:text-base font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {totalFiber}g
                        </span>
                        <span className="text-[9px] text-slate-400 block font-bold">gut</span>
                      </div>

                      <div className="clay-sunken p-2 rounded-2xl bg-sky-500/5">
                        <span className="text-[10px] font-bold text-sky-500 block mb-0.5">
                          Fat
                        </span>
                        <span className="text-sm sm:text-base font-mono font-black text-sky-500">
                          {totalFat}g
                        </span>
                        <span className="text-[9px] text-slate-400 block font-bold">essential</span>
                      </div>
                    </div>

                    {/* Detected Items List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>Detected Ingredients ({ingredients.length})</span>
                        <span>Adjust portion / calories</span>
                      </div>
                      {ingredients.map((ing) => (
                        <div
                          key={ing.id}
                          className="p-3 rounded-2xl clay-sunken flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-heading font-black text-clay-text dark:text-white block truncate">
                              {ing.name}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 font-mono block">
                              {ing.quantity}{ing.unit} • {ing.protein}g P • {ing.carbs}g C • {ing.fiber}g Fiber • {ing.fat}g F
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAdjustIngredientCalories(ing.id, -20)}
                              className="w-6 h-6 rounded-lg clay-pebble flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white active:scale-90"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-black text-clay-coral-dark dark:text-clay-coral text-xs w-14 text-center">
                              {ing.calories} kcal
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustIngredientCalories(ing.id, +20)}
                              className="w-6 h-6 rounded-lg clay-pebble flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white active:scale-90"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(ing.id)}
                              className="w-6 h-6 rounded-lg clay-pebble text-rose-500 hover:text-rose-700 flex items-center justify-center active:scale-90 ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Big Save Button */}
                    <button
                      type="button"
                      onClick={handleSaveMealNow}
                      className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 font-heading font-black text-sm flex items-center justify-center gap-2.5 active:scale-98 transition shadow-lg cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-lime-400 text-slate-950 dark:bg-slate-950 dark:text-lime-400 flex items-center justify-center font-black shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                      </div>
                      <span>
                        Save & Log to {mealType === 'snack' ? 'SNACKS & DRINKS' : mealType.toUpperCase()} ({totalCalories} kcal)
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: ADD MY OWN FOOD & QUANTITY BUILDER */}
            {tab === 'manual' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Custom Food Input Box with Real-time Auto-Calculation */}
                <div className="p-4 sm:p-5 rounded-3xl clay-card-flat space-y-3.5 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-black text-clay-text dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-clay-lime-dark dark:text-clay-lime" />
                      <span>Enter Food & Quantity:</span>
                    </span>

                    {/* Auto-Match & Calculation Pill */}
                    {autoMatchedTemplate ? (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Auto-calculated ({autoMatchedTemplate.name})</span>
                      </span>
                    ) : inputFoodName.trim().length >= 2 && !userHasEditedMacros ? (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-600" />
                        <span>Calculated from USDA data</span>
                      </span>
                    ) : userHasEditedMacros ? (
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                        Custom User Nutrition
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        Type any food, drink, or snack
                      </span>
                    )}
                  </div>

                  {/* Row 1: Food Name + Quantity + Unit */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-heading font-bold text-clay-text/60 dark:text-slate-400 uppercase mb-1">
                        Food, Drink, or Snack Name (e.g. Coffee, Oats, Popcorn, Banana...)
                      </label>
                      <input
                        type="text"
                        value={inputFoodName}
                        onChange={(e) => handleFoodNameChange(e.target.value)}
                        placeholder="Type food or drink (e.g. Coffee, Chai, Oats, Banana, Egg, Popcorn)..."
                        className="clay-input w-full px-3.5 py-2.5 text-xs font-bold text-clay-text dark:text-white rounded-xl"
                        autoFocus
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
                          onChange={(e) => handleUnitChange(e.target.value)}
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

                  {/* Real-time autocomplete suggestions pills */}
                  {suggestions.length > 0 && inputFoodName.trim().length >= 2 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-slate-400 font-bold">Matches:</span>
                      {suggestions.map((s) => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => handleSelectSuggestedFood(s)}
                          className={`text-[10px] px-2.5 py-1 rounded-xl font-heading font-black transition active:scale-95 flex items-center gap-1.5 ${
                            autoMatchedTemplate?.name === s.name
                              ? 'bg-slate-900 text-lime-400 dark:bg-lime-400 dark:text-slate-950 shadow-sm'
                              : 'clay-btn text-clay-text dark:text-slate-200'
                          }`}
                        >
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 text-lime-400 dark:bg-lime-400 dark:text-slate-950 flex items-center justify-center font-black">
                            <Plus className="w-2.5 h-2.5 stroke-[4]" />
                          </div>
                          <span>{s.name} ({s.baseWeightGrams}g)</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Row 2: Editable Nutrition Values */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-heading font-bold text-clay-text/60 dark:text-slate-400 uppercase">
                        Calculated Nutrition (Change if desired, or save as is):
                      </label>
                      {autoMatchedTemplate ? (
                        <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Matched: {autoMatchedTemplate.name}
                        </span>
                      ) : inputFoodName.trim().length >= 2 ? (
                        <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Calculated for {inputFoodName.trim()} ({inputQuantity}{inputUnit})
                        </span>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {/* Calories */}
                      <div className="clay-sunken p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-rose-500 block mb-0.5">Calories</span>
                        <input
                          type="number"
                          min={0}
                          value={inputCalories}
                          onChange={(e) => {
                            setUserHasEditedMacros(true);
                            setInputCalories(Number(e.target.value));
                          }}
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
                          onChange={(e) => {
                            setUserHasEditedMacros(true);
                            setInputProtein(Number(e.target.value));
                          }}
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
                          onChange={(e) => {
                            setUserHasEditedMacros(true);
                            setInputCarbs(Number(e.target.value));
                          }}
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
                          onChange={(e) => {
                            setUserHasEditedMacros(true);
                            setInputFiber(Number(e.target.value));
                          }}
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
                          onChange={(e) => {
                            setUserHasEditedMacros(true);
                            setInputFat(Number(e.target.value));
                          }}
                          className="w-full bg-transparent text-center text-xs font-mono font-black text-clay-text dark:text-white focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-400 block font-bold">grams</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary & Secondary Action Buttons */}
                  <div className="space-y-2 pt-1">
                    {/* Primary Big Save Button */}
                    <button
                      type="button"
                      onClick={handleSaveMealNow}
                      disabled={!inputFoodName.trim() && ingredients.length === 0}
                      className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 font-heading font-black text-sm flex items-center justify-center gap-2.5 active:scale-98 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-lime-400 text-slate-950 dark:bg-slate-950 dark:text-lime-400 flex items-center justify-center font-black shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                      </div>
                      <span>
                        Save & Log to {mealType === 'snack' ? 'SNACKS & DRINKS' : mealType.toUpperCase()} (
                        {(inputFoodName.trim() ? inputCalories : 0) + totalCalories} kcal)
                      </span>
                    </button>

                    {/* Secondary: Add another item to meal builder */}
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      disabled={!inputFoodName.trim()}
                      className="w-full py-2.5 px-4 rounded-xl clay-btn text-clay-text dark:text-white font-heading font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400"
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-lime-400 dark:bg-lime-400 dark:text-slate-900 flex items-center justify-center font-black">
                        <Plus className="w-3.5 h-3.5 stroke-[4]" />
                      </div>
                      <span>+ Add Another Food to this {mealType} Bowl</span>
                    </button>
                  </div>
                </div>

                {/* Composed Meal Ingredients List */}
                {ingredients.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {/* Optional Meal Title Input */}
                    <div>
                      <label className="block text-[11px] font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Meal / Bowl Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={mealName}
                        onChange={(e) => setMealName(e.target.value)}
                        placeholder="e.g. Oatmeal with Banana & Peanut Butter"
                        className="clay-input w-full px-4 py-2.5 text-xs font-heading font-black text-clay-text dark:text-white rounded-2xl"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-black text-clay-text dark:text-white uppercase tracking-wider">
                        Composed Meal Items ({ingredients.length})
                      </span>
                      <span className="text-[11px] font-mono font-black text-clay-coral-dark dark:text-clay-coral">
                        Total: {totalCalories} kcal
                      </span>
                    </div>

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

                    {/* Save Entire Composed Meal Button */}
                    <button
                      type="button"
                      onClick={handleSaveMealNow}
                      className="w-full py-4 rounded-clay-btn bg-slate-900 text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 font-heading font-black flex items-center justify-center gap-2.5 active:scale-98 transition text-sm shadow-xl cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-lime-400 text-slate-950 dark:bg-slate-950 dark:text-lime-400 flex items-center justify-center font-black shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                      </div>
                      <span>Log Entire Meal ({totalCalories} kcal to {mealType})</span>
                    </button>
                  </div>
                )}
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
                    placeholder="Search foods (Oats, Peanut Butter, Salmon, Rice...)"
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
                        className="flex-1 py-3 rounded-xl clay-btn font-heading font-black text-xs text-clay-text dark:text-white flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                      >
                        <div className="w-5 h-5 rounded-full bg-slate-900 text-lime-400 dark:bg-lime-400 dark:text-slate-900 flex items-center justify-center font-black">
                          <Plus className="w-3.5 h-3.5 stroke-[4]" />
                        </div>
                        <span>Add to Meal Builder</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveSelectedFromSearch}
                        className="flex-1 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 font-heading font-black text-xs flex items-center justify-center gap-2 active:scale-95 shadow-sm cursor-pointer"
                      >
                        <div className="w-5 h-5 rounded-full bg-lime-400 text-slate-950 dark:bg-slate-950 dark:text-lime-400 flex items-center justify-center font-black">
                          <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                        </div>
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
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-lime-400 dark:bg-lime-400 dark:text-slate-950 flex items-center justify-center shadow-sm">
                          <Plus className="w-4 h-4 stroke-[4]" />
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
