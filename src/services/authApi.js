import { api } from './api';

export const authApi = {
  signup: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  refreshSession: (payload) => api.post('/auth/refresh', payload),
  logout: (payload) => api.post('/auth/logout', payload),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (payload) => api.put('/auth/me', payload),
  toggleBlockedUser: (userId) => api.post(`/users/block/${userId}`),
  deleteAccount: () => api.delete('/users/me'),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  verifyResetOtp: (payload) => api.post('/auth/verify-reset-otp', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload)
};
