import { Directory, File, Paths, type DownloadProgress } from 'expo-file-system';
import { Platform } from 'react-native';

import { resolveApiBaseUrl } from '@/api/apiSlice';

const PDF_CACHE_DIRECTORY_NAME = 'lumora-pdfs';

const webPdfObjectUrls = new Map<string, string>();

export type CachedPdfResult = {
  documentId: string;
  fileName: string;
  uri: string;
  size?: number;
  isTemporary: boolean;
};

export async function cacheDocumentPdf({
  documentId,
  accessToken,
  forceRefresh = false,
  onProgress,
}: {
  documentId: string;
  accessToken: string;
  forceRefresh?: boolean;
  onProgress?: (progress: DownloadProgress) => void;
}): Promise<CachedPdfResult> {
  if (!accessToken.trim()) {
    throw new Error('An access token is required to download protected PDFs.');
  }

  const fileName = `${sanitizeDocumentId(documentId)}.pdf`;

  if (Platform.OS === 'web') {
    return downloadPdfForWeb({ documentId, accessToken, fileName });
  }

  const cacheDirectory = getPdfCacheDirectory();
  cacheDirectory.create({ idempotent: true, intermediates: true });

  const targetFile = new File(cacheDirectory, fileName);

  if (targetFile.exists && !forceRefresh) {
    return {
      documentId,
      fileName,
      uri: targetFile.uri,
      size: targetFile.size ?? undefined,
      isTemporary: false,
    };
  }

  try {
    const downloadedFile = await File.downloadFileAsync(
      getDocumentPdfUrl(documentId),
      targetFile,
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
          accept: 'application/pdf',
        },
        idempotent: true,
        onProgress,
      },
    );

    return {
      documentId,
      fileName,
      uri: downloadedFile.uri,
      size: downloadedFile.size ?? undefined,
      isTemporary: false,
    };
  } catch (error) {
    // Android may leave a partial file behind if the download fails mid-stream.
    if (targetFile.exists) {
      targetFile.delete();
    }

    throw error;
  }
}

export function getCachedPdf(documentId: string) {
  const fileName = `${sanitizeDocumentId(documentId)}.pdf`;

  if (Platform.OS === 'web') {
    const objectUrl = webPdfObjectUrls.get(documentId);

    if (!objectUrl) {
      return null;
    }

    return {
      documentId,
      fileName,
      uri: objectUrl,
      isTemporary: true,
    } satisfies CachedPdfResult;
  }

  const file = new File(getPdfCacheDirectory(), fileName);

  if (!file.exists) {
    return null;
  }

  return {
    documentId,
    fileName,
    uri: file.uri,
    size: file.size ?? undefined,
    isTemporary: false,
  } satisfies CachedPdfResult;
}

export function clearCachedPdf(documentId: string) {
  if (Platform.OS === 'web') {
    const objectUrl = webPdfObjectUrls.get(documentId);

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      webPdfObjectUrls.delete(documentId);
    }

    return;
  }

  const file = new File(
    getPdfCacheDirectory(),
    `${sanitizeDocumentId(documentId)}.pdf`,
  );

  if (file.exists) {
    file.delete();
  }
}

export function clearAllCachedPdfs() {
  if (Platform.OS === 'web') {
    for (const objectUrl of webPdfObjectUrls.values()) {
      URL.revokeObjectURL(objectUrl);
    }

    webPdfObjectUrls.clear();
    return;
  }

  const cacheDirectory = getPdfCacheDirectory();

  if (!cacheDirectory.exists) {
    return;
  }

  for (const entry of cacheDirectory.list()) {
    if (entry instanceof File && entry.extension === '.pdf' && entry.exists) {
      entry.delete();
    }
  }
}

function getPdfCacheDirectory() {
  return new Directory(Paths.cache, PDF_CACHE_DIRECTORY_NAME);
}

async function downloadPdfForWeb({
  documentId,
  accessToken,
  fileName,
}: {
  documentId: string;
  accessToken: string;
  fileName: string;
}): Promise<CachedPdfResult> {
  const response = await fetch(getDocumentPdfUrl(documentId), {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/pdf',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to download PDF (${response.status}).`);
  }

  const blob = await response.blob();
  const previousObjectUrl = webPdfObjectUrls.get(documentId);

  if (previousObjectUrl) {
    URL.revokeObjectURL(previousObjectUrl);
  }

  const objectUrl = URL.createObjectURL(blob);
  webPdfObjectUrls.set(documentId, objectUrl);

  return {
    documentId,
    fileName,
    uri: objectUrl,
    size: blob.size,
    isTemporary: true,
  };
}

function getDocumentPdfUrl(documentId: string) {
  return `${resolveApiBaseUrl()}/documents/${documentId}/view`;
}

function sanitizeDocumentId(documentId: string) {
  return documentId.replace(/[^a-zA-Z0-9_-]/g, '_');
}
