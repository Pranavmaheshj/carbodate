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
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 text-left shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
            Training Volume
          </span>
          <h4 className="text-lg font-bold text-slate-900 tracking-tight">
            Sets per Muscle Group
          </h4>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Weekly Total</span>
          <span className="text-base font-bold text-slate-900">
            {totalSets} <span className="text-xs font-semibold text-emerald-700">Sets</span>
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              fontSize={10}
              interval={0}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs">
                      <span className="font-bold text-slate-900 block mb-1">{data.name}</span>
                      <div className="text-emerald-700 font-semibold">
                        Sets: {data.sets} completed
                      </div>
                      <div className="text-slate-500">
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

      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-[11px] text-slate-600 pt-3 border-t border-slate-100">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>
              {item.name}: <strong className="text-slate-900">{item.sets}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
