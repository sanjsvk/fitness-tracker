import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { ExercisePicker } from '@/components/ExercisePicker';
import { WorkoutWithExercises, Exercise, DraftExercise, DraftSet, CardioMetric } from '@/types';
import { colors, radius, spacing } from '@/constants/theme';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

// Render a set value for view mode
function setValueLabel(field: 'duration' | 'speed' | 'distance' | 'level' | 'incline' | 'weight' | 'reps', val: number | null, unit: string) {
  return val != null ? `${val} ${unit}` : '—';
}

function cardioColumns(m: CardioMetric): Array<{ label: string; field: string; unit: string; decimal?: boolean }> {
  switch (m) {
    case 'speed_distance': return [
      { label: 'TIME', field: 'duration', unit: 'min' },
      { label: 'SPEED', field: 'speed', unit: 'km/h' },
      { label: 'DIST', field: 'distance', unit: 'km' },
    ];
    case 'level_distance': return [
      { label: 'TIME', field: 'duration', unit: 'min' },
      { label: 'LEVEL', field: 'level', unit: 'lvl', decimal: false },
      { label: 'DIST', field: 'distance', unit: 'km' },
    ];
    case 'incline_speed': return [
      { label: 'TIME', field: 'duration', unit: 'min' },
      { label: 'INCLINE', field: 'incline', unit: '%' },
      { label: 'SPEED', field: 'speed', unit: 'km/h' },
    ];
    case 'reps': return [
      { label: 'TIME', field: 'duration', unit: 'min' },
      { label: 'REPS', field: 'reps', unit: 'reps', decimal: false },
    ];
    default: return [
      { label: 'WEIGHT', field: 'weight', unit: '' },
      { label: 'REPS', field: 'reps', unit: 'reps', decimal: false },
    ];
  }
}

type EditableSet = {
  id: string; set_number: number;
  weight: string; reps: string; duration: string;
  speed: string; distance: string; level: string; incline: string;
  weight_unit: string;
};

type EditableExercise = {
  weId: string; name: string; category: string | null;
  cardioMetric: CardioMetric; sets: EditableSet[];
};

