import React from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import CatAvatar from '../components/CatAvatar';
import { activities } from '../data/meMock';
import { SPORT_LABEL } from './RecordScreen';

type Props = {
  activityId: string;
  onBack: () => void;
};

function BackArrow() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2.2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2}>
      <Circle cx="18" cy="5" r="3" />
      <Circle cx="6" cy="12" r="3" />
      <Circle cx="18" cy="19" r="3" />
      <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </Svg>
  );
}

function WalkFigureIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#55684B" strokeWidth={2.2}>
      <Circle cx="13" cy="4" r="2" fill="#55684B" />
      <Path d="M13 6l-2 5 3 4-2 7" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 11l-3 4" strokeLinecap="round" />
      <Path d="M11 11l4-2 3 3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 15l-3 6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RunFigureIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#55684B" strokeWidth={2.2}>
      <Circle cx="15" cy="4" r="2" fill="#55684B" />
      <Path d="M15 6l-4 4 2 3-5 5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 11l3-1 3-3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13 13l4 2 2 5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 16l3-2" strokeLinecap="round" />
    </Svg>
  );
}

function MapRouteGraphic() {
  return (
    <View style={styles.mapWrap}>
      <Svg width="100%" height={190} viewBox="0 0 340 190">
        {/* Background park / land */}
        <Rect width="340" height="190" fill="#E8EEDC" />

        {/* Soft grass patches */}
        <Path d="M0 0 L140 0 L160 70 L0 50 Z" fill="#DDE7CE" />
        <Path d="M200 40 L340 20 L340 120 L230 110 Z" fill="#DCE6CC" />
        <Path d="M50 110 L180 90 L220 190 L20 190 Z" fill="#E2EBCE" />

        {/* Road grid */}
        <Path
          d="M -10 90 L 350 40 M -10 140 L 350 90 M 80 -10 L 110 200 M 210 -10 L 250 200 M 290 -10 L 290 200"
          stroke="#FFFFFF"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <Path
          d="M -10 90 L 350 40 M -10 140 L 350 90 M 80 -10 L 110 200 M 210 -10 L 250 200 M 290 -10 L 290 200"
          stroke="#FAF7EE"
          strokeWidth={10}
          strokeLinecap="round"
        />

        {/* Secondary roads */}
        <Path
          d="M 110 50 Q 160 30 210 65 T 320 150"
          stroke="#FFFFFF"
          strokeWidth={8}
          fill="none"
        />

        {/* Glowing track route shadow */}
        <Path
          d="M 50 130 L 78 52 L 180 80 L 255 125 L 270 65"
          stroke="#55684B"
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M 50 130 L 78 52 L 180 80 L 255 125 L 270 65"
          stroke="#68835B"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Start Point Pin */}
        <Circle cx="50" cy="130" r="10" fill="#55684B" />
        <Circle cx="50" cy="130" r="5" fill="#FFFFFF" />

        {/* Destination Pin */}
        <Circle cx="270" cy="65" r="12" fill="#55684B" />
        <Circle cx="270" cy="65" r="9" fill="#FFFFFF" />
        <Circle cx="270" cy="65" r="5" fill="#E56353" />
      </Svg>
    </View>
  );
}

export default function ActivityDetailScreen({ activityId, onBack }: Props) {
  const item = activities.find(x => x.id === activityId) ?? activities[0];
  const isRun = item.sport === 'run';

  const handleShare = () => {
    Share.share({
      message: `Ca-Walk 🐾 ${SPORT_LABEL[item.sport]} ${item.km} km · ${item.steps.toLocaleString()} ก้าว · ${item.kcal} kcal`,
    });
  };

  return (
    <View style={styles.root}>
      {/* Top Header: ← รายละเอียดกิจกรรม  [Share] */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          hitSlop={12}
          style={styles.backBtn}
        >
          <BackArrow />
        </Pressable>
        <Text style={styles.headerTitle}>รายละเอียดกิจกรรม</Text>
        <Pressable
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="แชร์กิจกรรม"
          hitSlop={12}
          style={styles.shareBtn}
        >
          <ShareIcon />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Route Map Preview */}
        <MapRouteGraphic />

        {/* Primary Activity Info Card */}
        <View style={styles.card}>
          {/* Top Activity Header */}
          <View style={styles.activityHeaderRow}>
            <View style={styles.iconCircle}>
              {isRun ? <RunFigureIcon /> : <WalkFigureIcon />}
            </View>
            <View style={styles.activityTitleWrap}>
              <Text style={styles.sportName}>{isRun ? 'วิ่ง' : 'เดิน'}</Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <View style={styles.badgeSuccess}>
              <Text style={styles.badgeSuccessText}>สำเร็จ</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 3-Column Primary Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{item.km} km</Text>
              <Text style={styles.statLabel}>👟 ระยะทาง</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{item.steps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>👣 ก้าว</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{item.kcal} kcal</Text>
              <Text style={styles.statLabel}>🔥 แคลอรี่</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 2-Column Secondary Stats */}
          <View style={styles.secondaryStatsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValueSmall}>{item.pace} /km</Text>
              <Text style={styles.statLabel}>เพซ</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValueSmall}>{item.time}</Text>
              <Text style={styles.statLabel}>เวลา</Text>
            </View>
          </View>
        </View>

        {/* Location Pill Card */}
        <View style={styles.locationCard}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>Bangkok, Thailand</Text>
        </View>

        {/* Bottom Cat Encouragement Section */}
        <View style={styles.encouragementRow}>
          <View style={styles.catWrap}>
            <CatAvatar size={88} mood="sit" />
          </View>
          <View style={styles.bubbleContainer}>
            <View style={styles.bubbleArrow} />
            <Text style={styles.bubbleText}>เก่งมากเลย!</Text>
          </View>
        </View>
      </ScrollView>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  shareBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 14,
  },
  mapWrap: {
    height: 190,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE4D6',
    overflow: 'hidden',
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE4D6',
    padding: 16,
    gap: 14,
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF1E7',
    borderWidth: 1,
    borderColor: '#DFE8DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitleWrap: {
    flex: 1,
    gap: 2,
  },
  sportName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262A22',
  },
  dateText: {
    fontSize: 12,
    color: '#8C9486',
    fontWeight: '500',
  },
  badgeSuccess: {
    backgroundColor: '#55684B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EAE0',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.3,
  },
  statValueSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262A22',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C9486',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE4D6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  locationPin: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#55684B',
  },
  encouragementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  catWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE4D6',
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleArrow: {
    position: 'absolute',
    left: -8,
    top: '40%',
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EAE4D6',
    transform: [{ rotate: '45deg' }],
  },
  bubbleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.2,
  },
});
