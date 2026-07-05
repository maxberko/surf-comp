// Palette PoyPoyo — océan de nuit, écume, corail. Mobile-first, mode sombre par
// défaut (on log souvent au coucher du soleil, bière à la main).

export const colors = {
  bg: '#0B1E2D',
  bgElevated: '#12283A',
  card: '#16324A',
  cardBorder: '#1E3E58',

  text: '#EAF2F8',
  textMuted: '#8FA9BD',
  textFaint: '#5E7A90',

  accent: '#2FBFA0', // vert lagon
  accentDim: '#1E7A66',
  wave: '#38A3D1', // bleu vague
  coral: '#FF7A59', // corail (superlatifs)
  gold: '#F5C451', // podium
  danger: '#E5544B', // refus / contesté
  success: '#3FCF8E', // validé

  overlay: 'rgba(4, 12, 20, 0.72)',
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
