import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Plus, RotateCcw } from 'lucide-react';

interface WaterTrackerProps {
  currentMl: number;
  goalMl: number;
  onAddWater: (amount: number) => void;
  onReset: () => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  currentMl,
  goalMl,
  onAddWater,
  onReset,
}) => {
  const percentage = Math.min(Math.round((currentMl / goalMl) * 100), 100);

  return (
    <div className="clay-card rounded-clay-card p-6 text-left">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full clay-pebble bg-clay-sky text-clay-text flex items-center justify-center">
            <Droplets className="w-6 h-6 stroke-[2.2] fill-current" />
          </div>
          <div>
            <h4 className="font-heading font-black text-clay-text dark:text-white text-xl">
              Water & Hydration
            </h4>
            <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400">
              Optimal metabolic rate requires steady fluid intake
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl font-heading font-black text-clay-text dark:text-white font-mono block">
            {currentMl} <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400 font-normal">/ {goalMl} ml</span>
          </span>
          <span className="text-xs font-heading font-black text-clay-sky-dark dark:text-clay-sky">
            {percentage}% Goal
          </span>
        </div>
      </div>

      {/* Sunken Clay Liquid Fill Bar */}
      <div className="h-5 w-full clay-sunken rounded-full overflow-hidden p-1 mb-5">
        <motion.div
          className="h-full clay-btn-sky rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 180 }}
        />
      </div>

      {/* Quick Add Buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onAddWater(250)}
            className="py-2.5 px-4 rounded-clay-btn clay-btn text-clay-text dark:text-white text-xs font-heading font-black transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> 250ml
          </button>
          <button
            onClick={() => onAddWater(500)}
            className="py-2.5 px-4 rounded-clay-btn clay-btn text-clay-text dark:text-white text-xs font-heading font-black transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> 500ml
          </button>
          <button
            onClick={() => onAddWater(1000)}
            className="py-2.5 px-4 rounded-clay-btn clay-btn text-clay-text dark:text-white text-xs font-heading font-black transition flex items-center gap-1.5 active:scale-95 hidden sm:flex"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> 1000ml
          </button>
        </div>

        <button
          onClick={onReset}
          className="w-10 h-10 rounded-full clay-pebble text-clay-text/50 hover:text-clay-text dark:text-slate-400 dark:hover:text-white transition active:scale-95"
          title="Reset water log"
          aria-label="Reset water log"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
