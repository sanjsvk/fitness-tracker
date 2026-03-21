import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts } from '@/hooks/useWorkouts';
import { colors, radius, spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { workouts } = useWorkouts(session?.user?.id);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data?.username) setUsername(data.username);
      });
  }, [session?.user?.id]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const totalSets = workouts.reduce(
    (acc, w) => acc + w.workout_exercises.reduce((a, we) => a + we.sets.length, 0),
    0
  );

  const avatar = username ? username[0].toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatar}</Text>
          </View>
          <Text style={styles.name}>{username || 'Athlete'}</Text>
          <Text style={styles.email}>{session?.user?.email}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatBox value={workouts.length} label="Workouts" />
          <StatBox value={totalSets} label="Total Sets" />
          <StatBox
            value={workouts.length > 0 ? Math.round(totalSets / workouts.length) : 0}
            label="Avg Sets"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Row label="Email" value={session?.user?.email ?? ''} />
            <View style={styles.divider} />
            <Row label="Username" value={username || '—'} />
            <View style={styles.divider} />
            <Row label="Member since" value={
              session?.user?.created_at
                ? new Date(session.user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'
            } />
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },

  avatarWrap: { alignItems: 'center', gap: 6, paddingVertical: spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  email: { fontSize: 13, color: colors.textSecondary },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },

  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  rowLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  rowValue: { fontSize: 14, color: colors.text, flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },

  signOutBtn: {
    backgroundColor: `${colors.danger}15`,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.danger}30`,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: colors.danger },
});
