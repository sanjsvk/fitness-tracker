import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface SavedMeal {
  id: string;
  user_id: string;
  name: string;
  serving_size: string | null;
  calories: number | null;
  protein: number | null;
  created_at: string;
}

// Jaccard similarity on word tokens — handles "shake" vs "protein shake" etc.
function tokenize(name: string): Set<string> {
  return new Set(
    name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  );
}

function jaccard(a: string, b: string): number {
  const wa = tokenize(a);
  const wb = tokenize(b);
  const intersection = [...wa].filter((x) => wb.has(x)).length;
  const union = new Set([...wa, ...wb]).size;
  return union === 0 ? 0 : intersection / union;
}

export function isDuplicateMeal(
  name: string,
  calories: number | null,
  protein: number | null,
  existing: SavedMeal
): boolean {
  const nameSim = jaccard(name, existing.name);
  const calClose = Math.abs((calories ?? 0) - (existing.calories ?? 0)) <= 10;
  const protClose = Math.abs((protein ?? 0) - (existing.protein ?? 0)) <= 2;
  // Need both reasonable name similarity AND matching macros
  return nameSim >= 0.5 && calClose && protClose;
}

export function useSavedMeals(userId: string | undefined) {
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_meals')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (!error && data) setMeals(data as SavedMeal[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  /** Returns { ok, duplicate } — duplicate=true means not saved because it already exists */
  const addMeal = async (entry: {
    name: string;
    serving_size: string | null;
    calories: number | null;
    protein: number | null;
  }): Promise<{ ok: boolean; duplicate: boolean }> => {
    if (!userId) return { ok: false, duplicate: false };
    const dup = meals.find((m) => isDuplicateMeal(entry.name, entry.calories, entry.protein, m));
    if (dup) return { ok: false, duplicate: true };
    try {
      const { error } = await supabase.from('saved_meals').insert({
        user_id: userId,
        name: entry.name,
        serving_size: entry.serving_size || null,
        calories: entry.calories,
        protein: entry.protein,
      });
      if (error) return { ok: false, duplicate: false };
      await fetchMeals();
      return { ok: true, duplicate: false };
    } catch {
      return { ok: false, duplicate: false };
    }
  };

  const editMeal = async (
    id: string,
    entry: { name: string; serving_size: string | null; calories: number | null; protein: number | null }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.from('saved_meals').update({
        name: entry.name,
        serving_size: entry.serving_size || null,
        calories: entry.calories,
        protein: entry.protein,
      }).eq('id', id);
      if (error) return false;
      setMeals((prev) => prev.map((m) => m.id === id ? { ...m, ...entry } : m));
      return true;
    } catch {
      return false;
    }
  };

  const deleteMeal = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('saved_meals').delete().eq('id', id);
      if (error) return false;
      setMeals((prev) => prev.filter((m) => m.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  return { meals, loading, addMeal, editMeal, deleteMeal, refetch: fetchMeals };
}
