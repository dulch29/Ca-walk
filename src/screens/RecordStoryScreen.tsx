import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { quests } from '../data/mock';
import { colors, font, radius, space } from '../theme';
import { fmtPace, RunSummary } from './RecordScreen';
import { coinsFor } from './RecordSummaryScreen';

type Props = {
  summary: RunSummary;
  photoUri?: string;
  onClose: () => void;
};

const SLIDES = 4;

export default function RecordStoryScreen({ summary, photoUri, onClose }: Props) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const time = new Date().toTimeString().slice(0, 5);
  const daily = quests.filter(q => q.kind === 'daily').slice(0, 3);

  // shortcut: shares text only; capture the slide with react-native-view-shot to share the image
  const share = () =>
    Share.share({
      message: `Ca-Walk 🐾 ${summary.km.toFixed(2)} km, ${summary.steps.toLocaleString()} ก้าว วันนี้!`,
    });

  const photo = photoUri ? (
    <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel="รูปของคุณ" />
  ) : (
    <View style={[styles.photo, styles.photoEmpty]}>
      <CatAvatar size={110} mood="walk" />
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.bars}>
        {Array.from({ length: SLIDES }, (_, i) => (
          <View key={i} style={[styles.bar, i <= page && styles.barOn]} />
        ))}
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        <View style={[styles.slide, { width }]}>
          <Text style={styles.headline}>Small steps{'\n'}Big rewards</Text>
          <View style={styles.polaroid}>
            {photo}
            <Text style={styles.caption}>Today's walk 🐾</Text>
          </View>
          <Text style={font.body}>📍 Bangkok, Thailand</Text>
          <Text style={font.body}>🕒 {time}</Text>
        </View>

        <View style={[styles.slide, { width }]}>
          <Text style={styles.headline}>You walked</Text>
          <Text style={styles.huge}>{summary.steps.toLocaleString()}</Text>
          <Text style={font.h2}>steps. 🐾</Text>
          <CatAvatar size={140} mood="walk" />
          <Text style={styles.bubble}>เก่งมากเลย วันนี้! ♥</Text>
          <Text style={styles.foot}>Keep going, you're doing great!</Text>
        </View>

        <View style={[styles.slide, { width }]}>
          <View style={styles.polaroid}>
            {photo}
            <Text style={styles.caption}>Good vibes{'\n'}Good steps 🐾</Text>
          </View>
          {[
            ['👟', `${summary.steps.toLocaleString()}`, 'steps'],
            ['📏', `${summary.km.toFixed(2)} km`, 'distance'],
            ['⏱️', `${fmtPace(summary.seconds, summary.km)} /km`, 'pace'],
          ].map(([icon, value, label]) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statIcon}>{icon}</Text>
              <View style={styles.flex}>
                <Text style={font.h2}>{value}</Text>
                <Text style={font.small}>{label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.slide, { width }]}>
          <Text style={styles.headline}>Quest Completed! ✅</Text>
          <CatAvatar size={110} mood="jump" />
          <Text style={styles.bubble}>ภารกิจสำเร็จแล้ว เยี่ยมมาก! ♥</Text>
          <View style={styles.questBox}>
            {daily.map(q => (
              <View key={q.id} style={styles.questRow}>
                <Text>{q.progress >= q.goal ? '✅' : '🎁'}</Text>
                <Text style={[font.body, styles.flex]}>{q.title}</Text>
                <Text style={styles.coin}>🪙 +{q.reward}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.foot}>🪙 +{coinsFor(summary.km)} วันนี้</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable onPress={onClose} accessibilityRole="button" style={styles.ghost}>
          <Text style={styles.ghostText}>ปิด</Text>
        </Pressable>
        <Pressable onPress={share} accessibilityRole="button" style={styles.btn}>
          <Text style={styles.btnText}>แชร์</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bars: { flexDirection: 'row', gap: space.xs, padding: space.lg },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  barOn: { backgroundColor: colors.primary },
  slide: { alignItems: 'center', gap: space.md, padding: space.lg },
  headline: { ...font.title, fontSize: 28, textAlign: 'center' },
  huge: { fontSize: 56, fontWeight: '800', color: colors.primaryDark },
  polaroid: {
    padding: space.md,
    paddingBottom: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: 'center',
    gap: space.sm,
    transform: [{ rotate: '-2deg' }],
  },
  photo: { width: 220, height: 220, borderRadius: radius.md },
  photoEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  caption: { ...font.h2, textAlign: 'center' },
  bubble: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    overflow: 'hidden',
  },
  foot: { ...font.body, color: colors.textMuted, textAlign: 'center' },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
  },
  statIcon: { fontSize: 24 },
  flex: { flex: 1 },
  questBox: {
    alignSelf: 'stretch',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
  },
  questRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  coin: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  actions: { flexDirection: 'row', gap: space.md, padding: space.lg },
  ghost: {
    flex: 1,
    paddingVertical: space.md,
    alignItems: 'center',
    borderRadius: radius.pill,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  ghostText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  btn: {
    flex: 1,
    paddingVertical: space.md,
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
