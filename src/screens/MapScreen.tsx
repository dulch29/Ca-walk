import React, { useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Map as MapView,
  Camera,
  CameraRef,
  Marker,
} from '@maplibre/maplibre-react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import CatAvatar from '../components/CatAvatar';
import {
  AmazonLogo,
  InthaninLogo,
  KfcLogo,
  SevenElevenLogo,
} from '../components/BrandLogos';
import { useAppContext } from '../context/AppContext';
import { radius, space } from '../theme';

type Props = {
  onBack: () => void;
  onOpenStore: (storeId: string) => void;
};

const STORE_AMAZON_IMG = require('../../Assests/Images/store_amazon.jpg');
const STORE_7ELEVEN_IMG = require('../../Assests/Images/store_7eleven.jpg');
const STORE_KFC_IMG = require('../../Assests/Images/store_kfc.jpg');

const FILTERS = ['ทั้งหมด', 'ใกล้ฉัน', 'ส่วนลด', 'อาหาร & เครื่องดื่ม'];

export interface StoreMarker {
  id: string;
  name: string;
  branch: string;
  brand: 'amazon' | '7eleven' | 'inthanin' | 'kfc' | 'chula';
  distance: string;
  rating: number;
  hasCoupon: boolean;
  couponText?: string;
  category: 'all' | 'nearby' | 'coupon' | 'food';
  coordinates: [number, number]; // [lng, lat]
  image: any;
}

// Bangkok Chula - Siam - Bantadthong stores
const STORE_MARKERS: StoreMarker[] = [
  {
    id: 's1',
    name: 'Cafe Amazon',
    branch: 'สาขา สยามสแควร์วัน',
    brand: 'amazon',
    distance: '1.2 km',
    rating: 4.5,
    hasCoupon: true,
    couponText: 'ลด 15.- เครื่องดื่มทุกเมนู',
    category: 'food',
    coordinates: [100.5315, 13.7445],
    image: STORE_AMAZON_IMG,
  },
  {
    id: 's2',
    name: '7-Eleven',
    branch: 'สาขา บรรทัดทอง ซอย 12',
    brand: '7eleven',
    distance: '0.8 km',
    rating: 4.2,
    hasCoupon: true,
    couponText: 'คูปองแลกซื้อไส้กรอก 10.-',
    category: 'nearby',
    coordinates: [100.5235, 13.7380],
    image: STORE_7ELEVEN_IMG,
  },
  {
    id: 's3',
    name: 'Inthanin Coffee',
    branch: 'สาขา สามย่าน มิตรทาวน์',
    brand: 'inthanin',
    distance: '1.5 km',
    rating: 4.6,
    hasCoupon: false,
    category: 'food',
    coordinates: [100.5285, 13.7335],
    image: STORE_AMAZON_IMG,
  },
  {
    id: 's4',
    name: 'KFC',
    branch: 'สาขา MBK Center ชั้น G',
    brand: 'kfc',
    distance: '2.1 km',
    rating: 4.0,
    hasCoupon: true,
    couponText: 'ลด 20.- ชุดโดนใจ',
    category: 'food',
    coordinates: [100.5303, 13.7460],
    image: STORE_KFC_IMG,
  },
  {
    id: 's5',
    name: 'Chula Sweet ขนมหวาน',
    branch: 'สาขา สวนหลวงสแควร์',
    brand: 'chula',
    distance: '0.5 km',
    rating: 4.7,
    hasCoupon: false,
    category: 'nearby',
    coordinates: [100.5265, 13.7350],
    image: STORE_7ELEVEN_IMG,
  },
];

// Bangkok center coordinates [lng, lat]
const BANGKOK_CENTER: [number, number] = [100.5280, 13.7390];

// OpenStreetMap raster tiles (100% free & open, NO API key required)
const OSM_STYLE = JSON.stringify({
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
});

