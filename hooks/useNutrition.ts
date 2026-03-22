import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface NutritionLog {
  id: string;
  user_id: string;
  food_name: string;
  calories: number | null;
  protein: number | null;
  serving_size: string | null; // used as quantity/portion label
  logged_at: string;
  created_at: string;
}

export function useNutrition(userId: string | undefined) {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('id, user_id, food_name, calories, protein, serving_size, logged_at, created_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });
    if (!error && data) setLogs(data as NutritionLog[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const addLog = async (entry: {
    food_name: string;
    serving_size: string | null;
    calories: number | null;
    protein: number | null;
  }): Promise<boolean> => {
    if (!userId) return false;
    try {
      const { error } = await supabase.from('nutrition_logs').insert({
        user_id: userId,
        food_name: entry.food_name,
        serving_size: entry.serving_size || null,
        calories: entry.calories,
        protein: entry.protein,
        logged_at: new Date().toISOString(),
      });
      if (error) return false;
      await fetchLogs();
      return true;
    } catch {
      return false;
    }
  };

  const editLog = async (
    id: string,
    entry: { food_name: string; serving_size: string | null; calories: number | null; protein: number | null }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.from('nutrition_logs').update({
        food_name: entry.food_name,
        serving_size: entry.serving_size || null,
        calories: entry.calories,
        protein: entry.protein,
      }).eq('id', id);
      if (error) return false;
      setLogs((prev) => prev.map((l) => l.id === id ? { ...l, ...entry } : l));
      return true;
    } catch {
      return false;
    }
  };

  const deleteLog = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('nutrition_logs').delete().eq('id', id);
      if (error) return false;
      setLogs((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  return { logs, loading, addLog, editLog, deleteLog, refetch: fetchLogs };
}
