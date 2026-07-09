import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'lumora.mobile.refresh-token';

async function ensureSecureStoreAvailable() {
  const isAvailable = await SecureStore.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('SecureStore is unavailable on this device.');
  }
}

export async function saveRefreshToken(refreshToken: string) {
  await ensureSecureStoreAvailable();
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getRefreshToken() {
  await ensureSecureStoreAvailable();
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearRefreshToken() {
  await ensureSecureStoreAvailable();
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
