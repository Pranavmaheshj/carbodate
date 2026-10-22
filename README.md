# Carbodate ⚡🥗🏃
> **Mobile-First Progressive Web App (PWA) for Fitness, Calorie-Deficit Tracking, Live Strava-Style GPS, Gym Resistance Logging, and AI Photo Meal Estimation.**

---

## 🌟 Highlights & Key Features

### 1. Onboarding & Precision Metabolic Engine
- **Bio-Demographics**: Age, biological sex, height, current weight, activity level, and target pace.
- **Mifflin-St Jeor Equation**: Accurately computes Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE).
- **Ideal Weight Range (BMI 18.5 – 24.9)**: Visual multi-zone "You Are Here" gauge with instant calculation of kilograms to lose or gain.
- **Dynamic Deficit Pacing**: Computes daily calorie targets based on 7,700 kcal per kg body fat (default 0.5 kg/week, max 1.0 kg/week).
- **Clinical Safety Floors**: Automatically enforces strict metabolic safety floors (1,200 kcal for women, 1,500 kcal for men) with warnings against aggressive deficits.
- **Date Projections**: Estimates exact date of reaching goal weight.
- **Unit System**: Seamless toggle between Metric (`kg`, `cm`) and Imperial (`lbs`, `ft/in`).

### 2. Activity Tracking (Live Strava-Style GPS & Cardio)
- **Activity Types**: Running, Jogging, Walking, Cycling, Swimming.
- **Outdoor GPS Tracker**:
  - Full-screen Leaflet & OpenStreetMap interactive route map (no paid API key required).
  - Live polyline rendering with pulsing current location pin.
  - Haversine distance tracking with GPS noise and accuracy filtering.
  - Screen Wake Lock API (`navigator.wakeLock`) keeps the screen awake during active tracking.
  - Real-time HUD: elapsed time, pace (`mm:ss /km`), speed (`km/h`), elevation gain, and live calorie burn.
  - Auto-pause when stationary.
  - Automated per-kilometer split calculations.
  - Post-activity summary map and shareable summary card with celebration confetti.
  - **Live Desktop Simulator**: Toggleable simulated runner mode for instant testing on laptop browsers without needing physical GPS.
- **Indoor Cardio Mode**: Treadmill (with incline % boost), Stationary Bike (resistance levels), Elliptical, and Stair Climber using MET equations.
- **Swimming Mode**: Pool (25m/50m laps) or Open Water with stroke classification (Freestyle, Breaststroke, Backstroke, Butterfly, Mixed).

### 3. Gym Workout Logger
- **Splits**: Push, Pull, Legs, Upper, Lower, Full Body, Chest & Triceps, Back & Biceps, or Custom.
- **Exercise Library**: 60+ compound and isolation movements with muscle filters and form cues, plus custom exercise creation.
- **Set & Rep Steppers**: Fast `+` and `-` adjustments for reps (±1) and weight (±2.5 kg).
- **Personal Record (PR) Recognition**: Automatically flags new PR weights and displays badges.
- **Automated Rest Timer**: Triggers an animated countdown timer (60s, 90s, 120s) with audio chimes and haptic vibrations when a set is completed.
- **"Copy Last Session"**: 1-tap prefill of weights and reps from previous matching workouts.
- **Volume Analytics**: Interactive Recharts bar chart tracking total sets and tonnage per muscle group.

### 4. Interactive Workout Plans
- **Day-by-Day Editor**: Plan out Monday through Sunday routines with exercise lists and rest day toggles.
- **Smart Plan Generator**: Generates customized weekly plans based on goal (fat loss vs hypertrophy), experience level, days per week (3–6), and equipment.
- **1-Tap Dashboard Launch**: Today's planned workout appears directly on the home dashboard with a 1-tap "Start Workout" button.

### 5. Calorie Intake & AI Vision Photo Estimation
- **Meal Logs**: Breakfast, Lunch, Dinner, and Snacks.
- **AI Food Photo Estimation**:
  - Upload or capture meal photos.
  - Powered by Gemini 1.5 Flash Vision or an intelligent built-in nutritional heuristic analyzer.
  - Detects food components, portion sizes, calories, and protein/carbs/fat macros.
  - Editable before saving with an explicit approximate estimation disclaimer.
- **Search & Favorites**: Search 30+ staple foods or save favorite meals for 1-click logging.
- **Live Calorie Ring**: Animated multi-track SVG ring showing: $\text{Calories Remaining} = \text{Target} - \text{Eaten} + \text{Burned}$.
- **Water & Hydration Tracker**: Liquid animation fill bar with quick `+250ml`, `+500ml`, and `+1L` steppers.

### 6. Dashboard & Analytics
- **Hero Card**: Calorie ring, deficit target badge, and net calorie balance.
- **Weight Progression Chart**: Area chart with target reference line and net change tracker.
- **Calories In vs Out Chart**: Weekly side-by-side bar chart of food consumed vs exercise burned.
- **Milestones & Badges**: 8 unlocked/progress badges (5K Finisher, Iron Discipline, Deficit Master, Hydration Hero, etc.).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling & Design System**: Tailwind CSS, Lucide React icons, Plus Jakarta Sans typography
- **Animations**: Framer Motion, Canvas Confetti
- **Charts**: Recharts
- **Maps**: Leaflet + OpenStreetMap tiles
- **Backend / Database**: Supabase (PostgreSQL schema + Row-Level Security included) with local storage persistence
- **PWA**: `vite-plugin-pwa` with offline caching service worker and web manifest

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run preview
```

---

## 📦 Database Schema Setup (Supabase)

A production-ready SQL script is provided in `supabase/schema.sql`:
1. Log into your [Supabase Dashboard](https://supabase.com).
2. Create a new project or select an existing one.
3. Open the **SQL Editor** tab.
4. Paste the contents of `supabase/schema.sql` and click **Run**.
5. Copy your project URL and anon public key into `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

*Note: The app is offline-tolerant and works seamlessly with local storage and built-in demo mode without configuring Supabase!*

---

## ⚠️ Health & Medical Disclaimer

Carbodate is created for informational, wellness, and personal fitness tracking purposes only. It does not provide medical diagnoses, treatment plans, or clinical prescriptions. Always consult a qualified physician or healthcare provider before beginning any aggressive calorie-deficit diet or high-intensity exercise program.

