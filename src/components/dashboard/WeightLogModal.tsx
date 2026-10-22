import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, Check, Calendar, Minus, Plus } from 'lucide-react';
import { WeightRecord, UserProfile } from '../../types';
import { kgToLb, lbToKg } from '../../services/calculations';

interface WeightLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWeight: (record: WeightRecord) => void;
  profile: UserProfile;
}

export const WeightLogModal: React.FC<WeightLogModalProps> = ({
  isOpen,
  onClose,
  onSaveWeight,
  profile,
}) => {
  const isMetric = profile.unitSystem !== 'imperial';
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState<number>(profile.currentWeightKg || 75);
  const [weightLb, setWeightLb] = useState<number>(Math.round(kgToLb(profile.currentWeightKg || 75) * 10) / 10);
  const [note, setNote] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalKg = isMetric ? weightKg : lbToKg(weightLb);

    const record: WeightRecord = {
      id: `w_${Date.now()}`,
      userId: profile.id,
      date,
      weightKg: Math.round(finalKg * 10) / 10,
      note: note.trim() || undefined,
    };

    onSaveWeight(record);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md clay-card rounded-clay-card p-6 sm:p-7 relative text-left my-auto max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-10 h-10 rounded-full clay-pebble flex items-center justify-center text-clay-text/60 hover:text-clay-text active:scale-90 transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-full clay-card-lime text-clay-text flex items-center justify-center shadow-sm">
                <Scale className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white">
                  Log Today's Weight
                </h3>
                <span className="text-xs font-sans text-clay-text/70 dark:text-slate-400">
                  Track morning body mass progression
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Weigh-In Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-clay-text/50 absolute left-4 top-3.5" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="clay-input w-full pl-11 pr-4 py-3 text-sm font-bold text-clay-text dark:text-white rounded-2xl"
                  />
                </div>
              </div>

              {/* Clay Weight Selector */}
              <div className="p-4 rounded-2xl clay-card-flat space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider">
                    Body Weight ({isMetric ? 'kg' : 'lbs'})
                  </label>
                  <span className="text-xs font-bold text-slate-400">Tactile Stepper</span>
                </div>

                {isMetric ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setWeightKg((prev) => Math.max(30, Math.round((prev - 0.1) * 10) / 10))}
                        className="w-11 h-11 rounded-2xl clay-btn flex items-center justify-center text-clay-text dark:text-slate-200 active:scale-95 transition"
                        aria-label="Decrease 0.1 kg"
                      >
                        <Minus className="w-5 h-5 stroke-[2.5]" />
                      </button>
                      <div className="clay-sunken flex-1 py-2 px-3 rounded-2xl text-center">
                        <span className="text-3xl sm:text-4xl font-heading font-black text-clay-lime-dark dark:text-clay-lime font-mono">
                          {weightKg.toFixed(1)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 block font-mono">kg</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWeightKg((prev) => Math.min(250, Math.round((prev + 0.1) * 10) / 10))}
                        className="w-11 h-11 rounded-2xl clay-btn flex items-center justify-center text-clay-text dark:text-slate-200 active:scale-95 transition"
                        aria-label="Increase 0.1 kg"
                      >
                        <Plus className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    </div>

                    <input
                      type="range"
                      min={40}
                      max={180}
                      step={0.1}
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="clay-range my-2"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setWeightKg((prev) => Math.max(30, Math.round((prev - 1) * 10) / 10))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          -1kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setWeightKg((prev) => Math.max(30, Math.round((prev - 0.5) * 10) / 10))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          -0.5kg
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setWeightKg((prev) => Math.min(250, Math.round((prev + 0.5) * 10) / 10))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          +0.5kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setWeightKg((prev) => Math.min(250, Math.round((prev + 1) * 10) / 10))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          +1kg
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setWeightLb((prev) => Math.max(66, Math.round((prev - 0.2) * 10) / 10))}
                        className="w-11 h-11 rounded-2xl clay-btn flex items-center justify-center text-clay-text dark:text-slate-200 active:scale-95 transition"
                        aria-label="Decrease 0.2 lb"
                      >
                        <Minus className="w-5 h-5 stroke-[2.5]" />
                      </button>
                      <div className="clay-sunken flex-1 py-2 px-3 rounded-2xl text-center">
                        <span className="text-3xl sm:text-4xl font-heading font-black text-clay-lime-dark dark:text-clay-lime font-mono">
                          {weightLb.toFixed(1)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 block font-mono">lbs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWeightLb((prev) => Math.min(550, Math.round((prev + 0.2) * 10) / 10))}
                        className="w-11 h-11 rounded-2xl clay-btn flex items-center justify-center text-clay-text dark:text-slate-200 active:scale-95 transition"
                        aria-label="Increase 0.2 lb"
                      >
                        <Plus className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    </div>

                    <input
                      type="range"
                      min={90}
                      max={400}
                      step={0.2}
                      value={weightLb}
                      onChange={(e) => setWeightLb(Number(e.target.value))}
                      className="clay-range my-2"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setWeightLb((prev) => Math.max(66, Math.round((prev - 2) * 10) / 10))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          -2lbs
                        </button>
                        <button
                          type="button"
                          onClick={() => setWeightLb((prev) => Math.max(66, Math.round((prev - 0.5) * 10) / 10))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          -0.5lb
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setWeightLb((prev) => Math.min(550, Math.round((prev + 0.5) * 10) / 10))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          +0.5lb
                        </button>
                        <button
                          type="button"
                          onClick={() => setWeightLb((prev) => Math.min(550, Math.round((prev + 2) * 10) / 10))}
                          className="clay-btn px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                        >
                          +2lbs
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Fasted morning weigh-in, post-rest day"
                  className="clay-input w-full px-4 py-3 text-sm font-bold text-clay-text dark:text-white placeholder:text-clay-text/40 rounded-2xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black flex items-center justify-center gap-2 transition text-sm active:scale-95 shadow-md mt-4"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Save Weight Entry</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
