import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/types';
import { colors, radius, spacing } from '@/constants/theme';

const CATEGORY_COLORS: Record<string, string> = {
  chest: '#EF4444',
  back: '#3B82F6',
  legs: '#10B981',
  shoulders: '#F59E0B',
  arms: '#8B5CF6',
  core: '#EC4899',
  cardio: '#14B8A6',
};

interface ExercisePickerProps {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ visible, onSelect, onClose }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      supabase
        .from('exercises')
        .select('*')
        .order('name')
        .then(({ data }) => {
          if (data) setExercises(data);
        });
    } else {
      // Reset when closed
      setQuery('');
      setSelectedCategory(null);
      setRecentlyAdded(new Set());
    }
  }, [visible]);

  const categories = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.category).filter(Boolean))) as string[],
    [exercises]
  );

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !selectedCategory || e.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [exercises, query, selectedCategory]);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    // Stay open, stay in the same category — just show feedback
    setRecentlyAdded((prev) => {
      const next = new Set(prev);
      next.add(exercise.id);
      return next;
    });
    // Clear the added indicator after 1.5s
    setTimeout(() => {
      setRecentlyAdded((prev) => {
        const next = new Set(prev);
        next.delete(exercise.id);
        return next;
      });
    }, 1500);
  };

  const handleDoneOrBack = () => {
    if (selectedCategory !== null) {
      // Go back to All exercises view
      setSelectedCategory(null);
      setQuery('');
    } else {
      // At top level — close the picker
      onClose();
    }
  };

  const headerLabel = selectedCategory
    ? `← ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`
    : 'Add Exercise';

  const actionLabel = selectedCategory ? 'All' : 'Done';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleDoneOrBack}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{headerLabel}</Text>
          <TouchableOpacity onPress={handleDoneOrBack} hitSlop={8}>
            <Text style={styles.close}>{actionLabel}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          selectionColor={colors.primary}
        />

        <View style={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => { setSelectedCategory(null); setQuery(''); }}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => { setSelectedCategory(selectedCategory === cat ? null : cat); setQuery(''); }}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const added = recentlyAdded.has(item.id);
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: CATEGORY_COLORS[item.category ?? ''] ?? colors.primary },
                    ]}
                  />
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.equipment && (
                      <Text style={styles.itemSub}>{item.equipment}</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.add, added && styles.addedIcon]}>
                  {added ? '✓' : '+'}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  close: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  search: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: 8,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { fontSize: 15, color: colors.text, fontWeight: '500' },
  itemSub: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
  add: { fontSize: 22, color: colors.primary, fontWeight: '300' },
  addedIcon: { fontSize: 18, color: colors.success, fontWeight: '700' },
  sep: { height: 1, backgroundColor: colors.surface, marginHorizontal: spacing.md },
});
