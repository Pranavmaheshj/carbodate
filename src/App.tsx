import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from './services/storage';
import {
  UserProfile,
  BodyCalculations,
  MealItem,
  ActivityRecord,
  GymWorkoutSession,
  WorkoutPlan,
  WorkoutPlanDay,
  WeightRecord,
  MilestoneBadge,
  ActivityType
} from './types';
import { computeProfileCalculations } from './services/calculations';

// Layout & Navigation
import { Header } from './components/layout/Header';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { HealthDisclaimerModal } from './components/common/HealthDisclaimerModal';
import { QuickStartModal } from './components/common/QuickStartModal';

// Features Views & Modals
import { DashboardView } from './components/dashboard/DashboardView';
import { ActivityView } from './components/activity/ActivityView';
import { LiveGpsTracker } from './components/activity/LiveGpsTracker';
import { IndoorActivityModal } from './components/activity/IndoorActivityModal';
import { SwimmingModal } from './components/activity/SwimmingModal';
import { ActivitySummaryModal } from './components/activity/ActivitySummaryModal';

import { GymWorkoutLogger } from './components/gym/GymWorkoutLogger';
import { WorkoutPlansView } from './components/gym/WorkoutPlansView';

import { FoodTracker } from './components/food/FoodTracker';
import { PhotoCalorieEstimator } from './components/food/PhotoCalorieEstimator';

import { ProgressCharts } from './components/dashboard/ProgressCharts';
import { BadgesMilestones } from './components/dashboard/BadgesMilestones';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { AuthModal } from './components/onboarding/AuthModal';
import { ClayStyleGuide } from './components/styleguide/ClayStyleGuide';

