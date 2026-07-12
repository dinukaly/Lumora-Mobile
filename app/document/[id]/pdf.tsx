import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';

import { useGetDocumentQuery } from '@/api/documentsApi';
import { PdfCanvas } from '@/components/pdf/PdfCanvas';
import { Button, Card, ErrorState } from '@/components/ui';
import {
  cacheDocumentPdf,
  getCachedPdf,
  type CachedPdfResult,
} from '@/services/pdfCache';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';

export default function DocumentPdfScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const {
    data: document,
    error: documentError,
    isLoading: documentLoading,
  } = useGetDocumentQuery(documentId ?? '', {
    skip: !documentId,
  });

  const [pdfFile, setPdfFile] = useState<CachedPdfResult | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const effectivePageCount = pageCount ?? document?.pageCount ?? null;
  const viewerTitle = document?.title ?? 'Document PDF';
  const headerCaption = useMemo(() => {
    if (effectivePageCount && currentPage <= effectivePageCount) {
      return `Page ${currentPage} of ${effectivePageCount}`;
    }

    if (effectivePageCount) {
      return `${effectivePageCount} pages`;
    }

    return 'Protected PDF reader';
  }, [currentPage, effectivePageCount]);

  const loadPdf = useCallback(
    async (forceRefresh = false) => {
      if (!documentId) {
        setDownloadError('We could not identify which PDF to open.');
        return;
      }

      if (!accessToken) {
        setDownloadError('Your session expired before the PDF could be loaded.');
        return;
      }

      setDownloadError(null);
      setViewerError(null);
      setIsDownloading(true);
      setDownloadPercent(forceRefresh ? 0 : null);

      try {
        const cachedPdf =
          !forceRefresh ? getCachedPdf(documentId) : null;

        if (cachedPdf) {
          setPdfFile(cachedPdf);
          setDownloadPercent(100);
          return;
        }

        const downloadedPdf = await cacheDocumentPdf({
          documentId,
          accessToken,
          forceRefresh,
          onProgress: ({ bytesWritten, totalBytes }) => {
            if (!totalBytes) {
              return;
            }

            setDownloadPercent(
              Math.max(0, Math.min(Math.round((bytesWritten / totalBytes) * 100), 100)),
            );
          },
        });

        setPdfFile(downloadedPdf);
        setDownloadPercent(100);
      } catch (error) {
        setPdfFile(null);
        setDownloadError(
          error instanceof Error
            ? error.message
            : 'We could not download this PDF right now.',
        );
      } finally {
        setIsDownloading(false);
      }
    },
    [accessToken, documentId],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadPdf();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadPdf]);

  async function handleOpenExternally() {
    if (!pdfFile) {
      return;
    }

    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      await Sharing.shareAsync(pdfFile.uri, {
        dialogTitle: `Open ${viewerTitle}`,
        mimeType: 'application/pdf',
      });
      return;
    }

    const supported = await Linking.canOpenURL(pdfFile.uri);

    if (!supported) {
      setViewerError(
        'No compatible external app is available to open this PDF on this device.',
      );
      return;
    }

    await Linking.openURL(pdfFile.uri);
  }

  function handleViewerError(params: { message: string }) {
    setViewerError(params.message || 'The PDF viewer could not render this file.');
  }

  if (!documentId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <ErrorState
            title="PDF unavailable"
            description="We could not identify which document PDF to open."
            onRetry={() => router.push('/(tabs)/documents')}
            retryLabel="Back to library"
          />
        </View>
      </SafeAreaView>
    );
  }

  const showBlockingError = downloadError || (!documentLoading && documentError && !document);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text numberOfLines={1} style={styles.title}>
              {viewerTitle}
            </Text>
            <Text style={styles.subtitle}>{headerCaption}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/document/[id]', params: { id: documentId } })}
              style={({ pressed }) => [
                styles.headerChip,
                pressed ? styles.headerChipPressed : null,
              ]}
            >
              <Text style={styles.headerChipText}>Overview</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isDownloading}
              onPress={() => void loadPdf(true)}
              style={({ pressed }) => [
                styles.headerChip,
                isDownloading ? styles.headerChipDisabled : null,
                pressed && !isDownloading ? styles.headerChipPressed : null,
              ]}
            >
              <Text style={styles.headerChipText}>Reload</Text>
            </Pressable>
          </View>
        </View>

        {viewerError ? (
          <View style={styles.inlineAlert}>
            <Text style={styles.inlineAlertText}>{viewerError}</Text>
          </View>
        ) : null}

        {showBlockingError ? (
          <View style={styles.centeredState}>
            <ErrorState
              title="PDF unavailable"
              description={
                typeof showBlockingError === 'string'
                  ? showBlockingError
                  : 'We could not load this document PDF right now.'
              }
              onRetry={() => void loadPdf(true)}
            />
            <View style={styles.fallbackButtonRow}>
              <Button
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/document/[id]',
                    params: { id: documentId },
                  })
                }
              >
                Back to overview
              </Button>
            </View>
          </View>
        ) : isDownloading && !pdfFile ? (
          <View style={styles.centeredState}>
            <Card title="Fetching PDF" description="Downloading the protected file into local cache before opening it.">
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={theme.colors.brand} size="large" />
                <Text style={styles.loadingText}>
                  {downloadPercent != null
                    ? `${downloadPercent}% downloaded`
                    : 'Preparing your document...'}
                </Text>
              </View>
            </Card>
          </View>
        ) : pdfFile ? (
          <>
            <View style={styles.viewerShell}>
              <PdfCanvas
                autoScale
                contentPadding={{ top: 12, right: 12, bottom: 12, left: 12 }}
                doubleTapToZoom
                fitMode="width"
                onError={handleViewerError}
                onLoadComplete={(payload?: { pageCount?: number }) => {
                  if (payload?.pageCount) {
                    setPageCount(payload.pageCount);
                  }
                }}
                onPageChanged={(payload?: { pageIndex?: number; pageCount?: number }) => {
                  if (typeof payload?.pageIndex === 'number') {
                    setCurrentPage(payload.pageIndex + 1);
                  }

                  if (typeof payload?.pageCount === 'number') {
                    setPageCount(payload.pageCount);
                  }
                }}
                pageGap={12}
                style={styles.viewer}
                uri={pdfFile.uri}
              />
            </View>

            <View style={styles.bottomBar}>
              <Button variant="secondary" onPress={() => void handleOpenExternally()}>
                Open externally
              </Button>
              <Button
                disabled={document?.status !== 'READY'}
                onPress={() =>
                  router.push({
                    pathname: '/document/[id]/chat',
                    params: { id: documentId },
                  })
                }
              >
                Ask AI
              </Button>
            </View>
          </>
        ) : (
          <View style={styles.centeredState}>
            <Card title="PDF not ready" description="The viewer is waiting for the cached file path before it can render.">
              <View style={styles.loadingBlock}>
                <Text style={styles.loadingText}>Try reloading the PDF.</Text>
                <Button onPress={() => void loadPdf(true)}>Reload PDF</Button>
              </View>
            </Card>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  headerText: {
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
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerChip: {
    minHeight: 40,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerChipPressed: {
    opacity: 0.84,
  },
  headerChipDisabled: {
    opacity: 0.5,
  },
  headerChipText: {
    color: theme.colors.text,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '700',
  },
  inlineAlert: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: theme.colors.dangerSoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  inlineAlertText: {
    color: '#7F1D1D',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  loadingBlock: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
    textAlign: 'center',
  },
  viewerShell: {
    flex: 1,
    minHeight: 320,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  fallbackButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
