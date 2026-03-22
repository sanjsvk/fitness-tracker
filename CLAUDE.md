# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Node.js v24 must be on PATH before running npm commands:
export PATH="/c/Users/sravy/AppData/Local/nvm/v24.14.0:$PATH"

npm start -- --lan   # Start dev server in LAN mode (phone on same WiFi)
npm run android      # Start with Android emulator
npm run ios          # Start with iOS simulator (macOS only)
npm run web          # Start web version
```

No lint or test scripts are configured yet.

## Environment Setup

`.env` already exists in the project root with real Supabase credentials. Do not overwrite it.

Run `supabase/schema.sql` in the Supabase SQL Editor to create all tables, RLS policies, and seed exercises (already done).

## Current Status (March 2026)

**Phase 1 is fully built** with the following features complete:
- Auth (sign up / sign in / sign out)
- Log workouts: exercises, sets, weight/reps for strength; time + cardio-specific metrics for cardio
- Cardio metric types per exercise (`cardio_metric` column on `exercises` table):
  - `speed_distance` → time + speed (km/h) + distance (km) — Running
  - `level_distance` → time + level + distance (km) — Cycling, Stair Master, Cross Trainer
  - `incline_speed` → time + incline (%) + speed (km/h) — Incline Walk
  - `reps` → time + reps — Jump Rope
  - `null` → strength: weight + reps
- Edit workout (update set values, add new exercises)
- Delete workout
- History tab: calendar view with workout dots; tap any day to see workouts
- Home tab: recent workouts + weekly count, refreshes on focus
- lbs/kg toggle per workout (defaults to lbs)

**SDK:** Expo SDK 54 (downgraded from 55 — App Store Expo Go supports SDK 54; SDK 55 was just released and not yet in App Store).

**Dev environment known quirks:**
- Node.js PATH must be set manually each session: `export PATH="/c/Users/sravy/AppData/Local/nvm/v24.14.0:$PATH"` (also in `~/.bashrc`)
- `metro-config` has a patch applied to `node_modules/metro-config/src/loadConfig.js` to fix a Windows + Node v22+ ESM URL bug (`import(path)` → `import(pathToFileURL(path).href)`). This patch is lost on `npm install` — re-apply if Metro fails to load the config.
- Use `--legacy-peer-deps` on all `npm install` commands.
- To generate a QR code for Expo Go: `node -e "const qrcode = require('qrcode-terminal'); qrcode.generate('exp://192.168.0.27:8081', {small: true}, (q) => console.log(q));"`
- Phone IP for LAN: `192.168.0.27:8081`

## Git Workflow

**Commit and push regularly** — after every meaningful change (new feature, bug fix, config update). Keep commits small and focused.

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"

# Stage specific files (never git add -A or git add . blindly — .env must stay untracked)
git add <files>

# Commit with a clear message describing WHAT changed and WHY
git commit -m "fix: correct exercise picker modal close behavior"
git commit -m "feat: add set volume calculation to workout detail"
git commit -m "chore: upgrade to Expo SDK 54"

# Push
git push
```

**Commit message format:** `<type>: <short description>`
Types: `feat`, `fix`, `chore`, `refactor`, `style`, `docs`

**Never commit:** `.env`, `node_modules/`, any file with credentials.

## Architecture

**Stack:** React Native + Expo SDK 54, Expo Router v6 (file-based navigation), Supabase (PostgreSQL + Auth), NativeWind v4 + Tailwind v3, Zustand.

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

## Next Steps (Phase 1 completion)

- [ ] Verify app loads and auth flow works end-to-end in Expo Go
- [ ] Test: sign up → log a workout → view in history → sign out → sign back in
- [ ] Fix any runtime errors surfaced during real device testing

## Phase 2 (future)

- Body metrics UI (table already in DB: `body_metrics`)
- Nutrition tracking UI (table already in DB: `nutrition_logs`)
- Workout recommendations via public exercise API (ExerciseDB or wger) — `exercises.external_api_id` already reserved
- Progress charts