export function App() {
  // Ensure storage is initialized cleanly without mock injection
  useEffect(() => {
    StorageService.ensureInitialized();
  }, []);

  const [profile, setProfile] = useState<UserProfile | null>(() => StorageService.getProfile());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [gymSubTab, setGymSubTab] = useState<'logger' | 'plan' | 'volume'>('plan');
  const [progressSubTab, setProgressSubTab] = useState<'charts' | 'badges'>('charts');

  // Theme state - persisted in localStorage with system preference fallback
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('carbodate_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Modals & Active overlays
  const [isLiveGpsOpen, setIsLiveGpsOpen] = useState<boolean>(false);
  const [gpsActivityType, setGpsActivityType] = useState<ActivityType>('running');

  const [isIndoorModalOpen, setIsIndoorModalOpen] = useState<boolean>(false);
  const [isSwimModalOpen, setIsSwimModalOpen] = useState<boolean>(false);
  const [isGymLoggerOpen, setIsGymLoggerOpen] = useState<boolean>(false);
  const [activeGymSplit, setActiveGymSplit] = useState<string>('Push (Chest/Shoulder/Triceps)');

  const [summaryActivity, setSummaryActivity] = useState<ActivityRecord | null>(null);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);
  const [isQuickStartOpen, setIsQuickStartOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isPhotoScanOpen, setIsPhotoScanOpen] = useState<boolean>(false);

  // App Data Collections
  const todayStr = new Date().toISOString().split('T')[0];
  const [activities, setActivities] = useState<ActivityRecord[]>(() => StorageService.getActivities());
  const [gymSessions, setGymSessions] = useState<GymWorkoutSession[]>(() => StorageService.getGymSessions());
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(() => StorageService.getWorkoutPlan());
  const [meals, setMeals] = useState<MealItem[]>(() => StorageService.getMeals(todayStr));
  const [weights, setWeights] = useState<WeightRecord[]>(() => StorageService.getWeightRecords());
  const [waterMl, setWaterMl] = useState<number>(() => StorageService.getWaterLog(todayStr));
  const [badges, setBadges] = useState<MilestoneBadge[]>(() => StorageService.getBadges());

  // Compute live calculations
  const calculations: BodyCalculations = computeProfileCalculations(profile || {});

  // Compute today's active burned calories
  const burnedToday =
    activities
      .filter((a) => a.startTime.startsWith(todayStr))
      .reduce((s, a) => s + (a.caloriesBurned || 0), 0) +
    gymSessions
      .filter((g) => g.startTime.startsWith(todayStr))
      .reduce((s, g) => s + (g.caloriesBurned || 0), 0);

  // Theme effect: applies dark class to html and body, sets color-scheme, and persists
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#1B1D2B';
      document.body.style.color = '#E2E4F0';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#EEF0FB';
      document.body.style.color = '#2B2D42';
    }
    try {
      localStorage.setItem('carbodate_theme', isDark ? 'dark' : 'light');
    } catch {
      // storage unavailable
    }
  }, [isDark]);

  // Handlers
  const handleSaveActivity = (activity: ActivityRecord) => {
    StorageService.saveActivity(activity);
    setActivities(StorageService.getActivities());
    setBadges(StorageService.getBadges());
    setIsLiveGpsOpen(false);
    setSummaryActivity(activity);
  };

  const handleDeleteActivity = (id: string) => {
    StorageService.deleteActivity(id);
    setActivities(StorageService.getActivities());
  };

  const handleFinishGymWorkout = (session: GymWorkoutSession) => {
    StorageService.saveGymSession(session);
    setGymSessions(StorageService.getGymSessions());
    setIsGymLoggerOpen(false);
    alert(`Crushed it! "${session.title}" saved. Burned ~${session.caloriesBurned} kcal.`);
  };

  const handleSaveMeal = (meal: MealItem) => {
    StorageService.saveMeal(meal);
    setMeals(StorageService.getMeals(todayStr));
    setBadges(StorageService.getBadges());
  };

  const handleDeleteMeal = (id: string) => {
    StorageService.deleteMeal(id);
    setMeals(StorageService.getMeals(todayStr));
  };

  const handleToggleMealFavorite = (id: string) => {
    StorageService.toggleMealFavorite(id);
    setMeals(StorageService.getMeals(todayStr));
  };

  const handleAddWater = (amount: number) => {
    const updated = StorageService.addWater(amount, todayStr);
    setWaterMl(updated);
    setBadges(StorageService.getBadges());
  };

  const handleResetWater = () => {
    StorageService.addWater(-waterMl, todayStr);
    setWaterMl(0);
  };

  const handleSaveWeight = (record: WeightRecord) => {
    StorageService.saveWeightRecord(record);
    setWeights(StorageService.getWeightRecords());
    if (profile) {
      setProfile({ ...profile, currentWeightKg: record.weightKg });
    }
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    StorageService.saveProfile(updated);
    setProfile(updated);
  };

  const handleUpdateWorkoutPlan = (plan: WorkoutPlan) => {
    StorageService.saveWorkoutPlan(plan);
    setWorkoutPlan(plan);
  };

  const handleResetAllData = () => {
    StorageService.clearAllData();
    setProfile(null);
    setActivities([]);
    setGymSessions([]);
    setWorkoutPlan(null);
    setMeals([]);
    setWeights([]);
    setWaterMl(0);
    setBadges(StorageService.getBadges());
  };

  // If user opened onboarding wizard or has no profile
  if (isOnboardingOpen || !profile) {
    return (
      <OnboardingWizard
        initialProfile={profile}
        onComplete={(newProfile) => {
          handleUpdateProfile(newProfile);
          setIsOnboardingOpen(false);
        }}
        onCancel={profile ? () => setIsOnboardingOpen(false) : undefined}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#EEF0FB] dark:bg-clay-dark-bg text-clay-text dark:text-slate-100 flex relative overflow-x-hidden ${isDark ? 'dark' : ''}`}>
      {/* Ambient Blurred Pastel Background Blobs */}
      <div className="clay-blob-1 pointer-events-none" />
      <div className="clay-blob-2 pointer-events-none" />
      <div className="clay-blob-3 pointer-events-none" />

      {/* Desktop Navigation Sidebar */}
      <DesktopSidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setIsGymLoggerOpen(false);
          setCurrentTab(tab);
        }}
        onQuickStart={() => setIsQuickStartOpen(true)}
        profile={profile}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          profile={profile}
          onTabChange={setCurrentTab}
          onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
        />

        {/* Content Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 pb-28 md:pb-12">
          {/* TAB 1: DASHBOARD HOME */}
          {currentTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              calculations={calculations}
              meals={meals}
              activities={activities}
              gymSessions={gymSessions}
              workoutPlan={workoutPlan}
              weights={weights}
              waterCurrentMl={waterMl}
              onNavigateTab={setCurrentTab}
              onStartScheduledWorkout={(day) => {
                setActiveGymSplit(day.split);
                setIsGymLoggerOpen(true);
                setCurrentTab('gym');
              }}
              onStartOutdoorRun={() => {
                setGpsActivityType('running');
                setIsLiveGpsOpen(true);
              }}
              onOpenPhotoScan={() => setIsPhotoScanOpen(true)}
              onSaveWeight={handleSaveWeight}
              onAddWater={handleAddWater}
            />
          )}

          {/* TAB 2: ACTIVITY TRACKING (GPS & Cardio) */}
          {currentTab === 'activity' && (
            <ActivityView
              activities={activities}
              profile={profile}
              onStartLiveGps={(type) => {
                setGpsActivityType(type);
                setIsLiveGpsOpen(true);
              }}
              onOpenIndoorModal={() => setIsIndoorModalOpen(true)}
              onOpenSwimModal={() => setIsSwimModalOpen(true)}
              onSelectActivity={(act) => setSummaryActivity(act)}
              onDeleteActivity={handleDeleteActivity}
            />
          )}

          {/* TAB 3: GYM WORKOUT & PLANS */}
          {currentTab === 'gym' && (
            <div className="space-y-6">
              {/* Gym Subtabs Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsGymLoggerOpen(false);
                      setGymSubTab('plan');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      gymSubTab === 'plan' && !isGymLoggerOpen
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Workout Routine & Planner
                  </button>

                  <button
                    onClick={() => {
                      setIsGymLoggerOpen(true);
                      setGymSubTab('logger');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      isGymLoggerOpen
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Active Gym Logger
                  </button>

                  <button
                    onClick={() => {
                      setIsGymLoggerOpen(false);
                      setGymSubTab('volume');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition hidden sm:inline-block ${
                      gymSubTab === 'volume' && !isGymLoggerOpen
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Volume Analytics
                  </button>
                </div>
              </div>

              {/* Views */}
              {isGymLoggerOpen ? (
                <GymWorkoutLogger
                  profile={profile}
                  initialSplit={activeGymSplit}
                  onFinishWorkout={handleFinishGymWorkout}
                  onCancel={() => setIsGymLoggerOpen(false)}
                />
              ) : gymSubTab === 'plan' ? (
                <WorkoutPlansView
                  currentPlan={workoutPlan}
                  profile={profile}
                  onUpdatePlan={handleUpdateWorkoutPlan}
                  onStartScheduledWorkout={(day) => {
                    setActiveGymSplit(day.split);
                    setIsGymLoggerOpen(true);
                  }}
                />
              ) : (
                <div className="space-y-6">
                  <ProgressCharts
                    weights={weights}
                    meals={meals}
                    activities={activities}
                    gymSessions={gymSessions}
                    profile={profile}
                    calculations={calculations}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FOOD & NUTRITION TRACKING */}
          {currentTab === 'food' && (
            <FoodTracker
              meals={meals}
              profile={profile}
              calculations={calculations}
              burnedCaloriesToday={burnedToday}
              waterCurrentMl={waterMl}
              onSaveMeal={handleSaveMeal}
              onDeleteMeal={handleDeleteMeal}
              onToggleFavorite={handleToggleMealFavorite}
              onAddWater={handleAddWater}
              onResetWater={handleResetWater}
            />
          )}

          {/* TAB 5: PROGRESS & ANALYTICS */}
          {currentTab === 'progress' && (
            <div className="space-y-6">
              {/* Progress Subtabs */}
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <button
                  onClick={() => setProgressSubTab('charts')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    progressSubTab === 'charts'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200'
                  }`}
                >
                  Trends & Deficit Charts
                </button>
                <button
                  onClick={() => setProgressSubTab('badges')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    progressSubTab === 'badges'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200'
                  }`}
                >
                  Badges & Milestones ({badges.filter((b) => b.isUnlocked).length})
                </button>
              </div>

              {progressSubTab === 'charts' ? (
                <ProgressCharts
                  weights={weights}
                  meals={meals}
                  activities={activities}
                  gymSessions={gymSessions}
                  profile={profile}
                  calculations={calculations}
                />
              ) : (
                <BadgesMilestones badges={badges} />
              )}
            </div>
          )}

          {/* TAB 6: PROFILE & SETTINGS */}
          {currentTab === 'profile' && (
            <ProfileSettings
              profile={profile}
              calculations={calculations}
              onUpdateProfile={handleUpdateProfile}
              onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
              onResetAllData={handleResetAllData}
              isDark={isDark}
              onToggleTheme={() => setIsDark(!isDark)}
            />
          )}

          {/* TAB 7: CLAYMORPHISM STYLE GUIDE */}
          {currentTab === 'styleguide' && (
            <ClayStyleGuide
              onBackToDashboard={() => setCurrentTab('dashboard')}
              isDark={isDark}
              onToggleTheme={() => setIsDark(!isDark)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setIsGymLoggerOpen(false);
          setCurrentTab(tab);
        }}
        onQuickStart={() => setIsQuickStartOpen(true)}
      />

      {/* OVERLAYS & MODALS */}

      {/* 1. Live Strava-Style GPS Route Tracker */}
      {isLiveGpsOpen && (
        <LiveGpsTracker
          activityType={gpsActivityType}
          profile={profile}
          onFinish={handleSaveActivity}
          onCancel={() => setIsLiveGpsOpen(false)}
        />
      )}

      {/* 2. Indoor Cardio Modal */}
      <IndoorActivityModal
        isOpen={isIndoorModalOpen}
        onClose={() => setIsIndoorModalOpen(false)}
        onSave={handleSaveActivity}
        profile={profile}
      />

      {/* 3. Swimming Modal */}
      <SwimmingModal
        isOpen={isSwimModalOpen}
        onClose={() => setIsSwimModalOpen(false)}
        onSave={handleSaveActivity}
        profile={profile}
      />

      {/* 4. Activity Summary Shareable Card */}
      <ActivitySummaryModal
        activity={summaryActivity}
        onClose={() => setSummaryActivity(null)}
      />

      {/* 5. Health & Clinical Disclaimer Modal */}
      <HealthDisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />

      {/* 6. Quick Start Floating Action Launcher */}
      <QuickStartModal
        isOpen={isQuickStartOpen}
        onClose={() => setIsQuickStartOpen(false)}
        onStartOutdoor={(type) => {
          setGpsActivityType(type);
          setIsLiveGpsOpen(true);
        }}
        onStartGym={() => {
          setIsGymLoggerOpen(true);
          setCurrentTab('gym');
        }}
        onStartIndoor={() => setIsIndoorModalOpen(true)}
        onStartSwim={() => setIsSwimModalOpen(true)}
      />

      {/* 7. Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(newProf) => {
          handleUpdateProfile(newProf);
          setIsAuthModalOpen(false);
        }}
      />

      {/* 8. AI Photo Scan Direct Modal */}
      <PhotoCalorieEstimator
        isOpen={isPhotoScanOpen}
        onClose={() => setIsPhotoScanOpen(false)}
        onSaveMeal={handleSaveMeal}
        userId={profile.id}
      />
    </div>
  );
}

export default App;
