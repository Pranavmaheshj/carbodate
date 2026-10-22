import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Utensils, Sparkles } from 'lucide-react';

interface CalorieRingProps {
  targetCalories: number;
  eatenCalories: number;
  burnedCalories: number;
  size?: number;
  strokeWidth?: number;
}

export const CalorieRing: React.FC<CalorieRingProps> = ({
  targetCalories,
  eatenCalories,
  burnedCalories,
  size = 260,
  strokeWidth = 14,
}) => {
  const totalBudget = targetCalories + burnedCalories;
  const remaining = Math.max(0, totalBudget - eatenCalories);
  const isOverBudget = eatenCalories > totalBudget;

  // Animated Count-Up Number
  const [displayNumber, setDisplayNumber] = useState<number>(0);

  useEffect(() => {
    let start = 0;
    const end = remaining;
    if (start === end) return;
    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayNumber(end);
        clearInterval(timer);
      } else {
        setDisplayNumber(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [remaining]);

  const center = size / 2;

  // 3 Concentric Clay Rings:
  // Ring 1 (Outer): Eaten = Lime (#B8F25B)
  const r1 = center - strokeWidth - 4;
  const c1 = 2 * Math.PI * r1;
  const eatenRatio = totalBudget > 0 ? Math.min(eatenCalories / totalBudget, 1) : 0;
  const dashoffset1 = c1 - eatenRatio * c1;

  // Ring 2 (Middle): Burned = Coral (#FF9F8A)
  const r2 = r1 - strokeWidth - 6;
  const c2 = 2 * Math.PI * r2;
  const burnedTarget = Math.max(400, targetCalories * 0.25);
  const burnedRatio = Math.min(burnedCalories / burnedTarget, 1);
  const dashoffset2 = c2 - burnedRatio * c2;

  // Ring 3 (Inner): Remaining / Budget = Sky (#7CCBFF)
  const r3 = r2 - strokeWidth - 6;
  const c3 = 2 * Math.PI * r3;
  const remRatio = totalBudget > 0 ? Math.min(remaining / totalBudget, 1) : 0;
  const dashoffset3 = c3 - remRatio * c3;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none mx-auto w-full"
      style={{ maxWidth: size, aspectRatio: '1 / 1' }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
        <defs>
          {/* 3D Clay Tube Lighting Filter for outer ring */}
          <filter id="clayTubeFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="3" stdDeviation="3" floodColor="#7878aa" floodOpacity="0.3" />
          </filter>

          {/* Gradients to give 3D cylinder/tube curvature */}
          <linearGradient id="clayLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D2F88D" />
            <stop offset="60%" stopColor="#B8F25B" />
            <stop offset="100%" stopColor="#85C722" />
          </linearGradient>

          <linearGradient id="clayCoralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC2B5" />
            <stop offset="60%" stopColor="#FF9F8A" />
            <stop offset="100%" stopColor="#E76E55" />
          </linearGradient>

          <linearGradient id="claySkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B2E1FF" />
            <stop offset="60%" stopColor="#7CCBFF" />
            <stop offset="100%" stopColor="#40A2EB" />
          </linearGradient>

          {/* Soft Clay Drop Shadow */}
          <filter id="clayTubeFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#7878aa" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* --- SUNKEN CLAY GROOVE TRACKS --- */}
        {/* Track 1 */}
        <circle
          cx={center}
          cy={center}
          r={r1}
          fill="none"
          stroke="#DDE1F5"
          className="dark:stroke-[#1B1D2B]"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Track 2 */}
        <circle
          cx={center}
          cy={center}
          r={r2}
          fill="none"
          stroke="#DDE1F5"
          className="dark:stroke-[#1B1D2B]"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Track 3 */}
        <circle
          cx={center}
          cy={center}
          r={r3}
          fill="none"
          stroke="#DDE1F5"
          className="dark:stroke-[#1B1D2B]"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* --- CLAY TUBES (ACTIVE VALUE STROKES) --- */}
        {/* Outer Tube: Eaten (Lime) */}
        <motion.circle
          cx={center}
          cy={center}
          r={r1}
          fill="none"
          stroke="url(#clayLimeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={c1}
          strokeDashoffset={c1}
          strokeLinecap="round"
          filter="url(#clayTubeFilter)"
          animate={{ strokeDashoffset: dashoffset1 }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        />

        {/* Middle Tube: Burned (Coral) */}
        <motion.circle
          cx={center}
          cy={center}
          r={r2}
          fill="none"
          stroke="url(#clayCoralGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={c2}
          strokeDashoffset={c2}
          strokeLinecap="round"
          filter="url(#clayTubeFilter)"
          animate={{ strokeDashoffset: dashoffset2 }}
          transition={{ duration: 1.2, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
        />

        {/* Inner Tube: Remaining (Sky) */}
        <motion.circle
          cx={center}
          cy={center}
          r={r3}
          fill="none"
          stroke="url(#claySkyGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={c3}
          strokeDashoffset={c3}
          strokeLinecap="round"
          filter="url(#clayTubeFilter)"
          animate={{ strokeDashoffset: dashoffset3 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>

      {/* Center Content: Raised Clay Disc */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
        <div className="w-[124px] h-[124px] sm:w-[136px] sm:h-[136px] rounded-full bg-white dark:bg-[#252840] flex flex-col items-center justify-center text-center shadow-clay-card dark:shadow-clay-card-dark transition-transform">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-clay-text-sub dark:text-slate-400 font-heading">
            {isOverBudget ? 'Over Budget' : 'Remaining'}
          </span>

          <div className="flex items-baseline gap-0.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-heading text-clay-text dark:text-white tracking-tight">
              {isOverBudget ? `+${eatenCalories - totalBudget}` : displayNumber.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-clay-text-sub dark:text-slate-400 font-mono">
              kcal
            </span>
          </div>

          {/* Mini Status Clay Pill */}
          <div className="flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-clay-bg dark:bg-[#1B1D2B] shadow-clay-sunken dark:shadow-clay-sunken-dark">
            <span className="w-2 h-2 rounded-full bg-clay-lime" title="Eaten" />
            <span className="text-[9px] font-mono font-bold text-clay-text dark:text-slate-300">
              {eatenCalories}
            </span>
            <span className="text-[8px] text-clay-text-sub dark:text-slate-500">•</span>
            <span className="w-2 h-2 rounded-full bg-clay-coral" title="Burned" />
            <span className="text-[9px] font-mono font-bold text-clay-text dark:text-slate-300">
              {burnedCalories}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
