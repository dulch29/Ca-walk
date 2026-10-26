import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { profile } from '../data/meMock';

type Props = {
  onBack: () => void;
};

// 4 distinct cat avatar variants matching the reference
const AVATAR_OPTIONS = [
  require('../../Assests/Cat/Photo/ide (1).png'),
  require('../../Assests/Cat/Photo/walk (1).png'),
  require('../../Assests/Cat/Photo/sleep (1).png'),
  require('../../Assests/Cat/Photo/lick (1).png'),
];

const MAX_LEN = 20;

function BackArrow() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2.2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" />
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

function PlusIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#55684B" strokeWidth={2.4}>
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export default function ProfileEditScreen({ onBack }: Props) {
  const [name, setName] = useState(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    profile.name = name.trim();
    setSaved(true);
    setTimeout(() => {
      onBack();
    }, 400);
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
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
        <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Avatar with Camera Badge */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Image
              source={AVATAR_OPTIONS[selectedAvatar]}
              style={styles.avatarImg}
              resizeMethod="scale"
              resizeMode="contain"
              accessibilityLabel="รูปโปรไฟล์ปัจจุบัน"
            />
          </View>
          <View style={styles.cameraBadge}>
            <CameraIcon />
          </View>
        </View>

        {/* Username Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>ชื่อผู้ใช้</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={name}
              onChangeText={t => {
                setName(t);
                setSaved(false);
              }}
              maxLength={MAX_LEN}
              placeholder="กรอกชื่อผู้ใช้"
              placeholderTextColor="#A8B0A2"
              accessibilityLabel="ชื่อผู้ใช้"
              style={styles.textInput}
            />
            <Text style={styles.counterText}>
              {name.length}/{MAX_LEN}
            </Text>
          </View>
        </View>

        {/* Profile Picture Variants */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>รูปโปรไฟล์</Text>
          <View style={styles.avatarChoiceRow}>
            {AVATAR_OPTIONS.map((source, index) => {
              const isSelected = selectedAvatar === index;
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    setSelectedAvatar(index);
                    setSaved(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`เลือกโปรไฟล์รูปที่ ${index + 1}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.avatarChoiceItem,
                    isSelected && styles.avatarChoiceSelected,
                  ]}
                >
                  <Image
                    source={source}
                    style={styles.choiceThumb}
                    resizeMethod="scale"
                    resizeMode="contain"
                  />
                </Pressable>
              );
            })}

            {/* Custom Upload "+" Button */}
            <Pressable
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel="เพิ่มรูปโปรไฟล์ใหม่"
              style={styles.addAvatarBtn}
            >
              <PlusIcon />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleSave}
          disabled={!name.trim()}
          accessibilityRole="button"
          accessibilityState={{ disabled: !name.trim() }}
          style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 24,
  },
  avatarWrap: {
    alignSelf: 'center',
    position: 'relative',
    marginTop: 8,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F3EFE6',
    borderWidth: 3.5,
    borderColor: '#ECE4D6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 100,
    height: 100,
  },
  cameraBadge: {
    position: 'absolute',
    right: 4,
    bottom: 6,
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
  fieldGroup: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262A22',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE4D6',
    borderRadius: 14,
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#262A22',
    paddingVertical: 0,
  },
  counterText: {
    fontSize: 13,
    color: '#8C9486',
    fontWeight: '500',
  },
  avatarChoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarChoiceItem: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE4D6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarChoiceSelected: {
    borderColor: '#55684B',
    borderWidth: 2.5,
    backgroundColor: '#EBF1E7',
  },
  choiceThumb: {
    width: 42,
    height: 42,
  },
  addAvatarBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D4CDC0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
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
  saveBtnDisabled: {
    backgroundColor: '#B5BEB0',
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
