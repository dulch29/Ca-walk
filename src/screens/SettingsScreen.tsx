import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Props = {
  onBack: () => void;
  onLogout?: () => void;
};

// 1. Vector Icons matching Screen 3
function BackArrow() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2.2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

function PawIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#55684B">
      <Circle cx="7.5" cy="8" r="2.2" />
      <Circle cx="16.5" cy="8" r="2.2" />
      <Circle cx="12" cy="5.5" r="2.2" />
      <Circle cx="4.5" cy="12" r="1.8" />
      <Circle cx="19.5" cy="12" r="1.8" />
      <Path d="M12 11c-3.2 0-5.5 2-5.5 4.8 0 2 1.6 3.8 5.5 3.8s5.5-1.8 5.5-3.8c0-2.8-2.3-4.8-5.5-4.8z" />
    </Svg>
  );
}

function TargetIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke="#55684B" strokeWidth={2.2} />
      <Circle cx="12" cy="12" r="6" stroke="#7A8F70" strokeWidth={1.8} />
      <Circle cx="12" cy="12" r="2.8" fill="#55684B" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#55684B" strokeWidth={2}>
      <Rect x="3" y="4" width="18" height="18" rx="3" />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function GiftIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#55684B" strokeWidth={2}>
      <Rect x="3" y="8" width="18" height="14" rx="2" />
      <Path d="M12 8v14M3 13h18" />
      <Path d="M12 8c-2-3-5.5-3-5.5 0 0 2 5.5 0 5.5 0z" />
      <Path d="M12 8c2-3 5.5-3 5.5 0 0 2-5.5 0-5.5 0z" />
    </Svg>
  );
}

function CatFaceIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="#55684B">
      <Path d="M4 6l3.5 3.5c1.4-.7 3-.7 4.5 0L15.5 6l1.2 5.2c.8 1.1 1.3 2.4 1.3 3.8 0 4-3.6 7-8 7s-8-3-8-7c0-1.4.5-2.7 1.3-3.8L4 6z" />
      <Circle cx="8" cy="15" r="1.2" fill="#FAF7EE" />
      <Circle cx="12" cy="15" r="1.2" fill="#FAF7EE" />
      <Path d="M10 17.5l-1 1M10 17.5l1 1" stroke="#FAF7EE" strokeWidth={1.2} />
    </Svg>
  );
}

function VibrateIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#55684B" strokeWidth={2}>
      <Rect x="7" y="4" width="10" height="16" rx="2" />
      <Path d="M11 17h2" />
      <Path d="M3 8a7 7 0 0 1 0 8M21 8a7 7 0 0 0 0 8" />
    </Svg>
  );
}

