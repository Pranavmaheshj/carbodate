import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Scale, Flame, Compass, Dumbbell, TrendingDown, TrendingUp } from 'lucide-react';
import {
  WeightRecord,
  MealItem,
  ActivityRecord,
  GymWorkoutSession,
  UserProfile,
  BodyCalculations
} from '../../types';
import { WeeklyVolumeChart } from '../gym/WeeklyVolumeChart';
import { formatLocalDate, getActivityLocalDate } from '../../services/calculations';

interface ProgressChartsProps {
  weights: WeightRecord[];
  meals: MealItem[];
  activities: ActivityRecord[];
  gymSessions: GymWorkoutSession[];
  profile: UserProfile;
  calculations: BodyCalculations;
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({
  weights,
  meals,
  activities,
  gymSessions,
  profile,
  calculations,
}) => {
  const [activeChart, setActiveChart] = useState<'weight' | 'calories' | 'distance' | 'volume'>('weight');

  // Format weight trend data
  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const weightData = sortedWeights.length > 0
    ? sortedWeights.map((w) => ({
        date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: w.weightKg,
        target: profile.targetWeightKg,
      }))
    : [{ date: 'Today', weight: profile.currentWeightKg, target: profile.targetWeightKg }];

  // Calories In vs Out by Day (past 7 days)
  const daysArray = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return formatLocalDate(d);
  });

  const caloriesInOutData = daysArray.map((dateStr) => {
    const dayMeals = meals.filter((m) => m.date === dateStr);
    const dayCalsIn = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);

    const dayActivities = activities.filter((a) => getActivityLocalDate(a.startTime) === dateStr);
    const dayCardioBurn = dayActivities.reduce((s, a) => s + (a.caloriesBurned || 0), 0);

    const dayGym = gymSessions.filter((g) => getActivityLocalDate(g.startTime) === dateStr);
    const dayGymBurn = dayGym.reduce((s, g) => s + (g.caloriesBurned || 0), 0);

    const totalBurned = dayCardioBurn + dayGymBurn;

    return {
      date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
      foodIn: dayCalsIn,
      exerciseOut: totalBurned,
      targetBudget: calculations.dailyCalorieTarget,
    };
  });

  // Cardio distance by day
  const distanceData = daysArray.map((dateStr) => {
    const dayActivities = activities.filter((a) => getActivityLocalDate(a.startTime) === dateStr);
    const totalDistKm = dayActivities.reduce((s, a) => s + (a.distanceMeters || 0), 0) / 1000;
    return {
      date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
      distanceKm: Math.round(totalDistKm * 10) / 10,
    };
  });

  // Calculate weight change
  const startWeight = sortedWeights[0]?.weightKg || profile.currentWeightKg;
  const currentWeight = sortedWeights[sortedWeights.length - 1]?.weightKg || profile.currentWeightKg;
  const weightDiff = Math.round((currentWeight - startWeight) * 10) / 10;
  const targetDiff = Math.round(Math.abs(currentWeight - profile.targetWeightKg) * 10) / 10;

  return (
    <div className="space-y-6 text-left">
      {/* Chart Selector Pills */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="clay-sunken p-1.5 rounded-full flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full">
          {[
            { id: 'weight' as const, label: 'Weight Trend', icon: Scale },
            { id: 'calories' as const, label: 'Calories In vs Out', icon: Flame },
            { id: 'distance' as const, label: 'Cardio Distance', icon: Compass },
            { id: 'volume' as const, label: 'Gym Volume', icon: Dumbbell },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeChart === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveChart(item.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-heading font-black rounded-full whitespace-nowrap transition-all ${
                  isSelected
                    ? 'clay-btn-lime text-clay-text scale-105 shadow-sm'
                    : 'text-clay-text/70 dark:text-slate-400 hover:text-clay-text dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHART 1: Weight Progression Area Chart */}
      {activeChart === 'weight' && (
        <div className="clay-card rounded-clay-card p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">
            <div>
              <span className="clay-chip bg-clay-lime text-clay-text text-xs mb-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Weight Journey</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-clay-text dark:text-white tracking-tight mt-1">
                {currentWeight} kg{' '}
                <span className="text-sm font-sans font-normal text-clay-text/60 dark:text-slate-400">
                  (Goal: {profile.targetWeightKg} kg)
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl clay-card-flat text-right">
                <span className="text-[10px] text-clay-text/60 dark:text-slate-400 uppercase font-heading font-black block">
                  Net Progress
                </span>
                <span className={`text-base font-heading font-black flex items-center justify-end gap-1 ${
                  weightDiff <= 0 ? 'text-clay-lime-dark dark:text-clay-lime' : 'text-clay-coral-dark dark:text-clay-coral'
                }`}>
                  {weightDiff <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {Math.abs(weightDiff)} kg {weightDiff <= 0 ? 'lost' : 'gained'}
                </span>
              </div>

              <div className="p-3 rounded-2xl clay-card-lime text-right">
                <span className="text-[10px] text-clay-text/70 uppercase font-heading font-black block">
                  To Goal
                </span>
                <span className="text-base font-heading font-black text-clay-text">
                  {targetDiff} kg left
                </span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#B8F25B" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#B8F25B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#64748B', opacity: 0.3 }}
                />
                <YAxis
                  domain={['dataMin - 1', 'dataMax + 1']}
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#64748B', opacity: 0.3 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="clay-card p-3 rounded-2xl text-xs space-y-0.5 shadow-lg border border-white/20">
                          <span className="font-heading font-black text-clay-text dark:text-white block">{data.date}</span>
                          <span className="text-clay-lime-dark dark:text-clay-lime font-mono font-black text-sm block">
                            {data.weight} kg
                          </span>
                          <span className="text-clay-text/60 dark:text-slate-400 block text-[10px]">
                            Target: {data.target} kg
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={profile.targetWeightKg}
                  stroke="#85C722"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Goal',
                    fill: '#85C722',
                    fontSize: 11,
                    position: 'insideBottomRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#85C722"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#weightGradLight)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 2: Calories In vs Out Bar Chart */}
      {activeChart === 'calories' && (
        <div className="clay-card rounded-clay-card p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="clay-chip bg-clay-coral text-clay-text text-xs mb-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>Energy Balance</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight mt-1">
                Calories Consumed vs. Exercise Burned
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-heading font-black">
              <span className="flex items-center gap-1.5 text-clay-butter-dark dark:text-clay-butter">
                <span className="w-3 h-3 rounded-full bg-clay-butter" /> Eaten
              </span>
              <span className="flex items-center gap-1.5 text-clay-lime-dark dark:text-clay-lime">
                <span className="w-3 h-3 rounded-full bg-clay-lime" /> Burned
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caloriesInOutData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis
                  dataKey="date"
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
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const net = data.foodIn - data.exerciseOut;
                      return (
                        <div className="clay-card p-3.5 rounded-2xl text-xs space-y-1 shadow-lg border border-white/20">
                          <span className="font-heading font-black text-clay-text dark:text-white block">{data.date}</span>
                          <div className="text-clay-butter-dark dark:text-clay-butter font-bold">
                            Food Eaten: {data.foodIn} kcal
                          </div>
                          <div className="text-clay-coral-dark dark:text-clay-coral font-bold">
                            Exercise Burned: {data.exerciseOut} kcal
                          </div>
                          <div className="text-clay-text dark:text-white font-black pt-1 border-t border-slate-200/40">
                            Net Intake: {net} kcal
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={calculations.dailyCalorieTarget}
                  stroke="#7CCBFF"
                  strokeDasharray="3 3"
                />
                <Bar dataKey="foodIn" fill="#FFD76B" radius={[8, 8, 0, 0]} />
                <Bar dataKey="exerciseOut" fill="#B8F25B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 3: Cardio Distance Trend */}
      {activeChart === 'distance' && (
        <div className="clay-card rounded-clay-card p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <span className="clay-chip bg-clay-sky text-clay-text text-xs mb-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Cardio Output</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-heading font-black text-clay-text dark:text-white tracking-tight mt-1">
                Daily Running & Cycling Distance (km)
              </h3>
            </div>
            <span className="text-xs font-heading font-black text-clay-sky-dark dark:text-clay-sky">
              Total 7d: {distanceData.reduce((s, d) => s + d.distanceKm, 0).toFixed(1)} km
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
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
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="clay-card p-3 rounded-2xl shadow-lg text-xs border border-white/20">
                          <span className="font-heading font-black text-clay-text dark:text-white">{data.date}: </span>
                          <span className="text-clay-sky-dark dark:text-clay-sky font-bold font-mono">
                            {data.distanceKm} km
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="distanceKm" fill="#7CCBFF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 4: Gym Volume Chart per muscle group */}
      {activeChart === 'volume' && (
        <WeeklyVolumeChart sessions={gymSessions} />
      )}
    </div>
  );
};
