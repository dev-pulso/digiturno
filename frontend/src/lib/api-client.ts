import axios from 'axios';
import { toast } from 'sonner';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Accept': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('digiturno_token') || localStorage.getItem('ips-token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    config.headers['X-Consalud-Token'] = token;
  }
  return config;
});

// ponytail: toast global de errores API; un interceptor en vez de catch por llamada.
// Pantallas públicas (display) manejan su propio estado de error si lo necesitan.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('digiturno_token');
      localStorage.removeItem('digiturno_user');
      localStorage.removeItem('ips-token');
      if (window.location.pathname.includes('/recepcion')) {
        toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    const msg = err.response?.data?.mensaje
      || err.response?.data?.message
      || 'Error de comunicación con el servidor';
    toast.error(msg);
    return Promise.reject(err);
  }
);
