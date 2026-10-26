import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { couponHistory, CouponHistory } from '../data/meMock';

type Props = {
  onBack: () => void;
};

type Filter = 'all' | CouponHistory['status'];

const FILTERS: { label: string; key: Filter }[] = [
  { label: 'ทั้งหมด', key: 'all' },
  { label: 'แลกแล้ว', key: 'used' },
  { label: 'หมดอายุ', key: 'expired' },
];

function BackArrow() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2.2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

// Crisp Merchant Logos Matching the Reference
function MerchantLogo({ store }: { store: string }) {
  if (store.includes('Amazon')) {
    return (
      <View style={[styles.logoBase, styles.logoAmazon]}>
        <Svg width={32} height={32} viewBox="0 0 32 32">
          {/* Coffee cup with leaf */}
          <Path
            d="M8 12h12v7a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5v-7z"
            fill="#D4AF37"
          />
          <Path
            d="M20 14h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2v-5z"
            fill="none"
            stroke="#D4AF37"
            strokeWidth={1.5}
          />
          {/* Leaves overhead */}
          <Path
            d="M14 7 Q 16 11 19 8 Q 16 6 14 7 Z"
            fill="#7CA352"
          />
          <Path
            d="M10 8 Q 13 11 11 13 Q 9 10 10 8 Z"
            fill="#9FC076"
          />
        </Svg>
      </View>
    );
  }

  if (store.includes('7-Eleven')) {
    return (
      <View style={[styles.logoBase, styles.logoSevenEleven]}>
        <Svg width={30} height={30} viewBox="0 0 32 32">
          <Rect x="4" y="6" width="24" height="6" fill="#EE2724" />
          <Rect x="4" y="12" width="24" height="6" fill="#008139" />
          <Rect x="4" y="18" width="24" height="6" fill="#F89D21" />
          <Path
            d="M11 9h10l-6 13h-4l5-9h-5z"
            fill="#FFFFFF"
          />
        </Svg>
      </View>
    );
  }

  if (store.includes('KFC')) {
    return (
      <View style={[styles.logoBase, styles.logoKfc]}>
        <Svg width={32} height={32} viewBox="0 0 32 32">
          <Circle cx="16" cy="14" r="6" fill="#FAF7EE" />
          <Path
            d="M10 24h12l-2 5H12z"
            fill="#FAF7EE"
          />
          <Text style={styles.kfcText}>
            KFC
          </Text>
        </Svg>
      </View>
    );
  }

  if (store.includes("McDonald")) {
    return (
      <View style={[styles.logoBase, styles.logoMcdonald]}>
        <Svg width={30} height={30} viewBox="0 0 32 32">
          {/* Golden Arches */}
          <Path
            d="M8 24V14a4 4 0 0 1 8 0v10M16 24V14a4 4 0 0 1 8 0v10"
            fill="none"
            stroke="#FFC72C"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  // Boots or fallback
  return (
    <View style={[styles.logoBase, styles.logoBoots]}>
      <Text style={styles.bootsText}>Boots</Text>
    </View>
  );
}

export default function CouponHistoryScreen({ onBack }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const filteredList = couponHistory.filter(
    c => filter === 'all' || c.status === filter,
  );

  return (
    <View style={styles.root}>
      {/* Top Header: ← ประวัติการแลกคูปอง */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          hitSlop={12}
          style={styles.backBtn}
        >
          <BackArrow />
        </Pressable>
        <Text style={styles.headerTitle}>ประวัติการแลกคูปอง</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => {
            const isSelected = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected && styles.filterTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Empty state */}
        {filteredList.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>ยังไม่มีประวัติในหมวดนี้</Text>
          </View>
        )}

        {/* Coupon Cards */}
        {filteredList.map(item => {
          const isUsed = item.status === 'used';
          return (
            <View key={item.id} style={styles.couponCard}>
              <MerchantLogo store={item.store} />

              <View style={styles.cardInfo}>
                <Text style={styles.storeName}>{item.store}</Text>
                <Text style={styles.promoTitle}>{item.title}</Text>
                <Text style={styles.promoDate}>{item.date}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isUsed ? styles.badgeUsed : styles.badgeExpired,
                ]}
              >
                <Text style={styles.badgeText}>
                  {isUsed ? 'ใช้แล้ว' : 'หมดอายุ'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE4D6',
  },
  filterPillActive: {
    backgroundColor: '#55684B',
    borderColor: '#55684B',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#525F4C',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE4D6',
    padding: 14,
    gap: 14,
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  logoBase: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoAmazon: {
    backgroundColor: '#1E452B',
  },
  logoSevenEleven: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE6DA',
  },
  logoKfc: {
    backgroundColor: '#C8102E',
  },
  kfcText: {
    position: 'absolute',
    bottom: 2,
    fontSize: 8,
    fontWeight: '900',
    color: '#FAF7EE',
  },
  logoMcdonald: {
    backgroundColor: '#DA291C',
  },
  logoBoots: {
    backgroundColor: '#0B3B70',
  },
  bootsText: {
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FAF7EE',
    letterSpacing: -0.5,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#55684B',
  },
  promoDate: {
    fontSize: 12,
    color: '#8C9486',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeUsed: {
    backgroundColor: '#55684B',
  },
  badgeExpired: {
    backgroundColor: '#E56353',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#8C9486',
    fontWeight: '600',
  },
});
