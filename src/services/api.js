import axios from 'axios';

import { getStoredAuth } from '../utils/storage';
import { resolveApiBaseUrlForClient } from '../utils/mediaUrl';

export const api = axios.create({
  baseURL: resolveApiBaseUrlForClient(),
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();

  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }

  return config;
});
