# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start            # Start Expo dev server (scan QR with Expo Go)
npm run android      # Start with Android emulator
npm run ios          # Start with iOS simulator (macOS only)
npm run web          # Start web version
```

No lint or test scripts are configured yet.

## Environment Setup

Copy `.env.example` to `.env` and fill in Supabase credentials before running:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Run `supabase/schema.sql` in the Supabase SQL Editor to create all tables, RLS policies, and seed exercises.

## Architecture

**Stack:** React Native + Expo SDK 55, Expo Router v4 (file-based navigation), Supabase (PostgreSQL + Auth), NativeWind v4 + Tailwind v4, Zustand.

**Entry point:** `expo-router/entry` → `app/_layout.tsx` (root layout with auth guard).

### Navigation flow

```
app/_layout.tsx          ← checks session, redirects to (auth) or (tabs)
app/(auth)/              ← login + signup screens
app/(tabs)/              ← bottom tab bar: Home / History / Profile
app/workout/new.tsx      ← modal: log a new workout
app/workout/[id].tsx     ← view completed workout detail
```

### Data flow

- `lib/supabase.ts` — single Supabase client, uses `expo-secure-store` for session persistence
- `hooks/useAuth.ts` — subscribes to `supabase.auth.onAuthStateChange`, exposes `session` + `signOut`
- `hooks/useWorkouts.ts` — fetches workouts with nested `workout_exercises → exercise + sets`, exposes `saveWorkout` which writes the full workout in sequence (workout → workout_exercises → sets)
- `store/workoutStore.ts` — Zustand store holding the **in-progress** workout being built before saving; reset after save

### Database schema (key relationships)

```
profiles (1) → workouts (many)
workouts (1) → workout_exercises (many) → exercises (ref table)
workout_exercises (1) → sets (many)
```

Phase 2 tables (`body_metrics`, `nutrition_logs`) are already created in the DB but have no UI yet.

### Styling

All styling uses React Native `StyleSheet` with the design token file `constants/theme.ts` (`colors`, `spacing`, `radius`, `fontSize`). NativeWind is configured (via `metro.config.js` + `babel.config.js` + `global.css`) but `StyleSheet` is the primary approach used throughout. Do not mix the two within the same component.

### Exercise data

The `exercises` table is seeded with ~36 system exercises (no `created_by`). Users can add custom exercises by inserting rows with their own `created_by` UUID. The `external_api_id` column is reserved for a future workout API integration.
