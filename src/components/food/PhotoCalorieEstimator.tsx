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
  AlertTriangle,
  Utensils,
  Key,
} from 'lucide-react';
import { analyzeFoodPhoto, compressImageForVision, PhotoAnalysisResult } from '../../services/aiVision';
import { MealItem, MealType, DetectedFoodCandidate } from '../../types';

interface PhotoCalorieEstimatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: MealItem) => void;
  userId: string;
  initialMealType?: MealType;
  onOpenManualAdd?: () => void;
}

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
  onOpenManualAdd,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<PhotoAnalysisResult | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(initialMealType || getDefaultMealType());
  const [mealTitle, setMealTitle] = useState<string>('');
  const [mealHint, setMealHint] = useState<string>('');
  const [cuisineContext, setCuisineContext] = useState<string>(() => {
    return (
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('carbodate_cuisine_context')
        : null) || 'Indian / Regional & Global'
    );
  });
  const [editableItems, setEditableItems] = useState<DetectedFoodCandidate[]>([]);
  const [scanStepText, setScanStepText] = useState<string>('Analyzing image...');
  const [isKeyConfigOpen, setIsKeyConfigOpen] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return (
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('carbodate_gemini_api_key')
        : null) || ''
    );
  });

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
  const capturePhotoFromStream = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.88);

    stopCameraStream();
    setImagePreview(rawDataUrl);
    setMealHint(''); // Clear preset hint for fresh photo capture

    try {
      const { base64, mimeType } = await compressImageForVision(rawDataUrl);
      const compressedUrl = `data:${mimeType};base64,${base64}`;
      setImagePreview(compressedUrl);
      runScan(compressedUrl, '');
    } catch {
      runScan(rawDataUrl, '');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCameraStream();
      setMealHint(''); // Clear preset hint for fresh uploaded image
      const reader = new FileReader();
      reader.onload = async () => {
        const rawBase64 = reader.result as string;
        setImagePreview(rawBase64);
        try {
          const { base64, mimeType } = await compressImageForVision(rawBase64);
          const compressedUrl = `data:${mimeType};base64,${base64}`;
          setImagePreview(compressedUrl);
          runScan(compressedUrl, '');
        } catch {
          runScan(rawBase64, '');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const runScan = async (imgUrlOrBase64: string, explicitHint?: string) => {
    setIsScanning(true);
    setScanResult(null);
    setScanStepText('Analyzing visual food features with Gemini AI...');

    const stepTimer1 = setTimeout(() => {
      setScanStepText('Deconstructing ingredients & portion weights...');
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setScanStepText('Computing accurate USDA calorie & macro breakdown...');
    }, 1200);

    try {
      const storedKey = customApiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('carbodate_gemini_api_key') : null);
      const activeHint = explicitHint !== undefined ? explicitHint : mealHint;
      const result = await analyzeFoodPhoto(imgUrlOrBase64, storedKey || undefined, activeHint, cuisineContext);

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
        fiber: 2,
        fat: 4,
        confidence: 1.0,
      },
    ]);
  };

  const totalCalories = editableItems.reduce((s, i) => s + (Number(i.calories) || 0), 0);
  const totalProtein = editableItems.reduce((s, i) => s + (Number(i.protein) || 0), 0);
  const totalCarbs = editableItems.reduce((s, i) => s + (Number(i.carbs) || 0), 0);
  const totalFiber = editableItems.reduce((s, i) => s + (Number(i.fiber) || 0), 0);
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
      fiber: Math.round(totalFiber * 10) / 10,
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
            <div className="flex items-center justify-between gap-3 mb-4 pr-10">
              <div className="flex items-center gap-3.5">
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

              {/* Gemini Key Config Toggle Button */}
              <button
                type="button"
                onClick={() => setIsKeyConfigOpen(!isKeyConfigOpen)}
                className={`p-2.5 rounded-xl clay-btn flex items-center gap-1.5 text-xs font-heading font-black transition active:scale-90 cursor-pointer ${
                  customApiKey ? 'text-lime-600 dark:text-lime-400 border border-lime-400/40' : 'text-slate-500'
                }`}
                title="Configure Gemini Vision API Key"
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">{customApiKey ? 'Custom Key' : 'Gemini Key'}</span>
              </button>
            </div>

            {/* Collapsible Gemini Key Configuration */}
            {isKeyConfigOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3.5 rounded-2xl clay-card-butter border border-amber-300 dark:border-amber-700 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-800" />
                    <span>Google Gemini Vision API Key</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-800/80">
                    {customApiKey ? '● Custom Key' : '● Default Cloud Key Active'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setCustomApiKey(v);
                      try {
                        if (v) {
                          localStorage.setItem('carbodate_gemini_api_key', v);
                        } else {
                          localStorage.removeItem('carbodate_gemini_api_key');
                        }
                      } catch {}
                    }}
                    placeholder="Paste a Gemini API key (optional; blank uses local analysis)"
                    className="clay-input flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  {customApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomApiKey('');
                        try {
                          localStorage.removeItem('carbodate_gemini_api_key');
                        } catch {}
                      }}
                      className="px-2.5 py-2 rounded-xl clay-btn text-[10px] font-heading font-black text-rose-500 cursor-pointer"
                      title="Clear custom key and restore default cloud key"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-amber-900/80 dark:text-amber-300 leading-snug">
                  Get a free Gemini API key anytime at{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold text-amber-950 dark:text-amber-100"
                  >
                    aistudio.google.com/apikey
                  </a>
                  .
                </div>
              </motion.div>
            )}

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

                  {/* Cuisine Context & Meal Notes */}
                  <div className="p-3.5 rounded-2xl clay-sunken space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300">
                        Cuisine Context
                      </label>
                      <span className="text-[10px] font-bold text-lime-700 dark:text-lime-400">
                        {cuisineContext}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['Indian', 'Western / Healthy', 'Asian', 'Mediterranean', 'Global'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCuisineContext(c);
                            try {
                              localStorage.setItem('carbodate_cuisine_context', c);
                            } catch {}
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-xl font-heading font-black transition active:scale-95 cursor-pointer ${
                            cuisineContext === c
                              ? 'clay-btn-lime text-clay-text'
                              : 'clay-btn text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11px] font-heading font-black text-clay-text/70 dark:text-slate-300 mb-1">
                        Meal Notes / Ingredients (Optional)
                      </label>
                      <input
                        type="text"
                        value={mealHint}
                        onChange={(e) => setMealHint(e.target.value)}
                        placeholder='e.g. "50g oats with a banana and 20g peanut butter for breakfast"'
                        className="clay-input w-full px-3.5 py-2 text-xs font-bold text-clay-text dark:text-white rounded-xl"
                      />
                    </div>
                  </div>

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
                          <span
                            className={`clay-chip backdrop-blur-md text-[10px] font-mono px-3 py-1 flex items-center gap-1.5 ${
                              !scanResult.isFood
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                                : 'bg-black/70 text-white'
                            }`}
                          >
                            {!scanResult.isFood ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#B8F25B]" />
                            )}
                            {!scanResult.isFood
                              ? 'NON-FOOD DETECTED'
                              : scanResult.source === 'gemini'
                              ? 'GEMINI VISION AI'
                              : 'NUTRITION ENGINE'}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Interactive Recipe Notes & Refinement Input */}
                  <div className="p-3 rounded-2xl clay-sunken flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg clay-sunken text-lime-700 dark:text-lime-400 whitespace-nowrap">
                        {cuisineContext}
                      </span>
                      <input
                        type="text"
                        value={mealHint}
                        onChange={(e) => setMealHint(e.target.value)}
                        placeholder='Add notes (e.g. "50g oats with a banana and 20g peanut butter")'
                        className="bg-transparent flex-1 text-xs font-bold text-clay-text dark:text-white placeholder:text-slate-400 focus:outline-none px-1 min-w-0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && imagePreview && !isScanning) {
                            runScan(imagePreview, mealHint);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => imagePreview && runScan(imagePreview, mealHint)}
                      className="py-1.5 px-3 rounded-xl clay-btn-lime text-[11px] font-heading font-black text-clay-text flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs flex-shrink-0"
                      title="Re-analyze meal using updated recipe notes"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                      <span>Re-scan</span>
                    </button>
                  </div>
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

                  {/* NON-FOOD WARNING DISPLAY */}
                  {scanResult && !isScanning && !scanResult.isFood && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 rounded-3xl clay-card-coral space-y-4 text-center border-2 border-rose-300/60 dark:border-rose-900/40"
                    >
                      <div className="w-14 h-14 rounded-2xl clay-pebble text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
                        <AlertTriangle className="w-7 h-7 stroke-[2.3]" />
                      </div>

                      <div>
                        <h4 className="text-xl font-heading font-black text-rose-950 dark:text-rose-100 tracking-tight">
                          Please Upload a Picture of Your Meal
                        </h4>
                        <p className="text-sm font-heading font-black text-rose-900 dark:text-rose-100 mt-2 leading-relaxed max-w-md mx-auto">
                          {scanResult.warningMessage ||
                            'Please upload the picture of your meal to calculate the nutrition.'}
                        </p>
                      </div>

                      {/* Helpful Guidelines Card */}
                      <div className="p-4 rounded-2xl clay-sunken text-left text-xs space-y-1.5">
                        <span className="font-heading font-black text-slate-700 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                          Tips for reliable recognition:
                        </span>
                        <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4 font-bold">
                          <li>Point your camera directly over your plate, bowl, or snack container with decent lighting</li>
                          <li>Include all sides, drinks, and garnishes in the frame</li>
                          <li>Avoid capturing non-food objects, animals, vehicles, documents, or screenshots</li>
                        </ul>
                      </div>

                      {/* Immediate Retake Controls */}
                      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setScanResult(null);
                            startCamera('environment');
                          }}
                          className="flex-1 py-3.5 px-4 rounded-2xl clay-btn-lime font-heading font-black text-xs text-clay-text flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                        >
                          <Camera className="w-4 h-4 stroke-[2.2]" />
                          <span>Snap Photo of Food</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setScanResult(null);
                            fileInputRef.current?.click();
                          }}
                          className="flex-1 py-3.5 px-4 rounded-2xl clay-btn font-heading font-black text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Upload className="w-4 h-4 stroke-[2.2]" />
                          <span>Choose Another File</span>
                        </button>
                      </div>

                      {onOpenManualAdd && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenManualAdd();
                          }}
                          className="w-full py-3.5 px-4 rounded-2xl clay-btn-sky font-heading font-black text-xs text-clay-text flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                        >
                          <Utensils className="w-4 h-4 stroke-[2.5]" />
                          <span>Add Food & Exact Quantity Manually</span>
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* VALID FOOD RESULTS DISPLAY */}
                  {scanResult && !isScanning && scanResult.isFood && (
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
                        <div className="flex items-center gap-2 sm:gap-2.5 text-center w-full sm:w-auto justify-around flex-wrap">
                          <div className="clay-sunken py-2 px-3 rounded-2xl min-w-[58px]">
                            <span className="text-[10px] text-clay-text/60 dark:text-slate-400 block font-heading font-bold">
                              Protein
                            </span>
                            <span className="text-sm font-black text-clay-coral-dark dark:text-clay-coral font-mono">
                              {Math.round(totalProtein)}g
                            </span>
                          </div>

                          <div className="clay-sunken py-2 px-3 rounded-2xl min-w-[58px]">
                            <span className="text-[10px] text-clay-text/60 dark:text-slate-400 block font-heading font-bold">
                              Carbs
                            </span>
                            <span className="text-sm font-black text-clay-butter-dark dark:text-clay-butter font-mono">
                              {Math.round(totalCarbs)}g
                            </span>
                          </div>

                          <div className="clay-sunken py-2 px-3 rounded-2xl min-w-[58px]">
                            <span className="text-[10px] text-clay-text/60 dark:text-slate-400 block font-heading font-bold">
                              Fiber
                            </span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {Math.round(totalFiber)}g
                            </span>
                          </div>

                          <div className="clay-sunken py-2 px-3 rounded-2xl min-w-[58px]">
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                                    className="bg-transparent font-heading font-black text-clay-text dark:text-white text-sm focus:outline-none capitalize"
                                  />
                                  {item.confidence !== undefined && item.confidence < 0.85 && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                      {Math.round(item.confidence * 100)}% match
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <input
                                    type="text"
                                    value={item.portion}
                                    onChange={(e) => handleUpdateItem(idx, 'portion', e.target.value)}
                                    className="text-clay-text/60 dark:text-slate-400 font-bold bg-transparent text-xs focus:outline-none"
                                    placeholder="e.g. 150g or 1 cup"
                                  />
                                  {item.grams !== undefined && item.grams > 0 && (
                                    <span className="text-[10px] font-mono text-slate-400">({item.grams}g)</span>
                                  )}
                                </div>
                                {item.alternatives && item.alternatives.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap mt-1">
                                    <span className="text-[9px] text-slate-400">Or:</span>
                                    {item.alternatives.map((alt, altIdx) => (
                                      <button
                                        key={altIdx}
                                        type="button"
                                        onClick={() => handleUpdateItem(idx, 'name', alt)}
                                        className="text-[9px] px-1.5 py-0.5 rounded-md clay-sunken font-bold text-slate-600 dark:text-slate-300 hover:text-lime-600 cursor-pointer"
                                        title={`Switch name to ${alt}`}
                                      >
                                        {alt}
                                      </button>
                                    ))}
                                  </div>
                                )}
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
                                <div className="flex items-center gap-1.5 clay-sunken px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold">
                                  <span className="text-clay-coral-dark dark:text-clay-coral">{item.protein}P</span>
                                  <span className="text-clay-butter-dark dark:text-clay-butter">{item.carbs}C</span>
                                  <span className="text-emerald-600 dark:text-emerald-400">{item.fiber || 0}Fiber</span>
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

            {/* Bottom Actions Bar for Valid Food */}
            {scanResult && !isScanning && scanResult.isFood && (
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
