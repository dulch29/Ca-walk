import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map as MapView,
  Marker,
} from '@maplibre/maplibre-react-native';
import CatAvatar from '../components/CatAvatar';
import { useAppContext, type ActivityDestination } from '../context/AppContext';
import { OSM_CONFIG, OSM_MAP_STYLE } from '../services/osmMapService';
import * as osmLocationService from '../services/osmLocationService';
import type { TrackedLocation } from '../services/motionTracker';
import { radius } from '../theme';

type Props = {
  onBack: () => void;
  onOpenStore: (storeId: string) => void;
  onStartRecord?: (destination: ActivityDestination) => void;
};

type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';
type LocationState = 'locating' | 'ready' | 'denied' | 'error';
type LngLat = [number, number];

const locationServices = osmLocationService;

const RADII = [1000, 3000, 5000] as const;
const MAX_FIX_AGE_MS = 10_000;
const MAX_FIX_ACCURACY_METERS = 25;
const WORLD_CENTER: LngLat = [0, 0];

const ROUTE_CASING_STYLE = {
  lineColor: '#FFFFFF',
  lineWidth: 7,
  lineCap: 'round',
  lineJoin: 'round',
} as const;

const ROUTE_STYLE = {
  lineColor: '#2563EB',
  lineWidth: 4,
  lineCap: 'round',
  lineJoin: 'round',
} as const;

function validFix(fix: TrackedLocation | null, now = Date.now()): fix is TrackedLocation {
  return Boolean(
    fix &&
      Number.isFinite(fix.latitude) &&
      fix.latitude >= -90 &&
      fix.latitude <= 90 &&
      Number.isFinite(fix.longitude) &&
      fix.longitude >= -180 &&
      fix.longitude <= 180 &&
      typeof fix.accuracy === 'number' &&
      fix.accuracy >= 0 &&
      fix.accuracy <= MAX_FIX_ACCURACY_METERS &&
      Number.isFinite(fix.timestamp) &&
      fix.timestamp <= now + 1000 &&
      now - fix.timestamp <= MAX_FIX_AGE_MS,
  );
}

function coordsFromFix(fix: TrackedLocation): LngLat {
  return [fix.longitude, fix.latitude];
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'aborted')
  );
}

function errorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }
  const message = error.message;
  const lower = message.toLowerCase();
  if (lower.includes('permission') || lower.includes('อนุญาต')) {
    return 'ไม่ได้รับสิทธิ์ตำแหน่ง กรุณาเปิด GPS และอนุญาตตำแหน่งแล้วลองใหม่';
  }
  if (lower.includes('429') || lower.includes('จำกัดคำขอ')) {
    return 'บริการค้นหากำลังจำกัดคำขอ กรุณารอสักครู่แล้วลองใหม่';
  }
  if (lower.includes('timeout') || lower.includes('หมดเวลา')) {
    return 'บริการตอบช้าเกินไป กรุณาลองใหม่';
  }
  if (lower.includes('network') || lower.includes('offline') || lower.includes('fetch')) {
    return 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่';
  }
  return message || fallback;
}

function radiusLabel(radiusMeters: number): string {
  return `${radiusMeters / 1000} กม.`;
}

