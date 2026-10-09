import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Turno, Video } from '@/lib/types';
import { useClock } from '@/hooks/use-clock';
import { anunciarTurno } from '@/lib/speech';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronLeftIcon } from '@hugeicons/core-free-icons';
import Pusher from 'pusher-js';
import React from 'react';
import Logo from '@/assets/LOGO CONSALUD L.png';

interface AreaDisplay {
  id: number;
  codigo: string;
  nombre: string;
  prefijo: string;
  color: string;
  actual: any;
  en_espera: number;
  historial: any[];
}

export function DisplayPage() {
  const navigate = useNavigate();
  const { formatted } = useClock();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [areas, setAreas] = useState<AreaDisplay[]>([]);
  const [ultimoLlamado, setUltimoLlamado] = useState<{ turno: any; area: AreaDisplay } | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [error, setError] = useState('');
  const [wsEventos, setWsEventos] = useState(0);
  const pusherRef = useRef<Pusher | null>(null);

  const fetchData = () => {
    api.get('/display/todas').then(res => {
      const data = res.data.areas || [];
      setAreas(data);
      setUltimoLlamado(prev => {
        if (prev) return prev;
        const conActual = data.find((a: AreaDisplay) => a.actual);
        return conActual?.actual ? { turno: conActual.actual, area: conActual } : null;
      });
      setError('');
    }).catch((e) => {
      setError('Error al cargar datos');
    });
  };

  useEffect(() => {
    fetchData();
    api.get('/videos/playlist').then(res => {
      setVideos(res.data.data || res.data);
    }).catch(() => {});
  }, []);

  // WebSocket con Pusher.js directo
  useEffect(() => {
    if (areas.length === 0) return;

    const pusher = new Pusher(import.meta.env.VITE_REVERB_APP_KEY ?? 'digiturno-key', {
      wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
      wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8081),
      cluster: 'mt1',
      forceTLS: false,
      enabledTransports: ['ws'],
    });
    pusherRef.current = pusher;

    // ponytail: cualquier evento refresca el panel; el poll de 30s queda solo de respaldo
    const refrescar = () => fetchData();

    areas.forEach((area) => {
      const channel = pusher.subscribe(`area.${area.id}`);

      channel.bind('turno.llamado', (data: any) => {
        setWsEventos(e => e + 1);
        const turno = typeof data === 'string' ? JSON.parse(data) : data;
        if (!turno?.numero_turno) return;
        setUltimoLlamado({ turno, area: { ...area } });
        setAnimKey(k => k + 1);
        anunciarTurno({
          numero_turno: turno.numero_turno,
          nombre_paciente: turno.nombre_paciente,
          area_nombre: area.nombre,
        });
        refrescar();
      });

      channel.bind('turno.rellamado', (data: any) => {
        setWsEventos(e => e + 1);
        const turno = typeof data === 'string' ? JSON.parse(data) : data;
        if (!turno?.numero_turno) return;
        setUltimoLlamado({ turno, area: { ...area } });
        setAnimKey(k => k + 1);
        anunciarTurno({
          numero_turno: turno.numero_turno,
          nombre_paciente: turno.nombre_paciente,
          area_nombre: area.nombre,
        });
        refrescar();
      });

      channel.bind('turno.creado', () => { setWsEventos(e => e + 1); refrescar(); });
      channel.bind('turno.completado', () => { setWsEventos(e => e + 1); refrescar(); });
      channel.bind('turno.ausente', () => { setWsEventos(e => e + 1); refrescar(); });
    });

    return () => {
      areas.forEach(a => pusher.unsubscribe(`area.${a.id}`));
      pusher.disconnect();
    };
  }, [areas.length]);

  useEffect(() => {
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  const currentVideo = videos.length > 0 ? videos[currentVideoIdx] : null;

  useEffect(() => {
    if (videoRef.current && currentVideo) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideoIdx, currentVideo]);

  const handleVideoEnded = () => {
    setCurrentVideoIdx(prev => (prev + 1) % videos.length);
  };

  // Historial unificado
  const historialUnificado = areas
    .flatMap((a: AreaDisplay) => (a.historial || []).map((h: any) => ({ ...h, area: a })))
    .sort((a: any, b: any) => new Date(b.completado_en || b.created_at || 0).getTime() - new Date(a.completado_en || a.created_at || 0).getTime())
    .slice(0, 8);

  const hero = ultimoLlamado;
  const heroArea = hero?.area;
  const heroTurno = hero?.turno;

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between px-10 py-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <img src={Logo} className="w-24 h-24" style={{ width: '50px', height: '50px' }} />
          <div>
            <div className="font-display font-extrabold text-xl tracking-tight">CONSALUD LABORAL</div>
            <div className="text-[11px] text-muted-foreground tracking-widest uppercase mt-0.5">Sistema de Turnos</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 text-[11px] text-emerald-400 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />EN VIVO
          </div>
          <span className="font-mono text-[10px] text-foreground/20 bg-foreground/5 px-2 py-0.5 rounded">WS:{wsEventos}</span>
          {error && <span className="text-[10px] text-red-400">{error}</span>}
          <span className="font-mono text-xs text-foreground/40">{formatted}</span>
          <button onClick={() => navigate(-1)} className="w-[34px] h-[34px] rounded-lg border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground/70 transition-colors">
            <HugeiconsIcon icon={ChevronLeftIcon} className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col p-8">
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
            {heroTurno && heroArea ? (
              <div className="text-center" key={animKey}>
                <p className="font-mono text-xs tracking-[0.25em] uppercase mb-4" style={{ color: `${heroArea.color}cc` }}>{heroArea.nombre}</p>
                <div className="relative mb-6">
                  <div className="absolute inset-[-40px] rounded-full blur-[60px] opacity-30 pointer-events-none" style={{ background: heroArea.color }} />
                  <p className="font-display font-extrabold leading-none tracking-tight" style={{ fontSize: 'clamp(72px, 12vw, 140px)', color: heroArea.color, animation: 'numFlash 0.8s ease-out' }}>{heroTurno.numero_turno}</p>
                </div>
                <p className="text-[clamp(20px,2.5vw,32px)] font-medium opacity-90 tracking-tight mb-2" style={{ animation: 'fadeSlideIn 0.6s ease-out 0.2s both' }}>{heroTurno.nombre_paciente}</p>
                {heroTurno.examen_paciente?.tipo_examen?.nombre && (
                  <p className="text-[clamp(16px,2vw,22px)] font-medium opacity-60 mb-2" style={{ animation: 'fadeSlideIn 0.6s ease-out 0.3s both' }}>{heroTurno.examen_paciente.tipo_examen.nombre}</p>
                )}
                <div className="w-16 h-0.5 mx-auto my-3 rounded-full" style={{ background: heroArea.color }} />
                <p className="font-mono text-[clamp(13px,1.5vw,18px)] opacity-50 tracking-widest uppercase" style={{ animation: 'fadeSlideIn 0.6s ease-out 0.4s both' }}>Llamado {heroTurno.contador_llamados || 1}  {heroTurno.contador_llamados !== 1 ? 'veces' : 'vez'}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-display font-extrabold leading-none tracking-tight text-foreground/10" style={{ fontSize: 'clamp(72px, 12vw, 140px)' }}>— — —</p>
                <p className="text-[clamp(20px,2.5vw,32px)] font-medium text-foreground/30 mt-6">Esperando llamado...</p>
                {areas.length === 0 && !error && <p className="text-xs text-foreground/20 mt-2">Cargando datos...</p>}
                {areas.length === 0 && error && <p className="text-xs text-red-400 mt-2">{error}</p>}
              </div>
            )}
          </div>
{/* 
          {areas.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-6 shrink-0">
              {areas.map((a) => (
                <div key={a.id} className="rounded-xl border p-3 flex items-center gap-3 transition-all"
                  style={{ borderColor: a.actual ? `${a.color}44` : 'rgba(255,255,255,0.06)', background: a.actual ? `${a.color}0a` : 'rgba(255,255,255,0.02)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs font-mono shrink-0" style={{ background: a.color }}>{a.prefijo}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-foreground/50 truncate">{a.nombre}</p>
                    {a.actual ? <p className="font-mono text-sm font-bold" style={{ color: a.color }}>{a.actual.numero_turno}</p>
                    : <p className="font-mono text-[11px] text-foreground/30">{a.en_espera || 0} en espera</p>}
                  </div>
                </div>
              ))}
            </div>
          )} */}
        </div>

        {/* Panel video vertical: altura = área entre header y footer (sin h-screen) */}
        <div className="flex-1 min-h-0 flex flex-col bg-black border-l border-border">
          {currentVideo ? (
            <div className="relative flex-1 min-h-0">
              {/* marco 9:16 anclado a la altura disponible del panel */}
              <div className="absolute inset-0 flex items-center justify-center p-3">
                <div
                  className="rounded-2xl overflow-hidden shadow-2xl border border-foreground/10 bg-black"
                  style={{
                    height: '100%',
                    width: 'auto',
                    maxWidth: '100%',
                    aspectRatio: '9 / 16',
                  }}
                >
                  <video
                    ref={videoRef}
                    className="block h-full w-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    loop={videos.length === 1}
                    onEnded={handleVideoEnded}
                    onError={() => { setCurrentVideoIdx(prev => (prev + 1) % videos.length); }}
                  >
                    <source src={currentVideo.url} type={currentVideo.tipo_mime} />
                  </video>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-foreground/20">
              <div className="text-center">
                <div className="text-6xl mb-4">🎬</div>
                <p className="font-display font-bold text-xl text-foreground/30 mb-2">Sin videos</p>
                <p className="text-sm">Agrega videos desde el panel de administración</p>
              </div>
            </div>
          )}
          {videos.length > 0 && (
            <div className="flex justify-center gap-2 py-3 shrink-0 z-10">
              {videos.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setCurrentVideoIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentVideoIdx ? 'w-6' : ''}`}
                  style={{ background: i === currentVideoIdx ? '#044B84' : 'rgba(255,255,255,0.2)' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-border px-10 py-5 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="font-mono text-[11px] tracking-widest uppercase text-foreground/20 whitespace-nowrap mr-2">Últimos:</span>
        {historialUnificado.length > 0 ? (
          historialUnificado.map((h: any, i: number) => (
            <React.Fragment key={`${h.id}-${i}`}>
              {i > 0 && <span className="text-foreground/10 text-lg">·</span>}
              <span className="font-mono text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-2"
                style={{ background: `${h.area.color}10`, border: `1px solid ${h.area.color}20`, opacity: 1 - i * 0.1 }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: h.area.color }} />{h.numero_turno}
              </span>
            </React.Fragment>
          ))
        ) : (
          <span className="font-mono text-xs text-foreground/20">Sin historial</span>
        )}
      </footer>

      <style>{`
        @keyframes numFlash { 0% { opacity: 0; transform: scale(0.85) translateY(10px); } 40% { opacity: 1; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
