import React, { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import Svg, { Path } from 'react-native-svg';
import { CAT_PHOTOS } from '../assets/catPhotos';
import { fmtPace, fmtTime, RunSummary, SPORT_LABEL } from './RecordScreen';
import { styles } from './RecordStoryScreen.styles';

const STORY_PARK_IMG = require('../../Assests/Images/story_park.jpg');

type Props = {
  summary: RunSummary;
  photoUri?: string;
  onClose: () => void;
};

const SLIDES = 4;

export default function RecordStoryScreen({
  summary,
  photoUri,
  onClose,
}: Props) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const slides = useRef<(React.ComponentRef<typeof View> | null)[]>([]);
  const time = new Date().toTimeString().slice(0, 5);
  const coins = Math.max(1, Math.floor(summary.km * 10));

  const share = async () => {
    const node = slides.current[page];
    if (!node) {
      return;
    }
    setBusy(true);
    try {
      const uri = await captureRef(node, { format: 'png', quality: 1 });
      await Share.open({
        url: uri,
        type: 'image/png',
        title: 'Ca-Walk Story',
        message: `วันนี้ฉันเดินไป ${summary.km.toFixed(2)} km (${summary.steps.toLocaleString()} ก้าว) กับ Ca-Walk! 🐾`,
      });
    } catch {
      // User dismissed share dialog or share failed non-critically
    } finally {
      setBusy(false);
    }
  };

  const polaroidPhoto = (
    <View style={styles.polaroidImageContainer}>
      <Image
        source={photoUri ? { uri: photoUri } : STORY_PARK_IMG}
        style={styles.polaroidImage}
        resizeMode="cover"
        accessibilityLabel="ภาพถ่ายกิจกรรม"
      />
    </View>
  );

  const slideWrapper = (i: number, children: React.ReactNode) => (
    <View key={i} style={[{ width }, styles.slideWrapper]}>
      <View
        ref={(r) => {
          slides.current[i] = r;
        }}
        collapsable={false}
        style={styles.slideCard}
      >
        {children}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Top Indicators */}
      <View style={styles.topBar}>
        <View style={styles.bars}>
          {Array.from({ length: SLIDES }, (_, i) => (
            <View key={i} style={[styles.bar, i <= page && styles.barOn]} />
          ))}
        </View>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {/* Slide 0: Quest Completed! */}
        {slideWrapper(
          0,
          <>
            <View style={styles.questHeaderRow}>
              <Text style={styles.questHeaderTitle}>Quest Completed!</Text>
              <View style={styles.questCheckCircle}>
                <Svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                >
                  <Path
                    d="M20 6L9 17l-5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </View>

            <View style={styles.questCatRow}>
              <Image
                source={CAT_PHOTOS.jump}
                style={styles.catPhotoSmall}
                accessibilityLabel="รูปแมวกระโดดดีใจ"
              />
              <View style={styles.questSpeechBubble}>
                <Text style={styles.questSpeechText}>
                  ภารกิจสำเร็จแล้ว เยี่ยมมาก! ♥
                </Text>
              </View>
            </View>

            {/* Main Quest Box with Genuine Stats */}
            <View style={styles.mainProgressCard}>
              <View style={styles.mainProgressTop}>
                <Text style={styles.mainProgressLabel}>
                  {SPORT_LABEL[summary.sport]} {summary.km.toFixed(2)} km
                </Text>
                <View style={styles.rewardBadge}>
                  <Text style={styles.rewardBadgeText}>+{coins} เหรียญ</Text>
                </View>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={styles.progressBarFill} />
              </View>
            </View>

            {/* Daily Activity Checklist */}
            <View style={styles.checklistSection}>
              <Text style={styles.checklistTitle}>บันทึกกิจกรรมจริง</Text>

              <View style={styles.checklistItem}>
                <View style={styles.checkItemLeft}>
                  <Text>📏</Text>
                  <Text style={styles.checkItemText}>
                    ระยะทาง {summary.km.toFixed(2)} km
                  </Text>
                </View>
                <Text style={styles.checkItemReward}>
                  {fmtTime(summary.seconds)}
                </Text>
              </View>

              <View style={styles.checklistItem}>
                <View style={styles.checkItemLeft}>
                  <Text>👟</Text>
                  <Text style={styles.checkItemText}>
                    จำนวนก้าว {summary.steps.toLocaleString()} ก้าว
                  </Text>
                </View>
                <Text style={styles.checkItemReward}>
                  {fmtPace(summary.seconds, summary.km)}
                </Text>
              </View>

              <View style={styles.checklistItem}>
                <View style={styles.checkItemLeft}>
                  <Text>📍</Text>
                  <Text style={styles.checkItemText} numberOfLines={1}>
                    {summary.destinationName
                      ? `ปลายทาง: ${summary.destinationName}`
                      : 'กิจกรรมทั่วไป'}
                  </Text>
                </View>
                <Text style={styles.checkItemReward}>🪙 +{coins}</Text>
              </View>
            </View>

            <View style={styles.questFooterRow}>
              <Image
                source={CAT_PHOTOS.walk}
                style={styles.catPhotoSmall}
                accessibilityLabel="รูปแมวเดิน"
              />
              <Text style={styles.questFooterText}>
                Another step closer to your goal! ♥
              </Text>
            </View>
          </>,
        )}

        {/* Slide 1: Polaroid + Real Metrics */}
        {slideWrapper(
          1,
          <>
            <Text style={styles.polaroidHeaderTitle}>
              Good steps,{'\n'}Great journey 🐾
            </Text>

            <View style={styles.polaroidCard}>
              <View style={styles.washiTape} />
              {polaroidPhoto}
              <Text style={styles.polaroidCaption} numberOfLines={1}>
                {summary.destinationName
                  ? `ปลายทาง: ${summary.destinationName}`
                  : 'Good vibes Good steps 🐾'}
              </Text>
            </View>

            <View style={styles.statRowsSection}>
              <View style={styles.statRowItem}>
                <View style={styles.statRowLeft}>
                  <Text style={styles.statRowIcon}>👟</Text>
                  <Text style={styles.statRowValue}>
                    {summary.steps.toLocaleString()}
                  </Text>
                  <Text style={styles.statRowSub}>steps</Text>
                </View>
                <Text style={styles.statRowTrend}>✓ สำเร็จ</Text>
              </View>

              <View style={styles.statRowItem}>
                <View style={styles.statRowLeft}>
                  <Text style={styles.statRowIcon}>📏</Text>
                  <Text style={styles.statRowValue}>
                    {summary.km.toFixed(2)} km
                  </Text>
                  <Text style={styles.statRowSub}>distance</Text>
                </View>
                <Text style={styles.statRowTrend}>✓ GPS จริง</Text>
              </View>

              <View style={styles.statRowItem}>
                <View style={styles.statRowLeft}>
                  <Text style={styles.statRowIcon}>⏱️</Text>
                  <Text style={styles.statRowValue}>
                    {fmtPace(summary.seconds, summary.km)}
                  </Text>
                  <Text style={styles.statRowSub}>pace</Text>
                </View>
                <Text style={styles.statRowTrend}>
                  {fmtTime(summary.seconds)}
                </Text>
              </View>
            </View>
          </>,
        )}

        {/* Slide 2: Huge Steps Highlight */}
        {slideWrapper(
          2,
          <>
            <Text style={styles.hugeStepsSubtitle}>You walked</Text>
            <Text style={styles.hugeStepsNumber}>
              {summary.steps.toLocaleString()} 🐾
            </Text>
            <Text style={styles.hugeStepsSubtitle}>steps.</Text>

            <View style={styles.speechBubbleCenter}>
              <Text style={styles.speechBubbleCenterText}>
                เก่งมากเลย วันนี้! ♥
              </Text>
            </View>

            <Image
              source={CAT_PHOTOS.walk}
              style={styles.catPhotoLarge}
              accessibilityLabel="รูปแมวเดินขนาดใหญ่"
            />

            <View style={styles.keepGoingBox}>
              <Text style={styles.keepGoingText}>
                {summary.km.toFixed(2)} km ใน {fmtTime(summary.seconds)}
                {'\n'}Keep going, you're doing great! 🐾
              </Text>
            </View>

            <View style={styles.botanicalFoliage}>
              <Text style={styles.foliageEmoji}>🌿 🌱 🌿 🌱 🌿</Text>
            </View>
          </>,
        )}

        {/* Slide 3: Polaroid Postcard (Small steps Big rewards) */}
        {slideWrapper(
          3,
          <>
            <Text style={styles.polaroidHeaderTitle}>
              Small steps{'\n'}Big rewards 🐾
            </Text>

            <View style={styles.polaroidCard}>
              <View style={styles.washiTape} />
              {polaroidPhoto}
              <Text style={styles.polaroidCaption} numberOfLines={1}>
                {summary.destinationName
                  ? `ปลายทาง ${summary.destinationName}`
                  : "Today's walk 🐾"}
              </Text>
            </View>

            <View style={styles.polaroidMetaRow}>
              <Text style={styles.polaroidMetaItem} numberOfLines={1}>
                📍 {summary.destinationName ?? 'กิจกรรมเดิน/วิ่ง'}
              </Text>
              <Text style={styles.polaroidMetaItem}>🕒 {time}</Text>
            </View>

            <View style={styles.storyCatCenter}>
              <Image
                source={CAT_PHOTOS.clean}
                style={styles.catPhotoMedium}
                accessibilityLabel="รูปแมวเลียขนมีความสุข"
              />
            </View>

            <View style={styles.botanicalFoliageSpaced}>
              <Text style={styles.foliageEmoji}>🌿 🌱 🌾 🌱 🌿</Text>
            </View>
          </>,
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.ghostBtn}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="ปิดหน้า Story"
        >
          <Text style={styles.ghostBtnText}>ปิด</Text>
        </Pressable>

        <Pressable
          style={styles.shareBtn}
          onPress={share}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="แชร์ภาพกิจกรรม"
          accessibilityState={{ disabled: busy }}
        >
          <Text style={styles.shareBtnText}>
            {busy ? 'กำลังเตรียม...' : 'แชร์ Story'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
