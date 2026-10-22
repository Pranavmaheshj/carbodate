import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Dumbbell } from 'lucide-react';
import { ExerciseDefinition, MuscleGroup } from '../../types';
import { MUSCLE_GROUPS } from '../../data/exerciseLibrary';

interface AddCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exercise: ExerciseDefinition) => void;
}

export const AddCustomExerciseModal: React.FC<AddCustomExerciseModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('Chest');
  const [equipment, setEquipment] = useState<'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell' | 'other'>('dumbbell');
  const [instructions, setInstructions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEx: ExerciseDefinition = {
      id: `custom_ex_${Date.now()}`,
      name: name.trim(),
      muscleGroup,
      equipment,
      instructions: instructions.trim() || undefined,
      isCustom: true,
    };

    onAdd(newEx);
    setName('');
    setInstructions('');
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
            className="w-full max-w-md clay-card rounded-clay-card p-6 shadow-2xl relative text-left my-auto max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 clay-pebble w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="clay-pebble w-11 h-11 rounded-2xl flex items-center justify-center text-lilac-600 dark:text-lilac-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-display">Add Custom Exercise</h3>
                <span className="text-xs font-bold text-slate-400">Save to your personal exercise library</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bulgarian Split Squat"
                  className="clay-input w-full rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none border-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                  Primary Muscle Group
                </label>
                <select
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                  className="clay-input w-full rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none border-none transition cursor-pointer"
                >
                  {MUSCLE_GROUPS.map((mg) => (
                    <option key={mg} value={mg} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {mg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                  Equipment Type
                </label>
                <select
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value as any)}
                  className="clay-input w-full rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none border-none transition capitalize cursor-pointer"
                >
                  {['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'other'].map((eq) => (
                    <option key={eq} value={eq} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 capitalize">
                      {eq}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 font-display uppercase tracking-wider mb-1.5">
                  Form Cues / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Keep torso upright, pause at bottom"
                  className="clay-input w-full rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none border-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-clay-btn clay-btn-lime font-black flex items-center justify-center gap-2 transition text-sm active:scale-95 mt-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Save to Library</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
