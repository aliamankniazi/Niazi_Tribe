import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import api from './api';

declare global {
  interface Window {
    Pusher: any;
    Echo: Echo<any>;
  }
}

let echo: Echo<any> | null = null;

if (typeof window !== 'undefined') {
  window.Pusher = Pusher;

  echo = new Echo({
    broadcaster: 'pusher',
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || 'local',
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
    forceTLS: false,
    wsHost: window.location.hostname,
    wsPort: 6001,
    disableStats: true,
    authorizer: (channel: any, options: any) => {
      return {
        authorize: async (socketId: string, callback: Function) => {
          try {
            const response = await api.post('/broadcasting/auth', {
              socket_id: socketId,
              channel_name: channel.name
            });
            callback(null, response.data);
          } catch (error) {
            callback(error);
          }
        }
      };
    },
  });
}

export default echo; 