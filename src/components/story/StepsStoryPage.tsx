import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { STORY_ASSETS } from '../../assets/storyAssets';
import { getStoryHeading, getStoryMetrics } from './storyModel';
import {
  art,
  INK,
  PAPER,
  StoryCat,
  StoryText,
  type StoryPageProps,
} from './StoryArtwork';

export function StepsStoryPage({ summary, imageEvents }: StoryPageProps) {
  const metrics = getStoryMetrics(summary);
  return (
    <View style={art.fill}>
      <View style={styles.title}>
        <StoryText style={styles.label}>
          {getStoryHeading(1, summary)}
        </StoryText>
        <StoryText
          style={styles.steps}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {metrics.steps}
        </StoryText>
        <StoryText style={styles.label}>steps.</StoryText>
      </View>
      <Image
        source={STORY_ASSETS.inkAccent}
        style={styles.accent}
        resizeMode="contain"
        {...imageEvents('accent')}
      />
      <View style={styles.bubble}>
        <Svg width={320} height={290} viewBox="0 0 320 290">
          <Path
            d="M26 18Q150 0 292 26L283 203 202 209 176 267 163 210 12 199Z"
            fill={PAPER}
            stroke={INK}
            strokeWidth={5}
            strokeLinejoin="round"
          />
        </Svg>
        <StoryText style={styles.bubbleText} numberOfLines={1}>
          Not bad!
        </StoryText>
      </View>
      <StoryCat
        pose={summary.sport === 'run' ? 'run' : 'walk'}
        width={540}
        style={styles.cat}
        imageEvents={imageEvents}
      />
      <Image
        source={STORY_ASSETS.fish}
        style={styles.fish}
        resizeMode="contain"
        {...imageEvents('fish')}
      />
      <View style={styles.note}>
        <StoryText style={styles.encouragement}>Every step counts.</StoryText>
        <StoryText style={styles.metrics}>
          {metrics.distance} · {metrics.duration} active
        </StoryText>
        <StoryText style={styles.metrics}>{metrics.pace} average</StoryText>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  title: {
    position: 'absolute',
    left: 105,
    right: 170,
    top: 300,
    transform: [{ rotate: '-5deg' }],
  },
  label: { fontSize: 96, lineHeight: 104 },
  steps: { fontSize: 222, lineHeight: 225, letterSpacing: -3 },
  accent: {
    position: 'absolute',
    width: 124,
    height: 130,
    right: 235,
    top: 288,
  },
  bubble: {
    position: 'absolute',
    right: 120,
    top: 670,
    transform: [{ rotate: '4deg' }],
  },
  bubbleText: {
    position: 'absolute',
    left: 35,
    right: 35,
    textAlign: 'center',
    top: 64,
    fontSize: 66,
    lineHeight: 84,
  },
  cat: { left: 242, top: 1030, transform: [{ rotate: '-8deg' }] },
  fish: { position: 'absolute', left: 95, top: 1380, width: 150, height: 134 },
  note: {
    position: 'absolute',
    left: 85,
    right: 85,
    bottom: 180,
    padding: 42,
    backgroundColor: '#F8F4E7',
    borderColor: '#DED8C7',
    borderWidth: 3,
    borderRadius: 44,
    transform: [{ rotate: '-2deg' }],
  },
  encouragement: { fontSize: 66, lineHeight: 80 },
  metrics: { fontSize: 47, lineHeight: 62 },
});
