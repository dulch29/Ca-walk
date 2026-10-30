import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { STORY_ASSETS } from '../../assets/storyAssets';
import {
  getStoryEndTime,
  getStoryHeading,
  getStoryLocation,
} from './storyModel';
import {
  art,
  INK,
  PAPER,
  MetaIcon,
  StoryCat,
  StoryPhoto,
  StoryShade,
  StoryText,
  type StoryPageProps,
} from './StoryArtwork';

export function MomentStoryPage({
  summary,
  photo,
  imageEvents,
}: StoryPageProps) {
  const color = photo ? '#FFFFFF' : INK;
  return (
    <View style={art.fill}>
      {photo && (
        <>
          <StoryPhoto uri={photo} imageEvents={imageEvents} />
          <StoryShade />
        </>
      )}
      <StoryText style={[styles.heading, { color }]}>
        {getStoryHeading(2, summary)}
      </StoryText>
      <Image
        source={STORY_ASSETS.whiteAccent}
        style={[styles.accent, { tintColor: color }]}
        {...imageEvents('accent')}
      />
      <Image
        source={STORY_ASSETS.whiteStar}
        style={[styles.star, { tintColor: color }]}
        {...imageEvents('star')}
      />
      <View style={styles.polaroid}>
        <View style={styles.photoFrame}>
          {photo ? (
            <StoryPhoto uri={photo} id="polaroid" imageEvents={imageEvents} />
          ) : (
            <StoryText style={styles.empty}>
              A little time{'\n'}outside.
            </StoryText>
          )}
        </View>
        <StoryText style={[styles.caption, art.thai]} numberOfLines={2}>
          {getStoryLocation(summary, photo)}
        </StoryText>
        <View style={styles.tape} />
      </View>
      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <MetaIcon clock color={color} />
          <StoryText style={[styles.metaText, { color }]}>
            Finished · {getStoryEndTime(summary)}
          </StoryText>
        </View>
        <View style={styles.metaRow}>
          <MetaIcon color={color} />
          <StoryText
            style={[art.thai, styles.location, { color }]}
            numberOfLines={2}
          >
            {getStoryLocation(summary, photo)}
          </StoryText>
        </View>
      </View>
      <StoryCat
        pose="sit"
        width={390}
        style={styles.cat}
        imageEvents={imageEvents}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  heading: {
    position: 'absolute',
    top: 295,
    left: 125,
    right: 145,
    fontSize: 102,
    lineHeight: 106,
    textAlign: 'center',
    transform: [{ rotate: '-9deg' }],
  },
  accent: { position: 'absolute', width: 126, height: 115, top: 540, left: 85 },
  star: { position: 'absolute', width: 67, height: 71, top: 1300, left: 170 },
  polaroid: {
    position: 'absolute',
    left: 235,
    top: 590,
    width: 610,
    height: 805,
    backgroundColor: '#FCFAF4',
    padding: 30,
    paddingBottom: 105,
    transform: [{ rotate: '-9deg' }],
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  photoFrame: {
    flex: 1,
    backgroundColor: PAPER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  empty: {
    width: '100%',
    fontSize: 84,
    lineHeight: 95,
    textAlign: 'center',
  },
  caption: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: 15,
    textAlign: 'center',
    fontSize: 36,
    lineHeight: 43,
  },
  tape: {
    position: 'absolute',
    top: -32,
    left: 204,
    width: 200,
    height: 80,
    backgroundColor: 'rgba(237,228,204,0.65)',
    transform: [{ rotate: '3deg' }],
  },
  meta: {
    position: 'absolute',
    left: 95,
    bottom: 200,
    width: 520,
    gap: 20,
    transform: [{ rotate: '-8deg' }],
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  metaText: { fontSize: 55, lineHeight: 66 },
  location: { flex: 1, fontSize: 39, lineHeight: 55 },
  cat: { right: 80, bottom: 100, transform: [{ rotate: '-3deg' }] },
});
