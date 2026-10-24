import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { colors, font, radius, space } from '../theme';

type Props = {
  onStart: () => void;
  onLogin: () => void;
};

export default function GetStartedScreen({ onStart, onLogin }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Cawalk</Text>
        <Text style={styles.tagline}>เดิน · วิ่ง · สะสมระยะทาง{'\n'}แลกคูปอง</Text>
        <CatAvatar size={180} mood="sit" />
      </View>
      <Pressable onPress={onStart} accessibilityRole="button" style={styles.btn}>
        <Text style={styles.btnText}>เริ่มต้นใช้งาน</Text>
      </Pressable>
      <Pressable onPress={onLogin} accessibilityRole="link" hitSlop={8}>
        <Text style={styles.link}>
          มีบัญชีแล้ว? <Text style={styles.linkStrong}>เข้าสู่ระบบ</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.xl,
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  logo: { ...font.title, fontSize: 40, fontWeight: '800' },
  tagline: { ...font.body, fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
  link: { ...font.body, textAlign: 'center', color: colors.textMuted },
  linkStrong: { color: colors.primary, fontWeight: '700' },
});
