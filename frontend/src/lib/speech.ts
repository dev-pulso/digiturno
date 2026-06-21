import { api } from './api-client';

type DatosAnuncio = {
  numero_turno: string | number;
  nombre_paciente: string;
  area_nombre?: string;
};

function hablarNavegador(texto: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  const voices = window.speechSynthesis.getVoices();
  const esVoice = voices.find(v => v.lang.startsWith('es'));
  if (esVoice) utterance.voice = esVoice;
  utterance.lang = 'es-MX';
  utterance.rate = 1.1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function anunciarTurno(data: DatosAnuncio): void {
  const partes = [`Turno ${data.numero_turno}`];
  if (data.nombre_paciente) partes.push(data.nombre_paciente);
  if (data.area_nombre) partes.push(data.area_nombre);
  const texto = partes.join(', ');

  hablarNavegador(texto);
  api.post('/tts/anunciar', { texto }).catch(() => {});
}