export default function SettingsScreen({ onBack }: Props) {
  // General Notifications
  const [importantActivity, setImportantActivity] = useState(true);
  const [dailyGoalProgress, setDailyGoalProgress] = useState(true);

  // Quest & Event
  const [dailyQuest, setDailyQuest] = useState(true);
  const [weeklyQuest, setWeeklyQuest] = useState(true);
  const [specialEvent, setSpecialEvent] = useState(false);

  // Cat Sound
  const [catSound, setCatSound] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0.75); // 0..1

  // Haptic
  const [haptic, setHaptic] = useState(true);
  const [hapticLevel, setHapticLevel] = useState<'light' | 'normal' | 'strong'>('normal');

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      onBack();
    }, 400);
  };

  return (
    <View style={styles.root}>
      {/* Top Header: ← Setting */}
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
        <Text style={styles.headerTitle}>Setting</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: การแจ้งเตือนทั่วไป */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>การแจ้งเตือนทั่วไป</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <PawIcon />
              </View>
              <Text style={styles.rowLabel}>กิจกรรมสำคัญ</Text>
              <Switch
                value={importantActivity}
                onValueChange={setImportantActivity}
                trackColor={{ false: '#E2DCD1', true: '#55684B' }}
                thumbColor="#FFFFFF"
                accessibilityLabel="กิจกรรมสำคัญ"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <TargetIcon />
              </View>
              <Text style={styles.rowLabel}>ความคืบหน้าเป้าหมายรายวัน</Text>
              <Switch
                value={dailyGoalProgress}
                onValueChange={setDailyGoalProgress}
                trackColor={{ false: '#E2DCD1', true: '#55684B' }}
                thumbColor="#FFFFFF"
                accessibilityLabel="ความคืบหน้าเป้าหมายรายวัน"
              />
            </View>
          </View>
        </View>

        {/* Section 2: Quest & Event */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quest & Event</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <PawIcon />
              </View>
              <Text style={styles.rowLabel}>Quest ประจำวัน</Text>
              <Switch
                value={dailyQuest}
                onValueChange={setDailyQuest}
                trackColor={{ false: '#E2DCD1', true: '#55684B' }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Quest ประจำวัน"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <CalendarIcon />
              </View>
              <Text style={styles.rowLabel}>Quest รายสัปดาห์</Text>
              <Switch
                value={weeklyQuest}
                onValueChange={setWeeklyQuest}
                trackColor={{ false: '#E2DCD1', true: '#55684B' }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Quest รายสัปดาห์"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <GiftIcon />
              </View>
              <Text style={styles.rowLabel}>กิจกรรมพิเศษ</Text>
              <Switch
                value={specialEvent}
                onValueChange={setSpecialEvent}
                trackColor={{ false: '#E2DCD1', true: '#55684B' }}
                thumbColor="#FFFFFF"
                accessibilityLabel="กิจกรรมพิเศษ"
              />
            </View>
          </View>
        </View>

        {/* Section 3: เสียงแมว */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>เสียงแมว</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <PawIcon />
              </View>
              <Text style={styles.rowLabel}>เปิดเสียงแมว</Text>
              <Switch
                value={catSound}
                onValueChange={setCatSound}
                trackColor={{ false: '#E2DCD1', true: '#55684B' }}
                thumbColor="#FFFFFF"
                accessibilityLabel="เปิดเสียงแมว"
              />
            </View>

            <View style={styles.divider} />

            {/* Slider Row */}
            <View style={styles.sliderSection}>
              <Text style={styles.subHeader}>ระดับเสียง</Text>
              <View style={styles.sliderRow}>
                <CatFaceIcon />
                {/* Interactive / visual slider track */}
                <Pressable
                  onPress={e => {
                    const width = 240;
                    const x = Math.max(0, Math.min(width, e.nativeEvent.locationX));
                    setVolumeLevel(x / width);
                  }}
                  style={styles.sliderTrack}
                  accessibilityRole="adjustable"
                  accessibilityLabel="ระดับเสียง"
                >
                  <View
                    style={[
                      styles.sliderProgress,
                      { width: `${Math.round(volumeLevel * 100)}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.sliderKnob,
                      { left: `${Math.round(volumeLevel * 100)}%` },
                    ]}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Section 4: การสั่น (Haptic) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>การสั่น (Haptic)</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconBadge}>
                <VibrateIcon />
              </View>
              <Text style={styles.rowLabel}>เปิดการสั่น</Text>
              <Switch
                value={haptic}
                onValueChange={setHaptic}
                trackColor={{ false: '#E2DCD1', true: '#55684B' }}
                thumbColor="#FFFFFF"
                accessibilityLabel="เปิดการสั่น"
              />
            </View>

            <View style={styles.divider} />

            {/* Haptic Level 3 Segmented Pills */}
            <View style={styles.hapticSection}>
              <Text style={styles.subHeader}>ระดับการสั่น</Text>
              <View style={styles.hapticRow}>
                {[
                  { key: 'light', label: 'เบา' },
                  { key: 'normal', label: 'ปกติ' },
                  { key: 'strong', label: 'แรง' },
                ].map(opt => {
                  const isSelected = hapticLevel === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setHapticLevel(opt.key as any)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      style={[
                        styles.hapticPill,
                        isSelected && styles.hapticPillActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.radioDot,
                          isSelected && styles.radioDotActive,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDotInner} />}
                      </View>
                      <Text
                        style={[
                          styles.hapticText,
                          isSelected && styles.hapticTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleSave}
          accessibilityRole="button"
          style={styles.saveBtn}
        >
          <Text style={styles.saveBtnText}>
            {saved ? 'บันทึกเรียบร้อย ✓' : 'บันทึก'}
          </Text>
        </Pressable>
      </View>
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
    fontSize: 18,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B4B32',
    letterSpacing: -0.1,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE4D6',
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EAE0',
  },
  iconBadge: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#262A22',
  },
  sliderSection: {
    paddingVertical: 12,
    gap: 8,
  },
  subHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#848C7E',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5EDE2',
    justifyContent: 'center',
    position: 'relative',
  },
  sliderProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#55684B',
    borderRadius: 3,
  },
  sliderKnob: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#55684B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginLeft: -9,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  hapticSection: {
    paddingVertical: 12,
    gap: 10,
  },
  hapticRow: {
    flexDirection: 'row',
    gap: 10,
  },
  hapticPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF7EE',
    borderWidth: 1,
    borderColor: '#EAE4D6',
  },
  hapticPillActive: {
    backgroundColor: '#55684B',
    borderColor: '#55684B',
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#A8B0A2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotActive: {
    borderColor: '#FFFFFF',
  },
  radioDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  hapticText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#656F5E',
  },
  hapticTextActive: {
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
  },
  saveBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#55684B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#35432E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
