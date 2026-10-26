import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomTabBar, { TabName } from '../components/BottomTabBar';
import { AmazonLogo, InthaninLogo, SevenElevenLogo } from '../components/BrandLogos';
import { useAppContext } from '../context/AppContext';
import type { Coupon } from '../services/mockData';
import { radius } from '../theme';

type Props = {
  onBack: () => void;
  onTabPress?: (tab: TabName) => void;
  onStorePress?: (storeId: string) => void;
};

type Filter = 'all' | 'usable' | 'used';

const FILTERS: { label: string; key: Filter }[] = [
  { label: 'ทั้งหมด', key: 'all' },
  { label: 'พร้อมใช้', key: 'usable' },
  { label: 'ใช้แล้ว', key: 'used' },
];

interface DisplayCouponItem {
  id: string;
  brand: 'amazon' | '7eleven' | 'inthanin';
  title: string;
  storeName: string;
  expiry: string;
  status: 'usable' | 'used' | 'locked';
  requiredKm?: number;
  currentKm?: number;
  couponRef?: Coupon;
}

export default function MyCouponsScreen({ onBack, onTabPress, onStorePress }: Props) {
  const { coupons, redeemMockCoupon, warpToMerchant } = useAppContext();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedCoupon, setSelectedCoupon] = useState<DisplayCouponItem | null>(null);

  // Reference coupon list matching the exact mockup
  const baseCoupons: DisplayCouponItem[] = [
    {
      id: 'cp_amazon_20',
      brand: 'amazon',
      title: 'ส่วนลด 20%',
      storeName: 'Cafe Amazon',
      expiry: 'ใช้ได้ถึง 30 ก.ย. 2568',
      status: 'usable',
      couponRef: coupons[0],
    },
    {
      id: 'cp_7eleven_tea',
      brand: '7eleven',
      title: 'ฟรีเมนูชานม',
      storeName: '7-Eleven',
      expiry: 'ใช้ได้ถึง 25 ก.ย. 2568',
      status: 'usable',
      couponRef: coupons[1],
    },
    {
      id: 'cp_inthanin_15',
      brand: 'inthanin',
      title: 'ส่วนลด 15%',
      storeName: 'Inthanin',
      expiry: 'ใช้ได้ถึง 20 ก.ย. 2568',
      status: 'usable',
      couponRef: coupons[2],
    },
  ];

  // Filter items
  const filteredCoupons = baseCoupons.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'usable') return c.status === 'usable';
    if (filter === 'used') return c.status === 'used';
    return true;
  });

  const showLocked = filter === 'all' || filter === 'usable';
  const lockedProgressKm = 12;
  const lockedTotalKm = 50;
  const lockedPct = Math.min(1, lockedProgressKm / lockedTotalKm);

  const handleRedeem = (item: DisplayCouponItem) => {
    if (item.couponRef) {
      const res = redeemMockCoupon(item.couponRef.couponId);
      if (!res.ok) {
        Alert.alert('ใช้คูปองไม่สำเร็จ', res.reason, [
          {
            text: 'จำลองเดินเข้าใกล้ร้าน (Demo)',
            onPress: () => {
              if (item.couponRef) warpToMerchant(item.couponRef.merchantId);
              Alert.alert('สำเร็จ', 'จำลองพิกัดเข้าใกล้ร้านค้าเรียบร้อยแล้ว');
            },
          },
          { text: 'ตกลง' },
        ]);
        return;
      }
    }
    Alert.alert('สำเร็จ', 'ใช้คูปองเรียบร้อยแล้ว Enjoy your treat! 🎉');
    setSelectedCoupon(null);
  };

  const renderBrandLogo = (brand: 'amazon' | '7eleven' | 'inthanin', size = 52) => {
    if (brand === 'amazon') return <AmazonLogo size={size} />;
    if (brand === '7eleven') return <SevenElevenLogo size={size} />;
    return <InthaninLogo size={size} />;
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>คูปองของฉัน</Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.pillsRow}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
            >
              <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Main List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredCoupons.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (onStorePress && item.brand === 'amazon') {
                onStorePress('s1');
              } else {
                setSelectedCoupon(item);
              }
            }}
            style={({ pressed }) => [styles.couponCard, pressed && styles.cardPressed]}
          >
            {/* Left Brand Logo */}
            <View style={styles.logoWrap}>{renderBrandLogo(item.brand, 56)}</View>

            {/* Middle Info */}
            <View style={styles.cardCenter}>
              <Text style={styles.couponTitle}>{item.title}</Text>
              <Text style={styles.storeName}>{item.storeName}</Text>
              <Text style={styles.expiryText}>{item.expiry}</Text>
            </View>

            {/* Right Badge & Details Link */}
            <View style={styles.cardRight}>
              <View style={styles.usableBadge}>
                <Text style={styles.usableBadgeText}>ใช้ได้</Text>
              </View>
              <Pressable
                onPress={() => setSelectedCoupon(item)}
                hitSlop={8}
                style={styles.detailsLinkWrap}
              >
                <Text style={styles.detailsLinkText}>ดูรายละเอียด ›</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}

        {/* Locked Coupon Card */}
        {showLocked && (
          <View style={styles.lockedCard}>
            <View style={styles.lockedTopRow}>
              {/* Lock Icon */}
              <View style={styles.lockIconBox}>
                <Text style={styles.lockEmoji}>🔒</Text>
              </View>

              {/* Title & Progress */}
              <View style={styles.lockedCenter}>
                <Text style={styles.couponTitle}>ส่วนลด 50%</Text>
                <Text style={styles.storeName}>เมื่อเดินครบ 50 km</Text>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${lockedPct * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {lockedProgressKm} / {lockedTotalKm} km
                  </Text>
                </View>
              </View>
            </View>

            {/* Encouragement Banner */}
            <View style={styles.encouragementPill}>
              <Text style={styles.encouragementIcon}>🐾</Text>
              <Text style={styles.encouragementText}>อีกนิดเดียวก็ได้แล้ว สู้ๆ !</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal Detail & Barcode */}
      <Modal
        visible={!!selectedCoupon}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCoupon(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedCoupon && (
              <>
                <View style={styles.modalHeader}>
                  {renderBrandLogo(selectedCoupon.brand, 44)}
                  <View style={styles.modalTitleBox}>
                    <Text style={styles.modalTitle}>{selectedCoupon.title}</Text>
                    <Text style={styles.modalSubtitle}>{selectedCoupon.storeName}</Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedCoupon(null)}
                    hitSlop={10}
                    style={styles.modalCloseBtn}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.barcodeBox}>
                  <Text style={styles.barcodeLines}>|||| | ||||| || |||| ||||| ||</Text>
                  <Text style={styles.barcodeCode}>CW-AMZ-2026-8921</Text>
                  <Text style={styles.barcodeInstruction}>
                    ยื่นรหัสนี้ให้พนักงานหน้าร้านเพื่อรับสิทธิ์
                  </Text>
                </View>

                <View style={styles.modalConditions}>
                  <Text style={styles.condHeader}>เงื่อนไขการใช้งาน</Text>
                  <Text style={styles.condItem}>• {selectedCoupon.expiry}</Text>
                  <Text style={styles.condItem}>• 1 สิทธิ์ ต่อ 1 ใบเสร็จ</Text>
                  <Text style={styles.condItem}>• ไม่สามารถแลกเปลี่ยนเป็นเงินสดได้</Text>
                </View>

                <Pressable
                  onPress={() => handleRedeem(selectedCoupon)}
                  style={styles.redeemButton}
                >
                  <Text style={styles.redeemButtonText}>กดใช้คูปองนี้ (หน้าร้าน)</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Reusable Bottom Navigation Bar */}
      <BottomTabBar activeTab="Home" onTabPress={onTabPress ?? (() => onBack())} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    paddingRight: 14,
    paddingVertical: 4,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '700',
    color: '#262A22',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#262A22',
    letterSpacing: -0.3,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  pillActive: {
    backgroundColor: '#55684B',
  },
  pillInactive: {
    backgroundColor: '#EFEAE0',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: '#70756B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 90,
    gap: 14,
  },
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE9DE',
    elevation: 3,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  logoWrap: {
    marginRight: 14,
  },
  cardCenter: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#70756B',
  },
  expiryText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#959B90',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 56,
  },
  usableBadge: {
    backgroundColor: '#E2EFE0',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: radius.pill,
  },
  usableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4E784E',
  },
  detailsLinkWrap: {
    paddingVertical: 2,
  },
  detailsLinkText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#70756B',
  },
  lockedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE9DE',
    elevation: 2,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    gap: 14,
  },
  lockedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#EAE4D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  lockEmoji: {
    fontSize: 26,
  },
  lockedCenter: {
    flex: 1,
    gap: 3,
  },
  progressContainer: {
    marginTop: 6,
    gap: 4,
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#EFEAE0',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#55684B',
    borderRadius: radius.pill,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8F85',
    textAlign: 'right',
  },
  encouragementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EFE4',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    gap: 6,
  },
  encouragementIcon: {
    fontSize: 13,
  },
  encouragementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#55684B',
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(38,42,34,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262A22',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#70756B',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#8A8F85',
  },
  barcodeBox: {
    backgroundColor: '#FAF7EE',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  barcodeLines: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#262A22',
  },
  barcodeCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#55684B',
    letterSpacing: 1,
  },
  barcodeInstruction: {
    fontSize: 11,
    color: '#70756B',
    textAlign: 'center',
  },
  modalConditions: {
    gap: 4,
  },
  condHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#262A22',
    marginBottom: 2,
  },
  condItem: {
    fontSize: 12,
    color: '#70756B',
  },
  redeemButton: {
    backgroundColor: '#55684B',
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  redeemButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
