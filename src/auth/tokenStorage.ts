import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'lumora.mobile.refresh-token';

let memoryRefreshToken: string | null = null;

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

function getWebStorage() {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

export async function saveRefreshToken(refreshToken: string) {
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    return;
  }

  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    return;
  }

  memoryRefreshToken = refreshToken;
}

export async function getRefreshToken() {
  if (await canUseSecureStore()) {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }

  const webStorage = getWebStorage();

  if (webStorage) {
    return webStorage.getItem(REFRESH_TOKEN_KEY);
  }

  return memoryRefreshToken;
}

export async function clearRefreshToken() {
  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    return;
  }

  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  memoryRefreshToken = null;
}
