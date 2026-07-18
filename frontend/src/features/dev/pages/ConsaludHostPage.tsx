import { useEffect, useRef, useState } from 'react';

const profiles = [
  { token: 'dev-admin', label: 'Administración', detail: 'Acceso total y todas las áreas' },
  { token: 'dev-recepcion', label: 'Recepción', detail: 'Búsqueda y asignación de turnos' },
  { token: 'dev-c1', label: 'Profesional C1', detail: 'Solo consultorio C1' },
];

export function ConsaludHostPage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [token, setToken] = useState(profiles[0].token);
  const enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_HOST === 'true';

  useEffect(() => {
    const sendIdentity = (event?: MessageEvent) => {
      if (event && (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow || event.data?.type !== 'DIGITURNO_READY')) return;
      frameRef.current?.contentWindow?.postMessage({ type: 'CONSALUD_AUTH', version: 1, accessToken: token }, window.location.origin);
    };
    window.addEventListener('message', sendIdentity);
    return () => window.removeEventListener('message', sendIdentity);
  }, [token]);

  if (!enabled) return <main className="min-h-screen grid place-items-center bg-background"><p className="text-muted-foreground">El host de desarrollo no está disponible.</p></main>;
  return <main className="min-h-screen bg-slate-950 p-4 text-slate-100"><header className="mx-auto mb-4 flex max-w-[1600px] flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-slate-900 px-4 py-3"><div className="mr-auto"><p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">Simulador local de Consalud</p><p className="text-sm text-slate-400">El iframe recibe identidad por postMessage; no hay login local.</p></div>{profiles.map((profile) => <button key={profile.token} onClick={() => setToken(profile.token)} className={`rounded-lg px-3 py-2 text-left text-xs transition-colors ${token === profile.token ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 hover:bg-white/20'}`}><span className="block font-semibold">{profile.label}</span><span className="text-[10px] opacity-75">{profile.detail}</span></button>)}</header><iframe ref={frameRef} title="Digiturno embebido" src="/" className="mx-auto block h-[calc(100vh-112px)] w-full max-w-[1600px] rounded-xl border border-white/10 bg-white" /></main>;
}
