const OFFLINE_MESSAGE = "You're offline. Message will be sent when connection is restored.";

export function handleApiError(error, fallbackMessage = 'Something went wrong') {
  if (!error) {
    return fallbackMessage;
  }

  const isNetworkError =
    error.message === 'Network Error' ||
    error.code === 'ECONNABORTED' ||
    (typeof error.message === 'string' && error.message.toLowerCase().includes('timeout')) ||
    typeof error.response === 'undefined';

  if (isNetworkError) {
    return OFFLINE_MESSAGE;
  }

  // Avoid exposing raw backend details (including IP addresses, internal codes, etc.)
  // for user-facing error messages. Use fallbackMessage for privacy and simplicity.
  return fallbackMessage;
}

export { OFFLINE_MESSAGE };

