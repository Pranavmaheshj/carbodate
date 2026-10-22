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
    <div className="bg-white border border-slate-200 rounded-3xl p-5 text-left shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
            <Droplets className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">Water & Hydration</h4>
            <span className="text-xs text-slate-500">
              Optimal metabolic rate requires sufficient fluid intake
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-bold text-slate-900">
            {currentMl} <span className="text-xs text-slate-500 font-normal">/ {goalMl} ml</span>
          </span>
          <span className="text-xs text-sky-700 font-bold block">{percentage}% Goal</span>
        </div>
      </div>

      {/* Animated Liquid Fill Bar */}
      <div className="h-3.5 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden p-0.5 mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-sky-400 to-teal-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Quick Add Buttons */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => onAddWater(250)}
            className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-800 text-slate-700 text-[11px] sm:text-xs font-bold border border-slate-200 transition flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> 250ml
          </button>
          <button
            onClick={() => onAddWater(500)}
            className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-800 text-slate-700 text-[11px] sm:text-xs font-bold border border-slate-200 transition flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> 500ml
          </button>
          <button
            onClick={() => onAddWater(1000)}
            className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-800 text-slate-700 text-[11px] sm:text-xs font-bold border border-slate-200 transition flex items-center gap-1 active:scale-95 hidden sm:flex"
          >
            <Plus className="w-3.5 h-3.5" /> 1000ml
          </button>
        </div>

        <button
          onClick={onReset}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          title="Reset water log"
          aria-label="Reset water log"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
