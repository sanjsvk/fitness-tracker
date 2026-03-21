export interface Profile {
  id: string;
  username: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string | null;
  equipment: string | null;
  external_api_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string | null;
  notes: string | null;
  logged_at: string;
  created_at: string;
}

export interface WorkoutWithExercises extends Workout {
  workout_exercises: WorkoutExerciseWithSets[];
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_order: number;
  created_at: string;
}

export interface WorkoutExerciseWithSets extends WorkoutExercise {
  exercise: Exercise;
  sets: Set[];
}

export interface Set {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  weight_unit: 'kg' | 'lbs';
  created_at: string;
}

// In-progress workout state types
export interface DraftSet {
  weight: string;
  reps: string;
}

export interface DraftExercise {
  exercise: Exercise;
  sets: DraftSet[];
}
