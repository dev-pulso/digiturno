import { useState } from 'react';
import { api } from '@/lib/api-client';
import { Paciente, ExamenPaciente, ConsaludCategoriaArea } from '@/lib/types';
import { toast } from 'sonner';

interface IngresoInfo {
  id: number;
  fecha_atencion: string;
  observacion: string | null;
  cliente: { id: number; razon_social: string };
  sede: { id: number; nombre_sede: string };
  empresa_labor: { id: number; nombre: string };
  tipo_evaluacion: { id: number; nombre: string };
  ocupacion: { id: number; nombre: string };
  examenes: Array<{
    id: number;
    examen_id: number;
    estado: number;
    examen: {
      id: number;
      cdg_examen: string;
      nbr_examen: string;
      categoria_exam_id: number;
    };
  }>;
}

interface HistoriaStatusData {
  examen_fisico: boolean;
  visiometria: boolean;
  audiometria: boolean;
  espirometria: boolean;
  optometria: boolean;
  laboratorio_examen_ids: number[];
  radiografia_examen_ids: number[];
  historia_clinica_cerrada: boolean;
  audiometria_cerrada: boolean;
  visiometria_cerrada: boolean;
  espirometria_cerrada: boolean;
  optometria_cerrada: boolean;
  laboratorio_cerrado: boolean;
  radiografia_cerrada: boolean;
  prueba_psicosensometrica: boolean;
  prueba_psicosensometrica_cerrada: boolean;
}

export function usePacientes() {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [ingreso, setIngreso] = useState<IngresoInfo | null>(null);
  const [historiaStatus, setHistoriaStatus] = useState<HistoriaStatusData | null>(null);
  const [categoriasAreas, setCategoriasAreas] = useState<ConsaludCategoriaArea[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [asignando, setAsignando] = useState(false);

  const buscarPorDocumento = async (numeroDocumento: string) => {
    if (!numeroDocumento.trim()) return;
    setBuscando(true);
    setPaciente(null);
    setIngreso(null);
    setHistoriaStatus(null);
    try {
      const res = await api.get('/pacientes/buscar-por-documento', {
        params: { numero_documento: numeroDocumento.trim() },
      });
      const pacienteEncontrado = res.data.paciente?.data || res.data.paciente || res.data.data || res.data;
      setPaciente(pacienteEncontrado);
      setIngreso(res.data.ingreso || null);
      setHistoriaStatus(res.data.historia_status || null);
      setCategoriasAreas(res.data.categorias_areas || []);
      if (res.data.fuente === 'local' && res.data.aviso) {
        toast.message(res.data.aviso);
      }
      return pacienteEncontrado;
    } catch {
      // interceptor de api ya muestra mensaje (Consalud caído vs no encontrado)
      return null;
    } finally {
      setBuscando(false);
    }
  };

  const asignarExamenes = async (pacienteId: number, tiposExamenesIds: number[]) => {
    setAsignando(true);
    try {
      const res = await api.post(`/pacientes/${pacienteId}/examenes`, {
        tipos_examenes_ids: tiposExamenesIds,
      });
      const data = res.data;
      toast.success('Exámenes asignados y turno creado');
      setAsignando(false);
      return data;
    } catch {
      toast.error('Error al asignar exámenes');
    }
    setAsignando(false);
    return null;
  };

  const asignarExamenesConsalud = async (
    pacienteId: number,
    ingresoId: number,
    ingreso: any,
    examenesSeleccionados: Array<{ examen_ingreso_id: number; categoria_exam_id: number }>,
  ) => {
    setAsignando(true);
    try {
      const res = await api.post('/consalud/asignar-turnos', {
        paciente_id: pacienteId,
        ingreso_id: ingresoId,
        ingreso,
        examenes_seleccionados: examenesSeleccionados,
      });
      toast.success(res.data.mensaje || 'Turnos asignados');
      return res.data;
    } catch (error: any) {
      const mensaje = error?.response?.data?.mensaje || 'Error al asignar turnos desde Consalud';
      toast.error(mensaje);
      return null;
    } finally {
      setAsignando(false);
    }
  };

  const buscarExamenes = async (pacienteId: number): Promise<ExamenPaciente[]> => {
    try {
      const res = await api.get(`/pacientes/${pacienteId}/examenes`);
      return res.data.data || res.data;
    } catch {
      return [];
    }
  };

  return {
    paciente,
    ingreso,
    historiaStatus,
    categoriasAreas,
    buscando,
    asignando,
    buscarPorDocumento,
    asignarExamenes,
    asignarExamenesConsalud,
    buscarExamenes,
    setPaciente,
  };
}
