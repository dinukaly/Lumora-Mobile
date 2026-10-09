import * as Linking from 'expo-linking';

import type { User } from '@/api/authApi';

export function getGoogleAuthCallbackPath() {
  return '/google-auth-callback';
}

export function getGoogleAuthCallbackUrl() {
  return Linking.createURL(getGoogleAuthCallbackPath());
}

export function getGoogleAuthErrorMessage(errorCode?: string | null) {
  switch (errorCode) {
    case 'OAUTH_INVALID_STATE':
      return 'This Google sign-in attempt expired or could not be verified safely. Please try again.';
    case 'OAUTH_LINK_FAILED':
      return 'This Google account could not be linked securely. Use a Google account with a verified email, or sign in with your Lumora password if you already have one.';
    case 'OAUTH_PROVIDER_ERROR':
      return 'Google sign-in could not be completed right now. Please try again in a moment.';
    case 'OAUTH_DISABLED':
      return 'Google sign-in is not available on the current backend.';
    default:
      return 'Google sign-in could not be completed. Please try again.';
  }
}

export function isGoogleAuthCallbackSuccess(input: {
  provider?: string | string[] | null;
  status?: string | string[] | null;
  accessToken?: string | string[] | null;
  refreshToken?: string | string[] | null;
}) {
  const provider = Array.isArray(input.provider) ? input.provider[0] : input.provider;
  const status = Array.isArray(input.status) ? input.status[0] : input.status;
  const accessToken = Array.isArray(input.accessToken)
    ? input.accessToken[0]
    : input.accessToken;
  const refreshToken = Array.isArray(input.refreshToken)
    ? input.refreshToken[0]
    : input.refreshToken;

  return (
    provider === 'google' &&
    status === 'success' &&
    typeof accessToken === 'string' &&
    accessToken.length > 0 &&
    typeof refreshToken === 'string' &&
    refreshToken.length > 0
  );
}

export function getPostGoogleAuthMessage(user: User) {
  return user.emailVerifiedAt
    ? `Welcome to Lumora, ${user.name}.`
    : 'Your account is ready. Verify your email if protected learning features are still locked.';
}
