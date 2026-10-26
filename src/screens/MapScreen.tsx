import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Map as MapView,
  Camera,
  Marker,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import { useAppContext } from '../context/AppContext';
import { haversineDistanceMeters } from '../services/locationUtils';
import { colors, font, radius, space } from '../theme';

type Props = {
  onBack: () => void;
  onOpenStore: (storeId: string) => void;
};

const FILTERS = ['ใกล้ฉัน', 'อาหาร', 'เครื่องดื่ม', 'ของหวาน'];
const BANTADTHONG_COORDS: [number, number] = [100.5236, 13.7401]; // [lng, lat]
const MAP_STYLE_URL = 'https://demotiles.maplibre.org/style.json';

export default function MapScreen({ onBack, onOpenStore }: Props) {
  const { merchants, currentLocation, warpToMerchant } = useAppContext();
  const [filter, setFilter] = useState(FILTERS[0]);
  const [selectedId, setSelectedId] = useState<string | null>(
    merchants[0]?.merchantId ?? null,
  );
  const [mapError, setMapError] = useState(false);

  const filteredMerchants = merchants.filter((m) => {
    if (filter === 'ใกล้ฉัน') {
      return true;
    }
    return m.category.includes(filter);
  });

  const selected = merchants.find((m) => m.merchantId === selectedId);

  const getDistanceKm = (coords: { latitude: number; longitude: number }) => {
    if (!currentLocation) {
      return '0.8';
    }
    const meters = haversineDistanceMeters(currentLocation, coords);
    return (meters / 1000).toFixed(1);
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับ"
            hitSlop={8}
          >
            <Text style={font.title}>‹</Text>
          </Pressable>
          <Text style={font.title}>Map</Text>
        </View>
        <View style={styles.search}>
          <Text>🔍</Text>
          <Text style={font.small}>ค้นหาร้านค้า, เมนู, หรือดีลย่านบรรทัดทอง</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
        >
          {FILTERS.map((f) => {
            const on = f === filter;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.pill, on && styles.pillOn]}
              >
                <Text style={[font.small, on && styles.pillTextOn]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.mapContainer}>
        {!mapError ? (
          <MapView
            style={styles.map}
            mapStyle={MAP_STYLE_URL}
            logo={false}
            attribution={false}
            onDidFailLoadingMap={() => setMapError(true)}
          >
            <Camera
              initialViewState={{
                center: currentLocation
                  ? [currentLocation.longitude, currentLocation.latitude]
                  : BANTADTHONG_COORDS,
                zoom: 15,
              }}
            />
            {currentLocation && (
              <UserLocation
                animated={true}
                accuracy={true}
                heading={true}
              />
            )}
            {filteredMerchants.map((m) => (
              <Marker
                key={m.merchantId}
                id={m.merchantId}
                lngLat={[m.location.longitude, m.location.latitude]}
                onPress={() => setSelectedId(m.merchantId)}
              >
                <View
                  style={[
                    styles.pinCircle,
                    m.merchantId === selectedId && styles.pinCircleActive,
                  ]}
                >
                  <Text style={styles.pinEmoji}>
                    {m.merchantId === selectedId ? '📍' : '🏪'}
                  </Text>
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.fallbackMap}>
            <Text style={styles.fallbackText}>
              🗺️ แผนที่พร้อมหมุดร้านค้าจริง ({filteredMerchants.length} ร้าน)
            </Text>
            {filteredMerchants.map((m) => (
              <Pressable
                key={m.merchantId}
                onPress={() => setSelectedId(m.merchantId)}
                style={[
                  styles.fallbackPin,
                  m.merchantId === selectedId && styles.fallbackPinActive,
                ]}
              >
                <Text style={styles.pinEmoji}>
                  {m.merchantId === selectedId ? '📍' : '🏪'} {m.merchantName}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {selected && (
        <View style={styles.sheet}>
          <View style={styles.sheetRow}>
            <View style={styles.thumb}>
              <Text style={styles.thumbIcon}>🏪</Text>
            </View>
            <View style={styles.flex}>
              <Text style={font.h2}>{selected.merchantName}</Text>
              <Text style={font.caption}>
                📍 {getDistanceKm(selected.location)} km • {selected.category}
              </Text>
              <Text style={styles.badge}>{selected.promotion.title}</Text>
            </View>
            <Pressable
              onPress={() => setSelectedId(null)}
              accessibilityRole="button"
              accessibilityLabel="ปิดการเลือก"
              hitSlop={8}
            >
              <Text style={font.h2}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.sheetActions}>
            <Pressable
              onPress={() => warpToMerchant(selected.merchantId)}
              accessibilityRole="button"
              accessibilityLabel="วาร์ปไปหน้าร้านสำหรับเดโม"
              style={[styles.btn, styles.warpBtn]}
            >
              <Text style={styles.warpBtnText}>📍 วาร์ปไปร้าน</Text>
            </Pressable>
            <Pressable
              onPress={() => onOpenStore(selected.merchantId)}
              accessibilityRole="button"
              accessibilityLabel="ดูรายละเอียดและรับคูปอง"
              style={[styles.btn, styles.primaryBtn]}
            >
              <Text style={styles.btnText}>ดูร้าน & แลกดีล ›</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { padding: space.lg, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  pills: { gap: space.sm },
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
  mapContainer: { flex: 1, overflow: 'hidden' },
  map: { flex: 1 },
  fallbackMap: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    padding: space.lg,
    gap: space.md,
    justifyContent: 'center',
  },
  fallbackText: { ...font.body, textAlign: 'center', marginBottom: space.sm },
  fallbackPin: {
    padding: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderColor: colors.border,
    borderWidth: 1,
  },
  fallbackPinActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  pinCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    transform: [{ scale: 1.15 }],
  },
  pinEmoji: { fontSize: 20 },
  sheet: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    padding: space.md,
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderColor: colors.border,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  sheetActions: { flexDirection: 'row', gap: space.sm },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 28 },
  flex: { flex: 1, gap: space.xs },
  badge: {
    ...font.small,
    alignSelf: 'flex-start',
    color: colors.primary,
    fontWeight: '700',
  },
  btn: {
    borderRadius: radius.pill,
    paddingVertical: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  warpBtn: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    flex: 1,
  },
  warpBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    flex: 1.3,
  },
  btnText: { fontSize: 14, fontWeight: '700', color: colors.onPrimary },
});
