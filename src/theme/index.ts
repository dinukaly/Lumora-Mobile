import { colors } from './colors';
import { layout, spacing } from './spacing';
import { fontFamily, typeScale } from './typography';
import { radii } from './radii';
import { shadows } from './shadows';

export const theme = {
  colors,
  spacing,
  layout,
  fontFamily,
  typeScale,
  radii,
  shadows,
} as const;

export * from './colors';
export * from './spacing';
export * from './typography';
export * from './radii';
export * from './shadows';
