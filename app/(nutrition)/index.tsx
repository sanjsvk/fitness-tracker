import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useNutrition, NutritionLog } from '@/hooks/useNutrition';
import { SectionSwitcher } from '@/components/SectionSwitcher';
import { colors, radius, spacing } from '@/constants/theme';

function toLocalDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const todayKey = toLocalDateKey(new Date().toISOString());

interface AddFormState {
  food_name: string;
  serving_size: string;
  calories: string;
  protein: string;
}

const emptyForm: AddFormState = { food_name: '', serving_size: '', calories: '', protein: '' };

export default function NutritionTodayScreen() {
  const { session } = useAuth();
  const { logs, loading, addLog, deleteLog, refetch } = useNutrition(session?.user?.id);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const todayLogs = useMemo(
    () => logs.filter((l) => toLocalDateKey(l.logged_at) === todayKey),
    [logs]
  );

  const totals = useMemo(() => {
    return todayLogs.reduce(
      (acc, l) => ({
        calories: acc.calories + (l.calories ?? 0),
        protein: acc.protein + (l.protein ?? 0),
      }),
      { calories: 0, protein: 0 }
    );
  }, [todayLogs]);

  const handleAdd = async () => {
    if (!form.food_name.trim()) {
      Alert.alert('Missing field', 'Food name is required.');
      return;
    }
    setSaving(true);
    const ok = await addLog({
      food_name: form.food_name.trim(),
      serving_size: form.serving_size.trim() || null,
      calories: form.calories ? parseFloat(form.calories) : null,
      protein: form.protein ? parseFloat(form.protein) : null,
    });
    setSaving(false);
    if (ok) {
      setForm(emptyForm);
      setShowForm(false);
    } else {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const handleDelete = (log: NutritionLog) => {
    Alert.alert('Delete entry?', `Remove "${log.food_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteLog(log.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <SectionSwitcher currentSection="nutrition" />
          <Text style={styles.title}>Nutrition</Text>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Totals card */}
            <View style={styles.totalsCard}>
              <Text style={styles.totalsDate}>Today</Text>
              <View style={styles.totalsRow}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{Math.round(totals.calories)}</Text>
                  <Text style={styles.totalLabel}>kcal</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{Math.round(totals.protein)}g</Text>
                  <Text style={styles.totalLabel}>protein</Text>
                </View>
              </View>
            </View>

            {/* Add form */}
            {showForm && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Add Food</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Food name *"
                  placeholderTextColor={colors.textTertiary}
                  value={form.food_name}
                  onChangeText={(v) => setForm((f) => ({ ...f, food_name: v }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Quantity / serving (e.g. 200g, 1 cup)"
                  placeholderTextColor={colors.textTertiary}
                  value={form.serving_size}
                  onChangeText={(v) => setForm((f) => ({ ...f, serving_size: v }))}
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Calories"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                    value={form.calories}
                    onChangeText={(v) => setForm((f) => ({ ...f, calories: v }))}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Protein (g)"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                    value={form.protein}
                    onChangeText={(v) => setForm((f) => ({ ...f, protein: v }))}
                  />
                </View>
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelFormBtn}
                    onPress={() => { setShowForm(false); setForm(emptyForm); }}
                  >
                    <Text style={styles.cancelFormText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveFormBtn, saving && styles.saveFormBtnDisabled]}
                    onPress={handleAdd}
                    disabled={saving}
                  >
                    <Text style={styles.saveFormText}>{saving ? 'Saving…' : 'Add'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Today's log entries */}
            {todayLogs.length === 0 && !showForm ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🥗</Text>
                <Text style={styles.emptyTitle}>No entries today</Text>
                <Text style={styles.emptySub}>Tap "+ Add Food" to log a meal or snack.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {todayLogs.map((log) => (
                  <LogEntry key={log.id} log={log} onDelete={handleDelete} />
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* Add button */}
        {!showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)} activeOpacity={0.85}>
            <Text style={styles.addBtnIcon}>+</Text>
            <Text style={styles.addBtnText}>Add Food</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LogEntry({ log, onDelete }: { log: NutritionLog; onDelete: (l: NutritionLog) => void }) {
  return (
    <View style={styles.entry}>
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
      <TouchableOpacity onPress={() => onDelete(log)} hitSlop={8} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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

  scroll: { padding: spacing.md, paddingBottom: 100, gap: spacing.md },

  totalsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  totalsDate: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalsRow: { flexDirection: 'row', alignItems: 'center' },
  totalItem: { flex: 1, alignItems: 'center', gap: 2 },
  totalDivider: { width: 1, height: 36, backgroundColor: colors.border },
  totalValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  totalLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfInput: { flex: 1 },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelFormBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelFormText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  saveFormBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveFormBtnDisabled: { opacity: 0.6 },
  saveFormText: { fontSize: 14, fontWeight: '700', color: '#fff' },

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
  deleteBtn: { paddingLeft: spacing.xs },
  deleteText: { fontSize: 14, color: colors.textTertiary },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', maxWidth: 260 },

  addBtn: {
    position: 'absolute',
    bottom: 90,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addBtnIcon: { fontSize: 22, color: '#fff', fontWeight: '300', lineHeight: 24 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
