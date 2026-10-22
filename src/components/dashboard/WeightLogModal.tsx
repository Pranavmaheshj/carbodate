import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, Check, Calendar } from 'lucide-react';
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
  const [weightLb, setWeightLb] = useState<number>(kgToLb(profile.currentWeightKg || 75));
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
              <div className="w-12 h-12 rounded-full clay-pebble bg-clay-lime text-clay-text flex items-center justify-center">
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold text-clay-text dark:text-slate-300 mb-1.5">
                  Weigh-In Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-clay-text/50 absolute left-4 top-3.5" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="clay-input w-full pl-11 pr-4 py-3 text-sm text-clay-text dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-clay-text dark:text-slate-300 mb-1.5">
                  Body Weight ({isMetric ? 'kg' : 'lbs'})
                </label>
                {isMetric ? (
                  <input
                    type="number"
                    step={0.1}
                    min={30}
                    max={300}
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="clay-input w-full px-4 py-3.5 text-3xl font-heading font-black text-clay-text dark:text-white font-mono text-center"
                  />
                ) : (
                  <input
                    type="number"
                    step={0.2}
                    min={66}
                    max={660}
                    required
                    value={weightLb}
                    onChange={(e) => setWeightLb(Number(e.target.value))}
                    className="clay-input w-full px-4 py-3.5 text-3xl font-heading font-black text-clay-text dark:text-white font-mono text-center"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-clay-text dark:text-slate-300 mb-1.5">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Fasted morning weigh-in, post-rest day"
                  className="clay-input w-full px-4 py-3 text-sm text-clay-text dark:text-white placeholder:text-clay-text/40"
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
