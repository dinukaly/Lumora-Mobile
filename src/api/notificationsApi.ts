import { apiSlice } from '@/api/apiSlice';

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata?: {
    documentId?: string;
    quizId?: string;
    [key: string]: unknown;
  };
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
};

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      NotificationsResponse,
      { unreadOnly?: boolean; page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/notifications',
        params: params ?? {},
      }),
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation<
      { id: string; readAt: string },
      string
    >({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} = notificationsApi;
