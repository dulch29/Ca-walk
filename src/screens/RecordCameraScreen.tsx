import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { colors, font, radius, space } from '../theme';

type Props = {
  onBack: () => void;
  onCaptured: (uri: string) => void;
};

export default function RecordCameraScreen({ onBack, onCaptured }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shoot = async () => {
    setBusy(true);
    try {
      const photo = await photoOutput.capturePhoto({}, {});
      const path = await photo.saveToTemporaryFileAsync();
      onCaptured(path.startsWith('file://') ? path : `file://${path}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ถ่ายรูปไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={font.h2}>ขออนุญาตใช้กล้องเพื่อถ่ายรูปภารกิจ</Text>
        <Pressable onPress={requestPermission} accessibilityRole="button" style={styles.btn}>
          <Text style={styles.btnText}>อนุญาต</Text>
        </Pressable>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={8}>
          <Text style={font.body}>ย้อนกลับ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        style={StyleSheet.absoluteFill}
        device="back"
        isActive
        outputs={[photoOutput]}
        onError={e => setError(e.message)}
      />
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="ย้อนกลับ" hitSlop={8} style={styles.back}>
        <Text style={font.h2}>‹</Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        onPress={shoot}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="ถ่ายรูป"
        accessibilityState={{ disabled: busy }}
        style={[styles.shutter, busy && styles.shutterBusy]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', gap: space.lg, backgroundColor: colors.bg, padding: space.xl },
  back: {
    position: 'absolute',
    top: space.lg,
    left: space.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    position: 'absolute',
    top: 72,
    left: space.lg,
    right: space.lg,
    color: colors.onPrimary,
    backgroundColor: colors.danger,
    padding: space.sm,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  shutter: {
    position: 'absolute',
    bottom: space.xxl,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    borderWidth: 5,
    borderColor: colors.primary,
  },
  shutterBusy: { opacity: 0.5 },
  btn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: space.xl, paddingVertical: space.md },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
