const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '');
  const configuredBackendUrl = trimTrailingSlash(import.meta.env.VITE_BACKEND_PUBLIC_URL || '');

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (configuredBackendUrl) {
    return `${configuredBackendUrl}/api`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  return '/api';
};

const resolveBackendOrigin = () => {
  const apiBaseUrl = resolveApiBaseUrl();

  try {
    return trimTrailingSlash(new URL(apiBaseUrl, typeof window !== 'undefined' ? window.location.origin : undefined).origin);
  } catch (_error) {
    return '';
  }
};

export const resolveMediaUrl = (value = '') => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) {
    return value;
  }

  const backendOrigin = resolveBackendOrigin();

  if (!backendOrigin) {
    return value;
  }

  return new URL(value.startsWith('/') ? value : `/${value}`, backendOrigin).toString();
};

export const resolveApiBaseUrlForClient = resolveApiBaseUrl;
