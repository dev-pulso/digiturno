import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { Turno } from '@/lib/types';

interface DatosDisplay {
  actual: Turno | null;
  historial: Turno[];
  en_espera: number;
}

export function useTurnos(areaId: number | null) {
  const [cola, setCola] = useState<Turno[]>([]);
  const [display, setDisplay] = useState<DatosDisplay | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCola = useCallback(async () => {
    if (!areaId) return;
    setLoading(true);
    try {
      const res = await api.get('/turnos', { params: { area_id: areaId, estado: 'en_espera,llamando', hoy: true } });
      setCola(res.data.data || res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [areaId]);

  const fetchDisplay = useCallback(async () => {
    if (!areaId) return;
    try {
      const res = await api.get(`/display/${areaId}`);
      const d = res.data;
      setDisplay({
        actual: d.actual?.data || d.actual || null,
        historial: d.historial?.data || d.historial || [],
        en_espera: d.en_espera || 0,
      });
    } catch { /* ignore */ }
  }, [areaId]);

  const crearTurno = async (data: { area_id: number; nombre_paciente: string; origen?: string }) => {
    const res = await api.post('/turnos', data);
    await fetchCola();
    return res.data.data || res.data;
  };

  const llamarTurno = async (turnoId: number) => {
    const res = await api.post(`/turnos/${turnoId}/llamar`);
    await Promise.all([fetchCola(), fetchDisplay()]);
    return res.data.data || res.data;
  };

  const completarTurno = async (turnoId: number) => {
    const res = await api.post(`/turnos/${turnoId}/completar`);
    await Promise.all([fetchCola(), fetchDisplay()]);
    return res.data.data || res.data;
  };

  const ausenteTurno = async (turnoId: number) => {
    const res = await api.post(`/turnos/${turnoId}/ausente`);
    await Promise.all([fetchCola(), fetchDisplay()]);
    return res.data.data || res.data;
  };

  const rellamarTurno = async (turnoId: number) => {
    const res = await api.post(`/turnos/${turnoId}/rellamar`);
    await Promise.all([fetchCola(), fetchDisplay()]);
    return res.data.data || res.data;
  };

  return {
    cola,
    display,
    loading,
    fetchCola,
    fetchDisplay,
    crearTurno,
    llamarTurno,
    completarTurno,
    ausenteTurno,
    rellamarTurno,
  };
}
