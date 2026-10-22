import React from 'react';
import { ShieldAlert, Sun, Moon } from 'lucide-react';
import { UserProfile } from '../../types';
import { NavTab } from './BottomNav';

interface HeaderProps {
  currentTab: NavTab;
  profile: UserProfile | null;
  onTabChange: (tab: NavTab) => void;
  onOpenDisclaimer: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

const TAB_TITLES: Record<NavTab, string> = {
  dashboard: 'Today Overview',
  activity: 'Activity Tracker',
  gym: 'Gym & Workouts',
  food: 'Nutrition & Deficit',
  progress: 'Analytics & Trends',
  profile: 'Profile & Settings',
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  profile,
  onTabChange,
  onOpenDisclaimer,
  isDark,
  onToggleTheme,
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 py-4 flex items-center justify-between select-none">
      {/* Left: Mobile Brand & Desktop Title */}
      <div className="flex items-center gap-3.5">
        {/* Mobile brand logo */}
        <div
          onClick={() => onTabChange('dashboard')}
          className="md:hidden flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full clay-card-lime flex items-center justify-center shadow-sm">
            <span className="font-heading font-black text-clay-text text-base">C</span>
          </div>
          <div>
            <span className="font-heading font-black text-clay-text dark:text-white text-lg tracking-tight block leading-tight">
              Carbodate
            </span>
            <span className="text-[10px] text-clay-text-sub dark:text-slate-400 font-heading font-bold block -mt-0.5">
              Clay Fitness
            </span>
          </div>
        </div>

        {/* Desktop title */}
        <div className="hidden md:block">
          <h1 className="text-2xl font-black font-heading text-clay-text dark:text-white tracking-tight">
            {TAB_TITLES[currentTab]}
          </h1>
          <span className="text-xs font-bold font-heading text-clay-text-sub dark:text-slate-400">
            {todayFormatted} • Daily Calorie Pacing
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Dark Mode Toggle Pebble */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-full clay-pebble text-clay-text dark:text-white"
            title={isDark ? 'Switch to Light Clay' : 'Switch to Dark Clay'}
            aria-label="Toggle Clay Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-clay-butter stroke-[2.2]" />
            ) : (
              <Moon className="w-4 h-4 text-clay-lilac stroke-[2.2]" />
            )}
          </button>
        )}

        {/* Health Disclaimer Pebble */}
        <button
          onClick={onOpenDisclaimer}
          className="w-10 h-10 rounded-full clay-pebble text-clay-text dark:text-white"
          title="Health Disclaimer (Not medical advice)"
          aria-label="Health Disclaimer"
        >
          <ShieldAlert className="w-4 h-4 text-clay-coral-dark stroke-[2.2]" />
        </button>

        {/* Mobile Profile Avatar Pebble */}
        <button
          onClick={() => onTabChange('profile')}
          className="md:hidden w-10 h-10 rounded-full clay-card-sky flex items-center justify-center font-heading font-black text-sm text-clay-text shadow-sm"
          aria-label="User Profile"
        >
          {profile?.name ? profile.name.charAt(0) : 'U'}
        </button>
      </div>
    </header>
  );
};
