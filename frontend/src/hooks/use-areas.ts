import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Area } from '@/lib/types';

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    api.get('/areas')
      .then((res) => {
        const data: Area[] = res.data.data || res.data;
        setAreas(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return { areas, loading, refetch: fetch };
}
