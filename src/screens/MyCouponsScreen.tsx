import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Coupon, coupons, wallet } from '../data/mock';
import { colors, font, radius, space } from '../theme';

type Props = {
  onBack: () => void;
};

type Filter = 'all' | 'usable' | 'used';

const FILTERS: { label: string; key: Filter }[] = [
  { label: 'ทั้งหมด', key: 'all' },
  { label: 'พร้อมใช้', key: 'usable' },
  { label: 'ใช้แล้ว', key: 'used' },
];

export default function MyCouponsScreen({ onBack }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const list = coupons.filter(
    c => c.status !== 'locked' && (filter === 'all' || c.status === filter),
  );
  const locked =
    filter === 'all' ? coupons.filter(c => c.status === 'locked') : [];

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
        <Text style={font.title}>คูปองของฉัน</Text>
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
              <Text style={[font.small, on && styles.pillTextOn]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {list.length === 0 && locked.length === 0 && (
        <Text style={[font.small, styles.empty]}>ยังไม่มีคูปองในหมวดนี้</Text>
      )}

      {list.map(c => (
        <CouponCard
          key={c.id}
          coupon={c}
          open={openId === c.id}
          onToggle={() => setOpenId(openId === c.id ? null : c.id)}
        />
      ))}

      {locked.map(c => {
        const goal = c.unlockKm ?? 1;
        const pct = Math.min(1, wallet.km / goal);
        return (
          <View key={c.id} style={[styles.card, styles.lockedCard]}>
            <View style={styles.row}>
              <View style={styles.thumb}>
                <Text style={styles.thumbIcon}>🔒</Text>
              </View>
              <View style={styles.flex}>
                <Text style={font.h2}>{c.title}</Text>
                <Text style={font.small}>เมื่อเดินครบ {goal} km</Text>
                <Text style={font.small}>
                  {Math.floor(wallet.km)} / {goal} km
                </Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct * 100}%` }]} />
            </View>
            <Text style={styles.cheer}>🐾 อีกนิดเดียวก็ได้แล้ว สู้ๆ!</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function CouponCard({
  coupon,
  open,
  onToggle,
}: {
  coupon: Coupon;
  open: boolean;
  onToggle: () => void;
}) {
  const usable = coupon.status === 'usable';
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.thumb}>
          <Text style={styles.thumbIcon}>🎟️</Text>
        </View>
        <View style={styles.flex}>
          <Text style={font.h2}>{coupon.title}</Text>
          <Text style={font.body}>📍 {coupon.store}</Text>
          <Text style={font.small}>ใช้ได้ถึง {coupon.expires}</Text>
        </View>
        <Text style={[styles.tag, !usable && styles.tagOff]}>
          {usable ? 'ใช้ได้' : 'ใช้แล้ว'}
        </Text>
      </View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.more}
      >
        <Text style={styles.moreText}>
          {open ? 'ซ่อนรายละเอียด ˄' : 'ดูรายละเอียด ›'}
        </Text>
      </Pressable>
      {open && (
        <Text style={font.small}>
          แสดงคูปองนี้ที่หน้าร้าน {coupon.store} ใช้ได้ 1 ครั้งต่อบัญชี
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pills: { flexDirection: 'row', gap: space.sm },
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
  empty: { textAlign: 'center', marginTop: space.xl },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  lockedCard: { backgroundColor: colors.surfaceMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 24 },
  flex: { flex: 1, gap: 2 },
  tag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimary,
    backgroundColor: colors.primary,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  tagOff: { color: colors.text, backgroundColor: colors.surfaceMuted },
  more: { alignSelf: 'flex-start' },
  moreText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary },
  cheer: { fontSize: 12, color: colors.primaryDark },
});
