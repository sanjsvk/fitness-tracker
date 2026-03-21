import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkoutWithExercises, DraftExercise } from '@/types';

export function useWorkouts(userId: string | undefined) {
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkouts = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          exercise:exercises(*),
          sets(*)
        )
      `)
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });

    if (!error && data) {
      setWorkouts(data as WorkoutWithExercises[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const saveWorkout = async (
    userId: string,
    name: string,
    exercises: DraftExercise[]
  ): Promise<string | null> => {
    const { data: workout, error: wError } = await supabase
      .from('workouts')
      .insert({ user_id: userId, name: name || null })
      .select()
      .single();

    if (wError || !workout) return null;

    for (let i = 0; i < exercises.length; i++) {
      const { exercise, sets } = exercises[i];
      const { data: we, error: weError } = await supabase
        .from('workout_exercises')
        .insert({
          workout_id: workout.id,
          exercise_id: exercise.id,
          exercise_order: i,
        })
        .select()
        .single();

      if (weError || !we) continue;

      const setsData = sets
        .filter((s) => s.reps !== '')
        .map((s, idx) => ({
          workout_exercise_id: we.id,
          set_number: idx + 1,
          weight: s.weight ? parseFloat(s.weight) : null,
          reps: parseInt(s.reps),
          weight_unit: 'kg',
        }));

      if (setsData.length > 0) {
        await supabase.from('sets').insert(setsData);
      }
    }

    await fetchWorkouts();
    return workout.id;
  };

  return { workouts, loading, saveWorkout, refetch: fetchWorkouts };
}
