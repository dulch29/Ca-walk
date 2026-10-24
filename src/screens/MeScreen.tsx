import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { profile } from '../data/meMock';
import { colors, font, radius, space } from '../theme';

type Props = {
  onProfile: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onCouponHistory: () => void;
};

export default function MeScreen({ onProfile, onSettings, onHistory, onCouponHistory }: Props) {
  const today = [
    { icon: '👟', value: `${profile.today.km} km`, label: 'ระยะทาง' },
    { icon: '👣', value: profile.today.steps.toLocaleString(), label: 'ก้าว' },
    { icon: '🔥', value: `${profile.today.kcal} kcal`, label: 'แคลอรี่' },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Pressable onPress={onSettings} accessibilityRole="button" accessibilityLabel="ตั้งค่า" hitSlop={8} style={styles.gear}>
          <Text style={styles.gearIcon}>⚙️</Text>
        </Pressable>
        <Pressable onPress={onProfile} accessibilityRole="button" accessibilityLabel="แก้ไขโปรไฟล์" style={styles.avatar}>
          <CatAvatar size={110} mood="sit" />
          <View style={styles.camBadge}><Text style={styles.camIcon}>📷</Text></View>
        </Pressable>
        <Pressable onPress={onProfile} accessibilityRole="button" hitSlop={8}>
          <Text style={font.title}>{profile.name} 🛡️ ✏️</Text>
        </Pressable>
      </View>

      <Pressable onPress={onHistory} accessibilityRole="button" accessibilityLabel="ประวัติกิจกรรม" style={styles.hero}>
        <Text style={styles.heroLabel}>รวมระยะทางทั้งหมด</Text>
        <Text style={styles.heroValue}>{profile.totalKm} km</Text>
        <Text style={styles.heroMore}>ดูประวัติ ›</Text>
      </Pressable>

      <View style={styles.row}>
        <Pressable onPress={onHistory} accessibilityRole="button" style={styles.card}>
          <Text style={font.small}>จำนวนก้าว</Text>
          <Text style={styles.cardValue}>{profile.steps.toLocaleString()}</Text>
        </Pressable>
        <Pressable onPress={onCouponHistory} accessibilityRole="button" accessibilityLabel="ประวัติการแลกคูปอง" style={styles.card}>
          <Text style={font.small}>คูปองที่แลกแล้ว</Text>
          <Text style={styles.cardValue}>{profile.couponsUsed} ใบ</Text>
        </Pressable>
      </View>

      <Text style={font.h2}>สถิติวันนี้</Text>
      <View style={[styles.card, styles.todayRow]}>
        {today.map(t => (
          <View key={t.label} style={styles.stat}>
            <Text style={styles.statIcon}>{t.icon}</Text>
            <Text style={styles.statValue}>{t.value}</Text>
            <Text style={font.small}>{t.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  top: { alignItems: 'center', gap: space.sm, paddingVertical: space.md, backgroundColor: colors.primaryLight, borderRadius: radius.lg },
  gear: { position: 'absolute', top: space.md, right: space.md, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  gearIcon: { fontSize: 20 },
  avatar: { width: 130, height: 130, borderRadius: 65, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  camBadge: { position: 'absolute', right: 4, bottom: 4, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  camIcon: { fontSize: 14 },
  hero: { backgroundColor: colors.primaryDark, borderRadius: radius.lg, padding: space.lg, gap: space.xs },
  heroLabel: { fontSize: 13, color: colors.onPrimary },
  heroValue: { fontSize: 34, fontWeight: '800', color: colors.onPrimary },
  heroMore: { fontSize: 12, fontWeight: '700', color: colors.primaryLight, alignSelf: 'flex-end' },
  row: { flexDirection: 'row', gap: space.md },
  card: { flex: 1, gap: space.xs, padding: space.md, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md },
  cardValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  todayRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.text },
});
