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
            className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left my-6 max-h-[90vh] flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition z-10"
              aria-label="Close photo estimator"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Photo Calorie Estimation</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">
                    AI Vision
                  </span>
                </h3>
                <span className="text-xs text-slate-500">
                  Visual macro & calorie breakdown from meal photos
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              {!imagePreview ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 text-center cursor-pointer transition bg-slate-50 hover:bg-slate-100 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm block">
                      Take Photo or Upload Meal Image
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Supports JPG, PNG, WEBP camera captures
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block mb-2 font-medium">
                      Or select a sample meal photo for instant preview:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {SAMPLE_PHOTO_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleSelectPreset(p.url)}
                          className="rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition group relative text-left"
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="h-16 w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="p-1.5 bg-white text-[10px] font-bold text-slate-900 truncate">
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
                  <div className="relative rounded-2xl overflow-hidden h-44 w-full border border-slate-200 bg-slate-100">
                    <img
                      src={imagePreview}
                      alt="Meal Preview"
                      className="w-full h-full object-cover"
                    />

                    {isScanning && (
                      <motion.div
                        className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md"
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
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-full transition shadow"
                      aria-label="Change photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {isScanning && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                      <Sparkles className="w-6 h-6 text-emerald-600 mx-auto animate-spin-slow" />
                      <span className="font-bold text-emerald-900 text-sm block">
                        Analyzing Food Ingredients...
                      </span>
                      <span className="text-xs text-slate-500">
                        Identifying meal items, calories, and macronutrients
                      </span>
                    </div>
                  )}

                  {scanResult && !isScanning && (
                    <div className="space-y-4">
                      {/* Meal Title & Meal Type Picker */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                            Meal Title
                          </label>
                          <input
                            type="text"
                            value={mealTitle}
                            onChange={(e) => setMealTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                            Log As
                          </label>
                          <select
                            value={selectedMealType}
                            onChange={(e) => setSelectedMealType(e.target.value as MealType)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white capitalize font-semibold"
                          >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                          </select>
                        </div>
                      </div>

                      {/* Detected Items */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Detected Ingredients (Editable)
                          </span>
                          <button
                            onClick={handleAddItem}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Item
                          </button>
                        </div>

                        <div className="space-y-2">
                          {editableItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                                  className="w-full bg-transparent font-bold text-slate-900 text-sm focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={item.portion}
                                  onChange={(e) => handleUpdateItem(idx, 'portion', e.target.value)}
                                  className="text-slate-500 bg-transparent text-xs focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                  <span className="text-slate-500 text-[10px]">kcal:</span>
                                  <input
                                    type="number"
                                    value={item.calories}
                                    onChange={(e) => handleUpdateItem(idx, 'calories', Number(e.target.value))}
                                    className="w-12 bg-transparent text-amber-700 font-bold text-center focus:outline-none"
                                  />
                                </div>

                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[11px]">
                                  <span className="text-rose-600 font-bold">{item.protein}P</span>
                                  <span className="text-amber-600 font-bold">{item.carbs}C</span>
                                  <span className="text-teal-600 font-bold">{item.fat}F</span>
                                </div>

                                <button
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Macro Summary Pill */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-500 block uppercase font-semibold">
                            Total Calories
                          </span>
                          <span className="text-2xl font-black text-slate-900">
                            {totalCalories} <span className="text-xs text-emerald-700">kcal</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-center font-bold">
                          <div>
                            <span className="text-[10px] text-slate-500 block font-normal">Protein</span>
                            <span className="text-rose-600">{Math.round(totalProtein)}g</span>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div>
                            <span className="text-[10px] text-slate-500 block font-normal">Carbs</span>
                            <span className="text-amber-600">{Math.round(totalCarbs)}g</span>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div>
                            <span className="text-[10px] text-slate-500 block font-normal">Fats</span>
                            <span className="text-teal-600">{Math.round(totalFat)}g</span>
                          </div>
                        </div>
                      </div>

                      {/* Approximate Disclaimer Note */}
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-[11px] text-amber-900">
                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Note:</strong> Photo calorie estimation is an approximate nutritional reference based on visual volume detection. You can adjust grams and calories above before saving.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {scanResult && !isScanning && (
              <div className="pt-4 mt-3 border-t border-slate-200 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSave}
                  className="flex-2 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm"
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
