import { apiSlice } from '@/api/apiSlice';
export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export type DocumentData = {
  _id: string;
  ownerId: string;
  title: string;
  originalFileName: string;
  storageKey?: string;
  storageUrl?: string;
  status: DocumentStatus;
  pageCount?: number;
  fileSize?: number;
  subjectTag?: string;
  processingError?: string | null;
  flashcardCount?: number;
  quizCount?: number;
  createdAt: string;
  updatedAt: string;
};

type DocumentDetailResponse = {
  document?: DocumentData | null;
};

function isDocumentData(value: unknown): value is DocumentData {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'title' in value &&
    'status' in value
  );
}

function normalizeDocumentDetailResponse(response: unknown): DocumentData {
  if (
    typeof response === 'object' &&
    response !== null &&
    'document' in response
  ) {
    const detail = response as DocumentDetailResponse;

    if (isDocumentData(detail.document)) {
      return detail.document;
    }
  }

  if (isDocumentData(response)) {
    return response;
  }

  throw new Error('Document detail response did not include a document.');
}

export type DocumentsListResponse = {
  documents: DocumentData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ListDocumentsParams = {
  page?: number;
  limit?: number;
  status?: DocumentStatus;
};

export const documentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listDocuments: builder.query<DocumentsListResponse, ListDocumentsParams | void>({
      query: (params) => ({
        url: '/documents',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.documents.map(({ _id }) => ({
                type: 'Documents' as const,
                id: _id,
              })),
              { type: 'Documents', id: 'LIST' },
            ]
          : [{ type: 'Documents', id: 'LIST' }],
    }),
    getDocument: builder.query<DocumentData, string>({
      query: (id) => `/documents/${id}`,
      transformResponse: normalizeDocumentDetailResponse,
      providesTags: (_result, _error, id) => [{ type: 'Documents', id }],
    }),
  }),
});

export const { useGetDocumentQuery, useListDocumentsQuery } = documentsApi;
