import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import CatAvatar from '../components/CatAvatar';
import { quests } from '../data/mock';
import { font } from '../theme';
import { fmtPace, RunSummary } from './RecordScreen';
import { coinsFor } from './RecordSummaryScreen';
import { styles } from './RecordStoryScreen.styles';

// static PNG for anything that gets captured/shared (doc: no GIF frames in images)
const CAT_PNG = require('../../Assests/Cat/Photo/walk (1).png');

type Props = {
  summary: RunSummary;
  photoUri?: string;
  onClose: () => void;
};

const SLIDES = 4;
// shortcut: fixed demo multipliers vs "usual" day, compute from history when Me/history exists
const TREND = { steps: 2.4, km: 2.1, pace: 1.8 };

export default function RecordStoryScreen({ summary, photoUri, onClose }: Props) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const slides = useRef<(React.ComponentRef<typeof View> | null)[]>([]);
  const time = new Date().toTimeString().slice(0, 5);
  const daily = quests.filter(q => q.kind === 'daily').slice(0, 3);
  const top = daily[0];

  const share = async () => {
    const node = slides.current[page];
    if (!node) {
      return;
    }
    setBusy(true);
    try {
      const uri = await captureRef(node, { format: 'png', quality: 1 });
      await Share.open({ url: uri, type: 'image/png' });
    } catch {
      // user closed the share sheet or capture failed; nothing to undo
    } finally {
      setBusy(false);
    }
  };

  const photo = (
    <View>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel="รูปของคุณ" />
      ) : (
        <View style={[styles.photo, styles.photoEmpty]} />
      )}
      <Image source={CAT_PNG} style={styles.catStamp} resizeMethod="scale" />
    </View>
  );

  const slide = (i: number, children: React.ReactNode) => (
    <View key={i} style={{ width }}>
      <View ref={r => { slides.current[i] = r; }} collapsable={false} style={styles.slide}>
        {children}
      </View>
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
        {slide(0, <>
          <Text style={styles.headline}>
            Small steps{'\n'}Big <Text style={styles.underline}>rewards</Text> 🐾
          </Text>
          <View style={styles.polaroid}>
            <View style={styles.tape} />
            {photo}
            <Text style={styles.caption}>Today's walk 🐾</Text>
          </View>
          <View style={styles.meta}>
            <Text style={font.body}>📍 Bangkok, Thailand</Text>
            <Text style={font.body}>🕒 {time}</Text>
          </View>
          <View style={styles.leaves}><Text style={styles.leafText}>🌿🌱🌿🌱🌿</Text></View>
        </>)}

        {slide(1, <>
          <Text style={styles.headline}>You walked</Text>
          <Text style={styles.huge}>{summary.steps.toLocaleString()} 🐾</Text>
          <Text style={styles.headline}>steps.</Text>
          <Text style={styles.bubble}>เก่งมากเลย วันนี้! ♥</Text>
          <CatAvatar size={150} mood="walk" />
          <View style={styles.brush}>
            <Text style={styles.foot}>Keep going{'\n'}You're doing great! 🐾</Text>
          </View>
        </>)}

        {slide(2, <>
          <Text style={styles.headline}>That's {TREND.steps}x{'\n'}your usual days.</Text>
          <View style={styles.polaroid}>
            <View style={styles.tape} />
            {photo}
            <Text style={styles.caption}>Good vibes{'\n'}Good steps 🐾</Text>
          </View>
          {[
            ['👟', summary.steps.toLocaleString(), 'steps', TREND.steps],
            ['📏', `${summary.km.toFixed(2)} km`, 'distance', TREND.km],
            ['⏱️', `${fmtPace(summary.seconds, summary.km)} /km`, 'pace', TREND.pace],
          ].map(([icon, value, label, x]) => (
            <View key={label as string} style={styles.statCard}>
              <Text style={styles.statIcon}>{icon}</Text>
              <View style={styles.flex}>
                <Text style={font.h2}>{value}</Text>
                <Text style={font.body}>{label}</Text>
              </View>
              <Text style={styles.trend}>↑ {x}x</Text>
            </View>
          ))}
        </>)}

        {slide(3, <>
          <View style={styles.questTop}>
            <Text style={font.h2}>Quest Completed! 🎉</Text>
            {top && <Text style={font.body}>{top.title}</Text>}
            <View style={styles.track}>
              <View style={[styles.fill, styles.fillFull]} />
            </View>
          </View>
          <View style={styles.polaroid}>
            <View style={styles.tape} />
            {photo}
            <Text style={styles.caption}>Mission done 🐾</Text>
          </View>
          {daily.map(q => (
            <View key={q.id} style={styles.questRow}>
              <Text style={font.body}>✅ {q.title}</Text>
            </View>
          ))}
          <Text style={styles.coin}>+{coinsFor(summary.km)} 🪙</Text>
        </>)}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable style={styles.ghost} onPress={onClose} accessibilityRole="button">
          <Text style={styles.ghostText}>ปิด</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={share}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
        >
          <Text style={styles.btnText}>{busy ? 'กำลังเตรียม...' : 'แชร์'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
