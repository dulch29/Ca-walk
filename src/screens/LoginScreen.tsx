import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import CatAvatar, { CatMood } from '../components/CatAvatar';
import { colors, space } from '../theme';

type Props = {
  onDone: () => void;
};

function GoogleLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.64-.78 1.08-1.86.96-2.89-.93.04-2.05.62-2.72 1.4-.59.68-1.11 1.77-.97 2.83 1.04.08 2.1-.56 2.73-1.34z"
        fill="#000000"
      />
    </Svg>
  );
}

export default function LoginScreen({ onDone }: Props) {
  const [mood, setMood] = useState<CatMood>('sit');

  const petCat = () => {
    setMood('touch');
    setTimeout(() => setMood('sit'), 1500);
  };

  return (
    <View style={styles.root}>
      {/* Upper Area: Cat Avatar & Headings */}
      <View style={styles.upperArea}>
        <Pressable
          onPress={petCat}
          accessibilityRole="button"
          accessibilityLabel="แตะตัวน้องแมว"
          style={styles.catWrapper}
        >
          <CatAvatar size={160} mood={mood} />
        </Pressable>

        <View style={styles.textsArea}>
          <Text style={styles.title}>เชื่อมต่อบัญชีของคุณ</Text>
          <Text style={styles.subtitle}>เพื่อความสะดวกในการใช้งาน</Text>
        </View>
      </View>

      {/* Social Login Buttons (matching reference screenshot) */}
      <View style={styles.buttonsArea}>
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="เข้าสู่ระบบด้วย Google"
          style={styles.socialBtn}
        >
          <View style={styles.iconContainer}>
            <GoogleLogo size={22} />
          </View>
          <Text style={styles.btnLabel}>Google</Text>
        </Pressable>

        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="เข้าสู่ระบบด้วย Apple"
          style={styles.socialBtn}
        >
          <View style={styles.iconContainer}>
            <AppleLogo size={22} />
          </View>
          <Text style={styles.btnLabel}>Apple</Text>
        </Pressable>

        {/* Demo shortcut */}
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="ข้ามขั้นตอนและเข้าสู่ระบบทันที"
          hitSlop={12}
          style={styles.demoLink}
        >
          <Text style={styles.demoLinkText}>
            เข้าใช้งานแบบผู้เยี่ยมชม (Guest / Demo) ›
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
    paddingHorizontal: space.xl,
    paddingTop: space.xxxl,
    paddingBottom: space.xxl,
    justifyContent: 'space-between',
  },
  upperArea: {
    alignItems: 'center',
    paddingTop: space.xl,
    gap: space.lg,
  },
  catWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textsArea: {
    alignItems: 'center',
    gap: space.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  buttonsArea: {
    width: '100%',
    gap: space.md,
    paddingBottom: space.lg,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 16, // Matching the rounded rectangle in reference
    paddingVertical: 15,
    paddingHorizontal: space.lg,
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: {
    marginRight: space.sm,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  demoLink: {
    alignItems: 'center',
    marginTop: space.sm,
    paddingVertical: space.sm,
  },
  demoLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
