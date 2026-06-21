import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { Turno } from '@/lib/types';

export function useConsultorio(areaId: number | null) {
  const [cola, setCola] = useState<Turno[]>([]);
  const [actual, setActual] = useState<Turno | null>(null);
  const [historial, setHistorial] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCola = useCallback(async () => {
    if (!areaId) return;
    setLoading(true);
    try {
      const res = await api.get(`/consultorios/${areaId}/cola`);
      setActual(res.data.actual?.data || res.data.actual || null);
      setCola(res.data.en_espera?.data || res.data.en_espera || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [areaId]);

  const fetchHistorial = useCallback(async () => {
    if (!areaId) return;
    try {
      const res = await api.get(`/consultorios/${areaId}/historial`);
      setHistorial(res.data.data || res.data);
    } catch { /* ignore */ }
  }, [areaId]);

  const llamarSiguiente = async () => {
    const res = await api.post(`/consultorios/${areaId}/llamar-siguiente`);
    await fetchCola();
    return res.data.data || res.data;
  };

  const completarTurno = async (turnoId: number): Promise<Turno> => {
    const res = await api.post(`/turnos/${turnoId}/completar`);
    await Promise.all([fetchCola(), fetchHistorial()]);
    return res.data.data || res.data;
  };

  const ausenteTurno = async (turnoId: number): Promise<Turno> => {
    const res = await api.post(`/turnos/${turnoId}/ausente`);
    await Promise.all([fetchCola(), fetchHistorial()]);
    return res.data.data || res.data;
  };

  const rellamarTurno = async (turnoId: number): Promise<Turno> => {
    const res = await api.post(`/turnos/${turnoId}/rellamar`);
    await fetchCola();
    return res.data.data || res.data;
  };

  return {
    cola,
    actual,
    historial,
    loading,
    fetchCola,
    fetchHistorial,
    llamarSiguiente,
    completarTurno,
    ausenteTurno,
    rellamarTurno,
  };
}
