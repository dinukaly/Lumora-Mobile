import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

import { Card } from '@/components/ui';

type StatCardProps = {
  label: string;
  value: number | string;
  accentColor: string;
  accentSoftColor: string;
  caption?: string;
};

export function StatCard({
  label,
  value,
  accentColor,
  accentSoftColor,
  caption,
}: StatCardProps) {
  return (
    <Card>
      <View style={styles.row}>
        <View style={[styles.accentChip, { backgroundColor: accentSoftColor }]}>
          <View style={[styles.accentDot, { backgroundColor: accentColor }]} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  accentChip: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentDot: {
    width: 16,
    height: 16,
    borderRadius: theme.radii.pill,
  },
  label: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '600',
  },
  value: {
    color: theme.colors.text,
    fontSize: theme.typeScale.display.fontSize,
    lineHeight: theme.typeScale.display.lineHeight,
    fontWeight: '700',
  },
  caption: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
