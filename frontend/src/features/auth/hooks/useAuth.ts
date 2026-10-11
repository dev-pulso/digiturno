import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export interface AreaPredeterminada {
  id: number;
  codigo: string;
  nombre: string;
  prefijo: string;
}

export interface ConsaludUser {
  id: number;
  usuario: string;
  identificacion?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  email?: string;
  role_id?: number;
  estado?: number;
  rol?: 'admin' | 'recepcion' | 'medico';
  area_predeterminada?: AreaPredeterminada | null;
  puede_rotar?: boolean;
  [key: string]: any;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: ConsaludUser | null;
}

const TOKEN_KEY = 'digiturno_token';
const USER_KEY = 'digiturno_user';
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos

export function useAuth() {
  const [user, setUser] = useState<ConsaludUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('ips-token') || null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async (notify = false, msg = 'Sesión cerrada exitosamente') => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignorar error al limpiar localmente
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('ips-token');
      setUser(null);
      setToken(null);
      if (notify) {
        toast.info(msg);
      }
      window.location.href = '/login';
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (token || user) {
      timerRef.current = setTimeout(() => {
        logout(true, 'Sesión cerrada automáticamente por inactividad.');
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [token, user, logout]);

  // Listener para detectar actividad del usuario
  useEffect(() => {
    if (!token && !user) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [token, user, resetInactivityTimer]);

  const login = async (usernameOrEmail: string, password: string): Promise<ConsaludUser | null> => {
    setIsLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', {
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      });

      const data = res.data;
      const accessToken = data.accessToken;
      const userData = data.user;

      if (accessToken) {
        localStorage.setItem(TOKEN_KEY, accessToken);
        // Compatibilidad con staff anterior si existía
        localStorage.setItem('ips-token', accessToken);
        setToken(accessToken);
      }

      if (userData) {
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
      }

      const nombre = userData
        ? [userData.primer_nombre, userData.primer_apellido].filter(Boolean).join(' ') || userData.usuario
        : 'Usuario';

      toast.success(`Bienvenido(a), ${nombre}`);
      return userData || ({} as ConsaludUser);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.mensaje || 'Error al iniciar sesión';
      toast.error(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    token,
    isAuthenticated: !!token || !!user,
    isLoading,
    login,
    logout,
  };
}
