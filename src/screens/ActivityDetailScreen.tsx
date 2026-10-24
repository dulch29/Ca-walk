import React from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { activities } from '../data/meMock';
import { colors, font, radius, space } from '../theme';
import { SPORT_ICON, SPORT_LABEL } from './RecordScreen';

type Props = {
  activityId: string;
  onBack: () => void;
};

export default function ActivityDetailScreen({ activityId, onBack }: Props) {
  const a = activities.find(x => x.id === activityId) ?? activities[0];
  const stats = [
    { value: `${a.km} km`, label: 'ระยะทาง' },
    { value: a.steps.toLocaleString(), label: 'ก้าว' },
    { value: `${a.kcal} kcal`, label: 'แคลอรี' },
    { value: `${a.pace} /km`, label: 'เพซ' },
    { value: a.time, label: 'เวลา' },
  ];

  // shortcut: text-only share; reuse the Story screen if an image share is wanted here
  const share = () =>
    Share.share({
      message: `Ca-Walk 🐾 ${SPORT_LABEL[a.sport]} ${
        a.km
      } km · ${a.steps.toLocaleString()} ก้าว`,
    });

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          hitSlop={8}
        >
          <Text style={font.title}>‹</Text>
        </Pressable>
        <Text style={[font.title, styles.flex]}>รายละเอียดกิจกรรม</Text>
        <Pressable
          onPress={share}
          accessibilityRole="button"
          accessibilityLabel="แชร์"
          hitSlop={8}
        >
          <Text style={font.h2}>📤</Text>
        </Pressable>
      </View>

      {/* shortcut: drawn placeholder route, swap for MapLibre polyline when GPS tracks are stored */}
      <View style={styles.map}>
        <View style={[styles.road, styles.roadH]} />
        <View style={[styles.road, styles.roadV]} />
        <Text style={[styles.pin, styles.pinStart]}>🟢</Text>
        <Text style={[styles.pin, styles.pinEnd]}>📍</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>{SPORT_ICON[a.sport]}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={font.h2}>{SPORT_LABEL[a.sport]}</Text>
            <Text style={font.small}>{a.date}</Text>
          </View>
          <Text style={styles.badge}>สำเร็จ</Text>
        </View>
        <View style={styles.grid}>
          {stats.map(s => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={font.small}>{s.label}</Text>
            </View>
          ))}
        </View>
        <Text style={font.small}>📍 Bangkok, Thailand</Text>
      </View>

      <View style={styles.row}>
        <CatAvatar size={80} mood="sit" />
        <Text style={styles.bubble}>เก่งมากเลย!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  map: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    overflow: 'hidden',
  },
  road: { position: 'absolute', backgroundColor: colors.surface },
  roadH: { left: 0, right: 0, top: '50%', height: 12 },
  roadV: { top: 0, bottom: 0, left: '35%', width: 12 },
  pin: { position: 'absolute', fontSize: 22 },
  pinStart: { left: '15%', top: '60%' },
  pinEnd: { right: '15%', top: '20%' },
  card: {
    gap: space.md,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 20 },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimary,
    backgroundColor: colors.primary,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md },
  stat: { width: '33%', alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  bubble: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
    overflow: 'hidden',
  },
});
