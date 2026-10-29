import React from 'react';
import {
  Image,
  Text,
  View,
  StyleSheet,
  type ImageProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { CAT_PHOTOS } from '../../assets/catPhotos';
import type { RunSummary } from '../../types/activity';

export const PAPER = '#F1EBDD';
export const INK = '#171813';
export type StoryImageEvents = (
  id: string,
) => Pick<ImageProps, 'onLoad' | 'onError'>;
export type StoryPageProps = {
  summary: Readonly<RunSummary>;
  photo: string | null;
  imageEvents: StoryImageEvents;
};

export function StoryText({ style, ...props }: TextProps) {
  return <Text allowFontScaling={false} style={[art.text, style]} {...props} />;
}

export function StoryPhoto({
  uri,
  imageEvents,
  id = 'photo',
  style,
}: {
  uri: string;
  imageEvents: StoryImageEvents;
  id?: string;
  style?: ImageProps['style'];
}) {
  return (
    <Image
      key={uri}
      source={{ uri }}
      style={[StyleSheet.absoluteFill, style]}
      resizeMode="cover"
      accessibilityLabel="ภาพถ่ายจากกิจกรรมนี้"
      {...imageEvents(id)}
    />
  );
}

// Alpha bounds measured from the unmodified 512px originals; crop only the viewport.
const CAT_BOUNDS = {
  idle: [144, 336, 208, 176],
  sit: [144, 320, 192, 192],
  jump: [144, 256, 240, 256],
  walk: [112, 336, 256, 176],
  run: [144, 320, 240, 144],
  sleep: [128, 384, 256, 128],
} as const;

export function StoryCat({
  pose,
  width,
  style,
  imageEvents,
}: {
  pose: keyof typeof CAT_BOUNDS;
  width: number;
  style?: ViewStyle;
  imageEvents: StoryImageEvents;
}) {
  const [x, y, contentWidth, contentHeight] = CAT_BOUNDS[pose];
  const scale = width / contentWidth;
  return (
    <View
      style={[
        art.catViewport,
        {
          width,
          height: contentHeight * scale,
        },
        style,
      ]}
    >
      <Image
        source={CAT_PHOTOS[pose]}
        resizeMode="contain"
        resizeMethod="scale"
        style={[
          art.image,
          {
            width: 512 * scale,
            height: 512 * scale,
            left: -x * scale,
            top: -y * scale,
          },
        ]}
        accessibilityLabel={`แมว ${pose}`}
        {...imageEvents('cat')}
      />
    </View>
  );
}

export function StoryShade() {
  return (
    <Svg width={1080} height={1920} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="story-shade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity={0.55} />
          <Stop offset="0.5" stopColor="#000000" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0.62} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#story-shade)" />
    </Svg>
  );
}

export function SunDoodle({ color = INK }: { color?: string }) {
  return (
    <Svg
      width={140}
      height={140}
      viewBox="0 0 140 140"
      fill="none"
      stroke={color}
      strokeWidth={4}
    >
      <Circle cx={70} cy={70} r={23} />
      <Path
        d="M70 8v15M70 117v15M8 70h15M117 70h15M26 26l11 11M103 103l11 11M26 114l11-11M103 37l11-11M62 67h1M79 67h1M61 79q9 9 18 0"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MetaIcon({
  clock,
  color = INK,
}: {
  clock?: boolean;
  color?: string;
}) {
  return (
    <Svg
      width={42}
      height={42}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
    >
      {clock ? (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 6v6l4 2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1116 0Z" />
          <Circle cx={12} cy={10} r={2.5} />
        </>
      )}
    </Svg>
  );
}

export const art = StyleSheet.create({
  text: {
    color: INK,
    fontFamily: 'Caveat-Regular',
    fontSize: 70,
    lineHeight: 82,
    includeFontPadding: false,
  },
  fill: { ...StyleSheet.absoluteFill, backgroundColor: PAPER },
  catViewport: { position: 'absolute', overflow: 'hidden' },
  image: { position: 'absolute' },
  caption: { fontSize: 60, lineHeight: 76 },
  thai: { fontFamily: 'sans-serif', fontSize: 44, lineHeight: 62 },
});
