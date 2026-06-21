import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAreas } from '@/hooks/use-areas';
import { useTurnos } from '@/hooks/use-turnos';
import { usePacientes } from '@/hooks/use-pacientes';
import { useTiposExamenes } from '@/hooks/use-tipos-examenes';
import { Area, Turno, TipoExamen } from '@/lib/types';
import { useClock } from '@/hooks/use-clock';
import { useWebSocket } from '@/hooks/use-websocket';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronLeftIcon, MonitorDotIcon, PlusSignIcon, TelephoneIcon, CheckIcon, Cancel01Icon, Refresh01Icon, ChartAverageIcon, Search01Icon, ClockIcon, AlignBoxMiddleLeftIcon, CheckmarkBadge01Icon } from '@hugeicons/core-free-icons';

export function ReceptionPage() {
  const navigate = useNavigate();
  const { areas, refetch: refetchAreas } = useAreas();
  const { formatted } = useClock();
  const { tiposExamenes } = useTiposExamenes();
  const { paciente, buscando, asignando, buscarPorDocumento, asignarExamenes, setPaciente } = usePacientes();

  const [activeAreaId, setActiveAreaId] = useState<number | null>(null);
  const [activeArea, setActiveArea] = useState<Area | null>(null);
  const [docSearch, setDocSearch] = useState('');
  const [examenesSeleccionados, setExamenesSeleccionados] = useState<number[]>([]);

  const [manualCallNum, setManualCallNum] = useState('');

  const { cola, display, crearTurno, llamarTurno, completarTurno, ausenteTurno, rellamarTurno, fetchCola, fetchDisplay } = useTurnos(activeAreaId);

  useWebSocket(activeAreaId, {
    'turno.creado': () => { fetchCola(); refetchAreas(); },
    'turno.llamado': () => { fetchCola(); fetchDisplay(); },
    'turno.completado': () => { fetchCola(); fetchDisplay(); refetchAreas(); },
    'turno.ausente': () => { fetchCola(); fetchDisplay(); refetchAreas(); },
    'turno.rellamado': () => { fetchCola(); fetchDisplay(); },
  });

  useEffect(() => {
    if (areas.length > 0 && !activeAreaId) {
      setActiveAreaId(areas[0].id);
      setActiveArea(areas[0]);
    }
  }, [areas, activeAreaId]);

  useEffect(() => { if (activeAreaId) { fetchCola(); fetchDisplay(); } }, [activeAreaId, fetchCola, fetchDisplay]);

  const switchArea = useCallback((area: Area) => {
    setActiveAreaId(area.id);
    setActiveArea(area);
  }, []);

  const toggleExamen = (id: number) => {
    setExamenesSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBuscarPaciente = async () => {
    if (!docSearch.trim()) { toast.error('Ingresa un número de documento'); return; }
    await buscarPorDocumento(docSearch.trim());
  };

  const handleAsignarExamenes = async () => {
    if (!paciente) { toast.error('Primero busca un paciente'); return; }
    if (examenesSeleccionados.length === 0) { toast.error('Selecciona al menos un examen'); return; }
    const result = await asignarExamenes(paciente.id, examenesSeleccionados);
    if (result) {
      setExamenesSeleccionados([]);
      fetchCola();
      refetchAreas();
    }
  };

  const handleLlamar = async (turnoId: number) => {
    try {
      const t = await llamarTurno(turnoId);
      toast.success(`📣 Llamando ${t.numero_turno}`);
    } catch { toast.error('Error al llamar'); }
  };

  const handleManualCall = async () => {
    const num = manualCallNum.trim().toUpperCase();
    if (!num) { toast.error('Ingresa un número'); return; }
    try {
      const res = await api.get('/turnos', { params: { hoy: true, per_page: 100 } });
      const turns: Turno[] = res.data.data || res.data;
      const found = turns.find(t => t.numero_turno === num);
      if (!found) { toast.error(`No se encontró ${num}`); return; }
      if (found.estado === 'completado') { toast.error('Ya fue completado'); return; }
      await handleLlamar(found.id);
      setManualCallNum('');
    } catch { toast.error('Error'); }
  };

  const handleCompletar = async (turnoId: number) => {
    try { await completarTurno(turnoId); toast.success('Turno completado'); } catch { toast.error('Error'); }
  };

  const handleAusente = async (turnoId: number) => {
    try { await ausenteTurno(turnoId); toast.warning('Marcado como ausente'); } catch { toast.error('Error'); }
  };

  const handleRellamar = async (turnoId: number) => {
    try { await rellamarTurno(turnoId); toast.success('Re-llamando'); } catch { toast.error('Error'); }
  };

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const enEspera = cola.filter(t => t.estado === 'en_espera' || t.estado === 'llamando');

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">
      <header className="flex items-center justify-between px-7 py-4 bg-surface border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9 text-text-dim hover:text-text"><HugeiconsIcon icon={ChevronLeftIcon} className="h-4 w-4" /></Button>
          <div><h1 className="font-display font-bold text-base">Panel de Recepción</h1><p className="text-xs text-text-dim">Gestión de turnos y colas</p></div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 text-[11px] text-emerald-400 font-mono"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />EN VIVO</div>
          <span className="font-mono text-xs text-text-mid">{formatted}</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/display')} className="text-xs text-text-dim"><HugeiconsIcon icon={MonitorDotIcon} className="h-3.5 w-3.5 mr-1" /> Pantallas</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — Paciente */}
        <aside className="w-80 border-r border-border p-5 flex flex-col gap-5 overflow-y-auto bg-surface shrink-0">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-text-dim mb-3">Buscar Paciente</p>
            <div className="flex gap-2">
              <Input value={docSearch} onChange={(e) => setDocSearch(e.target.value)} placeholder="Número de cédula" className="bg-[#080c14] border-border text-text text-xs flex-1" onKeyDown={(e) => e.key === 'Enter' && handleBuscarPaciente()} />
              <Button size="sm" onClick={handleBuscarPaciente} disabled={buscando} className="h-9 bg-primary-700 hover:bg-primary-600"><HugeiconsIcon icon={Search01Icon} className="h-3.5 w-3.5" /></Button>
            </div>

            {paciente && (
              <Card className="mt-3 p-3 bg-[#080c14] border-border">
                <p className="font-semibold text-sm">{paciente.nombre_completo}</p>
                <p className="text-[11px] text-text-dim font-mono">{paciente.tipo_documento} {paciente.numero_documento}</p>
                <p className="text-[11px] text-text-mid mt-1">{paciente.telefono || 'Sin teléfono'}</p>
              </Card>
            )}
          </div>

          {paciente && (
            <>
              <Separator className="bg-border" />
              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-text-dim mb-3">Asignar Exámenes</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {tiposExamenes.filter(t => t.activo).map((t) => (
                    <label key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface2 cursor-pointer border border-transparent hover:border-border transition-colors">
                      <input type="checkbox" checked={examenesSeleccionados.includes(t.id)} onChange={() => toggleExamen(t.id)} className="rounded accent-primary-700" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{t.nombre}</p>
                        <p className="text-[10px] text-text-dim">{t.area?.prefijo} – {t.area?.nombre}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <Button className="w-full mt-3 bg-gradient-to-r from-primary-700 to-indigo-600 text-white text-xs font-semibold" onClick={handleAsignarExamenes} disabled={asignando || examenesSeleccionados.length === 0}>
                  <HugeiconsIcon icon={PlusSignIcon} className="h-3.5 w-3.5 mr-1" />{asignando ? 'Asignando...' : 'Asignar Exámenes'}
                </Button>
              </div>
            </>
          )}

          <Separator className="bg-border" />

          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-text-dim mb-3">Acciones</p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/display')} className="border-border text-text-dim justify-start text-xs"><HugeiconsIcon icon={MonitorDotIcon} className="h-3.5 w-3.5 mr-2" /> Ver Pantallas</Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="border-border text-text-dim justify-start text-xs"><HugeiconsIcon icon={ChartAverageIcon} className="h-3.5 w-3.5 mr-2" /> Dashboard</Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/areas')} className="border-border text-text-dim justify-start text-xs"><HugeiconsIcon icon={MonitorDotIcon} className="h-3.5 w-3.5 mr-2" /> Admin Áreas</Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/examenes')} className="border-border text-text-dim justify-start text-xs"><HugeiconsIcon icon={MonitorDotIcon} className="h-3.5 w-3.5 mr-2" /> Admin Exámenes</Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/videos')} className="border-border text-text-dim justify-start text-xs"><HugeiconsIcon icon={MonitorDotIcon} className="h-3.5 w-3.5 mr-2" /> Admin Videos</Button>
            </div>
          </div>
        </aside>

        {/* Área tabs + cola */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-1 px-5 py-3 border-b border-border overflow-x-auto bg-surface2 shrink-0">
            {areas.map((area) => {
              const isActive = area.id === activeAreaId;
              return (
                <button key={area.id} onClick={() => switchArea(area)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all ${isActive ? 'text-white border-white/20 font-semibold' : 'text-text-dim border-transparent hover:bg-surface hover:text-text'}`}
                  style={isActive ? { background: `${area.color}22`, borderColor: `${area.color}55`, color: area.color } : {}}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: area.color }} />{area.prefijo}
                  {area.turnos_espera > 0 && <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 min-w-[22px] text-center">{area.turnos_espera}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 p-5 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between mb-1"><p className="font-mono text-[10px] tracking-widest uppercase text-text-dim">Turnos en Espera</p><span className="font-mono text-[11px] bg-surface2 border border-border rounded-md px-2 py-0.5 text-text-mid">{enEspera.length} turno{enEspera.length !== 1 ? 's' : ''}</span></div>
              {enEspera.length === 0 ? (
                <div className="text-center py-16 text-text-dim"><div className="text-3xl mb-3 opacity-40 flex justify-center"><HugeiconsIcon icon={CheckmarkBadge01Icon} className="h-6 w-6" /></div><p className="font-display font-bold text-text-mid mb-1">Cola vacía</p><p className="text-xs">No hay turnos en espera{activeArea ? ` para ${activeArea.nombre}` : ''}</p></div>
              ) : (
                enEspera.map((turno) => {
                  const isCalling = turno.estado === 'llamando';
                  return (
                    <Card key={turno.id} className={`p-3.5 bg-surface border-border flex items-center gap-3 transition-all hover:border-white/15 ${isCalling ? 'animate-pulse' : ''}`} style={isCalling ? { borderColor: `${activeArea?.color}55` } : {}}>
                      <div className="w-1 h-full rounded-full shrink-0 self-stretch" style={{ background: activeArea?.color }} />
                      <div className="font-mono font-medium text-base min-w-[70px]" style={{ color: activeArea?.color }}>{turno.numero_turno}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{turno.nombre_paciente}</p>
                        {turno.examen_paciente?.tipo_examen?.nombre && <p className="font-mono text-[10px] text-primary-400 mt-0.5">{turno.examen_paciente.tipo_examen.nombre}</p>}
                        <p className="font-mono text-[11px] text-text-dim mt-0.5">{fmtTime(turno.created_at)}{isCalling && ` · ${turno.contador_llamados} llamados`}</p>
                      </div>
                      {isCalling && <Badge className="text-[10px] font-semibold" style={{ background: `${activeArea?.color}22`, color: activeArea?.color, border: 'none' }}>Llamando</Badge>}
                      <div className="flex gap-1.5 shrink-0">
                        {!isCalling ? (
                          <Button size="sm" variant="outline" className="h-7 text-[11px] border-primary-700/30 text-primary-400 hover:bg-primary-700/20" onClick={() => handleLlamar(turno.id)}><HugeiconsIcon icon={TelephoneIcon} className="h-3 w-3 mr-1" /> Llamar</Button>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleRellamar(turno.id)}><HugeiconsIcon icon={Refresh01Icon} className="h-3 w-3 mr-1" /> Re-llamar</Button>
                            <Button size="sm" className="h-7 text-[11px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25" onClick={() => handleCompletar(turno.id)}><HugeiconsIcon icon={CheckIcon} className="h-3 w-3 mr-1" /> Atendido</Button>
                            <Button size="sm" className="h-7 text-[11px] bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25" onClick={() => handleAusente(turno.id)}><HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3 mr-1" /> Ausente</Button>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            <aside className="w-[360px] border-l border-border p-5 flex flex-col gap-4 bg-surface2 overflow-y-auto shrink-0">
              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-text-dim mb-3">Turno Actual</p>
                <Card className="p-7 bg-surface border-border text-center relative overflow-hidden" style={{ borderColor: activeArea ? `${activeArea.color}33` : '' }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${activeArea?.color}, transparent)` }} />
                  <p className="font-mono text-[10px] tracking-widest uppercase text-text-dim mb-5">Turno Actual · {activeArea?.prefijo}</p>
                  {display?.actual ? (
                    <>
                      <p className="font-display font-extrabold text-5xl leading-none mb-3 animate-pulse" style={{ color: activeArea?.color }}>{display.actual!.numero_turno}</p>
                      <p className="text-base font-medium mb-1">{display.actual!.nombre_paciente}</p>
                      {display.actual!.examen_paciente?.tipo_examen?.nombre && <p className="text-xs text-primary-400 mb-1 font-medium">{display.actual!.examen_paciente!.tipo_examen!.nombre}</p>}
                      <p className="font-mono text-xs text-text-dim mb-1">Llamados: {display.actual!.contador_llamados}</p>
                      <p className="font-mono text-xs text-text-dim mb-5">Llamados: {display.actual!.contador_llamados}</p>
                      <div className="flex gap-2 justify-center flex-wrap">
                        <Button size="sm" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 h-8 text-xs" onClick={() => handleCompletar(display.actual!.id)}><HugeiconsIcon icon={CheckIcon} className="h-3.5 w-3.5 mr-1" /> Atendido</Button>
                        <Button size="sm" className="bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25 h-8 text-xs" onClick={() => handleAusente(display.actual!.id)}><HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5 mr-1" /> Ausente</Button>
                        <Button size="sm" className="bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25 h-8 text-xs" onClick={() => handleRellamar(display.actual!.id)}><HugeiconsIcon icon={Refresh01Icon} className="h-3.5 w-3.5 mr-1" /> Re-llamar</Button>
                      </div>
                    </>
                  ) : (
                    <div className="py-6"><div className="text-2xl mb-2 opacity-30 flex justify-center"><HugeiconsIcon icon={ClockIcon} className="h-6 w-6 text-text-dim " /></div><p className="text-xs text-text-dim">Sin turno activo</p><p className="text-[11px] text-text-dim mt-1">Llama el siguiente turno</p></div>
                  )}
                </Card>
              </div>

              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-text-dim mb-2">Últimos Llamados</p>
                <div className="flex gap-2 flex-wrap">
                  {display?.historial && display.historial.length > 0 ? display.historial.slice(0, 5).map((h, i) => <span key={h.id} className="font-mono text-[11px] bg-surface border border-border rounded-md px-2.5 py-1 text-text-dim" style={{ opacity: 1 - i * 0.15 }}>{h.numero_turno}</span>)
                  : <span className="text-xs text-text-dim">Sin historial</span>}
                </div>
              </div>

              <Separator className="bg-border" />

              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-text-dim mb-2">Llamar por Número</p>
                <div className="flex gap-2">
                  <Input value={manualCallNum} onChange={(e) => setManualCallNum(e.target.value)} placeholder="Ej: C1-001" className="bg-[#080c14] border-border text-xs font-mono flex-1" onKeyDown={(e) => e.key === 'Enter' && handleManualCall()} />
                  <Button size="sm" className="bg-primary-700/20 text-primary-400 border-primary-700/30 hover:bg-primary-700/30 h-9" onClick={handleManualCall}><HugeiconsIcon icon={TelephoneIcon} className="h-3.5 w-3.5 mr-1" /> Llamar</Button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
