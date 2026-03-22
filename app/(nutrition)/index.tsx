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
import { useSavedMeals } from '@/hooks/useSavedMeals';
import { SectionSwitcher } from '@/components/SectionSwitcher';
import { SavedMealPicker } from '@/components/SavedMealPicker';
import { colors, radius, spacing } from '@/constants/theme';

function toLocalDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const todayKey = toLocalDateKey(new Date().toISOString());

interface FormState {
  food_name: string;
  serving_size: string;
  calories: string;
  protein: string;
}

const emptyForm: FormState = { food_name: '', serving_size: '1', calories: '', protein: '' };

export default function NutritionTodayScreen() {
  const { session } = useAuth();
  const { logs, loading, addLog, editLog, deleteLog, refetch } = useNutrition(session?.user?.id);
  const { meals: savedMeals, addMeal: addSavedMeal, refetch: refetchSaved } = useSavedMeals(session?.user?.id);

  useFocusEffect(useCallback(() => { refetch(); refetchSaved(); }, [refetch, refetchSaved]));

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Edit mode — stores the id being edited + its current field values
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editSaving, setEditSaving] = useState(false);

  // Saved meal picker
  const [pickerVisible, setPickerVisible] = useState(false);

  const todayLogs = useMemo(
    () => logs.filter((l) => toLocalDateKey(l.logged_at) === todayKey),
    [logs]
  );

  const totals = useMemo(() => todayLogs.reduce(
    (acc, l) => ({ calories: acc.calories + (l.calories ?? 0), protein: acc.protein + (l.protein ?? 0) }),
    { calories: 0, protein: 0 }
  ), [todayLogs]);

  // ── Add new entry ──────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!form.food_name.trim()) { Alert.alert('Missing field', 'Food name is required.'); return; }
    setSaving(true);
    const ok = await addLog({
      food_name: form.food_name.trim(),
      serving_size: form.serving_size.trim() || null,
      calories: form.calories ? parseFloat(form.calories) : null,
      protein: form.protein ? parseFloat(form.protein) : null,
    });
    setSaving(false);
    if (ok) { setForm(emptyForm); setShowForm(false); }
    else Alert.alert('Error', 'Failed to save entry. Please try again.');
  };

  const openAddForm = () => { setForm(emptyForm); setShowForm(true); };

  const cancelAdd = () => { setShowForm(false); setForm(emptyForm); };

  // ── Edit existing entry ────────────────────────────────────────────────────

  const startEdit = (log: NutritionLog) => {
    setEditingId(log.id);
    setEditForm({
      food_name: log.food_name,
      serving_size: log.serving_size ?? '',
      calories: log.calories != null ? String(log.calories) : '',
      protein: log.protein != null ? String(log.protein) : '',
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(emptyForm); };

  const handleSaveEdit = async () => {
    if (!editForm.food_name.trim()) { Alert.alert('Missing field', 'Food name is required.'); return; }
    if (!editingId) return;
    setEditSaving(true);
    const ok = await editLog(editingId, {
      food_name: editForm.food_name.trim(),
      serving_size: editForm.serving_size.trim() || null,
      calories: editForm.calories ? parseFloat(editForm.calories) : null,
      protein: editForm.protein ? parseFloat(editForm.protein) : null,
    });
    setEditSaving(false);
    if (ok) cancelEdit();
    else Alert.alert('Error', 'Failed to update entry. Please try again.');
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = (log: NutritionLog) => {
    Alert.alert('Delete entry?', `Remove "${log.food_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteLog(log.id) },
    ]);
  };

  // ── Save to saved meals ────────────────────────────────────────────────────

  const handleSaveToSaved = async (log: NutritionLog) => {
    const result = await addSavedMeal({
      name: log.food_name,
      serving_size: log.serving_size,
      calories: log.calories,
      protein: log.protein,
    });
    if (result.duplicate) {
      Alert.alert('Already saved', `"${log.food_name}" already exists in your saved meals.`);
    } else if (result.ok) {
      Alert.alert('Saved!', `"${log.food_name}" added to saved meals.`);
    } else {
      Alert.alert('Error', 'Could not save meal. Please try again.');
    }
  };

  // ── Choose from saved meals ────────────────────────────────────────────────

  const handlePickSaved = (meal: { name: string; serving_size: string | null; calories: number | null; protein: number | null }) => {
    setForm({
      food_name: meal.name,
      serving_size: meal.serving_size ?? '1',
      calories: meal.calories != null ? String(meal.calories) : '',
      protein: meal.protein != null ? String(meal.protein) : '',
    });
    setPickerVisible(false);
    setShowForm(true);
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
            {/* Daily totals */}
            <View style={styles.totalsCard}>
              <Text style={styles.totalsLabel}>Today</Text>
              <View style={styles.totalsRow}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{Math.round(totals.calories)}</Text>
                  <Text style={styles.totalUnit}>kcal</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{Math.round(totals.protein)}g</Text>
                  <Text style={styles.totalUnit}>protein</Text>
                </View>
              </View>
            </View>

            {/* Add form */}
            {showForm && (
              <View style={styles.form}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Add Food</Text>
                  {savedMeals.length > 0 && (
                    <TouchableOpacity
                      style={styles.fromSavedBtn}
                      onPress={() => { setShowForm(false); setPickerVisible(true); }}
                    >
                      <Text style={styles.fromSavedText}>Saved meals</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Food name *"
                  placeholderTextColor={colors.textTertiary}
                  value={form.food_name}
                  onChangeText={(v) => setForm((f) => ({ ...f, food_name: v }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Quantity / serving (e.g. 1, 200g, 1 cup)"
                  placeholderTextColor={colors.textTertiary}
                  value={form.serving_size}
                  onChangeText={(v) => setForm((f) => ({ ...f, serving_size: v }))}
                />
                <View style={styles.inputRow}>
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
                  <TouchableOpacity style={styles.cancelBtn} onPress={cancelAdd}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, saving && styles.btnDisabled]}
                    onPress={handleAdd}
                    disabled={saving}
                  >
                    <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Add'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Log entries */}
            {todayLogs.length === 0 && !showForm ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🥗</Text>
                <Text style={styles.emptyTitle}>No entries today</Text>
                <Text style={styles.emptySub}>Tap "+ Add Food" to log a meal or snack.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {todayLogs.map((log) =>
                  editingId === log.id ? (
                    /* ── Inline edit form ── */
                    <View key={log.id} style={styles.editForm}>
                      <TextInput
                        style={styles.input}
                        placeholder="Food name *"
                        placeholderTextColor={colors.textTertiary}
                        value={editForm.food_name}
                        onChangeText={(v) => setEditForm((f) => ({ ...f, food_name: v }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Quantity / serving"
                        placeholderTextColor={colors.textTertiary}
                        value={editForm.serving_size}
                        onChangeText={(v) => setEditForm((f) => ({ ...f, serving_size: v }))}
                      />
                      <View style={styles.inputRow}>
                        <TextInput
                          style={[styles.input, styles.halfInput]}
                          placeholder="Calories"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="decimal-pad"
                          value={editForm.calories}
                          onChangeText={(v) => setEditForm((f) => ({ ...f, calories: v }))}
                        />
                        <TextInput
                          style={[styles.input, styles.halfInput]}
                          placeholder="Protein (g)"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="decimal-pad"
                          value={editForm.protein}
                          onChangeText={(v) => setEditForm((f) => ({ ...f, protein: v }))}
                        />
                      </View>
                      <View style={styles.formActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.primaryBtn, editSaving && styles.btnDisabled]}
                          onPress={handleSaveEdit}
                          disabled={editSaving}
                        >
                          <Text style={styles.primaryBtnText}>{editSaving ? 'Saving…' : 'Save'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    /* ── Log entry card ── */
                    <View key={log.id} style={styles.entry}>
                      <View style={styles.entryMain}>
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
                      <View style={styles.entryActions}>
                        <TouchableOpacity onPress={() => handleSaveToSaved(log)} style={styles.actionBtn} hitSlop={6}>
                          <Text style={styles.actionSave}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => startEdit(log)} style={styles.actionBtn} hitSlop={6}>
                          <Text style={styles.actionEdit}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(log)} style={styles.actionBtn} hitSlop={6}>
                          <Text style={styles.actionDelete}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* Bottom button */}
        {!showForm && editingId === null && (
          <TouchableOpacity style={styles.addBtn} onPress={openAddForm} activeOpacity={0.85}>
            <Text style={styles.addBtnIcon}>+</Text>
            <Text style={styles.addBtnText}>Add Food</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>

      <SavedMealPicker
        visible={pickerVisible}
        meals={savedMeals}
        onSelect={handlePickSaved}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
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

  scroll: { padding: spacing.md, paddingBottom: 120, gap: spacing.md },

  totalsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  totalsLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalsRow: { flexDirection: 'row', alignItems: 'center' },
  totalItem: { flex: 1, alignItems: 'center', gap: 2 },
  totalDivider: { width: 1, height: 36, backgroundColor: colors.border },
  totalValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  totalUnit: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  // Forms (add + edit)
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  editForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  formTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  fromSavedBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    backgroundColor: `${colors.warning}20`,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.warning}40`,
  },
  fromSavedText: { fontSize: 12, fontWeight: '600', color: colors.warning },

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
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  halfInput: { flex: 1 },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  primaryBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Entries
  list: { gap: spacing.sm },
  entry: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  entryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  entryLeft: { flex: 1, gap: 2 },
  entryName: { fontSize: 15, fontWeight: '600', color: colors.text },
  entrySub: { fontSize: 12, color: colors.textTertiary },
  entryRight: { alignItems: 'flex-end', gap: 2 },
  entryCalories: { fontSize: 14, fontWeight: '700', color: colors.primary },
  entryProtein: { fontSize: 12, color: colors.textSecondary },

  entryActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  actionSave: { fontSize: 12, fontWeight: '600', color: colors.warning },
  actionEdit: { fontSize: 12, fontWeight: '600', color: colors.primary },
  actionDelete: { fontSize: 12, fontWeight: '600', color: colors.danger },

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
