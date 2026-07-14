import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLazyStartMobileGoogleOAuthQuery } from '@/api/authApi';
import { Button } from '@/components/ui';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

import { getGoogleAuthCallbackUrl } from './googleAuth';

export function GoogleAuthButton({
  disabled = false,
  mode,
  onError,
}: {
  disabled?: boolean;
  mode: 'login' | 'signup';
  onError: (message: string) => void;
}) {
  const [startGoogleAuth, { isFetching }] = useLazyStartMobileGoogleOAuthQuery();
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handleGoogleAuth() {
    onError('');
    setIsRedirecting(true);

    try {
      const { authorizationUrl } = await startGoogleAuth({
        callbackUrl: getGoogleAuthCallbackUrl(),
      }).unwrap();

      await Linking.openURL(authorizationUrl);
    } catch (error) {
      onError(
        getApiFormErrorState(error).formError ??
          'Google sign-in could not be started.',
      );
      setIsRedirecting(false);
      return;
    }

    setIsRedirecting(false);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>
      <Button
        fullWidth
        variant="secondary"
        disabled={disabled}
        loading={isFetching}
        leftAccessory={<Ionicons color={theme.colors.info} name="logo-google" size={18} />}
        onPress={() => void handleGoogleAuth()}
      >
        {isRedirecting
          ? 'Opening Google...'
          : mode === 'login'
            ? 'Continue with Google'
            : 'Sign up with Google'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.textSoft,
    fontSize: 11,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
});
