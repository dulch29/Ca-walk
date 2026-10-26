import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import CatAvatar from '../components/CatAvatar';
import { profile } from '../data/meMock';

type Props = {
  onProfile: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onCouponHistory: () => void;
};

// 1. Subtle Meadow Floral / Grass illustration watermark behind avatar
function MeadowFloralBackground() {
  return (
    <View style={styles.meadowSvgWrap} pointerEvents="none">
      <Svg width="100%" height="160" viewBox="0 0 360 160" preserveAspectRatio="none">
        {/* Soft grass meadow washes */}
        <Path
          d="M 0 160 Q 90 120 180 145 T 360 135 L 360 160 Z"
          fill="#EBF2E6"
          opacity={0.65}
        />
        <Path
          d="M 0 160 Q 80 140 180 152 T 360 148 L 360 160 Z"
          fill="#DFEBD8"
          opacity={0.8}
        />
        {/* Left side flower & leaves */}
        <Path
          d="M 28 150 Q 24 125 18 108 Q 30 115 28 150 Z"
          fill="#7C9473"
          opacity={0.7}
        />
        <Path
          d="M 24 125 Q 12 118 8 126 Q 16 132 24 125 Z"
          fill="#8CA384"
          opacity={0.8}
        />
        <Path
          d="M 26 116 Q 38 108 42 118 Q 34 122 26 116 Z"
          fill="#8CA384"
          opacity={0.8}
        />
        {/* Right side flower & leaves */}
        <Path
          d="M 334 150 Q 338 122 344 105 Q 332 113 334 150 Z"
          fill="#7C9473"
          opacity={0.7}
        />
        <Path
          d="M 338 124 Q 350 116 354 124 Q 346 130 338 124 Z"
          fill="#8CA384"
          opacity={0.8}
        />
        <Path
          d="M 336 114 Q 324 106 320 116 Q 328 120 336 114 Z"
          fill="#8CA384"
          opacity={0.8}
        />
        {/* Tiny clover / buttercup dots */}
        <Circle cx="48" cy="138" r="3" fill="#D3DECD" />
        <Circle cx="318" cy="136" r="3" fill="#D3DECD" />
      </Svg>
    </View>
  );
}

// 2. Foliage Silhouette for Hero Card
function FoliageWatermark() {
  return (
    <View style={styles.heroFoliage} pointerEvents="none">
      <Svg width={140} height={120} viewBox="0 0 140 120">
        <Path
          d="M 140 120 Q 110 80 90 45 Q 75 15 65 0"
          stroke="#415239"
          strokeWidth={2}
          fill="none"
          opacity={0.4}
        />
        <Path
          d="M 90 45 Q 65 40 70 24 Q 85 28 90 45 Z"
          fill="#415239"
          opacity={0.35}
        />
        <Path
          d="M 100 62 Q 125 50 120 34 Q 102 44 100 62 Z"
          fill="#415239"
          opacity={0.35}
        />
        <Path
          d="M 78 26 Q 52 14 62 4 Q 74 12 78 26 Z"
          fill="#415239"
          opacity={0.3}
        />
        <Path
          d="M 112 85 Q 86 78 90 60 Q 106 68 112 85 Z"
          fill="#415239"
          opacity={0.35}
        />
        <Path
          d="M 125 102 Q 142 90 136 74 Q 120 84 125 102 Z"
          fill="#415239"
          opacity={0.3}
        />
      </Svg>
    </View>
  );
}

// 3. Crisp Vector Icons
function GearIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
}

function CameraIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  );
}

function ShoeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#55684B" strokeWidth={2}>
      <Path d="M2.5 17h19a1 1 0 0 0 1-1v-2.5a4.5 4.5 0 0 0-4.5-4.5H15l-3-4H8v5H5a2.5 2.5 0 0 0-2.5 2.5V17z" />
      <Path d="M2 17h20v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2z" />
      <Circle cx="7" cy="14" r="1" fill="#55684B" />
      <Circle cx="11" cy="14" r="1" fill="#55684B" />
    </Svg>
  );
}

function FootprintIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#55684B">
      {/* Big heel */}
      <Path d="M12 14c-1.8 0-3 1.6-3 3.6 0 1.8 1.4 3.4 3 3.4s3-1.6 3-3.4c0-2-1.2-3.6-3-3.6z" />
      {/* Sole */}
      <Path d="M12 7c-2.4 0-4 2-4 4.5 0 1.5 1 2.5 4 2.5s4-1 4-2.5C16 9 14.4 7 12 7z" />
      {/* Toes */}
      <Circle cx="12" cy="4.2" r="1.3" />
      <Circle cx="9.2" cy="4.9" r="1.1" />
      <Circle cx="14.8" cy="4.9" r="1.1" />
      <Circle cx="7" cy="6.2" r="0.9" />
      <Circle cx="17" cy="6.2" r="0.9" />
    </Svg>
  );
}

function FlameIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#55684B" strokeWidth={2}>
      <Path d="M8.5 14.5A4.5 4.5 0 0 0 13 19a4.5 4.5 0 0 0 4.5-4.5c0-3.5-3.5-6.5-5.5-9.5-2 3-3.5 6-3.5 9.5z" fill="#E8F0E4" />
      <Path d="M12 18a2 2 0 0 0 2-2c0-1.5-2-3-2-3s-2 1.5-2 3a2 2 0 0 0 2 2z" fill="#55684B" />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="#8C9588">
      <Path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
      <Path d="M10 12l2 2 4-4" stroke="#FAF7EE" strokeWidth={2} fill="none" />
    </Svg>
  );
}

function PencilIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#687263" strokeWidth={2.2}>
      <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </Svg>
  );
}

export default function MeScreen({
  onProfile,
  onSettings,
  onHistory,
  onCouponHistory,
}: Props) {
  const todayStats = [
    {
      Icon: ShoeIcon,
      value: `${profile.today.km} km`,
      label: 'ระยะทาง',
    },
    {
      Icon: FootprintIcon,
      value: profile.today.steps.toLocaleString(),
      label: 'ก้าว',
    },
    {
      Icon: FlameIcon,
      value: `${profile.today.kcal} kcal`,
      label: 'แคลอรี่',
    },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Meadow Header Section */}
      <View style={styles.header}>
        <MeadowFloralBackground />

        {/* Top Right Gear Button */}
        <Pressable
          onPress={onSettings}
          accessibilityRole="button"
          accessibilityLabel="Setting"
          hitSlop={12}
          style={styles.gearBtn}
        >
          <GearIcon />
        </Pressable>

        {/* Circular Cat Avatar with Camera Badge */}
        <Pressable
          onPress={onProfile}
          accessibilityRole="button"
          accessibilityLabel="แก้ไขโปรไฟล์"
          style={styles.avatarContainer}
        >
          <View style={styles.avatarCircle}>
            <CatAvatar size={98} mood="sit" />
          </View>
          <View style={styles.cameraBadge}>
            <CameraIcon />
          </View>
        </Pressable>

        {/* User Name & Badges */}
        <Pressable
          onPress={onProfile}
          accessibilityRole="button"
          accessibilityLabel="แก้ไขชื่อโปรไฟล์"
          hitSlop={8}
          style={styles.nameRow}
        >
          <Text style={styles.nameText}>{profile.name}</Text>
          <ShieldIcon />
          <PencilIcon />
        </Pressable>
      </View>

      {/* 2. Hero Card: รวมระยะทางทั้งหมด 128.6 km */}
      <Pressable
        onPress={onHistory}
        accessibilityRole="button"
        accessibilityLabel={`รวมระยะทางทั้งหมด ${profile.totalKm} กิโลเมตร`}
        style={styles.heroCard}
      >
        <FoliageWatermark />
        <Text style={styles.heroLabel}>รวมระยะทางทั้งหมด</Text>
        <Text style={styles.heroValue}>{profile.totalKm} km</Text>
      </Pressable>

      {/* 3. Unified Secondary Split Card */}
      <View style={styles.splitCard}>
        <Pressable
          onPress={onHistory}
          accessibilityRole="button"
          accessibilityLabel={`จำนวนก้าว ${profile.steps.toLocaleString()}`}
          style={styles.splitCol}
        >
          <Text style={styles.splitLabel}>จำนวนก้าว</Text>
          <Text style={styles.splitValue}>{profile.steps.toLocaleString()}</Text>
        </Pressable>

        <View style={styles.splitDivider} />

        <Pressable
          onPress={onCouponHistory}
          accessibilityRole="button"
          accessibilityLabel={`คูปองที่แลกแล้ว ${profile.couponsUsed} ใบ`}
          style={styles.splitCol}
        >
          <Text style={styles.splitLabel}>คูปองที่แลกแล้ว</Text>
          <Text style={styles.splitValue}>{profile.couponsUsed} ใบ</Text>
        </Pressable>
      </View>

      {/* 4. Today's Statistics Section */}
      <View style={styles.todaySection}>
        <Text style={styles.sectionTitle}>สถิติวันนี้</Text>
        <View style={styles.todayCard}>
          {todayStats.map(item => (
            <View key={item.label} style={styles.todayCol}>
              <View style={styles.statIconBadge}>
                <item.Icon />
              </View>
              <Text style={styles.statValueText}>{item.value}</Text>
              <Text style={styles.statLabelText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7EE',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 96,
    gap: 14,
  },
  header: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  meadowSvgWrap: {
    position: 'absolute',
    top: 0,
    left: -16,
    right: -16,
    bottom: 0,
  },
  gearBtn: {
    position: 'absolute',
    top: 8,
    right: 2,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 8,
  },
  avatarCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#F3EFE6',
    borderWidth: 3.5,
    borderColor: '#ECE4D6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#55684B',
    borderWidth: 2.5,
    borderColor: '#FAF7EE',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.3,
  },
  heroCard: {
    position: 'relative',
    backgroundColor: '#55684B',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#35432E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroFoliage: {
    position: 'absolute',
    right: -6,
    bottom: -10,
    width: 140,
    height: 120,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4E0CE',
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  splitCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE4D6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  splitCol: {
    flex: 1,
    gap: 4,
    paddingHorizontal: 4,
  },
  splitDivider: {
    width: 1,
    backgroundColor: '#EDE7DC',
    marginVertical: 4,
    marginHorizontal: 12,
  },
  splitLabel: {
    fontSize: 13,
    color: '#848C7E',
    fontWeight: '500',
  },
  splitValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#262A22',
  },
  todaySection: {
    gap: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  todayCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE4D6',
    paddingVertical: 16,
    paddingHorizontal: 10,
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  todayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF1E7',
    borderWidth: 1,
    borderColor: '#E0EAD9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262A22',
  },
  statLabelText: {
    fontSize: 12,
    color: '#848C7E',
    fontWeight: '500',
  },
});
