-- ====================================================================
-- CARBODATE DATABASE SCHEMA (PostgreSQL / Supabase)
-- Fitness & Calorie Deficit Tracker
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 12 AND age <= 120),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  height_cm NUMERIC(5, 1) NOT NULL CHECK (height_cm >= 80 AND height_cm <= 260),
  current_weight_kg NUMERIC(5, 2) NOT NULL CHECK (current_weight_kg >= 25 AND current_weight_kg <= 400),
  target_weight_kg NUMERIC(5, 2) NOT NULL CHECK (target_weight_kg >= 25 AND target_weight_kg <= 400),
  activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'extra_active')),
  goal TEXT NOT NULL CHECK (goal IN ('lose', 'maintain', 'gain')),
  target_pace_kg_per_week NUMERIC(3, 2) NOT NULL DEFAULT 0.5 CHECK (target_pace_kg_per_week >= 0.1 AND target_pace_kg_per_week <= 1.0),
  unit_system TEXT NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
  daily_water_goal_ml INTEGER NOT NULL DEFAULT 2500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ACTIVITIES TABLE (Outdoor GPS & Indoor)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('running', 'jogging', 'walking', 'cycling', 'swimming')),
  environment TEXT NOT NULL CHECK (environment IN ('outdoor', 'indoor')),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
  distance_meters NUMERIC(10, 2) NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  elevation_gain_meters NUMERIC(7, 2) NOT NULL DEFAULT 0,
  avg_speed_kmh NUMERIC(5, 2) NOT NULL DEFAULT 0,
  avg_pace_min_per_km TEXT NOT NULL DEFAULT '0:00 /km',
  splits JSONB NOT NULL DEFAULT '[]'::jsonb,
  indoor_details JSONB DEFAULT NULL,
  swimming_details JSONB DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ACTIVITY ROUTE COORDINATES (Stored as GeoJSON / JSON array)
CREATE TABLE IF NOT EXISTS public.activity_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. GYM WORKOUT SESSIONS
CREATE TABLE IF NOT EXISTS public.gym_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  split TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WORKOUT EXERCISES & SETS
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.gym_workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  sets JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 7. WORKOUT PLANS
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  days JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. MEALS TABLE
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  name TEXT NOT NULL,
  portion TEXT NOT NULL,
  calories INTEGER NOT NULL CHECK (calories >= 0),
  protein NUMERIC(6, 1) NOT NULL DEFAULT 0,
  carbs NUMERIC(6, 1) NOT NULL DEFAULT 0,
  fat NUMERIC(6, 1) NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  ai_estimated BOOLEAN NOT NULL DEFAULT FALSE,
  detected_ingredients JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. WEIGHT LOGS
CREATE TABLE IF NOT EXISTS public.weight_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg >= 25 AND weight_kg <= 400),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 10. WATER LOGS
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 0 CHECK (amount_ml >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 11. INDEXES FOR HIGH QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_activities_user_time ON public.activities(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_gym_workouts_user_time ON public.gym_workouts(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weights_user_date ON public.weight_records(user_id, date DESC);

-- 12. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- 13. POLICIES: Users can only view and modify their own records
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own activities" ON public.activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own activity routes" ON public.activity_routes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own gym workouts" ON public.gym_workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workout exercises" ON public.workout_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM public.gym_workouts WHERE gym_workouts.id = workout_exercises.workout_id AND gym_workouts.user_id = auth.uid())
);
CREATE POLICY "Users can manage own workout plans" ON public.workout_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own meals" ON public.meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own weights" ON public.weight_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own water logs" ON public.water_logs FOR ALL USING (auth.uid() = user_id);

