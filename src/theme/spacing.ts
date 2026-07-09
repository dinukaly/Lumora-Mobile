export const spacing = {
  px: 1,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const layout = {
  screenPadding: spacing.xl,
  sectionGap: spacing['2xl'],
  cardGap: spacing.lg,
  touchTarget: 48,
} as const;
