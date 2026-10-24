import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { stores } from '../data/mock';
import { colors, font, radius, space } from '../theme';

type Props = {
  onBack: () => void;
  onOpenStore: (storeId: string) => void;
};

const FILTERS = ['ใกล้ฉัน', 'ส่วนลด', 'อาหาร & เครื่องดื่ม'];

// shortcut: plain view with positioned pins, swap for MapLibre once it is installed
export default function MapScreen({ onBack, onOpenStore }: Props) {
  const [filter, setFilter] = useState(FILTERS[0]);
  const [selectedId, setSelectedId] = useState<string | null>(stores[0].id);
  const selected = stores.find(s => s.id === selectedId);

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับ"
            hitSlop={8}
          >
            <Text style={font.title}>‹</Text>
          </Pressable>
          <Text style={font.title}>Map</Text>
        </View>
        <View style={styles.search}>
          <Text>🔍</Text>
          <Text style={font.small}>ค้นหาร้านค้า, ประเภท, หรือแบรนด์</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
        >
          {FILTERS.map(f => {
            const on = f === filter;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.pill, on && styles.pillOn]}
              >
                <Text style={[font.small, on && styles.pillTextOn]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.map}>
        <View style={[styles.road, styles.roadH]} />
        <View style={[styles.road, styles.roadV]} />
        <View style={styles.me} accessibilityLabel="ตำแหน่งของคุณ" />
        {stores.map(s => (
          <Pressable
            key={s.id}
            onPress={() => setSelectedId(s.id)}
            accessibilityRole="button"
            accessibilityLabel={s.name}
            hitSlop={8}
            style={[
              styles.pin,
              { left: `${s.x * 100}%`, top: `${s.y * 100}%` },
            ]}
          >
            <Text style={styles.pinText}>
              {s.id === selectedId ? '📍' : '🟢'}
            </Text>
          </Pressable>
        ))}
      </View>

      {selected && (
        <View style={styles.sheet}>
          <View style={styles.sheetRow}>
            <View style={styles.thumb}>
              <Text style={styles.pinText}>🏪</Text>
            </View>
            <View style={styles.flex}>
              <Text style={font.h2}>{selected.name}</Text>
              <Text style={font.small}>
                📍 {selected.km} km ⭐ {selected.rating}
              </Text>
              {selected.hasCoupon && <Text style={styles.badge}>มีคูปอง</Text>}
            </View>
            <Pressable
              onPress={() => setSelectedId(null)}
              accessibilityRole="button"
              accessibilityLabel="ปิด"
              hitSlop={8}
            >
              <Text style={font.h2}>✕</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => onOpenStore(selected.id)}
            accessibilityRole="button"
            style={styles.btn}
          >
            <Text style={styles.btnText}>ดูรายละเอียด</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { padding: space.lg, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
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
  map: { flex: 1, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  road: { position: 'absolute', backgroundColor: colors.surface },
  roadH: { left: 0, right: 0, top: '45%', height: 14 },
  roadV: { top: 0, bottom: 0, left: '40%', width: 14 },
  me: {
    position: 'absolute',
    left: '45%',
    top: '48%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  pin: { position: 'absolute' },
  pinText: { fontSize: 24 },
  sheet: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    padding: space.md,
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderColor: colors.border,
    borderWidth: 1,
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: space.xs },
  badge: {
    ...font.small,
    alignSelf: 'flex-start',
    color: colors.primary,
    fontWeight: '700',
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
