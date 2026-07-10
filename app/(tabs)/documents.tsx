import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type DocumentData,
  type DocumentStatus,
  useListDocumentsQuery,
} from '@/api/documentsApi';
import { DocumentRow } from '@/components/documents';
import { Button, Card, EmptyState, ErrorState, Screen } from '@/components/ui';
import { theme } from '@/theme';

const PAGE_SIZE = 12;

const STATUS_FILTERS: {
  label: string;
  value: DocumentStatus | undefined;
}[] = [
  { label: 'All', value: undefined },
  { label: 'Uploaded', value: 'UPLOADED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Failed', value: 'FAILED' },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | undefined>();

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useListDocumentsQuery({
    page: 1,
    limit: PAGE_SIZE,
    status: statusFilter,
  });

  const documents = data?.documents ?? [];
  const hasMorePages = Boolean(
    data && data.pagination.page < data.pagination.totalPages,
  );

  function handleRefresh() {
    void refetch();
  }

  function handleOpenDocument(document: DocumentData) {
    router.push({
      pathname: '/document/[id]/index',
      params: { id: document._id },
    });
  }

  return (
    <Screen
      title="Documents"
      subtitle="Browse your uploaded PDFs, filter by processing state, and open a document overview."
      refreshing={isFetching}
      onRefresh={handleRefresh}
      headerRight={
        <Button variant="secondary" onPress={() => undefined}>
          Upload soon
        </Button>
      }
    >
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((filter) => {
          const selected = filter.value === statusFilter;

          return (
            <Pressable
              key={filter.label}
              accessibilityRole="button"
              onPress={() => setStatusFilter(filter.value)}
              style={({ pressed }) => [
                styles.filterChip,
                selected ? styles.filterChipSelected : null,
                pressed ? styles.filterChipPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selected ? styles.filterChipTextSelected : null,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {data?.pagination ? (
        <Text style={styles.summaryText}>
          Showing {documents.length} of {data.pagination.total} documents
          {hasMorePages ? ' • More pages available' : ''}
        </Text>
      ) : null}

      {isLoading && documents.length === 0 ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
              <View style={styles.skeletonMeta} />
            </Card>
          ))}
        </View>
      ) : null}

      {!isLoading && error && documents.length === 0 ? (
        <ErrorState
          title="Documents unavailable"
          description="We could not load your document library right now."
          onRetry={handleRefresh}
        />
      ) : null}

      {!isLoading && !error && documents.length === 0 ? (
        <EmptyState
          eyebrow="No documents yet"
          title="Your library is empty"
          description="Uploaded PDFs will appear here with status badges and quick access into each document overview."
          actionLabel="Go to dashboard"
          onAction={() => router.push('/(tabs)/dashboard')}
        />
      ) : null}

      {documents.length > 0 ? (
        <View style={styles.list}>
          {documents.map((document) => (
            <DocumentRow
              key={document._id}
              document={document}
              onPress={handleOpenDocument}
            />
          ))}
        </View>
      ) : null}

      {error && documents.length > 0 ? (
        <Text style={styles.inlineError}>
          Some documents may be stale. Pull to refresh and try again.
        </Text>
      ) : null}

    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    minHeight: 38,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    borderColor: theme.colors.brandStrong,
    backgroundColor: theme.colors.brandSoft,
  },
  filterChipPressed: {
    opacity: 0.85,
  },
  filterChipText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '700',
  },
  filterChipTextSelected: {
    color: theme.colors.brandStrong,
  },
  summaryText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  list: {
    gap: theme.spacing.md,
  },
  skeletonTitle: {
    width: '55%',
    height: 18,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  skeletonSubtitle: {
    width: '75%',
    height: 14,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  skeletonMeta: {
    width: '60%',
    height: 14,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  inlineError: {
    color: theme.colors.warning,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
