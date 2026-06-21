import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(Pusher as any).logToConsole = false;

const echo = new Echo({
  broadcaster: 'reverb',
  key: '6yz4asovj9ziqpsxwj32',
  wsHost: 'localhost',
  wsPort: 8081,
  wssPort: 443,
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
});

export default echo;
