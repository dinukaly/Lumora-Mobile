import { apiSlice } from '@/api/apiSlice';
import type { MessageCitation } from '@/api/conversationsApi';

export type AIActionConcept = {
  title: string;
  description: string;
};

export type LatestSummaryArtifact = {
  artifactId: string;
  summary: string;
  takeaways: string[];
  citations: MessageCitation[];
  sourceChunkIds: string[];
  createdAt: string;
};

export type LatestConceptsArtifact = {
  artifactId: string;
  concepts: AIActionConcept[];
  citations: MessageCitation[];
  sourceChunkIds: string[];
  createdAt: string;
};

export type LatestAIActionsResponse = {
  documentId: string;
  summary: LatestSummaryArtifact | null;
  concepts: LatestConceptsArtifact | null;
};

export type SummarizeDocumentRequest = {
  documentId: string;
};

export type SummarizeDocumentResponse = {
  documentId: string;
  summary: string;
  takeaways: string[];
  citations: MessageCitation[];
};

export type ExtractConceptsRequest = {
  documentId: string;
};

export type ExtractConceptsResponse = {
  documentId: string;
  concepts: AIActionConcept[];
  citations: MessageCitation[];
};

export type ExplainConceptRequest = {
  documentId: string;
  topic: string;
};

export type ExplainConceptResponse = {
  documentId: string;
  topic: string;
  explanation: string;
  citations: MessageCitation[];
};

export const aiActionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLatestAIActions: builder.query<LatestAIActionsResponse, string>({
      query: (documentId) => ({
        url: '/ai/actions/latest',
        params: { documentId },
      }),
      providesTags: (_result, _error, documentId) => [
        { type: 'AIActions', id: documentId },
      ],
    }),
    summarizeDocument: builder.mutation<
      SummarizeDocumentResponse,
      SummarizeDocumentRequest
    >({
      query: (body) => ({
        url: '/ai/summarize-document',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: 'AIActions', id: documentId },
      ],
    }),
    extractConcepts: builder.mutation<
      ExtractConceptsResponse,
      ExtractConceptsRequest
    >({
      query: (body) => ({
        url: '/ai/extract-concepts',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: 'AIActions', id: documentId },
      ],
    }),
    explainConcept: builder.mutation<
      ExplainConceptResponse,
      ExplainConceptRequest
    >({
      query: (body) => ({
        url: '/ai/explain-concept',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useExplainConceptMutation,
  useExtractConceptsMutation,
  useGetLatestAIActionsQuery,
  useLazyGetLatestAIActionsQuery,
  useSummarizeDocumentMutation,
} = aiActionsApi;
