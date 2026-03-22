import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkoutWithExercises, DraftExercise, CardioMetric } from '@/types';

function buildSetData(
  s: { weight: string; reps: string; duration: string; speed: string; distance: string; level: string; incline: string },
  idx: number,
  weId: string,
  cardioMetric: CardioMetric,
  weightUnit: 'kg' | 'lbs'
) {
  return {
    workout_exercise_id: weId,
    set_number: idx + 1,
    weight: cardioMetric === null && s.weight ? parseFloat(s.weight) : null,
    reps: (cardioMetric === null || cardioMetric === 'reps') && s.reps ? parseInt(s.reps) : null,
    duration: cardioMetric !== null && s.duration ? parseFloat(s.duration) : null,
    speed: (cardioMetric === 'speed_distance' || cardioMetric === 'incline_speed') && s.speed ? parseFloat(s.speed) : null,
    distance: (cardioMetric === 'speed_distance' || cardioMetric === 'level_distance') && s.distance ? parseFloat(s.distance) : null,
    level: cardioMetric === 'level_distance' && s.level ? parseFloat(s.level) : null,
    incline: cardioMetric === 'incline_speed' && s.incline ? parseFloat(s.incline) : null,
    weight_unit: weightUnit,
  };
}

export function useWorkouts(userId: string | undefined) {
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkouts = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('workouts')
      .select(`*, workout_exercises (*, exercise:exercises(*), sets(*))`)
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });

    if (!error && data) setWorkouts(data as WorkoutWithExercises[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  const saveWorkout = async (
    userId: string,
    name: string,
    exercises: DraftExercise[],
    weightUnit: 'kg' | 'lbs' = 'lbs'
  ): Promise<string | null> => {
    try {
      const { data: workout, error: wError } = await supabase
        .from('workouts')
        .insert({ user_id: userId, name: name || null })
        .select().single();

      if (wError || !workout) return null;

      for (let i = 0; i < exercises.length; i++) {
        const { exercise, sets } = exercises[i];
        const cardioMetric = exercise.cardio_metric;

        const { data: we, error: weError } = await supabase
          .from('workout_exercises')
          .insert({ workout_id: workout.id, exercise_id: exercise.id, exercise_order: i })
          .select().single();

        if (weError || !we) continue;

        const setsData = sets
          .filter((s) => s.duration !== '' || s.reps !== '' || s.weight !== '')
          .map((s, idx) => buildSetData(s, idx, we.id, cardioMetric, weightUnit));

        if (setsData.length > 0) await supabase.from('sets').insert(setsData);
      }

      await fetchWorkouts();
      return workout.id;
    } catch {
      return null;
    }
  };

  const deleteWorkout = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      if (error) return false;
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  return { workouts, loading, saveWorkout, deleteWorkout, refetch: fetchWorkouts };
}
