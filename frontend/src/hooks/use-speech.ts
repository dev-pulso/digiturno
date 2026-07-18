import { useSpeechSynthesis } from 'react-speech-kit';
import { useCallback, useRef } from 'react';

type DatosAnuncio = {
  numero_turno?: string | number;
  nombre_paciente?: string;
  area_nombre?: string;
};

export function useSpeech() {
  const { speak: speakKit, cancel: cancelKit, speaking, supported, voices } = useSpeechSynthesis({
    onEnd: () => {},
  });

  const voicesRef = useRef(voices);
  voicesRef.current = voices;

  const getVoice = useCallback(() => {
    return voicesRef.current.find((v: SpeechSynthesisVoice) => v.lang === 'es-US')
      || voicesRef.current.find((v: SpeechSynthesisVoice) => v.lang.startsWith('es'))
      || null;
  }, []);

  const anunciar = useCallback(
    (data: DatosAnuncio) => {
      if (!supported) return;

      const partes: string[] = [];
      if (data.nombre_paciente) partes.push(data.nombre_paciente);
      if (data.area_nombre) partes.push(data.area_nombre);

      const texto = partes.join(', ');
      if (!texto) return;

      cancelKit();
      setTimeout(() => {
        speakKit({
          text: texto,
          voice: getVoice(),
          rate: 1,
          pitch: 1,
          volume: 1,
        });
      }, 100);
    },
    [supported, cancelKit, speakKit, getVoice],
  );

  const cancelar = useCallback(() => {
    cancelKit();
  }, [cancelKit]);

  return { anunciar, cancelar, hablando: speaking, soportado: supported };
}
