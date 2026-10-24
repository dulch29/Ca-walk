import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { colors, font, radius, space } from '../theme';
import { fmtPace, fmtTime, RunSummary, SPORT_ICON, SPORT_LABEL } from './RecordScreen';

type Props = {
  summary: RunSummary;
  onBack: () => void;
  onStory: () => void;
};

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const pad = (n: number) => String(n).padStart(2, '0');
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
// built by hand: Hermes Thai locale output is unreliable, and the app shows Buddhist Era years
export const thaiDate = (d: Date) =>
  `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;

export const coinsFor = (km: number) => Math.floor(km * 10);

export default function RecordSummaryScreen({ summary, onBack, onStory }: Props) {
  const end = new Date();
  const start = new Date(end.getTime() - summary.seconds * 1000);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="ย้อนกลับ" hitSlop={8}>
          <Text style={font.title}>‹</Text>
        </Pressable>
        <Text style={font.title}>สรุป</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.badge}>
            {SPORT_ICON[summary.sport]} {SPORT_LABEL[summary.sport]}
          </Text>
          <Text style={font.small}>
            {thaiDate(end)} | {hm(start)} - {hm(end)}
          </Text>
        </View>
        <Text style={styles.bigKm}>
          {summary.km.toFixed(2)} <Text style={styles.unit}>km</Text>
        </Text>
        <View style={styles.row}>
          <Stat label="ก้าว" value={summary.steps.toLocaleString()} />
          <Stat label="Pace" value={`${fmtPace(summary.seconds, summary.km)} /km`} />
          <Stat label="เวลา" value={fmtTime(summary.seconds)} />
        </View>
      </View>

      <View style={styles.catRow}>
        <CatAvatar size={90} mood="jump" />
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>สุดยอด! คุณทำได้ดีมากวันนี้</Text>
        </View>
      </View>

      <View style={[styles.card, styles.row]}>
        <Text style={font.h2}>ได้รับเหรียญ</Text>
        <Text style={styles.coins}>🪙 +{coinsFor(summary.km)}</Text>
      </View>

      <Pressable onPress={onBack} accessibilityRole="button" style={styles.ghostBtn}>
        <Text style={styles.ghostText}>ดูรายละเอียด</Text>
      </Pressable>
      <Pressable onPress={onStory} accessibilityRole="button" style={styles.btn}>
        <Text style={styles.btnText}>สร้าง Story</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={font.small}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
    backgroundColor: colors.primary,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  bigKm: { fontSize: 48, fontWeight: '800', color: colors.primaryDark },
  unit: { fontSize: 20, fontWeight: '600', color: colors.textMuted },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
  },
  bubbleText: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  coins: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
  ghostBtn: {
    paddingVertical: space.md,
    alignItems: 'center',
    borderRadius: radius.pill,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  ghostText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  btn: {
    paddingVertical: space.md,
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
