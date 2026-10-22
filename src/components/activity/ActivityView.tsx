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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
                Cardio & GPS Tracking
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Record Outdoor & Indoor Workouts
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg">
              Live GPS route drawing, Haversine filtering, kilometer splits, and indoor MET caloric calculations.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex sm:flex-col gap-3 sm:gap-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center sm:text-right">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
                Total Distance
              </span>
              <span className="text-xl font-bold text-slate-900">
                {(totalDistanceMeters / 1000).toFixed(1)}{' '}
                <span className="text-xs font-semibold text-emerald-700">km</span>
              </span>
            </div>
            <div className="sm:pt-2 sm:border-t sm:border-slate-200">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
                Burned
              </span>
              <span className="text-xl font-bold text-amber-600">
                {totalCalories.toLocaleString()}{' '}
                <span className="text-xs font-semibold text-slate-500">kcal</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <button
            onClick={() => onStartLiveGps(selectedType)}
            className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-between shadow-sm active:scale-[0.99] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Play className="w-5 h-5 fill-current text-white transition-transform group-hover:scale-110" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold">Outdoor GPS</span>
                <span className="text-[11px] text-emerald-100 capitalize">
                  Start {selectedType}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onOpenIndoorModal}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Gauge className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold">Indoor Cardio</span>
                <span className="text-[11px] text-slate-500">Treadmill, Bike, Elliptical</span>
              </div>
            </div>
            <Plus className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
          </button>

          <button
            onClick={onOpenSwimModal}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Waves className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold">Swim Logger</span>
                <span className="text-[11px] text-slate-500">Pool Laps or Open Water</span>
              </div>
            </div>
            <Plus className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
          </button>
        </div>
      </div>

      {/* Activity Type Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition flex-shrink-0 ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recorded Activities</h3>
          <span className="text-xs text-slate-500 font-medium">
            {activities.length} total sessions
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500 shadow-sm">
            <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No activities recorded yet</p>
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
                  className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 transition cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                      {act.type === 'cycling' ? (
                        <Bike className="w-6 h-6" />
                      ) : act.type === 'swimming' ? (
                        <Waves className="w-6 h-6 text-sky-600" />
                      ) : (
                        <Footprints className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                          {act.title}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {act.environment}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
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
                            <span>+{act.elevationGainMeters}m</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-base font-bold text-slate-900 block">
                        {distKm} <span className="text-xs font-semibold text-emerald-700">km</span>
                      </span>
                      <span className="text-xs font-semibold text-amber-600 flex items-center justify-end gap-1">
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
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
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
