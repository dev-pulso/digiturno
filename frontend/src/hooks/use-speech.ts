import { useCallback } from 'react';
import { anunciarTurno, cancelarAnuncio } from '@/lib/speech';

type DatosAnuncio = {
  numero_turno?: string | number;
  nombre_paciente?: string;
  area_nombre?: string;
};

// ponytail: un solo path de TTS (speech.ts) — evita react-speech-kit + speech.ts a la vez
export function useSpeech() {
  const anunciar = useCallback((data: DatosAnuncio) => {
    anunciarTurno(data);
  }, []);

  const cancelar = useCallback(() => {
    cancelarAnuncio();
  }, []);

  return { anunciar, cancelar, hablando: false, soportado: typeof window !== 'undefined' && !!window.speechSynthesis };
}
