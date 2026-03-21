import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useWorkoutStore } from '@/store/workoutStore';
import { ExercisePicker } from '@/components/ExercisePicker';
import { SetRow } from '@/components/SetRow';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing } from '@/constants/theme';
import { DraftSet, Exercise } from '@/types';

export default function NewWorkoutScreen() {
  const { session } = useAuth();
  const { saveWorkout } = useWorkouts(session?.user?.id);
  const { name, exercises, setName, addExercise, removeExercise, addSet, removeSet, updateSet, reset } =
    useWorkoutStore();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelectExercise = (exercise: Exercise) => {
    addExercise(exercise);
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    if (exercises.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise before saving.');
      return;
    }
    setSaving(true);
    const id = await saveWorkout(session.user.id, name, exercises);
    setSaving(false);
    if (id) {
      reset();
      router.replace(`/workout/${id}`);
    } else {
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  const handleDiscard = () => {
    if (exercises.length === 0) {
      reset();
      router.back();
      return;
    }
    Alert.alert('Discard workout?', 'All progress will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          reset();
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleDiscard} hitSlop={8}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>New Workout</Text>
          <Button
            label="Save"
            size="sm"
            onPress={handleSave}
            loading={saving}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            placeholder="Workout name (optional)"
            value={name}
            onChangeText={setName}
            style={styles.nameInput}
          />

          {exercises.map((draftEx, exIdx) => (
            <View key={`${draftEx.exercise.id}-${exIdx}`} style={styles.exerciseBlock}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{draftEx.exercise.name}</Text>
                  {draftEx.exercise.category && (
                    <Text style={styles.exerciseCategory}>{draftEx.exercise.category}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => removeExercise(exIdx)}
                  hitSlop={8}
                >
                  <Text style={styles.removeExercise}>Remove</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.setHeader}>
                <Text style={styles.setHeaderText}>SET</Text>
                <Text style={[styles.setHeaderText, styles.setHeaderCenter]}>WEIGHT</Text>
                <Text style={[styles.setHeaderText, styles.setHeaderCenter]}>REPS</Text>
                <View style={{ width: 28 }} />
              </View>

              {draftEx.sets.map((set, setIdx) => (
                <SetRow
                  key={setIdx}
                  index={setIdx}
                  set={set}
                  onChange={(field: keyof DraftSet, value: string) =>
                    updateSet(exIdx, setIdx, field, value)
                  }
                  onRemove={() => removeSet(exIdx, setIdx)}
                  canRemove={draftEx.sets.length > 1}
                />
              ))}

              <TouchableOpacity
                style={styles.addSetBtn}
                onPress={() => addSet(exIdx)}
                activeOpacity={0.7}
              >
                <Text style={styles.addSetText}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addExerciseBtn}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addExerciseIcon}>+</Text>
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePicker
        visible={pickerVisible}
        onSelect={handleSelectExercise}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelBtn: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  topTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  scroll: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  nameInput: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 0,
  },

  exerciseBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.text },
  exerciseCategory: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  removeExercise: { fontSize: 13, color: colors.danger, fontWeight: '500' },

  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  setHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    width: 24,
    textAlign: 'center',
  },
  setHeaderCenter: { flex: 1, width: undefined },

  addSetBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addSetText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addExerciseIcon: { fontSize: 22, color: colors.primary, lineHeight: 24 },
  addExerciseText: { fontSize: 15, fontWeight: '600', color: colors.primary },
});
