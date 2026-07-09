import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

import { Button } from './Button';
import { Card } from './Card';

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  footer?: ReactNode;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  footer,
}: EmptyStateProps) {
  return (
    <Card>
      <View style={styles.content}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {actionLabel ? (
          <Button fullWidth onPress={onAction}>
            {actionLabel}
          </Button>
        ) : null}
        {footer}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.brand,
    fontSize: theme.typeScale.eyebrow.fontSize,
    lineHeight: theme.typeScale.eyebrow.lineHeight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: theme.typeScale.eyebrow.letterSpacing,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
});
