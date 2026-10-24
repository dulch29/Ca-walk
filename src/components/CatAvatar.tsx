import React from 'react';
import { Image, StyleSheet } from 'react-native';

// Static requires so Metro bundles each GIF (no dynamic paths)
const GIFS = {
  idle: require('../../Assests/Cat/Animation/IDLE.gif'),
  sit: require('../../Assests/Cat/Animation/IDLE_SITE.gif'),
  walk: require('../../Assests/Cat/Animation/Walk.gif'),
  touch: require('../../Assests/Cat/Animation/touch.gif'),
  jump: require('../../Assests/Cat/Animation/jump.gif'),
  sleep: require('../../Assests/Cat/Animation/Sleep.gif'),
};

export type CatMood = keyof typeof GIFS;

type Props = {
  size?: number;
  mood?: CatMood;
};

export default function CatAvatar({ size = 120, mood = 'sit' }: Props) {
  return (
    <Image
      source={GIFS[mood]}
      accessibilityRole="image"
      accessibilityLabel="Ca-Walk cat"
      style={[styles.cat, { width: size, height: size }]}
      // keep pixel art crisp when scaled up
      resizeMethod="scale"
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  cat: { alignSelf: 'center' },
});
