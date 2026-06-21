export interface Area {
  id: number;
  codigo: string;
  nombre: string;
  prefijo: string;
  color: string;
  activo: boolean;
  turnos_espera: number;
  turno_actual: { numero_turno: string; nombre_paciente: string } | null;
  created_at: string;
}

export interface Paciente {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  nombre_completo: string;
  telefono: string | null;
  correo: string | null;
  examenes?: ExamenPaciente[];
  created_at: string;
}

export interface Turno {
  id: number;
  numero_turno: string;
  area_id: number;
  paciente_id: number | null;
  examen_paciente_id: number | null;
  nombre_paciente: string;
  estado: 'en_espera' | 'llamando' | 'completado' | 'ausente' | 'cancelado';
  estado_etiqueta?: string;
  origen: 'recepcion' | 'kiosco';
  llamado_por: string | null;
  llamado_en: string | null;
  completado_en: string | null;
  ausente_en: string | null;
  contador_llamados: number;
  segundos_espera: number | null;
  segundos_servicio: number | null;
  area?: { id: number; codigo: string; nombre: string; prefijo: string; color: string };
  examen_paciente?: {
    id: number;
    estado: string;
    tipo_examen?: { id: number; nombre: string; codigo: string };
  };
  created_at: string;
}

export interface TipoExamen {
  id: number;
  nombre: string;
  codigo: string;
  area_id: number;
  activo: boolean;
  area?: { id: number; nombre: string; prefijo: string; color: string };
  created_at: string;
}

export interface ExamenPaciente {
  id: number;
  paciente_id: number;
  tipo_examen_id: number;
  estado: 'pendiente' | 'en_cola' | 'llamando' | 'completado' | 'ausente';
  estado_etiqueta: string;
  turno_id: number | null;
  tipo_examen?: {
    id: number;
    nombre: string;
    codigo: string;
    area?: { id: number; nombre: string; prefijo: string };
  };
  turno?: { id: number; numero_turno: string; estado: string };
  created_at: string;
}

export interface Video {
  id: number;
  titulo: string;
  archivo: string;
  nombre_original: string;
  tipo_mime: string;
  tamano: number;
  duracion: number | null;
  orden: number;
  activo: boolean;
  url: string;
  created_at: string;
}

export interface ResumenDashboard {
  total_turnos: number;
  turnos_espera: number;
  turnos_completados: number;
  turnos_ausentes: number;
  avg_segundos_espera: number;
  avg_segundos_servicio: number;
  estadisticas_areas: Array<{
    area_id: number;
    area_nombre: string;
    area_codigo: string;
    total: number;
    en_espera: number;
    completados: number;
    avg_espera: number;
  }>;
}
