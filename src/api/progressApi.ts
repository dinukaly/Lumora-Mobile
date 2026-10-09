import { apiSlice } from '@/api/apiSlice';

export type ProgressSummary = {
  totalDocuments: number;
  documentsReady: number;
  totalFlashcards: number;
  flashcardsDue: number;
  flashcardsReviewed: number;
  totalQuizzes: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  totalChatMessages: number;
};

export const progressApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProgress: builder.query<ProgressSummary, void>({
      query: () => '/learning/progress',
      providesTags: ['Progress'],
    }),
  }),
});

export const { useGetProgressQuery } = progressApi;
