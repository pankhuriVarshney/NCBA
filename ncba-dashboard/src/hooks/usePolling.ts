import { useEffect, useState } from 'react';

export function usePolling<T>(fetcher: () => Promise<T>, intervalMs: number = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      try {
        setLoading(true);
        const result = await fetcher();
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    poll();
    const timer = setInterval(poll, intervalMs);
    return () => { mounted = false; clearInterval(timer); };
  }, [fetcher, intervalMs]);

  return { data, loading, error };
}