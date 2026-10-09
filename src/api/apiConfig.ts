const FALLBACK_API_BASE_URL = 'http://localhost:5000/api/v1';

export function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  return configuredUrl
    ? configuredUrl.replace(/\/$/, '')
    : FALLBACK_API_BASE_URL;
}

export function resolveSocketBaseUrl() {
  return resolveApiBaseUrl().replace(/\/api\/v1$/, '');
}
