import React, { useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts } from '@/hooks/useWorkouts';
import { WorkoutCard } from '@/components/WorkoutCard';
import { SectionSwitcher } from '@/components/SectionSwitcher';
import { colors, spacing } from '@/constants/theme';

export default function HomeScreen() {
  const { session } = useAuth();
  const { workouts, loading, refetch } = useWorkouts(session?.user?.id);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const recentWorkouts = workouts.slice(0, 3);
  const weeklyCount = workouts.filter((w) => {
    const date = new Date(w.logged_at);
    const now = new Date();
    return now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <SectionSwitcher currentSection="workout" />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name}>
              {session?.user?.email?.split('@')[0] ?? 'Athlete'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={workouts.length} label="Total Workouts" />
          <StatCard value={weeklyCount} label="This Week" />
        </View>

        <TouchableOpacity
          style={styles.startBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/workout/new')}
        >
          <Text style={styles.startIcon}>+</Text>
          <View>
            <Text style={styles.startLabel}>Start Workout</Text>
            <Text style={styles.startSub}>Log your session</Text>
          </View>
        </TouchableOpacity>

        {recentWorkouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {recentWorkouts.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </View>
          </View>
        )}

        {!loading && workouts.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySub}>Tap "Start Workout" to log your first session.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1 },
  greeting: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  name: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  startIcon: { fontSize: 32, color: '#fff', fontWeight: '300', lineHeight: 36 },
  startLabel: { fontSize: 18, fontWeight: '700', color: '#fff' },
  startSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  list: { gap: spacing.sm },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', maxWidth: 260 },
});
