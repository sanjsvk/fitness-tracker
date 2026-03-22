import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SavedMeal } from '@/hooks/useSavedMeals';
import { colors, radius, spacing } from '@/constants/theme';

interface SavedMealPickerProps {
  visible: boolean;
  meals: SavedMeal[];
  onSelect: (meal: SavedMeal) => void;
  onClose: () => void;
}

export function SavedMealPicker({ visible, meals, onSelect, onClose }: SavedMealPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return meals;
    const q = query.toLowerCase();
    return meals.filter((m) => m.name.toLowerCase().includes(q));
  }, [meals, query]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (meal: SavedMeal) => {
    setQuery('');
    onSelect(meal);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Saved Meals</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Text style={styles.close}>Done</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Search saved meals..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          selectionColor={colors.primary}
        />

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {meals.length === 0 ? 'No saved meals yet.' : 'No meals match your search.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)} activeOpacity={0.7}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.itemMacros}>
                    {item.serving_size ? (
                      <Text style={styles.itemSub}>{item.serving_size}</Text>
                    ) : null}
                    {item.calories != null && (
                      <Text style={styles.itemCal}>{Math.round(item.calories)} kcal</Text>
                    )}
                    {item.protein != null && (
                      <Text style={styles.itemProt}>{Math.round(item.protein)}g protein</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.add}>+</Text>
              </TouchableOpacity>
            )}
          />
        )}
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  itemLeft: { flex: 1, gap: 4 },
  itemName: { fontSize: 15, color: colors.text, fontWeight: '600' },
  itemMacros: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  itemSub: { fontSize: 12, color: colors.textTertiary },
  itemCal: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  itemProt: { fontSize: 12, color: colors.textSecondary },
  add: { fontSize: 22, color: colors.primary, fontWeight: '300' },
  sep: { height: 1, backgroundColor: colors.surface, marginHorizontal: spacing.md },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: colors.textTertiary },
});
