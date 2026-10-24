import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { Quest, QuestKind, quests } from '../data/mock';
import { colors, font, radius, space } from '../theme';

type Props = {
  onBack: () => void;
  onGo: () => void;
};

const FILTERS: { label: string; kind: QuestKind | 'all' }[] = [
  { label: 'ทั้งหมด', kind: 'all' },
  { label: 'รายวัน', kind: 'daily' },
  { label: 'รายสัปดาห์', kind: 'weekly' },
  { label: 'พิเศษ', kind: 'special' },
];

const pct = (q: Quest) => `${Math.min(1, q.progress / q.goal) * 100}%` as const;

export default function MissionsScreen({ onBack, onGo }: Props) {
  const [filter, setFilter] = useState<QuestKind | 'all'>('all');
  const show = (k: QuestKind) => filter === 'all' || filter === k;
  const daily = quests.filter(q => q.kind === 'daily');
  const weekly = quests.filter(q => q.kind === 'weekly');
  const special = quests.filter(q => q.kind === 'special');

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
        <Text style={font.title}>ภารกิจของฉัน</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
      >
        {FILTERS.map(f => {
          const on = f.kind === filter;
          return (
            <Pressable
              key={f.kind}
              onPress={() => setFilter(f.kind)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.pill, on && styles.pillOn]}
            >
              <Text style={[font.small, on && styles.pillTextOn]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {show('daily') && (
        <>
          <Text style={font.h2}>Daily Quest</Text>
          {daily.map(q => (
            <View key={q.id} style={styles.dailyCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.dailyIcon}>{q.icon}</Text>
                <Text style={styles.timer}>เหลืออีก 12 ชม.</Text>
              </View>
              <Text style={styles.dailyTitle}>{q.title}</Text>
              <Text style={styles.dailySmall}>
                {q.progress} / {q.goal} {q.unit} 🪙 +{q.reward}
              </Text>
              <View style={styles.trackDark}>
                <View style={[styles.fillLight, { width: pct(q) }]} />
              </View>
              <Pressable
                onPress={onGo}
                accessibilityRole="button"
                style={styles.goBtn}
              >
                <Text style={styles.goText}>ไปเลย</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      {show('weekly') && (
        <>
          <Text style={font.h2}>Weekly Quest</Text>
          {weekly.map(q => (
            <View key={q.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={font.body}>
                  {q.icon} {q.title}
                </Text>
                <Text style={styles.coin}>🪙 +{q.reward}</Text>
              </View>
              <Text style={font.small}>
                {q.progress} / {q.goal} {q.unit}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: pct(q) }]} />
              </View>
            </View>
          ))}
        </>
      )}

      {show('special') && (
        <>
          <Text style={font.h2}>Special Event</Text>
          {special.map(q => (
            <View key={q.id} style={styles.event}>
              <CatAvatar size={72} mood="sit" />
              <View style={styles.flex}>
                <Text style={font.h2}>
                  {q.icon} {q.title}
                </Text>
                <Text style={font.small}>{q.unit}</Text>
                <Text style={styles.coin}>🪙 +{q.reward}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pills: { gap: space.sm },
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillTextOn: { color: colors.onPrimary, fontWeight: '700' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  dailyIcon: { fontSize: 28 },
  timer: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  dailyTitle: { fontSize: 17, fontWeight: '700', color: colors.onPrimary },
  dailySmall: { fontSize: 12, color: colors.onPrimary },
  trackDark: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  fillLight: { height: '100%', backgroundColor: colors.onPrimary },
  goBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.onPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  goText: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  coin: { fontSize: 14, fontWeight: '700', color: colors.coin },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: space.md,
  },
  flex: { flex: 1, gap: 2 },
});
