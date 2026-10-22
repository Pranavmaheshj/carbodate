import React from 'react';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { MilestoneBadge } from '../../types';

interface BadgesMilestonesProps {
  badges: MilestoneBadge[];
}

export const BadgesMilestones: React.FC<BadgesMilestonesProps> = ({ badges }) => {
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 text-left shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
              Achievements
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              {unlockedCount} / {badges.length} Unlocked
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Badges & Milestones
          </h3>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <Award className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {badges.map((badge) => {
          const progressPercent = Math.min(
            100,
            Math.round((badge.progress / badge.maxProgress) * 100)
          );

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition relative flex flex-col justify-between text-left ${
                badge.isUnlocked
                  ? 'bg-emerald-50/50 border-emerald-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{badge.icon}</span>
                  {badge.isUnlocked ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>

                <h5 className="font-bold text-slate-900 text-xs leading-tight mb-1">
                  {badge.title}
                </h5>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className={badge.isUnlocked ? 'text-emerald-700 font-bold' : ''}>
                    {badge.isUnlocked ? 'Unlocked' : `${progressPercent}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      badge.isUnlocked ? 'bg-emerald-600' : 'bg-slate-400'
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
