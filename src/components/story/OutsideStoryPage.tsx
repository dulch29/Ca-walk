import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { STORY_ASSETS } from '../../assets/storyAssets';
import { getStoryHeading } from './storyModel';
import {
  art,
  INK,
  StoryCat,
  StoryPhoto,
  StoryShade,
  StoryText,
  SunDoodle,
  type StoryPageProps,
} from './StoryArtwork';

export function OutsideStoryPage({
  summary,
  photo,
  imageEvents,
}: StoryPageProps) {
  return (
    <View style={art.fill}>
      {photo && (
        <>
          <StoryPhoto uri={photo} imageEvents={imageEvents} />
          <StoryShade />
        </>
      )}
      <StoryText
        style={[
          styles.heading,
          photo ? styles.photoHeading : styles.paperHeading,
        ]}
      >
        {getStoryHeading(0, summary)}
      </StoryText>
      <View style={styles.sun}>
        <SunDoodle color={photo ? '#FFFFFF' : INK} />
      </View>
      <StoryCat
        pose="jump"
        width={440}
        style={styles.cat}
        imageEvents={imageEvents}
      />
      <Image
        source={STORY_ASSETS.paper}
        style={styles.paper}
        resizeMode="stretch"
        {...imageEvents('paper')}
      />
      <Image
        source={STORY_ASSETS.paw}
        style={styles.paw}
        {...imageEvents('paw')}
      />
      <StoryText style={styles.caption} numberOfLines={2}>
        {photo ? 'Fresh air hits different.' : 'A little time outside.'}
      </StoryText>
    </View>
  );
}
const styles = StyleSheet.create({
  photoHeading: { color: '#FFFFFF' },
  paperHeading: { color: INK },
  heading: {
    position: 'absolute',
    top: 460,
    left: 150,
    right: 130,
    fontSize: 128,
    lineHeight: 126,
    textAlign: 'center',
    transform: [{ rotate: '-5deg' }],
  },
  sun: { position: 'absolute', top: 755, right: 242 },
  cat: { right: 125, bottom: 272, transform: [{ rotate: '-8deg' }] },
  paper: {
    position: 'absolute',
    width: 1080,
    height: 394,
    left: 0,
    bottom: -8,
  },
  paw: {
    position: 'absolute',
    width: 65,
    height: 65,
    right: 160,
    bottom: 220,
    transform: [{ rotate: '-12deg' }],
  },
  caption: {
    position: 'absolute',
    left: 125,
    bottom: 125,
    width: 790,
    fontSize: 62,
    lineHeight: 76,
    transform: [{ rotate: '-8deg' }],
  },
});
