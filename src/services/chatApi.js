import { api } from './api';

export const chatApi = {
  getUsers: () => api.get('/users'),
  getChats: () => api.get('/chats'),
  accessChat: (userId) => api.post('/chats/access', { userId }),
  getConversation: (chatId) => api.get(`/chats/${chatId}/messages`)
};
