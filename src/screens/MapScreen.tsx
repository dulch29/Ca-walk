import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { radius } from '../theme';

type Props = {
  onBack: () => void;
  onOpenStore: (storeId: string) => void;
};

const STORE_AMAZON_IMG = require('../../Assests/Images/store_amazon.jpg');

const FILTERS = ['ใกล้ฉัน', 'ส่วนลด', 'อาหาร & เครื่องดื่ม'];

interface StoreMarker {
  id: string;
  name: string;
  distance: string;
  rating: number;
  hasCoupon: boolean;
  xPct: number; // 0 to 100
  yPct: number; // 0 to 100
}

const STORE_MARKERS: StoreMarker[] = [
  {
    id: 's1',
    name: 'Cafe Amazon',
    distance: '1.2 km',
    rating: 4.5,
    hasCoupon: true,
    xPct: 52,
    yPct: 28,
  },
  {
    id: 's2',
    name: '7-Eleven',
    distance: '0.8 km',
    rating: 4.2,
    hasCoupon: true,
    xPct: 46,
    yPct: 36,
  },
  {
    id: 's3',
    name: 'Inthanin Coffee',
    distance: '1.5 km',
    rating: 4.6,
    hasCoupon: false,
    xPct: 60,
    yPct: 35,
  },
  {
    id: 's4',
    name: 'KFC',
    distance: '2.1 km',
    rating: 4.0,
    hasCoupon: true,
    xPct: 58,
    yPct: 52,
  },
  {
    id: 's5',
    name: 'Chula Sweet',
    distance: '0.5 km',
    rating: 4.7,
    hasCoupon: false,
    xPct: 38,
    yPct: 48,
  },
];