export default function MapScreen({ onBack, onOpenStore }: Props) {
  const { currentLocation } = useAppContext();
  const [filter, setFilter] = useState(FILTERS[0]);
  const [searchText, setSearchText] = useState('');
  const [selectedStore, setSelectedStore] = useState<StoreMarker | null>(STORE_MARKERS[0]);
  const [mapError, setMapError] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(15.5);
  const cameraRef = useRef<CameraRef>(null);

  const userCoords: [number, number] = currentLocation
    ? [currentLocation.longitude, currentLocation.latitude]
    : BANGKOK_CENTER;

  // Filter store pins dynamically
  const filteredStores = STORE_MARKERS.filter((store) => {
    if (filter === 'ใกล้ฉัน' && store.category !== 'nearby') {
      return false;
    }
    if (filter === 'ส่วนลด' && !store.hasCoupon) {
      return false;
    }
    if (filter === 'อาหาร & เครื่องดื่ม' && store.category !== 'food') {
      return false;
    }
    if (searchText.trim().length > 0) {
      const q = searchText.toLowerCase();
      return (
        store.name.toLowerCase().includes(q) ||
        store.branch.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectStore = (store: StoreMarker) => {
    setSelectedStore(store);
    cameraRef.current?.flyTo({
      center: store.coordinates,
      zoom: 16.5,
      duration: 600,
    });
  };

  const handleRecenter = () => {
    cameraRef.current?.flyTo({
      center: userCoords,
      zoom: 15.5,
      duration: 600,
    });
    setCurrentZoom(15.5);
  };

  const handleZoomIn = () => {
    const nextZoom = Math.min(currentZoom + 1, 19);
    setCurrentZoom(nextZoom);
    cameraRef.current?.zoomTo(nextZoom, { duration: 300 });
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(currentZoom - 1, 12);
    setCurrentZoom(nextZoom);
    cameraRef.current?.zoomTo(nextZoom, { duration: 300 });
  };

  const renderBrandLogo = (brand: StoreMarker['brand']) => {
    if (brand === 'amazon') {
      return <AmazonLogo size={32} />;
    }
    if (brand === '7eleven') {
      return <SevenElevenLogo size={32} />;
    }
    if (brand === 'inthanin') {
      return <InthaninLogo size={32} />;
    }
    if (brand === 'kfc') {
      return <KfcLogo size={32} />;
    }
    return (
      <View style={styles.chulaPinLogo}>
        <Text style={styles.chulaPinText}>🍰</Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Real Map Canvas Container */}
      <View style={styles.mapContainer}>
        {!mapError ? (
          <MapView
            style={styles.mapView}
            mapStyle={OSM_STYLE}
            logo={false}
            attribution={false}
            onDidFailLoadingMap={() => setMapError(true)}
          >
            <Camera
              ref={cameraRef}
              initialViewState={{
                center: userCoords,
                zoom: 15.5,
              }}
              center={userCoords}
              zoom={currentZoom}
              minZoom={12}
            />

            {/* Store Markers with Authentic Brand Badges */}
            {filteredStores.map((store) => {
              const isSelected = selectedStore?.id === store.id;
              return (
                <Marker
                  key={store.id}
                  id={`marker-${store.id}`}
                  lngLat={store.coordinates}
                >
                  <Pressable
                    onPress={() => handleSelectStore(store)}
                    style={[
                      styles.storePinCard,
                      isSelected && styles.storePinCardSelected,
                    ]}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`หมุดร้าน ${store.name}`}
                  >
                    {/* Brand Logo in Pin */}
                    <View style={styles.pinLogoContainer}>
                      {renderBrandLogo(store.brand)}
                    </View>

                    {/* Discount badge if has coupon */}
                    {store.hasCoupon && (
                      <View style={styles.pinCouponPill}>
                        <Text style={styles.pinCouponText}>คูปอง</Text>
                      </View>
                    )}

                    {/* Pin pointer triangle */}
                    <View
                      style={[
                        styles.pinNotch,
                        isSelected && styles.pinNotchSelected,
                      ]}
                    />
                  </Pressable>
                </Marker>
              );
            })}

            {/* User Cat Marker with Pulsing Radar Ring */}
            <Marker id="user-cat-marker" lngLat={userCoords}>
              <View style={styles.userMarkerWrap}>
                <View style={styles.userSpeechBubble}>
                  <Text style={styles.userSpeechText}>เมี้ยว~ วันนี้แวะร้านไหนดี?</Text>
                  <View style={styles.userSpeechTail} />
                </View>
                <View style={styles.userCatCard}>
                  <CatAvatar size={50} mood="sit" />
                </View>
                <View style={styles.userRadarHalo}>
                  <View style={styles.userCenterDot} />
                </View>
              </View>
            </Marker>
          </MapView>
        ) : (
          /* Fallback Illustrated Vector Canvas if offline */
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Rect x="0" y="0" width="100%" height="100%" fill="#F5F2E9" />
            <Rect x="20" y="80" width="120" height="90" rx="8" fill="#EBF2E5" />
            <Rect x="220" y="60" width="140" height="110" rx="8" fill="#EBF2E5" />
            <Rect x="15" y="240" width="150" height="130" rx="8" fill="#EBF2E5" />
            <Rect x="210" y="220" width="160" height="150" rx="8" fill="#EBF2E5" />
            <Line x1="-20" y1="120" x2="420" y2="480" stroke="#FFFFFF" strokeWidth="26" />
            <Line x1="180" y1="-20" x2="180" y2="800" stroke="#FFFFFF" strokeWidth="20" />
            <Line x1="-20" y1="380" x2="420" y2="380" stroke="#FFFFFF" strokeWidth="22" />
          </Svg>
        )}
      </View>

      {/* Floating Top Controls (Header, Search, Filters) */}
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
            <Text style={styles.headerTitle}>สำรวจแผนที่</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาร้านค้า, คาเฟ่, สาขา"
            placeholderTextColor="#8A8F85"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} hitSlop={8}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </Pressable>
          )}
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
        </ScrollView>
      </View>

      {/* Floating Map Utility Buttons (Recenter & Zoom) */}
      <View style={styles.mapControlsColumn}>
        <Pressable
          onPress={handleRecenter}
          accessibilityRole="button"
          accessibilityLabel="จัดตำแหน่งกึ่งกลางที่ตัวฉัน"
          style={styles.mapFloatingBtn}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2.2}>
            <Circle cx="12" cy="12" r="8" />
            <Line x1="12" y1="2" x2="12" y2="6" strokeLinecap="round" />
            <Line x1="12" y1="18" x2="12" y2="22" strokeLinecap="round" />
            <Line x1="2" y1="12" x2="6" y2="12" strokeLinecap="round" />
            <Line x1="18" y1="12" x2="22" y2="12" strokeLinecap="round" />
            <Circle cx="12" cy="12" r="2.5" fill="#38A169" />
          </Svg>
        </Pressable>

        <Pressable
          onPress={handleZoomIn}
          accessibilityRole="button"
          accessibilityLabel="ซูมเข้า"
          style={styles.mapFloatingBtn}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2.5}>
            <Path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </Svg>
        </Pressable>

        <Pressable
          onPress={handleZoomOut}
          accessibilityRole="button"
          accessibilityLabel="ซูมออก"
          style={styles.mapFloatingBtn}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2.5}>
            <Path d="M5 12h14" strokeLinecap="round" />
          </Svg>
        </Pressable>
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
                  source={selectedStore.image}
                  style={styles.previewLogoImage}
                  resizeMode="cover"
                />
              </View>

              {/* Middle Title & Meta */}
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {selectedStore.name}
                </Text>
                <Text style={styles.previewBranch} numberOfLines={1}>
                  {selectedStore.branch}
                </Text>
                <View style={styles.previewMetaRow}>
                  <Text style={styles.previewDistance}>📍 {selectedStore.distance}</Text>
                  <Text style={styles.previewRating}>⭐ {selectedStore.rating}</Text>
                </View>
              </View>

              {/* Right Side: Close Button */}
              <Pressable
                onPress={() => setSelectedStore(null)}
                hitSlop={10}
                style={styles.previewCloseBtn}
              >
                <Text style={styles.previewCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Coupon Callout if available */}
            {selectedStore.hasCoupon && selectedStore.couponText && (
              <View style={styles.previewCouponRow}>
                <Text style={styles.previewCouponIcon}>🎟️</Text>
                <Text style={styles.previewCouponText} numberOfLines={1}>
                  {selectedStore.couponText}
                </Text>
              </View>
            )}

            {/* Bottom CTA Button */}
            <Pressable
              onPress={() => onOpenStore(selectedStore.id)}
              style={({ pressed }) => [
                styles.detailBtn,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`ดูรายละเอียดร้าน ${selectedStore.name}`}
            >
              <Text style={styles.detailBtnText}>ดูร้านค้าและรับส่วนลด</Text>
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
  mapView: {
    flex: 1,
  },

  // Store Pin on Map
  storePinCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 3,
    borderWidth: 2,
    borderColor: '#ECE4D8',
    elevation: 5,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  storePinCardSelected: {
    borderColor: '#374B2A',
    transform: [{ scale: 1.12 }],
    zIndex: 30,
  },
  pinLogoContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chulaPinLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chulaPinText: {
    fontSize: 20,
  },
  pinCouponPill: {
    position: 'absolute',
    top: -7,
    right: -7,
    backgroundColor: '#E53E3E',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  pinCouponText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  pinNotch: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ECE4D8',
    marginTop: 2,
  },
  pinNotchSelected: {
    borderTopColor: '#374B2A',
  },

  // User Marker
  userMarkerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userSpeechBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    marginBottom: 4,
    elevation: 3,
  },
  userSpeechText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#282C24',
  },
  userSpeechTail: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
  },
  userCatCard: {
    elevation: 4,
  },
  userRadarHalo: {
    position: 'absolute',
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  userCenterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Top Overlay
  topOverlay: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 36 : 48,
    left: space.md,
    right: space.md,
    zIndex: 20,
    gap: space.xs + 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#ECE4D8',
    elevation: 3,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#262A22',
    marginRight: 6,
    lineHeight: 22,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262A22',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: Platform.OS === 'android' ? 6 : 9,
    borderWidth: 1,
    borderColor: '#ECE4D8',
    elevation: 3,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#262A22',
    padding: 0,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: '#8A8F85',
    paddingHorizontal: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: '#374B2A',
    borderColor: '#374B2A',
  },
  filterPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#ECE4D8',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextInactive: {
    color: '#4B553D',
  },

  // Map Floating Utility Controls (Re-center, Zoom)
  mapControlsColumn: {
    position: 'absolute',
    right: space.lg,
    bottom: Platform.OS === 'android' ? 190 : 205,
    zIndex: 22,
    gap: 8,
  },
  mapFloatingBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE4D8',
    elevation: 4,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },

  // Bottom Floating Store Preview Card
  bottomOverlay: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: Platform.OS === 'android' ? 24 : 36,
    zIndex: 25,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: space.md,
    borderWidth: 1,
    borderColor: '#ECE4D8',
    elevation: 6,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    gap: 10,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewLogoBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F3EFE6',
  },
  previewLogoImage: {
    width: '100%',
    height: '100%',
  },
  previewInfo: {
    flex: 1,
    gap: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262A22',
  },
  previewBranch: {
    fontSize: 12,
    color: '#656D5F',
    fontWeight: '600',
  },
  previewMetaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  previewDistance: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374B2A',
  },
  previewRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  previewCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCloseText: {
    fontSize: 13,
    color: '#656D5F',
    fontWeight: '700',
  },
  previewCouponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  previewCouponIcon: {
    fontSize: 14,
  },
  previewCouponText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  detailBtn: {
    backgroundColor: '#374B2A',
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  detailBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
