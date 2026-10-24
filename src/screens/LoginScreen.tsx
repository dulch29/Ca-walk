import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { colors, font, radius, space } from '../theme';

type Props = {
  onDone: () => void;
};

// shortcut: buttons skip real auth, wire GoogleSignin + Firebase Auth once webClientId is set
export default function LoginScreen({ onDone }: Props) {
  return (
    <View style={styles.root}>
      <CatAvatar size={160} mood="sit" />
      <View style={styles.texts}>
        <Text style={font.title}>เชื่อมต่อบัญชีของคุณ</Text>
        <Text style={styles.sub}>เพื่อความสะดวกในการใช้งาน</Text>
      </View>
      <View style={styles.buttons}>
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="เข้าสู่ระบบด้วย Google"
          style={styles.btn}
        >
          <Text style={styles.google}>G</Text>
          <Text style={styles.btnText}>Google</Text>
        </Pressable>
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="เข้าสู่ระบบด้วย Apple"
          style={styles.btn}
        >
          <Text style={styles.apple}>A</Text>
          <Text style={styles.btnText}>Apple</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xl,
  },
  texts: { alignItems: 'center', gap: space.xs },
  sub: { ...font.body, color: colors.textMuted },
  buttons: { alignSelf: 'stretch', gap: space.md },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: space.md,
  },
  google: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  apple: { fontSize: 18, fontWeight: '800', color: colors.text },
  btnText: { fontSize: 16, fontWeight: '600', color: colors.text },
});
