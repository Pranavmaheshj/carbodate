import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { ActivityRecord, ActivityType, UserProfile } from '../../types';
import { formatDuration } from '../../services/calculations';

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

  // Compute total cardio stats
  const totalDistanceMeters = activities.reduce((sum, a) => sum + (a.distanceMeters || 0), 0);
  const totalCalories = activities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);

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
              Live GPS route drawing, Haversine filtering, kilometer splits, and indoor MET caloric calculations.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex sm:flex-col gap-3 sm:gap-2 clay-sunken p-4 rounded-2xl text-center sm:text-right">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold font-display">
                Total Distance
              </span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                {(totalDistanceMeters / 1000).toFixed(1)}{' '}
                <span className="text-xs font-bold text-lime-600 dark:text-lime-400">km</span>
              </span>
            </div>
            <div className="sm:pt-2 sm:border-t sm:border-slate-200 dark:sm:border-slate-700/60">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold font-display">
                Burned
              </span>
              <span className="text-2xl font-black text-coral-600 dark:text-coral-400 font-mono">
                {totalCalories.toLocaleString()}{' '}
                <span className="text-xs font-bold text-slate-400">kcal</span>
              </span>
            </div>
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
          <div className="space-y-3">
            {activities.map((act) => {
              const dateStr = new Date(act.startTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
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

                      <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {dateStr}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {formatDuration(act.durationSeconds)}
                        </span>
                        {act.elevationGainMeters > 0 && (
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
        )}
      </div>
    </div>
  );
};
