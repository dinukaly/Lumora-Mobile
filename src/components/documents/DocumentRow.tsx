import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DocumentData, DocumentStatus } from '@/api/documentsApi';
import { StatusBadge } from '@/components/ui';
import { theme } from '@/theme';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Processing',
  READY: 'Ready',
  FAILED: 'Failed',
};

type DocumentRowProps = {
  document: DocumentData;
  onPress?: (document: DocumentData) => void;
};

export function DocumentRow({ document, onPress }: DocumentRowProps) {
  return (
    <Pressable
      accessibilityHint="Opens the document overview and study tools."
      accessibilityLabel={buildDocumentAccessibilityLabel(document)}
      accessibilityRole="button"
      onPress={onPress ? () => onPress(document) : undefined}
      style={({ pressed }) => [
        styles.container,
        pressed ? styles.containerPressed : null,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {document.title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {document.originalFileName}
          </Text>
        </View>
        <StatusBadge
          label={STATUS_LABELS[document.status]}
          tone={document.status}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{formatFileSize(document.fileSize)}</Text>
        <Text style={styles.metaDivider}>•</Text>
        <Text style={styles.metaText}>
          {document.pageCount ? `${document.pageCount} pages` : 'Pages pending'}
        </Text>
        <Text style={styles.metaDivider}>•</Text>
        <Text style={styles.metaText}>{formatDate(document.createdAt)}</Text>
      </View>

      {document.status === 'PROCESSING' ? (
        <Text style={styles.processingText}>
          Processing is in progress. This document will unlock once indexing finishes.
        </Text>
      ) : null}

      {document.status === 'FAILED' && document.processingError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{document.processingError}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function formatFileSize(bytes?: number) {
  if (bytes == null) {
    return 'Unknown size';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildDocumentAccessibilityLabel(document: DocumentData) {
  const statusLabel = STATUS_LABELS[document.status];
  const pageLabel = document.pageCount ? `${document.pageCount} pages` : 'page count pending';

  return `${document.title}. Status ${statusLabel}. ${pageLabel}. Created ${formatDate(document.createdAt)}.`;
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  containerPressed: {
    opacity: 0.84,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  metaDivider: {
    color: theme.colors.borderStrong,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  processingText: {
    color: theme.colors.warning,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  errorBox: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.dangerSoft,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  errorText: {
    color: '#7F1D1D',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
