import type { User } from '@/api/authApi';

export function isEmailVerified(user: User | null | undefined) {
  return Boolean(user?.emailVerifiedAt);
}

export function getPostAuthRoute(user: User | null | undefined) {
  return isEmailVerified(user) ? '/(tabs)/dashboard' : '/verify-email/pending';
}
