import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { activities } from '../data/meMock';
import { colors, font, radius, space } from '../theme';
import { Sport, SPORT_ICON, SPORT_LABEL } from './RecordScreen';

type Props = {
  onBack: () => void;
  onOpen: (activityId: string) => void;
};

const FILTERS: { label: string; key: Sport | 'all' }[] = [
  { label: 'ทั้งหมด', key: 'all' },
  { label: 'เดิน', key: 'walk' },
  { label: 'วิ่ง', key: 'run' },
];

// shortcut: month switcher is display-only, mock data covers one month
export default function ActivityHistoryScreen({ onBack, onOpen }: Props) {
  const [filter, setFilter] = useState<Sport | 'all'>('all');
  const list = activities.filter(a => filter === 'all' || a.sport === filter);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="ย้อนกลับ" hitSlop={8}>
          <Text style={font.title}>‹</Text>
        </Pressable>
        <Text style={font.title}>ประวัติกิจกรรม</Text>
      </View>

      <View style={styles.pills}>
        {FILTERS.map(f => {
          const on = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.pill, on && styles.pillOn]}
            >
              <Text style={[font.small, on && styles.pillTextOn]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.month}>
        <Text style={styles.arrow}>‹</Text>
        <Text style={font.h2}>กันยายน 2568</Text>
        <Text style={styles.arrow}>›</Text>
      </View>

      {list.length === 0 && <Text style={[font.small, styles.empty]}>ยังไม่มีกิจกรรม</Text>}

      {list.map(a => (
        <Pressable
          key={a.id}
          onPress={() => onOpen(a.id)}
          accessibilityRole="button"
          accessibilityLabel={`${SPORT_LABEL[a.sport]} ${a.km} km`}
          style={styles.card}
        >
          <View style={styles.icon}><Text style={styles.iconText}>{SPORT_ICON[a.sport]}</Text></View>
          <View style={styles.flex}>
            <Text style={font.body}>{SPORT_LABEL[a.sport]}</Text>
            <Text style={styles.km}>{a.km} km</Text>
            <Text style={font.small}>{a.date}</Text>
          </View>
          <Text style={styles.badge}>สำเร็จ</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pills: { flexDirection: 'row', gap: space.sm },
  pill: { paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillTextOn: { color: colors.onPrimary, fontWeight: '700' },
  month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.sm, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.pill },
  arrow: { fontSize: 20, fontWeight: '700', color: colors.textMuted, paddingHorizontal: space.md },
  empty: { textAlign: 'center', marginTop: space.xl },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20 },
  flex: { flex: 1, gap: 2 },
  km: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  badge: { fontSize: 11, fontWeight: '700', color: colors.onPrimary, backgroundColor: colors.primary, paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill, overflow: 'hidden' },
});
