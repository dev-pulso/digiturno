import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(Pusher as any).logToConsole = false;

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY ?? 'digiturno-key',
  wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
  wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8081),
  wssPort: 443,
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
});

export default echo;
