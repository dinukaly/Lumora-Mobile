import { colors } from './colors';

export const shadows = {
  card: {
    shadowColor: colors.background,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },
} as const;
