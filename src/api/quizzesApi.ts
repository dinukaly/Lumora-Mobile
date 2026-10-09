import { apiSlice } from '@/api/apiSlice';

export type QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type QuizListItem = {
  id: string;
  documentId: string;
  title: string;
  questionCount: number;
  createdBy: string;
  createdAt: string;
  latestScore?: number;
  latestTotalQuestions?: number;
  latestCompletedAt?: string;
};

export type ListQuizzesParams = {
  documentId?: string;
};

export type ListQuizzesResponse = {
  quizzes: QuizListItem[];
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
};

export type QuizDetail = {
  id: string;
  documentId: string;
  title: string;
  questions: QuizQuestion[];
  createdBy: string;
  createdAt: string;
};

export type SubmitQuizRequest = {
  quizId: string;
  answers: number[];
};

export type QuizSubmissionResult = {
  attemptId: string;
  score: number;
  totalQuestions: number;
  results: {
    questionIndex: number;
    selected: number;
    correct: number;
    explanation?: string;
  }[];
};

export type GenerateQuizRequest = {
  documentId: string;
  questionCount?: number;
  difficulty?: QuizDifficulty;
  topic?: string;
};

export type GenerateQuizResponse = {
  jobId: string;
  message: string;
};

export const quizzesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listQuizzes: builder.query<ListQuizzesResponse, ListQuizzesParams | void>({
      query: (params) => ({
        url: '/learning/quizzes',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.quizzes.map(({ id }) => ({
                type: 'Quizzes' as const,
                id,
              })),
              { type: 'Quizzes', id: 'LIST' },
            ]
          : [{ type: 'Quizzes', id: 'LIST' }],
    }),
    getQuiz: builder.query<QuizDetail, string>({
      query: (quizId) => `/learning/quizzes/${quizId}`,
      providesTags: (_result, _error, quizId) => [{ type: 'Quizzes', id: quizId }],
    }),
    submitQuiz: builder.mutation<QuizSubmissionResult, SubmitQuizRequest>({
      query: ({ quizId, answers }) => ({
        url: `/learning/quizzes/${quizId}/submit`,
        method: 'POST',
        body: { answers },
      }),
      invalidatesTags: (_result, _error, { quizId }) => [
        { type: 'Quizzes', id: quizId },
        { type: 'Quizzes', id: 'LIST' },
        'Progress',
      ],
    }),
    generateQuiz: builder.mutation<GenerateQuizResponse, GenerateQuizRequest>({
      query: (body) => ({
        url: '/ai/generate-quiz',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Quizzes', id: 'LIST' }],
    }),
  }),
});

export const {
  useGenerateQuizMutation,
  useGetQuizQuery,
  useListQuizzesQuery,
  useSubmitQuizMutation,
} = quizzesApi;
