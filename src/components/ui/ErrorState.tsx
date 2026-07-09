import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

import { Button } from './Button';
import { Card } from './Card';

type ErrorStateProps = {
  title?: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Something went wrong',
  description,
  retryLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card>
      <View style={styles.banner}>
        <Text style={styles.kicker}>Needs attention</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {onRetry ? (
          <Button fullWidth variant="secondary" onPress={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.danger,
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
