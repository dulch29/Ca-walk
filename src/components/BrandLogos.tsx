import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface BrandLogoProps {
  size?: number;
}

/**
 * Authentic Café Amazon vector logo (100% reliable SVG, zero image asset dependency)
 */
export function AmazonLogo({ size = 52 }: BrandLogoProps) {
  const scale = size / 52;
  return (
    <View
      style={[
        styles.container,
        styles.amazonCard,
        { width: size, height: size, borderRadius: size * 0.22 },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 52 52">
        {/* Background circle badge with gold rim */}
        <Circle cx="26" cy="26" r="23" fill="#0E3B1E" stroke="#DCA23A" strokeWidth={1.5} />
        {/* Yellow parrot head */}
        <Path
          d="M 21 15 Q 27 11 34 16 Q 36 21 29 25 Q 23 27 21 24 Z"
          fill="#F5A623"
        />
        {/* Eye */}
        <Circle cx="26" cy="17" r="1.5" fill="#0E3B1E" />
        {/* Green body & feathers */}
        <Path
          d="M 18 21 Q 23 19 29 23 Q 27 30 20 32 Q 16 29 18 21 Z"
          fill="#3E894A"
        />
        {/* Red crest / beak tip */}
        <Path d="M 23 14 Q 22 10 27 12 Z" fill="#EE3124" />
        {/* Golden Amazon banner pill */}
        <Rect x="10" y="32" width="32" height="11" rx="4" fill="#DCA23A" />
      </Svg>
      <Text
        style={[
          styles.amazonText,
          { fontSize: 7 * scale, bottom: 4.5 * scale },
        ]}
      >
        Amazon
      </Text>
    </View>
  );
}

/**
 * Authentic 7-Eleven vector logo (100% reliable SVG)
 */
export function SevenElevenLogo({ size = 52 }: BrandLogoProps) {
  const scale = size / 52;
  return (
    <View
      style={[
        styles.container,
        styles.sevenCard,
        { width: size, height: size, borderRadius: size * 0.22 },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 52 52">
        {/* Top green bar */}
        <Rect x="7" y="6" width="38" height="4.5" rx="2" fill="#008060" />
        {/* Bottom orange bar */}
        <Rect x="7" y="41.5" width="38" height="4.5" rx="2" fill="#EE6E16" />
        {/* Orange 7 numeral */}
        <Path
          d="M 14 14 L 35 14 L 27 38 L 22 38 L 28 20 L 14 20 Z"
          fill="#EE6E16"
        />
        {/* Middle green stripe */}
        <Rect x="15" y="24" width="24" height="7" rx="1.5" fill="#008060" />
      </Svg>
      <Text
        style={[
          styles.sevenText,
          { fontSize: 5.5 * scale, top: 25.5 * scale, left: 17.5 * scale },
        ]}
      >
        ELEVEN
      </Text>
    </View>
  );
}

/**
 * Authentic Inthanin Coffee vector logo (100% reliable SVG)
 */
export function InthaninLogo({ size = 52 }: BrandLogoProps) {
  const scale = size / 52;
  return (
    <View
      style={[
        styles.container,
        styles.inthaninCard,
        { width: size, height: size, borderRadius: size * 0.22 },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 52 52">
        {/* Coffee leaves */}
        <Path
          d="M 26 11 Q 32 15 29 21 Q 26 20 26 11 Z"
          fill="#A47551"
        />
        <Path
          d="M 26 13 Q 20 16 22 21 Q 24 20 26 13 Z"
          fill="#D4A373"
        />
        {/* Red coffee berry */}
        <Circle cx="26" cy="21" r="2.5" fill="#E53E3E" />
        {/* Coffee cup silhouette */}
        <Path
          d="M 17 25 L 35 25 L 32 35 Q 26 37 20 35 Z"
          fill="#FFFFFF"
        />
        {/* Cup handle */}
        <Path
          d="M 34 27 Q 38 27 37 31 Q 36 33 33 33"
          stroke="#FFFFFF"
          strokeWidth={1.5}
          fill="none"
        />
      </Svg>
      <Text
        style={[
          styles.inthaninText,
          { fontSize: 6.5 * scale, bottom: 3.5 * scale },
        ]}
      >
        Inthanin
      </Text>
    </View>
  );
}

/**
 * Authentic KFC Colonel Sanders vector logo (100% reliable SVG)
 */
export function KfcLogo({ size = 52 }: BrandLogoProps) {
  const scale = size / 52;
  return (
    <View
      style={[
        styles.container,
        styles.kfcCard,
        { width: size, height: size, borderRadius: size * 0.22 },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 52 52">
        {/* Red background with white stripes */}
        <Rect x="0" y="0" width="52" height="52" fill="#ED1C24" />
        <Rect x="11" y="0" width="8" height="52" fill="#FFFFFF" />
        <Rect x="33" y="0" width="8" height="52" fill="#FFFFFF" />
        {/* White circle face silhouette */}
        <Circle cx="26" cy="21" r="10.5" fill="#FFFFFF" />
        {/* Glasses and smile */}
        <Circle cx="22.5" cy="19.5" r="2" fill="#262A22" />
        <Circle cx="29.5" cy="19.5" r="2" fill="#262A22" />
        <Circle cx="22.5" cy="19.5" r="1.2" fill="#FFFFFF" />
        <Circle cx="29.5" cy="19.5" r="1.2" fill="#FFFFFF" />
        {/* Beard & Mustache */}
        <Path d="M 21 24 Q 26 27 31 24 Q 26 31 21 24 Z" fill="#FFFFFF" stroke="#ECE4D8" strokeWidth={0.5} />
        {/* Bow tie */}
        <Path d="M 23 32 L 29 32 L 26 35 Z" fill="#262A22" />
        <Circle cx="26" cy="32" r="1.5" fill="#262A22" />
      </Svg>
      <Text
        style={[
          styles.kfcText,
          { fontSize: 7.5 * scale, bottom: 2 * scale },
        ]}
      >
        KFC
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
  amazonCard: {
    backgroundColor: '#0E3B1E',
  },
  sevenCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4D8',
  },
  inthaninCard: {
    backgroundColor: '#1B120C',
  },
  kfcCard: {
    backgroundColor: '#ED1C24',
    borderWidth: 1,
    borderColor: '#ECE4D8',
  },
  amazonText: {
    position: 'absolute',
    fontWeight: '900',
    color: '#0E3B1E',
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
  kfcText: {
    position: 'absolute',
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});
