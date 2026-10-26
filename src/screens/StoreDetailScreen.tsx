import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AmazonLogo } from '../components/BrandLogos';
import { radius } from '../theme';

type Props = {
  storeId?: string;
  onBack: () => void;
  onGo: () => void;
};

const STORE_IMAGE = require('../../Assests/Images/store_amazon.jpg');

const TABS = ['คูปอง', 'รีวิว', 'ข้อมูลร้าน'];

interface StoreCoupon {
  id: string;
  title: string;
  detail: string;
  expiry: string;
  claimed?: boolean;
}

const DEFAULT_COUPONS: StoreCoupon[] = [
  {
    id: 'sc_1',
    title: 'ส่วนลดเครื่องดื่ม 20%',
    detail: 'เมื่อสั่งเมนูเครื่องดื่ม (ขั้นต่ำ 1 แก้ว)',
    expiry: 'ใช้ได้ถึง 30 ก.ย. 2568',
  },
  {
    id: 'sc_2',
    title: 'ส่วนลดเครื่องดื่ม 20%',
    detail: 'เมื่อสั่งเมนูเครื่องดื่ม (ขั้นต่ำ 1 แก้ว)',
    expiry: 'ใช้ได้ถึง 30 ก.ย. 2568',
  },
];

export default function StoreDetailScreen({ onBack, onGo }: Props) {
  const [tab, setTab] = useState(TABS[0]);
  const [coupons, setCoupons] = useState<StoreCoupon[]>(DEFAULT_COUPONS);

  const handleClaim = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, claimed: true } : c)),
    );
    Alert.alert(
      'รับคูปองสำเร็จ! 🎉',
      'คูปองถูกเพิ่มเข้าไปใน "คูปองของฉัน" เรียบร้อยแล้ว',
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Photo Banner */}
        <View style={styles.heroContainer}>
          <Image source={STORE_IMAGE} style={styles.heroImage} resizeMode="cover" />
          {/* Circular Back Button */}
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับ"
            hitSlop={10}
            style={styles.backCircleBtn}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        </View>

        {/* Store Info Overlay Card */}
        <View style={styles.storeCard}>
          {/* Header Row */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.storeTitle}>Cafe Amazon</Text>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="ปิด"
              hitSlop={10}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Rating & Distance */}
          <View style={styles.metaRow}>
            <Text style={styles.ratingText}>⭐ 4.5</Text>
            <Text style={styles.reviewsText}>(1.2k รีวิว)</Text>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.distanceText}>📍 1.2 km</Text>
          </View>

          {/* Tags */}
          <Text style={styles.tagsText}>☕ กาแฟ · เครื่องดื่ม · ขนม</Text>

          {/* Thai Description */}
          <Text style={styles.descriptionText}>
            สัมผัสรสชาติกาแฟสดแท้จากธรรมชาติ พร้อมเสิร์ฟความสดชื่นด้วยเครื่องดื่มหลากหลายเมนู ทั้งกาแฟ ชาเขียว และเบเกอรี่สดใหม่ทุกวัน
          </Text>

          {/* Hours & Address */}
          <View style={styles.detailsGroup}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>🕒</Text>
              <Text style={styles.detailText}>เปิด 06:00 - 22:00</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>125 ถนนสุขุมวิท กรุงเทพฯ</Text>
            </View>
          </View>

          {/* Sub-tabs Row */}
          <View style={styles.tabsContainer}>
            {TABS.map((t) => {
              const active = t === tab;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Tab Content: คูปอง */}
          {tab === 'คูปอง' && (
            <View style={styles.couponsList}>
              {coupons.map((c) => (
                <View key={c.id} style={styles.couponCard}>
                  {/* Brand Logo */}
                  <View style={styles.couponLogoBox}>
                    <AmazonLogo size={52} />
                  </View>

                  {/* Middle Info */}
                  <View style={styles.couponCenter}>
                    <Text style={styles.couponTitle}>{c.title}</Text>
                    <Text style={styles.couponDetail}>{c.detail}</Text>
                    <Text style={styles.couponExpiry}>{c.expiry}</Text>
                  </View>

                  {/* Claim Button */}
                  <Pressable
                    onPress={() => handleClaim(c.id)}
                    disabled={c.claimed}
                    style={({ pressed }) => [
                      styles.claimBtn,
                      c.claimed && styles.claimBtnClaimed,
                      pressed && !c.claimed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.claimBtnText}>
                      {c.claimed ? 'รับแล้ว' : 'รับคูปอง'}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Tab Content: รีวิว */}
          {tab === 'รีวิว' && (
            <View style={styles.placeholderTab}>
              <Text style={styles.placeholderText}>
                🌟 4.5 ดาว จากลูกค้ารวม 1,248 คน
              </Text>
              <Text style={styles.reviewSnippet}>
                "กาแฟรสชาติเข้มข้น พนักงานบริการดี บรรยากาศร่มรื่น เหมาะแก่การนั่งพักผ่อน"
              </Text>
            </View>
          )}

          {/* Tab Content: ข้อมูลร้าน */}
          {tab === 'ข้อมูลร้าน' && (
            <View style={styles.placeholderTab}>
              <Text style={styles.placeholderText}>ข้อมูลร้านค้าเพิ่มเติม</Text>
              <Text style={styles.reviewSnippet}>
                มีที่จอดรถหน้าร้าน รองรับ Wi-Fi ฟรี และรับชำระผ่าน Ca-walk Wallet, PromptPay, และบัตรเครดิต
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Bottom CTA Button */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={onGo}
          accessibilityRole="button"
          accessibilityLabel="ไปเลย"
          style={({ pressed }) => [styles.goButton, pressed && styles.btnPressed]}
        >
          <Text style={styles.goButtonText}>ไปเลย</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7EE',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  heroContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backCircleBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#262A22',
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
    elevation: 4,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.4,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: '#A0A59B',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C78923',
  },
  reviewsText: {
    fontSize: 13,
    color: '#70756B',
  },
  dotSeparator: {
    fontSize: 14,
    color: '#8A8F85',
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#55684B',
  },
  tagsText: {
    fontSize: 13,
    color: '#70756B',
    marginTop: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: '#54594E',
    lineHeight: 20,
    marginTop: 12,
  },
  detailsGroup: {
    marginTop: 14,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 13,
    color: '#4E5348',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7EE',
    borderRadius: radius.pill,
    padding: 4,
    marginTop: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A8F85',
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#262A22',
  },
  couponsList: {
    marginTop: 16,
    gap: 12,
  },
  couponCard: {
    backgroundColor: '#FAF7EE',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE4D8',
  },
  couponLogoBox: {
    marginRight: 10,
  },
  couponCenter: {
    flex: 1,
    gap: 2,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  couponDetail: {
    fontSize: 11,
    color: '#70756B',
  },
  couponExpiry: {
    fontSize: 10,
    color: '#959B90',
    marginTop: 1,
  },
  claimBtn: {
    backgroundColor: '#55684B',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnClaimed: {
    backgroundColor: '#A0A59B',
  },
  claimBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  placeholderTab: {
    marginTop: 18,
    padding: 16,
    backgroundColor: '#FAF7EE',
    borderRadius: 16,
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262A22',
  },
  reviewSnippet: {
    fontSize: 13,
    color: '#70756B',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 40,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF7EE',
    borderTopWidth: 1.2,
    borderTopColor: '#ECE4D8',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
    elevation: 10,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  goButton: {
    backgroundColor: '#55684B',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#55684B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  goButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
