import {
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

import type { RootState } from '@/store/store';

const FALLBACK_API_BASE_URL = 'http://localhost:5000/api/v1';

function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  return configuredUrl
    ? configuredUrl.replace(/\/$/, '')
    : FALLBACK_API_BASE_URL;
}

const baseQuery = fetchBaseQuery({
  baseUrl: resolveApiBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as RootState).auth.accessToken;

    if (accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`);
    }

    headers.set('accept', 'application/json');

    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'Documents',
    'Conversations',
    'Flashcards',
    'Quizzes',
    'Notifications',
    'AIActions',
    'Progress',
  ],
  endpoints: () => ({}),
});
