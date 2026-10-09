import { Redirect } from 'expo-router';

import { getPostAuthRoute } from '@/auth/emailVerification';
import { useAppSelector } from '@/store/hooks';

export default function IndexScreen() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  return (
    <Redirect
      href={isAuthenticated ? getPostAuthRoute(user) : '/(auth)/login'}
    />
  );
}
