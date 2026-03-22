import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/constants/theme';

interface SectionSwitcherProps {
  currentSection: 'workout' | 'nutrition';
}

export function SectionSwitcher({ currentSection }: SectionSwitcherProps) {
  const [open, setOpen] = useState(false);

  const navigate = (section: 'workout' | 'nutrition') => {
    setOpen(false);
    if (section === currentSection) return;
    if (section === 'nutrition') {
      router.replace('/(nutrition)');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.trigger} hitSlop={8}>
        <View style={styles.hamburger}>
          <View style={styles.bar} />
          <View style={styles.bar} />
          <View style={styles.bar} />
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menu}>
                <Text style={styles.menuLabel}>Switch section</Text>
                <TouchableOpacity
                  style={[styles.option, currentSection === 'workout' && styles.optionActive]}
                  onPress={() => navigate('workout')}
                >
                  <Text style={styles.optionIcon}>🏋️</Text>
                  <Text style={[styles.optionText, currentSection === 'workout' && styles.optionTextActive]}>
                    Workout
                  </Text>
                  {currentSection === 'workout' && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, currentSection === 'nutrition' && styles.optionActive]}
                  onPress={() => navigate('nutrition')}
                >
                  <Text style={styles.optionIcon}>🥗</Text>
                  <Text style={[styles.optionText, currentSection === 'nutrition' && styles.optionTextActive]}>
                    Nutrition
                  </Text>
                  {currentSection === 'nutrition' && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 4,
    justifyContent: 'center',
  },
  hamburger: { gap: 4 },
  bar: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.text,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingLeft: spacing.md,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  optionActive: {
    backgroundColor: `${colors.primary}15`,
  },
  optionIcon: { fontSize: 16 },
  optionText: { fontSize: 15, fontWeight: '500', color: colors.text, flex: 1 },
  optionTextActive: { color: colors.primary, fontWeight: '600' },
  checkmark: { fontSize: 14, color: colors.primary, fontWeight: '700' },
});
