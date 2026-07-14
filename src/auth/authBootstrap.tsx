import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import {
  authApi,
  useLogoutMutation,
  useRemovePushTokenMutation,
} from '@/api/authApi';
import { apiSlice } from '@/api/apiSlice';
import {
  finishBootstrap,
  logout,
  updateUser,
} from '@/auth/authSlice';
import { getPostAuthRoute } from '@/auth/emailVerification';
import {
  clearRefreshToken,
  getRefreshToken,
} from '@/auth/tokenStorage';
import { Card } from '@/components/ui';
import { disconnectSocket } from '@/realtime/socketClient';
import { unregisterStoredPushToken } from '@/services/pushNotifications';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';

async function clearLocalSession(dispatch: ReturnType<typeof useAppDispatch>) {
  disconnectSocket();
  await clearRefreshToken();
  dispatch(logout());
  dispatch(apiSlice.util.resetApiState());
}

export function AuthBootstrapGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { accessToken, isAuthenticated, isBootstrapping, user } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    let isActive = true;

    async function bootstrap() {
      const storedRefreshToken = await getRefreshToken();

      if (!storedRefreshToken) {
        if (isActive) {
          dispatch(finishBootstrap());
        }
        return;
      }

      try {
        await dispatch(
          authApi.endpoints.refreshToken.initiate(
            { refreshToken: storedRefreshToken },
            { track: false },
          ),
        ).unwrap();

        const profile = await dispatch(
          authApi.endpoints.getProfile.initiate(undefined, {
            forceRefetch: true,
            subscribe: false,
          }),
        ).unwrap();

        if (isActive) {
          dispatch(updateUser(profile));
        }
      } catch {
        if (isActive) {
          await clearLocalSession(dispatch);
        }
      } finally {
        if (isActive) {
          dispatch(finishBootstrap());
        }
      }
    }

    if (isBootstrapping) {
      void bootstrap();
    }

    return () => {
      isActive = false;
    };
  }, [dispatch, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    const currentGroup = segments[0];
    const inAuthGroup = currentGroup === '(auth)';
    const inVerifyEmailGroup = currentGroup === 'verify-email';
    const inVerifyPendingScreen =
      currentGroup === 'verify-email' && segments[1] === 'pending';

    if (!isAuthenticated || !accessToken) {
      if (!inAuthGroup && !inVerifyEmailGroup) {
        router.replace('/(auth)/login');
      } else if (inVerifyPendingScreen) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (inAuthGroup) {
      router.replace(getPostAuthRoute(user));
    }
  }, [accessToken, isAuthenticated, isBootstrapping, router, segments, user]);

  if (isBootstrapping) {
    return (
      <View style={styles.loadingScreen}>
        <Card>
          <View style={styles.loadingCard}>
            <ActivityIndicator color={theme.colors.brand} size="large" />
            <Text style={styles.loadingTitle}>Restoring your session</Text>
            <Text style={styles.loadingBody}>
              Checking your secure sign-in state before opening Lumora.
            </Text>
          </View>
        </Card>
      </View>
    );
  }

  return <>{children}</>;
}

export function useLogoutAction() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [logoutRequest, { isLoading }] = useLogoutMutation();
  const [removePushTokenRequest] = useRemovePushTokenMutation();

  async function runLogout() {
    const refreshToken = await getRefreshToken();

    try {
      if (accessToken) {
        await unregisterStoredPushToken(async (token) => {
          await removePushTokenRequest({ token }).unwrap();
        });
      }

      if (refreshToken) {
        await logoutRequest({ refreshToken }).unwrap();
      } else {
        await clearRefreshToken();
        dispatch(logout());
      }
    } finally {
      disconnectSocket();
      dispatch(apiSlice.util.resetApiState());
    }
  }

  return {
    logout: runLogout,
    isLoading,
  };
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.layout.screenPadding,
    backgroundColor: theme.colors.background,
  },
  loadingCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  loadingTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  loadingBody: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
    textAlign: 'center',
  },
});
