import {
  type BaseQueryApi,
  type BaseQueryFn,
  createApi,
  fetchBaseQuery,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

import { logout, setAccessToken } from '@/auth/authSlice';
import {
  clearRefreshToken,
  getRefreshToken,
  saveRefreshToken,
} from '@/auth/tokenStorage';
import { disconnectSocket } from '@/realtime/socketClient';
import type { RootState } from '@/store/store';

const FALLBACK_API_BASE_URL = 'http://localhost:5000/api/v1';

export function resolveApiBaseUrl() {
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

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

let refreshPromise: Promise<RefreshResponse | null> | null = null;

function getRequestUrl(args: string | FetchArgs) {
  return typeof args === 'string' ? args : args.url;
}

function isMobileAuthRequest(args: string | FetchArgs) {
  const url = getRequestUrl(args);
  return url.startsWith('/auth/mobile/');
}

async function clearUnauthorizedSession(api: BaseQueryApi) {
  disconnectSocket();
  await clearRefreshToken();
  api.dispatch(logout());
  api.dispatch(apiSlice.util.resetApiState());
}

async function refreshAccessToken(
  api: BaseQueryApi,
  extraOptions: Record<string, never>,
) {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        await clearUnauthorizedSession(api);
        return null;
      }

      const refreshResult = await baseQuery(
        {
          url: '/auth/mobile/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (!refreshResult.data) {
        await clearUnauthorizedSession(api);
        return null;
      }

      const refreshed = refreshResult.data as RefreshResponse;
      await saveRefreshToken(refreshed.refreshToken);
      api.dispatch(setAccessToken({ accessToken: refreshed.accessToken }));

      return refreshed;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (
    result.error?.status === 401 &&
    !isMobileAuthRequest(args)
  ) {
    const refreshedSession = await refreshAccessToken(api, extraOptions);

    if (refreshedSession) {
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
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
