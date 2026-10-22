import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { BodyCalculations } from '../../types';

interface WeightGaugeProps {
  currentWeightKg: number;
  heightCm: number;
  calculations: BodyCalculations;
  unitSystem?: 'metric' | 'imperial';
}

export const WeightGauge: React.FC<WeightGaugeProps> = ({
  currentWeightKg,
  heightCm,
  calculations,
  unitSystem = 'metric',
}) => {
  const { bmi, bmiCategory, idealWeightRangeKg, weightDifferenceKg } = calculations;

  const minBmi = 14;
  const maxBmi = 36;
  const clampedBmi = Math.min(Math.max(bmi, minBmi), maxBmi);
  const percentage = ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 100;

  const displayWeight = (kg: number) => {
    if (unitSystem === 'imperial') {
      return `${(kg * 2.20462).toFixed(1)} lbs`;
    }
    return `${kg.toFixed(1)} kg`;
  };

  const isHealthy = bmiCategory === 'Healthy';

  return (
    <div className="clay-card p-6 text-left relative overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-clay-text-sub dark:text-slate-400 font-heading">
            Body Composition & Gauge
          </span>
          <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
            <h4 className="text-3xl font-black font-heading text-clay-text dark:text-white tracking-tight">
              {displayWeight(currentWeightKg)}
            </h4>
            <span
              className={`text-xs font-heading font-extrabold px-3 py-1 rounded-full shadow-sm ${
                isHealthy
                  ? 'bg-clay-lime text-[#2B2D42]'
                  : bmiCategory === 'Underweight'
                  ? 'bg-clay-sky text-[#2B2D42]'
                  : 'bg-clay-coral text-[#2B2D42]'
              }`}
            >
              BMI {bmi} • {bmiCategory}
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[11px] text-clay-text-sub dark:text-slate-400 font-semibold block">
            Target Ideal Range ({heightCm} cm)
          </span>
          <span className="text-base font-extrabold font-heading text-clay-lime-dark dark:text-clay-lime">
            {displayWeight(idealWeightRangeKg.min)} – {displayWeight(idealWeightRangeKg.max)}
          </span>
        </div>
      </div>

      {/* Sunken Clay Gauge Track */}
      <div className="relative mt-7 mb-6 pt-4">
        {/* Sunken Groove */}
        <div className="h-6 w-full rounded-full clay-sunken relative overflow-hidden flex items-center p-1">
          {/* Underweight zone */}
          <div className="h-full w-[20.5%] rounded-l-full bg-clay-sky/60" title="Underweight" />

          {/* Raised Lime "Fit Zone" (18.5 - 24.9) */}
          <div
            className="h-full w-[29.1%] bg-clay-lime rounded-full shadow-md flex items-center justify-center relative group cursor-pointer"
            title="Fit Zone (18.5 - 24.9 Healthy BMI)"
          >
            <span className="text-[9px] font-black uppercase tracking-wider text-[#2B2D42] font-heading hidden sm:inline">
              Fit Zone
            </span>
          </div>

          {/* Overweight zone */}
          <div className="h-full w-[22.7%] bg-clay-butter/70" title="Overweight" />

          {/* Obese zone */}
          <div className="h-full w-[27.7%] rounded-r-full bg-clay-coral/60" title="Obese" />
        </div>

        {/* Puffy 3D Clay Marble Pin */}
        <motion.div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
          initial={{ left: '0%' }}
          animate={{ left: `${percentage}%` }}
          transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Puffy 3D Marble */}
          <div className="w-8 h-8 rounded-full bg-white dark:bg-[#252840] border-2 border-clay-lime flex items-center justify-center shadow-clay-card dark:shadow-clay-card-dark font-heading font-black text-[10px] text-clay-text dark:text-white">
            You
          </div>
          {/* Little drop indicator */}
          <div className="w-1.5 h-2 bg-clay-lime rounded-full mt-0.5" />
        </motion.div>

        {/* Scale labels */}
        <div className="flex justify-between text-[11px] font-heading font-bold text-clay-text-sub dark:text-slate-400 mt-2 px-1">
          <span>&lt; 18.5</span>
          <span className="text-[#2B2D42] dark:text-clay-lime font-black">
            18.5 – 24.9 (Fit Zone)
          </span>
          <span>25.0</span>
          <span>30.0+</span>
        </div>
      </div>

      {/* Metric Advice Card */}
      <div className="clay-card-flat p-4 flex items-center justify-between text-xs mt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-clay-lime/30 flex items-center justify-center text-clay-lime-dark font-black">
            ✓
          </div>
          <span className="text-clay-text dark:text-slate-200 font-medium">
            {isHealthy
              ? 'Your weight is currently within the recommended healthy range.'
              : weightDifferenceKg < 0
              ? `You are ~${Math.abs(weightDifferenceKg)} kg above the healthy upper bound.`
              : `You are ~${Math.abs(weightDifferenceKg)} kg below the healthy lower bound.`}
          </span>
        </div>

        <span className="text-xs font-bold font-heading text-clay-text-sub dark:text-slate-400 hidden sm:inline">
          Mifflin-St Jeor Reference
        </span>
      </div>
    </div>
  );
};
