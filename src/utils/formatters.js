export function formatMessageTime(value) {
  if (!value) {
    return '';
  }

  const messageDate = new Date(value);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(messageDate);
}

export function formatConversationDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}

export function formatLastSeen(value) {
  if (!value) {
    return 'Offline';
  }

  return `Last seen ${new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))}`;
}
