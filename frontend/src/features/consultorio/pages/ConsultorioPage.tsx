import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Area, Turno } from '@/lib/types';
import { useConsultorio } from '@/hooks/use-consultorio';
import { useWebSocket } from '@/hooks/use-websocket';
import { useClock } from '@/hooks/use-clock';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronLeftIcon, TelephoneIcon, CheckIcon, Cancel01Icon, Refresh01Icon, AlignBoxMiddleCenterIcon } from '@hugeicons/core-free-icons';

export function ConsultorioPage() {
  const { areaId: paramAreaId } = useParams();
  const navigate = useNavigate();
  const { formatted } = useClock();
  const [area, setArea] = useState<Area | null>(null);
  const [areaId, setAreaId] = useState<number | null>(null);

  const { cola, actual, historial, fetchCola, fetchHistorial, llamarSiguiente, completarTurno, ausenteTurno, rellamarTurno } = useConsultorio(areaId);

  useEffect(() => {
    api.get('/areas').then((res) => {
      const areas: Area[] = res.data.data || res.data;
      if (paramAreaId) {
        const found = areas.find(a => a.codigo === paramAreaId || a.id === parseInt(paramAreaId));
        if (found) {
          setArea(found);
          setAreaId(found.id);
        } else if (areas.length > 0) {
          setArea(areas[0]);
          setAreaId(areas[0].id);
        }
      } else if (areas.length > 0) {
        setArea(areas[0]);
        setAreaId(areas[0].id);
      }
    }).catch(() => {});
  }, [paramAreaId]);

  useEffect(() => {
    if (areaId) { fetchCola(); fetchHistorial(); }
  }, [areaId]);

  useWebSocket(areaId, {
    'turno.creado': () => { fetchCola(); },
    'turno.llamado': () => { fetchCola(); },
    'turno.completado': () => { fetchCola(); fetchHistorial(); },
    'turno.ausente': () => { fetchCola(); fetchHistorial(); },
    'turno.rellamado': () => { fetchCola(); },
  });

  const handleLlamarSiguiente = async () => {
    try {
      const t = await llamarSiguiente();
      toast.success(`📣 Llamando ${t.numero_turno}`);
    } catch { toast.error('Error al llamar'); }
  };

  const handleCompletar = async (turnoId: number) => {
    try {
      await completarTurno(turnoId);
      toast.success('Turno completado');
    } catch { toast.error('Error'); }
  };

  const handleAusente = async (turnoId: number) => {
    try {
      await ausenteTurno(turnoId);
      toast.warning('Paciente movido al final de la cola');
    } catch { toast.error('Error'); }
  };

  const handleRellamar = async (turnoId: number) => {
    try {
      await rellamarTurno(turnoId);
      toast.success('Re-llamando');
    } catch { toast.error('Error'); }
  };

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  if (!area) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-text-dim">
        <div className="text-center"><div className="text-4xl mb-3">🏥</div><p className="text-lg font-display font-bold text-text-mid">Cargando consultorio...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">
      <header className="flex items-center justify-between px-7 py-4 bg-surface border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/recepcion')} className="h-9 w-9 text-text-dim hover:text-text"><HugeiconsIcon icon={ChevronLeftIcon} className="h-4 w-4" /></Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm font-mono" style={{ background: area.color }}>{area.prefijo}</div>
            <div>
              <h1 className="font-display font-bold text-base">{area.nombre}</h1>
              <p className="text-xs text-text-dim">{cola.length} en espera · {historial.length} atendidos hoy</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 text-[11px] text-emerald-400 font-mono"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />EN VIVO</div>
          <span className="font-mono text-xs text-text-mid">{formatted}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Cola de espera */}
        <div className="flex-1 p-6 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[10px] tracking-widest uppercase text-text-dim">Cola de Espera</p>
            <div className="flex gap-3 items-center">
              <Button size="sm" onClick={handleLlamarSiguiente} disabled={cola.length === 0} className="bg-gradient-to-r from-primary-700 to-indigo-600 text-white text-xs font-semibold">
                <HugeiconsIcon icon={TelephoneIcon} className="h-3.5 w-3.5 mr-1" /> Llamar Siguiente
              </Button>
            </div>
          </div>

          {cola.length === 0 && !actual ? (
            <Card className="p-16 bg-surface border-border text-center">
              <div className="text-5xl mb-4 opacity-30"><HugeiconsIcon icon={AlignBoxMiddleCenterIcon} className="h-6 w-6" /></div>
              <h3 className="font-display font-bold text-lg text-text-mid mb-2">Cola vacía</h3>
              <p className="text-sm text-text-dim">No hay pacientes en espera para {area.nombre}</p>
            </Card>
          ) : (
            cola.map((turno, i) => (
              <Card key={turno.id} className="p-3.5 bg-surface border-border flex items-center gap-3 hover:border-white/10 transition-colors">
                <span className="font-mono text-[11px] text-text-dim w-6">{i + 1}</span>
                <div className="font-mono font-medium text-base min-w-[80px]" style={{ color: area.color }}>{turno.numero_turno}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{turno.nombre_paciente}</p>
                  {turno.examen_paciente?.tipo_examen?.nombre && <p className="text-[11px] text-primary-400">{turno.examen_paciente.tipo_examen.nombre}</p>}
                  <p className="text-[10px] text-text-dim mt-0.5">{fmtTime(turno.created_at)}</p>
                </div>
                {turno.contador_llamados > 0 && <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/20">{turno.contador_llamados} llam.</Badge>}
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-primary-700/30 text-primary-400 hover:bg-primary-700/20" onClick={() => handleLlamarSiguiente()}><HugeiconsIcon icon={TelephoneIcon} className="h-3 w-3 mr-1" /> Llamar</Button>
              </Card>
            ))
          )}
        </div>

        {/* Turno actual */}
        <aside className="w-[380px] border-l border-border p-6 flex flex-col gap-5 bg-surface overflow-y-auto shrink-0">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-text-dim mb-3">Turno en Atención</p>
            {actual ? (
              <Card className="p-6 bg-surface border-border text-center" style={{ borderColor: `${area.color}44` }}>
                <p className="font-display font-extrabold text-6xl leading-none mb-3" style={{ color: area.color }}>{actual.numero_turno}</p>
                <p className="text-lg font-semibold mb-1">{actual.nombre_paciente}</p>
                {actual.examen_paciente?.tipo_examen?.nombre && <p className="text-sm text-primary-400 font-medium mb-2">{actual.examen_paciente.tipo_examen.nombre}</p>}
                <Badge className="mb-4 text-xs" style={{ background: `${area.color}20`, color: area.color, border: 'none' }}>
                  Llamado {actual.contador_llamados} vez{actual.contador_llamados !== 1 ? 'es' : ''}
                </Badge>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button size="sm" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25" onClick={() => handleCompletar(actual.id)}><HugeiconsIcon icon={CheckIcon} className="h-3.5 w-3.5 mr-1" /> Atendido</Button>
                  <Button size="sm" className="bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25" onClick={() => handleAusente(actual.id)}><HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5 mr-1" /> Ausente</Button>
                  <Button size="sm" className="bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25" onClick={() => handleRellamar(actual.id)}><HugeiconsIcon icon={Refresh01Icon} className="h-3.5 w-3.5 mr-1" /> Re-llamar</Button>
                </div>
              </Card>
            ) : (
              <Card className="p-10 bg-surface border-border text-center"><div className="text-3xl mb-3 opacity-30">⏳</div><p className="text-sm text-text-dim">Sin turno en atención</p><p className="text-xs text-text-dim mt-1">Llama el siguiente paciente</p></Card>
            )}
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-text-dim mb-2">Últimos Atendidos</p>
            <div className="flex gap-2 flex-wrap">
              {historial.length > 0 ? historial.slice(0, 8).map((h, i) => (
                <span key={h.id} className="font-mono text-xs bg-surface border border-border rounded-md px-2.5 py-1.5 text-text-dim" style={{ opacity: 1 - i * 0.1 }}>{h.numero_turno}<span className="ml-1 text-text-dim/50">{h.nombre_paciente.split(' ')[0]}</span></span>
              )) : <span className="text-xs text-text-dim">Sin historial</span>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
