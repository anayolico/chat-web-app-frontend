// Chat context provider for managing chat-related state
// This context handles users, chats, and chat operations like accessing chats
// and updating chat data when new messages arrive

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { chatApi } from '../services/chatApi';
import { handleApiError } from '../utils/handleApiError';

// Create the chat context
const ChatContext = createContext(null);

// Helper function to sort chats by most recently updated
const sortChats = (items) =>
  [...items].sort((left, right) => new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0));

export function ChatProvider({ children }) {
  // State for all available users
  const [users, setUsers] = useState([]);
  // State for user's chats, sorted by most recent
  const [chats, setChats] = useState([]);
  // Loading state for initial data fetch
  const [isLoading, setIsLoading] = useState(true);
  // Error state for data loading failures
  const [loadError, setLoadError] = useState('');

  const loadChatData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      // Fetch users and chats in parallel
      const [usersResponse, chatsResponse] = await Promise.all([chatApi.getUsers(), chatApi.getChats()]);
      setUsers(usersResponse.data.data.users || []);
      setChats(sortChats(chatsResponse.data.data.chats || []));
    } catch (error) {
      setLoadError(handleApiError(error, 'Unable to load users and chats right now.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to load initial chat data (users and chats)
  useEffect(() => {
    loadChatData();
  }, [loadChatData]);

  // Function to access/create a chat with a specific user
  const accessChat = useCallback(async (userId) => {
    const response = await chatApi.accessChat(userId);
    const chat = response.data.data.chat;

    // Update chats list with the new/accessed chat at the top
    setChats((current) => {
      const next = current.filter((item) => item.id !== chat.id);
      return sortChats([chat, ...next]);
    });

    return chat;
  }, []);

  // Function to add or update a chat in the list
  const upsertChat = useCallback((chat) => {
    if (!chat?.id) {
      return;
    }

    setChats((current) => {
      const next = current.filter((item) => item.id !== chat.id);
      return sortChats([chat, ...next]);
    });
  }, []);

  // Function to update a chat's last message and timestamp when a new message arrives
  const updateChatFromMessage = useCallback((chatId, message) => {
    if (!chatId || !message) {
      return;
    }

    setChats((current) =>
      sortChats(
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                lastMessage: {
                  senderId: message.senderId,
                  content: message.content || '',
                  type: message.type || 'text',
                  mediaUrl: message.mediaUrl || '',
                  fileName: message.fileName || '',
                  createdAt: message.createdAt
                },
                updatedAt: message.createdAt
              }
            : chat
        )
      )
    );
  }, []);

  // Memoized context value
  const value = useMemo(
    () => ({
      users,
      chats,
      isLoading,
      loadError,
      reloadChatData: loadChatData,
      accessChat,
      upsertChat,
      updateChatFromMessage
    }),
    [accessChat, chats, isLoading, loadChatData, loadError, updateChatFromMessage, upsertChat, users]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Custom hook to use the chat context
export function useChats() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error('useChats must be used inside ChatProvider');
  }

  return context;
}
