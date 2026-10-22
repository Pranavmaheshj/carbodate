import React from 'react';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { MilestoneBadge } from '../../types';

interface BadgesMilestonesProps {
  badges: MilestoneBadge[];
}

export const BadgesMilestones: React.FC<BadgesMilestonesProps> = ({ badges }) => {
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="clay-card rounded-clay-card p-6 text-left relative overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-black tracking-wider text-lime-700 dark:text-lime-400 font-display">
              Achievements
            </span>
            <span className="text-[10px] clay-sunken text-slate-700 dark:text-slate-200 font-black px-2.5 py-0.5 rounded-full font-mono">
              {unlockedCount} / {badges.length} Unlocked
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-display mt-1">
            Badges & Milestones
          </h3>
        </div>

        <div className="w-11 h-11 rounded-2xl clay-pebble flex items-center justify-center text-amber-500">
          <Award className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {badges.map((badge) => {
          const progressPercent = Math.min(
            100,
            Math.round((badge.progress / badge.maxProgress) * 100)
          );

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl transition relative flex flex-col justify-between text-left ${
                badge.isUnlocked
                  ? 'clay-card-butter hover:scale-[1.02]'
                  : 'clay-card-flat opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-2xl filter drop-shadow-sm">{badge.icon}</span>
                  {badge.isUnlocked ? (
                    <div className="w-6 h-6 rounded-full clay-btn-lime text-slate-900 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full clay-pebble flex items-center justify-center text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <h5 className={`font-black text-xs font-display leading-tight mb-1 ${
                  badge.isUnlocked ? 'text-slate-900' : 'text-slate-800 dark:text-slate-100'
                }`}>
                  {badge.title}
                </h5>
                <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                  badge.isUnlocked ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'
                }`}>
                  {badge.description}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mt-3.5">
                <div className="flex justify-between text-[10px] font-black mb-1 font-display">
                  <span className={badge.isUnlocked ? 'text-slate-800' : 'text-slate-400'}>Progress</span>
                  <span className={badge.isUnlocked ? 'text-slate-900 font-mono' : 'text-slate-500 dark:text-slate-400 font-mono'}>
                    {badge.isUnlocked ? 'Unlocked' : `${progressPercent}%`}
                  </span>
                </div>
                <div className="h-2 w-full clay-sunken rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      badge.isUnlocked ? 'bg-slate-900' : 'bg-lime-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
