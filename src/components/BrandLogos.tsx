import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const LOGO_AMAZON = require('../../Assests/Images/logo_amazon.png');
const LOGO_7ELEVEN = require('../../Assests/Images/logo_7eleven.png');
const LOGO_INTHANIN = require('../../Assests/Images/logo_inthanin.jpg');
const LOGO_KFC = require('../../Assests/Images/logo_kfc.png');

interface BrandLogoProps {
  size?: number;
}

export function AmazonLogo({ size = 52 }: BrandLogoProps) {
  return (
    <View style={[styles.container, styles.amazonCard, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <Image
        source={LOGO_AMAZON}
        style={{ width: size * 0.88, height: size * 0.88 }}
        resizeMode="contain"
      />
    </View>
  );
}

export function SevenElevenLogo({ size = 52 }: BrandLogoProps) {
  return (
    <View style={[styles.container, styles.sevenCard, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <Image
        source={LOGO_7ELEVEN}
        style={{ width: size * 0.86, height: size * 0.86 }}
        resizeMode="contain"
      />
    </View>
  );
}

export function InthaninLogo({ size = 52 }: BrandLogoProps) {
  return (
    <View style={[styles.container, styles.inthaninCard, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <Image
        source={LOGO_INTHANIN}
        style={{ width: size * 0.94, height: size * 0.94 }}
        resizeMode="contain"
      />
    </View>
  );
}

export function KfcLogo({ size = 52 }: BrandLogoProps) {
  return (
    <View style={[styles.container, styles.kfcCard, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <Image
        source={LOGO_KFC}
        style={{ width: size * 0.85, height: size * 0.85 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    backgroundColor: '#000000',
  },
  kfcCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4D8',
  },
});
