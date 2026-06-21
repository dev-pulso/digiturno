import { useEffect, useRef } from 'react';
import echo from '@/lib/echo';

type EventCallback = (data: any) => void;

interface EventMap {
  'turno.creado': EventCallback;
  'turno.llamado': EventCallback;
  'turno.completado': EventCallback;
  'turno.ausente': EventCallback;
  'turno.rellamado': EventCallback;
}

export function useWebSocket(areaId: number | null, events: Partial<EventMap>) {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!areaId) return;

    const channel = echo.channel(`area.${areaId}`);

    const eventNames = Object.keys(events) as (keyof EventMap)[];
    eventNames.forEach((eventName) => {
      channel.listen(`.${eventName}`, (data: any) => {
        const cb = eventsRef.current[eventName];
        if (cb) cb(data);
      });
    });

    return () => {
      echo.leave(`area.${areaId}`);
    };
  }, [areaId]);
}
