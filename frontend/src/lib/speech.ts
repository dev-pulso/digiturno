type DatosAnuncio = {
  numero_turno?: string | number;
  nombre_paciente?: string;
  area_nombre?: string;
  prefijo?: string;
};

// ponytail: un solo anuncio a la vez (consultorio + display WS se pisan sin esto)
let timer: ReturnType<typeof setTimeout> | null = null;
let lastTexto = '';
let lastAt = 0;

/** "ANDREA CAROLINA" → "Andrea Carolina" (MAYÚSCULAS confunden al TTS) */
function paraVoz(texto: string): string {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .replace(/(^|[\s\-'])\p{L}/gu, (c) => c.toLocaleUpperCase('es'));
}

function buildText(data: DatosAnuncio): string {
  const nombre = data.nombre_paciente ? paraVoz(data.nombre_paciente) : '';
  const area = data.area_nombre ? paraVoz(data.area_nombre) : '';

  // Sin número de turno — solo nombre y área
  if (nombre && area) {
    return `Atención. ${nombre}. Favor pasar a ${area}.`;
  }
  if (nombre) return `Atención. ${nombre}.`;
  if (area) return `Favor pasar a ${area}.`;
  return '';
}

function isFemaleVoice(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase();
  // Nombres típicos de voces femeninas en Windows/Chrome/Edge
  return /female|femenin|woman|mujer|sabina|paulina|elena|lucia|lucía|maria|maría|carmen|sofia|sofía|isabela|dalia|mónica|monica|pilar|conchita|lola|francisca|salma|karina|esther|zira|helena|google español/.test(n)
    && !/male|masculin|hombre|jorge|pablo|diego|carlos|enrique|raul|raúl|antonio|miguel/.test(n);
}

function langScore(lang: string): number {
  if (lang === 'es-CO') return 4;
  if (lang === 'es-MX') return 3;
  if (lang === 'es-ES') return 2;
  if (lang.startsWith('es')) return 1;
  return 0;
}

function findVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => langScore(v.lang) > 0);
  if (!voices.length) return undefined;

  // 1) mujer + es-CO/MX/ES  2) cualquier mujer es  3) mejor lang sin género
  const female = voices.filter(isFemaleVoice);
  const pick = (list: SpeechSynthesisVoice[]) =>
    [...list].sort((a, b) => langScore(b.lang) - langScore(a.lang))[0];

  return pick(female) || pick(voices);
}

function speakNow(texto: string): void {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  const voice = findVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'es-CO';
  }
  utterance.rate = 0.95;
  utterance.pitch = 1.05; // un poco más agudo si no hay voz femenina explícita
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

/**
 * Anuncia turno. Debounce 400ms: si llegan eventos duplicados, un solo anuncio.
 */
export function anunciarTurno(data: DatosAnuncio): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const texto = buildText(data);
  if (!texto) return;

  const now = Date.now();
  if (texto === lastTexto && now - lastAt < 1500) return;

  if (timer) clearTimeout(timer);
  window.speechSynthesis.cancel();

  timer = setTimeout(() => {
    lastTexto = texto;
    lastAt = Date.now();
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speakNow(texto);
      };
    } else {
      speakNow(texto);
    }
    timer = null;
  }, 400);
}

export function cancelarAnuncio(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
