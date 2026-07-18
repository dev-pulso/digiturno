declare module 'react-speech-kit' {
  interface SpeechSynthesisVoice {
    lang: string;
    name: string;
    default: boolean;
    localService: boolean;
    voiceURI: string;
  }

  interface UseSpeechSynthesisOptions {
    onEnd?: () => void;
    onStart?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onError?: () => void;
  }

  interface SpeakOptions {
    text: string;
    voice?: SpeechSynthesisVoice | null;
    rate?: number;
    pitch?: number;
    volume?: number;
  }

  interface UseSpeechSynthesisReturn {
    speak: (options: SpeakOptions) => void;
    cancel: () => void;
    speaking: boolean;
    supported: boolean;
    voices: SpeechSynthesisVoice[];
    pause: () => void;
    resume: () => void;
    paused: boolean;
  }

  export function useSpeechSynthesis(
    options?: UseSpeechSynthesisOptions,
  ): UseSpeechSynthesisReturn;

  export function useSpeechRecognition(
    options?: Record<string, unknown>,
  ): Record<string, unknown>;
}
