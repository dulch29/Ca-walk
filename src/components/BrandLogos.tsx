import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function AmazonLogo({ size = 52 }: { size?: number }) {
  const scale = size / 52;
  return (
    <View
      style={[
        styles.container,
        styles.amazonBg,
        { width: size, height: size, borderRadius: size * 0.22 },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 52 52">
        <Circle cx="26" cy="26" r="23" stroke="#DCA23A" strokeWidth={1.5} fill="none" />
        <Path
          d="M 21 16 Q 26 12 33 17 Q 35 22 28 25 Q 23 27 21 24 Z"
          fill="#F5A623"
        />
        <Circle cx="25" cy="18" r="1.5" fill="#1A3F22" />
        <Path
          d="M 18 22 Q 22 20 28 24 Q 26 31 19 33 Q 16 30 18 22 Z"
          fill="#41804B"
        />
        <Path d="M 23 15 Q 22 11 26 13 Z" fill="#D32F2F" />
        <Rect x="10" y="32" width="32" height="11" rx="4" fill="#DCA23A" />
        <Path
          d="M 14 38 L 16 34 L 18 38 M 15 37 L 17 37"
          stroke="#1A3F22"
          strokeWidth={1}
        />
      </Svg>
      <Text style={[styles.amazonText, { fontSize: 8 * scale, bottom: 4 * scale }]}>
        Amazon
      </Text>
    </View>
  );
}

export function SevenElevenLogo({ size = 52 }: { size?: number }) {
  const scale = size / 52;
  return (
    <View
      style={[
        styles.container,
        styles.sevenBg,
        { width: size, height: size, borderRadius: size * 0.22 },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 52 52">
        <Rect x="8" y="7" width="36" height="4" rx="2" fill="#008060" />
        <Rect x="8" y="41" width="36" height="4" rx="2" fill="#EE6E16" />
        <Path
          d="M 15 15 L 34 15 L 26 37 L 21 37 L 27 20 L 15 20 Z"
          fill="#EE3124"
        />
        <Rect x="16" y="24" width="23" height="6.5" rx="1.5" fill="#008060" />
      </Svg>
      <Text
        style={[
          styles.sevenText,
          { fontSize: 5.5 * scale, top: 25 * scale, left: 18 * scale },
        ]}
      >
        ELEVEN
      </Text>
    </View>
  );
}

export function InthaninLogo({ size = 52 }: { size?: number }) {
  const scale = size / 52;
  return (
    <View
      style={[
        styles.container,
        styles.inthaninBg,
        { width: size, height: size, borderRadius: size * 0.22 },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 52 52">
        <Path
          d="M 26 12 Q 31 16 28 22 Q 26 21 26 12 Z"
          fill="#A47551"
        />
        <Path
          d="M 26 14 Q 21 17 23 22 Q 25 21 26 14 Z"
          fill="#D4A373"
        />
        <Path
          d="M 18 24 L 34 24 L 31 34 Q 26 36 21 34 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M 33 26 Q 37 26 36 30 Q 35 32 32 32"
          stroke="#FFFFFF"
          strokeWidth={1.5}
          fill="none"
        />
      </Svg>
      <Text style={[styles.inthaninText, { fontSize: 6.5 * scale, bottom: 4 * scale }]}>
        Inthanin
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  amazonBg: {
    backgroundColor: '#1A3F22',
  },
  sevenBg: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E2D5',
    borderWidth: 1,
  },
  inthaninBg: {
    backgroundColor: '#2C1B14',
  },
  amazonText: {
    position: 'absolute',
    fontWeight: '900',
    color: '#1A3F22',
  },
  sevenText: {
    position: 'absolute',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  inthaninText: {
    position: 'absolute',
    fontWeight: '700',
    color: '#D4A373',
  },
});
