import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useVerifyEmailMutation } from '@/api/authApi';
import { updateUser } from '@/auth/authSlice';
import { getPostAuthRoute } from '@/auth/emailVerification';
import { Button, Card, Screen } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const normalizedToken = Array.isArray(token) ? token[0] : token;
  const [verifyEmail, { isLoading, isSuccess, error, data }] =
    useVerifyEmailMutation();
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!normalizedToken || hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;
    void verifyEmail(normalizedToken);
  }, [normalizedToken, verifyEmail]);

  useEffect(() => {
    if (!isSuccess || !user) {
      return;
    }

    dispatch(
      updateUser({
        ...user,
        emailVerifiedAt: new Date().toISOString(),
      }),
    );
  }, [dispatch, isSuccess, user]);

  const errorMessage = normalizedToken
    ? getApiFormErrorState(error).formError
    : 'This verification link is missing a token.';

  return (
    <Screen>
      <View style={styles.centered}>
        <Card>
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Ionicons
                color={isSuccess ? theme.colors.success : theme.colors.warning}
                name={
                  isLoading
                    ? 'mail-unread-outline'
                    : isSuccess
                      ? 'checkmark-circle'
                      : 'mail-open-outline'
                }
                size={30}
              />
            </View>
            <Text accessibilityRole="header" style={styles.title}>
              {isLoading
                ? 'Verifying your email'
                : isSuccess
                  ? 'Email verified'
                  : 'Verification link problem'}
            </Text>
            <Text style={styles.subtitle}>
              {isLoading
                ? 'Hang tight while we confirm your account.'
                : isSuccess
                  ? data?.message ??
                    'Your account is now unlocked for protected learning features.'
                  : 'We could not complete email verification with this link.'}
            </Text>
          </View>

          {!isLoading && !isSuccess ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.actionColumn}>
            {isSuccess ? (
              <>
                <Button
                  fullWidth
                  size="lg"
                  onPress={() =>
                    router.replace(user ? getPostAuthRoute(user) : '/(auth)/login')
                  }
                >
                  {user ? 'Continue in Lumora' : 'Open sign in'}
                </Button>
                {user ? (
                  <Button
                    fullWidth
                    size="lg"
                    variant="secondary"
                    onPress={() => router.replace('/(tabs)/profile')}
                  >
                    Open profile
                  </Button>
                ) : (
                  <Link href="/(auth)/login" asChild>
                    <Pressable
                      accessibilityRole="link"
                      style={styles.linkPressable}
                    >
                      <Text style={styles.linkText}>Go to sign in</Text>
                    </Pressable>
                  </Link>
                )}
              </>
            ) : (
              <>
                {user ? (
                  <Button
                    fullWidth
                    size="lg"
                    onPress={() => router.replace('/verify-email/pending')}
                  >
                    Open verification help
                  </Button>
                ) : (
                  <Link href="/(auth)/login" asChild>
                    <Pressable
                      accessibilityRole="link"
                      style={styles.linkPressable}
                    >
                      <Text style={styles.linkText}>Go to sign in</Text>
                    </Pressable>
                  </Link>
                )}
                <Link href="/(auth)/register" asChild>
                  <Pressable accessibilityRole="link" style={styles.linkPressable}>
                    <Text style={styles.linkText}>Create account</Text>
                  </Pressable>
                </Link>
              </>
            )}
          </View>
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
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: '#FCA5A5',
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.dangerSoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  errorBannerText: {
    color: '#7F1D1D',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    textAlign: 'center',
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
