import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import MessageBubble from '../components/MessageBubble';
import MessageComposer from '../components/MessageComposer';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useChats } from '../context/ChatContext';
import { useRealtime } from '../context/RealtimeContext';
import { chatApi } from '../services/chatApi';
import { getSocket } from '../services/socket';
import { uploadApi } from '../services/uploadApi';
import { getStoredPendingMessages, persistPendingMessages } from '../utils/storage';
import { handleApiError } from '../utils/handleApiError';
import { formatLastSeen } from '../utils/formatters';

const createTempMessageId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const PENDING_MESSAGE_ERROR = 'Message not sent. Waiting for connection...';
const formatStoredPendingMessage = (message) => ({
  ...message,
  isSending: false,
  status: 'pending',
  delivered: false,
  seen: false,
  deliveredAt: null,
  seenAt: null
});
const resolveOptimisticMediaType = (uploadType) => {
  if (uploadType === 'image') {
    return 'image';
  }

  if (uploadType === 'audio') {
    return 'audio';
  }

  return 'file';
};

function ChatConversationPage() {
  const { chatId } = useParams();
  const { auth } = useAuth();
  const { updateChatFromMessage, upsertChat } = useChats();
  const { emit, presenceByUser, typingByUser } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const scrollRef = useRef(null);
  const messageEndRef = useRef(null);
  const pendingMessagesRef = useRef(new Map());
  const objectUrlRegistryRef = useRef(new Map());

  const syncPendingMessagesStorage = useCallback(() => {
    persistPendingMessages(auth?.user?.id, Array.from(pendingMessagesRef.current.values()));
  }, [auth?.user?.id]);

  const revokeMessageObjectUrl = useCallback((messageId) => {
    const objectUrl = objectUrlRegistryRef.current.get(messageId);

    if (!objectUrl) {
      return;
    }

    URL.revokeObjectURL(objectUrl);
    objectUrlRegistryRef.current.delete(messageId);
  }, []);

  const updateMessageInState = useCallback((nextMessage) => {
    if (!nextMessage?.id) {
      return;
    }

    setMessages((current) =>
      current.map((message) => (message.id === nextMessage.id ? { ...message, ...nextMessage } : message))
    );
  }, []);

  const replaceMessageById = useCallback((messageId, nextMessage) => {
    if (!messageId || !nextMessage?.id) {
      return;
    }

    revokeMessageObjectUrl(messageId);
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? { ...message, ...nextMessage } : message))
    );
  }, [revokeMessageObjectUrl]);

  const upsertMessage = useCallback((nextMessage) => {
    if (!nextMessage?.id) {
      return;
    }

    setMessages((current) => {
      const existingIndex = current.findIndex((message) => message.id === nextMessage.id);

      if (existingIndex === -1) {
        return [...current, nextMessage];
      }

      const next = [...current];
      next[existingIndex] = {
        ...next[existingIndex],
        ...nextMessage
      };
      return next;
    });
  }, []);

  const createOptimisticTextMessage = useCallback(
    (content) => {
      const tempId = createTempMessageId();
      const createdAt = new Date().toISOString();

      return {
        id: tempId,
        clientTempId: tempId,
        chatId,
        senderId: auth?.user?.id || '',
        receiverId: chatUser?.id || '',
        content,
        type: 'text',
        createdAt,
        status: 'pending',
        delivered: false,
        deliveredAt: null,
        seenAt: null,
        seen: false,
        mediaUrl: '',
        fileUrl: '',
        fileName: '',
        mimeType: '',
        fileType: '',
        fileSize: 0,
        size: 0,
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        deletedAt: null,
        statusByUser: []
      };
    },
    [auth?.user?.id, chatId, chatUser?.id]
  );

  const enqueuePendingMessage = useCallback(
    (entry) => {
      if (!entry?.id) {
        return;
      }

      pendingMessagesRef.current.set(entry.id, entry);
      syncPendingMessagesStorage();
    },
    [syncPendingMessagesStorage]
  );

  const updatePendingMessage = useCallback(
    (messageId, updates) => {
      const currentEntry = pendingMessagesRef.current.get(messageId);

      if (!currentEntry) {
        return;
      }

      pendingMessagesRef.current.set(messageId, {
        ...currentEntry,
        ...updates
      });
      syncPendingMessagesStorage();
    },
    [syncPendingMessagesStorage]
  );

  const removePendingMessage = useCallback(
    (messageId) => {
      if (!pendingMessagesRef.current.has(messageId)) {
        return;
      }

      pendingMessagesRef.current.delete(messageId);
      syncPendingMessagesStorage();
    },
    [syncPendingMessagesStorage]
  );

  const flushPendingMessage = useCallback(
    (tempId) => {
      const pendingEntry = pendingMessagesRef.current.get(tempId);
      const socket = getSocket();

      if (!pendingEntry || pendingEntry.isSending || !socket?.connected) {
        return;
      }

      updatePendingMessage(tempId, {
        isSending: true
      });

      socket.emit(
        'sendMessage',
        {
          chatId: pendingEntry.chatId,
          receiverId: pendingEntry.receiverId,
          content: pendingEntry.content,
          type: 'text',
          clientTempId: tempId
        },
        (response) => {
          const latestPendingEntry = pendingMessagesRef.current.get(tempId);

          if (!response?.success) {
            if (latestPendingEntry) {
              updatePendingMessage(tempId, {
                isSending: false
              });
            }

            setError(PENDING_MESSAGE_ERROR);
            return;
          }

          const serverMessage = response.data?.message;

          if (!serverMessage?.id) {
            if (latestPendingEntry) {
              updatePendingMessage(tempId, {
                isSending: false
              });
            }
            return;
          }

          removePendingMessage(tempId);
          replaceMessageById(tempId, {
            ...serverMessage,
            clientTempId: tempId
          });
          setError('');
          updateChatFromMessage(pendingEntry.chatId, serverMessage);
        }
      );
    },
    [removePendingMessage, replaceMessageById, updatePendingMessage, updateChatFromMessage]
  );

  const flushAllPendingMessages = useCallback(() => {
    pendingMessagesRef.current.forEach((_entry, tempId) => {
      flushPendingMessage(tempId);
    });
  }, [flushPendingMessage]);

  const loadConversation = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await chatApi.getConversation(chatId);
      const serverMessages = response.data.data.messages || [];
      const pendingMessagesForChat = Array.from(pendingMessagesRef.current.values())
        .filter((message) => message.chatId === chatId)
        .map(formatStoredPendingMessage);
      const existingIds = new Set(serverMessages.map((message) => message.id));
      const mergedMessages = [
        ...serverMessages,
        ...pendingMessagesForChat.filter((message) => !existingIds.has(message.id))
      ];

      setMessages(mergedMessages);
      setChatUser(response.data.data.chatUser || null);
      upsertChat(response.data.data.chat);
    } catch (requestError) {
      const errorMessage = handleApiError(requestError, 'Unable to load this chat right now.');
      setError(errorMessage);
      toast.error(errorMessage);
      setMessages([]);
      setChatUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, upsertChat]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(
    () => () => {
      objectUrlRegistryRef.current.forEach((objectUrl) => {
        URL.revokeObjectURL(objectUrl);
      });
      objectUrlRegistryRef.current.clear();
    },
    []
  );

  useEffect(() => {
    const storedPendingMessages = getStoredPendingMessages(auth?.user?.id);
    pendingMessagesRef.current = new Map(storedPendingMessages.map((message) => [message.id, message]));
  }, [auth?.user?.id]);

  useEffect(() => {
    if (!chatId) {
      return;
    }

    const pendingMessagesForChat = Array.from(pendingMessagesRef.current.values())
      .filter((message) => message.chatId === chatId)
      .map(formatStoredPendingMessage);

    if (pendingMessagesForChat.length === 0) {
      return;
    }

    setMessages((current) => {
      const existingIds = new Set(current.map((message) => message.id));
      const nextPendingMessages = pendingMessagesForChat.filter((message) => !existingIds.has(message.id));

      if (nextPendingMessages.length === 0) {
        return current;
      }

      return [...current, ...nextPendingMessages];
    });
  }, [chatId]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return undefined;
    }

    const handleReceiveMessage = (incomingMessage) => {
      if (incomingMessage.chatId !== chatId) {
        return;
      }

      if (incomingMessage.clientTempId && pendingMessagesRef.current.has(incomingMessage.clientTempId)) {
        removePendingMessage(incomingMessage.clientTempId);
        replaceMessageById(incomingMessage.clientTempId, incomingMessage);
      } else {
        upsertMessage(incomingMessage);
      }

      updateChatFromMessage(chatId, incomingMessage);

      if (incomingMessage.senderId === chatUser?.id) {
        emit('markConversationSeen', { partnerId: chatUser.id });
      }
    };

    const handleMessageStatusUpdated = (payload) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === payload.messageId
            ? {
                ...message,
                status: payload.status,
                delivered: ['delivered', 'seen'].includes(payload.status),
                seen: payload.status === 'seen',
                deliveredAt: payload.deliveredAt,
                seenAt: payload.seenAt
              }
            : message
        )
      );
    };

    const handleMessageUpdated = ({ message: updatedMessage }) => {
      if (updatedMessage?.chatId !== chatId) {
        return;
      }

      updateMessageInState(updatedMessage);
      updateChatFromMessage(chatId, updatedMessage);
    };

    const handleMessageRemoved = ({ chatId: removedChatId, messageId }) => {
      if (removedChatId !== chatId) {
        return;
      }

      setMessages((current) => current.filter((message) => message.id !== messageId));
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageStatusUpdated', handleMessageStatusUpdated);
    socket.on('messageUpdated', handleMessageUpdated);
    socket.on('messageRemoved', handleMessageRemoved);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageStatusUpdated', handleMessageStatusUpdated);
      socket.off('messageUpdated', handleMessageUpdated);
      socket.off('messageRemoved', handleMessageRemoved);
    };
  }, [chatId, chatUser?.id, emit, removePendingMessage, replaceMessageById, updateChatFromMessage, updateMessageInState, upsertMessage]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return undefined;
    }

    const handleConnect = () => {
      flushAllPendingMessages();
    };

    socket.on('connect', handleConnect);

    if (socket.connected) {
      flushAllPendingMessages();
    }

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [flushAllPendingMessages]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      flushAllPendingMessages();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushAllPendingMessages]);

  useEffect(() => {
    if (!chatId || !chatUser?.id) {
      return undefined;
    }

    emit('chat:join', { chatId });
    emit('conversation:join', { partnerId: chatUser.id });
    emit('markConversationSeen', { partnerId: chatUser.id });

    return () => {
      emit('typing:stop', { partnerId: chatUser.id });
      emit('conversation:leave', { partnerId: chatUser.id });
      emit('chat:leave', { chatId });
    };
  }, [chatId, chatUser?.id, emit]);

  const sortedMessages = useMemo(
    () => [...messages].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt)),
    [messages]
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [sortedMessages]);

  const handleSendMessage = async (content) => {
    if (!chatUser?.id) {
      setError('Chat user is not available.');
      return false;
    }

    const optimisticMessage = createOptimisticTextMessage(content);

    enqueuePendingMessage({
      ...optimisticMessage,
      content,
      isSending: false,
      receiverId: chatUser.id
    });

    upsertMessage(optimisticMessage);
    updateChatFromMessage(chatId, optimisticMessage);
    if (isOffline || !getSocket()?.connected) {
      setError(PENDING_MESSAGE_ERROR);
    } else {
      setError('');
    }
    flushPendingMessage(optimisticMessage.id);

    return true;
  };

  const handleSendMediaMessage = async ({ file, type, content }) => {
    if (!chatUser?.id) {
      setError('Chat user is not available.');
      return false;
    }

    const tempId = createTempMessageId();
    const previewUrl = URL.createObjectURL(file);
    const optimisticType = resolveOptimisticMediaType(type);
    const optimisticMessage = {
      id: tempId,
      clientTempId: tempId,
      chatId,
      senderId: auth?.user?.id || '',
      receiverId: chatUser.id,
      content: content || '',
      type: optimisticType,
      createdAt: new Date().toISOString(),
      status: 'pending',
      delivered: false,
      deliveredAt: null,
      seenAt: null,
      seen: false,
      mediaUrl: previewUrl,
      fileUrl: previewUrl,
      fileName: file.name,
      mimeType: file.type,
      fileType: file.type,
      fileSize: file.size,
      size: file.size,
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      statusByUser: []
    };

    objectUrlRegistryRef.current.set(tempId, previewUrl);
    upsertMessage(optimisticMessage);
    updateChatFromMessage(chatId, optimisticMessage);

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiverId', chatUser.id);
      formData.append('type', type);
      formData.append('content', content || '');

      const response = await uploadApi.uploadMessageMedia(formData);
      const uploadedMessage = response.data.data.message;
      replaceMessageById(tempId, uploadedMessage);
      updateChatFromMessage(chatId, uploadedMessage);
      return true;
    } catch (requestError) {
      revokeMessageObjectUrl(tempId);
      setMessages((current) => current.filter((message) => message.id !== tempId));
      const errorMessage = handleApiError(requestError, PENDING_MESSAGE_ERROR);
      setError(errorMessage === 'Network error. Please check your internet connection and try again.' ? PENDING_MESSAGE_ERROR : errorMessage);
      toast.error('Media upload failed.');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    console.log(`Reacted to message ${messageId} with ${emoji}`);
  };

  const handleEditMessage = async (message) => {
    const socket = getSocket();

    if (!socket) {
      setError('Realtime socket is not connected.');
      return;
    }

    const nextContent = window.prompt('Edit message', message.content || '');

    if (nextContent === null) {
      return;
    }

    const trimmedContent = nextContent.trim();

    if (!trimmedContent) {
      toast.error('Edited message cannot be empty.');
      return;
    }

    if (trimmedContent === message.content) {
      return;
    }

    socket.emit(
      'editMessage',
      {
        messageId: message.id,
        content: trimmedContent
      },
      (response) => {
        if (!response?.success) {
          const errorMessage = response?.message || 'Failed to edit message';
          setError(errorMessage);
          toast.error(errorMessage);
          return;
        }

        setError('');
        updateMessageInState(response.data.message);
        updateChatFromMessage(chatId, response.data.message);
      }
    );
  };

  const handleDeleteMessage = async (message, scope) => {
    const socket = getSocket();

    if (!socket) {
      setError('Realtime socket is not connected.');
      return;
    }

    const confirmMessage =
      scope === 'everyone'
        ? 'Delete this message for everyone?'
        : 'Delete this message only for you?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    socket.emit(
      'deleteMessage',
      {
        messageId: message.id,
        scope
      },
      (response) => {
        if (!response?.success) {
          const errorMessage = response?.message || 'Failed to delete message';
          setError(errorMessage);
          toast.error(errorMessage);
          return;
        }

        setError('');

        if (scope === 'everyone' && response.data?.message) {
          updateMessageInState(response.data.message);
          updateChatFromMessage(chatId, response.data.message);
          return;
        }

        revokeMessageObjectUrl(message.id);
        setMessages((current) => current.filter((item) => item.id !== message.id));
      }
    );
  };

  const presence = presenceByUser[chatUser?.id] || {};
  const isTyping = Boolean(typingByUser[chatUser?.id]);
  const presenceLabel = isTyping ? 'User is typing...' : presence.isOnline ? 'Online' : formatLastSeen(presence.lastSeen);

  return (
    <div className="glass-panel flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-white/10 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Conversation</p>
        <h1 className="mt-2 text-xl font-semibold text-white">{chatUser?.name || 'Chat thread'}</h1>
        <p className={`mt-1 text-sm ${presence.isOnline ? 'text-accent' : 'text-slate-400'}`}>
          {presenceLabel}
        </p>
      </header>

      {error ? (
        <div
          aria-live="polite"
          className="mx-4 mt-4 shrink-0 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="alert"
        >
          <p>{error}</p>
          {!isLoading && error !== PENDING_MESSAGE_ERROR ? (
            <button className="mt-3 secondary-button" onClick={loadConversation} type="button">
              Retry conversation
            </button>
          ) : null}
        </div>
      ) : null}

      <div aria-busy={isLoading ? 'true' : 'false'} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5" ref={scrollRef}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400 flex-col gap-2">
            <Spinner />
            Loading conversation...
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-400">
            <p>Send a message to start chatting</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMessages.map((message) => (
              <MessageBubble
                isOwn={message.senderId === auth?.user?.id}
                key={message.id}
                message={message}
                onDeleteMessage={handleDeleteMessage}
                onEditMessage={handleEditMessage}
                onReaction={handleReaction}
              />
            ))}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      <MessageComposer
        disabled={!chatId || !chatUser?.id}
        isUploading={isUploading}
        onSendMedia={handleSendMediaMessage}
        onTypingStart={() => emit('typing:start', { partnerId: chatUser?.id })}
        onTypingStop={() => emit('typing:stop', { partnerId: chatUser?.id })}
        onSendText={handleSendMessage}
      />
    </div>
  );
}

export default ChatConversationPage;
