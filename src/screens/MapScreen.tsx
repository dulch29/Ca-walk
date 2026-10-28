import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import CatAvatar from '../components/CatAvatar';
import {
  AmazonLogo,
  InthaninLogo,
  KfcLogo,
  SevenElevenLogo,
} from '../components/BrandLogos';
import { useAppContext, type ActivityDestination } from '../context/AppContext';
import { radius } from '../theme';
import { OSM_CONFIG, OSM_MAP_STYLE } from '../services/osmMapService';
import {
  formatDistance,
  getWalkingRoute,
  searchPlaces,
  MAX_SEARCH_RADIUS_METERS,
  type OsmPlace,
  type RoutePreview,
} from '../services/osmLocationService';
import { haversineDistanceMeters } from '../services/locationUtils';

type Props = {
  onBack: () => void;
  onOpenStore: (storeId: string) => void;
  onStartRecord?: (destination: ActivityDestination) => void;
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

// Bangkok Chula - Siam - Bantadthong stores (Mock partner stores for prototype)
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
    coordinates: [100.5235, 13.738],
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
    coordinates: [100.5303, 13.746],
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
    coordinates: [100.5265, 13.735],
    image: STORE_7ELEVEN_IMG,
  },
];

// Bangkok default map center when GPS is not yet available
const DEFAULT_CENTER: [number, number] = [100.528, 13.739];

const ROUTE_PREVIEW_CASING_STYLE = {
  lineColor: '#1E3A8A',
  lineWidth: 6,
  lineCap: 'round',
  lineJoin: 'round',
} as const;

const ROUTE_PREVIEW_LINE_STYLE = {
  lineColor: '#3B82F6',
  lineWidth: 4,
  lineCap: 'round',
  lineJoin: 'round',
} as const;

