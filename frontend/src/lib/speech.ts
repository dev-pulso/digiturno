type DatosAnuncio = {
  numero_turno?: string | number;
  nombre_paciente?: string;
  area_nombre?: string;
  prefijo?: string;
};

let timer: ReturnType<typeof setTimeout> | null = null;
let lastTexto = '';
let lastAt = 0;
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtxClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Reproduce el clásico tono de llamada hospitalaria/aeroportuaria (ding-dong).
 * D5 (587.33 Hz) seguido de A4 (440 Hz) ~0.9s
 */
export function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        resolve();
        return;
      }

      const now = ctx.currentTime;

      // Tono 1: Re 5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Tono 2: La 4 (440 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440.0, now + 0.35);
      gain2.gain.setValueAtTime(0.35, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.88);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 0.9);

      setTimeout(() => {
        resolve();
      }, 850);
    } catch {
      resolve();
    }
  });
}

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

  if (nombre && area) {
    return `Atención. ${nombre}. Favor pasar a ${area}.`;
  }
  if (nombre) return `Atención. ${nombre}.`;
  if (area) return `Favor pasar a ${area}.`;
  return '';
}

function isFemaleVoice(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase();
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
  utterance.pitch = 1.05;
  utterance.volume = 1;

  utterance.onstart = () => {
    window.dispatchEvent(new CustomEvent('digiturno:speech-start'));
  };

  utterance.onend = () => {
    window.dispatchEvent(new CustomEvent('digiturno:speech-end'));
  };

  utterance.onerror = () => {
    window.dispatchEvent(new CustomEvent('digiturno:speech-end'));
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Anuncia turno. Reproduce campana hospitalaria y luego voz con atenuación sonora.
 */
export async function anunciarTurno(data: DatosAnuncio): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const texto = buildText(data);
  if (!texto) return;

  const now = Date.now();
  if (texto === lastTexto && now - lastAt < 1500) return;

  if (timer) clearTimeout(timer);
  window.speechSynthesis.cancel();

  timer = setTimeout(async () => {
    lastTexto = texto;
    lastAt = Date.now();

    // Notificar inicio de anuncio para atenuar video
    window.dispatchEvent(new CustomEvent('digiturno:speech-start'));

    // Reproducir campanilla hospitalaria
    await playChime();

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
  }, 350);
}

export function cancelarAnuncio(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    window.dispatchEvent(new CustomEvent('digiturno:speech-end'));
  }
}
