import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '@/hooks/useAuth';
import { useNutrition, NutritionLog } from '@/hooks/useNutrition';
import { SectionSwitcher } from '@/components/SectionSwitcher';
import { colors, radius, spacing } from '@/constants/theme';

function toLocalDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatSelectedDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function NutritionHistoryScreen() {
  const { session } = useAuth();
  const { logs, loading, refetch } = useNutrition(session?.user?.id);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const todayKey = toLocalDateKey(new Date().toISOString());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  const logsByDate = useMemo(() => {
    const map: Record<string, NutritionLog[]> = {};
    logs.forEach((l) => {
      const key = toLocalDateKey(l.logged_at);
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });
    return map;
  }, [logs]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    Object.keys(logsByDate).forEach((date) => {
      marks[date] = {
        marked: true,
        dotColor: colors.primary,
        selected: date === selectedDate,
        selectedColor: date === selectedDate ? colors.primary : undefined,
      };
    });
    if (!marks[selectedDate]) {
      marks[selectedDate] = { selected: true, selectedColor: colors.primary };
    } else {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: colors.primary };
    }
    return marks;
  }, [logsByDate, selectedDate]);

  const selectedLogs = logsByDate[selectedDate] ?? [];

  const totals = useMemo(() => {
    return selectedLogs.reduce(
      (acc, l) => ({
        calories: acc.calories + (l.calories ?? 0),
        protein: acc.protein + (l.protein ?? 0),
      }),
      { calories: 0, protein: 0 }
    );
  }, [selectedLogs]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <SectionSwitcher currentSection="nutrition" />
        <Text style={styles.title}>Nutrition</Text>
        <View style={{ width: 28 }} />
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

            {selectedLogs.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No entries on this day</Text>
              </View>
            ) : (
              <>
                {/* Day totals */}
                <View style={styles.dayTotals}>
                  <View style={styles.dayTotal}>
                    <Text style={styles.dayTotalValue}>{Math.round(totals.calories)}</Text>
                    <Text style={styles.dayTotalLabel}>kcal</Text>
                  </View>
                  <View style={styles.dayTotalDivider} />
                  <View style={styles.dayTotal}>
                    <Text style={styles.dayTotalValue}>{Math.round(totals.protein)}g</Text>
                    <Text style={styles.dayTotalLabel}>protein</Text>
                  </View>
                </View>

                {/* Entries */}
                <View style={styles.list}>
                  {selectedLogs.map((log) => (
                    <View key={log.id} style={styles.entry}>
                      <View style={styles.entryLeft}>
                        <Text style={styles.entryName}>{log.food_name}</Text>
                        {log.serving_size ? <Text style={styles.entrySub}>{log.serving_size}</Text> : null}
                      </View>
                      <View style={styles.entryRight}>
                        {log.calories != null && (
                          <Text style={styles.entryCalories}>{Math.round(log.calories)} kcal</Text>
                        )}
                        {log.protein != null && (
                          <Text style={styles.entryProtein}>{Math.round(log.protein)}g protein</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: 80 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },

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

  dayTotals: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  dayTotal: { flex: 1, alignItems: 'center', gap: 2 },
  dayTotalDivider: { width: 1, height: 32, backgroundColor: colors.border },
  dayTotalValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  dayTotalLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  list: { gap: spacing.sm },
  entry: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entryLeft: { flex: 1, gap: 2 },
  entryName: { fontSize: 15, fontWeight: '600', color: colors.text },
  entrySub: { fontSize: 12, color: colors.textTertiary },
  entryRight: { alignItems: 'flex-end', gap: 2 },
  entryCalories: { fontSize: 14, fontWeight: '700', color: colors.primary },
  entryProtein: { fontSize: 12, color: colors.textSecondary },

  empty: { paddingVertical: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.textTertiary },
});
