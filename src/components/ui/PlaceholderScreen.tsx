import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

import { Button } from './Button';
import { Card } from './Card';
import { Screen } from './Screen';
import { StatusBadge } from './StatusBadge';

type PlaceholderAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
  badgeLabel?: string;
  badgeTone?: 'INFO' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  highlights?: string[];
  actions?: PlaceholderAction[];
  footer?: ReactNode;
};

export function PlaceholderScreen({
  title,
  subtitle,
  badgeLabel,
  badgeTone = 'INFO',
  highlights = [],
  actions = [],
  footer,
}: PlaceholderScreenProps) {
  return (
    <Screen
      title={title}
      subtitle={subtitle}
      headerRight={badgeLabel ? <StatusBadge label={badgeLabel} tone={badgeTone} /> : undefined}
    >
      {highlights.length ? (
        <Card title="What this route proves">
          <View style={styles.highlightList}>
            {highlights.map((item) => (
              <View key={item} style={styles.highlightRow}>
                <View style={styles.dot} />
                <Text style={styles.highlightText}>{item}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {actions.length ? (
        <Card title="Navigation demo" description="These links keep the route tree testable while real features are still in progress.">
          <View style={styles.actions}>
            {actions.map((action) => (
              <Button
                key={action.label}
                fullWidth
                variant={action.variant ?? 'secondary'}
                onPress={action.onPress}
              >
                {action.label}
              </Button>
            ))}
          </View>
        </Card>
      ) : null}

      {footer}
    </Screen>
  );
}

const styles = StyleSheet.create({
  highlightList: {
    gap: theme.spacing.md,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.brand,
    marginTop: 8,
  },
  highlightText: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
