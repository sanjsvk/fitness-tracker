import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { WorkoutWithExercises } from '@/types';
import { colors, radius, spacing } from '@/constants/theme';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          exercise:exercises(*),
          sets(*)
        )
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setWorkout(data as WorkoutWithExercises);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.errorText}>Workout not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalSets = workout.workout_exercises.reduce((acc, we) => acc + we.sets.length, 0);
  const totalVolume = workout.workout_exercises.reduce(
    (acc, we) =>
      acc + we.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0),
    0
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.workoutName}>{workout.name || 'Workout'}</Text>
          <Text style={styles.date}>{formatDate(workout.logged_at)}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatChip value={workout.workout_exercises.length} label="Exercises" />
          <StatChip value={totalSets} label="Sets" />
          <StatChip value={`${totalVolume.toLocaleString()} kg`} label="Volume" />
        </View>

        {workout.workout_exercises.map((we) => (
          <View key={we.id} style={styles.exerciseBlock}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{we.exercise.name}</Text>
              {we.exercise.category && (
                <Text style={styles.exerciseCategory}>{we.exercise.category}</Text>
              )}
            </View>

            <View style={styles.setTableHeader}>
              <Text style={styles.th}>SET</Text>
              <Text style={[styles.th, styles.thRight]}>WEIGHT</Text>
              <Text style={[styles.th, styles.thRight]}>REPS</Text>
            </View>

            {we.sets
              .sort((a, b) => a.set_number - b.set_number)
              .map((set) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setNum}>{set.set_number}</Text>
                  <Text style={styles.setValue}>
                    {set.weight != null ? `${set.weight} kg` : '—'}
                  </Text>
                  <Text style={styles.setValue}>{set.reps ?? '—'}</Text>
                </View>
              ))}
          </View>
        ))}

        {workout.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatChip({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { fontSize: 15, color: colors.primary, fontWeight: '500' },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  header: { gap: 4 },
  workoutName: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  date: { fontSize: 13, color: colors.textSecondary },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '500', textTransform: 'uppercase' },

  exerciseBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.text },
  exerciseCategory: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  setTableHeader: { flexDirection: 'row', marginBottom: 4 },
  th: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    width: 40,
  },
  thRight: { flex: 1, textAlign: 'right' },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  setNum: { width: 40, fontSize: 13, fontWeight: '700', color: colors.primary },
  setValue: { flex: 1, textAlign: 'right', fontSize: 14, color: colors.text, fontWeight: '500' },

  notesBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  errorText: { fontSize: 15, color: colors.textSecondary },
  backLink: { fontSize: 14, color: colors.primary, marginTop: spacing.sm },
});
