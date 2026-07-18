import axios from 'axios';
import { getAccessToken, requestAuthentication } from './embedded-auth';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Accept': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) requestAuthentication();
    return Promise.reject(error);
  },
);
