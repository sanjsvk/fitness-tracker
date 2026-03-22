import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { CardioMetric, DraftSet } from '@/types';

interface SetRowProps {
  index: number;
  set: DraftSet;
  onChange: (field: keyof DraftSet, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  cardioMetric?: CardioMetric;
  weightUnit?: 'kg' | 'lbs';
}

function Field({ value, onChangeText, unit, decimal = true }: {
  value: string;
  onChangeText: (v: string) => void;
  unit: string;
  decimal?: boolean;
}) {
  return (
    <View style={styles.field}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.primary}
      />
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

export function SetRow({
  index, set, onChange, onRemove, canRemove,
  cardioMetric = null, weightUnit = 'lbs',
}: SetRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.setNum}>{index + 1}</Text>

      {/* Time — all cardio */}
      {cardioMetric !== null && (
        <Field value={set.duration} onChangeText={(v) => onChange('duration', v)} unit="min" />
      )}

      {/* Metric 2 */}
      {cardioMetric === 'speed_distance' && (
        <Field value={set.speed} onChangeText={(v) => onChange('speed', v)} unit="km/h" />
      )}
      {cardioMetric === 'level_distance' && (
        <Field value={set.level} onChangeText={(v) => onChange('level', v)} unit="lvl" decimal={false} />
      )}
      {cardioMetric === 'incline_speed' && (
        <Field value={set.incline} onChangeText={(v) => onChange('incline', v)} unit="%" />
      )}
      {cardioMetric === 'reps' && (
        <Field value={set.reps} onChangeText={(v) => onChange('reps', v)} unit="reps" decimal={false} />
      )}

      {/* Metric 3 (3-field cardio only) */}
      {cardioMetric === 'speed_distance' && (
        <Field value={set.distance} onChangeText={(v) => onChange('distance', v)} unit="km" />
      )}
      {cardioMetric === 'level_distance' && (
        <Field value={set.distance} onChangeText={(v) => onChange('distance', v)} unit="km" />
      )}
      {cardioMetric === 'incline_speed' && (
        <Field value={set.speed} onChangeText={(v) => onChange('speed', v)} unit="km/h" />
      )}

      {/* Strength */}
      {cardioMetric === null && (
        <>
          <Field value={set.weight} onChangeText={(v) => onChange('weight', v)} unit={weightUnit} />
          <Field value={set.reps} onChangeText={(v) => onChange('reps', v)} unit="reps" decimal={false} />
        </>
      )}

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
    gap: 6,
    paddingVertical: spacing.xs,
  },
  setNum: {
    width: 20,
    fontSize: 12,
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
    paddingHorizontal: 6,
    minHeight: 38,
    gap: 2,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 0,
  },
  unit: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  remove: { width: 24, alignItems: 'center' },
  removeText: { fontSize: 13, color: colors.textTertiary },
});
