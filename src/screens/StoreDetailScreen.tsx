import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { storeCoupons, stores } from '../data/mock';
import { colors, font, radius, space } from '../theme';

type Props = {
  storeId: string;
  onBack: () => void;
  onGo: () => void;
};

const TABS = ['คูปอง', 'รีวิว', 'ข้อมูลร้าน'];

export default function StoreDetailScreen({ storeId, onBack, onGo }: Props) {
  const [tab, setTab] = useState(TABS[0]);
  const [claimed, setClaimed] = useState<string[]>([]);
  const store = stores.find(s => s.id === storeId) ?? stores[0];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>🏪</Text>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับ"
            hitSlop={8}
            style={styles.back}
          >
            <Text style={font.h2}>‹</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={font.title}>{store.name}</Text>
          <Text style={font.small}>
            ⭐ {store.rating} ({store.reviews} รีวิว) 📍 {store.km} km
          </Text>
          <Text style={font.small}>{store.tags}</Text>
          <Text style={font.body}>🕒 {store.hours}</Text>
          <Text style={font.body}>📍 {store.address}</Text>
        </View>

        <View style={styles.tabs}>
          {TABS.map(t => {
            const on = t === tab;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[styles.tab, on && styles.tabOn]}
              >
                <Text style={[font.body, on && styles.tabTextOn]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'คูปอง' ? (
          storeCoupons.map(c => {
            const got = claimed.includes(c.id);
            return (
              <View key={c.id} style={styles.coupon}>
                <View style={styles.thumb}>
                  <Text style={styles.thumbIcon}>🎟️</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={font.h2}>{c.title}</Text>
                  <Text style={font.small}>{c.cond}</Text>
                  <Text style={font.small}>{c.expires}</Text>
                </View>
                <Pressable
                  onPress={() => setClaimed(prev => [...prev, c.id])}
                  disabled={got}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: got }}
                  style={[styles.claim, got && styles.claimDone]}
                >
                  <Text style={styles.claimText}>
                    {got ? 'รับแล้ว' : 'รับคูปอง'}
                  </Text>
                </Pressable>
              </View>
            );
          })
        ) : (
          <Text style={[font.small, styles.empty]}>ยังไม่มีข้อมูล</Text>
        )}
      </ScrollView>

      <Pressable onPress={onGo} accessibilityRole="button" style={styles.go}>
        <Text style={styles.goText}>ไปเลย</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { gap: space.md, paddingBottom: 96 },
  banner: {
    height: 180,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon: { fontSize: 64 },
  back: {
    position: 'absolute',
    top: space.lg,
    left: space.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: space.lg,
    marginTop: -space.xl,
    padding: space.lg,
    gap: space.xs,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: space.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: space.sm },
  tabOn: { borderBottomWidth: 3, borderColor: colors.primary },
  tabTextOn: { color: colors.primary, fontWeight: '700' },
  coupon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    padding: space.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 24 },
  flex: { flex: 1, gap: 2 },
  claim: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  claimDone: { backgroundColor: colors.locked },
  claimText: { fontSize: 13, fontWeight: '700', color: colors.onPrimary },
  empty: { textAlign: 'center', marginTop: space.lg },
  go: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  goText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
