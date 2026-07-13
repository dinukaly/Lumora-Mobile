import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type DocumentData,
  type DocumentStatus,
  useGetDocumentQuery,
} from '@/api/documentsApi';
import {
  Button,
  Card,
  ErrorState,
  InlineNotice,
  Screen,
  StatusBadge,
} from '@/components/ui';
import { theme } from '@/theme';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Processing',
  READY: 'Ready',
  FAILED: 'Failed',
};

export default function DocumentOverviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const {
    data: document,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetDocumentQuery(documentId ?? '', {
    skip: !documentId,
  });

  if (!documentId) {
    return (
      <Screen
        title="Document overview"
        subtitle="We could not identify which document to open."
      >
        <ErrorState
          title="Document not found"
          description="Return to your library and open the document again."
          onRetry={() => router.push('/(tabs)/documents')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="Document overview"
      subtitle="Review processing status, metadata, and the study tools available for this file."
      refreshing={isFetching}
      onRefresh={() => void refetch()}
      headerRight={
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.push('/(tabs)/documents')}
        >
          Library
        </Button>
      }
    >
      {isLoading && !document ? (
        <View style={styles.stack}>
          <Card>
            <View style={styles.loadingTitle} />
            <View style={styles.loadingSubtitle} />
            <View style={styles.loadingBadge} />
          </Card>
          <Card>
            <View style={styles.metaGrid}>
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={index} style={styles.metaItem}>
                  <View style={styles.loadingMetaLabel} />
                  <View style={styles.loadingMetaValue} />
                </View>
              ))}
            </View>
          </Card>
          <Card>
            <View style={styles.actionGrid}>
              {Array.from({ length: 5 }).map((_, index) => (
                <View key={index} style={styles.actionSkeleton} />
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {!isLoading && error && !document ? (
        <ErrorState
          title="Document unavailable"
          description="We could not load this document right now."
          onRetry={() => void refetch()}
        />
      ) : null}

      {error && document ? (
        <InlineNotice message="This document is showing cached details. Pull to refresh and try again." />
      ) : null}

      {document ? (
        <DocumentOverviewContent document={document} />
      ) : null}
    </Screen>
  );
}

function DocumentOverviewContent({ document }: { document: DocumentData }) {
  const router = useRouter();
  const isReady = document.status === 'READY';
  const canOpenPdf = document.status !== 'FAILED';
  const statusMessage = getStatusMessage(document);

  return (
    <View style={styles.stack}>
      <Card>
        <View style={styles.heroHeader}>
          <View style={styles.heroText}>
            <Text style={styles.title}>{document.title}</Text>
            <Text style={styles.subtitle}>{document.originalFileName}</Text>
          </View>
          <StatusBadge
            label={STATUS_LABELS[document.status]}
            tone={document.status}
          />
        </View>

        <Text style={styles.statusMessage}>{statusMessage}</Text>

        {document.status === 'FAILED' ? (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Processing needs attention</Text>
            <Text style={styles.alertBody}>
              {document.processingError ??
                'Lumora could not finish processing this file.'}
            </Text>
          </View>
        ) : null}
      </Card>

      <Card
        title="Metadata"
        description="Core file details and study readiness for this document."
      >
        <View style={styles.metaGrid}>
          <MetadataItem
            label="Status"
            value={STATUS_LABELS[document.status]}
          />
          <MetadataItem
            label="Pages"
            value={
              document.pageCount != null
                ? `${document.pageCount}`
                : 'Pending'
            }
          />
          <MetadataItem
            label="File size"
            value={formatFileSize(document.fileSize)}
          />
          <MetadataItem
            label="Uploaded"
            value={formatDate(document.createdAt)}
          />
          <MetadataItem
            label="Updated"
            value={formatDate(document.updatedAt)}
          />
          <MetadataItem
            label="Subject"
            value={document.subjectTag ?? 'Unspecified'}
          />
          <MetadataItem
            label="Flashcards"
            value={
              document.flashcardCount != null
                ? `${document.flashcardCount}`
                : isReady
                  ? '0'
                  : 'Locked'
            }
          />
          <MetadataItem
            label="Quizzes"
            value={
              document.quizCount != null ? `${document.quizCount}` : isReady ? '0' : 'Locked'
            }
          />
        </View>
      </Card>

      <Card
        title="Study actions"
        description="Open the source PDF or jump into document-specific learning tools."
      >
        <View style={styles.actionGrid}>
          <ActionTile
            title="Read PDF"
            description="Open the protected source document."
            disabled={!canOpenPdf}
            onPress={() =>
              router.push({
                pathname: '/document/[id]/pdf',
                params: { id: document._id },
              })
            }
          />
          <ActionTile
            title="Ask AI"
            description="Chat with Lumora about this document."
            disabled={!isReady}
            onPress={() =>
              router.push({
                pathname: '/document/[id]/chat',
                params: { id: document._id },
              })
            }
          />
          <ActionTile
            title="AI Actions"
            description="Summaries, concepts, and guided breakdowns."
            disabled={!isReady}
            onPress={() =>
              router.push({
                pathname: '/document/[id]/actions',
                params: { id: document._id },
              })
            }
          />
          <ActionTile
            title="Flashcards"
            description="Review or generate cards for this material."
            disabled={!isReady}
            onPress={() =>
              router.push({
                pathname: '/document/[id]/flashcards',
                params: { id: document._id },
              })
            }
          />
          <ActionTile
            title="Quizzes"
            description="Practice with scored quiz sessions."
            disabled={!isReady}
            onPress={() =>
              router.push({
                pathname: '/document/[id]/quizzes',
                params: { id: document._id },
              })
            }
          />
        </View>

        <Text style={styles.actionHint}>
          {isReady
            ? 'All document study tools are unlocked.'
            : 'AI actions, flashcards, and quizzes unlock once processing reaches READY.'}
        </Text>
      </Card>
    </View>
  );
}

function MetadataItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function ActionTile({
  title,
  description,
  disabled = false,
  onPress,
}: {
  title: string;
  description: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionTile,
        disabled ? styles.actionTileDisabled : null,
        pressed && !disabled ? styles.actionTilePressed : null,
      ]}
    >
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
      <Text style={styles.actionFooter}>{disabled ? 'Locked for now' : 'Open'}</Text>
    </Pressable>
  );
}

function getStatusMessage(document: DocumentData) {
  switch (document.status) {
    case 'UPLOADED':
      return 'The file is uploaded and waiting to be processed before AI study tools become available.';
    case 'PROCESSING':
      return 'Lumora is currently indexing this document. Pull to refresh for the latest progress.';
    case 'READY':
      return 'Processing is complete. You can now open the PDF and use all study actions for this document.';
    case 'FAILED':
      return 'Processing did not complete successfully. Review the error details before retrying later.';
  }
}

function formatFileSize(bytes?: number) {
  if (bytes == null) {
    return 'Unknown';
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

const styles = StyleSheet.create({
  stack: {
    gap: theme.spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  heroText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typeScale.heading.fontSize,
    lineHeight: theme.typeScale.heading.lineHeight,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  statusMessage: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  alertBox: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.dangerSoft,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  alertTitle: {
    color: '#7F1D1D',
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
    fontWeight: '700',
  },
  alertBody: {
    color: '#7F1D1D',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metaItem: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metaLabel: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionTile: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.lg,
    minHeight: 132,
    gap: theme.spacing.sm,
  },
  actionTileDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    opacity: 0.56,
  },
  actionTilePressed: {
    opacity: 0.84,
  },
  actionTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  actionDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    flexGrow: 1,
  },
  actionFooter: {
    color: theme.colors.brand,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '700',
  },
  actionHint: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  loadingTitle: {
    width: '68%',
    height: 28,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingSubtitle: {
    width: '84%',
    height: 16,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingBadge: {
    width: 104,
    height: 30,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingMetaLabel: {
    width: '55%',
    height: 12,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingMetaValue: {
    width: '70%',
    height: 22,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  actionSkeleton: {
    minWidth: '47%',
    flexGrow: 1,
    minHeight: 132,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceSoft,
  },
});
