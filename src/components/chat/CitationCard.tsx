import { StyleSheet, Text, View } from 'react-native';

import type { MessageCitation } from '@/api/conversationsApi';
import { theme } from '@/theme';

export function CitationCard({ citation }: { citation: MessageCitation }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>Source</Text>
        {citation.pageNumber != null ? (
          <View style={styles.pageChip}>
            <Text style={styles.pageChipText}>Page {citation.pageNumber}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.snippet}>
        {citation.snippet?.trim() || 'This answer is grounded in the selected document.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.brand,
    fontSize: theme.typeScale.eyebrow.fontSize,
    lineHeight: theme.typeScale.eyebrow.lineHeight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: theme.typeScale.eyebrow.letterSpacing,
  },
  pageChip: {
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.brandSoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  pageChipText: {
    color: theme.colors.brandStrong,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  snippet: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
