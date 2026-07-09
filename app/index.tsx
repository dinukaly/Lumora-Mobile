import { StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  StatusBadge,
} from '@/components/ui';
import { theme } from '@/theme';

export default function HomeScreen() {
  return (
    <Screen
      title="Focused study, tuned for mobile."
      subtitle="Theme tokens and base UI primitives are ready for navigation, auth, and dashboard work."
      headerRight={<StatusBadge label="Foundation" />}
    >
      <Card
        title="Action surfaces"
        description="Buttons keep mobile-safe touch targets and use the Lumora teal learning palette."
      >
        <View style={styles.row}>
          <Button>Continue</Button>
          <Button variant="secondary">Review</Button>
        </View>
        <View style={styles.row}>
          <Button variant="ghost">Later</Button>
          <Button variant="danger">Delete</Button>
        </View>
      </Card>

      <Card
        title="Document status badges"
        description="Readiness states stay legible with both color and explicit labels."
      >
        <View style={styles.badgeRow}>
          <StatusBadge label="Uploaded" tone="UPLOADED" />
          <StatusBadge label="Processing" tone="PROCESSING" />
          <StatusBadge label="Ready" tone="READY" />
          <StatusBadge label="Failed" tone="FAILED" />
        </View>
      </Card>

      <EmptyState
        eyebrow="Empty state"
        title="No documents yet"
        description="Upload a PDF to start reading, asking questions, and generating study tools."
        actionLabel="Upload first PDF"
      />

      <ErrorState
        description="If a request fails, this shared state gives us consistent retry messaging across screens."
        onRetry={() => undefined}
      />

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Next screens can build on these shared tokens instead of duplicating spacing,
          color, and state styling.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  note: {
    paddingHorizontal: theme.spacing.sm,
  },
  noteText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
