const STORAGE_KEY = 'chat-web-app-auth';
const PENDING_MESSAGES_KEY_PREFIX = 'chat-web-app-pending-messages';

const getPendingMessagesStorageKey = (userId) => `${PENDING_MESSAGES_KEY_PREFIX}:${userId}`;

export function persistAuth(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getStoredAuth() {
  const rawValue = localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function removeStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function updateStoredAuthTokens(tokens) {
  const current = getStoredAuth();

  if (!current) {
    return null;
  }

  const nextAuth = {
    ...current,
    token: tokens?.token || current.token || '',
    refreshToken: tokens?.refreshToken || current.refreshToken || ''
  };

  persistAuth(nextAuth);
  return nextAuth;
}

export function getStoredPendingMessages(userId) {
  if (!userId) {
    return [];
  }

  const rawValue = localStorage.getItem(getPendingMessagesStorageKey(userId));

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (_error) {
    localStorage.removeItem(getPendingMessagesStorageKey(userId));
    return [];
  }
}

export function persistPendingMessages(userId, pendingMessages) {
  if (!userId) {
    return;
  }

  if (!pendingMessages?.length) {
    localStorage.removeItem(getPendingMessagesStorageKey(userId));
    return;
  }

  localStorage.setItem(getPendingMessagesStorageKey(userId), JSON.stringify(pendingMessages));
}
