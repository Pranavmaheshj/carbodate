import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  Sparkles,
  Check,
  X,
  Plus,
  Minus,
  Trash2,
  Info,
  Flame,
  RefreshCw,
  SwitchCamera,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { analyzeFoodPhoto, PhotoAnalysisResult } from '../../services/aiVision';
import { MealItem, MealType, DetectedFoodCandidate } from '../../types';

interface PhotoCalorieEstimatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: MealItem) => void;
  userId: string;
  initialMealType?: MealType;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    name: 'Salmon & Quinoa Bowl',
    desc: 'Omega-3 + Complex carbs',
    url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Grilled Chicken & Rice',
    desc: 'Lean protein + Jasmine rice',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Avocado Toast & Eggs',
    desc: 'Healthy fats + Whole grain',
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
  },
];

// Helper to deduce meal type by current clock hour
function getDefaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  if (hour >= 18 && hour < 22) return 'dinner';
  return 'snack';
}

export const PhotoCalorieEstimator: React.FC<PhotoCalorieEstimatorProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  userId,
  initialMealType,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<PhotoAnalysisResult | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(initialMealType || getDefaultMealType());
  const [mealTitle, setMealTitle] = useState<string>('');
  const [editableItems, setEditableItems] = useState<DetectedFoodCandidate[]>([]);
  const [scanStepText, setScanStepText] = useState<string>('Analyzing image...');

  // Live in-app camera viewfinder states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream cleanly when modal closes or unmounts
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setImagePreview(null);
      setScanResult(null);
      setIsScanning(false);
      setCameraError(null);
    } else {
      setSelectedMealType(initialMealType || getDefaultMealType());
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, initialMealType]);

  // Start Live Viewfinder Stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCameraStream();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      // Wait a tick for video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.warn('Video play error:', err));
        }
      }, 100);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Unable to open live camera stream. You can upload a photo or use file selection.');
      setIsCameraActive(false);
    }
  };

  // Toggle Front/Back Camera
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame from active live video stream
  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    stopCameraStream();
    setImagePreview(dataUrl);
    runScan(dataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCameraStream();
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
    stopCameraStream();
    setImagePreview(url);
    runScan(url);
  };

  const runScan = async (imgUrlOrBase64: string) => {
    setIsScanning(true);
    setScanResult(null);
    setScanStepText('Analyzing visual food features...');

    const stepTimer1 = setTimeout(() => {
      setScanStepText('Estimating portion weights & ingredients...');
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setScanStepText('Computing accurate calorie & macro breakdown...');
    }, 1200);

    try {
      const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('carbodate_gemini_api_key') : null;
      const result = await analyzeFoodPhoto(imgUrlOrBase64, storedKey || undefined);

      setScanResult(result);
      setMealTitle(result.title);
      setEditableItems([...result.items]);
    } catch (e) {
      console.error('Vision analysis error:', e);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsScanning(false);
    }
  };

  const handleUpdateItem = (index: number, field: keyof DetectedFoodCandidate, value: any) => {
    const updated = [...editableItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditableItems(updated);
  };

  const handleAdjustCalories = (index: number, delta: number) => {
    const updated = [...editableItems];
    const current = Number(updated[index].calories) || 0;
    updated[index] = { ...updated[index], calories: Math.max(0, current + delta) };
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
      {
        name: 'Extra ingredient / Side',
        portion: '1 serving (100g)',
        calories: 120,
        protein: 5,
        carbs: 15,
        fat: 4,
        confidence: 1.0,
      },
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
      portion: `${editableItems.length} items`,
      calories: totalCalories,
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      aiEstimated: true,
      detectedIngredients: editableItems.map((i) => `${i.name} - ${i.portion} (${i.calories} kcal)`),
      imageUrl: imagePreview || undefined,
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
            className="w-full max-w-xl clay-card rounded-clay-card p-5 sm:p-7 shadow-2xl relative text-left my-auto max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 clay-pebble w-9 h-9 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-90 z-20"
              aria-label="Close photo estimator"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5 pr-8">
              <div className="w-12 h-12 rounded-2xl clay-card-lime text-clay-text flex items-center justify-center shadow-sm flex-shrink-0">
                <Camera className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-clay-text dark:text-white font-heading tracking-tight">
                    AI Food Calorie Vision
                  </h3>
                  <span className="text-[10px] clay-chip bg-clay-lime text-clay-text font-black uppercase px-2 py-0.5">
                    Live Recognition
                  </span>
                </div>
                <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400">
                  Instant visual calorie, portion & macronutrient tracking
                </span>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              {/* STATE 1: LIVE VIEWFINDER STREAM */}
              {isCameraActive && (
                <div className="space-y-3">
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/3] w-full clay-sunken bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder crosshairs & targeting overlay */}
                    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-8 h-8 border-t-2 border-l-2 border-[#B8F25B] rounded-tl-lg" />
                        <div className="w-8 h-8 border-t-2 border-r-2 border-[#B8F25B] rounded-tr-lg" />
                      </div>
                      <div className="flex justify-center items-center">
                        <div className="w-24 h-24 border border-dashed border-[#B8F25B]/70 rounded-2xl flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#B8F25B] animate-ping" />
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="w-8 h-8 border-b-2 border-l-2 border-[#B8F25B] rounded-bl-lg" />
                        <div className="w-8 h-8 border-b-2 border-r-2 border-[#B8F25B] rounded-br-lg" />
                      </div>
                    </div>

                    {/* Camera Control Overlays */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="clay-chip bg-black/60 text-white backdrop-blur-md text-[10px] font-mono px-2.5 py-1">
                        ● LIVE VIEWFINDER
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full clay-pebble bg-black/50 text-white flex items-center justify-center transition active:scale-90 z-10"
                      title="Flip camera"
                    >
                      <SwitchCamera className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Shutter Button Bar */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="clay-btn py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      Cancel Stream
                    </button>

                    {/* Big Clay Shutter Button */}
                    <button
                      type="button"
                      onClick={capturePhotoFromStream}
                      className="w-16 h-16 rounded-full clay-btn-lime flex items-center justify-center shadow-lg active:scale-95 transition mx-auto border-4 border-white dark:border-slate-800"
                      aria-label="Capture Food Photo"
                    >
                      <Camera className="w-7 h-7 text-clay-text stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="clay-btn py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 2: NO IMAGE & CAMERA OFF -> Choose Mode */}
              {!imagePreview && !isCameraActive && (
                <div className="space-y-4">
                  {cameraError && (
                    <div className="p-3.5 rounded-2xl clay-card-butter text-xs text-amber-900 font-bold flex items-center gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 text-amber-700" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {/* Dual Primary Action Tiles: Live Camera & Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* 1. Open Live Camera */}
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="p-6 rounded-3xl clay-card hover:scale-[1.02] active:scale-95 transition text-center flex flex-col items-center justify-center group border border-lime-400/30"
                    >
                      <div className="w-14 h-14 rounded-2xl clay-card-lime text-clay-text flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md">
                        <Camera className="w-7 h-7 stroke-[2.2]" />
                      </div>
                      <span className="font-heading font-black text-clay-text dark:text-white text-base block">
                        Open Camera
                      </span>
                      <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400 mt-1 block">
                        Snap a photo of your meal
                      </span>
                    </button>

                    {/* 2. Upload from Device / Library */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 rounded-3xl clay-sunken hover:ring-2 hover:ring-lime-400/50 cursor-pointer transition text-center flex flex-col items-center justify-center group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="w-14 h-14 rounded-2xl clay-pebble text-clay-lime-dark dark:text-clay-lime flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7 stroke-[2.2]" />
                      </div>
                      <span className="font-heading font-black text-clay-text dark:text-white text-base block">
                        Upload Image
                      </span>
                      <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400 mt-1 block">
                        Select from device gallery
                      </span>
                    </div>
                  </div>

                  {/* Quick Preset Samples for Instant Testing */}
                  <div>
                    <span className="text-xs font-heading font-black text-clay-text/70 dark:text-slate-400 block mb-2 uppercase tracking-wider">
                      Or select a sample meal photo for instant verification:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {SAMPLE_PHOTO_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleSelectPreset(p.url)}
                          className="clay-card-flat rounded-2xl overflow-hidden hover:scale-[1.02] active:scale-95 transition group relative text-left p-2.5 flex items-center sm:flex-col gap-2.5"
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="h-14 sm:h-20 w-16 sm:w-full rounded-xl object-cover group-hover:scale-105 transition-transform flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-heading font-black text-clay-text dark:text-white block truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-bold text-clay-text/60 dark:text-slate-400 block truncate">
                              {p.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 3: IMAGE SELECTED (Scanning or Result View) */}
              {imagePreview && (
                <div className="space-y-4">
                  {/* Photo Preview with Laser Scanner Animation */}
                  <div className="relative rounded-3xl overflow-hidden h-48 w-full clay-sunken bg-slate-900/10">
                    <img
                      src={imagePreview}
                      alt="Meal Preview"
                      className="w-full h-full object-cover"
                    />

                    {/* Animated High-Tech Laser Reticle */}
                    {isScanning && (
                      <>
                        <motion.div
                          className="absolute inset-x-0 h-1.5 bg-[#B8F25B] shadow-[0_0_15px_#B8F25B]"
                          initial={{ top: '0%' }}
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                        />
                        <div className="absolute inset-0 bg-lime-500/10 pointer-events-none" />
                      </>
                    )}

                    {/* Retake / Change Button */}
                    {!isScanning && (
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          setScanResult(null);
                        }}
                        className="absolute top-3 right-3 clay-pebble w-9 h-9 rounded-full text-slate-700 dark:text-slate-200 flex items-center justify-center transition shadow-md active:scale-90 z-10"
                        title="Retake or choose different photo"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}

                    {/* Status Pill on Top */}
                    <div className="absolute top-3 left-3 z-10">
                      {isScanning ? (
                        <span className="clay-chip bg-black/70 text-[#B8F25B] backdrop-blur-md text-[10px] font-mono px-3 py-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#B8F25B] animate-ping" />
                          SCANNING VISUAL METADATA
                        </span>
                      ) : (
                        scanResult && (
                          <span className="clay-chip bg-black/70 text-white backdrop-blur-md text-[10px] font-mono px-3 py-1 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#B8F25B]" />
                            {scanResult.source === 'gemini' ? 'GEMINI VISION AI' : 'NUTRITION ENGINE'}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Scanning Pulse Status */}
                  {isScanning && (
                    <div className="p-5 rounded-3xl clay-sunken text-center space-y-2">
                      <Sparkles className="w-7 h-7 text-clay-lime-dark dark:text-clay-lime mx-auto animate-spin" />
                      <span className="font-heading font-black text-clay-text dark:text-white text-base block">
                        {scanStepText}
                      </span>
                      <span className="text-xs font-bold text-clay-text/60 dark:text-slate-400 block">
                        Identifying food portions, nutritional mass, and exact macro values
                      </span>
                    </div>
                  )}

                  {/* RESULTS DISPLAY */}
                  {scanResult && !isScanning && (
                    <div className="space-y-4">
                      {/* Meal Title & Meal Type Pill Selection */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Meal Description / Name
                          </label>
                          <input
                            type="text"
                            value={mealTitle}
                            onChange={(e) => setMealTitle(e.target.value)}
                            className="clay-input w-full rounded-2xl px-4 py-3 text-sm text-clay-text dark:text-white font-heading font-black"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Log Into Meal Category
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setSelectedMealType(type)}
                                className={`py-2 px-1 text-xs font-heading font-black rounded-xl capitalize transition active:scale-95 text-center ${
                                  selectedMealType === type
                                    ? 'clay-btn-lime font-black'
                                    : 'clay-btn text-clay-text dark:text-slate-300'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Hero Macro Summary Pill */}
                      <div className="p-4 sm:p-5 rounded-3xl clay-card-flat flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl clay-card-lime text-clay-text flex items-center justify-center font-bold shadow-sm">
                            <Flame className="w-6 h-6 fill-current text-coral-500" />
                          </div>
                          <div>
                            <span className="text-[11px] text-clay-text/60 dark:text-slate-400 block uppercase font-heading font-black">
                              Calculated Calories
                            </span>
                            <span className="text-3xl font-heading font-black text-clay-text dark:text-white font-mono">
                              {totalCalories}{' '}
                              <span className="text-sm font-bold text-clay-lime-dark dark:text-clay-lime font-mono">
                                kcal
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Macronutrient Pills */}
                        <div className="flex items-center gap-2.5 sm:gap-3 text-center w-full sm:w-auto justify-around">
                          <div className="clay-sunken py-2 px-3 rounded-2xl min-w-[64px]">
                            <span className="text-[10px] text-clay-text/60 dark:text-slate-400 block font-heading font-bold">
                              Protein
                            </span>
                            <span className="text-sm font-black text-clay-coral-dark dark:text-clay-coral font-mono">
                              {Math.round(totalProtein)}g
                            </span>
                          </div>

                          <div className="clay-sunken py-2 px-3 rounded-2xl min-w-[64px]">
                            <span className="text-[10px] text-clay-text/60 dark:text-slate-400 block font-heading font-bold">
                              Carbs
                            </span>
                            <span className="text-sm font-black text-clay-butter-dark dark:text-clay-butter font-mono">
                              {Math.round(totalCarbs)}g
                            </span>
                          </div>

                          <div className="clay-sunken py-2 px-3 rounded-2xl min-w-[64px]">
                            <span className="text-[10px] text-clay-text/60 dark:text-slate-400 block font-heading font-bold">
                              Fat
                            </span>
                            <span className="text-sm font-black text-clay-sky-dark dark:text-clay-sky font-mono">
                              {Math.round(totalFat)}g
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detected Ingredients Breakdown (Interactive) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider">
                            Detected Ingredients ({editableItems.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="clay-btn px-2.5 py-1 rounded-xl text-xs font-heading font-black flex items-center gap-1 active:scale-95 text-clay-text dark:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Item</span>
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {editableItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-2xl clay-card-flat flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                                  className="w-full bg-transparent font-heading font-black text-clay-text dark:text-white text-sm focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={item.portion}
                                  onChange={(e) => handleUpdateItem(idx, 'portion', e.target.value)}
                                  className="text-clay-text/60 dark:text-slate-400 font-bold bg-transparent text-xs focus:outline-none w-full mt-0.5"
                                  placeholder="e.g. 150g or 1 cup"
                                />
                              </div>

                              <div className="flex items-center gap-2 justify-between sm:justify-end">
                                {/* Calories with Stepper Buttons */}
                                <div className="flex items-center gap-1 clay-sunken p-1 rounded-xl">
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustCalories(idx, -10)}
                                    className="w-6 h-6 rounded-lg clay-btn flex items-center justify-center text-clay-text dark:text-slate-300 active:scale-90"
                                    title="Decrease 10 kcal"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>

                                  <div className="px-1.5 text-center min-w-[54px]">
                                    <span className="font-mono font-black text-clay-coral-dark dark:text-clay-coral text-xs">
                                      {item.calories}
                                    </span>
                                    <span className="text-[9px] text-slate-400 block -mt-0.5 font-bold">kcal</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAdjustCalories(idx, 10)}
                                    className="w-6 h-6 rounded-lg clay-btn flex items-center justify-center text-clay-text dark:text-slate-300 active:scale-90"
                                    title="Increase 10 kcal"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Macros chips */}
                                <div className="flex items-center gap-1.5 clay-sunken px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold">
                                  <span className="text-clay-coral-dark dark:text-clay-coral">{item.protein}P</span>
                                  <span className="text-clay-butter-dark dark:text-clay-butter">{item.carbs}C</span>
                                  <span className="text-clay-sky-dark dark:text-clay-sky">{item.fat}F</span>
                                </div>

                                {/* Delete Item */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="clay-pebble w-8 h-8 rounded-full text-slate-400 hover:text-rose-500 flex items-center justify-center transition active:scale-90 flex-shrink-0"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Nutritional Insights Note */}
                      {scanResult.notes && (
                        <div className="p-3.5 rounded-2xl clay-card-butter flex items-start gap-2.5 text-xs text-slate-900">
                          <Info className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <strong className="block font-heading">Nutritional Insight:</strong>
                            <span className="opacity-90">{scanResult.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            {scanResult && !isScanning && (
              <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setScanResult(null);
                  }}
                  className="clay-btn py-3.5 px-4 rounded-clay-btn text-clay-text dark:text-slate-200 font-heading font-black text-xs transition active:scale-95 flex-1"
                >
                  Discard & Retake
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSave}
                  className="clay-btn-lime py-3.5 px-6 rounded-clay-btn font-heading font-black text-sm flex items-center justify-center gap-2 transition shadow-md active:scale-95 flex-2 text-clay-text"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Log to Daily Diary ({totalCalories} kcal)</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
