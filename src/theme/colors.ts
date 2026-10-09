export const colors = {
  background: '#031412',
  backgroundMuted: '#0A201D',
  surface: '#102825',
  surfaceElevated: '#173330',
  surfaceSoft: '#1C3D39',
  border: '#29544D',
  borderStrong: '#367067',
  text: '#F3FFFB',
  textMuted: '#B7D4CC',
  textSoft: '#85A79E',
  brand: '#38BFA5',
  brandStrong: '#1EA58D',
  brandSoft: '#D6FFF5',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  success: '#10B981',
  successSoft: '#D1FAE5',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  overlay: 'rgba(0, 0, 0, 0.38)',
} as const;

export const statusColors = {
  UPLOADED: {
    background: '#DBEAFE',
    text: '#1D4ED8',
  },
  PROCESSING: {
    background: '#FEF3C7',
    text: '#B45309',
  },
  READY: {
    background: '#D1FAE5',
    text: '#047857',
  },
  FAILED: {
    background: '#FEE2E2',
    text: '#B91C1C',
  },
} as const;

export type DocumentStatusTone = keyof typeof statusColors;
