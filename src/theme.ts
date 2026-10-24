// Colors sampled from the Ca-Walk mockups
export const colors = {
  bg: '#F8F5EC',
  surface: '#FFFDF8',
  surfaceMuted: '#EFEADC',
  border: '#E3DCCB',
  primary: '#6B7F4E',
  primaryDark: '#4F6138',
  primaryLight: '#DDE5CF',
  text: '#2C2A25',
  textMuted: '#6E685C',
  onPrimary: '#FFFFFF',
  coin: '#E5A93D',
  danger: '#C8553D',
  locked: '#A39E92',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const font = {
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  small: { fontSize: 12, color: colors.textMuted },
};
