import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Dumbbell,
  Waves,
  Gauge,
  X,
  Play,
  ChevronRight
} from 'lucide-react';
import { ActivityType } from '../../types';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOutdoor: (type: ActivityType) => void;
  onStartIndoor: () => void;
  onStartSwim: () => void;
  onStartGym: () => void;
}

export const QuickStartModal: React.FC<QuickStartModalProps> = ({
  isOpen,
  onClose,
  onStartOutdoor,
  onStartIndoor,
  onStartSwim,
  onStartGym,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md clay-card rounded-clay-card p-6 relative text-left"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-700/60 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full clay-pebble bg-clay-lime text-clay-text flex items-center justify-center font-black">
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-black text-clay-text dark:text-white">
                    Start New Activity
                  </h3>
                  <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400">
                    Choose your workout mode
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full clay-pebble flex items-center justify-center text-clay-text/60 hover:text-clay-text dark:text-slate-400 dark:hover:text-white transition"
                aria-label="Close activity launcher"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Outdoor GPS */}
              <button
                onClick={() => {
                  onClose();
                  onStartOutdoor('running');
                }}
                className="w-full p-4 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black flex items-center justify-between active:scale-95 transition group shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-clay-text">
                    <Compass className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black block">Outdoor GPS Route</span>
                    <span className="text-[11px] font-sans text-clay-text/80 font-normal">
                      Running, Cycling, Walking with live map
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Gym Workout */}
              <button
                onClick={() => {
                  onClose();
                  onStartGym();
                }}
                className="w-full p-4 rounded-clay-btn clay-btn text-clay-text dark:text-white font-heading font-black flex items-center justify-between active:scale-95 transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full clay-pebble bg-clay-lilac text-clay-text flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black block">Gym Resistance Session</span>
                    <span className="text-[11px] font-sans text-clay-text/60 dark:text-slate-400 font-normal">
                      Log sets, reps, weight, and rest timer
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-clay-text/50 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Indoor Cardio */}
              <button
                onClick={() => {
                  onClose();
                  onStartIndoor();
                }}
                className="w-full p-4 rounded-clay-btn clay-btn text-clay-text dark:text-white font-heading font-black flex items-center justify-between active:scale-95 transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full clay-pebble bg-clay-coral text-clay-text flex items-center justify-center">
                    <Gauge className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black block">Indoor Cardio</span>
                    <span className="text-[11px] font-sans text-clay-text/60 dark:text-slate-400 font-normal">
                      Treadmill, stationary bike, elliptical
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-clay-text/50 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Swimming */}
              <button
                onClick={() => {
                  onClose();
                  onStartSwim();
                }}
                className="w-full p-4 rounded-clay-btn clay-btn text-clay-text dark:text-white font-heading font-black flex items-center justify-between active:scale-95 transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full clay-pebble bg-clay-sky text-clay-text flex items-center justify-center">
                    <Waves className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black block">Swim Laps</span>
                    <span className="text-[11px] font-sans text-clay-text/60 dark:text-slate-400 font-normal">
                      Pool laps or open water session
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-clay-text/50 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
