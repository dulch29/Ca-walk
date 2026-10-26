import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { useAppContext } from '../context/AppContext';
import { colors, font, radius, space } from '../theme';

type Props = {
  onBack: () => void;
};

export default function DistanceWalletScreen({ onBack }: Props) {
  const { user } = useAppContext();
  const nextGoalKm = 10.0;
  const pct = Math.min(1, user.redeemableDistanceKm / nextGoalKm);

  const stats = [
    {
      icon: '👛',
      label: 'ระยะแลกได้',
      value: `${user.redeemableDistanceKm.toFixed(1)} km`,
    },
    {
      icon: '🏃',
      label: 'ระยะสะสมรวม',
      value: `${user.totalDistanceKm.toFixed(1)} km`,
    },
    {
      icon: '👣',
      label: 'จำนวนก้าว',
      value: user.totalSteps.toLocaleString(),
    },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          hitSlop={8}
        >
          <Text style={font.title}>‹</Text>
        </Pressable>
        <Text style={font.title}>Distance Wallet</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>ระยะทางสำหรับแลกคูปอง (Redeemable)</Text>
        <Text style={styles.bigKm}>
          {user.redeemableDistanceKm.toFixed(1)} km
        </Text>
        <Text style={styles.heroCoins}>
          ระยะสะสมรวมทั้งหมด: {user.totalDistanceKm.toFixed(1)} km
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct * 100}%` }]} />
        </View>
        <Text style={styles.heroSmall}>
          เป้าหมายถัดไป {nextGoalKm} km ({Math.round(pct * 100)}%)
        </Text>
      </View>

      <Text style={font.h2}>สถิติรวม</Text>
      <View style={styles.statRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.icon}>{s.icon}</Text>
            <Text style={font.small}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      <Text style={font.h2}>ประวัติกิจกรรมการเดิน/วิ่ง</Text>
      <View style={styles.card}>
        {user.runHistory.length === 0 ? (
          <Text style={[font.small, styles.empty]}>ยังไม่มีประวัติการเดิน</Text>
        ) : (
          user.runHistory.map((h) => (
            <View key={h.sessionId} style={styles.histRow}>
              <View style={styles.histIcon}>
                <Text>🏃</Text>
              </View>
              <View style={styles.flex}>
                <Text style={font.body}>{h.distanceKm.toFixed(2)} km</Text>
                <Text style={font.small}>
                  {new Date(h.startTime).toLocaleString('th-TH')} • Pace {h.averagePace}
                </Text>
              </View>
              <Text style={styles.stepsText}>+{h.steps} ก้าว</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.bubbleRow}>
        <CatAvatar size={72} mood="sit" />
        <View style={styles.bubble}>
          <Text style={font.h2}>เก่งมากเลย!</Text>
          <Text style={font.small}>
            ทุกก้าวมีค่า นำระยะทางไปแลกรับคูปองหน้าร้านได้เลยนะ เมี้ยว~
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  heroLabel: { fontSize: 13, color: colors.onPrimary, opacity: 0.9 },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.xs,
  },
  bigKm: { fontSize: 36, fontWeight: '800', color: colors.onPrimary },
  heroCoins: { fontSize: 14, fontWeight: '600', color: colors.onPrimary },
  heroSmall: { fontSize: 12, color: colors.onPrimary },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    overflow: 'hidden',
    marginTop: space.xs,
  },
  fill: { height: '100%', backgroundColor: colors.surface },
  statRow: { flexDirection: 'row', gap: space.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    alignItems: 'center',
    gap: space.xs,
  },
  icon: { fontSize: 24 },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  histIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  stepsText: { ...font.small, color: colors.primaryDark, fontWeight: '700' },
  bubbleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.xs,
  },
  empty: { textAlign: 'center', padding: space.md },
});