export default function MapScreen({ onBack, onOpenStore }: Props) {
  const [filter, setFilter] = useState(FILTERS[0]);
  const [searchText, setSearchText] = useState('');
  const [selectedStore, setSelectedStore] = useState<StoreMarker | null>(STORE_MARKERS[0]);

  return (
    <View style={styles.root}>
      {/* Map Canvas Background (Illustrated Vector Street Grid matching Ref) */}
      <View style={styles.mapContainer}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {/* Base ground */}
          <Rect x="0" y="0" width="100%" height="100%" fill="#F5F2E9" />

          {/* Green Parks / Blocks */}
          <Rect x="20" y="80" width="120" height="90" rx="8" fill="#EBF2E5" />
          <Rect x="220" y="60" width="140" height="110" rx="8" fill="#EBF2E5" />
          <Rect x="15" y="240" width="150" height="130" rx="8" fill="#EBF2E5" />
          <Rect x="210" y="220" width="160" height="150" rx="8" fill="#EBF2E5" />
          <Rect x="30" y="440" width="160" height="180" rx="8" fill="#EBF2E5" />
          <Rect x="220" y="420" width="150" height="200" rx="8" fill="#EBF2E5" />

          {/* Roads & Streets */}
          {/* Main Diagonal Boulevard */}
          <Line x1="-20" y1="120" x2="420" y2="480" stroke="#FFFFFF" strokeWidth="26" />
          <Line x1="-20" y1="120" x2="420" y2="480" stroke="#E3DDD1" strokeWidth="1" />

          {/* Secondary Cross Streets */}
          <Line x1="180" y1="-20" x2="180" y2="800" stroke="#FFFFFF" strokeWidth="20" />
          <Line x1="70" y1="-20" x2="70" y2="800" stroke="#FFFFFF" strokeWidth="16" />
          <Line x1="300" y1="-20" x2="300" y2="800" stroke="#FFFFFF" strokeWidth="18" />

          <Line x1="-20" y1="200" x2="420" y2="200" stroke="#FFFFFF" strokeWidth="20" />
          <Line x1="-20" y1="380" x2="420" y2="380" stroke="#FFFFFF" strokeWidth="22" />
          <Line x1="-20" y1="560" x2="420" y2="560" stroke="#FFFFFF" strokeWidth="18" />

          {/* Secondary small alleys */}
          <Line x1="120" y1="100" x2="350" y2="100" stroke="#FFFFFF" strokeWidth="10" />
          <Line x1="40" y1="300" x2="250" y2="300" stroke="#FFFFFF" strokeWidth="10" />
          <Line x1="120" y1="480" x2="380" y2="480" stroke="#FFFFFF" strokeWidth="12" />
        </Svg>

        {/* User Pulsing Location Marker (Center Blue Dot with Halo) */}
        <View style={styles.userLocationWrap}>
          <View style={styles.userHaloOuter}>
            <View style={styles.userHaloInner}>
              <View style={styles.userCenterDot} />
            </View>
          </View>
        </View>

        {/* Store Pins */}
        {STORE_MARKERS.map((store) => {
          const isSelected = selectedStore?.id === store.id;
          return (
            <Pressable
              key={store.id}
              onPress={() => setSelectedStore(store)}
              style={[
                styles.pinWrap,
                { left: `${store.xPct}%`, top: `${store.yPct}%` },
              ]}
              hitSlop={10}
            >
              <Svg width={32} height={40} viewBox="0 0 32 40">
                <Path
                  d="M 16 0 C 7.2 0 0 7.2 0 16 C 0 26 16 40 16 40 C 16 40 32 26 32 16 C 32 7.2 24.8 0 16 0 Z"
                  fill={isSelected ? '#374730' : '#55684B'}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <Circle cx="16" cy="15" r="5" fill="#FFFFFF" />
              </Svg>
            </Pressable>
          );
        })}
      </View>

      {/* Floating Top Controls */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับ"
            hitSlop={12}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.headerTitle}>Map</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาร้านค้า, ประเภท, หรือแบรนด์"
            placeholderTextColor="#8A8F85"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Filter Pills Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.filterPill,
                  active ? styles.filterPillActive : styles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active ? styles.filterTextActive : styles.filterTextInactive,
                  ]}
                >
                  {f}
                </Text>
              </Pressable>
            );
          })}
          {/* Funnel / Filter Settings Button */}
          <Pressable style={styles.filterIconBtn}>
            <Text style={styles.filterIconEmoji}>🔽</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Bottom Floating Store Preview Card */}
      {selectedStore && (
        <View style={styles.bottomOverlay}>
          <View style={styles.previewCard}>
            {/* Top Row: Logo + Info + Coupon Badge + Close */}
            <View style={styles.previewTopRow}>
              {/* Store Photo / Logo */}
              <View style={styles.previewLogoBox}>
                <Image
                  source={STORE_AMAZON_IMG}
                  style={styles.previewLogoImage}
                  resizeMode="cover"
                />
              </View>

              {/* Middle Title & Meta */}
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{selectedStore.name}</Text>
                <View style={styles.previewMetaRow}>
                  <Text style={styles.previewDistance}>📍 {selectedStore.distance}</Text>
                  <Text style={styles.previewRating}>⭐ {selectedStore.rating}</Text>
                </View>
              </View>

              {/* Right Side: Badge & Close */}
              <View style={styles.previewRight}>
                <Pressable
                  onPress={() => setSelectedStore(null)}
                  hitSlop={8}
                  style={styles.previewCloseBtn}
                >
                  <Text style={styles.previewCloseText}>✕</Text>
                </Pressable>
                {selectedStore.hasCoupon && (
                  <View style={styles.couponBadge}>
                    <Text style={styles.couponBadgeText}>มีคูปอง</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Bottom CTA Button */}
            <Pressable
              onPress={() => onOpenStore(selectedStore.id)}
              style={({ pressed }) => [
                styles.detailBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.detailBtnText}>ดูรายละเอียด</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7EE',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  userLocationWrap: {
    position: 'absolute',
    left: '48%',
    top: '42%',
    marginLeft: -24,
    marginTop: -24,
  },
  userHaloOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userHaloInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCenterDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  pinWrap: {
    position: 'absolute',
    marginLeft: -16,
    marginTop: -40,
    elevation: 6,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '700',
    color: '#262A22',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#262A22',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EFE9DE',
    elevation: 4,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: 10,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#262A22',
    padding: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.pill,
    elevation: 2,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  filterPillActive: {
    backgroundColor: '#55684B',
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4D8',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextInactive: {
    color: '#70756B',
  },
  filterIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconEmoji: {
    fontSize: 12,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE9DE',
    elevation: 10,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    gap: 14,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewLogoBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ECE4D8',
  },
  previewLogoImage: {
    width: '100%',
    height: '100%',
  },
  previewInfo: {
    flex: 1,
    gap: 3,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: '#55684B',
  },
  previewRating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C78923',
  },
  previewRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 54,
  },
  previewCloseBtn: {
    padding: 4,
  },
  previewCloseText: {
    fontSize: 14,
    color: '#A0A59B',
    fontWeight: '600',
  },
  couponBadge: {
    backgroundColor: '#E04F4F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  couponBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailBtn: {
    backgroundColor: '#55684B',
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  detailBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
