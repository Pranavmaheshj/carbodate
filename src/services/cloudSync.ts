import { supabase, isSupabaseConfigured } from './supabase';
import { StorageService } from './storage';
import {
  UserProfile,
  ActivityRecord,
  GymWorkoutSession,
  WorkoutPlan,
  MealItem,
  WeightRecord,
  MilestoneBadge,
} from '../types';

export interface FullUserDataPayload {
  profile: UserProfile | null;
  activities: ActivityRecord[];
  gymSessions: GymWorkoutSession[];
  workoutPlan: WorkoutPlan | null;
  meals: MealItem[];
  weights: WeightRecord[];
  waterMl: number;
  badges: MilestoneBadge[];
  lastSyncedAt?: string;
}

export interface AuthUserState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
}

class CloudSyncService {
  private syncTimeout: any = null;

  /**
   * Get current authenticated user from Supabase session.
   */
  async getCurrentUser(): Promise<AuthUserState> {
    if (!isSupabaseConfigured || !supabase) {
      const profile = StorageService.getProfile();
      return {
        isAuthenticated: Boolean(profile && !profile.isDemoUser),
        user: profile
          ? { id: profile.id, email: profile.email, name: profile.name }
          : null,
      };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.user_metadata?.profile?.name || '',
          },
        };
      }
    } catch (err) {
      console.warn('Failed to fetch Supabase session:', err);
    }

    const localProfile = StorageService.getProfile();
    return {
      isAuthenticated: Boolean(localProfile && !localProfile.isDemoUser),
      user: localProfile
        ? { id: localProfile.id, email: localProfile.email, name: localProfile.name }
        : null,
    };
  }

  /**
   * Pulls user data from Supabase cloud metadata (or Postgres table if available).
   */
  async pullFromCloud(): Promise<FullUserDataPayload | null> {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const metadata = user.user_metadata;
      if (metadata && metadata.carbodate_data) {
        return metadata.carbodate_data as FullUserDataPayload;
      }

      // Check if user has single profile metadata saved
      if (metadata && metadata.profile) {
        return {
          profile: {
            ...metadata.profile,
            id: user.id,
            email: user.email || metadata.profile.email,
          },
          activities: metadata.activities || [],
          gymSessions: metadata.gymSessions || [],
          workoutPlan: metadata.workoutPlan || null,
          meals: metadata.meals || [],
          weights: metadata.weights || [],
          waterMl: metadata.waterMl || 0,
          badges: metadata.badges || [],
          lastSyncedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Error pulling data from cloud:', err);
    }

    return null;
  }

  /**
   * Push full local dataset to Supabase Cloud storage with debouncing.
   */
  async pushToCloud(payload: FullUserDataPayload): Promise<boolean> {
    // 1. Immediately persist to localStorage for zero-latency offline tolerance
    if (payload.profile) StorageService.saveProfile(payload.profile);

    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      return true;
    }

    return new Promise((resolve) => {
      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
      }

      this.syncTimeout = setTimeout(async () => {
        try {
          const { data: { user } } = await client.auth.getUser();
          if (!user) {
            resolve(false);
            return;
          }

          const syncData: FullUserDataPayload = {
            ...payload,
            lastSyncedAt: new Date().toISOString(),
          };

          // 1. Persist directly to Supabase User Metadata (always works without custom schema)
          await client.auth.updateUser({
            data: {
              carbodate_data: syncData,
              last_synced: syncData.lastSyncedAt,
            },
          });

          // 2. Also attempt saving to Postgres tables if created
          if (payload.profile) {
            try {
              await client.from('profiles').upsert({
                id: user.id,
                email: user.email || payload.profile.email,
                name: payload.profile.name,
                age: payload.profile.age,
                gender: payload.profile.gender,
                height_cm: payload.profile.heightCm,
                current_weight_kg: payload.profile.currentWeightKg,
                target_weight_kg: payload.profile.targetWeightKg,
                activity_level: payload.profile.activityLevel,
                goal: payload.profile.goal,
                target_pace_kg_per_week: payload.profile.targetPaceKgPerWeek,
                unit_system: payload.profile.unitSystem || 'metric',
                daily_water_goal_ml: payload.profile.dailyWaterGoalMl || 2500,
                updated_at: new Date().toISOString(),
              });
            } catch {
              // Ignore if table not yet migrated
            }
          }

          resolve(true);
        } catch (e) {
          console.warn('Cloud sync background error:', e);
          resolve(false);
        }
      }, 500);
    });
  }

  /**
   * Listen to Supabase auth changes.
   */
  onAuthStateChange(callback: (user: AuthUserState) => void) {
    if (!isSupabaseConfigured || !supabase) {
      return { unsubscribe: () => {} };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        callback({
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
          },
        });
      } else {
        callback({
          isAuthenticated: false,
          user: null,
        });
      }
    });

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  }

  /**
   * Sign out current user.
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error signing out from Supabase:', err);
      }
    }
  }
}

export const CloudSync = new CloudSyncService();
