import { StyleSheet, Text, View } from 'react-native';

import { statusColors, theme, type DocumentStatusTone } from '@/theme';

type StatusBadgeProps = {
  label: string;
  tone?: DocumentStatusTone | 'INFO';
};

export function StatusBadge({ label, tone = 'INFO' }: StatusBadgeProps) {
  const palette =
    tone === 'INFO'
      ? { background: theme.colors.brandSoft, text: theme.colors.brandStrong }
      : statusColors[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.background,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: palette.text,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    minHeight: 30,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
