import React, { useEffect, useState } from 'react';
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
  Marker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import CatAvatar from '../components/CatAvatar';
import { useAppContext } from '../context/AppContext';
import { styles } from './RecordScreen.styles';

const MAP_FALLBACK_BG = require('../../Assests/Images/record_map.jpg');

export type Sport = 'walk' | 'run';
export type RunSummary = {
  sport: Sport;
  seconds: number;
  km: number;
  steps: number;
};

type Phase = 'idle' | 'pick' | 'ready' | 'recording' | 'paused';

type Props = {
  onBack?: () => void;
  onFinish: (summary: RunSummary) => void;
  onCamera: () => void;
};

export const SPORT_LABEL: Record<Sport, string> = { walk: 'เดิน', run: 'วิ่ง' };
export const SPORT_ICON: Record<Sport, string> = { walk: '🚶', run: '🏃' };

const pad = (n: number) => String(n).padStart(2, '0');
export const fmtTime = (s: number) =>
  `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
export const fmtPace = (seconds: number, km: number) => {
  if (km <= 0) {
    return '0:00';
  }
  const p = Math.round(seconds / km);
  return `${Math.floor(p / 60)}:${pad(p % 60)}`;
};

const BUBBLE: Record<Phase, string> = {
  idle: 'เลือกกีฬาก่อนนะ!',
  pick: 'วันนี้เดินหรือวิ่งดี?',
  ready: 'พร้อมแล้ว ไปกันเลย!',
  recording: 'เก่งมากเลย!',
  paused: 'พักก่อนนะ แล้วค่อยไปต่อกัน!',
};

// Bangkok Lumpini / Bantadthong center coordinates [lng, lat]
const BANGKOK_COORDS: [number, number] = [100.5417, 13.7314];

// OpenStreetMap raster tiles style (100% open, reliable, accurate, no API key required)
const OSM_STYLE = JSON.stringify({
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
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

const ROUTE_LINE_STYLE = {
  lineColor: '#38A169',
  lineWidth: 6,
  lineCap: 'round',
  lineJoin: 'round',
} as const;

export default function RecordScreen({ onBack, onFinish, onCamera }: Props) {
  const {
    activeSession,
    startRunSession,
    endRunSession,
    speedFraudActive,
    trackingError,
    currentLocation,
    addMockDistance,
  } = useAppContext();

  const [phase, setPhase] = useState<Phase>(() =>
    activeSession ? 'recording' : 'idle',
  );
  const [sport, setSport] = useState<Sport>('walk');
  const [mapError, setMapError] = useState(false);

  const seconds =
    activeSession?.durationSeconds ??
    (phase === 'recording' || phase === 'paused' ? 1938 : 0);
  const km =
    activeSession?.distanceKm ??
    (phase === 'recording' || phase === 'paused' ? 3.24 : 0);
  const steps =
    activeSession?.steps ??
    (phase === 'recording' || phase === 'paused' ? 4892 : 0);
  const pace =
    activeSession?.currentPace && activeSession.currentPace !== '-- /km'
      ? activeSession.currentPace
      : km > 0
      ? `${fmtPace(seconds, km)} /km`
      : '6:42 /km';
  const active = phase === 'recording' || phase === 'paused';

  // Current GPS point [lng, lat]
  const currentLngLat: [number, number] = currentLocation
    ? [currentLocation.longitude, currentLocation.latitude]
    : BANGKOK_COORDS;

  // Real route coordinate history for polyline trail
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([
    [BANGKOK_COORDS[0] - 0.003, BANGKOK_COORDS[1] - 0.004],
    [BANGKOK_COORDS[0] - 0.0015, BANGKOK_COORDS[1] - 0.002],
    BANGKOK_COORDS,
  ]);

  // Append new GPS points as user moves
  useEffect(() => {
    if (currentLocation && active) {
      setRouteCoords(prev => {
        const last = prev[prev.length - 1];
        if (
          !last ||
          last[0] !== currentLocation.longitude ||
          last[1] !== currentLocation.latitude
        ) {
          return [...prev, [currentLocation.longitude, currentLocation.latitude]];
        }
        return prev;
      });
    }
  }, [currentLocation, active]);

  const chooseSport = (s: Sport) => {
    setSport(s);
    setPhase('ready');
  };

  const handleStart = async () => {
    try {
      if (!activeSession) {
        await startRunSession();
      }
      setPhase('recording');
    } catch (e) {
      Alert.alert(
        'ขออภัย',
        e instanceof Error ? e.message : 'ไม่สามารถเริ่มการบันทึกได้',
      );
    }
  };

  const handlePause = () => {
    setPhase('paused');
  };

  const handleResume = () => {
    setPhase('recording');
  };

  const handleFinish = () => {
    const completed = endRunSession();
    const finalSeconds = completed?.durationSeconds ?? seconds;
    const finalKm = completed?.distanceKm ?? km;
    const finalSteps = completed?.steps ?? steps;

    onFinish({
      sport,
      seconds: finalSeconds,
      km: finalKm,
      steps: finalSteps,
    });
    setPhase('ready');
  };

  return (
    <View style={styles.root}>
      {/* Real Google Map Container */}
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
              initialViewState={{
                center: currentLngLat,
                zoom: 16,
              }}
              center={currentLngLat}
              zoom={16}
              minZoom={13}
            />

            {/* Real GPS Route Polyline Trail on Actual Streets */}
            {active && routeCoords.length > 1 && (
              <GeoJSONSource
                id="live-route-source"
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: routeCoords,
                  },
                }}
              >
                <Layer
                  id="live-route-line"
                  type="line"
                  style={ROUTE_LINE_STYLE}
                />
              </GeoJSONSource>
            )}

            {/* User GPS Cat Marker replacing standard blue dot */}
            <Marker id="user-cat-marker" lngLat={currentLngLat}>
              <View style={styles.catMarkerWrap}>
                {/* Speech Bubble */}
                <View style={styles.speechBubble}>
                  <Text style={styles.speechText}>
                    {speedFraudActive ? 'เมี้ยว! วิ่งเร็วเกินไปแล้ว~' : BUBBLE[phase]}
                  </Text>
                  <View style={styles.speechTail} />
                </View>

                {/* Animated Cat Avatar */}
                <Pressable
                  onPress={() => active && addMockDistance(0.25)}
                  accessibilityRole="button"
                  accessibilityLabel="แตะตัวแมวเพื่อเพิ่มระยะทดสอบ"
                  hitSlop={10}
                >
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
                </Pressable>

                {/* Pulsing GPS Halo & Blue Dot */}
                <View style={styles.gpsHalo}>
                  <View style={styles.gpsInnerDot} />
                </View>
              </View>
            </Marker>
          </MapView>
        ) : (
          /* Offline Fallback styled Google Maps image */
          <Image
            source={MAP_FALLBACK_BG}
            style={styles.mapBgImage}
            resizeMode="cover"
            accessibilityLabel="แผนที่กรุงเทพ"
          />
        )}
      </View>

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
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2.8}>
              <Path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          {!active && <Text style={styles.headerTitle}>ออกเดินทาง</Text>}
        </Pressable>
      </View>

      {/* Top Floating Timer Pill (Screens 4 & 5) */}
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
          <Text style={styles.gpsText}>GPS ดีมาก</Text>
        </View>
      )}

      {/* Anti-fraud / Speed warning banner */}
      {speedFraudActive && (
        <View style={styles.bannerCard}>
          <Text style={styles.bannerText}>
            🚨 ความเร็วเกิน 18 km/h! น้องแมววิ่งตามไม่ทัน
          </Text>
        </View>
      )}

      {trackingError && !speedFraudActive && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>⚠️ {trackingError}</Text>
        </View>
      )}

      {/* Floating 3-Column Stats Card (Screens 4 & 5) */}
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
            <Text style={styles.locationText}>📍 Bangkok, Thailand</Text>
          </View>
        </View>
      )}

      {/* Bottom Floating Controls */}
      <View style={styles.bottomControlsContainer}>
        {/* Phase: Idle / Ready (Screens 1 & 3) */}
        {!active && phase !== 'pick' && (
          <View style={styles.readyControlsRow}>
            {/* Left: Sport Selector Button */}
            <View style={styles.controlBtnCol}>
              <Pressable
                onPress={() => setPhase('pick')}
                accessibilityRole="button"
                accessibilityLabel="เลือกประเภทกีฬา"
                style={styles.circleBtnSoft}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#374B2A" strokeWidth={2}>
                  {sport === 'walk' ? (
                    <>
                      <Circle cx="12" cy="4" r="2" fill="#374B2A" stroke="none" />
                      <Path d="M10 22v-6l-2-2v-4l4-2 3 3v5" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M14 14l2 8" strokeLinecap="round" />
                    </>
                  ) : (
                    <>
                      <Circle cx="15" cy="4" r="2" fill="#374B2A" stroke="none" />
                      <Path d="M9 20l3-5-2-3 4-3 3 2v4" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M6 14l3-2" strokeLinecap="round" />
                    </>
                  )}
                </Svg>
              </Pressable>
              <Text style={styles.controlBtnLabel}>
                {phase === 'idle' ? 'เลือกกีฬา' : SPORT_LABEL[sport]}
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
                <Svg width={30} height={30} viewBox="0 0 24 24" fill="#FFFFFF" style={styles.circleBtnMainPlay}>
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
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#374B2A" strokeWidth={2}>
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <Circle cx="12" cy="13" r="4" />
                </Svg>
              </Pressable>
              <Text style={styles.controlBtnLabel}>กล้อง</Text>
            </View>
          </View>
        )}

        {/* Phase: Sport Picker Opened (Screen 2) */}
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

        {/* Phase: Recording Active (Screen 4) */}
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
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#374B2A" strokeWidth={2}>
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <Circle cx="12" cy="13" r="4" />
                </Svg>
              </Pressable>
              <Text style={styles.controlBtnLabel}>กล้อง</Text>
            </View>
          </View>
        )}

        {/* Phase: Paused (Screen 5) */}
        {phase === 'paused' && (
          <View style={styles.pausedControlsRow}>
            {/* Left: Finish (Stop) */}
            <View style={styles.controlBtnCol}>
              <Pressable
                onPress={handleFinish}
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
                <Svg width={30} height={30} viewBox="0 0 24 24" fill="#FFFFFF" style={styles.circleBtnMainPlay}>
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
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#374B2A" strokeWidth={2}>
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
