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
    return d.toISOString().split('T')[0];
  });

  const caloriesInOutData = daysArray.map((dateStr) => {
    const dayMeals = meals.filter((m) => m.date === dateStr);
    const dayCalsIn = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);

    const dayActivities = activities.filter((a) => a.startTime.startsWith(dateStr));
    const dayCardioBurn = dayActivities.reduce((s, a) => s + (a.caloriesBurned || 0), 0);

    const dayGym = gymSessions.filter((g) => g.startTime.startsWith(dateStr));
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
    const dayActivities = activities.filter((a) => a.startTime.startsWith(dateStr));
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
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto scrollbar-none">
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
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHART 1: Weight Progression Area Chart */}
      {activeChart === 'weight' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
                Weight Journey
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {currentWeight} kg{' '}
                <span className="text-xs font-semibold text-slate-500">
                  (Goal: {profile.targetWeightKg} kg)
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Net Progress
                </span>
                <span className={`text-sm font-bold flex items-center justify-end gap-1 ${
                  weightDiff <= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {weightDiff <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {Math.abs(weightDiff)} kg {weightDiff <= 0 ? 'lost' : 'gained'}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-right">
                <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                  To Goal
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {targetDiff} kg left
                </span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  domain={['dataMin - 1', 'dataMax + 1']}
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs">
                          <span className="font-bold text-slate-900 block">{data.date}</span>
                          <span className="text-emerald-700 font-extrabold text-sm">
                            {data.weight} kg
                          </span>
                          <span className="text-slate-500 block text-[10px]">
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
                  stroke="#059669"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Goal',
                    fill: '#059669',
                    fontSize: 10,
                    position: 'insideBottomRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#10B981"
                  strokeWidth={2.5}
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
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
                Energy Balance
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Calories Consumed vs. Exercise Burned
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Eaten
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Burned
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caloriesInOutData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis
                  dataKey="date"
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
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const net = data.foodIn - data.exerciseOut;
                      return (
                        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <span className="font-bold text-slate-900 block">{data.date}</span>
                          <div className="text-amber-700 font-semibold">
                            Food Eaten: {data.foodIn} kcal
                          </div>
                          <div className="text-emerald-700 font-semibold">
                            Exercise Burned: {data.exerciseOut} kcal
                          </div>
                          <div className="text-slate-900 font-bold pt-1 border-t border-slate-100">
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
                  stroke="#0D9488"
                  strokeDasharray="3 3"
                />
                <Bar dataKey="foodIn" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="exerciseOut" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 3: Cardio Distance Trend */}
      {activeChart === 'distance' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
                Cardio Output
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Daily Running & Cycling Distance (km)
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700">
              Total 7d: {distanceData.reduce((s, d) => s + d.distanceKm, 0).toFixed(1)} km
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
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
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
                          <span className="font-bold text-slate-900">{data.date}: </span>
                          <span className="text-emerald-700 font-bold">
                            {data.distanceKm} km
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="distanceKm" fill="#0D9488" radius={[6, 6, 0, 0]} />
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
