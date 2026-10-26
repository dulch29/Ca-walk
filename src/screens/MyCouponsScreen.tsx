import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import type { Coupon } from '../services/mockData';
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
  const { coupons, user, merchants, redeemMockCoupon, warpToMerchant } =
    useAppContext();
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const list = coupons.filter((c) => {
    if (filter === 'all') {
      return true;
    }
    if (filter === 'usable') {
      return c.status === 'unlocked';
    }
    if (filter === 'used') {
      return c.status === 'redeemed';
    }
    return true;
  });

  const lockedMerchants =
    filter === 'all'
      ? merchants.filter(
          (m) =>
            m.promotion.requiredDistanceKm > user.redeemableDistanceKm &&
            !coupons.some(
              (c) => c.merchantId === m.merchantId && c.status === 'unlocked',
            ),
        )
      : [];

  const handleRedeem = (coupon: Coupon) => {
    setRedeemError(null);
    const result = redeemMockCoupon(coupon.couponId);
    if (!result.ok) {
      setRedeemError(result.reason);
      Alert.alert('ใช้คูปองไม่สำเร็จ', result.reason, [
        {
          text: 'จำลองเดินเข้าใกล้ร้าน (Demo)',
          onPress: () => {
            warpToMerchant(coupon.merchantId);
            Alert.alert(
              'จำลองตำแหน่งสำเร็จ',
              'จำลองพิกัดเข้าใกล้ร้านค้าเรียบร้อยแล้ว กด "ใช้คูปองนี้" อีกครั้งได้เลย',
            );
          },
        },
        { text: 'ตกลง' },
      ]);
    }
  };

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

      <View style={styles.balanceInfo}>
        <Text style={font.small}>
          👛 ระยะสะสมสำหรับแลก: {user.redeemableDistanceKm.toFixed(1)} km
        </Text>
      </View>

      <View style={styles.pills}>
        {FILTERS.map((f) => {
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

      {redeemError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {redeemError}</Text>
        </View>
      )}

      {list.length === 0 && lockedMerchants.length === 0 && (
        <Text style={[font.small, styles.empty]}>ยังไม่มีคูปองในหมวดนี้</Text>
      )}

      {list.map((c) => (
        <CouponCard
          key={c.couponId}
          coupon={c}
          open={openId === c.couponId}
          onToggle={() => setOpenId(openId === c.couponId ? null : c.couponId)}
          onRedeem={() => handleRedeem(c)}
        />
      ))}

      {lockedMerchants.map((m) => {
        const goal = m.promotion.requiredDistanceKm;
        const pct = Math.min(1, user.redeemableDistanceKm / goal);
        return (
          <View key={m.merchantId} style={[styles.card, styles.lockedCard]}>
            <View style={styles.row}>
              <View style={styles.thumb}>
                <Text style={styles.thumbIcon}>🔒</Text>
              </View>
              <View style={styles.flex}>
                <Text style={font.h2}>{m.promotion.title}</Text>
                <Text style={font.small}>📍 {m.merchantName}</Text>
                <Text style={font.small}>
                  สะสม {user.redeemableDistanceKm.toFixed(1)} / {goal.toFixed(1)} km
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
  onRedeem,
}: {
  coupon: Coupon;
  open: boolean;
  onToggle: () => void;
  onRedeem: () => void;
}) {
  const usable = coupon.status === 'unlocked';
  const expiresDate = new Date(coupon.expiresAt).toLocaleDateString('th-TH');

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.thumb}>
          <Text style={styles.thumbIcon}>🎟️</Text>
        </View>
        <View style={styles.flex}>
          <Text style={font.h2}>{coupon.dealTitle}</Text>
          <Text style={font.body}>📍 {coupon.merchantName}</Text>
          <Text style={font.small}>ใช้ได้ถึง {expiresDate}</Text>
        </View>
        <Text style={[styles.tag, !usable && styles.tagOff]}>
          {usable ? 'พร้อมใช้' : 'ใช้แล้ว'}
        </Text>
      </View>

      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.more}
      >
        <Text style={styles.moreText}>
          {open ? 'ซ่อนรายละเอียด ˄' : 'ดูรหัสคูปอง ›'}
        </Text>
      </Pressable>

      {open && (
        <View style={styles.details}>
          <Text style={font.small}>
            แสดงรหัสนี้แก่พนักงานหน้าร้าน {coupon.merchantName} (ใช้ได้ 1 ครั้ง)
          </Text>
          <View style={styles.tokenBox}>
            <Text style={styles.tokenText}>{coupon.oneTimeToken}</Text>
          </View>
          {usable && (
            <Pressable
              onPress={onRedeem}
              accessibilityRole="button"
              style={styles.redeemBtn}
            >
              <Text style={styles.redeemBtnText}>กดใช้คูปองนี้ (หน้าร้าน)</Text>
            </Pressable>
          )}
          {coupon.status === 'redeemed' && coupon.redeemedAt && (
            <Text style={[font.small, styles.redeemedAt]}>
              ✅ ใช้เมื่อ {new Date(coupon.redeemedAt).toLocaleString('th-TH')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  balanceInfo: {
    backgroundColor: colors.surface,
    padding: space.sm,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
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
  errorBanner: {
    padding: space.sm,
    backgroundColor: '#FEE2E2',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  errorText: { ...font.small, color: colors.danger },
  empty: { textAlign: 'center', marginTop: space.xl },
  card: {
    padding: space.md,
    gap: space.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  lockedCard: { backgroundColor: colors.surfaceMuted, opacity: 0.9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 24 },
  flex: { flex: 1, gap: 2 },
  tag: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  tagOff: { backgroundColor: colors.surfaceMuted, color: colors.textMuted },
  more: { paddingTop: space.xs },
  moreText: { ...font.small, color: colors.primary, fontWeight: '700' },
  details: {
    paddingTop: space.sm,
    gap: space.sm,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  tokenBox: {
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tokenText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.text,
  },
  redeemBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  redeemBtnText: { color: colors.onPrimary, fontWeight: '700' },
  redeemedAt: { textAlign: 'center', color: colors.primaryDark },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary },
  cheer: { ...font.small, color: colors.primaryDark, fontStyle: 'italic' },
});
