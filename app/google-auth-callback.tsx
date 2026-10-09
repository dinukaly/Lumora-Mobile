import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLazyGetProfileQuery } from '@/api/authApi';
import { setAccessToken, setCredentials, logout } from '@/auth/authSlice';
import {
  getGoogleAuthErrorMessage,
  getPostGoogleAuthMessage,
  isGoogleAuthCallbackSuccess,
} from '@/auth/googleAuth';
import { saveRefreshToken, clearRefreshToken } from '@/auth/tokenStorage';
import { getPostAuthRoute } from '@/auth/emailVerification';
import { Button, Card, Screen } from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { theme } from '@/theme';

type CallbackState = 'loading' | 'success' | 'error';

export default function GoogleAuthCallbackScreen() {
  const params = useLocalSearchParams<{
    provider?: string | string[];
    status?: string | string[];
    code?: string | string[];
    accessToken?: string | string[];
    refreshToken?: string | string[];
  }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loadProfile] = useLazyGetProfileQuery();
  const [callbackState, setCallbackState] = useState<CallbackState>('loading');
  const [resolvedErrorMessage, setResolvedErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  const provider = Array.isArray(params.provider) ? params.provider[0] : params.provider;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const accessToken = Array.isArray(params.accessToken)
    ? params.accessToken[0]
    : params.accessToken;
  const refreshToken = Array.isArray(params.refreshToken)
    ? params.refreshToken[0]
    : params.refreshToken;

  const callbackErrorMessage = useMemo(() => {
    if (resolvedErrorMessage) {
      return resolvedErrorMessage;
    }

    if (provider !== 'google') {
      return 'This callback is only available for Google sign-in.';
    }

    if (status !== 'success') {
      return getGoogleAuthErrorMessage(code);
    }

    if (!accessToken || !refreshToken) {
      return 'Google sign-in returned incomplete credentials. Please try again.';
    }

    return null;
  }, [accessToken, code, provider, refreshToken, resolvedErrorMessage, status]);
  const hasSuccessfulCallback = isGoogleAuthCallbackSuccess({
    provider,
    status,
    accessToken,
    refreshToken,
  });
  const effectiveCallbackState: CallbackState =
    hasSuccessfulCallback ? callbackState : 'error';

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    if (!hasSuccessfulCallback) {
      return;
    }

    const nextAccessToken = accessToken as string;
    const nextRefreshToken = refreshToken as string;

    const completeGoogleAuth = async () => {
      try {
        await saveRefreshToken(nextRefreshToken);
        dispatch(setAccessToken({ accessToken: nextAccessToken }));
        const profile = await loadProfile(undefined, true).unwrap();
        dispatch(
          setCredentials({
            user: profile,
            accessToken: nextAccessToken,
          }),
        );
        setSuccessMessage(getPostGoogleAuthMessage(profile));
        setCallbackState('success');
        router.replace(getPostAuthRoute(profile));
      } catch (error) {
        await clearRefreshToken();
        dispatch(logout());
        setResolvedErrorMessage(
          error instanceof Error
            ? error.message
            : 'We could not finish Google sign-in right now.',
        );
        setCallbackState('error');
      }
    };

    void completeGoogleAuth();
  }, [accessToken, dispatch, hasSuccessfulCallback, loadProfile, refreshToken, router]);

  return (
    <Screen>
      <View style={styles.centered}>
        <Card>
          <View style={styles.hero}>
            <Text accessibilityRole="header" style={styles.title}>
              {effectiveCallbackState === 'loading'
                ? 'Finishing Google sign-in'
                : effectiveCallbackState === 'success'
                  ? 'Google sign-in complete'
                  : 'Google sign-in problem'}
            </Text>
            <Text style={styles.subtitle}>
              {effectiveCallbackState === 'loading'
                ? 'Hang tight while Lumora finishes your session.'
                : effectiveCallbackState === 'success'
                  ? 'Your Lumora account is ready.'
                  : 'We could not complete Google sign-in safely.'}
            </Text>
          </View>

          {effectiveCallbackState === 'error' && callbackErrorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{callbackErrorMessage}</Text>
            </View>
          ) : null}

          {effectiveCallbackState === 'success' ? (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>
                {successMessage ?? 'Your Lumora account is ready.'}
              </Text>
            </View>
          ) : null}

          {effectiveCallbackState !== 'loading' ? (
            <View style={styles.actionColumn}>
              <Button fullWidth size="lg" onPress={() => router.replace('/(auth)/login')}>
                Go to sign in
              </Button>
              <Link href="/(auth)/register" asChild>
                <Pressable accessibilityRole="link" style={styles.linkPressable}>
                  <Text style={styles.linkText}>Create account</Text>
                </Pressable>
              </Link>
            </View>
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  hero: {
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typeScale.heading.fontSize,
    lineHeight: theme.typeScale.heading.lineHeight,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
    textAlign: 'center',
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.dangerSoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  errorBannerText: {
    color: '#7F1D1D',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  successBanner: {
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.successSoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  successBannerText: {
    color: '#166534',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  actionColumn: {
    gap: theme.spacing.md,
  },
  linkPressable: {
    minHeight: theme.layout.touchTarget,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  linkText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '700',
  },
});
