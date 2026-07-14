import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveApiBaseUrl } from '@/api/apiConfig';
import { apiSlice } from '@/api/apiSlice';
import {
  type DocumentData,
  type DocumentStatus,
  useListDocumentsQuery,
} from '@/api/documentsApi';
import { DocumentRow } from '@/components/documents';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineNotice,
  Screen,
} from '@/components/ui';
import {
  deriveDocumentTitle,
  formatUploadFileSize,
  pickPdfDocument,
  type UploadState,
  uploadDocumentWithProgress,
} from '@/services/uploadDocument';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

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

const INITIAL_UPLOAD_STATE: UploadState = {
  status: 'idle',
};

export default function DocumentsScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const hasActiveSession = Boolean(isAuthenticated && accessToken);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | undefined>();
  const [uploadState, setUploadState] = useState<UploadState>(
    INITIAL_UPLOAD_STATE,
  );

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
  }, {
    skip: !hasActiveSession,
  });

  const documents = data?.documents ?? [];
  const hasMorePages = Boolean(
    data && data.pagination.page < data.pagination.totalPages,
  );
  const isUploadBusy =
    uploadState.status === 'picking' || uploadState.status === 'uploading';

  function handleRefresh() {
    if (!hasActiveSession) {
      return;
    }

    void refetch();
  }

  async function handleUploadPress() {
    if (isUploadBusy || !hasActiveSession) {
      return;
    }

    setUploadState({ status: 'picking' });

    try {
      const selectedFile = await pickPdfDocument();

      if (!selectedFile) {
        setUploadState({ status: 'cancelled' });
        return;
      }

      const nextUploadState: UploadState = {
        status: 'uploading',
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.mimeType,
        localUri: selectedFile.uri,
        progress: 0,
      };

      setUploadState(nextUploadState);

      const response = await uploadDocumentWithProgress({
        file: selectedFile,
        title: deriveDocumentTitle(selectedFile.name),
        accessToken,
        apiBaseUrl: resolveApiBaseUrl(),
        onProgress: (progress) => {
          setUploadState((currentState) =>
            currentState.status === 'uploading'
              ? { ...currentState, progress }
              : currentState,
          );
        },
      });

      setUploadState({
        ...nextUploadState,
        status: 'queued',
        progress: 1,
        documentId: response.document._id,
      });

      setStatusFilter(undefined);
      dispatch(
        apiSlice.util.invalidateTags([
          'Documents',
          'Progress',
          'Notifications',
        ]),
      );
      void refetch();
      router.push({
        pathname: '/document/[id]',
        params: { id: response.document._id },
      });
    } catch (uploadFailure) {
      const parsedError =
        uploadFailure instanceof Error
          ? uploadFailure.message
          : getApiFormErrorState(uploadFailure).formError;

      setUploadState((currentState) => ({
        ...currentState,
        status: 'failed',
        error: parsedError ?? 'We could not upload this PDF right now.',
      }));
    }
  }

  function handleDismissUploadState() {
    setUploadState(INITIAL_UPLOAD_STATE);
  }

  function handleOpenDocument(document: DocumentData) {
    router.push({
      pathname: '/document/[id]',
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
        <Button
          variant="secondary"
          loading={uploadState.status === 'uploading'}
          disabled={isUploadBusy}
          onPress={() => void handleUploadPress()}
        >
          {uploadState.status === 'picking' ? 'Picking...' : 'Upload PDF'}
        </Button>
      }
    >
      {uploadState.status !== 'idle' ? (
        <UploadStateCard
          uploadState={uploadState}
          onDismiss={handleDismissUploadState}
        />
      ) : null}

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
          {hasMorePages ? ' - More pages available' : ''}
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
          description="Upload a PDF to start processing it into summaries, flashcards, quizzes, and chat."
          actionLabel="Upload a PDF"
          onAction={() => void handleUploadPress()}
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
        <InlineNotice message="Some documents may be stale. Pull to refresh and try again." />
      ) : null}
    </Screen>
  );
}

function UploadStateCard({
  uploadState,
  onDismiss,
}: {
  uploadState: UploadState;
  onDismiss: () => void;
}) {
  const progressPercent =
    uploadState.progress != null
      ? Math.max(0, Math.min(Math.round(uploadState.progress * 100), 100))
      : null;
  const isDismissible =
    uploadState.status === 'queued' ||
    uploadState.status === 'failed' ||
    uploadState.status === 'cancelled';

  return (
    <Card
      title={getUploadTitle(uploadState)}
      description={getUploadDescription(uploadState)}
    >
      {uploadState.fileName ? (
        <View style={styles.uploadMetaRow}>
          <Text numberOfLines={1} style={styles.uploadFileName}>
            {uploadState.fileName}
          </Text>
          <Text style={styles.uploadMetaText}>
            {formatUploadFileSize(uploadState.fileSize)}
          </Text>
        </View>
      ) : null}

      {uploadState.status === 'uploading' ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent ?? 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progressPercent ?? 0}% uploaded
          </Text>
        </View>
      ) : null}

      {uploadState.status === 'failed' && uploadState.error ? (
        <View style={styles.uploadFailureBox}>
          <Text style={styles.uploadFailureText}>{uploadState.error}</Text>
        </View>
      ) : null}

      {isDismissible ? (
        <View style={styles.uploadActionRow}>
          <Button variant="ghost" size="sm" onPress={onDismiss}>
            Dismiss
          </Button>
        </View>
      ) : null}
    </Card>
  );
}

function getUploadTitle(uploadState: UploadState) {
  switch (uploadState.status) {
    case 'picking':
      return 'Choose a PDF';
    case 'uploading':
      return 'Uploading document';
    case 'queued':
      return 'Upload queued';
    case 'failed':
      return 'Upload failed';
    case 'cancelled':
      return 'Upload cancelled';
    case 'idle':
      return 'Upload';
  }
}

function getUploadDescription(uploadState: UploadState) {
  switch (uploadState.status) {
    case 'picking':
      return 'Select a PDF from your device storage to add it to Lumora.';
    case 'uploading':
      return 'Your PDF is being sent now. Keep the app open until the upload finishes.';
    case 'queued':
      return 'The PDF reached the backend and is now waiting for processing and indexing.';
    case 'failed':
      return 'The upload did not complete. Review the error below and try again.';
    case 'cancelled':
      return 'No file was uploaded because the picker was closed before selection.';
    case 'idle':
      return '';
  }
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    minHeight: theme.layout.touchTarget,
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
  uploadMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  uploadFileName: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
    fontWeight: '700',
  },
  uploadMetaText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  progressBlock: {
    gap: theme.spacing.sm,
  },
  progressTrack: {
    height: 10,
    borderRadius: theme.radii.pill,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSoft,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.brand,
  },
  progressText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '700',
  },
  uploadFailureBox: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: theme.colors.dangerSoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  uploadFailureText: {
    color: '#7F1D1D',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  uploadActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
});
