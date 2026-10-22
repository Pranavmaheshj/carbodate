import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { GymWorkoutSession } from '../../types';

interface WeeklyVolumeChartProps {
  sessions: GymWorkoutSession[];
}

const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#10B981', // Emerald
  Back: '#0D9488',  // Teal
  Shoulder: '#65A30D', // Lime
  Legs: '#D97706',  // Amber
  Arms: '#7C3AED',  // Purple
  Core: '#DB2777',  // Pink
  'Full body': '#059669',
};

export const WeeklyVolumeChart: React.FC<WeeklyVolumeChartProps> = ({ sessions }) => {
  const muscleData: Record<string, { sets: number; volumeKg: number }> = {
    Chest: { sets: 0, volumeKg: 0 },
    Back: { sets: 0, volumeKg: 0 },
    Shoulder: { sets: 0, volumeKg: 0 },
    Legs: { sets: 0, volumeKg: 0 },
    Arms: { sets: 0, volumeKg: 0 },
    Core: { sets: 0, volumeKg: 0 },
  };

  sessions.forEach((session) => {
    session.exercises.forEach((ex) => {
      const group = ex.muscleGroup in muscleData ? ex.muscleGroup : 'Chest';
      ex.sets.forEach((set) => {
        if (set.completed) {
          muscleData[group].sets += 1;
          muscleData[group].volumeKg += set.reps * set.weightKg;
        }
      });
    });
  });

  const chartData = Object.entries(muscleData).map(([name, data]) => ({
    name,
    sets: data.sets,
    volumeKg: Math.round(data.volumeKg),
    color: MUSCLE_COLORS[name] || '#10B981',
  }));

  const totalSets = chartData.reduce((s, c) => s + c.sets, 0);

  return (
    <div className="clay-card rounded-clay-card p-6 sm:p-7 text-left">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="clay-chip bg-clay-lilac text-clay-text text-xs mb-1.5">
            Training Volume
          </span>
          <h4 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight mt-1">
            Sets per Muscle Group
          </h4>
        </div>
        <div className="text-right">
          <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400 block font-bold">Weekly Total</span>
          <span className="text-lg font-heading font-black text-clay-text dark:text-white font-mono">
            {totalSets} <span className="text-xs font-heading font-black text-clay-lilac-dark dark:text-clay-lilac">Sets</span>
          </span>
        </div>
      </div>

      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              fontSize={11}
              interval={0}
              tickLine={false}
              axisLine={{ stroke: '#64748B', opacity: 0.3 }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#64748B', opacity: 0.3 }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="clay-card p-3 rounded-2xl shadow-lg text-xs space-y-0.5 border border-white/20">
                      <span className="font-heading font-black text-clay-text dark:text-white block mb-0.5">{data.name}</span>
                      <div className="text-clay-lilac-dark dark:text-clay-lilac font-bold font-mono">
                        Sets: {data.sets} completed
                      </div>
                      <div className="text-clay-text/60 dark:text-slate-400 font-mono text-[10px]">
                        Volume: {data.volumeKg.toLocaleString()} kg lifted
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="sets" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3.5 mt-5 text-[11px] font-heading font-black text-clay-text/80 dark:text-slate-300 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>
              {item.name}: <strong className="text-clay-text dark:text-white">{item.sets}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
