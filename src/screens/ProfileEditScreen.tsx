import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { profile } from '../data/meMock';
import { colors, font, radius, space } from '../theme';

type Props = {
  onBack: () => void;
};

// static PNGs as avatar choices; exact filenames per the asset folder
const AVATARS = [
  require('../../Assests/Cat/Photo/ide (1).png'),
  require('../../Assests/Cat/Photo/walk (1).png'),
  require('../../Assests/Cat/Photo/sleep (1).png'),
  require('../../Assests/Cat/Photo/lick (1).png'),
];
const MAX = 20;

// shortcut: name/avatar kept in local state only, persist to Firestore when backend lands
export default function ProfileEditScreen({ onBack }: Props) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(0);
  const [saved, setSaved] = useState(false);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="ย้อนกลับ" hitSlop={8}>
            <Text style={font.title}>‹</Text>
          </Pressable>
          <Text style={font.title}>แก้ไขโปรไฟล์</Text>
        </View>

        <View style={styles.avatarWrap}>
          <Image source={AVATARS[avatar]} style={styles.avatar} resizeMethod="scale" accessibilityLabel="รูปโปรไฟล์" />
          <View style={styles.camBadge}><Text style={styles.camIcon}>📷</Text></View>
        </View>

        <Text style={font.h2}>ชื่อผู้ใช้</Text>
        <View style={styles.input}>
          <TextInput
            value={name}
            onChangeText={t => { setName(t); setSaved(false); }}
            maxLength={MAX}
            accessibilityLabel="ชื่อผู้ใช้"
            style={[font.body, styles.flex]}
          />
          <Text style={font.small}>{name.length}/{MAX}</Text>
        </View>

        <Text style={font.h2}>รูปโปรไฟล์</Text>
        <View style={styles.choices}>
          {AVATARS.map((src, i) => (
            <Pressable
              key={i}
              onPress={() => { setAvatar(i); setSaved(false); }}
              accessibilityRole="button"
              accessibilityLabel={`รูปที่ ${i + 1}`}
              accessibilityState={{ selected: avatar === i }}
              style={[styles.choice, avatar === i && styles.choiceOn]}
            >
              <Image source={src} style={styles.choiceImg} resizeMethod="scale" />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => setSaved(true)}
        disabled={!name.trim()}
        accessibilityRole="button"
        accessibilityState={{ disabled: !name.trim() }}
        style={[styles.btn, !name.trim() && styles.btnOff]}
      >
        <Text style={styles.btnText}>{saved ? 'บันทึกแล้ว ✓' : 'บันทึก'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: 96 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatarWrap: { alignSelf: 'center', width: 130, height: 130, borderRadius: 65, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 96, height: 96 },
  camBadge: { position: 'absolute', right: 4, bottom: 4, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  camIcon: { fontSize: 14 },
  input: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md },
  flex: { flex: 1, paddingVertical: space.md },
  choices: { flexDirection: 'row', gap: space.md },
  choice: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  choiceOn: { borderColor: colors.primary },
  choiceImg: { width: 40, height: 40 },
  btn: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg, paddingVertical: space.lg, alignItems: 'center', borderRadius: radius.pill, backgroundColor: colors.primary },
  btnOff: { backgroundColor: colors.locked },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
