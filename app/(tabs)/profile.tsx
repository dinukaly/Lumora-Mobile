import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useResendVerificationEmailMutation } from '@/api/authApi';
import { useLogoutAction } from '@/auth/authBootstrap';
import { Button, Card, Screen } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

export default function ProfileScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const { logout, isLoading } = useLogoutAction();
  const [resendVerificationEmail, { isLoading: isResendingVerification }] =
    useResendVerificationEmailMutation();
  const emailVerified = Boolean(user?.emailVerifiedAt);

  async function handleLogout() {
    setLogoutError(null);

    try {
      await logout();
    } catch {
      setLogoutError('Unable to complete logout cleanly. Please try again.');
    }
  }

  async function handleResendVerification() {
    setVerificationMessage(null);
    setVerificationError(null);

    try {
      const result = await resendVerificationEmail().unwrap();
      setVerificationMessage(result.message);
    } catch (error) {
      setVerificationError(
        getApiFormErrorState(error).formError ??
          'Unable to resend the verification email right now.',
      );
    }
  }

  return (
    <Screen
      title="Profile"
      subtitle="Manage your current session, verification status, and the basics of your Lumora account."
    >
      <Card title="Account summary">
        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Ionicons
              color={theme.colors.brand}
              name="person-circle-outline"
              size={28}
            />
          </View>
          <View style={styles.summaryTextBlock}>
            <Text style={styles.summaryName}>{user?.name ?? 'Lumora learner'}</Text>
            <Text style={styles.summaryEmail}>
              {user?.email ?? 'No email available'}
            </Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Role</Text>
            <Text style={styles.metaValue}>{user?.role ?? 'USER'}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Email status</Text>
            <Text
              style={[
                styles.metaValue,
                emailVerified ? styles.metaValueSuccess : styles.metaValueWarning,
              ]}
            >
              {emailVerified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>
      </Card>

      {!emailVerified ? (
        <Card
          title="Email verification"
          description="Learning features stay locked until your email address is verified."
        >
          <Text style={styles.supportingText}>
            We&apos;ll send the verification link to {user?.email ?? 'your account email'}.
          </Text>
          {verificationMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{verificationMessage}</Text>
            </View>
          ) : null}
          {verificationError ? (
            <Text style={styles.errorText}>{verificationError}</Text>
          ) : null}
          <Button
            fullWidth
            loading={isResendingVerification}
            onPress={() => void handleResendVerification()}
          >
            {isResendingVerification ? 'Sending email...' : 'Resend verification email'}
          </Button>
        </Card>
      ) : null}

      <Card
        title="Session controls"
        description="Logging out clears Redux auth state, SecureStore refresh tokens, and RTK Query cache."
      >
        {logoutError ? <Text style={styles.errorText}>{logoutError}</Text> : null}
        <Button
          fullWidth
          variant="danger"
          loading={isLoading}
          onPress={handleLogout}
        >
          Log out
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  summaryName: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  summaryEmail: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metaCard: {
    flex: 1,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  metaLabel: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
    fontWeight: '700',
  },
  metaValueSuccess: {
    color: theme.colors.success,
  },
  metaValueWarning: {
    color: theme.colors.warning,
  },
  supportingText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  successBanner: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: theme.colors.successSoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  successText: {
    color: '#166534',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
