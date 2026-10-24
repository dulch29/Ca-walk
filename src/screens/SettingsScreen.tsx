import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { colors, font, radius, space } from '../theme';

type Props = {
  onBack: () => void;
  onLogout: () => void;
};

type ToggleKey =
  | 'quest'
  | 'coupon'
  | 'cat'
  | 'haptic'
  | 'sound'
  | 'gps'
  | 'speed';

const SECTIONS: {
  title: string;
  rows: { key: ToggleKey; icon: string; label: string; hint?: string }[];
}[] = [
  {
    title: 'การแจ้งเตือน',
    rows: [
      { key: 'quest', icon: '🎯', label: 'แจ้งเตือนภารกิจรายวัน' },
      { key: 'coupon', icon: '🎟️', label: 'คูปองใกล้หมดอายุ' },
      { key: 'cat', icon: '🐱', label: 'ข้อความจากแมว' },
    ],
  },
  {
    title: 'แมวของฉัน',
    rows: [
      { key: 'haptic', icon: '📳', label: 'สั่นเมื่อลูบแมว' },
      { key: 'sound', icon: '🔔', label: 'เสียงเมี้ยว' },
    ],
  },
  {
    title: 'การบันทึกกิจกรรม',
    rows: [
      {
        key: 'gps',
        icon: '📍',
        label: 'ใช้ GPS ความแม่นยำสูง',
        hint: 'ใช้แบตเตอรี่มากขึ้น',
      },
      {
        key: 'speed',
        icon: '🛵',
        label: 'แจ้งเตือนความเร็วผิดปกติ',
        hint: 'หยุดนับเมื่อเร็วเกิน 18 km/h',
      },
    ],
  },
];

const LINKS = [
  { icon: '🌐', label: 'ภาษา', value: 'ไทย' },
  { icon: '📏', label: 'หน่วยระยะทาง', value: 'กิโลเมตร' },
  { icon: '🔒', label: 'ความเป็นส่วนตัว' },
  { icon: '❓', label: 'ช่วยเหลือ & คำถามที่พบบ่อย' },
  { icon: 'ℹ️', label: 'เกี่ยวกับ Ca-Walk', value: 'v0.0.1' },
];

// shortcut: settings live in local state only, persist when backend/storage lands
export default function SettingsScreen({ onBack, onLogout }: Props) {
  const [on, setOn] = useState<Record<ToggleKey, boolean>>({
    quest: true,
    coupon: true,
    cat: true,
    haptic: true,
    sound: false,
    gps: true,
    speed: true,
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
        <Text style={font.title}>ตั้งค่า</Text>
      </View>

      {SECTIONS.map(s => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <View style={styles.card}>
            {s.rows.map((r, i) => (
              <View key={r.key} style={[styles.row, i > 0 && styles.divider]}>
                <Text style={styles.icon}>{r.icon}</Text>
                <View style={styles.flex}>
                  <Text style={font.body}>{r.label}</Text>
                  {r.hint && <Text style={font.small}>{r.hint}</Text>}
                </View>
                <Switch
                  value={on[r.key]}
                  onValueChange={v => setOn(prev => ({ ...prev, [r.key]: v }))}
                  accessibilityLabel={r.label}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ทั่วไป</Text>
        <View style={styles.card}>
          {LINKS.map((l, i) => (
            <View key={l.label} style={[styles.row, i > 0 && styles.divider]}>
              <Text style={styles.icon}>{l.icon}</Text>
              <Text style={[font.body, styles.flex]}>{l.label}</Text>
              {l.value && <Text style={font.small}>{l.value}</Text>}
              <Text style={font.small}>›</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        onPress={onLogout}
        accessibilityRole="button"
        style={styles.logout}
      >
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  section: { gap: space.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    minHeight: 48,
  },
  divider: { borderTopWidth: 1, borderColor: colors.border },
  icon: { fontSize: 18 },
  flex: { flex: 1 },
  logout: {
    paddingVertical: space.md,
    alignItems: 'center',
    borderRadius: radius.pill,
    borderColor: colors.danger,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.danger },
});
