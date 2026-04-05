import { api } from './api';

export const uploadApi = {
  uploadMessageMedia: (formData) =>
    api.post('/uploads/message-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
};
