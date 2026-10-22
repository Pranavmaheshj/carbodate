import React from 'react';
import {
  Home,
  Compass,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  User,
  Play,
  Palette,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { NavTab } from './BottomNav';
import { UserProfile } from '../../types';

interface DesktopSidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onQuickStart: () => void;
  profile: UserProfile | null;
  onOpenDisclaimer: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
  onTabChange,
  onQuickStart,
  profile,
  onOpenDisclaimer,
  isDark,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: Home, accent: 'bg-clay-sky' },
    { id: 'activity' as NavTab, label: 'Activity Tracking', icon: Compass, accent: 'bg-clay-coral' },
    { id: 'gym' as NavTab, label: 'Gym Workout', icon: Dumbbell, accent: 'bg-clay-lilac' },
    { id: 'food' as NavTab, label: 'Nutrition & Meals', icon: UtensilsCrossed, accent: 'bg-clay-butter' },
    { id: 'progress' as NavTab, label: 'Analytics & Trends', icon: TrendingUp, accent: 'bg-clay-lime' },
    { id: 'profile' as NavTab, label: 'Profile & Settings', icon: User, accent: 'bg-clay-lilac' },
    { id: 'styleguide' as NavTab, label: 'Clay Style Guide', icon: Palette, accent: 'bg-clay-butter' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 lg:w-80 p-5 min-h-screen sticky top-0 z-30 select-none">
      <div className="clay-card rounded-[40px] p-6 flex flex-col flex-1 shadow-clay-card">
        {/* Header: Brand & Greeting */}
        <div
          className="flex items-center gap-3.5 mb-7 cursor-pointer"
          onClick={() => onTabChange('dashboard')}
        >
          {/* Avatar Pebble */}
          <div className="w-12 h-12 rounded-full clay-card-lime flex items-center justify-center font-heading font-black text-xl text-clay-text shadow-sm">
            C
          </div>
          <div>
            <span className="text-2xl font-black font-heading tracking-tight text-clay-text dark:text-white flex items-center gap-1.5">
              Carbodate
            </span>
            <span className="text-xs font-heading font-bold text-clay-text-sub dark:text-slate-400 block">
              Clay Deficit Tracker
            </span>
          </div>
        </div>

        {/* Start Activity Action Button */}
        <button
          onClick={onQuickStart}
          className="w-full py-4 px-5 rounded-[24px] clay-btn-lime text-clay-text font-heading font-black flex items-center justify-center gap-3 active:scale-95 transition-all mb-7 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center">
            <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
          </div>
          <span className="text-base tracking-wide">Start Activity</span>
        </button>

        {/* Nav list */}
        <nav className="flex-1 space-y-2.5" aria-label="Desktop Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-[24px] transition-all text-sm font-heading font-extrabold ${
                  isActive
                    ? 'clay-pressed bg-clay-lime/30 text-clay-text dark:text-white'
                    : 'text-clay-text-sub dark:text-slate-400 hover:text-clay-text hover:bg-white/50 dark:hover:bg-[#202336]'
                }`}
              >
                {/* Pebble Icon */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
                    isActive ? 'clay-btn-lime scale-105' : 'clay-pebble'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile & Theme Controls */}
        <div className="pt-5 border-t border-slate-200/60 dark:border-slate-700/50 mt-4 space-y-3">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl clay-btn text-xs font-heading font-black transition active:scale-95"
              title={isDark ? 'Switch to Light Clay' : 'Switch to Dark Clay'}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full clay-pebble flex items-center justify-center">
                  {isDark ? (
                    <Sun className="w-3.5 h-3.5 text-clay-butter stroke-[2.5]" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-clay-lilac stroke-[2.5]" />
                  )}
                </div>
                <span>{isDark ? 'Dark Theme' : 'Light Theme'}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-clay-lime/20 text-clay-text dark:text-clay-lime font-bold">
                {isDark ? 'ACTIVE' : 'ACTIVE'}
              </span>
            </button>
          )}

          {profile && (
            <div
              onClick={() => onTabChange('profile')}
              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full clay-card-sky flex items-center justify-center font-heading font-black text-sm text-clay-text">
                {profile.name.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="text-sm font-heading font-extrabold text-clay-text dark:text-white truncate block">
                  {profile.name}
                </span>
                <span className="text-[11px] text-clay-text-sub dark:text-slate-400 capitalize block">
                  Goal: {profile.goal} fat
                </span>
              </div>
            </div>
          )}

          {/* Legal link */}
          <button
            onClick={onOpenDisclaimer}
            className="w-full text-center text-[11px] font-heading font-bold text-clay-text-sub dark:text-slate-400 hover:text-clay-text flex items-center justify-center gap-1.5 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Health Disclaimer</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
