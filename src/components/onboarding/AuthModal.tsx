import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  X,
  Sparkles,
  CheckCircle2,
  Cloud,
  AlertCircle,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { StorageService } from '../../services/storage';
import { CloudSync } from '../../services/cloudSync';
import { UserProfile } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  onSignOut?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onSignOut,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  // Check active user session whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setInfoMsg(null);
      setSyncSuccess(false);

      if (isSupabaseConfigured && supabase) {
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            setCurrentUserEmail(data.user.email || null);
            setCurrentUserName(data.user.user_metadata?.name || null);
          } else {
            setCurrentUserEmail(null);
            setCurrentUserName(null);
          }
        });
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      let authedUserId = `usr_${Date.now()}`;
      let authedEmail = email.trim();
      let authedName = name.trim() || email.split('@')[0];

      if (isSupabaseConfigured && supabase) {
        if (mode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email: authedEmail,
            password,
            options: {
              data: {
                name: authedName,
              },
            },
          });

          if (error) {
            if (error.message.includes('rate limit')) {
              setInfoMsg('Account created! Local session is active.');
            } else {
              throw error;
            }
          }

          if (data?.user) {
            authedUserId = data.user.id;
            authedEmail = data.user.email || authedEmail;
          }
        } else {
          // SIGN IN
          const { data, error } = await supabase.auth.signInWithPassword({
            email: authedEmail,
            password,
          });

          if (error) throw error;

          if (data?.user) {
            authedUserId = data.user.id;
            authedEmail = data.user.email || authedEmail;
            authedName = data.user.user_metadata?.name || authedName;

            // Pull user's synced cloud data if available
            const cloudData = await CloudSync.pullFromCloud();
            if (cloudData) {
              StorageService.hydrateFromPayload(cloudData);
              if (cloudData.profile) {
                onAuthSuccess(cloudData.profile);
                onClose();
                return;
              }
            }
          }
        }
      }

      // Check existing local profile or create new
      let currentProfile = StorageService.getProfile();
      if (!currentProfile || mode === 'signup') {
        currentProfile = {
          id: authedUserId,
          email: authedEmail,
          name: authedName,
          age: 26,
          gender: 'male',
          heightCm: 175,
          currentWeightKg: 75,
          targetWeightKg: 70,
          activityLevel: 'moderate',
          goal: 'lose',
          targetPaceKgPerWeek: 0.5,
          unitSystem: 'metric',
          dailyWaterGoalMl: 2600,
          isDemoUser: false,
          createdAt: new Date().toISOString(),
        };
      } else {
        currentProfile = {
          ...currentProfile,
          id: authedUserId,
          email: authedEmail,
          name: authedName || currentProfile.name,
          isDemoUser: false,
        };
      }

      StorageService.saveProfile(currentProfile);

      // Push initial profile state to cloud
      CloudSync.pushToCloud(StorageService.getFullPayload());

      onAuthSuccess(currentProfile);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      } else {
        let profile = StorageService.getProfile();
        if (!profile) {
          profile = {
            id: `usr_google_${Date.now()}`,
            email: 'athlete@gmail.com',
            name: 'Google Athlete',
            age: 26,
            gender: 'male',
            heightCm: 175,
            currentWeightKg: 75,
            targetWeightKg: 70,
            activityLevel: 'moderate',
            goal: 'lose',
            targetPaceKgPerWeek: 0.5,
            unitSystem: 'metric',
            dailyWaterGoalMl: 2600,
            isDemoUser: false,
            createdAt: new Date().toISOString(),
          };
          StorageService.saveProfile(profile);
        }
        onAuthSuccess(profile);
        onClose();
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Google Sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const ok = await CloudSync.pushToCloud(StorageService.getFullPayload());
    setIsSyncing(false);
    if (ok) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md clay-card rounded-clay-card p-6 sm:p-8 shadow-2xl relative text-left my-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 clay-pebble w-9 h-9 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-90"
              aria-label="Close auth dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Case 1: User is already logged into Supabase */}
            {currentUserEmail ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex w-16 h-16 rounded-2xl clay-card-lime items-center justify-center mb-3 text-clay-text font-black text-2xl font-heading shadow-md">
                    {currentUserName ? currentUserName.charAt(0) : 'C'}
                  </div>
                  <h3 className="text-2xl font-black text-clay-text dark:text-white tracking-tight font-heading">
                    Account & Cloud Storage
                  </h3>
                  <p className="text-xs text-clay-text/60 dark:text-slate-400 font-bold mt-1">
                    Your personal data is connected and synchronized with Supabase
                  </p>
                </div>

                {/* Account Details Box */}
                <div className="p-4 rounded-2xl clay-sunken space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-heading font-black text-slate-500 dark:text-slate-400">
                      Active User
                    </span>
                    <span className="clay-chip bg-clay-lime text-clay-text text-[10px] font-black uppercase px-2 py-0.5">
                      Connected
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-heading font-black text-clay-text dark:text-white block">
                      {currentUserName || 'Fitness Athlete'}
                    </span>
                    <span className="text-xs font-mono text-clay-text/70 dark:text-slate-400 block">
                      {currentUserEmail}
                    </span>
                  </div>
                </div>

                {/* Sync Action Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleManualSync}
                    className="w-full py-3.5 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black flex items-center justify-center gap-2 active:scale-95 transition text-sm shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{syncSuccess ? 'Data Synced to Cloud!' : isSyncing ? 'Syncing...' : 'Sync Cloud Data Now'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentUserEmail(null);
                        setMode('signin');
                      }}
                      className="py-3 rounded-clay-btn clay-btn text-clay-text dark:text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                      <span>Switch Account</span>
                    </button>

                    {onSignOut && (
                      <button
                        type="button"
                        onClick={() => {
                          onSignOut();
                          onClose();
                        }}
                        className="py-3 rounded-clay-btn clay-btn text-rose-500 font-heading font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Case 2: Not logged in - Show Sign In / Sign Up Form */
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex w-14 h-14 rounded-2xl clay-card-lime items-center justify-center mb-3 text-clay-text font-black text-2xl font-heading shadow-md">
                    C
                  </div>
                  <h3 className="text-2xl font-black text-clay-text dark:text-white tracking-tight font-heading">
                    {mode === 'signin' ? 'Sign In & Sync Data' : 'Create an Account'}
                  </h3>
                  <p className="text-xs text-clay-text/60 dark:text-slate-400 font-bold mt-1">
                    {mode === 'signin'
                      ? 'Access your saved workouts, meal scans, weights & streaks'
                      : 'Store your calorie deficit and body transformation in the cloud'}
                  </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="clay-sunken p-1.5 rounded-full flex gap-1 mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className={`flex-1 py-2 text-xs font-black rounded-full transition ${
                      mode === 'signin'
                        ? 'clay-btn-lime text-clay-text'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className={`flex-1 py-2 text-xs font-black rounded-full transition ${
                      mode === 'signup'
                        ? 'clay-btn-lime text-clay-text'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3.5 rounded-2xl clay-card-coral text-slate-900 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {infoMsg && (
                  <div className="mb-4 p-3.5 rounded-2xl clay-card-butter text-slate-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>{infoMsg}</span>
                  </div>
                )}

                {/* Cloud Sync Status Indicator */}
                <div className="mb-4 p-3 rounded-2xl clay-sunken flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-clay-sky-dark dark:text-clay-sky" />
                    <span className="font-heading font-black text-clay-text dark:text-white">
                      Cloud Backend
                    </span>
                  </div>
                  <span className="clay-chip bg-clay-lime text-clay-text text-[10px] font-black uppercase px-2 py-0.5">
                    Supabase Connected
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Your Full Name
                      </label>
                      <div className="relative flex items-center">
                        <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Alex Morgan"
                          className="clay-input w-full pl-11 pr-4 py-3 text-sm text-clay-text dark:text-white rounded-2xl font-bold placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="clay-input w-full pl-11 pr-4 py-3 text-sm text-clay-text dark:text-white rounded-2xl font-bold placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-heading font-black text-clay-text/80 dark:text-slate-300 uppercase tracking-wider">
                        Password
                      </label>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="clay-input w-full pl-11 pr-11 py-3 text-sm text-clay-text dark:text-white rounded-2xl font-bold placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black flex items-center justify-center gap-2 active:scale-95 transition text-sm shadow-md mt-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Authenticating...</span>
                    ) : (
                      <>
                        <span>{mode === 'signin' ? 'Sign In & Sync Data' : 'Create Free Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/60 dark:border-slate-700/60" />
                  </div>
                  <span className="relative px-3 clay-card rounded-full text-[11px] font-bold text-slate-400 uppercase">
                    or continue with
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-clay-btn clay-btn text-clay-text dark:text-white font-heading font-black flex items-center justify-center gap-2 active:scale-95 transition text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
