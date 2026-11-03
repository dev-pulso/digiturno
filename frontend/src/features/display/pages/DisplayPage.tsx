import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Video } from '@/lib/types';
import { useClock } from '@/hooks/use-clock';
import { anunciarTurno, playChime } from '@/lib/speech';
import echo from '@/lib/echo';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronLeftIcon, VolumeHighIcon, ExpandIcon, Minimize01Icon } from '@hugeicons/core-free-icons';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioHabilitado, setAudioHabilitado] = useState(false);

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
    }).catch(() => {
      setError('Error al cargar datos');
    });
  };

  useEffect(() => {
    fetchData();
    api.get('/videos/playlist').then(res => {
      setVideos(res.data.data || res.data);
    }).catch(() => {});
  }, []);

  // Suscripción única al canal global 'display' vía Echo
  useEffect(() => {
    const channel = echo.channel('display');

    const handleLlamado = (data: any) => {
      setWsEventos(e => e + 1);
      const turno = typeof data === 'string' ? JSON.parse(data) : data;
      if (!turno?.numero_turno) return;

      const areaInfo: AreaDisplay = turno.area || {
        id: turno.area_id,
        nombre: 'Consultorio',
        prefijo: 'C',
        color: '#044B84',
        codigo: 'C',
        actual: turno,
        en_espera: 0,
        historial: [],
      };

      setUltimoLlamado({ turno, area: areaInfo });
      setAnimKey(k => k + 1);

      // Actualizar estado de las áreas localmente
      setAreas(prev => prev.map(a => {
        if (a.id === turno.area_id) {
          return {
            ...a,
            actual: turno,
            en_espera: Math.max(0, (a.en_espera || 1) - 1),
          };
        }
        return a;
      }));

      anunciarTurno({
        numero_turno: turno.numero_turno,
        nombre_paciente: turno.nombre_paciente,
        area_nombre: areaInfo.nombre,
      });
    };

    const handleCompletado = (data: any) => {
      setWsEventos(e => e + 1);
      const turno = typeof data === 'string' ? JSON.parse(data) : data;
      if (!turno?.id) return;

      setAreas(prev => prev.map(a => {
        if (a.id === turno.area_id) {
          const actualCoincide = a.actual?.id === turno.id;
          const nuevoHistorial = [turno, ...(a.historial || [])].slice(0, 10);
          return {
            ...a,
            actual: actualCoincide ? null : a.actual,
            historial: nuevoHistorial,
          };
        }
        return a;
      }));
    };

    const handleCreado = (data: any) => {
      setWsEventos(e => e + 1);
      const turno = typeof data === 'string' ? JSON.parse(data) : data;
      if (!turno?.area_id) return;

      setAreas(prev => prev.map(a => {
        if (a.id === turno.area_id) {
          return {
            ...a,
            en_espera: (a.en_espera || 0) + 1,
          };
        }
        return a;
      }));
    };

    const handleAusente = (data: any) => {
      setWsEventos(e => e + 1);
      const turno = typeof data === 'string' ? JSON.parse(data) : data;
      if (!turno?.id) return;

      setAreas(prev => prev.map(a => {
        if (a.id === turno.area_id) {
          const actualCoincide = a.actual?.id === turno.id;
          return {
            ...a,
            actual: actualCoincide ? null : a.actual,
          };
        }
        return a;
      }));
    };

    channel
      .listen('.turno.llamado', handleLlamado)
      .listen('.turno.rellamado', handleLlamado)
      .listen('.turno.creado', handleCreado)
      .listen('.turno.completado', handleCompletado)
      .listen('.turno.ausente', handleAusente);

    return () => {
      echo.leaveChannel('display');
    };
  }, []);

  // Escuchar eventos de atenuación de audio del video durante los anuncios de voz
  useEffect(() => {
    const handleSpeechStart = () => {
      if (videoRef.current) {
        videoRef.current.volume = 0.08;
      }
    };

    const handleSpeechEnd = () => {
      if (videoRef.current) {
        videoRef.current.volume = audioHabilitado ? 0.75 : 0;
      }
    };

    window.addEventListener('digiturno:speech-start', handleSpeechStart);
    window.addEventListener('digiturno:speech-end', handleSpeechEnd);

    return () => {
      window.removeEventListener('digiturno:speech-start', handleSpeechStart);
      window.removeEventListener('digiturno:speech-end', handleSpeechEnd);
    };
  }, [audioHabilitado]);

  // Polling de respaldo cada 45s para resincronización general
  useEffect(() => {
    const id = setInterval(fetchData, 45000);
    return () => clearInterval(id);
  }, []);

  const currentVideo = videos.length > 0 ? videos[currentVideoIdx] : null;

  useEffect(() => {
    if (videoRef.current && currentVideo) {
      videoRef.current.load();
      videoRef.current.volume = audioHabilitado ? 0.75 : 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideoIdx, currentVideo, audioHabilitado]);

  const handleVideoEnded = () => {
    setCurrentVideoIdx(prev => (prev + 1) % videos.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const activarAudioYPantalla = () => {
    playChime();
    setAudioHabilitado(true);
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 0.75;
    }
    toggleFullscreen();
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
      <header className="flex items-center justify-between px-8 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <img src={Logo} className="w-10 h-10 object-contain" alt="Consalud Laboral" />
          <div>
            <div className="font-display font-extrabold text-lg tracking-tight">CONSALUD LABORAL</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Sistema de Turnos</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={activarAudioYPantalla}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-border bg-card hover:bg-muted transition-colors cursor-pointer text-foreground/80 hover:text-foreground"
            title="Activar audio y pantalla completa"
          >
            <HugeiconsIcon icon={VolumeHighIcon} className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Audio & Pantalla Completa</span>
            <HugeiconsIcon icon={isFullscreen ? Minimize01Icon : ExpandIcon} className="h-3.5 w-3.5 ml-1" />
          </button>

          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-0.5 text-[10px] text-emerald-400 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            EN VIVO
          </div>
          <span className="font-mono text-[10px] text-foreground/20 bg-foreground/5 px-2 py-0.5 rounded">WS:{wsEventos}</span>
          {error && <span className="text-[10px] text-red-400">{error}</span>}
          <span className="font-mono text-xs text-foreground/40">{formatted}</span>
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground/70 transition-colors"
          >
            <HugeiconsIcon icon={ChevronLeftIcon} className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Panel izquierdo: Llamado Hero y Grilla de Consultorios */}
        <div className="flex-1 min-h-0 flex flex-col p-6 overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
            {heroTurno && heroArea ? (
              <div className="text-center" key={animKey}>
                <p className="font-mono text-sm tracking-[0.25em] uppercase mb-2 font-bold" style={{ color: `${heroArea.color}` }}>
                  {heroArea.nombre}
                </p>
                <div className="relative mb-4">
                  <div className="absolute inset-[-40px] rounded-full blur-[60px] opacity-30 pointer-events-none" style={{ background: heroArea.color }} />
                  <p
                    className="font-display font-extrabold leading-none tracking-tight"
                    style={{ fontSize: 'clamp(64px, 10vw, 130px)', color: heroArea.color, animation: 'numFlash 0.8s ease-out' }}
                  >
                    {heroTurno.numero_turno}
                  </p>
                </div>
                <p
                  className="text-[clamp(20px,2.2vw,30px)] font-bold opacity-95 tracking-tight mb-2 text-foreground"
                  style={{ animation: 'fadeSlideIn 0.6s ease-out 0.2s both' }}
                >
                  {heroTurno.nombre_paciente}
                </p>
                {(() => {
                  const examenesTexto = heroTurno.examenes_nombres?.length
                    ? heroTurno.examenes_nombres.join(' + ')
                    : heroTurno.examen_paciente?.tipo_examen?.nombre;
                  return examenesTexto ? (
                    <p
                      className="text-[clamp(14px,1.6vw,20px)] font-medium opacity-70 mb-2 text-foreground"
                      style={{ animation: 'fadeSlideIn 0.6s ease-out 0.3s both' }}
                    >
                      {examenesTexto}
                    </p>
                  ) : null;
                })()}
                <div className="w-16 h-0.5 mx-auto my-2 rounded-full" style={{ background: heroArea.color }} />
                <p
                  className="font-mono text-[clamp(12px,1.2vw,16px)] opacity-50 tracking-widest uppercase"
                  style={{ animation: 'fadeSlideIn 0.6s ease-out 0.4s both' }}
                >
                  Llamado {heroTurno.contador_llamados || 1} {heroTurno.contador_llamados !== 1 ? 'veces' : 'vez'}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-display font-extrabold leading-none tracking-tight text-foreground/10" style={{ fontSize: 'clamp(64px, 10vw, 130px)' }}>
                  — — —
                </p>
                <p className="text-[clamp(18px,2vw,28px)] font-medium text-foreground/30 mt-4">Esperando llamado...</p>
                {areas.length === 0 && !error && <p className="text-xs text-foreground/20 mt-2">Cargando datos...</p>}
                {areas.length === 0 && error && <p className="text-xs text-red-400 mt-2">{error}</p>}
              </div>
            )}
          </div>

          {/* Grilla compacta habilitada de consultorios */}
          {areas.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-4 shrink-0">
              {areas.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border p-2.5 flex items-center gap-2.5 transition-all shadow-sm"
                  style={{
                    borderColor: a.actual ? `${a.color}80` : 'rgba(255,255,255,0.08)',
                    background: a.actual ? `${a.color}15` : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs font-mono shrink-0 shadow-sm"
                    style={{ background: a.color }}
                  >
                    {a.prefijo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-foreground/60 truncate font-medium">{a.nombre}</p>
                    {a.actual ? (
                      <p className="font-mono text-sm font-bold tracking-tight" style={{ color: a.color }}>
                        {a.actual.numero_turno}
                      </p>
                    ) : (
                      <p className="font-mono text-[11px] text-foreground/40">{a.en_espera || 0} en espera</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel video vertical (9:16) */}
        <div className="flex-1 min-h-0 flex flex-col bg-black border-l border-border">
          {currentVideo ? (
            <div className="relative flex-1 min-h-0">
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
                    muted={!audioHabilitado}
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
            <div className="flex justify-center gap-2 py-2.5 shrink-0 z-10">
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

      {/* Footer: Últimos llamados enriquecidos con Turno, Paciente y Prefijo */}
      <footer className="border-t border-border px-8 py-3.5 flex items-center gap-2.5 overflow-x-auto shrink-0 bg-card/50">
        <span className="font-mono text-[11px] tracking-widest uppercase text-foreground/40 whitespace-nowrap mr-2 font-bold">
          Últimos llamados:
        </span>
        {historialUnificado.length > 0 ? (
          historialUnificado.map((h: any, i: number) => (
            <React.Fragment key={`${h.id}-${i}`}>
              {i > 0 && <span className="text-foreground/20 text-sm font-bold">·</span>}
              <span
                className="font-mono text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-2 shadow-xs"
                style={{
                  background: `${h.area.color}18`,
                  border: `1px solid ${h.area.color}40`,
                  opacity: Math.max(0.4, 1 - i * 0.08),
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: h.area.color }} />
                <span className="font-bold text-foreground">{h.numero_turno}</span>
                <span className="opacity-75 text-[11px] truncate max-w-[140px] text-foreground font-sans">
                  {h.nombre_paciente}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold"
                  style={{ background: `${h.area.color}30`, color: h.area.color }}
                >
                  {h.area.prefijo}
                </span>
              </span>
            </React.Fragment>
          ))
        ) : (
          <span className="font-mono text-xs text-foreground/25">Sin llamados recientes</span>
        )}
      </footer>

      <style>{`
        @keyframes numFlash { 0% { opacity: 0; transform: scale(0.85) translateY(10px); } 40% { opacity: 1; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
