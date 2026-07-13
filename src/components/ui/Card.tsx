import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type CardProps = PropsWithChildren<{
  title?: string;
  description?: string;
}>;

export function Card({ children, title, description }: CardProps) {
  return (
    <View style={styles.card}>
      {title || description ? (
        <View style={styles.header}>
          {title ? (
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
          ) : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    ...theme.shadows.card,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
