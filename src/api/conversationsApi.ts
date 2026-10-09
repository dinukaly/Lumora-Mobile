import { apiSlice } from '@/api/apiSlice';

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageCitation = {
  chunkId?: string;
  documentId?: string;
  pageNumber?: number;
  snippet?: string;
};

export type MessageTokenUsage = {
  prompt?: number;
  completion?: number;
  total?: number;
};

export type ConversationSummary = {
  id: string;
  documentId: string | null;
  title: string;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
};

export type ConversationMessage = {
  id: string;
  role: MessageRole;
  content: string;
  citations?: MessageCitation[];
  tokenUsage?: MessageTokenUsage;
  createdAt: string;
};

export type ConversationDetail = {
  id: string;
  documentId: string | null;
  title: string;
  contextSummary: string | null;
  messages: ConversationMessage[];
  updatedAt: string;
  createdAt: string;
};

export type ListConversationsParams = {
  documentId?: string;
  page?: number;
  limit?: number;
};

export type ListConversationsResponse = {
  conversations: ConversationSummary[];
  total: number;
  page: number;
  totalPages: number;
};

export type SendChatMessageRequest = {
  conversationId?: string;
  documentId: string;
  message: string;
  action?: 'CHAT';
};

export type SendChatMessageResponse = {
  message: {
    id: string;
    conversationId: string;
    role: 'assistant';
    content: string;
    citations?: MessageCitation[];
    tokenUsage?: MessageTokenUsage;
    createdAt: string;
  };
};

export const conversationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listConversations: builder.query<
      ListConversationsResponse,
      ListConversationsParams | void
    >({
      query: (params) => ({
        url: '/conversations',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.conversations.map(({ id }) => ({
                type: 'Conversations' as const,
                id,
              })),
              { type: 'Conversations', id: 'LIST' },
            ]
          : [{ type: 'Conversations', id: 'LIST' }],
    }),
    getConversation: builder.query<ConversationDetail, string>({
      query: (conversationId) => `/conversations/${conversationId}`,
      providesTags: (_result, _error, conversationId) => [
        { type: 'Conversations', id: conversationId },
      ],
    }),
    sendChatMessage: builder.mutation<
      SendChatMessageResponse,
      SendChatMessageRequest
    >({
      query: (body) => ({
        url: '/ai/chat',
        method: 'POST',
        body: {
          ...body,
          action: body.action ?? 'CHAT',
        },
      }),
      invalidatesTags: ['Conversations', 'Progress'],
    }),
  }),
});

export const {
  useGetConversationQuery,
  useLazyGetConversationQuery,
  useListConversationsQuery,
  useLazyListConversationsQuery,
  useSendChatMessageMutation,
} = conversationsApi;
