import { apiSlice } from '@/api/apiSlice';
import { logout, setAccessToken, setCredentials } from '@/auth/authSlice';
import { clearRefreshToken, saveRefreshToken } from '@/auth/tokenStorage';

export type UserRole = 'USER' | 'ADMIN';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  preferences?: Record<string, unknown>;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type RawUser = User & {
  _id?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type MobileAuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
  emailVerificationRequired?: boolean;
  verificationEmailSent?: boolean;
  message?: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type PushTokenRequest = {
  token: string;
};

function normalizeUser(user: RawUser): User {
  return {
    ...user,
    id: user.id || user._id || '',
  };
}

function normalizeAuthResponse(response: MobileAuthResponse): MobileAuthResponse {
  return {
    ...response,
    user: normalizeUser(response.user as RawUser),
  };
}

async function storeAuthSession(response: MobileAuthResponse) {
  await saveRefreshToken(response.refreshToken);
}

async function storeRefreshedToken(response: RefreshResponse) {
  await saveRefreshToken(response.refreshToken);
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<MobileAuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/mobile/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: MobileAuthResponse) =>
        normalizeAuthResponse(response),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await storeAuthSession(data);
          dispatch(
            setCredentials({
              user: data.user,
              accessToken: data.accessToken,
            }),
          );
        } catch {
          // Mutation errors are surfaced to the calling screen.
        }
      },
    }),
    register: builder.mutation<MobileAuthResponse, RegisterRequest>({
      query: (payload) => ({
        url: '/auth/mobile/register',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: MobileAuthResponse) =>
        normalizeAuthResponse(response),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await storeAuthSession(data);
          dispatch(
            setCredentials({
              user: data.user,
              accessToken: data.accessToken,
            }),
          );
        } catch {
          // Mutation errors are surfaced to the calling screen.
        }
      },
    }),
    refreshToken: builder.mutation<RefreshResponse, RefreshRequest>({
      query: (payload) => ({
        url: '/auth/mobile/refresh',
        method: 'POST',
        body: payload,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await storeRefreshedToken(data);
          dispatch(setAccessToken({ accessToken: data.accessToken }));
        } catch {
          dispatch(logout());
          await clearRefreshToken();
        }
      },
    }),
    logout: builder.mutation<{ message: string }, LogoutRequest>({
      query: (payload) => ({
        url: '/auth/mobile/logout',
        method: 'POST',
        body: payload,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logout());
          await clearRefreshToken();
        }
      },
    }),
    registerPushToken: builder.mutation<
      { message: string; tokenCount: number },
      PushTokenRequest
    >({
      query: (payload) => ({
        url: '/users/me/push-tokens',
        method: 'POST',
        body: payload,
      }),
    }),
    removePushToken: builder.mutation<
      { message: string; tokenCount: number },
      PushTokenRequest
    >({
      query: (payload) => ({
        url: '/users/me/push-tokens',
        method: 'DELETE',
        body: payload,
      }),
    }),
    getProfile: builder.query<User, void>({
      query: () => '/users/me',
      transformResponse: (response: RawUser) => normalizeUser(response),
      providesTags: ['User'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterPushTokenMutation,
  useRefreshTokenMutation,
  useRemovePushTokenMutation,
  useRegisterMutation,
} = authApi;
