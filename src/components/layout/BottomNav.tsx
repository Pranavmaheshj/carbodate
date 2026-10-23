import React from 'react';
import { Home, Compass, Dumbbell, UtensilsCrossed, TrendingUp, Play } from 'lucide-react';

export type NavTab = 'dashboard' | 'activity' | 'gym' | 'food' | 'progress' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onQuickStart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onQuickStart,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Home', icon: Home, color: 'bg-clay-sky' },
    { id: 'activity' as NavTab, label: 'Activity', icon: Compass, color: 'bg-clay-coral' },
    { id: 'start' as const, label: 'Start', isFab: true },
    { id: 'gym' as NavTab, label: 'Workout', icon: Dumbbell, color: 'bg-clay-lilac' },
    { id: 'food' as NavTab, label: 'Food', icon: UtensilsCrossed, color: 'bg-clay-butter' },
    { id: 'progress' as NavTab, label: 'Progress', icon: TrendingUp, color: 'bg-clay-lime' },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-3 inset-x-3 z-30 pb-safe select-none pointer-events-none"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="clay-card rounded-full px-3 py-2 h-[72px] flex items-center justify-around relative max-w-md mx-auto pointer-events-auto shadow-clay-card">
        {tabs.map((tab) => {
          if (tab.isFab) {
            return (
              <div key="quick-start" className="relative -top-5 flex flex-col items-center">
                <button
                  onClick={onQuickStart}
                  className="w-16 h-16 rounded-full clay-btn-lime flex items-center justify-center text-clay-text active:scale-95 transition-transform border-4 border-white dark:border-[#252840]"
                  aria-label="Quick Start Activity"
                >
                  <Play className="w-7 h-7 fill-current translate-x-0.5" />
                </button>
                <span className="text-[10px] font-heading font-black text-clay-text dark:text-white mt-0.5">
                  Start
                </span>
              </div>
            );
          }

          const Icon = tab.icon!;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as NavTab)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? 'scale-105' : 'hover:scale-105'
              }`}
              aria-label={tab.label}
              aria-selected={isActive}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'clay-pressed bg-clay-lime/30 text-clay-text dark:text-white'
                    : 'text-clay-text-sub dark:text-slate-400 hover:text-clay-text'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span
                className={`text-[10px] font-heading font-extrabold mt-0.5 transition-colors ${
                  isActive ? 'text-clay-text dark:text-white' : 'text-clay-text-sub dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
