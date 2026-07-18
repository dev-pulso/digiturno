import { useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { EmbeddedAuthContext } from './embedded-auth-context';

const isPublic = (path: string) => path.startsWith('/display') || path === '/dev/consalud-host';

export function AccessBoundary() {
  const { ready, authenticated } = useContext(EmbeddedAuthContext);
  const location = useLocation();
  if (isPublic(location.pathname)) return <Outlet />;
  if (!ready) return <main className="min-h-screen grid place-items-center bg-background p-6"><div className="max-w-md text-center"><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Digiturno</p><h1 className="mt-3 font-display text-2xl font-bold">Conectando con Consalud…</h1><p className="mt-2 text-sm text-muted-foreground">Esperando la identidad segura de la aplicación principal.</p></div></main>;
  if (!authenticated) return <main className="min-h-screen grid place-items-center bg-background p-6"><div className="max-w-md rounded-xl border border-border bg-card p-7 text-center"><p className="font-mono text-xs uppercase tracking-[0.2em] text-destructive">Acceso no disponible</p><h1 className="mt-3 font-display text-2xl font-bold">Abre Digiturno desde Consalud</h1><p className="mt-2 text-sm text-muted-foreground">Esta aplicación no inicia sesión por sí misma.</p></div></main>;
  return <Outlet />;
}
