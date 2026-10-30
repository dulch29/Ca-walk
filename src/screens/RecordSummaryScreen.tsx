import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import CatAvatar from '../components/CatAvatar';
import { radius, space } from '../theme';
import { formatPaceSeconds } from '../services/locationUtils';
import type { RunSummary } from '../types/activity';
import {
  fmtTime,
  SPORT_ICON,
  SPORT_LABEL,
} from './RecordScreen';

type Props = {
  summary: RunSummary;
  onBack: () => void;
  onStory: () => void;
};

const MONTHS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];
const pad = (n: number) => String(n).padStart(2, '0');
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const thaiDate = (d: Date) =>
  `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;

export const coinsFor = (km: number) => Math.max(1, Math.floor(km * 10));

export default function RecordSummaryScreen({
  summary,
  onBack,
  onStory,
}: Props) {
  const start = new Date(summary.startTime);
  const end = new Date(summary.endTime);
  const coins = coinsFor(summary.km);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          style={styles.backBtn}
          hitSlop={12}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.title}>สรุป</Text>
      </View>

      {/* Main Activity Card */}
      <View style={styles.summaryCard}>
        {/* Sport badge & Date range */}
        <View style={styles.topRow}>
          <View style={styles.sportBadge}>
            <Text style={styles.sportBadgeText}>
              {SPORT_ICON[summary.sport]} {SPORT_LABEL[summary.sport]}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {thaiDate(end)}   {hm(start)} - {hm(end)}
          </Text>
        </View>

        {/* Hero Distance */}
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceValue}>
            {summary.distanceSource === 'gps' ? summary.km.toFixed(2) : '--'}
          </Text>
          <Text style={styles.distanceUnit}>
            {summary.distanceSource === 'gps' ? 'km' : 'GPS distance unavailable'}
          </Text>
        </View>

        {/* 3-Column Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>ก้าว</Text>
            <Text style={styles.statValue}>
              {summary.steps.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Pace เฉลี่ย</Text>
            <Text style={styles.statValue}>
              {formatPaceSeconds(summary.averagePaceSecondsPerKm)} /km
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>เวลา</Text>
            <Text style={styles.statValue}>{fmtTime(summary.seconds)}</Text>
          </View>
        </View>
      </View>

      {/* Cat Encouragement Card */}
      <View style={styles.catCard}>
        <CatAvatar size={84} mood="jump" />
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>สุดยอด! คุณทำได้ดีมากวันนี้</Text>
          <View style={styles.bubbleTail} />
        </View>
      </View>

      {/* Coins Reward Card */}
      <View style={styles.coinsCard}>
        <Text style={styles.coinsTitle}>ได้รับเหรียญ</Text>
        <View style={styles.coinsRewardRow}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="10" fill="#F59E0B" />
            <Circle cx="12" cy="12" r="8" fill="#FBBF24" />
            <SvgText
              x="12"
              y="16"
              fontSize="11"
              fontWeight="900"
              fill="#92400E"
              textAnchor="middle"
            >
              C
            </SvgText>
          </Svg>
          <Text style={styles.coinsAmount}>+{coins}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ดูรายละเอียด"
          style={styles.ghostBtn}
        >
          <Text style={styles.ghostText}>ดูรายละเอียด</Text>
        </Pressable>

        <Pressable
          onPress={onStory}
          accessibilityRole="button"
          accessibilityLabel="สร้าง Story"
          style={styles.storyBtn}
        >
          <Text style={styles.storyBtnText}>สร้าง Story</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 40,
    gap: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginBottom: space.xs,
  },
  backBtn: {
    paddingVertical: space.xs,
    paddingRight: space.xs,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '700',
    color: '#282C24',
    lineHeight: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#282C24',
    letterSpacing: -0.3,
  },

  // Main Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAE4D8',
    padding: space.lg,
    gap: space.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sportBadge: {
    backgroundColor: '#374B2A',
    paddingHorizontal: space.sm + 4,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  sportBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#777D70',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    marginVertical: space.xs,
  },
  distanceValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#21261B',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  distanceUnit: {
    fontSize: 18,
    fontWeight: '800',
    color: '#21261B',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: '#F5F1E9',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A9184',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#21261B',
    fontVariant: ['tabular-nums'],
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#EAE4D8',
  },

  // Cat Encouragement
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE6DA',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  bubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2DCD1',
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  bubbleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A3123',
    lineHeight: 18,
  },
  bubbleTail: {
    position: 'absolute',
    left: -6,
    top: '50%',
    marginTop: -5,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#FFFFFF',
  },

  // Coins Reward
  coinsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAE4D8',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    elevation: 2,
  },
  coinsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#343B2C',
  },
  coinsRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinsAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D97706',
    fontVariant: ['tabular-nums'],
  },

  // Action Buttons
  actionSection: {
    gap: space.sm,
    marginTop: space.sm,
  },
  ghostBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#E2DCD1',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B553D',
  },
  storyBtn: {
    backgroundColor: '#374B2A',
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#374B2A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  storyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
