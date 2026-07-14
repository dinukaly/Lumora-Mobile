import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

const PUSH_TOKEN_KEY = 'lumora.mobile.push-token';
const PUSH_USER_ID_KEY = 'lumora.mobile.push-user-id';

let memoryPushToken: string | null = null;
let memoryPushUserId: string | null = null;
let didWarnAboutUnavailableNativePushModules = false;

type StoredPushRegistration = {
  token: string | null;
  userId: string | null;
};

type RegisterTokenFn = (token: string) => Promise<void>;

type PushRegistrationStatus =
  | 'registered'
  | 'already-registered'
  | 'unsupported'
  | 'permission-denied'
  | 'project-id-missing';

async function canUseSecureStore() {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function syncPushTokenRegistration(options: {
  userId: string;
  registerToken: RegisterTokenFn;
  removeToken?: RegisterTokenFn;
}) {
  const expoPushToken = await getExpoPushToken();

  if (!expoPushToken) {
    return 'unsupported' as const;
  }

  if (expoPushToken === 'permission-denied') {
    return 'permission-denied' as const;
  }

  if (expoPushToken === 'project-id-missing') {
    return 'project-id-missing' as const;
  }

  const storedRegistration = await getStoredPushRegistration();

  if (
    storedRegistration.token === expoPushToken &&
    storedRegistration.userId === options.userId
  ) {
    return 'already-registered' as const;
  }

  if (
    storedRegistration.token &&
    storedRegistration.userId === options.userId &&
    storedRegistration.token !== expoPushToken &&
    options.removeToken
  ) {
    try {
      await options.removeToken(storedRegistration.token);
    } catch (error) {
      console.warn('Failed to remove stale Expo push token', error);
    }
  }

  await options.registerToken(expoPushToken);
  await saveStoredPushRegistration({
    token: expoPushToken,
    userId: options.userId,
  });

  return 'registered' as const;
}

export async function unregisterStoredPushToken(removeToken: RegisterTokenFn) {
  const storedRegistration = await getStoredPushRegistration();

  if (!storedRegistration.token) {
    return;
  }

  try {
    await removeToken(storedRegistration.token);
  } catch (error) {
    console.warn('Failed to unregister Expo push token', error);
  } finally {
    await clearStoredPushRegistration();
  }
}

async function getExpoPushToken() {
  if (Platform.OS === 'web') {
    return null;
  }

  const nativePushModules = await loadNativePushModules();

  if (!nativePushModules) {
    return null;
  }

  const { Device, Notifications } = nativePushModules;

  if (!Device.isDevice) {
    return null;
  }

  const projectId = resolveProjectId();

  if (!projectId) {
    return 'project-id-missing' as const;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const permissionResponse = await Notifications.getPermissionsAsync();
  let permissionStatus = permissionResponse.status;

  if (permissionStatus !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    permissionStatus = requestedPermissions.status;
  }

  if (permissionStatus !== 'granted') {
    return 'permission-denied' as const;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenResponse.data;
  } catch (error) {
    console.warn('Failed to fetch Expo push token', error);
    return null;
  }
}

function resolveProjectId() {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;

  return Constants.easConfig?.projectId ?? extra?.eas?.projectId ?? null;
}

async function saveStoredPushRegistration(registration: StoredPushRegistration) {
  if (await canUseSecureStore()) {
    if (registration.token) {
      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, registration.token);
    } else {
      await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
    }

    if (registration.userId) {
      await SecureStore.setItemAsync(PUSH_USER_ID_KEY, registration.userId);
    } else {
      await SecureStore.deleteItemAsync(PUSH_USER_ID_KEY);
    }

    return;
  }

  const webStorage = getWebStorage();

  if (webStorage) {
    if (registration.token) {
      webStorage.setItem(PUSH_TOKEN_KEY, registration.token);
    } else {
      webStorage.removeItem(PUSH_TOKEN_KEY);
    }

    if (registration.userId) {
      webStorage.setItem(PUSH_USER_ID_KEY, registration.userId);
    } else {
      webStorage.removeItem(PUSH_USER_ID_KEY);
    }
  }

  memoryPushToken = registration.token;
  memoryPushUserId = registration.userId;
}

async function getStoredPushRegistration(): Promise<StoredPushRegistration> {
  if (await canUseSecureStore()) {
    const [token, userId] = await Promise.all([
      SecureStore.getItemAsync(PUSH_TOKEN_KEY),
      SecureStore.getItemAsync(PUSH_USER_ID_KEY),
    ]);

    return {
      token,
      userId,
    };
  }

  const webStorage = getWebStorage();

  if (webStorage) {
    return {
      token: webStorage.getItem(PUSH_TOKEN_KEY),
      userId: webStorage.getItem(PUSH_USER_ID_KEY),
    };
  }

  return {
    token: memoryPushToken,
    userId: memoryPushUserId,
  };
}

async function clearStoredPushRegistration() {
  await saveStoredPushRegistration({
    token: null,
    userId: null,
  });
}

function getWebStorage() {
  if (Platform.OS !== 'web') {
    return null;
  }

  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

export type { PushRegistrationStatus };

async function loadNativePushModules() {
  try {
    const requiredNativeModules = [
      'ExpoDevice',
      'ExpoPushTokenManager',
      'ExpoNotificationPermissionsModule',
      'NotificationsServerRegistrationModule',
    ];

    if (Platform.OS === 'android') {
      requiredNativeModules.push('ExpoNotificationChannelManager');
    }

    const hasAllNativeModules = requiredNativeModules.every((moduleName) =>
      Boolean(requireOptionalNativeModule(moduleName)),
    );

    if (!hasAllNativeModules) {
      if (!didWarnAboutUnavailableNativePushModules) {
        didWarnAboutUnavailableNativePushModules = true;
        console.warn(
          'Expo native push modules are unavailable in the current runtime. Rebuild the development client to enable push notifications.',
        );
      }

      return null;
    }

    // Use require inside try/catch so missing native modules fail gracefully
    // on older dev clients instead of crashing during module evaluation.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Device = require('expo-device') as typeof import('expo-device');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');

    return {
      Device,
      Notifications,
    };
  } catch (error) {
    if (!didWarnAboutUnavailableNativePushModules) {
      didWarnAboutUnavailableNativePushModules = true;
      console.warn(
        'Expo native push modules are unavailable in the current runtime. Rebuild the development client to enable push notifications.',
        error,
      );
    }

    return null;
  }
}
