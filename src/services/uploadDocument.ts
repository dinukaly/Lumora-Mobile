import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const MAX_DOCUMENT_UPLOAD_BYTES = 50 * 1024 * 1024;

export type UploadableDocumentFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  webFile?: File;
};

export type UploadDocumentPayload = {
  file: UploadableDocumentFile;
  title?: string;
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
