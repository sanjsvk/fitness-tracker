import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts } from '@/hooks/useWorkouts';
import { WorkoutCard } from '@/components/WorkoutCard';
import { SectionSwitcher } from '@/components/SectionSwitcher';
import { WorkoutWithExercises } from '@/types';
import { colors, radius, spacing } from '@/constants/theme';

function toLocalDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatSelectedDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function HistoryScreen() {
  const { session } = useAuth();
  const { workouts, loading, refetch } = useWorkouts(session?.user?.id);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const todayKey = toLocalDateKey(new Date().toISOString());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  // Group workouts by local date
  const workoutsByDate = useMemo(() => {
    const map: Record<string, WorkoutWithExercises[]> = {};
    workouts.forEach((w) => {
      const key = toLocalDateKey(w.logged_at);
      if (!map[key]) map[key] = [];
      map[key].push(w);
    });
    return map;
  }, [workouts]);

  // Build marked dates for the calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    Object.keys(workoutsByDate).forEach((date) => {
      marks[date] = {
        marked: true,
        dotColor: colors.primary,
        selected: date === selectedDate,
        selectedColor: date === selectedDate ? colors.primary : undefined,
      };
    });
    // Always mark selected date (even if no workouts)
    if (!marks[selectedDate]) {
      marks[selectedDate] = { selected: true, selectedColor: colors.primary };
    } else {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: colors.primary };
    }
    return marks;
  }, [workoutsByDate, selectedDate]);

  const selectedWorkouts = workoutsByDate[selectedDate] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <SectionSwitcher currentSection="workout" />
        <Text style={styles.title}>History</Text>
        <Text style={styles.count}>{workouts.length} workouts</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: colors.background,
              calendarBackground: colors.surface,
              dayTextColor: colors.text,
              textDisabledColor: colors.textTertiary,
              monthTextColor: colors.text,
              arrowColor: colors.primary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#fff',
              todayTextColor: colors.primary,
              dotColor: colors.primary,
              selectedDotColor: '#fff',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendar}
          />

          <View style={styles.daySection}>
            <Text style={styles.dayTitle}>
              {selectedDate === todayKey ? 'Today' : formatSelectedDate(selectedDate)}
            </Text>

            {selectedWorkouts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No workouts on this day</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {selectedWorkouts.map((w) => (
                  <WorkoutCard key={w.id} workout={w} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
  loader: { marginTop: 80 },
  scroll: { paddingBottom: 80 },

  calendar: {
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },

  daySection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dayTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  list: { gap: spacing.sm },
  empty: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: colors.textTertiary },
});
