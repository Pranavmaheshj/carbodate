import React, { useState, useMemo } from 'react';
import {
  Compass,
  Play,
  Flame,
  Clock,
  Gauge,
  Plus,
  Trash2,
  Waves,
  Bike,
  Footprints,
  Calendar,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ActivityRecord, ActivityType, UserProfile } from '../../types';
import { formatDuration, formatLocalDate, getActivityLocalDate } from '../../services/calculations';

interface ActivityViewProps {
  activities: ActivityRecord[];
  profile: UserProfile;
  onStartLiveGps: (type: ActivityType) => void;
  onOpenIndoorModal: () => void;
  onOpenSwimModal: () => void;
  onSelectActivity: (activity: ActivityRecord) => void;
  onDeleteActivity: (id: string) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities,
  profile,
  onStartLiveGps,
  onOpenIndoorModal,
  onOpenSwimModal,
  onSelectActivity,
  onDeleteActivity,
}) => {
  const [selectedType, setSelectedType] = useState<ActivityType>('running');
  const [statsScope, setStatsScope] = useState<'today' | 'all'>('today');

  const todayDateStr = formatLocalDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateStr = formatLocalDate(yesterday);

  // Today's fresh cardio stats - resets cleanly to 0.00 km every new calendar day!
  const todayActivities = activities.filter((a) => getActivityLocalDate(a.startTime) === todayDateStr);
  const todayDistanceMeters = todayActivities.reduce((sum, a) => sum + (a.distanceMeters || 0), 0);
  const todayCalories = todayActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);
  const todaySteps = todayActivities.reduce((sum, a) => sum + (a.steps || a.indoorDetails?.steps || 0), 0);

  // All-time cumulative stats
  const totalDistanceMeters = activities.reduce((sum, a) => sum + (a.distanceMeters || 0), 0);
  const totalCalories = activities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);

  // Group activities day by day so user can see day-by-day stored history
  const groupedActivities = useMemo(() => {
    const groups: { [dateStr: string]: ActivityRecord[] } = {};
    activities.forEach((act) => {
      const dStr = getActivityLocalDate(act.startTime);
      if (!groups[dStr]) groups[dStr] = [];
      groups[dStr].push(act);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((dateStr) => {
        const isToday = dateStr === todayDateStr;
        const isYesterday = dateStr === yesterdayDateStr;
        const groupDate = new Date(dateStr + 'T12:00:00');
        const formattedDate = isToday
          ? 'Today'
          : isYesterday
          ? 'Yesterday'
          : groupDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

        const dayTotalKm = groups[dateStr].reduce((s, a) => s + (a.distanceMeters || 0), 0) / 1000;
        const dayTotalCals = groups[dateStr].reduce((s, a) => s + (a.caloriesBurned || 0), 0);
        return {
          dateStr,
          label: formattedDate,
          isToday,
          dayTotalKm: Math.round(dayTotalKm * 100) / 100,
          dayTotalCals,
          items: groups[dateStr],
        };
      });
  }, [activities, todayDateStr, yesterdayDateStr]);

  const displayDistKm = statsScope === 'today'
    ? (todayDistanceMeters / 1000).toFixed(2)
    : (totalDistanceMeters / 1000).toFixed(1);
  const displayCalories = statsScope === 'today' ? todayCalories : totalCalories;

  return (
    <div className="space-y-6 pb-24 md:pb-12 text-left">
      {/* Top Banner / Summary */}
      <div className="clay-card rounded-clay-card p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] uppercase font-black tracking-wider text-lime-700 dark:text-lime-400 font-display">
                Cardio & GPS Tracking
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-display">
              Record Outdoor & Indoor Workouts
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
              Live GPS route drawing, Haversine filtering, kilometer splits, and day-by-day automatic history storage.
            </p>
          </div>

          {/* Quick Stats Pill with Daily vs All-Time Toggle */}
          <div className="clay-sunken p-3.5 sm:p-4 rounded-2xl flex flex-col gap-2 min-w-[210px]">
            {/* Scope Toggle: Today (Starts fresh daily) vs All Time */}
            <div className="flex items-center justify-between gap-1 p-1 bg-white/60 dark:bg-slate-900/60 rounded-xl text-[10px] font-heading font-black">
              <button
                type="button"
                onClick={() => setStatsScope('today')}
                className={`flex-1 py-1 px-2 rounded-lg transition ${
                  statsScope === 'today'
                    ? 'bg-lime-400 text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setStatsScope('all')}
                className={`flex-1 py-1 px-2 rounded-lg transition ${
                  statsScope === 'all'
                    ? 'bg-lime-400 text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All-Time
              </button>
            </div>

            <div className="flex items-center justify-around sm:justify-between text-center sm:text-right pt-1">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold font-display">
                  {statsScope === 'today' ? 'Today Distance' : 'Total Distance'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {displayDistKm}{' '}
                  <span className="text-xs font-bold text-lime-600 dark:text-lime-400">km</span>
                </span>
              </div>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700/60 sm:hidden" />

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold font-display">
                  {statsScope === 'today' ? 'Burned Today' : 'Total Burned'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-coral-600 dark:text-coral-400 font-mono">
                  {displayCalories.toLocaleString()}{' '}
                  <span className="text-xs font-bold text-slate-400">kcal</span>
                </span>
              </div>
            </div>

            {statsScope === 'today' && (
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 text-center sm:text-right font-bold block pt-0.5">
                ✓ Resets daily at midnight • Saved to history
              </span>
            )}
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <button
            onClick={() => onStartLiveGps(selectedType)}
            className="p-4 rounded-2xl clay-btn-lime text-left flex items-center justify-between active:scale-[0.98] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl clay-pebble flex items-center justify-center">
                <Play className="w-5 h-5 fill-current text-slate-900 transition-transform group-hover:scale-110" />
              </div>
              <div>
                <span className="block text-sm font-black font-display text-slate-900">Outdoor GPS</span>
                <span className="text-[11px] text-slate-700 font-bold capitalize">
                  Start {selectedType}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-900 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onOpenIndoorModal}
            className="p-4 rounded-2xl clay-btn text-left flex items-center justify-between active:scale-[0.98] transition group text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl clay-pebble text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-black font-display">Indoor Cardio</span>
                <span className="text-[11px] text-slate-400 font-semibold">Treadmill, Bike, Elliptical</span>
              </div>
            </div>
            <Plus className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition" />
          </button>

          <button
            onClick={onOpenSwimModal}
            className="p-4 rounded-2xl clay-btn-sky text-left flex items-center justify-between active:scale-[0.98] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl clay-pebble text-sky-800 flex items-center justify-center">
                <Waves className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-black font-display text-slate-900">Swim Logger</span>
                <span className="text-[11px] text-slate-700 font-bold">Pool Laps or Open Water</span>
              </div>
            </div>
            <Plus className="w-5 h-5 text-slate-900 transition" />
          </button>
        </div>
      </div>

      {/* Activity Type Selection Tabs */}
      <div className="clay-sunken p-1.5 rounded-full flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'running' as ActivityType, label: 'Running', icon: Footprints },
          { id: 'cycling' as ActivityType, label: 'Cycling', icon: Bike },
          { id: 'walking' as ActivityType, label: 'Walking', icon: Compass },
          { id: 'jogging' as ActivityType, label: 'Jogging', icon: Footprints },
          { id: 'swimming' as ActivityType, label: 'Swimming', icon: Waves },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = selectedType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition flex-shrink-0 ${
                isSelected
                  ? 'clay-btn-lime'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Activity History Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight font-display">Recorded Activities</h3>
          <span className="text-xs text-slate-400 font-bold font-mono">
            {activities.length} sessions
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="clay-card rounded-clay-card p-10 text-center">
            <div className="w-16 h-16 clay-pebble rounded-full flex items-center justify-center mx-auto mb-3">
              <Compass className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-base font-black text-slate-800 dark:text-slate-100 font-display">No activities recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tap "Outdoor GPS" or "Indoor Cardio" to track your runs, bike rides, or swim sessions.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedActivities.map((group) => (
              <div key={group.dateStr} className="space-y-2.5">
                {/* Day Header Badge */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-heading font-black px-2.5 py-0.5 rounded-full ${
                        group.isToday
                          ? 'bg-lime-400 text-slate-950 shadow-xs'
                          : 'clay-sunken text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {group.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">
                      {group.items.length} workout{group.items.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>{group.dayTotalKm} km</span>
                    <span>•</span>
                    <span className="text-coral-600 dark:text-coral-400">{group.dayTotalCals} kcal</span>
                  </div>
                </div>

                {/* Day Workout Cards */}
                <div className="space-y-2.5">
                  {group.items.map((act) => {
                    const timeStr = new Date(act.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const distKm = (act.distanceMeters / 1000).toFixed(2);

                    return (
                      <div
                        key={act.id}
                        onClick={() => onSelectActivity(act)}
                        className="clay-card-flat hover:scale-[1.01] p-4 rounded-2xl transition cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl clay-pebble flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                            {act.type === 'cycling' ? (
                              <Bike className="w-6 h-6 text-lime-600 dark:text-lime-400" />
                            ) : act.type === 'swimming' ? (
                              <Waves className="w-6 h-6 text-sky-500" />
                            ) : (
                              <Footprints className="w-6 h-6 text-coral-500" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm group-hover:text-lime-600 dark:group-hover:text-lime-400 transition font-display">
                                {act.title}
                              </h4>
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full clay-sunken text-slate-500 dark:text-slate-400">
                                {act.environment}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 font-bold mt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {timeStr}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" /> {formatDuration(act.durationSeconds)}
                              </span>
                              {(act.steps || act.indoorDetails?.steps) && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-lime-600 dark:text-lime-400 flex items-center gap-0.5">
                                    <Footprints className="w-3 h-3" /> {(act.steps || act.indoorDetails?.steps)?.toLocaleString()} steps
                                  </span>
                                </>
                              )}
                              {act.indoorDetails?.treadmillIncline !== undefined && act.indoorDetails.treadmillIncline > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-amber-600 dark:text-amber-400">
                                    {act.indoorDetails.treadmillIncline}% inc
                                  </span>
                                </>
                              )}
                              {act.elevationGainMeters > 0 && !act.indoorDetails?.treadmillIncline && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">+{act.elevationGainMeters}m</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono block">
                              {distKm} <span className="text-xs font-bold text-lime-600 dark:text-lime-400">km</span>
                            </span>
                            <span className="text-xs font-black text-coral-600 dark:text-coral-400 flex items-center justify-end gap-1 font-mono">
                              <Flame className="w-3 h-3 fill-current" /> {act.caloriesBurned} kcal
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${act.title}"?`)) {
                                onDeleteActivity(act.id);
                              }
                            }}
                            className="clay-pebble w-8 h-8 rounded-full text-slate-400 hover:text-rose-500 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                            title="Delete activity"
                            aria-label="Delete activity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
