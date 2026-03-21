import React from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts } from '@/hooks/useWorkouts';
import { WorkoutCard } from '@/components/WorkoutCard';
import { WorkoutWithExercises } from '@/types';
import { colors, spacing } from '@/constants/theme';

function groupByDate(workouts: WorkoutWithExercises[]) {
  const groups: Record<string, WorkoutWithExercises[]> = {};
  workouts.forEach((w) => {
    const date = new Date(w.logged_at);
    const key = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year:
        date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  });
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

export default function HistoryScreen() {
  const { session } = useAuth();
  const { workouts, loading } = useWorkouts(session?.user?.id);
  const sections = groupByDate(workouts);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.count}>{workouts.length} workouts</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : workouts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No workouts logged</Text>
          <Text style={styles.emptySub}>Your completed workouts will appear here.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <WorkoutCard workout={item} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  count: { fontSize: 13, color: colors.textSecondary },
  loader: { marginTop: spacing.xxl },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: 80,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', maxWidth: 260 },
});
