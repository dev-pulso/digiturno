import axios from 'axios';
import { toast } from 'sonner';

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

// ponytail: toast global de errores API; un interceptor en vez de catch por llamada.
// Pantallas públicas (display) manejan su propio estado de error si lo necesitan.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.mensaje
      || err.response?.data?.message
      || 'Error de comunicación con el servidor';
    toast.error(msg);
    return Promise.reject(err);
  }
);
