import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { TipoExamen } from '@/lib/types';

export function useTiposExamenes() {
  const [tiposExamenes, setTiposExamenes] = useState<TipoExamen[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    api.get('/tipos-examenes')
      .then((res) => {
        setTiposExamenes(res.data.data || res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return { tiposExamenes, loading, refetch: fetch };
}
