import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const MAX_DOCUMENT_UPLOAD_BYTES = 50 * 1024 * 1024;

export type UploadStatus =
  | 'idle'
  | 'picking'
  | 'uploading'
  | 'queued'
  | 'failed'
  | 'cancelled';

export type UploadableDocumentFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  webFile?: File;
};

export type UploadState = {
  status: UploadStatus;
  localUri?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  progress?: number;
  documentId?: string;
  error?: string;
};

export type UploadDocumentPayload = {
  file: UploadableDocumentFile;
  title?: string;
};

export type UploadDocumentResponse = {
  message: string;
  document: {
    _id: string;
    title: string;
    originalFileName: string;
    status: string;
    fileSize?: number;
    createdAt: string;
  };
};

export async function pickPdfDocument() {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const validationMessage = getPdfValidationMessage(asset);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: normalizePdfMimeType(asset.mimeType, asset.name),
    size: asset.size ?? undefined,
    webFile: asset.file,
  } satisfies UploadableDocumentFile;
}

export function deriveDocumentTitle(fileName: string) {
  const normalized = fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
  return normalized || 'Untitled Document';
}

export async function createUploadDocumentFormData({
  file,
  title,
}: UploadDocumentPayload) {
  const formData = new FormData();
  const normalizedTitle = title?.trim();

  if (Platform.OS === 'web') {
    if (file.webFile) {
      formData.append('file', file.webFile, file.name);
    } else {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      formData.append('file', new File([blob], file.name, { type: file.mimeType }));
    }
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
  }

  if (normalizedTitle) {
    formData.append('title', normalizedTitle);
  }

  return formData;
}

export async function uploadDocumentWithProgress({
  file,
  title,
  accessToken,
  apiBaseUrl,
  onProgress,
}: UploadDocumentPayload & {
  accessToken?: string | null;
  apiBaseUrl: string;
  onProgress?: (progress: number) => void;
}) {
  const formData = await createUploadDocumentFormData({ file, title });

  return new Promise<UploadDocumentResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${apiBaseUrl}/documents/upload`);
    xhr.setRequestHeader('accept', 'application/json');

    if (accessToken) {
      xhr.setRequestHeader('authorization', `Bearer ${accessToken}`);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }

      onProgress(Math.min(event.loaded / event.total, 1));
    };

    xhr.onerror = () => {
      reject({ status: 'FETCH_ERROR' });
    };

    xhr.onabort = () => {
      reject({
        status: 'CUSTOM_ERROR',
        error: 'Upload was cancelled before it finished.',
      });
    };

    xhr.onload = () => {
      const payload = parseJsonResponse(xhr.responseText);

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);

        if (payload) {
          resolve(payload as UploadDocumentResponse);
          return;
        }

        reject({
          status: 'PARSING_ERROR',
          originalStatus: xhr.status,
          data: xhr.responseText,
          error: 'Upload completed, but the server response could not be read.',
        });
        return;
      }

      reject({
        status: xhr.status,
        data: payload ?? xhr.responseText,
      });
    };

    xhr.send(formData);
  });
}

export function formatUploadFileSize(bytes?: number) {
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

function getPdfValidationMessage(asset: DocumentPicker.DocumentPickerAsset) {
  const normalizedName = asset.name.toLowerCase();
  const mimeType = asset.mimeType?.toLowerCase();
  const hasPdfName = normalizedName.endsWith('.pdf');
  const allowedMimeType =
    mimeType === 'application/pdf' ||
    mimeType === 'application/x-pdf' ||
    (mimeType === 'application/octet-stream' && hasPdfName);

  if (!hasPdfName && !allowedMimeType) {
    return 'Only PDF files can be uploaded to Lumora.';
  }

  if (asset.size != null && asset.size > MAX_DOCUMENT_UPLOAD_BYTES) {
    return 'This PDF is larger than 50 MB. Choose a smaller file and try again.';
  }

  return null;
}

function normalizePdfMimeType(mimeType: string | null | undefined, fileName: string) {
  const normalizedName = fileName.toLowerCase();
  const normalizedMimeType = mimeType?.toLowerCase();

  if (
    normalizedMimeType === 'application/pdf' ||
    normalizedMimeType === 'application/x-pdf'
  ) {
    return 'application/pdf';
  }

  if (normalizedName.endsWith('.pdf')) {
    return 'application/pdf';
  }

  return normalizedMimeType ?? 'application/pdf';
}

function parseJsonResponse(responseText: string) {
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return null;
  }
}
