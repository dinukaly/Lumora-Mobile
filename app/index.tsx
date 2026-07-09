import { Redirect } from 'expo-router';

import { useAppSelector } from '@/store/hooks';

export default function IndexScreen() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <Redirect
      href={isAuthenticated ? '/(tabs)/dashboard' : '/(auth)/login'}
    />
  );
}
