import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { couponHistory, CouponHistory } from '../data/meMock';
import { colors, font, radius, space } from '../theme';

type Props = {
  onBack: () => void;
};

type Filter = 'all' | CouponHistory['status'];

const FILTERS: { label: string; key: Filter }[] = [
  { label: 'ทั้งหมด', key: 'all' },
  { label: 'แลกแล้ว', key: 'used' },
  { label: 'หมดอายุ', key: 'expired' },
];

export default function CouponHistoryScreen({ onBack }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const list = couponHistory.filter(c => filter === 'all' || c.status === filter);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="ย้อนกลับ" hitSlop={8}>
          <Text style={font.title}>‹</Text>
        </Pressable>
        <Text style={font.title}>ประวัติการแลกคูปอง</Text>
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

      {list.length === 0 && <Text style={[font.small, styles.empty]}>ยังไม่มีประวัติในหมวดนี้</Text>}

      {list.map(c => {
        const used = c.status === 'used';
        return (
          <View key={c.id} style={styles.card}>
            <View style={styles.logo}><Text style={styles.logoText}>🏪</Text></View>
            <View style={styles.flex}>
              <Text style={font.h2}>{c.store}</Text>
              <Text style={styles.title}>{c.title}</Text>
              <Text style={font.small}>{c.date}</Text>
            </View>
            <Text style={[styles.badge, !used && styles.badgeExpired]}>{used ? 'ใช้แล้ว' : 'หมดอายุ'}</Text>
          </View>
        );
      })}
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
  empty: { textAlign: 'center', marginTop: space.xl },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md },
  logo: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 24 },
  flex: { flex: 1, gap: 2 },
  title: { fontSize: 14, color: colors.primaryDark },
  badge: { fontSize: 11, fontWeight: '700', color: colors.onPrimary, backgroundColor: colors.primary, paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill, overflow: 'hidden' },
  badgeExpired: { backgroundColor: colors.danger },
});
