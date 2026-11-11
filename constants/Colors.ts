/**
 * Pockito color palette, built around two brand colors:
 *  - sand: #e8d2b5
 *  - sage: #a5a79b
 */
export const palette = {
  sand: {
    50: '#fbf7f1',
    100: '#f5ece0',
    200: '#f0e1cc',
    300: '#e8d2b5', // brand primary
    400: '#d9bf9c',
    500: '#cbb08d',
    600: '#a98f6c',
    700: '#80694c',
    800: '#574634',
    900: '#2a2620',
  },
  sage: {
    50: '#f4f4f1',
    100: '#e6e7e2',
    200: '#d0d2ca',
    300: '#bcbeb3',
    400: '#a5a79b', // brand secondary
    500: '#8a8c80',
    600: '#6e7065',
    700: '#54564d',
    800: '#3a3b35',
    900: '#232421',
  },
  ink: {
    900: '#0d0e0c',
    800: '#141513',
    700: '#1a1c19',
    600: '#232421',
  },
  income: { light: '#2e9e6b', dark: '#4ade80' },
  expense: { light: '#d9534f', dark: '#f87171' },
  white: '#ffffff',
  black: '#000000',
} as const;

export type ThemeColors = {
  text: string; background: string; tint: string; tabIconDefault: string; tabIconSelected: string;
  textMuted: string; hero: string; heroText: string; sheet: string; card: string; cardBorder: string;
  pill: string; accent: string; accentSoft: string; secondary: string; secondarySoft: string;
  darkCard: string; darkCardText: string; income: string; expense: string; chartLine: string;
};

const light: ThemeColors = {
  text: '#1c1a17',
  background: palette.sand[300],
  tint: palette.sand[800],
  tabIconDefault: palette.sage[400],
  tabIconSelected: palette.sand[800],

  textMuted: palette.sage[600],
  hero: palette.sand[300],
  heroText: '#1c1a17',
  sheet: '#faf8f5',
  card: palette.white,
  cardBorder: palette.sage[100],
  pill: 'rgba(255,255,255,0.45)',
  accent: palette.sand[300],
  accentSoft: palette.sand[100],
  secondary: palette.sage[400],
  secondarySoft: palette.sage[100],
  darkCard: palette.ink[800],
  darkCardText: palette.white,
  income: palette.income.light,
  expense: palette.expense.light,
  chartLine: palette.sand[300],
};

const dark: ThemeColors = {
  text: '#f5ece0',
  background: palette.ink[900],
  tint: palette.sand[300],
  tabIconDefault: palette.sage[400],
  tabIconSelected: palette.sand[300],

  textMuted: palette.sage[400],
  hero: '#1c1a17',
  heroText: palette.sand[100],
  sheet: '#121311',
  card: palette.ink[700],
  cardBorder: palette.ink[600],
  pill: 'rgba(232,210,181,0.12)',
  accent: palette.sand[300],
  accentSoft: palette.sand[900],
  secondary: palette.sage[400],
  secondarySoft: palette.sage[900],
  darkCard: palette.ink[800],
  darkCardText: palette.white,
  income: palette.income.dark,
  expense: palette.expense.dark,
  chartLine: palette.sand[300],
};

export default { light, dark };
