import { create } from 'zustand';
import { DraftExercise, DraftSet, Exercise } from '@/types';

interface WorkoutStore {
  name: string;
  exercises: DraftExercise[];
  setName: (name: string) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (index: number) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, field: keyof DraftSet, value: string) => void;
  reset: () => void;
}

const defaultSet = (): DraftSet => ({ weight: '', reps: '' });

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  name: '',
  exercises: [],

  setName: (name) => set({ name }),

  addExercise: (exercise) =>
    set((state) => ({
      exercises: [
        ...state.exercises,
        { exercise, sets: [defaultSet()] },
      ],
    })),

  removeExercise: (index) =>
    set((state) => ({
      exercises: state.exercises.filter((_, i) => i !== index),
    })),

  addSet: (exerciseIndex) =>
    set((state) => {
      const exercises = [...state.exercises];
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        sets: [...exercises[exerciseIndex].sets, defaultSet()],
      };
      return { exercises };
    }),

  removeSet: (exerciseIndex, setIndex) =>
    set((state) => {
      const exercises = [...state.exercises];
      const sets = exercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets };
      return { exercises };
    }),

  updateSet: (exerciseIndex, setIndex, field, value) =>
    set((state) => {
      const exercises = [...state.exercises];
      const sets = [...exercises[exerciseIndex].sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets };
      return { exercises };
    }),

  reset: () => set({ name: '', exercises: [] }),
}));
