import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { STORY_ASSETS } from '../../assets/storyAssets';
import { getStoryHeading } from './storyModel';
import {
  art,
  PAPER,
  StoryCat,
  StoryPhoto,
  StoryText,
  type StoryPageProps,
} from './StoryArtwork';

export function RestStoryPage({ summary, photo, imageEvents }: StoryPageProps) {
  return (
    <View style={art.fill}>
      {photo && (
        <View style={styles.band}>
          <StoryPhoto uri={photo} imageEvents={imageEvents} />
          <View style={styles.wash} />
        </View>
      )}
      <StoryText style={styles.heading}>
        {getStoryHeading(3, summary)}
      </StoryText>
      <Image
        source={STORY_ASSETS.restPaw}
        style={styles.paw}
        resizeMode="contain"
        {...imageEvents('paw')}
      />
      <Image
        source={STORY_ASSETS.star}
        style={styles.star}
        resizeMode="contain"
        {...imageEvents('star')}
      />
      <Image
        source={STORY_ASSETS.sparkle}
        style={styles.sparkle}
        resizeMode="contain"
        {...imageEvents('sparkle')}
      />
      <View style={styles.paper} />
      <StoryCat
        pose="sleep"
        width={660}
        style={styles.cat}
        imageEvents={imageEvents}
      />
      <StoryText style={styles.caption}>A little time outside.</StoryText>
      <StoryText style={styles.signoff}>That was enough for today.</StoryText>
    </View>
  );
}
const styles = StyleSheet.create({
  heading: {
    position: 'absolute',
    top: 340,
    left: 155,
    right: 130,
    fontSize: 110,
    lineHeight: 122,
    transform: [{ rotate: '-5deg' }],
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 720,
    height: 690,
    overflow: 'hidden',
  },
  wash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(241,235,221,0.66)',
  },
  paper: {
    position: 'absolute',
    left: -80,
    right: -80,
    height: 650,
    bottom: -60,
    backgroundColor: PAPER,
    transform: [{ rotate: '-5deg' }],
  },
  paw: {
    position: 'absolute',
    right: 195,
    top: 555,
    width: 86,
    height: 86,
    transform: [{ rotate: '12deg' }],
  },
  star: { position: 'absolute', left: 65, top: 880, width: 65, height: 65 },
  sparkle: {
    position: 'absolute',
    right: 75,
    top: 1040,
    width: 72,
    height: 72,
  },
  cat: { left: 220, top: 1080, transform: [{ rotate: '-6deg' }] },
  caption: {
    position: 'absolute',
    top: 1510,
    left: 100,
    right: 100,
    textAlign: 'center',
    fontSize: 82,
    lineHeight: 100,
    transform: [{ rotate: '-3deg' }],
  },
  signoff: {
    position: 'absolute',
    top: 1660,
    left: 100,
    right: 100,
    textAlign: 'center',
    fontSize: 52,
    lineHeight: 68,
  },
});
