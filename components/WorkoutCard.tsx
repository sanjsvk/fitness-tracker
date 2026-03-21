import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/constants/theme';
import { WorkoutWithExercises } from '@/types';

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function totalSets(workout: WorkoutWithExercises) {
  return workout.workout_exercises.reduce((acc, we) => acc + we.sets.length, 0);
}

interface WorkoutCardProps {
  workout: WorkoutWithExercises;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const exerciseNames = workout.workout_exercises
    .slice(0, 3)
    .map((we) => we.exercise.name)
    .join(', ');
  const overflow = workout.workout_exercises.length - 3;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/workout/${workout.id}`)}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {workout.name || 'Workout'}
        </Text>
        <Text style={styles.date}>{formatDate(workout.logged_at)}</Text>
      </View>

      <Text style={styles.exercises} numberOfLines={1}>
        {exerciseNames}
        {overflow > 0 ? ` +${overflow} more` : ''}
      </Text>

      <View style={styles.stats}>
        <Stat value={workout.workout_exercises.length} label="exercises" />
        <View style={styles.divider} />
        <Stat value={totalSets(workout)} label="sets" />
      </View>
    </TouchableOpacity>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  exercises: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: spacing.md,
  },
  stat: { flexDirection: 'row', gap: 4, alignItems: 'baseline' },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textTertiary },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
  },
});
