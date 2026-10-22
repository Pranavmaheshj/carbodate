-- Carbodate Database Schema for Supabase
-- Paste and run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  age INTEGER,
  gender TEXT,
  height_cm NUMERIC,
  current_weight_kg NUMERIC,
  target_weight_kg NUMERIC,
  activity_level TEXT,
  goal TEXT,
  target_pace_kg_per_week NUMERIC,
  unit_system TEXT DEFAULT 'metric',
  daily_water_goal_ml INTEGER DEFAULT 2500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Meals Table
CREATE TABLE IF NOT EXISTS public.meals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  name TEXT NOT NULL,
  portion TEXT,
  calories NUMERIC NOT NULL,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  ai_estimated BOOLEAN DEFAULT FALSE,
  detected_ingredients JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Activities Table
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  environment TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL,
  distance_meters NUMERIC DEFAULT 0,
  calories_burned NUMERIC NOT NULL,
  elevation_gain_meters NUMERIC DEFAULT 0,
  avg_speed_kmh NUMERIC DEFAULT 0,
  avg_pace_min_per_km TEXT,
  splits JSONB,
  route_points JSONB,
  indoor_details JSONB,
  swimming_details JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Gym Sessions Table
CREATE TABLE IF NOT EXISTS public.gym_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  split TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  calories_burned NUMERIC NOT NULL,
  exercises JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Weight Records Table
CREATE TABLE IF NOT EXISTS public.weight_records (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only view and modify their own records
CREATE POLICY "Users can access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can access own meals" ON public.meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own activities" ON public.activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own gym sessions" ON public.gym_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own weight records" ON public.weight_records FOR ALL USING (auth.uid() = user_id);