const defaultDraftSet = (): DraftSet => ({
  weight: '', reps: '', duration: '', speed: '', distance: '', level: '', incline: '',
});

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<EditableExercise[]>([]);
  const [newExercises, setNewExercises] = useState<DraftExercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  const fetchWorkout = async () => {
    const { data } = await supabase
      .from('workouts')
      .select(`*, workout_exercises (*, exercise:exercises(*), sets(*))`)
      .eq('id', id).single();
    if (data) setWorkout(data as WorkoutWithExercises);
  };

  useEffect(() => {
    if (!id) return;
    fetchWorkout().then(() => setLoading(false));
  }, [id]);

  const enterEditMode = () => {
    if (!workout) return;
    setEditData(workout.workout_exercises.map((we) => ({
      weId: we.id,
      name: we.exercise.name,
      category: we.exercise.category,
      cardioMetric: we.exercise.cardio_metric,
      sets: we.sets.sort((a, b) => a.set_number - b.set_number).map((s) => ({
        id: s.id, set_number: s.set_number,
        weight: s.weight != null ? String(s.weight) : '',
        reps: s.reps != null ? String(s.reps) : '',
        duration: s.duration != null ? String(s.duration) : '',
        speed: s.speed != null ? String(s.speed) : '',
        distance: s.distance != null ? String(s.distance) : '',
        level: s.level != null ? String(s.level) : '',
        incline: s.incline != null ? String(s.incline) : '',
        weight_unit: s.weight_unit,
      })),
    })));
    setNewExercises([]);
    setEditing(true);
  };

  const updateEditSet = (exIdx: number, setIdx: number, field: keyof EditableSet, value: string) => {
    setEditData((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const updateNewSet = (exIdx: number, setIdx: number, field: keyof DraftSet, value: string) => {
    setNewExercises((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const saveEdits = async () => {
    setSaving(true);
    try {
      for (const ex of editData) {
        for (const s of ex.sets) {
          await supabase.from('sets').update({
            weight: s.weight ? parseFloat(s.weight) : null,
            reps: s.reps ? parseInt(s.reps) : null,
            duration: s.duration ? parseFloat(s.duration) : null,
            speed: s.speed ? parseFloat(s.speed) : null,
            distance: s.distance ? parseFloat(s.distance) : null,
            level: s.level ? parseFloat(s.level) : null,
            incline: s.incline ? parseFloat(s.incline) : null,
          }).eq('id', s.id);
        }
      }
      // Insert new exercises
      const existingCount = editData.length;
      for (let i = 0; i < newExercises.length; i++) {
        const { exercise, sets } = newExercises[i];
        const cm = exercise.cardio_metric;
        const { data: we } = await supabase
          .from('workout_exercises')
          .insert({ workout_id: id, exercise_id: exercise.id, exercise_order: existingCount + i })
          .select().single();
        if (we) {
          const setsData = sets.filter((s) => s.duration || s.weight || s.reps).map((s, idx) => ({
            workout_exercise_id: we.id, set_number: idx + 1,
            weight: cm === null && s.weight ? parseFloat(s.weight) : null,
            reps: (cm === null || cm === 'reps') && s.reps ? parseInt(s.reps) : null,
            duration: cm !== null && s.duration ? parseFloat(s.duration) : null,
            speed: (cm === 'speed_distance' || cm === 'incline_speed') && s.speed ? parseFloat(s.speed) : null,
            distance: (cm === 'speed_distance' || cm === 'level_distance') && s.distance ? parseFloat(s.distance) : null,
            level: cm === 'level_distance' && s.level ? parseFloat(s.level) : null,
            incline: cm === 'incline_speed' && s.incline ? parseFloat(s.incline) : null,
            weight_unit: 'lbs',
          }));
          if (setsData.length > 0) await supabase.from('sets').insert(setsData);
        }
      }
      await fetchWorkout();
      setEditing(false);
      setNewExercises([]);
    } catch {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete workout?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('workouts').delete().eq('id', id);
          if (error) Alert.alert('Error', 'Failed to delete workout.');
          else router.replace('/(tabs)');
        },
      },
    ]);
  };

  if (loading) {
    return <SafeAreaView style={[styles.safe, styles.center]}><ActivityIndicator color={colors.primary} /></SafeAreaView>;
  }
  if (!workout) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.errorText}>Workout not found.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backLink}>Go back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalSets = workout.workout_exercises.reduce((acc, we) => acc + we.sets.length, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => { setEditing(false); router.back(); }} hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.topActions}>
          {editing ? (
            <>
              <TouchableOpacity onPress={() => { setEditing(false); setNewExercises([]); }} style={styles.topBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdits} style={[styles.topBtn, styles.saveBtn]} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={enterEditMode} style={styles.topBtn}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.topBtn}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.workoutName}>{workout.name || 'Workout'}</Text>
          <Text style={styles.date}>{formatDate(workout.logged_at)}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatChip value={workout.workout_exercises.length} label="Exercises" />
          <StatChip value={totalSets} label="Sets" />
        </View>

        {/* Existing exercises — view or edit mode */}
        {(editing ? editData : workout.workout_exercises).map((item, exIdx) => {
          const isEditing = editing;
          const weId = isEditing ? (item as EditableExercise).weId : (item as any).id;
          const name = isEditing ? (item as EditableExercise).name : (item as any).exercise.name;
          const category = isEditing ? (item as EditableExercise).category : (item as any).exercise.category;
          const cm: CardioMetric = isEditing
            ? (item as EditableExercise).cardioMetric
            : (item as any).exercise.cardio_metric;
          const sets = isEditing ? (item as EditableExercise).sets : (item as any).sets.sort((a: any, b: any) => a.set_number - b.set_number);
          const cols = cardioColumns(cm);

          return (
            <View key={weId} style={styles.exerciseBlock}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{name}</Text>
                {category && <Text style={styles.exerciseCategory}>{category}</Text>}
              </View>
              <View style={styles.setTableHeader}>
                <Text style={styles.th}>SET</Text>
                {cols.map((c) => <Text key={c.field} style={[styles.th, styles.thFlex]}>{c.label}</Text>)}
              </View>
              {sets.map((s: any, setIdx: number) => (
                <View key={s.id ?? setIdx} style={styles.setRow}>
                  <Text style={styles.setNum}>{s.set_number ?? setIdx + 1}</Text>
                  {cols.map((c) => isEditing ? (
                    <TextInput
                      key={c.field}
                      style={styles.editInput}
                      value={s[c.field] ?? ''}
                      onChangeText={(v) => updateEditSet(exIdx, setIdx, c.field as keyof EditableSet, v)}
                      keyboardType={c.decimal === false ? 'number-pad' : 'decimal-pad'}
                      placeholder="—"
                      placeholderTextColor={colors.textTertiary}
                    />
                  ) : (
                    <Text key={c.field} style={styles.setValue}>
                      {s[c.field] != null ? `${s[c.field]}${c.unit ? ' ' + c.unit : ''}` : '—'}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          );
        })}

        {/* New exercises in edit mode */}
        {editing && newExercises.map((draftEx, exIdx) => {
          const cm = draftEx.exercise.cardio_metric;
          const cols = cardioColumns(cm);
          return (
            <View key={`new-${exIdx}`} style={[styles.exerciseBlock, styles.newExerciseBlock]}>
              <View style={styles.exerciseHeader}>
                <View>
                  <Text style={styles.exerciseName}>{draftEx.exercise.name}</Text>
                  {draftEx.exercise.category && <Text style={styles.exerciseCategory}>{draftEx.exercise.category}</Text>}
                </View>
                <TouchableOpacity onPress={() => setNewExercises((p) => p.filter((_, i) => i !== exIdx))} hitSlop={8}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.setTableHeader}>
                <Text style={styles.th}>SET</Text>
                {cols.map((c) => <Text key={c.field} style={[styles.th, styles.thFlex]}>{c.label}</Text>)}
              </View>
              {draftEx.sets.map((s, setIdx) => (
                <View key={setIdx} style={styles.setRow}>
                  <Text style={styles.setNum}>{setIdx + 1}</Text>
                  {cols.map((c) => (
                    <TextInput
                      key={c.field}
                      style={styles.editInput}
                      value={(s as any)[c.field] ?? ''}
                      onChangeText={(v) => updateNewSet(exIdx, setIdx, c.field as keyof DraftSet, v)}
                      keyboardType={c.decimal === false ? 'number-pad' : 'decimal-pad'}
                      placeholder="—"
                      placeholderTextColor={colors.textTertiary}
                    />
                  ))}
                </View>
              ))}
              <TouchableOpacity
                style={styles.addSetBtn}
                onPress={() => setNewExercises((p) => {
                  const next = [...p];
                  next[exIdx] = { ...next[exIdx], sets: [...next[exIdx].sets, defaultDraftSet()] };
                  return next;
                })}
              >
                <Text style={styles.addSetText}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {editing && (
          <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setPickerVisible(true)} activeOpacity={0.8}>
            <Text style={styles.addExerciseIcon}>+</Text>
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        )}

        {workout.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}
      </ScrollView>

      <ExercisePicker
        visible={pickerVisible}
        onSelect={(exercise: Exercise) => setNewExercises((p) => [...p, { exercise, sets: [defaultDraftSet()] }])}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

function StatChip({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  back: { fontSize: 15, color: colors.primary, fontWeight: '500' },
  topActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  topBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  editText: { fontSize: 15, color: colors.primary, fontWeight: '500' },
  deleteText: { fontSize: 15, color: colors.danger, fontWeight: '500' },
  cancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.md },
  saveBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: 4 },
  workoutName: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  date: { fontSize: 13, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statChip: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.sm + 4, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, gap: 2,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '500', textTransform: 'uppercase' },
  exerciseBlock: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xs,
  },
  newExerciseBlock: { borderColor: colors.primary, borderStyle: 'dashed' },
  exerciseHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.text },
  exerciseCategory: {
    fontSize: 11, color: colors.primary, fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2,
  },
  removeText: { fontSize: 13, color: colors.danger, fontWeight: '500' },
  setTableHeader: { flexDirection: 'row', marginBottom: 4, gap: 4 },
  th: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.5, width: 36 },
  thFlex: { flex: 1, width: undefined, textAlign: 'center' },
  setRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.xs + 2, borderTopWidth: 1, borderTopColor: colors.border, gap: 4,
  },
  setNum: { width: 36, fontSize: 13, fontWeight: '700', color: colors.primary },
  setValue: { flex: 1, textAlign: 'center', fontSize: 13, color: colors.text, fontWeight: '500' },
  editInput: {
    flex: 1, textAlign: 'center', fontSize: 13, color: colors.text, fontWeight: '600',
    backgroundColor: colors.surface2, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.primary, paddingHorizontal: 4, paddingVertical: 4, minHeight: 34,
  },
  addSetBtn: {
    alignItems: 'center', paddingVertical: spacing.sm, marginTop: 4,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  addSetText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
  },
  addExerciseIcon: { fontSize: 22, color: colors.primary, lineHeight: 24 },
  addExerciseText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  notesBlock: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  notesLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  notesText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  errorText: { fontSize: 15, color: colors.textSecondary },
  backLink: { fontSize: 14, color: colors.primary, marginTop: spacing.sm },
});
