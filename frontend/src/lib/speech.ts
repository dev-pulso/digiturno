type DatosAnuncio = {
  numero_turno?: string | number;
  nombre_publico?: string;
  area_nombre?: string;
  prefijo?: string;
};

function buildText(data: DatosAnuncio): string {
  const partes: string[] = [];
  if (data.nombre_publico) partes.push(data.nombre_publico);
  if (data.area_nombre) partes.push(data.area_nombre);
  return partes.join(', ');
}

function findVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.lang === 'es-US')
    || voices.find(v => v.lang.startsWith('es'))
    || undefined;
}

export function anunciarTurno(data: DatosAnuncio): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const texto = buildText(data);
  if (!texto) return;

  window.speechSynthesis.cancel();
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(texto);
    const voice = findVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = 'es-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }, 80);
}

export function cancelarAnuncio(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
