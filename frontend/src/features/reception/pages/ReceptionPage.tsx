import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAreas } from "@/hooks/use-areas";
import { useTurnos } from "@/hooks/use-turnos";
import { usePacientes } from "@/hooks/use-pacientes";
import { Area, Turno, TipoExamen } from "@/lib/types";
import { useClock } from "@/hooks/use-clock";
import { useWebSocket } from "@/hooks/use-websocket";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSpeech } from "@/hooks/use-speech";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loader2 } from "lucide-react";
import {
  ChevronLeftIcon,
  MonitorDotIcon,
  PlusSignIcon,
  TelephoneIcon,
  CheckIcon,
  Cancel01Icon,
  Refresh01Icon,
  ChartAverageIcon,
  Search01Icon,  
  CheckmarkBadge01Icon,  
  LockedFreeIcons,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ReceptionPage() {
  const navigate = useNavigate();
  const { areas, refetch: refetchAreas } = useAreas();
  const { formatted } = useClock();
  const {
    paciente,
    ingreso,
    historiaStatus,
    buscando,
    asignando,
    buscarPorDocumento,
    asignarExamenesConsalud,
    setPaciente,
  } = usePacientes();
  const [showIngresoModal, setShowIngresoModal] = useState(false);

  const [activeAreaId, setActiveAreaId] = useState<number | null>(null);
  const [activeArea, setActiveArea] = useState<Area | null>(null);
  const [docSearch, setDocSearch] = useState("");
  const [examenesConsaludSeleccionados, setExamenesConsaludSeleccionados] = useState<number[]>([]);

  const [manualCallNum, setManualCallNum] = useState("");

  const {
    cola,
    display,
    crearTurno,
    llamarTurno,
    completarTurno,
    ausenteTurno,
    rellamarTurno,
    fetchCola,
    fetchDisplay,
  } = useTurnos(activeAreaId);
  const { anunciar } = useSpeech();

  useWebSocket(activeAreaId, {
    "turno.creado": () => {
      fetchCola();
      refetchAreas();
    },
    "turno.llamado": () => {
      fetchCola();
      fetchDisplay();
    },
    "turno.completado": () => {
      fetchCola();
      fetchDisplay();
      refetchAreas();
    },
    "turno.ausente": () => {
      fetchCola();
      fetchDisplay();
      refetchAreas();
    },
    "turno.rellamado": () => {
      fetchCola();
      fetchDisplay();
    },
  });

  useEffect(() => {
    if (areas.length > 0 && !activeAreaId) {
      setActiveAreaId(areas[0].id);
      setActiveArea(areas[0]);
    }
  }, [areas, activeAreaId]);

  useEffect(() => {
    if (activeAreaId) {
      fetchCola();
      fetchDisplay();
    }
  }, [activeAreaId, fetchCola, fetchDisplay]);

  const switchArea = useCallback((area: Area) => {
    setActiveAreaId(area.id);
    setActiveArea(area);
  }, []);

  const toggleExamenConsalud = (examenIngresoId: number) => {
    setExamenesConsaludSeleccionados((prev) =>
      prev.includes(examenIngresoId)
        ? prev.filter((id) => id !== examenIngresoId)
        : [...prev, examenIngresoId],
    );
  };

  const handleBuscarPaciente = async () => {
    if (buscando) return;
    if (!docSearch.trim()) {
      toast.error("Ingresa un número de documento");
      return;
    }
    const pacienteEncontrado = await buscarPorDocumento(docSearch.trim());
    if (!pacienteEncontrado) return;
    setExamenesConsaludSeleccionados([]);
    setShowIngresoModal(true);
  };

  const handleAsignarTurnosConsalud = async () => {
    if (!paciente || !ingreso) return;
    if (examenesConsaludSeleccionados.length === 0) {
      toast.error("Selecciona al menos un examen pendiente");
      return;
    }
    const selectedItems = examenesConsaludSeleccionados.map((id) => {
      const ex = ingreso.examenes.find((e: any) => e.id === id);
      return {
        examen_ingreso_id: id,
        categoria_exam_id: ex?.examen?.categoria_exam_id ?? 0,
      };
    });
    const result = await asignarExamenesConsalud(
      paciente.id,
      ingreso.id,
      ingreso,
      selectedItems,
    );
    if (result) {
      setExamenesConsaludSeleccionados([]);
      setShowIngresoModal(false);
      await buscarPorDocumento(docSearch.trim());
      fetchCola();
      refetchAreas();
    }
  };

  const handleLlamar = async (turnoId: number) => {
    try {
      const t = await llamarTurno(turnoId);
      toast.success(`📣 Llamando ${t.numero_turno}`);
      anunciar({
        nombre_paciente: t.nombre_paciente,
        area_nombre: activeArea?.nombre,
      });
    } catch (error: any) {
      const mensaje = error?.response?.data?.errors?.paciente?.[0]
        || error?.response?.data?.message
        || "Error al llamar";
      toast.error(mensaje);
    }
  };

  const handleManualCall = async () => {
    const num = manualCallNum.trim().toUpperCase();
    if (!num) {
      toast.error("Ingresa un número");
      return;
    }
    try {
      const res = await api.get("/turnos", {
        params: { hoy: true, per_page: 100 },
      });
      const turns: Turno[] = res.data.data || res.data;
      const found = turns.find((t) => t.numero_turno === num);
      if (!found) {
        toast.error(`No se encontró ${num}`);
        return;
      }
      if (found.estado === "completado") {
        toast.error("Ya fue completado");
        return;
      }
      await handleLlamar(found.id);
      setManualCallNum("");
    } catch (error: any) {
      const mensaje = error?.response?.data?.errors?.paciente?.[0]
        || error?.response?.data?.message
        || "Error";
      toast.error(mensaje);
    }
  };

  const handleCompletar = async (turnoId: number) => {
    try {
      await completarTurno(turnoId);
      toast.success("Turno completado");
    } catch {
      toast.error("Error");
    }
  };

  const handleAusente = async (turnoId: number) => {
    try {
      await ausenteTurno(turnoId);
      toast.warning("Marcado como ausente");
    } catch {
      toast.error("Error");
    }
  };

  const handleRellamar = async (turnoId: number) => {
    try {
      const t = await rellamarTurno(turnoId);
      toast.success("Re-llamando");
      anunciar({
        nombre_paciente: t.nombre_paciente,
        area_nombre: activeArea?.nombre,
      });
    } catch {
      toast.error("Error");
    }
  };

  const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const turnosOrdenados = cola
    .filter((t) => t.estado === "en_espera" || t.estado === "llamando")
    .sort((a, b) => {
      if (a.estado === "llamando" && b.estado !== "llamando") return -1;
      if (a.estado !== "llamando" && b.estado === "llamando") return 1;
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  const soloEnEspera = turnosOrdenados.filter((t) => t.estado === "en_espera");

  const CATEGORIA_AREA_CODES: Record<number, string> = {
    1: 'c1', 2: 'tm', 3: 'c2', 4: 'c3', 5: 'c1', 6: 'c1',
    7: 'tm', 8: 'tm', 9: 'tm', 10: 'tm', 11: 'tm', 12: 'tm',
    13: 'c4', 15: 'c2',
  };

  const getAreaPorCategoria = (categoriaExamId?: number) =>
    categoriaExamId ? areas.find((a) => a.codigo === CATEGORIA_AREA_CODES[categoriaExamId]) : undefined;

  const isExamenCerrado = (
    ingresoId: number,
    _examenId: number,
    categoriaExamId: number,
  ): boolean => {
    const status = historiaStatus;

    if (!status) return false;
    switch (categoriaExamId) {
      case 1:
        return !!status.historia_clinica_cerrada;
      case 2:
        return !!status.laboratorio_cerrado;
      case 3:
        return !!status.visiometria_cerrada;
      case 4:
        return !!status.audiometria_cerrada;
      case 5:
        return !!status.espirometria_cerrada;
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
        return !!status.radiografia_cerrada;
      case 15:
        return !!status.optometria_cerrada;
      case 13:
        return !!status.prueba_psicosensometrica_cerrada;
      default:
        return false;
    }
  };
  const isExamenCompleto = (
    ingresoId: number,
    categoriaExamId: number,
    examenId: number,
  ) => {
    if (!historiaStatus) return false;
    const estado = historiaStatus;
    if (!estado) return false;
    switch (categoriaExamId) {
      case 1:
        return estado.examen_fisico;
      case 2:
        return estado.laboratorio_examen_ids.includes(examenId);
      case 3:
        return estado.visiometria;
      case 4:
        return estado.audiometria;
      case 5:
        return estado.espirometria;
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
        return estado.radiografia_examen_ids.includes(examenId);
      case 15:
        return estado.optometria;
      case 13:
        return estado.prueba_psicosensometrica;
      default:
        return false;
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-7 py-4 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={ChevronLeftIcon} className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-base">
              Panel de Recepción
            </h1>
            <p className="text-xs text-muted-foreground">Gestión de turnos y colas</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            EN VIVO
          </div>
          <span className="font-mono text-xs text-muted-foreground">{formatted}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/display")}
            className="text-xs text-muted-foreground"
          >
            <HugeiconsIcon icon={MonitorDotIcon} className="h-3.5 w-3.5 mr-1" />{" "}
            Pantallas
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — Paciente */}
        <aside className="w-80 border-r border-border p-5 flex flex-col gap-5 overflow-y-auto bg-card shrink-0">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
              Buscar Paciente
            </p>
            <div className="flex gap-2">
              <Input
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Número de cédula"
                className="bg-background border-border text-foreground text-xs flex-1"
                disabled={buscando}
                aria-busy={buscando}
                onKeyDown={(e) => e.key === "Enter" && !buscando && handleBuscarPaciente()}
              />
              <Button
                size="sm"
                onClick={handleBuscarPaciente}
                disabled={buscando}
                className="h-9 min-w-9 bg-primary hover:bg-primary/90 disabled:opacity-80"
                aria-label={buscando ? "Buscando paciente" : "Buscar paciente"}
              >
                {buscando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <HugeiconsIcon icon={Search01Icon} className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            {buscando && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary-500/20 bg-primary-500/10 px-3 py-2 text-xs text-primary-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span>Buscando paciente...</span>
              </div>
            )}

            {paciente && (
              <Card
                className="mt-3 p-3 bg-background border-border cursor-pointer hover:bg-accent transition-colors group"
                onClick={() => setShowIngresoModal(true)}
              >
                <p className="font-semibold text-sm">
                  {paciente.nombre_completo}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {paciente.tipo_documento} {paciente.numero_documento}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {paciente.telefono || "Sin teléfono"}
                </p>
                <p className="text-[10px] text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  Ver ingreso &rarr;
                </p>
              </Card>
            )}
          </div>



          <Separator className="bg-border" />

          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
              Acciones
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/display")}
                className="border-border text-muted-foreground justify-start text-xs"
              >
                <HugeiconsIcon
                  icon={MonitorDotIcon}
                  className="h-3.5 w-3.5 mr-2"
                />{" "}
                Ver Pantallas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="border-border text-muted-foreground justify-start text-xs"
              >
                <HugeiconsIcon
                  icon={ChartAverageIcon}
                  className="h-3.5 w-3.5 mr-2"
                />{" "}
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/areas")}
                className="border-border text-muted-foreground justify-start text-xs"
              >
                <HugeiconsIcon
                  icon={MonitorDotIcon}
                  className="h-3.5 w-3.5 mr-2"
                />{" "}
                Admin Áreas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/examenes")}
                className="border-border text-muted-foreground justify-start text-xs"
              >
                <HugeiconsIcon
                  icon={MonitorDotIcon}
                  className="h-3.5 w-3.5 mr-2"
                />{" "}
                Admin Exámenes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/videos")}
                className="border-border text-muted-foreground justify-start text-xs"
              >
                <HugeiconsIcon
                  icon={MonitorDotIcon}
                  className="h-3.5 w-3.5 mr-2"
                />{" "}
                Admin Videos
              </Button>
            </div>
          </div>
        </aside>

        {/* Área tabs + cola */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-1 px-5 py-3 border-b border-border overflow-x-auto bg-accent shrink-0">
            {areas.map((area) => {
              const isActive = area.id === activeAreaId;
              return (
                <button
                  key={area.id}
                  onClick={() => switchArea(area)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all ${isActive ? "text-foreground border-foreground/20 font-semibold" : "text-muted-foreground border-transparent hover:bg-card hover:text-foreground"}`}
                  style={
                    isActive
                      ? {
                          background: `${area.color}22`,
                          borderColor: `${area.color}55`,
                          color: area.color,
                        }
                      : {}
                  }
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: area.color }}
                  />
                  {area.prefijo}
                  {area.turnos_espera > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/10 min-w-[22px] text-center">
                      {area.turnos_espera}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 p-5 overflow-y-auto space-y-2 scrollbar-hide">
              <div className="flex items-center justify-between mb-1">
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Cola del Consultorio
                </p>
                <span className="font-mono text-[11px] bg-accent border border-border rounded-md px-2 py-0.5 text-muted-foreground">
                  {soloEnEspera.length} turno
                  {soloEnEspera.length !== 1 ? "s" : ""}
                </span>
              </div>
              {turnosOrdenados.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-3xl mb-3 opacity-40 flex justify-center">
                    <HugeiconsIcon
                      icon={CheckmarkBadge01Icon}
                      className="h-6 w-6"
                    />
                  </div>
                  <p className="font-display font-bold text-muted-foreground mb-1">
                    Cola vacía
                  </p>
                  <p className="text-xs">
                    No hay turnos en espera
                    {activeArea ? ` para ${activeArea.nombre}` : ""}
                  </p>
                </div>
              ) : (
                (() => {
                  let pos = 0;
                  return turnosOrdenados.map((turno) => {
                    const isCalling = turno.estado === "llamando";
                    if (!isCalling) pos++;
                    return isCalling ? (
                      <Card
                        key={turno.id}
                        className="p-5 bg-card border-border relative overflow-hidden shadow-lg"
                        style={{ borderColor: `${activeArea?.color}66` }}
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-0.5"
                          style={{
                            background: `linear-gradient(90deg, ${activeArea?.color}, transparent)`,
                          }}
                        />
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: activeArea?.color }}
                          >
                            <span className="text-white font-bold text-sm font-mono">
                              {activeArea?.prefijo}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="font-mono font-bold text-2xl"
                                style={{ color: activeArea?.color }}
                              >
                                {turno.numero_turno}
                              </span>
                              <Badge
                                className="text-[10px] font-semibold animate-pulse"
                                style={{
                                  background: `${activeArea?.color}22`,
                                  color: activeArea?.color,
                                  border: "none",
                                }}
                              >
                                EN ATENCIÓN
                              </Badge>
                            </div>
                            <p className="font-semibold text-sm">
                              {turno.nombre_paciente}
                            </p>
                            {turno.examen_paciente?.tipo_examen?.nombre && (
                              <p className="font-mono text-[11px] text-primary mt-0.5">
                                {turno.examen_paciente.tipo_examen.nombre}
                              </p>
                            )}
                            <p className="font-mono text-[11px] text-muted-foreground mt-1">
                              {fmtTime(turno.created_at)} ·{" "}
                              {turno.contador_llamados} llamado
                              {turno.contador_llamados !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => handleRellamar(turno.id)}
                            >
                              <HugeiconsIcon
                                icon={Refresh01Icon}
                                className="h-3.5 w-3.5 mr-1"
                              />{" "}
                              Re-llamar
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              onClick={() => handleCompletar(turno.id)}
                            >
                              <HugeiconsIcon
                                icon={CheckIcon}
                                className="h-3.5 w-3.5 mr-1"
                              />{" "}
                              Atendido
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/25"
                              onClick={() => handleAusente(turno.id)}
                            >
                              <HugeiconsIcon
                                icon={Cancel01Icon}
                                className="h-3.5 w-3.5 mr-1"
                              />{" "}
                              Ausente
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card
                        key={turno.id}
                        className="p-3.5 bg-card border-border flex items-center gap-3 transition-all hover:border-foreground/15"
                      >
                        <span className="font-mono text-[11px] text-muted-foreground w-6">
                          {pos}
                        </span>
                        <div
                          className="w-1 h-full rounded-full shrink-0 self-stretch"
                          style={{ background: activeArea?.color }}
                        />
                        <div
                          className="font-mono font-medium text-base min-w-[70px]"
                          style={{ color: activeArea?.color }}
                        >
                          {turno.numero_turno}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">
                            {turno.nombre_paciente}
                          </p>
                          {turno.examen_paciente?.tipo_examen?.nombre && (
                            <p className="font-mono text-[10px] text-primary mt-0.5">
                              {turno.examen_paciente.tipo_examen.nombre}
                            </p>
                          )}
                          {turno.ocupado_en && (
                            <p className="font-mono text-[10px] text-amber-400 mt-0.5">
                              Atendiendo en {turno.ocupado_en.prefijo}
                            </p>
                          )}
                          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                            {fmtTime(turno.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] border-primary-700/30 text-primary hover:bg-primary/20"
                            onClick={() => handleLlamar(turno.id)}
                            disabled={!!turno.ocupado_en}
                            title={turno.ocupado_en ? `Paciente atendiéndose en ${turno.ocupado_en.nombre}` : "Llamar turno"}
                          >
                            <HugeiconsIcon
                              icon={TelephoneIcon}
                              className="h-3 w-3 mr-1"
                            />{" "}
                            Llamar
                          </Button>
                        </div>
                      </Card>
                    );
                  });
                })()
              )}
            </div>

            <aside className="w-[360px] border-l border-border p-5 flex flex-col gap-4 bg-accent overflow-y-auto shrink-0">
              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                  Últimos Llamados
                </p>
                <div className="flex gap-2 flex-wrap">
                  {display?.historial && display.historial.length > 0 ? (
                    display.historial.slice(0, 5).map((h, i) => (
                      <span
                        key={h.id}
                        className="font-mono text-[11px] bg-card border border-border rounded-md px-2.5 py-1 text-muted-foreground"
                        style={{ opacity: 1 - i * 0.15 }}
                      >
                        {h.numero_turno}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin historial</span>
                  )}
                </div>
              </div>

              <Separator className="bg-border" />

              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                  Llamar por Número
                </p>
                <div className="flex gap-2">
                  <Input
                    value={manualCallNum}
                    onChange={(e) => setManualCallNum(e.target.value)}
                    placeholder="Ej: C1-001"
                    className="bg-background border-border text-xs font-mono flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleManualCall()}
                  />
                  <Button
                    size="sm"
                    className="bg-primary/20 text-primary border-primary-700/30 hover:bg-primary/30 h-9"
                    onClick={handleManualCall}
                  >
                    <HugeiconsIcon
                      icon={TelephoneIcon}
                      className="h-3.5 w-3.5 mr-1"
                    />{" "}
                    Llamar
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <Dialog
        open={showIngresoModal && !!ingreso}
        onOpenChange={setShowIngresoModal}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border text-foreground">
          {ingreso && paciente && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-display">
                  Datos del Ingreso | {ingreso.id.toString().padStart(6, '0')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                      Paciente
                    </p>
                    <p className="font-semibold">{paciente.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground">
                      {paciente.tipo_documento} {paciente.numero_documento}
                    </p>
                    {paciente.telefono && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tel: {paciente.telefono}
                      </p>
                    )}
                    {paciente.correo && (
                      <p className="text-xs text-muted-foreground">
                        Correo: {paciente.correo}
                      </p>
                    )}
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                      Cliente
                    </p>
                    <p className="font-semibold text-xs">
                      {ingreso.cliente?.razon_social || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sede: {ingreso.sede?.nombre_sede || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      En labor: {ingreso.empresa_labor?.nombre || "—"}
                    </p>
                  </div>
                </div>         

                {ingreso.examenes && ingreso.examenes.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                      Exámenes
                    </p>
                    <div className="space-y-1.5">
                      {ingreso.examenes.map((ex: any) => {
                        const examName = ex.examen?.nbr_examen || "Sin nombre";
                        const estaCerrado = isExamenCerrado(
                          ingreso.id,
                          ex.examen?.id,
                          ex.examen?.categoria_exam_id,
                        );
                        const estaCompleto = isExamenCompleto(
                          ingreso.id,
                          ex.examen?.categoria_exam_id,
                          ex.examen?.id,
                        );
                        const estaPendiente = !estaCerrado && !estaCompleto;
                        return (
                          <div
                            key={ex.id}
                            onClick={() => estaPendiente && toggleExamenConsalud(ex.id)}
                            className={`flex items-center justify-between rounded-lg p-2.5 border border-border cursor-pointer
                              ${
                                estaCerrado
                                  ? "bg-yellow-500/10 border-yellow-500/30 border-l-4 cursor-not-allowed"
                                  : estaCompleto
                                    ? "bg-emerald-500/10 border-emerald-500/30 border-l-4 cursor-not-allowed"
                                    : examenesConsaludSeleccionados.includes(ex.id)
                                      ? "bg-primary/10 border-primary/40 border-l-4"
                                      : "bg-card border-border hover:bg-accent"
                              }
                              transition-colors`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 shrink-0 flex items-center justify-center pointer-events-none">
                                {estaCerrado && (
                                  <HugeiconsIcon
                                    icon={LockedFreeIcons}
                                    className="h-4 w-4 text-yellow-500"
                                  />
                                )}
                                {estaCompleto && (
                                  <HugeiconsIcon
                                    icon={CheckmarkBadge01Icon}
                                    className="h-4 w-4 text-emerald-500"
                                  />
                                )}
                                {estaPendiente && (
                                  <input
                                    type="checkbox"
                                    checked={examenesConsaludSeleccionados.includes(ex.id)}
                                    readOnly
                                    className="accent-primary-700"
                                  />
                                )}
                              </div>

                              <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                {ex.examen?.cdg_examen} -{" "}
                              </span>
                              <span className="text-xs truncate">
                                {examName}
                              </span>
                            </div>
                            {(() => {
                              const area = getAreaPorCategoria(ex.examen?.categoria_exam_id);
                              return area ? (
                                <span
                                  className="font-mono text-[10px] shrink-0 ml-2 px-2 py-0.5 rounded-full border"
                                  style={{
                                    background: `${area.color}18`,
                                    borderColor: `${area.color}40`,
                                    color: area.color,
                                  }}
                                >
                                  {area.prefijo}
                                </span>
                              ) : null;
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border text-muted-foreground"
                    onClick={() => setShowIngresoModal(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r bg-primary text-primary-foreground text-xs font-semibold"
                    onClick={handleAsignarTurnosConsalud}
                    disabled={asignando || examenesConsaludSeleccionados.length === 0}
                  >
                    <HugeiconsIcon
                      icon={PlusSignIcon}
                      className="h-3.5 w-3.5 mr-1"
                    />
                    {asignando ? "Asignando..." : `Agregar a Turnos (${examenesConsaludSeleccionados.length})`}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
