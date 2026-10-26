import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { stores } from '../data/mock';
import { colors, font, radius, space } from '../theme';

type Props = {
  storeId: string;
  onBack: () => void;
  onGo: () => void;
};

const TABS = ['คูปอง', 'รีวิว', 'ข้อมูลร้าน'];

export default function StoreDetailScreen({ storeId, onBack, onGo }: Props) {
  const { merchants, coupons, user, exchangeDistanceForCoupon } = useAppContext();
  const [tab, setTab] = useState(TABS[0]);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const merchant = merchants.find((m) => m.merchantId === storeId);
  const fallbackStore = stores.find((s) => s.id === storeId) ?? stores[0];

  const storeName = merchant?.merchantName ?? fallbackStore.name;
  const storeCategory = merchant?.category ?? fallbackStore.tags;
  const promo = merchant?.promotion ?? {
    title: 'ส่วนลดพิเศษ 20 บาท',
    description: 'เดินสะสมระยะทางครบ 2.0 km เพื่อแลกรับสิทธิ์',
    requiredDistanceKm: 2.0,
  };

  const hasUnlockedCoupon = coupons.some(
    (c) => c.merchantId === (merchant?.merchantId ?? storeId) && c.status === 'unlocked',
  );

  const handleExchange = () => {
    if (!merchant) {
      Alert.alert('แจ้งเตือน', 'ไม่พบข้อมูลร้านค้านี้ในระบบ');
      return;
    }
    const result = exchangeDistanceForCoupon(merchant.merchantId);
    if (result.ok) {
      setClaimMsg('🎉 แลกคูปองสำเร็จ! คูปองอยู่ในกระเป๋า My Coupons แล้ว');
    } else {
      setClaimMsg(`⚠️ ${result.reason}`);
    }
  };

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
          <Text style={font.title}>{storeName}</Text>
          <Text style={font.small}>
            ⭐ 4.8 (120 รีวิว) 📍 0.8 km • {storeCategory}
          </Text>
          <Text style={font.body}>🕒 เปิดบริการ 10:00 - 21:00</Text>
          <Text style={font.body}>📍 ย่านบรรทัดทอง - สามย่าน กรุงเทพฯ</Text>
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceText}>
              👛 ระยะสะสมสำหรับแลก: {user.redeemableDistanceKm.toFixed(1)} km
            </Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {TABS.map((t) => {
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
          <View style={styles.dealContainer}>
            {claimMsg && (
              <View style={styles.msgBanner}>
                <Text style={styles.msgText}>{claimMsg}</Text>
              </View>
            )}

            <View style={styles.coupon}>
              <View style={styles.thumb}>
                <Text style={styles.thumbIcon}>🎟️</Text>
              </View>
              <View style={styles.flex}>
                <Text style={font.h2}>{promo.title}</Text>
                <Text style={font.small}>{promo.description}</Text>
                <Text style={styles.reqDist}>
                  🏃 ต้องใช้ระยะทาง: {promo.requiredDistanceKm.toFixed(1)} km
                </Text>
              </View>
              <Pressable
                onPress={handleExchange}
                disabled={hasUnlockedCoupon}
                accessibilityRole="button"
                style={[styles.claim, hasUnlockedCoupon && styles.claimDone]}
              >
                <Text style={styles.claimText}>
                  {hasUnlockedCoupon ? 'มีในกระเป๋าแล้ว' : 'แลกสิทธิ์'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : tab === 'ข้อมูลร้าน' ? (
          <View style={styles.infoCard}>
            <Text style={font.h2}>สถิติร้านค้า (Merchant Metrics)</Text>
            <Text style={font.body}>
              🚶 จำนวนคนเดินมาเยือน: {merchant?.metrics.walkIns ?? 12} ครั้ง
            </Text>
            <Text style={font.body}>
              🎟️ จำนวนการแลกใช้คูปอง: {merchant?.metrics.redeemed ?? 8} ใบ
            </Text>
            <Text style={font.small}>
              *ข้อมูลจำลองแบบ Client-Side สำหรับ Hackathon Demo
            </Text>
          </View>
        ) : (
          <Text style={[font.small, styles.empty]}>
            ยังไม่มีรีวิวสำหรับร้านนี้ เป็นคนแรกที่รีวิวเลย!
          </Text>
        )}
      </ScrollView>

      <Pressable onPress={onGo} accessibilityRole="button" style={styles.go}>
        <Text style={styles.goText}>ไปที่แผนที่</Text>
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
  balanceBadge: {
    marginTop: space.sm,
    padding: space.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
  },
  balanceText: { ...font.small, color: colors.primaryDark, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: space.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: space.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  tabOn: { backgroundColor: colors.surface },
  tabTextOn: { fontWeight: '700', color: colors.text },
  dealContainer: { gap: space.md, paddingHorizontal: space.lg },
  msgBanner: {
    padding: space.sm,
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  msgText: { ...font.small, color: colors.text },
  coupon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 24 },
  flex: { flex: 1, gap: space.xs },
  reqDist: { ...font.small, color: colors.primary, fontWeight: '700' },
  claim: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  claimDone: { backgroundColor: colors.locked },
  claimText: { ...font.small, color: colors.onPrimary, fontWeight: '700' },
  infoCard: {
    marginHorizontal: space.lg,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    gap: space.sm,
  },
  empty: { textAlign: 'center', marginTop: space.xl },
  go: {
    position: 'absolute',
    bottom: space.lg,
    left: space.lg,
    right: space.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  goText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
