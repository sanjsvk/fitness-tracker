-- =============================================================
-- FITNESS TRACKER - SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor to set up your database.
-- =============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Exercise library
CREATE TABLE IF NOT EXISTS exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT,              -- chest, legs, back, shoulders, arms, core, cardio
  equipment       TEXT,              -- barbell, dumbbell, bodyweight, machine, cable
  external_api_id TEXT,              -- Phase 2: link to wger / ExerciseDB
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Workout sessions
CREATE TABLE IF NOT EXISTS workouts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT,
  notes      TEXT,
  logged_at  TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exercises within a workout session
CREATE TABLE IF NOT EXISTS workout_exercises (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id     UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id    UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  exercise_order INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Individual sets
CREATE TABLE IF NOT EXISTS sets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number          INT NOT NULL,
  weight              DECIMAL(6,2),
  reps                INT,
  weight_unit         TEXT DEFAULT 'kg',
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Phase 2: Body metrics (table ready, UI not yet built)
CREATE TABLE IF NOT EXISTS body_metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight      DECIMAL(5,2),
  height      DECIMAL(5,2),
  weight_unit TEXT DEFAULT 'kg',
  height_unit TEXT DEFAULT 'cm',
  logged_at   TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Phase 2: Nutrition logs (table ready, UI not yet built)
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  food_name    TEXT NOT NULL,
  calories     DECIMAL(7,2),
  protein      DECIMAL(6,2),
  carbs        DECIMAL(6,2),
  fats         DECIMAL(6,2),
  serving_size TEXT,
  logged_at    TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/write their own profile
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Exercises: everyone can read, users can create custom exercises
CREATE POLICY "exercises_read" ON exercises
  FOR SELECT USING (true);
CREATE POLICY "exercises_insert" ON exercises
  FOR INSERT WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

-- Workouts: own data only
CREATE POLICY "workouts_own" ON workouts
  FOR ALL USING (auth.uid() = user_id);

-- Workout exercises: via workout ownership
CREATE POLICY "workout_exercises_own" ON workout_exercises
  FOR ALL USING (
    EXISTS (SELECT 1 FROM workouts WHERE id = workout_id AND user_id = auth.uid())
  );

-- Sets: via workout_exercise ownership
CREATE POLICY "sets_own" ON sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
    )
  );

-- Body metrics: own data only
CREATE POLICY "body_metrics_own" ON body_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Nutrition logs: own data only
CREATE POLICY "nutrition_logs_own" ON nutrition_logs
  FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (new.id) ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- =============================================================
-- SEED: Common exercises
-- =============================================================

INSERT INTO exercises (name, category, equipment) VALUES
  -- Chest
  ('Bench Press', 'chest', 'barbell'),
  ('Incline Bench Press', 'chest', 'barbell'),
  ('Dumbbell Fly', 'chest', 'dumbbell'),
  ('Push Up', 'chest', 'bodyweight'),
  ('Cable Crossover', 'chest', 'cable'),
  -- Back
  ('Deadlift', 'back', 'barbell'),
  ('Pull Up', 'back', 'bodyweight'),
  ('Barbell Row', 'back', 'barbell'),
  ('Lat Pulldown', 'back', 'cable'),
  ('Seated Cable Row', 'back', 'cable'),
  ('Dumbbell Row', 'back', 'dumbbell'),
  -- Legs
  ('Squat', 'legs', 'barbell'),
  ('Leg Press', 'legs', 'machine'),
  ('Romanian Deadlift', 'legs', 'barbell'),
  ('Leg Curl', 'legs', 'machine'),
  ('Leg Extension', 'legs', 'machine'),
  ('Lunges', 'legs', 'bodyweight'),
  ('Calf Raise', 'legs', 'machine'),
  -- Shoulders
  ('Overhead Press', 'shoulders', 'barbell'),
  ('Dumbbell Lateral Raise', 'shoulders', 'dumbbell'),
  ('Dumbbell Front Raise', 'shoulders', 'dumbbell'),
  ('Face Pull', 'shoulders', 'cable'),
  ('Arnold Press', 'shoulders', 'dumbbell'),
  -- Arms
  ('Barbell Curl', 'arms', 'barbell'),
  ('Dumbbell Curl', 'arms', 'dumbbell'),
  ('Hammer Curl', 'arms', 'dumbbell'),
  ('Tricep Pushdown', 'arms', 'cable'),
  ('Skull Crusher', 'arms', 'barbell'),
  ('Tricep Dip', 'arms', 'bodyweight'),
  -- Core
  ('Plank', 'core', 'bodyweight'),
  ('Crunch', 'core', 'bodyweight'),
  ('Russian Twist', 'core', 'bodyweight'),
  ('Hanging Leg Raise', 'core', 'bodyweight'),
  -- Cardio
  ('Running', 'cardio', null),
  ('Cycling', 'cardio', null),
  ('Jump Rope', 'cardio', null)
ON CONFLICT DO NOTHING;
