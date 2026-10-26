import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import BottomTabBar, { TabName } from '../components/BottomTabBar';
import CatAvatar from '../components/CatAvatar';
import { QuestKind } from '../data/mock';
import { radius } from '../theme';

type Props = {
  onBack: () => void;
  onGo: () => void;
  onTabPress?: (tab: TabName) => void;
};

const FILTERS: { label: string; kind: QuestKind | 'all' }[] = [
  { label: 'ทั้งหมด', kind: 'all' },
  { label: 'รายวัน', kind: 'daily' },
  { label: 'รายสัปดาห์', kind: 'weekly' },
  { label: 'พิเศษ', kind: 'special' },
];

// Daily Runner Icon in semi-transparent circle
function DailyRunnerWhiteIcon() {
  return (
    <View style={styles.dailyIconCircle}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle cx="13" cy="5" r="2.5" fill="#FFFFFF" />
        <Path
          d="M 12 8 L 9 12 L 5 13 M 9 12 L 13 16 L 10 21 M 12 10 L 16 12 L 19 11 M 13 16 L 17 18"
          stroke="#FFFFFF"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

// Weekly Runner Green Icon
function WeeklyRunnerGreenIcon() {
  return (
    <View style={styles.weeklyIconCircle}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx="13" cy="5" r="2.5" fill="#55684B" />
        <Path
          d="M 12 8 L 9 12 L 5 13 M 9 12 L 13 16 L 10 21 M 12 10 L 16 12 L 19 11 M 13 16 L 17 18"
          stroke="#55684B"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

// Special Event Autumn Foliage Card Art
function AutumnArtBanner() {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      {/* Warm Autumn Background Gradient */}
      <Rect x="0" y="0" width="100%" height="100%" fill="#FBF0E2" rx={20} />
      {/* Distant Hills / Trees */}
      <Path
        d="M -10 90 Q 60 40 140 70 Q 220 30 300 65 Q 360 45 420 90 Z"
        fill="#F6D5B4"
      />
      {/* Orange & Golden Trees */}
      <Circle cx="40" cy="55" r="22" fill="#E8833A" opacity={0.6} />
      <Circle cx="85" cy="50" r="26" fill="#D96328" opacity={0.5} />
      <Circle cx="320" cy="45" r="28" fill="#E8833A" opacity={0.4} />
      <Circle cx="360" cy="52" r="24" fill="#C2511E" opacity={0.4} />
      {/* Floating Autumn Leaves */}
      <Path d="M 30 25 Q 35 20 38 28 Q 33 30 30 25 Z" fill="#D96328" opacity={0.8} />
      <Path d="M 120 18 Q 125 12 128 20 Q 123 22 120 18 Z" fill="#E8833A" opacity={0.8} />
      <Path d="M 280 22 Q 286 16 290 24 Q 284 27 280 22 Z" fill="#D96328" opacity={0.7} />
    </Svg>
  );
}

export default function MissionsScreen({ onBack, onGo, onTabPress }: Props) {
  const [filter, setFilter] = useState<QuestKind | 'all'>('all');
  const showDaily = filter === 'all' || filter === 'daily';
  const showWeekly = filter === 'all' || filter === 'weekly';
  const showSpecial = filter === 'all' || filter === 'special';

  // Daily quest progress
  const dailyCur = 3.2;
  const dailyGoal = 5.0;
  const dailyPct = Math.min(1, dailyCur / dailyGoal);

  // Weekly quest progress
  const weeklyCur = 12;
  const weeklyGoal = 20;
  const weeklyPct = Math.min(1, weeklyCur / weeklyGoal);

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>ภารกิจของฉัน</Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.pillsRow}>
        {FILTERS.map((f) => {
          const active = f.kind === filter;
          return (
            <Pressable
              key={f.kind}
              onPress={() => setFilter(f.kind)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.pill,
                active ? styles.pillActive : styles.pillInactive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  active ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Daily Quest Card */}
        {showDaily && (
          <View style={styles.dailyCardWrap}>
            <View style={styles.dailyCard}>
              {/* Header row: Paw + Daily Quest + Timer */}
              <View style={styles.dailyHeaderRow}>
                <View style={styles.dailyTitleLeft}>
                  <Text style={styles.catPawIcon}>🐾</Text>
                  <Text style={styles.dailyHeaderText}>Daily Quest</Text>
                </View>
                <View style={styles.timerPill}>
                  <Text style={styles.timerText}>เหลืออีก 12 ชม.</Text>
                </View>
              </View>

              {/* Quest Item Row */}
              <View style={styles.dailyContentRow}>
                <DailyRunnerWhiteIcon />
                <View style={styles.dailyCenterInfo}>
                  <Text style={styles.dailyTaskTitle}>เดินครบ 5 กิโลเมตร</Text>
                  <Text style={styles.dailyProgressText}>
                    {dailyCur} / {dailyGoal} km
                  </Text>
                </View>
                <View style={styles.dailyRewardBadge}>
                  <Text style={styles.rewardCoinEmoji}>🪙</Text>
                  <Text style={styles.rewardText}>= 20</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.dailyProgressTrack}>
                <View
                  style={[
                    styles.dailyProgressFill,
                    { width: `${dailyPct * 100}%` },
                  ]}
                />
              </View>

              {/* Bottom CTA Button */}
              <Pressable
                onPress={onGo}
                accessibilityRole="button"
                accessibilityLabel="ไปเลย"
                style={({ pressed }) => [
                  styles.dailyGoBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.dailyGoText}>ไปเลย</Text>
              </Pressable>
            </View>

            {/* Carousel Dots */}
            <View style={styles.carouselDotsRow}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        )}

        {/* Weekly Quest Section */}
        {showWeekly && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Weekly Quest</Text>
              <Pressable hitSlop={8}>
                <Text style={styles.viewAllText}>ดูทั้งหมด ›</Text>
              </Pressable>
            </View>

            <View style={styles.weeklyCard}>
              <WeeklyRunnerGreenIcon />
              <View style={styles.weeklyCenter}>
                <Text style={styles.weeklyTitle}>สะสมระยะทาง 20 km</Text>
                <View style={styles.weeklyTrack}>
                  <View
                    style={[
                      styles.weeklyFill,
                      { width: `${weeklyPct * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.weeklyProgressText}>
                  {weeklyCur} / {weeklyGoal} km
                </Text>
              </View>
              <View style={styles.weeklyCoinBadge}>
                <Text style={styles.coinEmoji}>🪙</Text>
                <Text style={styles.weeklyCoinText}>+100</Text>
              </View>
            </View>
          </View>
        )}

        {/* Special Event Section */}
        {showSpecial && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Special Event</Text>
              <Pressable hitSlop={8}>
                <Text style={styles.viewAllText}>ดูทั้งหมด ›</Text>
              </Pressable>
            </View>

            <View style={styles.specialCard}>
              <AutumnArtBanner />
              <View style={styles.specialContentRow}>
                {/* Autumn Cat Avatar */}
                <View style={styles.specialAvatarWrap}>
                  <CatAvatar size={50} mood="sit" />
                </View>

                {/* Event Info */}
                <View style={styles.specialInfo}>
                  <Text style={styles.specialTitle}>เทศกาลฤดูใบไม้ร่วง</Text>
                  <Text style={styles.specialDates}>1 - 30 ก.ย. 2568</Text>
                  <View style={styles.specialCoinBadge}>
                    <Text style={styles.coinEmoji}>🪙</Text>
                    <Text style={styles.specialCoinText}>+200</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Reusable Bottom Navigation Bar */}
      <BottomTabBar activeTab="Home" onTabPress={onTabPress ?? (() => onBack())} />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    paddingRight: 8,
    paddingVertical: 4,
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
    letterSpacing: -0.3,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  pillActive: {
    backgroundColor: '#55684B',
  },
  pillInactive: {
    backgroundColor: '#EFEAE0',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: '#70756B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 90,
    gap: 16,
  },
  dailyCardWrap: {
    gap: 10,
  },
  dailyCard: {
    backgroundColor: '#55684B',
    borderRadius: 22,
    padding: 18,
    elevation: 4,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    gap: 14,
  },
  dailyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catPawIcon: {
    fontSize: 16,
  },
  dailyHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerPill: {
    backgroundColor: '#F5EDE2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C4C1B',
  },
  dailyContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dailyCenterInfo: {
    flex: 1,
    gap: 2,
  },
  dailyTaskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  dailyProgressText: {
    fontSize: 13,
    color: '#D5E4D0',
  },
  dailyRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardCoinEmoji: {
    fontSize: 15,
  },
  rewardText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dailyProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  dailyProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: radius.pill,
  },
  dailyGoBtn: {
    backgroundColor: '#FAF7EE',
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  dailyGoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#55684B',
    letterSpacing: 0.3,
  },
  carouselDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D9D4C7',
  },
  dotActive: {
    backgroundColor: '#55684B',
    width: 18,
    borderRadius: 4,
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 13,
    color: '#8A8F85',
  },
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE9DE',
    elevation: 2,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  weeklyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF2E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  weeklyCenter: {
    flex: 1,
    gap: 4,
  },
  weeklyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  weeklyTrack: {
    height: 6,
    backgroundColor: '#EFEAE0',
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 2,
  },
  weeklyFill: {
    height: '100%',
    backgroundColor: '#55684B',
    borderRadius: radius.pill,
  },
  weeklyProgressText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8F85',
    marginTop: 1,
  },
  weeklyCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 10,
  },
  coinEmoji: {
    fontSize: 14,
  },
  weeklyCoinText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C78923',
  },
  specialCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0DBC5',
    elevation: 2,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    minHeight: 96,
  },
  specialContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  specialAvatarWrap: {
    marginRight: 14,
  },
  specialInfo: {
    flex: 1,
    gap: 3,
  },
  specialTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4A2E16',
    letterSpacing: -0.2,
  },
  specialDates: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C6544',
  },
  specialCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  specialCoinText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C78923',
  },
  bottomSpacer: {
    height: 20,
  },
});
