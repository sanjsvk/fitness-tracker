import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { DraftSet } from '@/types';

interface SetRowProps {
  index: number;
  set: DraftSet;
  onChange: (field: keyof DraftSet, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetRow({ index, set, onChange, onRemove, canRemove }: SetRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.setNum}>{index + 1}</Text>

      <View style={styles.field}>
        <TextInput
          style={styles.input}
          value={set.weight}
          onChangeText={(v) => onChange('weight', v)}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
        />
        <Text style={styles.unit}>kg</Text>
      </View>

      <View style={styles.field}>
        <TextInput
          style={styles.input}
          value={set.reps}
          onChangeText={(v) => onChange('reps', v)}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
        />
        <Text style={styles.unit}>reps</Text>
      </View>

      {canRemove ? (
        <TouchableOpacity onPress={onRemove} style={styles.remove} hitSlop={8}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.remove} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  setNum: {
    width: 24,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    minHeight: 40,
    gap: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 0,
  },
  unit: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  remove: { width: 28, alignItems: 'center' },
  removeText: { fontSize: 13, color: colors.textTertiary },
});
