import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { wallet } from '../data/mock';
import { colors, font, radius, space } from '../theme';

type Props = {
  onBack: () => void;
};

export default function DistanceWalletScreen({ onBack }: Props) {
  const pct = Math.min(1, wallet.km / wallet.nextGoalKm);
  const stats = [
    { icon: '🚶', label: 'เดิน', value: `${wallet.walkKm} km` },
    { icon: '🏃', label: 'วิ่ง', value: `${wallet.runKm} km` },
    { icon: '👣', label: 'จำนวนก้าว', value: wallet.steps.toLocaleString() },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="ย้อนกลับ" hitSlop={8}>
          <Text style={font.title}>‹</Text>
        </Pressable>
        <Text style={font.title}>Distance Wallet</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.bigKm}>{wallet.km.toFixed(1)} km</Text>
        <Text style={styles.heroCoins}>= {wallet.coins} 🪙</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct * 100}%` }]} />
        </View>
        <Text style={styles.heroSmall}>เป้าหมายถัดไป {wallet.nextGoalKm} km</Text>
      </View>

      <Text style={font.h2}>สถิติรวม</Text>
      <View style={styles.statRow}>
        {stats.map(s => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.icon}>{s.icon}</Text>
            <Text style={font.small}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      <Text style={font.h2}>ประวัติการสะสม</Text>
      <View style={styles.card}>
        {wallet.history.map(h => (
          <View key={h.id} style={styles.histRow}>
            <View style={styles.histIcon}>
              <Text>{h.type === 'วิ่ง' ? '🏃' : '🚶'}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={font.body}>{h.type}</Text>
              <Text style={font.small}>{h.date}</Text>
            </View>
            <Text style={styles.coin}>🪙 +{h.coins}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bubbleRow}>
        <CatAvatar size={72} mood="sit" />
        <View style={styles.bubble}>
          <Text style={font.h2}>เก่งมากเลย!</Text>
          <Text style={font.small}>อีกนิดเดียวก็ถึงเป้าหมายแล้ว</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  bigKm: { fontSize: 36, fontWeight: '800', color: colors.onPrimary },
  heroCoins: { fontSize: 18, fontWeight: '700', color: colors.onPrimary },
  heroSmall: { fontSize: 12, color: colors.onPrimary },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.primaryDark, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.onPrimary },
  statRow: { flexDirection: 'row', gap: space.sm },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    padding: space.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  icon: { fontSize: 22 },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.md,
  },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  histIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  coin: { fontSize: 14, fontWeight: '700', color: colors.coin },
  bubbleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
  },
});
