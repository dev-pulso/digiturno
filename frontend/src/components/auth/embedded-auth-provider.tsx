import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api-client';
import { onAuthenticationRequired, setAccessToken, type ConsaludIdentity } from '@/lib/embedded-auth';
import { EmbeddedAuthContext } from './embedded-auth-context';

function allowedOrigin() {
  return import.meta.env.VITE_CONSALUD_ORIGIN || (import.meta.env.DEV ? window.location.origin : '');
}

export function EmbeddedAuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<ConsaludIdentity | null>(null);
  const [ready, setReady] = useState(() => window.parent === window);

  const notifyParent = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const origin = allowedOrigin();
    if (window.parent !== window && origin) {
      window.parent.postMessage({ type, version: 1, ...payload }, origin);
    }
  }, []);

  const loadIdentity = useCallback(async (token: string) => {
    setAccessToken(token);
    try {
      const response = await api.get('/session/me');
      setIdentity(response.data.data);
    } catch {
      setAccessToken(null);
      setIdentity(null);
      notifyParent('DIGITURNO_AUTH_REQUIRED', { reason: 'invalid' });
    } finally {
      setReady(true);
    }
  }, [notifyParent]);

  useEffect(() => {
    const origin = allowedOrigin();
    const receive = (event: MessageEvent) => {
      if (!origin || event.origin !== origin || event.source !== window.parent) return;
      const message = event.data as { type?: string; accessToken?: string };
      if (message?.type === 'CONSALUD_AUTH' && message.accessToken) void loadIdentity(message.accessToken);
    };
    window.addEventListener('message', receive);
    const unsubscribe = onAuthenticationRequired(() => notifyParent('DIGITURNO_AUTH_REQUIRED', { reason: 'expired' }));
    notifyParent('DIGITURNO_READY');
    return () => { window.removeEventListener('message', receive); unsubscribe(); };
  }, [loadIdentity, notifyParent]);

  const value = useMemo(() => ({ identity, ready, authenticated: Boolean(identity) }), [identity, ready]);
  return <EmbeddedAuthContext.Provider value={value}>{children}</EmbeddedAuthContext.Provider>;
}
