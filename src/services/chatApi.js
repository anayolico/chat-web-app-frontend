import { api } from './api';

export const chatApi = {
  getUsers: () => api.get('/users'),
  getChats: () => api.get('/chats'),
  accessChat: (userId) => api.post('/chats/access', { userId }),
  createGroup: (name, memberIds) => api.post('/chats/group', { name, memberIds }),
  forwardMessage: (payload) => api.post('/chats/forward', payload),
  getConversation: (chatId, params = {}) => api.get(`/chats/${chatId}/messages`, { params }),
  toggleChatPin: (chatId) => api.post(`/chats/${chatId}/pin`),
  toggleMessagePin: (messageId) => api.post(`/chats/messages/${messageId}/pin`),
  toggleSecureMode: (chatId) => api.post(`/chats/${chatId}/secure-mode`)
};
