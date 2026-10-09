import { apiSlice } from '@/api/apiSlice';

export type FlashcardDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type FlashcardItem = {
  id: string;
  documentId: string;
  front: string;
  back: string;
  difficulty: FlashcardDifficulty;
  nextReviewAt: string;
  reviewCount: number;
  successCount: number;
};

export type FlashcardsListResponse = {
  flashcards: FlashcardItem[];
  total: number;
  page: number;
  totalPages: number;
};

export type ListFlashcardsParams = {
  documentId?: string;
  dueOnly?: boolean;
  page?: number;
  limit?: number;
};

export type ReviewFlashcardRequest = {
  id: string;
  difficulty: FlashcardDifficulty;
};

export type ReviewFlashcardResponse = {
  id: string;
  nextReviewAt: string;
  reviewCount: number;
  successCount: number;
};

export type GenerateFlashcardsRequest = {
  documentId: string;
  count?: number;
  topic?: string;
};

export type GenerateFlashcardsResponse = {
  jobId: string;
  message: string;
};

export const flashcardsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listFlashcards: builder.query<
      FlashcardsListResponse,
      ListFlashcardsParams | void
    >({
      query: (params) => ({
        url: '/learning/flashcards',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.flashcards.map(({ id }) => ({
                type: 'Flashcards' as const,
                id,
              })),
              { type: 'Flashcards', id: 'LIST' },
            ]
          : [{ type: 'Flashcards', id: 'LIST' }],
    }),
    reviewFlashcard: builder.mutation<
      ReviewFlashcardResponse,
      ReviewFlashcardRequest
    >({
      query: ({ id, difficulty }) => ({
        url: `/learning/flashcards/${id}/review`,
        method: 'POST',
        body: { difficulty },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Flashcards', id },
        { type: 'Flashcards', id: 'LIST' },
        'Progress',
      ],
    }),
    generateFlashcards: builder.mutation<
      GenerateFlashcardsResponse,
      GenerateFlashcardsRequest
    >({
      query: (body) => ({
        url: '/ai/generate-flashcards',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Flashcards', id: 'LIST' }],
    }),
  }),
});

export const {
  useGenerateFlashcardsMutation,
  useListFlashcardsQuery,
  useReviewFlashcardMutation,
} = flashcardsApi;
