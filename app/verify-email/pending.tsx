import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useResendVerificationEmailMutation } from '@/api/authApi';
import { Button, Card, Screen } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

export default function EmailVerificationPendingScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string | string[] }>();
  const user = useAppSelector((state) => state.auth.user);
  const [resendVerificationEmail, { isLoading, data, error }] =
    useResendVerificationEmailMutation();
  const fromPath = Array.isArray(from) ? from[0] : from;
  const resendError = error ? getApiFormErrorState(error).formError : null;

  async function handleResend() {
    try {
      await resendVerificationEmail().unwrap();
    } catch {
      // Error is rendered below.
    }
  }

  return (
    <Screen
      title="Verify your email"
      subtitle="Your account can sign in, but study features stay locked until verification is complete."
    >
      <Card>
        <View style={styles.emailBlock}>
          <Text style={styles.emailLabel}>Verification email</Text>
          <Text style={styles.emailValue}>{user?.email ?? 'Your account email'}</Text>
          <Text style={styles.emailHint}>
            Open the email we sent, then use the verification link to finish activating your account.
          </Text>
        </View>

        {fromPath ? (
          <View style={styles.noticeCard}>
            <Ionicons
              color={theme.colors.warning}
              name="alert-circle"
              size={18}
            />
            <View style={styles.noticeTextBlock}>
              <Text style={styles.noticeTitle}>
                That area is locked until verification is complete.
              </Text>
              <Text style={styles.noticeBody}>
                Verify your email first, then you can go back to {fromPath}.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.statusGrid}>
          <StatusCard
            description="Log in, view your profile, resend verification, and sign out."
            iconName="shield-checkmark"
            title="Allowed now"
            tone="success"
          />
          <StatusCard
            description="Documents, AI chat, AI actions, flashcards, and quizzes."
            iconName="lock-closed"
            title="Locked for now"
            tone="warning"
          />
          <StatusCard
            description="Verify the email, then return to your learning workspace."
            iconName="arrow-forward-circle"
            title="Next step"
            tone="info"
          />
        </View>

        {data?.message ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>{data.message}</Text>
          </View>
        ) : null}

        {resendError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{resendError}</Text>
          </View>
        ) : null}

        <View style={styles.actionColumn}>
          <Button fullWidth size="lg" loading={isLoading} onPress={() => void handleResend()}>
            {isLoading ? 'Sending email...' : 'Resend verification email'}
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onPress={() => router.push('/(tabs)/profile')}
          >
            Go to profile
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="ghost"
            onPress={() =>
              router.replace(
                typeof fromPath === 'string'
                  ? (fromPath as Href)
                  : '/(tabs)/dashboard',
              )
            }
          >
            {fromPath ? 'Try again' : 'Back to dashboard'}
          </Button>
        </View>
      </Card>
    </Screen>
  );
}

function StatusCard({
  title,
  description,
  iconName,
  tone,
}: {
  title: string;
  description: string;
  iconName: ComponentProps<typeof Ionicons>['name'];
  tone: 'success' | 'warning' | 'info';
}) {
  const palette =
    tone === 'success'
      ? {
          backgroundColor: theme.colors.successSoft,
          iconColor: theme.colors.success,
          borderColor: '#86EFAC',
        }
      : tone === 'warning'
        ? {
            backgroundColor: theme.colors.warningSoft,
            iconColor: theme.colors.warning,
            borderColor: '#FCD34D',
          }
        : {
            backgroundColor: theme.colors.infoSoft,
            iconColor: theme.colors.info,
            borderColor: '#93C5FD',
          };

  return (
    <View
      style={[
        styles.statusCard,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
    >
      <View style={styles.statusHeader}>
        <Ionicons color={palette.iconColor} name={iconName} size={18} />
        <Text style={styles.statusTitle}>{title}</Text>
      </View>
      <Text style={styles.statusDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emailBlock: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  emailLabel: {
    color: theme.colors.text,
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '700',
  },
  emailValue: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  emailHint: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: theme.colors.warningSoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  noticeTextBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  noticeTitle: {
    color: '#78350F',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '700',
  },
  noticeBody: {
    color: '#92400E',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  statusGrid: {
    gap: theme.spacing.md,
  },
  statusCard: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusTitle: {
    color: '#0F172A',
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
    fontWeight: '700',
  },
  statusDescription: {
    color: '#334155',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  successBanner: {
    borderWidth: 1,
    borderColor: '#86EFAC',
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
  },
  actionColumn: {
    gap: theme.spacing.md,
  },
});
