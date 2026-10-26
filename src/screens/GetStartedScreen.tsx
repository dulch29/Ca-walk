import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import CatAvatar, { CatMood } from '../components/CatAvatar';
import { colors, radius, space } from '../theme';

type Props = {
  onStart: () => void;
  onLogin: () => void;
};

export default function GetStartedScreen({ onStart, onLogin }: Props) {
  const [mood, setMood] = useState<CatMood>('sit');
  const [bubble, setBubble] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tapCat = () => {
    setMood('jump');
    setBubble('ยินดีต้อนรับสู่ Cawalk! 🐾');
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      setMood('sit');
      setBubble(null);
    }, 1800);
  };

  return (
    <View style={styles.root}>
      {/* Scenic Card Container matching reference mockup */}
      <View style={styles.scenicCard}>
        {/* Soft Background Clouds */}
        <View style={styles.cloudsWrapper}>
          <Svg height="80" width="100%" viewBox="0 0 320 80">
            {/* Fluffy background clouds */}
            <Path
              d="M 40 45 Q 60 20 85 45 Q 110 25 130 50 L 20 50 Z"
              fill="#FFFFFF"
              opacity={0.6}
            />
            <Path
              d="M 200 40 Q 230 15 260 40 Q 285 22 305 45 L 180 45 Z"
              fill="#FFFFFF"
              opacity={0.7}
            />
            <Path
              d="M 240 32 Q 265 12 290 32 Q 310 18 325 38 L 225 38 Z"
              fill="#FFFFFF"
              opacity={0.5}
            />
          </Svg>
        </View>

        {/* Title and Subtitle */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>Cawalk</Text>
          <Text style={styles.tagline}>
            เดิน • วิ่ง • สะสมระยะทาง{'\n'}แลกคูปอง
          </Text>
        </View>

        {/* Interactive Speech Bubble */}
        {bubble && (
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{bubble}</Text>
          </View>
        )}

        {/* Cat Avatar sitting on grassy meadow */}
        <Pressable
          onPress={tapCat}
          accessibilityRole="button"
          accessibilityLabel="แตะตัวน้องแมว"
          style={styles.catWrapper}
        >
          <CatAvatar size={155} mood={mood} />
        </Pressable>

        {/* Meadow Hills & Little Flower Dots SVG */}
        <View style={styles.meadowWrapper}>
          <Svg height="120" width="100%" viewBox="0 0 340 120" preserveAspectRatio="none">
            {/* Back gentle hill */}
            <Path
              d="M 0 50 Q 80 15 170 40 Q 260 65 340 35 L 340 120 L 0 120 Z"
              fill="#D9E8CE"
            />
            {/* Front meadow */}
            <Path
              d="M 0 65 Q 100 45 200 68 Q 280 85 340 55 L 340 120 L 0 120 Z"
              fill="#C4DDBD"
            />
            {/* Little flowers & grass tufts */}
            <Circle cx="50" cy="80" r="3" fill="#F8E398" />
            <Circle cx="85" cy="72" r="2.5" fill="#FFFFFF" />
            <Circle cx="280" cy="75" r="3" fill="#F8E398" />
            <Circle cx="305" cy="90" r="2.5" fill="#FFFFFF" />
            <Circle cx="120" cy="95" r="2" fill="#FFFFFF" />
            <Circle cx="230" cy="90" r="3" fill="#F8E398" />
          </Svg>
        </View>
      </View>

      {/* Bottom Action Button & Login Link */}
      <View style={styles.bottomArea}>
        <Pressable
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel="เริ่มต้นใช้งาน"
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>เริ่มต้นใช้งาน</Text>
        </Pressable>

        <Pressable
          onPress={onLogin}
          accessibilityRole="link"
          accessibilityLabel="เข้าสู่ระบบ"
          hitSlop={12}
          style={styles.loginLinkWrapper}
        >
          <Text style={styles.loginLink}>
            มีบัญชีแล้ว? <Text style={styles.loginLinkStrong}>เข้าสู่ระบบ</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.xxl,
    justifyContent: 'space-between',
  },
  scenicCard: {
    flex: 1,
    backgroundColor: '#FAF7EE',
    borderRadius: 24,
    borderColor: '#E8E2D7',
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    marginBottom: space.lg,
  },
  cloudsWrapper: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 80,
  },
  titleArea: {
    alignItems: 'center',
    paddingTop: space.xxxl,
    zIndex: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  speechBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    elevation: 2,
    zIndex: 10,
    marginTop: space.sm,
  },
  speechText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  catWrapper: {
    zIndex: 3,
    alignItems: 'center',
    marginBottom: -16,
  },
  meadowWrapper: {
    width: '100%',
    height: 110,
    justifyContent: 'flex-end',
  },
  bottomArea: {
    gap: space.md,
    paddingBottom: space.xs,
  },
  primaryBtn: {
    backgroundColor: '#687B53', // Sage Olive matching reference screenshot
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
    letterSpacing: 0.3,
  },
  loginLinkWrapper: {
    alignItems: 'center',
    paddingVertical: space.xs,
  },
  loginLink: {
    fontSize: 13,
    color: colors.textMuted,
  },
  loginLinkStrong: {
    fontWeight: '700',
    color: colors.text,
  },
});