function sortPlaces(places: osmLocationService.OsmPlace[]) {
  return [...places].sort(
    (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
  );
}

function validRoute(
  route: osmLocationService.RoutePreview | null,
): route is osmLocationService.RoutePreview {
  return Boolean(
    route &&
      route.coordinates.length >= 2 &&
      route.coordinates.every(
        ([lng, lat]) =>
          Number.isFinite(lng) &&
          lng >= -180 &&
          lng <= 180 &&
          Number.isFinite(lat) &&
          lat >= -90 &&
          lat <= 90,
      ) &&
      Number.isFinite(route.distanceMeters) &&
      route.distanceMeters > 0 &&
      Number.isFinite(route.durationSeconds) &&
      route.durationSeconds > 0,
  );
}

function routeBounds(coordinates: LngLat[]): [number, number, number, number] {
  const lngs = coordinates.map(([lng]) => lng);
  const lats = coordinates.map(([, lat]) => lat);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

export default function MapScreen({ onBack, onStartRecord }: Props) {
  const {
    locationFix,
    requestCurrentLocation,
    setSelectedDestination,
  } = useAppContext();
  const cameraRef = useRef<CameraRef>(null);
  const activeCoordsRef = useRef<LngLat | null>(null);
  const activeFixRef = useRef<TrackedLocation | null>(null);
  const nearbyAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);
  const nearbyRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const routeRequestIdRef = useRef(0);
  const loadedInitialNearbyRef = useRef(false);
  const centeredInitialFixRef = useRef(false);
  const userMovedMapRef = useRef(false);

  const [locationState, setLocationState] = useState<LocationState>('locating');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<LngLat | null>(
    validFix(locationFix) ? coordsFromFix(locationFix) : null,
  );
  const [radiusMeters, setRadiusMeters] = useState<number>(1000);
  const [nearbyState, setNearbyState] = useState<LoadState>('idle');
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<osmLocationService.OsmPlace[]>([]);
  const [searchText, setSearchText] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchState, setSearchState] = useState<LoadState>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<osmLocationService.OsmPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<osmLocationService.OsmPlace | null>(null);
  const [routeState, setRouteState] = useState<LoadState>('idle');
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routePreview, setRoutePreview] = useState<osmLocationService.RoutePreview | null>(null);
  const [tileError, setTileError] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(15.5);

  const loadNearby = useCallback(async (coords: LngLat, radiusToLoad: number) => {
    nearbyAbortRef.current?.abort();
    const controller = new AbortController();
    nearbyAbortRef.current = controller;
    const requestId = ++nearbyRequestIdRef.current;
    setNearbyState('loading');
    setNearbyError(null);

    try {
      const places = await locationServices.getNearbyPlaces(
        coords,
        radiusToLoad,
        controller.signal,
      );
      if (requestId !== nearbyRequestIdRef.current) {
        return;
      }
      const sorted = sortPlaces(places);
      setNearbyPlaces(sorted);
      setNearbyState(sorted.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      if (requestId !== nearbyRequestIdRef.current || isAbortError(error)) {
        return;
      }
      setNearbyPlaces([]);
      setNearbyState('error');
      setNearbyError(errorMessage(error, 'ค้นหาร้านใกล้ตัวไม่สำเร็จ'));
    }
  }, []);

  const acceptFix = useCallback(
    (fix: TrackedLocation, loadInitialNearby: boolean) => {
      const coords = coordsFromFix(fix);
      activeCoordsRef.current = coords;
      activeFixRef.current = fix;
      setUserCoords(coords);
      setLocationState('ready');
      setLocationError(null);

      if (!centeredInitialFixRef.current || !userMovedMapRef.current) {
        cameraRef.current?.flyTo({ center: coords, zoom: 15.5, duration: 600 });
        centeredInitialFixRef.current = true;
      }

      if (loadInitialNearby && !loadedInitialNearbyRef.current) {
        loadedInitialNearbyRef.current = true;
        loadNearby(coords, 1000).catch(() => {});
      }
      return coords;
    },
    [loadNearby],
  );

  const requestFreshFix = useCallback(async () => {
    setLocationState('locating');
    setLocationError(null);
    try {
      const fix = await requestCurrentLocation();
      if (!validFix(fix)) {
        throw new Error('ยังไม่ได้ตำแหน่ง GPS ที่แม่นยำ กรุณาลองใหม่ในที่โล่ง');
      }
      return acceptFix(fix, true);
    } catch (error) {
      const message = errorMessage(error, 'หาตำแหน่งปัจจุบันไม่สำเร็จ');
      setLocationError(message);
      setLocationState(message.includes('อนุญาต') ? 'denied' : 'error');
      throw error;
    }
  }, [acceptFix, requestCurrentLocation]);

  useEffect(() => {
    if (validFix(locationFix)) {
      acceptFix(locationFix, true);
      return;
    }
    activeCoordsRef.current = null;
    activeFixRef.current = null;
    loadedInitialNearbyRef.current = false;
    setUserCoords(null);
    requestFreshFix().catch(() => {});
  }, [acceptFix, locationFix, requestFreshFix]);

  useEffect(
    () => () => {
      nearbyAbortRef.current?.abort();
      searchAbortRef.current?.abort();
      routeAbortRef.current?.abort();
    },
    [],
  );

  const ensureCoords = useCallback(async (): Promise<LngLat> => {
    if (validFix(locationFix)) {
      return acceptFix(locationFix, false);
    }
    if (
      activeCoordsRef.current &&
      validFix(activeFixRef.current) &&
      locationState === 'ready'
    ) {
      return activeCoordsRef.current;
    }
    return requestFreshFix();
  }, [acceptFix, locationFix, locationState, requestFreshFix]);

  const handleRadiusChange = useCallback(
    async (nextRadius: number) => {
      setRadiusMeters(nextRadius);
      setHasSearched(false);
      setSearchResults([]);
      setSearchError(null);
      try {
        const coords = await ensureCoords();
        await loadNearby(coords, nextRadius);
      } catch {
        // Location status already explains the failure.
      }
    },
    [ensureCoords, loadNearby],
  );

  const handleSearchSubmit = useCallback(async () => {
    const query = searchText.trim();
    if (!query) {
      setHasSearched(false);
      setSearchResults([]);
      setSearchState('idle');
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const requestId = ++searchRequestIdRef.current;
    setHasSearched(true);
    setSearchState('loading');
    setSearchError(null);
    setSelectedPlace(null);
    setRoutePreview(null);

    try {
      const coords = await ensureCoords();
      const normalizedQuery = query.toLocaleLowerCase('th');
      const inventoryMatches = nearbyPlaces.filter(place =>
        `${place.name} ${place.displayName}`
          .toLocaleLowerCase('th')
          .includes(normalizedQuery),
      );
      const places =
        inventoryMatches.length > 0
          ? inventoryMatches
          : await locationServices.searchPlaces(query, {
              userCoords: coords,
              radiusMeters,
              signal: controller.signal,
            });

      if (requestId !== searchRequestIdRef.current) {
        return;
      }
      const sorted = sortPlaces(places);
      setSearchResults(sorted);
      setSearchState(sorted.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      if (requestId !== searchRequestIdRef.current || isAbortError(error)) {
        return;
      }
      setSearchResults([]);
      setSearchState('error');
      setSearchError(errorMessage(error, 'ค้นหาสถานที่ไม่สำเร็จ'));
    }
  }, [ensureCoords, nearbyPlaces, radiusMeters, searchText]);

  const requestRoute = useCallback(
    async (place: osmLocationService.OsmPlace) => {
      routeAbortRef.current?.abort();
      const controller = new AbortController();
      routeAbortRef.current = controller;
      const requestId = ++routeRequestIdRef.current;
      setRouteState('loading');
      setRouteError(null);
      setRoutePreview(null);

      try {
        const coords = await ensureCoords();
        const route = await locationServices.getWalkingRoute(
          coords,
          place.coordinates,
          controller.signal,
        );
        if (requestId !== routeRequestIdRef.current) {
          return;
        }
        if (!validRoute(route)) {
          setRouteState('error');
          setRouteError('คำนวณเส้นทางเดินไม่ได้ ลองใหม่ หรือเริ่มโดยไม่มีเส้นทาง');
          return;
        }
        setRoutePreview(route);
        setRouteState('ready');
        userMovedMapRef.current = true;
        cameraRef.current?.fitBounds(routeBounds(route.coordinates), {
          padding: { top: 180, right: 50, bottom: 250, left: 50 },
          duration: 700,
        });
      } catch (error) {
        if (requestId !== routeRequestIdRef.current || isAbortError(error)) {
          return;
        }
        setRouteState('error');
        setRouteError(errorMessage(error, 'คำนวณเส้นทางเดินไม่ได้ ลองใหม่'));
      }
    },
    [ensureCoords],
  );

  const handleSelectPlace = useCallback(
    (place: osmLocationService.OsmPlace) => {
      setSelectedPlace(place);
      setHasSearched(false);
      userMovedMapRef.current = true;
      cameraRef.current?.flyTo({ center: place.coordinates, zoom: 16, duration: 500 });
      requestRoute(place).catch(() => {});
    },
    [requestRoute],
  );

  const handleRecenter = useCallback(async () => {
    userMovedMapRef.current = false;
    try {
      const coords = await ensureCoords();
      cameraRef.current?.flyTo({ center: coords, zoom: 16, duration: 500 });
      setCurrentZoom(16);
    } catch {
      // Location status already explains the failure.
    }
  }, [ensureCoords]);

  const displayedPlaces = hasSearched ? searchResults : nearbyPlaces;
  const displayedState = hasSearched ? searchState : nearbyState;
  const displayedError = hasSearched ? searchError : nearbyError;

  const routeFeature = useMemo(
    () =>
      routePreview
        ? {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: routePreview.coordinates,
            },
          }
        : null,
    [routePreview],
  );

  const startRecord = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    const destination: ActivityDestination = {
      id: selectedPlace.id,
      name: selectedPlace.name,
      coordinates: selectedPlace.coordinates,
      distanceMeters: routePreview?.distanceMeters,
      routeCoordinates: routePreview?.coordinates,
    };
    setSelectedDestination(destination);
    onStartRecord?.(destination);
  }, [onStartRecord, routePreview, selectedPlace, setSelectedDestination]);

  return (
    <View style={styles.root}>
      <View style={styles.mapContainer}>
        <MapView
          key={mapKey}
          style={styles.map}
          mapStyle={OSM_MAP_STYLE}
          logo={false}
          attribution={false}
          onDidFailLoadingMap={() => setTileError(true)}
          onDidFinishLoadingMap={() => setTileError(false)}
          onRegionWillChange={event => {
            if (event.nativeEvent.userInteraction) {
              userMovedMapRef.current = true;
            }
          }}
          onRegionDidChange={event => {
            if (Number.isFinite(event.nativeEvent.zoom)) {
              setCurrentZoom(event.nativeEvent.zoom);
            }
          }}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              center: userCoords ?? WORLD_CENTER,
              zoom: userCoords ? 15.5 : 2,
            }}
            minZoom={OSM_CONFIG.minZoom}
            maxZoom={OSM_CONFIG.maxZoom}
          />

          {routeFeature && (
            <GeoJSONSource id="walking-route" data={routeFeature}>
              <Layer id="walking-route-casing" type="line" style={ROUTE_CASING_STYLE} />
              <Layer id="walking-route-line" type="line" style={ROUTE_STYLE} />
            </GeoJSONSource>
          )}

          {displayedPlaces.map(place => (
            <Marker key={place.id} id={`place-${place.id}`} lngLat={place.coordinates}>
              <Pressable
                onPress={() => handleSelectPlace(place)}
                accessibilityRole="button"
                accessibilityLabel={`เลือก ${place.name}`}
                style={[
                  styles.placeMarker,
                  selectedPlace?.id === place.id && styles.placeMarkerSelected,
                ]}
              >
                <Text style={styles.placeMarkerText}>●</Text>
              </Pressable>
            </Marker>
          ))}

          {selectedPlace && !displayedPlaces.some(place => place.id === selectedPlace.id) && (
            <Marker id="selected-place" lngLat={selectedPlace.coordinates}>
              <View style={[styles.placeMarker, styles.placeMarkerSelected]}>
                <Text style={styles.placeMarkerText}>●</Text>
              </View>
            </Marker>
          )}

          {userCoords && locationState === 'ready' && (
            <Marker id="user-location" lngLat={userCoords}>
              <View style={styles.userMarker}>
                <CatAvatar size={46} mood="sit" />
                <View style={styles.userDot} />
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      <View style={styles.topPanel} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>ร้านใกล้ฉัน</Text>
          <Pressable
            onPress={handleRecenter}
            style={styles.recenterButton}
            accessibilityRole="button"
            accessibilityLabel="กลับไปตำแหน่งของฉัน"
          >
            <Text style={styles.recenterText}>◎</Text>
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            placeholder="ค้นหาสถานที่เมื่อกดค้นหา"
            placeholderTextColor="#858B80"
          />
          <Pressable
            onPress={handleSearchSubmit}
            disabled={searchState === 'loading'}
            style={styles.searchButton}
            accessibilityRole="button"
          >
            {searchState === 'loading' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.searchButtonText}>ค้นหา</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.radiusRow}>
          {RADII.map(value => (
            <Pressable
              key={value}
              onPress={() => handleRadiusChange(value)}
              style={[
                styles.radiusButton,
                value === radiusMeters && styles.radiusButtonActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: value === radiusMeters }}
            >
              <Text
                style={[
                  styles.radiusText,
                  value === radiusMeters && styles.radiusTextActive,
                ]}
              >
                {radiusLabel(value)}
              </Text>
            </Pressable>
          ))}
        </View>

        {locationState !== 'ready' && (
          <View style={styles.statusCard}>
            {locationState === 'locating' && <ActivityIndicator color="#D97706" />}
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>
                {locationState === 'locating'
                  ? 'กำลังหาตำแหน่งปัจจุบัน'
                  : locationState === 'denied'
                    ? 'ยังไม่ได้สิทธิ์ตำแหน่ง'
                    : 'GPS ยังไม่พร้อม'}
              </Text>
              {locationError && <Text style={styles.statusBody}>{locationError}</Text>}
            </View>
            {locationState !== 'locating' && (
              <Pressable onPress={() => requestFreshFix().catch(() => {})}>
                <Text style={styles.retryText}>ลองใหม่</Text>
              </Pressable>
            )}
          </View>
        )}

        {tileError && (
          <View style={styles.tileErrorCard}>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>โหลดภาพแผนที่ไม่ได้</Text>
              <Text style={styles.statusBody}>GPS และรายการร้านยังทำงานแยกจากภาพแผนที่</Text>
            </View>
            <Pressable
              onPress={() => {
                setTileError(false);
                setMapKey(value => value + 1);
              }}
            >
              <Text style={styles.retryText}>โหลดแผนที่ใหม่</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.zoomColumn}>
        <Pressable
          onPress={() => {
            const zoom = Math.min(19, currentZoom + 1);
            setCurrentZoom(zoom);
            cameraRef.current?.zoomTo(zoom, { duration: 250 });
          }}
          style={styles.zoomButton}
          accessibilityLabel="ซูมเข้า"
        >
          <Text style={styles.zoomText}>+</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const zoom = Math.max(2, currentZoom - 1);
            setCurrentZoom(zoom);
            cameraRef.current?.zoomTo(zoom, { duration: 250 });
          }}
          style={styles.zoomButton}
          accessibilityLabel="ซูมออก"
        >
          <Text style={styles.zoomText}>−</Text>
        </Pressable>
      </View>

      {!selectedPlace && locationState === 'ready' && (
        <View style={styles.resultsPanel}>
          <View style={styles.resultsHeader}>
            <View style={styles.statusCopy}>
              <Text style={styles.resultsTitle}>
                {hasSearched ? 'ผลการค้นหา' : `ร้านที่พบใน ${radiusLabel(radiusMeters)}`}
              </Text>
              <Text style={styles.resultsCaption}>
                ใกล้ที่สุดจากรายการที่พบใน OSM · ระยะเส้นตรง
              </Text>
            </View>
            {hasSearched && (
              <Pressable
                onPress={() => {
                  searchAbortRef.current?.abort();
                  setHasSearched(false);
                  setSearchText('');
                  setSearchResults([]);
                }}
              >
                <Text style={styles.clearText}>ล้าง</Text>
              </Pressable>
            )}
          </View>

          {displayedState === 'loading' ? (
            <View style={styles.centerStatus}>
              <ActivityIndicator color="#374B2A" />
              <Text style={styles.statusBody}>
                {hasSearched ? 'กำลังค้นหาสถานที่' : 'กำลังค้นหาร้านใกล้ตัว'}
              </Text>
            </View>
          ) : displayedState === 'error' ? (
            <View style={styles.centerStatus}>
              <Text style={styles.errorText}>{displayedError}</Text>
              <Pressable
                onPress={hasSearched ? handleSearchSubmit : () => {
                  const coords = activeCoordsRef.current;
                  if (coords) {
                    loadNearby(coords, radiusMeters).catch(() => {});
                  }
                }}
              >
                <Text style={styles.retryText}>ลองใหม่</Text>
              </Pressable>
            </View>
          ) : displayedState === 'empty' ? (
            <View style={styles.centerStatus}>
              <Text style={styles.emptyText}>
                {hasSearched
                  ? 'ไม่พบสถานที่ที่ตรงกับคำค้นหา'
                  : `ไม่พบร้านในรัศมี ${radiusLabel(radiusMeters)}`}
              </Text>
              {!hasSearched && radiusMeters < 5000 && (
                <Text style={styles.statusBody}>เลือก 3 หรือ 5 กม. เพื่อขยายพื้นที่</Text>
              )}
            </View>
          ) : (
            <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
              {displayedPlaces.map(place => (
                <Pressable
                  key={place.id}
                  onPress={() => handleSelectPlace(place)}
                  style={styles.resultRow}
                  accessibilityRole="button"
                >
                  <View style={styles.resultPin}>
                    <Text>●</Text>
                  </View>
                  <View style={styles.resultCopy}>
                    <Text style={styles.resultName} numberOfLines={1}>{place.name}</Text>
                    <Text style={styles.resultAddress} numberOfLines={1}>{place.displayName}</Text>
                  </View>
                  {place.distanceMeters !== undefined && (
                    <View style={styles.distancePill}>
                      <Text style={styles.distanceText}>
                        {locationServices.formatDistance(place.distanceMeters)}
                      </Text>
                      <Text style={styles.straightText}>เส้นตรง</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {selectedPlace && (
        <View style={styles.destinationPanel}>
          <View style={styles.destinationHeader}>
            <View style={styles.statusCopy}>
              <Text style={styles.destinationTitle}>{selectedPlace.name}</Text>
              <Text style={styles.destinationAddress} numberOfLines={2}>{selectedPlace.displayName}</Text>
              {selectedPlace.distanceMeters !== undefined && (
                <Text style={styles.straightDistance}>
                  ระยะเส้นตรง {locationServices.formatDistance(selectedPlace.distanceMeters)}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => {
                routeAbortRef.current?.abort();
                setSelectedPlace(null);
                setRoutePreview(null);
                setRouteState('idle');
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {routeState === 'loading' && (
            <View style={styles.routeStatus}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.routeStatusText}>กำลังคำนวณเส้นทางเดิน</Text>
            </View>
          )}
          {routeState === 'ready' && routePreview && (
            <View style={styles.routeStats}>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatLabel}>ระยะทางเดิน</Text>
                <Text style={styles.routeStatValue}>
                  {(routePreview.distanceMeters / 1000).toFixed(2)} กม.
                </Text>
              </View>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatLabel}>เวลาเดินโดยประมาณ</Text>
                <Text style={styles.routeStatValue}>
                  {Math.max(1, Math.round(routePreview.durationSeconds / 60))} นาที
                </Text>
              </View>
            </View>
          )}
          {routeState === 'error' && (
            <View style={styles.routeError}>
              <Text style={styles.errorText}>{routeError}</Text>
              <Pressable onPress={() => requestRoute(selectedPlace)}>
                <Text style={styles.retryText}>ลองเส้นทางใหม่</Text>
              </Pressable>
            </View>
          )}

          <Pressable onPress={startRecord} style={styles.goButton} accessibilityRole="button">
            <Text style={styles.goButtonText}>ไปกันเลย</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        onPress={() => Linking.openURL(OSM_CONFIG.attributionUrl)}
        style={styles.attribution}
        accessibilityRole="link"
      >
        <Text style={styles.attributionText}>{OSM_CONFIG.attribution}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F4EB' },
  mapContainer: { ...StyleSheet.absoluteFill },
  map: { flex: 1 },
  topPanel: { position: 'absolute', top: 0, left: 0, right: 0, padding: 14, gap: 8, zIndex: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  backText: { fontSize: 28, lineHeight: 30, color: '#262A22' },
  title: { fontSize: 18, fontWeight: '800', color: '#262A22', backgroundColor: 'rgba(255,255,255,0.94)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  recenterButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  recenterText: { fontSize: 24, color: '#374B2A', fontWeight: '800' },
  searchBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 5, borderWidth: 1, borderColor: '#E4DED2', elevation: 4 },
  searchInput: { flex: 1, color: '#262A22', fontSize: 14, paddingHorizontal: 12, paddingVertical: 8 },
  searchButton: { minWidth: 72, backgroundColor: '#374B2A', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  searchButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  radiusRow: { flexDirection: 'row', alignSelf: 'center', gap: 8 },
  radiusButton: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.pill, borderWidth: 1, borderColor: '#D9D2C5', paddingHorizontal: 15, paddingVertical: 7 },
  radiusButtonActive: { backgroundColor: '#374B2A', borderColor: '#374B2A' },
  radiusText: { color: '#5F665A', fontSize: 12, fontWeight: '700' },
  radiusTextActive: { color: '#FFFFFF' },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF7D6', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#F5D46B' },
  tileErrorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEECE7', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#F5B9A8' },
  statusCopy: { flex: 1 },
  statusTitle: { color: '#262A22', fontSize: 13, fontWeight: '800' },
  statusBody: { color: '#666D61', fontSize: 11, marginTop: 2, lineHeight: 15 },
  retryText: { color: '#1D5D43', fontSize: 12, fontWeight: '800' },
  zoomColumn: { position: 'absolute', right: 14, top: 210, gap: 8, zIndex: 10 },
  zoomButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  zoomText: { fontSize: 24, color: '#262A22', fontWeight: '600' },
  resultsPanel: { position: 'absolute', left: 14, right: 14, bottom: 26, maxHeight: 300, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E4DED2', elevation: 8, zIndex: 25 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  resultsTitle: { color: '#262A22', fontSize: 15, fontWeight: '800' },
  resultsCaption: { color: '#747A70', fontSize: 10, marginTop: 2 },
  clearText: { color: '#9B4B3C', fontSize: 12, fontWeight: '800' },
  centerStatus: { minHeight: 84, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  errorText: { color: '#B42318', fontSize: 12, textAlign: 'center', lineHeight: 17 },
  emptyText: { color: '#535A50', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  resultsList: { maxHeight: 220 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1EDE5' },
  resultPin: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EBF2E5', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  resultCopy: { flex: 1 },
  resultName: { color: '#262A22', fontSize: 13, fontWeight: '800' },
  resultAddress: { color: '#72786E', fontSize: 10, marginTop: 2 },
  distancePill: { alignItems: 'flex-end', marginLeft: 8 },
  distanceText: { color: '#374B2A', fontSize: 11, fontWeight: '800' },
  straightText: { color: '#8A9086', fontSize: 9 },
  destinationPanel: { position: 'absolute', left: 14, right: 14, bottom: 26, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E4DED2', elevation: 9, zIndex: 30 },
  destinationHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  destinationTitle: { color: '#262A22', fontSize: 16, fontWeight: '800' },
  destinationAddress: { color: '#6D7468', fontSize: 11, marginTop: 3, lineHeight: 15 },
  straightDistance: { color: '#7B5A2E', fontSize: 10, fontWeight: '700', marginTop: 4 },
  closeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F2EEE5', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#62685E', fontSize: 20, lineHeight: 22 },
  routeStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', padding: 10, borderRadius: 12 },
  routeStatusText: { color: '#1E4F9A', fontSize: 12, fontWeight: '700' },
  routeStats: { flexDirection: 'row', gap: 8 },
  routeStat: { flex: 1, backgroundColor: '#F6F8F3', borderRadius: 12, padding: 10, alignItems: 'center' },
  routeStatLabel: { color: '#72786E', fontSize: 10, fontWeight: '600' },
  routeStatValue: { color: '#1E3A5F', fontSize: 14, fontWeight: '800', marginTop: 3 },
  routeError: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF4E5', padding: 10, borderRadius: 12 },
  goButton: { backgroundColor: '#374B2A', borderRadius: radius.pill, alignItems: 'center', paddingVertical: 13 },
  goButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  attribution: { position: 'absolute', left: 8, bottom: 4, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, zIndex: 40 },
  attributionText: { color: '#4C5560', fontSize: 9, textDecorationLine: 'underline' },
  placeMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#374B2A', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  placeMarkerSelected: { borderColor: '#2563EB', transform: [{ scale: 1.18 }] },
  placeMarkerText: { color: '#E86A47', fontSize: 12 },
  userMarker: { alignItems: 'center' },
  userDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#38A169', borderWidth: 2, borderColor: '#FFFFFF', marginTop: -5 },
});
