import { useState } from 'react';
import { api } from '@/lib/api-client';
import { Paciente, ExamenPaciente } from '@/lib/types';
import { toast } from 'sonner';

export function usePacientes() {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [asignando, setAsignando] = useState(false);

  const buscarPorDocumento = async (numeroDocumento: string) => {
    if (!numeroDocumento.trim()) return;
    setBuscando(true);
    setPaciente(null);
    try {
      const res = await api.get('/pacientes/buscar-por-documento', {
        params: { numero_documento: numeroDocumento.trim() },
      });
      setPaciente(res.data.data || res.data);
    } catch {
      toast.error('Paciente no encontrado');
    }
    setBuscando(false);
    return paciente;
  };

  const asignarExamenes = async (pacienteId: number, tiposExamenesIds: number[]) => {
    setAsignando(true);
    try {
      const res = await api.post(`/pacientes/${pacienteId}/examenes`, {
        tipos_examenes_ids: tiposExamenesIds,
      });
      const data = res.data;
      toast.success('Exámenes asignados y turno creado');
      return data;
    } catch {
      toast.error('Error al asignar exámenes');
    }
    setAsignando(false);
    return null;
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
    buscando,
    asignando,
    buscarPorDocumento,
    asignarExamenes,
    buscarExamenes,
    setPaciente,
  };
}
