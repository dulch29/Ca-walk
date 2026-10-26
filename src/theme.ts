// Colors matched to Walking / Running Cat Wireframe Spec
export const colors = {
  // Wireframe Core Palette
  bg: '#F7F2EB', // Warm Cream (60%)
  card: '#EAE2D6', // Cat Beige (30%)
  primary: '#6B9A6E', // Sage Olive (10%)
  primaryDark: '#507953',
  primaryLight: '#E3EDE3',
  text: '#262A22', // Dark Ink
  textMuted: '#70756B', // Secondary
  border: '#E5DED3',
  lightGrey: '#EEEEEE',
  surface: '#FFFDF9',
  surfaceMuted: '#F0EAE1',
  onPrimary: '#FFFFFF',

  // Accents
  coin: '#E5A93D', // Cat coin gold
  danger: '#C8553D',
  locked: '#A39E92',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36 };

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 };

// Typography scale matching TH Sarabun / Inter spec in wireframe
export const font = {
  h1: { fontSize: 24, fontWeight: '700' as const, color: colors.text, lineHeight: 30 },
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.text, lineHeight: 28 },
  h2: { fontSize: 20, fontWeight: '600' as const, color: colors.text, lineHeight: 26 },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.text, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.text, lineHeight: 20 },
  bodyMedium: { fontSize: 14, fontWeight: '500' as const, color: colors.text, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 16 },
  small: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 16 },
  button: { fontSize: 14, fontWeight: '600' as const, color: colors.onPrimary, lineHeight: 20 },
};