export default function MapScreen({
  onBack,
  onOpenStore,
  onStartRecord,
}: Props) {
  const {
    currentLocation,
    setSelectedDestination,
    requestLocationPermission,
  } = useAppContext();
  const [filter, setFilter] = useState(FILTERS[0]);
  const [searchText, setSearchText] = useState('');
  const [selectedStore, setSelectedStore] = useState<StoreMarker | null>(null);

  // OSM Geocoding state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OsmPlace[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Destination & Route preview state
  const [selectedPlace, setSelectedPlace] = useState<OsmPlace | null>(null);
  const [routePreview, setRoutePreview] = useState<RoutePreview | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  const [mapError, setMapError] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(15.5);
  const cameraRef = useRef<CameraRef>(null);
  const hasCenteredInitialFix = useRef(false);

  const hasGpsFix = currentLocation !== null;
  const userCoords: [number, number] | null = useMemo(
    () =>
      currentLocation
        ? [currentLocation.longitude, currentLocation.latitude]
        : null,
    [currentLocation],
  );

  // Camera center: real GPS if fix available, otherwise default Bangkok area
  const cameraCenter: [number, number] = userCoords ?? DEFAULT_CENTER;

  // Request location permission on mount to observe user location
  useEffect(() => {
    requestLocationPermission().catch(() => {});
  }, [requestLocationPermission]);

  // Center camera when initial GPS fix is obtained
  useEffect(() => {
    if (userCoords && !hasCenteredInitialFix.current) {
      hasCenteredInitialFix.current = true;
      cameraRef.current?.flyTo({
        center: userCoords,
        zoom: 15.5,
        duration: 800,
      });
    }
  }, [userCoords]);

  // Filter store pins
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
    return true;
  });

  const handleSearchSubmit = async () => {
    const query = searchText.trim();
    if (!query) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    // Prompt/ensure user location is examined first to prioritize closest branches
    let activeCoords = userCoords;
    if (!activeCoords) {
      try {
        await requestLocationPermission();
        if (currentLocation) {
          activeCoords = [currentLocation.longitude, currentLocation.latitude];
        }
      } catch {
        // Non-blocking
      }
    }

    try {
      const qLower = query.toLowerCase();

      // Find partner stores matching query (e.g. KFC, Cafe Amazon, 7-Eleven)
      const matchingStores = STORE_MARKERS.filter((store) => {
        const name = store.name.toLowerCase();
        const branch = store.branch.toLowerCase();
        const brand = store.brand.toLowerCase();
        return (
          name.includes(qLower) ||
          branch.includes(qLower) ||
          brand.includes(qLower) ||
          (qLower === 'kfc' && brand === 'kfc') ||
          (qLower === 'amazon' && brand === 'amazon') ||
          (qLower === 'inthanin' && brand === 'inthanin') ||
          (qLower === '7-eleven' && brand === '7eleven') ||
          (qLower === '7eleven' && brand === '7eleven') ||
          (qLower === 'เซเว่น' && brand === '7eleven')
        );
      });

      const partnerPlaces: OsmPlace[] = matchingStores.map((store) => {
        const dist = activeCoords
          ? Math.round(
              haversineDistanceMeters(
                { latitude: activeCoords[1], longitude: activeCoords[0] },
                {
                  latitude: store.coordinates[1],
                  longitude: store.coordinates[0],
                },
              ),
            )
          : undefined;

        return {
          id: `store-${store.id}`,
          name: store.name,
          displayName: `${store.name} (${store.branch})`,
          category: 'shop',
          coordinates: store.coordinates,
          distanceMeters: dist,
        };
      });

      // Search real OSM places with user location bias
      let osmPlaces: OsmPlace[] = [];
      try {
        osmPlaces = await searchPlaces(query, {
          userCoords: activeCoords ?? undefined,
        });
      } catch (osmErr) {
        if (partnerPlaces.length === 0) {
          throw osmErr;
        }
      }

      // Combine both sources
      const combined = [...partnerPlaces, ...osmPlaces];

      // Keep only places within realistic nearby proximity (<= 30 km)
      // Eliminates far-flung results (like 904 km or 2205 km)
      const nearbyResults = activeCoords
        ? combined.filter(
            (p) =>
              p.distanceMeters !== undefined &&
              p.distanceMeters <= MAX_SEARCH_RADIUS_METERS,
          )
        : combined;

      let finalResults = nearbyResults;
      if (finalResults.length === 0 && activeCoords) {
        finalResults = combined.filter(
          (p) =>
            p.distanceMeters !== undefined &&
            p.distanceMeters <= 60000,
        );
      }

      // Sort by proximity: closest first
      if (activeCoords) {
        finalResults.sort(
          (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
        );
      }

      setSearchResults(finalResults);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : 'ค้นหาสถานที่ไม่สำเร็จ',
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = async (place: OsmPlace) => {
    setSelectedStore(null);
    setSelectedPlace(place);
    setSearchResults([]);
    setSearchError(null);
    setRoutePreview(null);
    setRoutingError(null);

    cameraRef.current?.flyTo({
      center: place.coordinates,
      zoom: 16.5,
      duration: 600,
    });

    if (userCoords) {
      setRoutingLoading(true);
      try {
        const route = await getWalkingRoute(userCoords, place.coordinates);
        if (route) {
          setRoutePreview(route);
        } else {
          setRoutingError(
            'ไม่สามารถเชื่อมต่อคำนวณเส้นทางได้ แต่ยังสามารถเริ่มเดินได้',
          );
        }
      } catch {
        setRoutingError(
          'ไม่สามารถเชื่อมต่อคำนวณเส้นทางได้ แต่ยังสามารถเริ่มเดินได้',
        );
      } finally {
        setRoutingLoading(false);
      }
    } else {
      setRoutingError('รอสัญญาณ GPS เพื่อแสดงเส้นทางเดิน');
    }
  };

  const handleSelectStore = async (store: StoreMarker) => {
    setSelectedPlace(null);
    setRoutePreview(null);
    setRoutingError(null);
    setSearchResults([]);
    setSelectedStore(store);

    cameraRef.current?.flyTo({
      center: store.coordinates,
      zoom: 16.5,
      duration: 600,
    });

    if (userCoords) {
      setRoutingLoading(true);
      try {
        const route = await getWalkingRoute(userCoords, store.coordinates);
        if (route) {
          setRoutePreview(route);
        }
      } catch {
        // Route preview is non-blocking for stores
      } finally {
        setRoutingLoading(false);
      }
    }
  };

  const handleSelectSearchResult = (place: OsmPlace) => {
    if (place.id.startsWith('store-')) {
      const storeId = place.id.replace('store-', '');
      const store = STORE_MARKERS.find((s) => s.id === storeId);
      if (store) {
        handleSelectStore(store);
        return;
      }
    }
    handleSelectPlace(place);
  };

  const handleGoToDestination = (destination: ActivityDestination) => {
    setSelectedDestination(destination);
    onStartRecord?.(destination);
  };

  const handleRecenter = () => {
    if (userCoords) {
      cameraRef.current?.flyTo({
        center: userCoords,
        zoom: 16,
        duration: 600,
      });
      setCurrentZoom(16);
    } else {
      cameraRef.current?.flyTo({
        center: DEFAULT_CENTER,
        zoom: 14,
        duration: 600,
      });
    }
  };

  const handleZoomIn = () => {
    const nextZoom = Math.min(currentZoom + 1, 19);
    setCurrentZoom(nextZoom);
    cameraRef.current?.zoomTo(nextZoom, { duration: 300 });
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(currentZoom - 1, 10);
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
            mapStyle={OSM_MAP_STYLE}
            logo={false}
            attribution={false}
            onDidFailLoadingMap={() => setMapError(true)}
          >
            <Camera
              ref={cameraRef}
              initialViewState={{
                center: cameraCenter,
                zoom: hasGpsFix ? 15.5 : 14,
              }}
              center={cameraCenter}
              zoom={currentZoom}
              minZoom={OSM_CONFIG.minZoom}
              maxZoom={OSM_CONFIG.maxZoom}
            />

            {/* Walking Route Preview Polyline (OSRM) */}
            {routePreview && routePreview.coordinates.length > 1 && (
              <GeoJSONSource
                id="osm-route-preview-source"
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: routePreview.coordinates,
                  },
                }}
              >
                <Layer
                  id="osm-route-casing"
                  type="line"
                  style={ROUTE_PREVIEW_CASING_STYLE}
                />
                <Layer
                  id="osm-route-line"
                  type="line"
                  style={ROUTE_PREVIEW_LINE_STYLE}
                />
              </GeoJSONSource>
            )}

            {/* Destination Marker (Real Search Result) */}
            {selectedPlace && (
              <Marker
                id="selected-destination-marker"
                lngLat={selectedPlace.coordinates}
              >
                <View style={styles.destinationPinCard}>
                  <View style={styles.destinationPinHeader}>
                    <Text style={styles.destinationPinFlag}>🏁</Text>
                    <Text
                      style={styles.destinationPinTitle}
                      numberOfLines={1}
                    >
                      {selectedPlace.name}
                    </Text>
                  </View>
                  <View style={styles.destinationPinNotch} />
                </View>
              </Marker>
            )}

            {/* Store Markers (Mock Partners) */}
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
                    <View style={styles.pinLogoContainer}>
                      {renderBrandLogo(store.brand)}
                    </View>
                    {store.hasCoupon && (
                      <View style={styles.pinCouponPill}>
                        <Text style={styles.pinCouponText}>คูปอง</Text>
                      </View>
                    )}
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

            {/* User Cat Marker - Rendered ONLY when GPS fix is real */}
            {hasGpsFix && userCoords && (
              <Marker id="user-cat-marker" lngLat={userCoords}>
                <View style={styles.userMarkerWrap}>
                  <View style={styles.userSpeechBubble}>
                    <Text style={styles.userSpeechText}>
                      เมี้ยว~ วันนี้แวะร้านไหนดี?
                    </Text>
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
            )}
          </MapView>
        ) : (
          <View style={styles.offlineFallbackContainer}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Rect x="0" y="0" width="100%" height="100%" fill="#F5F2E9" />
              <Rect x="20" y="80" width="120" height="90" rx="8" fill="#EBF2E5" />
              <Rect x="220" y="60" width="140" height="110" rx="8" fill="#EBF2E5" />
              <Rect x="15" y="240" width="150" height="130" rx="8" fill="#EBF2E5" />
              <Rect x="210" y="220" width="160" height="150" rx="8" fill="#EBF2E5" />
              <Line x1="-20" y1="120" x2="420" y2="480" stroke="#FFFFFF" strokeWidth={26} />
              <Line x1="180" y1="-20" x2="180" y2="800" stroke="#FFFFFF" strokeWidth={20} />
              <Line x1="-20" y1="380" x2="420" y2="380" stroke="#FFFFFF" strokeWidth={22} />
            </Svg>
            <View style={styles.offlineNoticeCard}>
              <Text style={styles.offlineNoticeTitle}>โหมดออฟไลน์</Text>
              <Text style={styles.offlineNoticeBody}>
                ไม่สามารถโหลดแผนที่ OSM ได้ในขณะนี้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Visible OSM Attribution Pill (Required by OSM Policy) */}
      <View style={styles.osmAttributionPill} pointerEvents="none">
        <Text style={styles.osmAttributionText}>{OSM_CONFIG.attribution}</Text>
      </View>

      {/* GPS Status Indicator when searching/waiting for GPS */}
      {!hasGpsFix && (
        <Pressable
          onPress={() => {
            requestLocationPermission().catch(() => {});
          }}
          style={styles.gpsPendingPill}
          accessibilityRole="button"
          accessibilityLabel="ขออนุญาตระบุตำแหน่งของคุณ"
          hitSlop={8}
        >
          <ActivityIndicator size="small" color="#D97706" />
          <Text style={styles.gpsPendingText}>
            📍 ขออนุญาตจับตำแหน่งผู้ใช้ (แตะเพื่ออนุญาต)
          </Text>
        </Pressable>
      )}

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
            <Text style={styles.headerTitle}>สำรวจแผนที่ OSM</Text>
          </Pressable>
        </View>

        {/* Real Geocoding Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาสถานที่จริง (เช่น สยาม, สวนลุม, จุฬา)"
            placeholderTextColor="#8A8F85"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchText('');
                setSearchResults([]);
                setHasSearched(false);
              }}
              hitSlop={8}
            >
              <Text style={styles.clearSearchIcon}>✕</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleSearchSubmit}
            style={styles.searchSubmitBtn}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.searchSubmitBtnText}>ค้นหา</Text>
            )}
          </Pressable>
        </View>

        {/* Search Results Dropdown List */}
        {hasSearched && (
          <View style={styles.searchResultsBox}>
            {isSearching ? (
              <View style={styles.searchStatusRow}>
                <ActivityIndicator size="small" color="#374B2A" />
                <Text style={styles.searchStatusText}>
                  กำลังค้นหาสถานที่จาก OSM...
                </Text>
              </View>
            ) : searchError ? (
              <View style={styles.searchStatusRow}>
                <Text style={styles.searchErrorText}>⚠️ {searchError}</Text>
                <Pressable
                  onPress={handleSearchSubmit}
                  style={styles.retrySearchBtn}
                >
                  <Text style={styles.retrySearchText}>ลองใหม่</Text>
                </Pressable>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.searchStatusRow}>
                <Text style={styles.searchEmptyText}>
                  ไม่พบสถานที่ที่ตรงกับคำค้นหา
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.searchResultsScroll}
                keyboardShouldPersistTaps="handled"
              >
                {searchResults.map((place) => (
                  <Pressable
                    key={place.id}
                    onPress={() => handleSelectSearchResult(place)}
                    style={styles.searchResultItem}
                  >
                    <Text style={styles.searchResultPin}>
                      {place.id.startsWith('store-') ? '🏪' : '📍'}
                    </Text>
                    <View style={styles.searchResultInfo}>
                      <View style={styles.searchResultNameRow}>
                        <Text
                          style={styles.searchResultName}
                          numberOfLines={1}
                        >
                          {place.name}
                        </Text>
                        {place.distanceMeters !== undefined && (
                          <View style={styles.searchResultDistPill}>
                            <Text style={styles.searchResultDistText}>
                              {formatDistance(place.distanceMeters)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={styles.searchResultAddress}
                        numberOfLines={1}
                      >
                        {place.displayName}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Filter Pills Row for partner stores */}
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
          accessibilityLabel="จัดตำแหน่งกึ่งกลาง"
          style={styles.mapFloatingBtn}
        >
          <Svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#262A22"
            strokeWidth={2.2}
          >
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
          <Svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#262A22"
            strokeWidth={2.5}
          >
            <Path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </Svg>
        </Pressable>

        <Pressable
          onPress={handleZoomOut}
          accessibilityRole="button"
          accessibilityLabel="ซูมออก"
          style={styles.mapFloatingBtn}
        >
          <Svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#262A22"
            strokeWidth={2.5}
          >
            <Path d="M5 12h14" strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>

      {/* Destination Card with Route Preview & "ไปกันเลย" Button */}
      {selectedPlace && (
        <View style={styles.bottomOverlay}>
          <View style={styles.destinationCard}>
            <View style={styles.destHeaderRow}>
              <View style={styles.destIconBox}>
                <Text style={styles.destIcon}>📍</Text>
              </View>
              <View style={styles.destInfo}>
                <Text style={styles.destTitle} numberOfLines={1}>
                  {selectedPlace.name}
                </Text>
                <Text style={styles.destSubtitle} numberOfLines={2}>
                  {selectedPlace.displayName}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedPlace(null);
                  setRoutePreview(null);
                  setRoutingError(null);
                }}
                hitSlop={10}
                style={styles.previewCloseBtn}
              >
                <Text style={styles.previewCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Route preview stats */}
            {routingLoading ? (
              <View style={styles.routingLoadingRow}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.routingLoadingText}>
                  กำลังคำนวณเส้นทางเดินจาก OSM...
                </Text>
              </View>
            ) : routePreview ? (
              <View style={styles.routeStatsRow}>
                <View style={styles.routeStatPill}>
                  <Text style={styles.routeStatLabel}>ระยะทางเดิน</Text>
                  <Text style={styles.routeStatValue}>
                    {(routePreview.distanceMeters / 1000).toFixed(2)} km
                  </Text>
                </View>
                <View style={styles.routeStatPill}>
                  <Text style={styles.routeStatLabel}>ประมาณเวลา</Text>
                  <Text style={styles.routeStatValue}>
                    {Math.max(1, Math.round(routePreview.durationSeconds / 60))}{' '}
                    นาที
                  </Text>
                </View>
              </View>
            ) : routingError ? (
              <View style={styles.routingErrorRow}>
                <Text style={styles.routingErrorText}>ℹ️ {routingError}</Text>
              </View>
            ) : null}

            {/* Big "ไปกันเลย" Button */}
            <Pressable
              onPress={() =>
                handleGoToDestination({
                  id: selectedPlace.id,
                  name: selectedPlace.name,
                  coordinates: selectedPlace.coordinates,
                  distanceMeters: routePreview?.distanceMeters,
                  routeCoordinates: routePreview?.coordinates,
                })
              }
              style={({ pressed }) => [
                styles.goBtn,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`ไปกันเลยที่ ${selectedPlace.name}`}
            >
              <Text style={styles.goBtnText}>ไปกันเลย 🐾</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Bottom Floating Store Preview Card (Mock Store) */}
      {selectedStore && !selectedPlace && (
        <View style={styles.bottomOverlay}>
          <View style={styles.previewCard}>
            <View style={styles.previewTopRow}>
              <View style={styles.previewLogoBox}>
                <Image
                  source={selectedStore.image}
                  style={styles.previewLogoImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {selectedStore.name}
                </Text>
                <Text style={styles.previewBranch} numberOfLines={1}>
                  {selectedStore.branch}
                </Text>
                <View style={styles.previewMetaRow}>
                  <Text style={styles.previewDistance}>
                    📍 {selectedStore.distance}
                  </Text>
                  <Text style={styles.previewRating}>
                    ⭐ {selectedStore.rating}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedStore(null);
                  setRoutePreview(null);
                }}
                hitSlop={10}
                style={styles.previewCloseBtn}
              >
                <Text style={styles.previewCloseText}>✕</Text>
              </Pressable>
            </View>

            {selectedStore.hasCoupon && selectedStore.couponText && (
              <View style={styles.previewCouponRow}>
                <Text style={styles.previewCouponIcon}>🎟️</Text>
                <Text style={styles.previewCouponText} numberOfLines={1}>
                  {selectedStore.couponText}
                </Text>
              </View>
            )}

            <View style={styles.storeBtnRow}>
              <Pressable
                onPress={() => onOpenStore(selectedStore.id)}
                style={({ pressed }) => [
                  styles.detailBtn,
                  pressed && styles.btnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`ดูรายละเอียดร้าน ${selectedStore.name}`}
              >
                <Text style={styles.detailBtnText}>ดูร้านค้า</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  handleGoToDestination({
                    id: selectedStore.id,
                    name: `${selectedStore.name} ${selectedStore.branch}`,
                    coordinates: selectedStore.coordinates,
                    distanceMeters: routePreview?.distanceMeters,
                    routeCoordinates: routePreview?.coordinates,
                  })
                }
                style={({ pressed }) => [
                  styles.goStoreBtn,
                  pressed && styles.btnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`ไปกันเลยที่ ${selectedStore.name}`}
              >
                <Text style={styles.goStoreBtnText}>ไปกันเลย 🐾</Text>
              </Pressable>
            </View>
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

  // Attribution Pill
  osmAttributionPill: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  osmAttributionText: {
    fontSize: 10,
    color: '#4A5568',
    fontWeight: '600',
  },

  // GPS Pending Indicator
  gpsPendingPill: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FCD34D',
    zIndex: 20,
    elevation: 4,
  },
  gpsPendingText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },

  // Offline Fallback
  offlineFallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineNoticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
  },
  offlineNoticeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262A22',
    marginBottom: 6,
  },
  offlineNoticeBody: {
    fontSize: 13,
    color: '#656D5F',
    textAlign: 'center',
  },

  // Destination Marker
  destinationPinCard: {
    alignItems: 'center',
  },
  destinationPinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 6,
  },
  destinationPinFlag: {
    fontSize: 14,
  },
  destinationPinTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 140,
  },
  destinationPinNotch: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1E3A8A',
  },

  // Store Pin
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
    borderWidth: 1.5,
    borderColor: '#ECE4D8',
    marginBottom: 4,
    elevation: 3,
  },
  userSpeechText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374B2A',
  },
  userSpeechTail: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ECE4D8',
  },
  userCatCard: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAF7EE',
    borderWidth: 2.5,
    borderColor: '#374B2A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  userRadarHalo: {
    position: 'absolute',
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(56, 161, 105, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCenterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38A169',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Top Overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    zIndex: 25,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.2,
    borderColor: '#ECE4D8',
    elevation: 3,
  },
  backArrow: {
    fontSize: 22,
    color: '#262A22',
    marginRight: 6,
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#262A22',
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#ECE4D8',
    elevation: 4,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#262A22',
    paddingVertical: 8,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: '#8A8F85',
    paddingHorizontal: 6,
  },
  searchSubmitBtn: {
    backgroundColor: '#374B2A',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 4,
  },
  searchSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Search Results Dropdown
  searchResultsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 6,
    maxHeight: 220,
    borderWidth: 1.5,
    borderColor: '#ECE4D8',
    elevation: 8,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  searchResultsScroll: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE6',
  },
  searchResultPin: {
    fontSize: 16,
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#262A22',
    flex: 1,
  },
  searchResultNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  searchResultDistPill: {
    backgroundColor: '#EBF2E5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#D4E3CC',
  },
  searchResultDistText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374B2A',
  },
  searchResultAddress: {
    fontSize: 11,
    color: '#656D5F',
    marginTop: 2,
  },
  searchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  searchStatusText: {
    fontSize: 12,
    color: '#656D5F',
    fontWeight: '600',
  },
  searchEmptyText: {
    fontSize: 12,
    color: '#8A8F85',
    fontStyle: 'italic',
  },
  searchErrorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  retrySearchBtn: {
    backgroundColor: '#F3EFE6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retrySearchText: {
    fontSize: 12,
    color: '#374B2A',
    fontWeight: '700',
  },

  // Filter Pills
  filtersRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.2,
    elevation: 2,
  },
  filterPillActive: {
    backgroundColor: '#374B2A',
    borderColor: '#374B2A',
  },
  filterPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: '#ECE4D8',
  },
  filterText: {
    fontSize: 12,
  },
  filterTextActive: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterTextInactive: {
    fontWeight: '600',
    color: '#656D5F',
  },

  // Map Controls
  mapControlsColumn: {
    position: 'absolute',
    right: 16,
    top: 200,
    gap: 10,
    zIndex: 15,
  },
  mapFloatingBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#ECE4D8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  // Bottom Overlay & Destination Card
  bottomOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 30,
  },
  destinationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ECE4D8',
    elevation: 8,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    gap: 12,
  },
  destHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  destIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
  },
  destIcon: {
    fontSize: 22,
  },
  destInfo: {
    flex: 1,
  },
  destTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262A22',
  },
  destSubtitle: {
    fontSize: 11,
    color: '#656D5F',
    marginTop: 2,
    lineHeight: 15,
  },
  routingLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  routingLoadingText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  routeStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  routeStatPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  routeStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  routeStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 2,
  },
  routingErrorRow: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  routingErrorText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  goBtn: {
    backgroundColor: '#374B2A',
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Store Preview Card
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ECE4D8',
    elevation: 8,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    gap: 12,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewLogoBox: {
    width: 52,
    height: 52,
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
    fontSize: 15,
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
  storeBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailBtn: {
    flex: 1,
    backgroundColor: '#F3EFE6',
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtnText: {
    color: '#374B2A',
    fontSize: 14,
    fontWeight: '800',
  },
  goStoreBtn: {
    flex: 1,
    backgroundColor: '#374B2A',
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goStoreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
