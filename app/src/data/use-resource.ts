import {useEffect, useState} from 'react';
import {projectError} from './projects';
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, dependencies: readonly unknown[]) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); setData(null); void load(controller.signal).then(value => {if (!controller.signal.aborted) setData(value);}).catch(cause => {if (!controller.signal.aborted) setError(projectError(cause));}).finally(() => {if (!controller.signal.aborted) setLoading(false);}); return () => controller.abort(); }, [...dependencies, attempt]);
  return {data, error, loading, reload: () => setAttempt(value => value + 1)};
}
