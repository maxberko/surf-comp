// Palette PoyPoyo — océan de nuit, écume, corail. Mobile-first, mode sombre par
// défaut (on log souvent au coucher du soleil, bière à la main).

export const colors = {
  // Base aubergine 🍆 — sombre, charnu, un poil salace.
  bg: '#150A20',
  bgElevated: '#22103A',
  card: '#2A143F',
  cardBorder: '#3D2158',

  text: '#F6EAF6',
  textMuted: '#BBA1CC',
  textFaint: '#836C97',

  accent: '#FF3D7F', // rose chaud (hot pink)
  accentDim: '#9C1E4E',
  wave: '#B06BE6', // violet aubergine
  coral: '#FF7A59', // corail (superlatifs)
  gold: '#F5C451', // podium
  danger: '#E5544B', // refus / contesté
  success: '#3FCF8E', // validé

  overlay: 'rgba(10, 4, 16, 0.74)',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type ThemeColor = keyof typeof colors;
