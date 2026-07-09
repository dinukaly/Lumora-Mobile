import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useLogoutAction } from '@/auth/authBootstrap';
import { useAppSelector } from '@/store/hooks';
import { Button, Card, PlaceholderScreen } from '@/components/ui';
import { theme } from '@/theme';

export default function ProfileScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [formError, setFormError] = useState<string | null>(null);
  const { logout, isLoading } = useLogoutAction();

  async function handleLogout() {
    setFormError(null);

    try {
      await logout();
    } catch {
      setFormError('Unable to complete logout cleanly. Please try again.');
    }
  }

  return (
    <PlaceholderScreen
      title="Profile"
      subtitle="This screen now supports a real logout flow while profile editing waits for a later task."
      badgeLabel="Tab"
      highlights={[
        'Profile is included as the fifth bottom tab.',
        user
          ? `Current session belongs to ${user.name} (${user.email}).`
          : 'User details will appear here after session restore completes.',
      ]}
      footer={
        <Card
          title="Session controls"
          description="Logging out clears Redux auth state, SecureStore refresh tokens, and RTK Query cache."
        >
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          <Button
            fullWidth
            variant="danger"
            loading={isLoading}
            onPress={handleLogout}
          >
            Log out
          </Button>
        </Card>
      }
    />
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
