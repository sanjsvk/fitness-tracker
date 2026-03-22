import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useSavedMeals, SavedMeal } from '@/hooks/useSavedMeals';
import { SectionSwitcher } from '@/components/SectionSwitcher';
import { colors, radius, spacing } from '@/constants/theme';

interface EditState {
  name: string;
  serving_size: string;
  calories: string;
  protein: string;
}

export default function SavedMealsScreen() {
  const { session } = useAuth();
  const { meals, loading, editMeal, deleteMeal, refetch } = useSavedMeals(session?.user?.id);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditState>({ name: '', serving_size: '', calories: '', protein: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const startEdit = (meal: SavedMeal) => {
    setExpandedId(null);
    setEditingId(meal.id);
    setEditForm({
      name: meal.name,
      serving_size: meal.serving_size ?? '',
      calories: meal.calories != null ? String(meal.calories) : '',
      protein: meal.protein != null ? String(meal.protein) : '',
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) { Alert.alert('Missing field', 'Name is required.'); return; }
    if (!editingId) return;
    setEditSaving(true);
    const ok = await editMeal(editingId, {
      name: editForm.name.trim(),
      serving_size: editForm.serving_size.trim() || null,
      calories: editForm.calories ? parseFloat(editForm.calories) : null,
      protein: editForm.protein ? parseFloat(editForm.protein) : null,
    });
    setEditSaving(false);
    if (ok) cancelEdit();
    else Alert.alert('Error', 'Could not save changes. Please try again.');
  };

  const handleDelete = (meal: SavedMeal) => {
    Alert.alert('Delete saved meal?', `Remove "${meal.name}" from saved meals?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMeal(meal.id) },
    ]);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderItem = ({ item }: { item: SavedMeal }) => {
    if (editingId === item.id) {
      return (
        <View style={styles.editCard}>
          <TextInput
            style={styles.input}
            placeholder="Meal name *"
            placeholderTextColor={colors.textTertiary}
            value={editForm.name}
            onChangeText={(v) => setEditForm((f) => ({ ...f, name: v }))}
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
      );
    }

    const isExpanded = expandedId === item.id;
    return (
      <View style={styles.card}>
        {/* Tap header to expand/collapse macros */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardLeft}>
            <Text style={styles.cardName}>{item.name}</Text>
            {item.serving_size ? <Text style={styles.cardSub}>{item.serving_size}</Text> : null}
          </View>
          <View style={styles.cardRight}>
            {item.calories != null && (
              <Text style={styles.cardCal}>{Math.round(item.calories)} kcal</Text>
            )}
            <Text style={styles.cardChevron}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.macroRow}>
            <MacroPill label="Serving" value={item.serving_size ?? '—'} />
            <MacroPill label="Calories" value={item.calories != null ? `${Math.round(item.calories)} kcal` : '—'} />
            <MacroPill label="Protein" value={item.protein != null ? `${Math.round(item.protein)}g` : '—'} />
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => startEdit(item)} hitSlop={6}>
            <Text style={styles.actionEdit}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnLast]} onPress={() => handleDelete(item)} hitSlop={6}>
            <Text style={styles.actionDelete}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <SectionSwitcher currentSection="nutrition" />
        <Text style={styles.title}>Saved Meals</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : meals.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyTitle}>No saved meals</Text>
          <Text style={styles.emptySub}>
            Log a meal in Today's tab and tap "⭐ Save" to save it here for quick reuse.
          </Text>
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  );
}

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
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

  list: { padding: spacing.md, paddingBottom: 80 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardLeft: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: 12, color: colors.textTertiary },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardCal: { fontSize: 13, fontWeight: '700', color: colors.primary },
  cardChevron: { fontSize: 10, color: colors.textTertiary },

  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  pill: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    alignItems: 'center',
  },
  pillLabel: { fontSize: 10, color: colors.textTertiary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  pillValue: { fontSize: 13, fontWeight: '700', color: colors.text },

  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  actionBtnLast: { borderRightWidth: 0 },
  actionEdit: { fontSize: 12, fontWeight: '600', color: colors.primary },
  actionDelete: { fontSize: 12, fontWeight: '600', color: colors.danger },

  // Edit form
  editCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    gap: spacing.sm,
  },
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

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
});
