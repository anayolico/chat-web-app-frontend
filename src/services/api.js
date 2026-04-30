import axios from 'axios';

import { getStoredAuth, removeStoredAuth, updateStoredAuthTokens } from '../utils/storage';
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

let refreshPromise = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    const auth = getStoredAuth();

    if (!auth?.refreshToken) {
      throw new Error('Missing refresh token');
    }

    refreshPromise = axios
      .post(
        `${resolveApiBaseUrlForClient()}/auth/refresh`,
        { refreshToken: auth.refreshToken },
        {
          timeout: 15000
        }
      )
      .then((response) => {
        const payload = response?.data?.data || {};
        updateStoredAuthTokens({
          token: payload.token,
          refreshToken: payload.refreshToken
        });
        return payload.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const statusCode = error?.response?.status;

    if (statusCode !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    try {
      const nextToken = await refreshAccessToken();
      originalRequest._retry = true;
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${nextToken}`
      };
      return api(originalRequest);
    } catch (refreshError) {
      removeStoredAuth();
      return Promise.reject(refreshError);
    }
  }
);
