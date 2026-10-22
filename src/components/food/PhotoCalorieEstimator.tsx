import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  Sparkles,
  Check,
  X,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { analyzeFoodPhoto, PhotoAnalysisResult } from '../../services/aiVision';
import { MealItem, MealType, DetectedFoodCandidate } from '../../types';

interface PhotoCalorieEstimatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: MealItem) => void;
  userId: string;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    name: 'Salmon & Quinoa Bowl',
    url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Grilled Chicken & Rice',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Avocado Toast & Eggs',
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
  },
];

export const PhotoCalorieEstimator: React.FC<PhotoCalorieEstimatorProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  userId,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<PhotoAnalysisResult | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [mealTitle, setMealTitle] = useState<string>('');
  const [editableItems, setEditableItems] = useState<DetectedFoodCandidate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        runScan(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    setImagePreview(url);
    runScan(url);
  };

  const runScan = async (imgUrlOrBase64: string) => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const result = await analyzeFoodPhoto(imgUrlOrBase64);
      setScanResult(result);
      setMealTitle(result.title);
      setEditableItems([...result.items]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateItem = (index: number, field: keyof DetectedFoodCandidate, value: any) => {
    const updated = [...editableItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditableItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...editableItems];
    updated.splice(index, 1);
    setEditableItems(updated);
  };

  const handleAddItem = () => {
    setEditableItems([
      ...editableItems,
      { name: 'Custom ingredient', portion: '100g', calories: 120, protein: 5, carbs: 15, fat: 3, confidence: 1.0 },
    ]);
  };

  const totalCalories = editableItems.reduce((s, i) => s + (Number(i.calories) || 0), 0);
  const totalProtein = editableItems.reduce((s, i) => s + (Number(i.protein) || 0), 0);
  const totalCarbs = editableItems.reduce((s, i) => s + (Number(i.carbs) || 0), 0);
  const totalFat = editableItems.reduce((s, i) => s + (Number(i.fat) || 0), 0);

  const handleConfirmAndSave = () => {
    const meal: MealItem = {
      id: `meal_${Date.now()}`,
      userId,
      date: new Date().toISOString().split('T')[0],
      mealType: selectedMealType,
      name: mealTitle || 'AI Scanned Meal',
      portion: `${editableItems.length} ingredients`,
      calories: totalCalories,
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      aiEstimated: true,
      detectedIngredients: editableItems.map((i) => `${i.name} (${i.portion})`),
      imageUrl: imagePreview || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveMeal(meal);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl clay-card rounded-clay-card p-6 sm:p-7 shadow-2xl relative text-left my-6 max-h-[90vh] flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 clay-pebble w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition z-10"
              aria-label="Close photo estimator"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl clay-pebble text-lime-600 dark:text-lime-400 flex items-center justify-center font-bold">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
                  <span>Photo Calorie Estimation</span>
                  <span className="text-[10px] clay-btn-lime px-2.5 py-0.5 rounded-full font-black uppercase">
                    AI Vision
                  </span>
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  Visual macro & calorie breakdown from meal photos
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              {!imagePreview ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="clay-sunken rounded-3xl p-8 text-center cursor-pointer transition group hover:ring-2 hover:ring-lime-400/50"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="w-14 h-14 rounded-2xl clay-pebble text-lime-600 dark:text-lime-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="font-black text-slate-800 dark:text-slate-100 text-sm block font-display">
                      Take Photo or Upload Meal Image
                    </span>
                    <span className="text-xs font-bold text-slate-400 mt-1 block">
                      Supports JPG, PNG, WEBP camera captures
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-2 font-display">
                      Or select a sample meal photo for instant preview:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {SAMPLE_PHOTO_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleSelectPreset(p.url)}
                          className="clay-card-flat rounded-2xl overflow-hidden hover:scale-[1.02] transition group relative text-left"
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="h-16 w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="p-2 text-[10px] font-black text-slate-800 dark:text-slate-100 truncate font-display">
                            {p.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Photo Preview with Laser Scanner Animation */}
                  <div className="relative rounded-2xl overflow-hidden h-44 w-full clay-sunken">
                    <img
                      src={imagePreview}
                      alt="Meal Preview"
                      className="w-full h-full object-cover"
                    />

                    {isScanning && (
                      <motion.div
                        className="absolute inset-x-0 h-1.5 bg-[#B8F25B] shadow-lg"
                        initial={{ top: '0%' }}
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                      />
                    )}

                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setScanResult(null);
                      }}
                      className="absolute top-2 right-2 clay-pebble w-8 h-8 rounded-full text-slate-600 dark:text-slate-300 flex items-center justify-center transition shadow"
                      aria-label="Change photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {isScanning && (
                    <div className="p-4 rounded-2xl clay-sunken text-center space-y-1">
                      <Sparkles className="w-6 h-6 text-lime-500 mx-auto animate-spin" />
                      <span className="font-black text-slate-800 dark:text-slate-100 text-sm block font-display">
                        Analyzing Food Ingredients...
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Identifying meal items, calories, and macronutrients
                      </span>
                    </div>
                  )}

                  {scanResult && !isScanning && (
                    <div className="space-y-4">
                      {/* Meal Title & Meal Type Picker */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1">
                            Meal Title
                          </label>
                          <input
                            type="text"
                            value={mealTitle}
                            onChange={(e) => setMealTitle(e.target.value)}
                            className="clay-input w-full rounded-2xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 font-bold border-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1">
                            Log As
                          </label>
                          <select
                            value={selectedMealType}
                            onChange={(e) => setSelectedMealType(e.target.value as MealType)}
                            className="clay-input w-full rounded-2xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 capitalize font-bold border-none cursor-pointer"
                          >
                            <option value="breakfast" className="bg-white dark:bg-slate-800">Breakfast</option>
                            <option value="lunch" className="bg-white dark:bg-slate-800">Lunch</option>
                            <option value="dinner" className="bg-white dark:bg-slate-800">Dinner</option>
                            <option value="snack" className="bg-white dark:bg-slate-800">Snack</option>
                          </select>
                        </div>
                      </div>

                      {/* Detected Items */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider">
                            Detected Ingredients (Editable)
                          </span>
                          <button
                            onClick={handleAddItem}
                            className="clay-btn-lime px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        </div>

                        <div className="space-y-2">
                          {editableItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-2xl clay-card-flat flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                                  className="w-full bg-transparent font-black text-slate-800 dark:text-slate-100 text-sm focus:outline-none font-display"
                                />
                                <input
                                  type="text"
                                  value={item.portion}
                                  onChange={(e) => handleUpdateItem(idx, 'portion', e.target.value)}
                                  className="text-slate-400 font-bold bg-transparent text-xs focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 clay-sunken px-2 py-1 rounded-xl">
                                  <span className="text-slate-400 font-bold text-[10px]">kcal:</span>
                                  <input
                                    type="number"
                                    value={item.calories}
                                    onChange={(e) => handleUpdateItem(idx, 'calories', Number(e.target.value))}
                                    className="w-12 bg-transparent text-coral-600 dark:text-coral-400 font-mono font-black text-center focus:outline-none"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5 clay-sunken px-2 py-1 rounded-xl text-[11px] font-mono font-bold">
                                  <span className="text-coral-500">{item.protein}P</span>
                                  <span className="text-amber-500">{item.carbs}C</span>
                                  <span className="text-sky-500">{item.fat}F</span>
                                </div>

                                <button
                                  onClick={() => handleRemoveItem(idx)}
                                  className="clay-pebble w-7 h-7 rounded-full text-slate-400 hover:text-rose-500 flex items-center justify-center transition"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Macro Summary Pill */}
                      <div className="p-4 rounded-2xl clay-sunken flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 block uppercase font-bold font-display">
                            Total Calories
                          </span>
                          <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                            {totalCalories} <span className="text-xs font-bold text-lime-600 dark:text-lime-400">kcal</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-center font-bold">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-display">Protein</span>
                            <span className="text-coral-500 font-mono font-black">{Math.round(totalProtein)}g</span>
                          </div>
                          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
                          <div>
                            <span className="text-[10px] text-slate-400 block font-display">Carbs</span>
                            <span className="text-amber-500 font-mono font-black">{Math.round(totalCarbs)}g</span>
                          </div>
                          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
                          <div>
                            <span className="text-[10px] text-slate-400 block font-display">Fats</span>
                            <span className="text-sky-500 font-mono font-black">{Math.round(totalFat)}g</span>
                          </div>
                        </div>
                      </div>

                      {/* Approximate Disclaimer Note */}
                      <div className="p-3.5 rounded-2xl clay-card-butter flex items-start gap-2.5 text-[11px] text-slate-900">
                        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold leading-relaxed">
                          <strong>Note:</strong> Photo calorie estimation is an approximate nutritional reference based on visual volume detection. You can adjust grams and calories above before saving.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {scanResult && !isScanning && (
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="clay-btn py-3 px-4 rounded-clay-btn text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 flex-1"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSave}
                  className="clay-btn-lime py-3 px-6 rounded-clay-btn font-black text-sm flex items-center justify-center gap-2 transition shadow-sm active:scale-95 flex-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm & Log Meal</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
