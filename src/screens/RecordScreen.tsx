import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  Text,
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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import CatAvatar from '../components/CatAvatar';
import { useAppContext } from '../context/AppContext';
import { styles } from './RecordScreen.styles';
import { OSM_CONFIG, OSM_MAP_STYLE } from '../services/osmMapService';
import { haversineDistanceMeters } from '../services/locationUtils';
import { formatDistance } from '../services/osmLocationService';

const MAP_FALLBACK_BG = require('../../Assests/Images/record_map.jpg');

import type { RunSummary, Sport } from '../types/activity';
import {
  canFinishAtDestination,
  createRunSummary,
} from '../services/completedActivity';
export type { RunSummary, Sport } from '../types/activity';

type Phase = 'idle' | 'pick' | 'ready' | 'recording' | 'paused';

type Props = {
  onBack?: () => void;
  onFinish: (summary: RunSummary, openStory?: boolean) => void;
  onCamera: () => void;
};

export const SPORT_LABEL: Record<Sport, string> = { walk: 'เดิน', run: 'วิ่ง' };
export const SPORT_ICON: Record<Sport, string> = { walk: '🚶', run: '🏃' };

const pad = (n: number) => String(n).padStart(2, '0');
export const fmtTime = (s: number) =>
  `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;

export const fmtPace = (seconds: number, km: number): string => {
  if (km <= 0.005 || seconds <= 0) {
    return '--';
  }
  const minPerKm = seconds / 60 / km;
  if (!Number.isFinite(minPerKm) || minPerKm <= 0 || minPerKm > 60) {
    return '--';
  }
  return minPerKm.toFixed(2);
};

const BUBBLE: Record<Phase, string> = {
  idle: 'เลือกกีฬาก่อนนะ!',
  pick: 'วันนี้เดินหรือวิ่งดี?',
  ready: 'พร้อมแล้ว ไปกันเลย!',
  recording: 'เก่งมากเลย!',
  paused: 'พักก่อนนะ แล้วค่อยไปต่อกัน!',
};

// Default Bangkok coordinates if GPS is not yet acquired (used strictly for initial camera positioning)
const DEFAULT_MAP_CENTER: [number, number] = [100.5417, 13.7314];

// High-contrast actual GPS recorded track styles
const ACTUAL_TRACK_CASING_STYLE = {
  lineColor: '#17361A',
  lineWidth: 8,
  lineCap: 'round',
  lineJoin: 'round',
} as const;

const ACTUAL_TRACK_LINE_STYLE = {
  lineColor: '#38A169',
  lineWidth: 5,
  lineCap: 'round',
  lineJoin: 'round',
} as const;

const ROUTE_PREVIEW_CASING_STYLE = {
  lineColor: '#1E3A8A',
  lineWidth: 6,
  lineCap: 'round',
  lineJoin: 'round',
} as const;

const ROUTE_PREVIEW_LINE_STYLE = {
  lineColor: '#3B82F6',
  lineWidth: 4,
  lineDasharray: [2, 1.5] as number[],
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
};

export default function RecordScreen({ onBack, onFinish, onCamera }: Props) {
  const {
    activeSession,
    startRunSession,
    pauseRunSession,
    resumeRunSession,
    endRunSession,
    speedFraudActive,
    trackingError,
    currentLocation,
    selectedDestination,
    requestLocationPermission,
  } = useAppContext();

  const [localPhase, setLocalPhase] = useState<Phase>('ready');
  const [sport, setSport] = useState<Sport>('walk');
  const [mapError, setMapError] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(16);
  const cameraRef = useRef<CameraRef>(null);
  const hasCenteredInitialFix = useRef(false);

  // Prompt user for location permission on mount to observe and display user position
  useEffect(() => {
    requestLocationPermission().catch(() => {});
  }, [requestLocationPermission]);

  // Active session status overrides local phase
  const phase: Phase = activeSession
    ? activeSession.status === 'paused'
      ? 'paused'
      : 'recording'
    : localPhase;

  const active = phase === 'recording' || phase === 'paused';

  // Genuine statistics derived strictly from session data (NO mock fallback)
  const seconds = activeSession?.durationSeconds ?? 0;
  const km = activeSession?.distanceKm ?? 0;
  const steps = activeSession?.steps ?? 0;
  const pace =
    activeSession?.currentPace && activeSession.currentPace !== '-- /km'
      ? activeSession.currentPace
      : km > 0.005 && seconds > 0
      ? `${fmtPace(seconds, km)} /km`
      : '-- /km';

  const hasGpsFix = currentLocation !== null;
  const currentLngLat: [number, number] | null = useMemo(
    () =>
      currentLocation
        ? [currentLocation.longitude, currentLocation.latitude]
        : null,
    [currentLocation],
  );

  // Center camera when initial GPS fix is obtained
  useEffect(() => {
    if (currentLngLat && !hasCenteredInitialFix.current) {
      hasCenteredInitialFix.current = true;
      cameraRef.current?.flyTo({
        center: currentLngLat,
        zoom: 16,
        duration: 800,
      });
      setCurrentZoom(16);
    }
  }, [currentLngLat]);

  // Actual recorded GPS track coordinates from session
  const actualTrackCoords = activeSession?.trackCoordinates ?? [];

  // Active destination (from session or selected before start)
  const activeDestination =
    activeSession?.destination ?? selectedDestination ?? null;

  // Track waypoint progress along the destination route
  const [passedWaypointIndex, setPassedWaypointIndex] = useState(0);
  const [isDestinationReached, setIsDestinationReached] = useState(false);
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);

  // Auto-follow user camera during active recording
  useEffect(() => {
    if (phase === 'recording' && currentLngLat && isAutoFollowing) {
      cameraRef.current?.flyTo({
        center: currentLngLat,
        zoom: currentZoom,
        duration: 500,
      });
    }
  }, [currentLngLat, phase, isAutoFollowing, currentZoom]);

  // Dynamic route trimming: remove waypoints already traversed behind the user
  const { remainingRouteCoords, distanceToDestinationMeters } = useMemo(() => {
    if (
      !activeDestination?.routeCoordinates ||
      activeDestination.routeCoordinates.length < 2
    ) {
      return { remainingRouteCoords: [], distanceToDestinationMeters: null };
    }

    const fullRoute = activeDestination.routeCoordinates;
    const destCoord = activeDestination.coordinates;

    if (!currentLngLat) {
      return {
        remainingRouteCoords: fullRoute,
        distanceToDestinationMeters: null,
      };
    }

    const distToDest = Math.round(
      haversineDistanceMeters(
        { latitude: currentLngLat[1], longitude: currentLngLat[0] },
        { latitude: destCoord[1], longitude: destCoord[0] },
      ),
    );

    if (distToDest <= 25) {
      if (!isDestinationReached) {
        setIsDestinationReached(true);
      }
      return {
        remainingRouteCoords: [],
        distanceToDestinationMeters: distToDest,
      };
    }

    // Look ahead from passedWaypointIndex to find closest forward waypoint along the route
    let closestIndex = passedWaypointIndex;
    let minDistance = Infinity;
    const lookaheadLimit = Math.min(
      passedWaypointIndex + 20,
      fullRoute.length - 1,
    );

    for (let i = passedWaypointIndex; i <= lookaheadLimit; i++) {
      const wp = fullRoute[i];
      const d = haversineDistanceMeters(
        { latitude: currentLngLat[1], longitude: currentLngLat[0] },
        { latitude: wp[1], longitude: wp[0] },
      );
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    }

    // If within 35 meters of this forward waypoint, advance passed index
    if (minDistance <= 35 && closestIndex > passedWaypointIndex) {
      setPassedWaypointIndex(closestIndex);
    }

    if (closestIndex >= fullRoute.length - 1) {
      return {
        remainingRouteCoords: [],
        distanceToDestinationMeters: distToDest,
      };
    }

    // Connect from current user location forward to remaining waypoints
    const remaining: Array<[number, number]> = [
      currentLngLat,
      ...fullRoute.slice(closestIndex + 1),
    ];

    return {
      remainingRouteCoords: remaining,
      distanceToDestinationMeters: distToDest,
    };
  }, [
    activeDestination,
    currentLngLat,
    isDestinationReached,
    passedWaypointIndex,
  ]);

  const chooseSport = (s: Sport) => {
    setSport(s);
    setLocalPhase('ready');
  };

  const handleStart = async () => {
    try {
      if (!activeSession) {
        setPassedWaypointIndex(0);
        setIsDestinationReached(false);
        setIsAutoFollowing(true);
        await startRunSession(activeDestination ?? undefined);
      }
    } catch (e) {
      Alert.alert(
        'ขออภัย',
        e instanceof Error ? e.message : 'ไม่สามารถเริ่มการบันทึกได้',
      );
    }
  };

  const handlePause = () => {
    pauseRunSession();
  };

  const handleResume = () => {
    resumeRunSession();
  };

  const handleRecenter = () => {
    setIsAutoFollowing(true);
    if (currentLngLat) {
      cameraRef.current?.flyTo({
        center: currentLngLat,
        zoom: 16,
        duration: 600,
      });
      setCurrentZoom(16);
    } else {
      cameraRef.current?.flyTo({
        center: DEFAULT_MAP_CENTER,
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

  const canFinishArrived =
    !speedFraudActive && canFinishAtDestination(activeSession);
  const handleFinish = (reason: RunSummary['completionReason'] = 'manual') => {
    if (
      reason === 'arrived' &&
      (speedFraudActive || !canFinishAtDestination(activeSession))
    ) {
      Alert.alert(
        'ยังยืนยันจุดหมายไม่ได้',
        'รอสัญญาณ GPS ใกล้จุดหมาย แล้วลองอีกครั้ง',
      );
      return;
    }
    const completed = endRunSession();
    if (!completed) {
      return;
    }
    onFinish(createRunSummary(completed, sport, reason), reason === 'arrived');
    setLocalPhase('ready');
  };

  return (
    <View style={styles.root}>
      {/* Real OSM Map Container */}
      <View style={styles.mapContainer}>
        {!mapError ? (
          <MapView
            style={styles.mapView}
            mapStyle={OSM_MAP_STYLE}
            logo={false}
            attribution={false}
            onTouchStart={() => setIsAutoFollowing(false)}
            onDidFailLoadingMap={() => setMapError(true)}
          >
            <Camera
              ref={cameraRef}
              initialViewState={{
                center: currentLngLat ?? DEFAULT_MAP_CENTER,
                zoom: hasGpsFix ? 16 : 14,
              }}
              center={currentLngLat ?? DEFAULT_MAP_CENTER}
              zoom={currentZoom}
              minZoom={OSM_CONFIG.minZoom}
              maxZoom={OSM_CONFIG.maxZoom}
            />

            {/* Destination Walking Route Preview (Dynamically trimmed as user moves) */}
            {remainingRouteCoords.length > 1 && (
              <GeoJSONSource
                id="destination-route-preview-source"
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: remainingRouteCoords,
                  },
                }}
              >
                <Layer
                  id="preview-casing"
                  type="line"
                  style={ROUTE_PREVIEW_CASING_STYLE}
                />
                <Layer
                  id="preview-line"
                  type="line"
                  style={ROUTE_PREVIEW_LINE_STYLE}
                />
              </GeoJSONSource>
            )}

            {/* Destination Marker on Map */}
            {activeDestination && (
              <Marker
                id="destination-pin"
                lngLat={activeDestination.coordinates}
              >
                <View style={styles.destPinWrap}>
                  <View style={styles.destPinBadge}>
                    <Text style={styles.destPinText} numberOfLines={1}>
                      🏁 {activeDestination.name}
                    </Text>
                  </View>
                </View>
              </Marker>
            )}

            {/* Actual Recorded GPS Track from Sensors/Location */}
            {active && actualTrackCoords.length > 1 && (
              <GeoJSONSource
                id="live-actual-route-source"
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: actualTrackCoords,
                  },
                }}
              >
                <Layer
                  id="live-route-casing"
                  type="line"
                  style={ACTUAL_TRACK_CASING_STYLE}
                />
                <Layer
                  id="live-route-line"
                  type="line"
                  style={ACTUAL_TRACK_LINE_STYLE}
                />
              </GeoJSONSource>
            )}

            {/* Start point badge for actual track */}
            {active && actualTrackCoords.length > 0 && (
              <Marker id="route-start-pin" lngLat={actualTrackCoords[0]}>
                <View style={styles.startPinWrap}>
                  <View style={styles.startPinBadge}>
                    <Text style={styles.startPinText}>🚩 เริ่มต้น</Text>
                  </View>
                </View>
              </Marker>
            )}

            {/* User GPS Cat Marker - Rendered ONLY when GPS fix is real */}
            {hasGpsFix && currentLngLat && (
              <Marker id="user-cat-marker" lngLat={currentLngLat}>
                <View style={styles.catMarkerWrap}>
                  <View style={styles.speechBubble}>
                    <Text style={styles.speechText}>
                      {speedFraudActive
                        ? 'เมี้ยว! เร็วเกิน Pace 2 แล้ว~'
                        : BUBBLE[phase]}
                    </Text>
                    <View style={styles.speechTail} />
                  </View>

                  <CatAvatar
                    size={84}
                    mood={
                      speedFraudActive
                        ? 'jump'
                        : phase === 'recording'
                        ? 'walk'
                        : phase === 'paused'
                        ? 'sleep'
                        : 'sit'
                    }
                  />

                  <View style={styles.gpsHalo}>
                    <View style={styles.gpsInnerDot} />
                  </View>
                </View>
              </Marker>
            )}
          </MapView>
        ) : (
          <Image
            source={MAP_FALLBACK_BG}
            style={styles.mapBgImage}
            resizeMode="cover"
            accessibilityLabel="แผนที่ออฟไลน์"
          />
        )}
      </View>

      {/* Visible OSM Attribution Pill (Required by Policy) */}
      <View style={styles.osmAttributionPill} pointerEvents="none">
        <Text style={styles.osmAttributionText}>{OSM_CONFIG.attribution}</Text>
      </View>

      {/* Waiting for GPS pill when no location fix - allows tapping to request permission */}
      {!hasGpsFix && (
        <Pressable
          onPress={() => {
            requestLocationPermission().catch(() => {});
          }}
          style={styles.gpsWaitingPill}
          accessibilityRole="button"
          accessibilityLabel="ขออนุญาตจับตำแหน่งผู้ใช้"
          hitSlop={8}
        >
          <Text style={styles.gpsWaitingText}>
            📍 ขออนุญาตจับตำแหน่งผู้ใช้ (แตะเพื่ออนุญาต)
          </Text>
        </Pressable>
      )}

      {/* Top Header Floating Pill */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับไปหน้าแรก"
          style={[styles.headerPill, active && styles.headerPillCompact]}
          hitSlop={10}
        >
          <View style={styles.backBtnCircle}>
            <Svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#262A22"
              strokeWidth={2.8}
            >
              <Path
                d="M15 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          {!active && <Text style={styles.headerTitle}>ออกเดินทาง</Text>}
        </Pressable>
      </View>

      {/* Top Floating Timer Pill */}
      {active && (
        <View style={styles.topFloatingArea}>
          <View style={styles.timerPill}>
            {phase === 'paused' && (
              <View style={styles.pausedBadge}>
                <Text style={styles.pausedBadgeText}>หยุดชั่วคราว</Text>
              </View>
            )}
            <View style={styles.timerRow}>
              {phase === 'recording' && <View style={styles.timerDot} />}
              <Text style={styles.timerText}>{fmtTime(seconds)}</Text>
            </View>
            {phase === 'recording' && (
              <Text style={styles.timerSubtext}>กำลังบันทึก...</Text>
            )}
          </View>
        </View>
      )}

      {/* GPS Status Pill */}
      {active && (
        <View style={styles.gpsPill}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsText}>
            {hasGpsFix ? 'GPS ดีมาก' : 'ค้นหา GPS...'}
          </Text>
        </View>
      )}

      {/* Anti-fraud / Speed warning banner */}
      {speedFraudActive && (
        <View style={styles.bannerCard}>
          <Text style={styles.bannerText}>
            🚨 ความเร็วเร็วกว่า Pace 2 (&gt;30 km/h)! กำลังนั่งยานพาหนะหรือไม่?
          </Text>
        </View>
      )}

      {trackingError && !speedFraudActive && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>⚠️ {trackingError}</Text>
        </View>
      )}

      {/* Floating 3-Column Stats Card */}
      {active && (
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{km.toFixed(2)} km</Text>
              <Text style={styles.statLabel}>ระยะทาง</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{steps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>ก้าว</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{pace}</Text>
              <Text style={styles.statLabel}>Pace</Text>
            </View>
          </View>
          <View style={styles.locationSubtitle}>
            <Text style={styles.locationText} numberOfLines={1}>
              {activeDestination
                ? isDestinationReached
                  ? `🎉 ถึง ${activeDestination.name} แล้ว!`
                  : `🏁 ปลายทาง: ${activeDestination.name}${
                      distanceToDestinationMeters !== null
                        ? ` (เหลือ ${formatDistance(distanceToDestinationMeters)})`
                        : ''
                    }`
                : '📍 กำลังบันทึกกิจกรรม'}
            </Text>
          </View>
        </View>
      )}

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

      {/* Bottom Floating Controls */}
      <View style={styles.bottomControlsContainer}>
        {/* Phase: Idle / Ready */}
        {!active && phase !== 'pick' && (
          <View style={styles.readyControlsRow}>
            {/* Left: Sport Selector Button */}
            <View style={styles.controlBtnCol}>
              <Pressable
                onPress={() => setLocalPhase('pick')}
                accessibilityRole="button"
                accessibilityLabel="เลือกประเภทกีฬา"
                style={styles.circleBtnSoft}
              >
                <Svg
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#374B2A"
                  strokeWidth={2}
                >
                  {sport === 'walk' ? (
                    <>
                      <Circle cx="12" cy="4" r="2" fill="#374B2A" stroke="none" />
                      <Path
                        d="M10 22v-6l-2-2v-4l4-2 3 3v5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M14 14l2 8" strokeLinecap="round" />
                    </>
                  ) : (
                    <>
                      <Circle cx="15" cy="4" r="2" fill="#374B2A" stroke="none" />
                      <Path
                        d="M9 20l3-5-2-3 4-3 3 2v4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M6 14l3-2" strokeLinecap="round" />
                    </>
                  )}
                </Svg>
              </Pressable>
              <Text style={styles.controlBtnLabel}>
                {SPORT_LABEL[sport]}
              </Text>
            </View>

            {/* Center: Large Start Button */}
            <View style={styles.controlBtnCol}>
              <Pressable
                onPress={handleStart}
                accessibilityRole="button"
                accessibilityLabel="เริ่มออกเดินทาง"
                style={styles.circleBtnMain}
              >
                <Svg
                  width={30}
                  height={30}
                  viewBox="0 0 24 24"
                  fill="#FFFFFF"
                  style={styles.circleBtnMainPlay}
                >
                  <Path d="M8 5v14l11-7z" />
                </Svg>
              </Pressable>
              <Text style={styles.controlBtnLabelMain}>เริ่ม</Text>
            </View>

            {/* Right: Camera Button */}
            <View style={styles.controlBtnCol}>
              <Pressable
                onPress={onCamera}
                accessibilityRole="button"
                accessibilityLabel="ถ่ายรูปกิจกรรม"
                style={styles.circleBtnSoft}
              >
                <Svg
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#374B2A"
                  strokeWidth={2}
                >
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <Circle cx="12" cy="13" r="4" />
                </Svg>
              </Pressable>
              <Text style={styles.controlBtnLabel}>กล้อง</Text>
            </View>
          </View>
        )}

        {/* Phase: Sport Picker Opened */}
        {!active && phase === 'pick' && (
          <View style={styles.sportPickerRow}>
            <Pressable
              onPress={() => chooseSport('walk')}
              accessibilityRole="button"
              accessibilityLabel="เลือกเดิน"
              style={[
                styles.sportOptionPill,
                sport === 'walk' && styles.sportOptionPillActive,
              ]}
            >
              <Text style={styles.sportOptionText}>{SPORT_ICON.walk}</Text>
              <Text
                style={[
                  styles.sportOptionText,
                  sport === 'walk' && styles.sportOptionTextActive,
                ]}
              >
                เดิน
              </Text>
            </Pressable>

            <Pressable
              onPress={() => chooseSport('run')}
              accessibilityRole="button"
              accessibilityLabel="เลือกวิ่ง"
              style={[
                styles.sportOptionPill,
                sport === 'run' && styles.sportOptionPillActive,
              ]}
            >
              <Text style={styles.sportOptionText}>{SPORT_ICON.run}</Text>
              <Text
                style={[
                  styles.sportOptionText,
                  sport === 'run' && styles.sportOptionTextActive,
                ]}
              >
                วิ่ง
              </Text>
            </Pressable>
          </View>
        )}

        {active && canFinishArrived && (
          <Pressable
            onPress={() => handleFinish('arrived')}
            accessibilityRole="button"
            accessibilityLabel="จบและสร้างสตอรี่"
            style={styles.arrivalStoryButton}
          >
            <Text style={styles.arrivalStoryText}>
              ถึงจุดหมายแล้ว · จบและสร้างสตอรี่
            </Text>
          </Pressable>
        )}

        {/* Phase: Recording Active */}
        {phase === 'recording' && (
          <View style={styles.recordingControlsRow}>
            <Pressable
              onPress={handlePause}
              accessibilityRole="button"
              accessibilityLabel="หยุดชั่วคราว"
              style={styles.pausePillBtn}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="#282C24">
                <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </Svg>
              <Text style={styles.pausePillText}>หยุดชั่วคราว</Text>
            </Pressable>

            <View style={styles.controlBtnCol}>
              <Pressable
                onPress={onCamera}
                accessibilityRole="button"
                accessibilityLabel="ถ่ายรูปกิจกรรม"
                style={styles.circleBtnSoft}
              >
                <Svg
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#374B2A"
                  strokeWidth={2}
                >
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <Circle cx="12" cy="13" r="4" />
                </Svg>
              </Pressable>
              <Text style={styles.controlBtnLabel}>กล้อง</Text>
            </View>
          </View>
        )}

        {/* Phase: Paused */}
        {phase === 'paused' && (
          <View style={styles.pausedControlsRow}>
            {/* Left: Finish (Stop) */}
            <View style={styles.controlBtnCol}>
              <Pressable
                onPress={() => handleFinish()}
                accessibilityRole="button"
                accessibilityLabel="จบกิจกรรม"
                style={styles.stopCircleBtn}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="#B91C1C">
                  <Path d="M6 6h12v12H6z" />
                </Svg>
              </Pressable>
              <Text style={styles.stopCircleLabel}>จบ</Text>
            </View>

            {/* Center: Resume (Play) */}
            <View style={styles.controlBtnCol}>
              <Pressable
                onPress={handleResume}
                accessibilityRole="button"
                accessibilityLabel="ไปต่อ"
                style={styles.resumeCircleBtn}
              >
                <Svg
                  width={30}
                  height={30}
                  viewBox="0 0 24 24"
                  fill="#FFFFFF"
                  style={styles.circleBtnMainPlay}
                >
                  <Path d="M8 5v14l11-7z" />
                </Svg>
              </Pressable>
              <Text style={styles.resumeCircleLabel}>ต่อ</Text>
            </View>

            {/* Right: Camera */}
            <View style={styles.controlBtnCol}>
              <Pressable
                onPress={onCamera}
                accessibilityRole="button"
                accessibilityLabel="ถ่ายรูปกิจกรรม"
                style={styles.circleBtnSoft}
              >
                <Svg
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#374B2A"
                  strokeWidth={2}
                >
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <Circle cx="12" cy="13" r="4" />
                </Svg>
              </Pressable>
              <Text style={styles.controlBtnLabel}>กล้อง</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
