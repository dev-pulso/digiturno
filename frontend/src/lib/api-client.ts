import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Accept': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ips-token');
  if (token) {
    config.headers['X-Consalud-Token'] = token;
  }
  return config;
});
