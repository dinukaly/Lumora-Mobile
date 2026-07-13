import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

import {
  useRegisterPushTokenMutation,
  useRemovePushTokenMutation,
} from '@/api/authApi';
import { useAppSelector } from '@/store/hooks';
import {
  syncPushTokenRegistration,
} from '@/services/pushNotifications';
import { useOnAppResume } from '@/utils/appState';

export function PushNotificationsBridge({ children }: PropsWithChildren) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const userId = useAppSelector((state) => state.auth.user?.id ?? null);
  const [registerPushToken] = useRegisterPushTokenMutation();
  const [removePushToken] = useRemovePushTokenMutation();
  const syncPromiseRef = useRef<Promise<void> | null>(null);
  const pushEndpointUnavailableRef = useRef(false);
  const syncStateRef = useRef({
    isAuthenticated,
    userId,
  });
  const runRegistrationSyncRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    syncStateRef.current = {
      isAuthenticated,
      userId,
    };
  }, [isAuthenticated, userId]);

  useEffect(() => {
    runRegistrationSyncRef.current = async () => {
      const currentState = syncStateRef.current;

      if (
        !currentState.isAuthenticated ||
        !currentState.userId ||
        syncPromiseRef.current ||
        pushEndpointUnavailableRef.current
      ) {
        return;
      }

      const currentUserId = currentState.userId;

      syncPromiseRef.current = (async () => {
        try {
          await syncPushTokenRegistration({
            userId: currentUserId,
            registerToken: async (token) => {
              await registerPushToken({ token }).unwrap();
            },
            removeToken: async (token) => {
              await removePushToken({ token }).unwrap();
            },
          });
        } catch (error) {
          if (isPushTokenEndpointUnavailable(error)) {
            pushEndpointUnavailableRef.current = true;
            console.warn(
              'Push token registration endpoint is unavailable on the current backend. Deploy the backend push-token routes before testing mobile push notifications.',
            );
            return;
          }

          console.warn('Push token registration failed', error);
        } finally {
          syncPromiseRef.current = null;
        }
      })();

      await syncPromiseRef.current;
    };
  }, [registerPushToken, removePushToken]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    void runRegistrationSyncRef.current();
  }, [isAuthenticated, userId]);

  useOnAppResume(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    void runRegistrationSyncRef.current();
  });

  return <>{children}</>;
}

function isPushTokenEndpointUnavailable(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return (
    'status' in error &&
    error.status === 'PARSING_ERROR' &&
    'originalStatus' in error &&
    error.originalStatus === 404
  );
}
