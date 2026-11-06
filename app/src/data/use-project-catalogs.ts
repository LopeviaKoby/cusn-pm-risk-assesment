import { useEffect, useRef, useState } from 'react';
import { ApiError } from './client';
import { getEligibleManagers, getProjectCatalogs, projectCatalogStates, type ProjectCatalogStates } from './project-catalogs';

export function useProjectCatalogs(workspaceId: string, admin: boolean, onAuthorizationError: (status: number) => void) {
  const [sources, setSources] = useState<ProjectCatalogStates>(() => projectCatalogStates(null));
  const [queries, setQueries] = useState({ clientes: '', titulares: '' });
  const [attempt, setAttempt] = useState(0);
  const [authStatus, setAuthStatus] = useState<number | null>(null);
  const authCallback = useRef(onAuthorizationError);
  useEffect(() => { authCallback.current = onAuthorizationError; }, [onAuthorizationError]);
  useEffect(() => { if (authStatus !== null) authCallback.current(authStatus); }, [authStatus]);
  useEffect(() => {
    const controller = new AbortController();
    setSources(previous => ({ ...previous, clientes: { ...previous.clientes, status: 'loading' }, paises: previous.paises.status === 'ready' ? previous.paises : { ...previous.paises, status: 'loading' }, lobs: previous.lobs.status === 'ready' ? previous.lobs : { ...previous.lobs, status: 'loading' } }));
    const timer = setTimeout(() => {
      void getProjectCatalogs(queries.clientes, controller.signal).then(data => {
        if (controller.signal.aborted) return;
        setSources(previous => ({ ...previous, clientes: { status: 'ready', options: data.clientes, complete: data.clientes.length < 100 }, paises: { status: 'ready', options: data.paises, complete: data.paises.length < 100 }, lobs: { status: 'ready', options: data.lobs, complete: data.lobs.length < 100 } }));
      }).catch(cause => {
        if (controller.signal.aborted) return;
        const status = cause instanceof ApiError && cause.status === 403 ? 'forbidden' : cause instanceof ApiError && cause.status === 404 ? 'unavailable' : 'error';
        setSources(previous => ({ ...previous, clientes: { ...previous.clientes, status }, paises: previous.paises.status === 'ready' && status === 'error' ? previous.paises : { ...previous.paises, status }, lobs: previous.lobs.status === 'ready' && status === 'error' ? previous.lobs : { ...previous.lobs, status } }));
        if (cause instanceof ApiError && [401, 403].includes(cause.status)) setAuthStatus(cause.status);
      });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [workspaceId, queries.clientes, attempt]);
  useEffect(() => {
    if (!admin) return;
    const controller = new AbortController();
    setSources(previous => ({ ...previous, titulares: { ...previous.titulares, status: 'loading' } }));
    const timer = setTimeout(() => {
      void getEligibleManagers(workspaceId, queries.titulares, controller.signal).then(data => {
        if (!controller.signal.aborted) setSources(previous => ({ ...previous, titulares: { status: 'ready', ...data } }));
      }).catch(cause => {
        if (controller.signal.aborted) return;
        const status = cause instanceof ApiError && cause.status === 403 ? 'forbidden' : cause instanceof ApiError && cause.status === 404 ? 'unavailable' : 'error';
        setSources(previous => ({ ...previous, titulares: { ...previous.titulares, status } }));
        if (cause instanceof ApiError && [401, 403].includes(cause.status)) setAuthStatus(cause.status);
      });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [workspaceId, admin, queries.titulares, attempt]);
  return { sources, search: (key: 'clientes' | 'titulares', query: string) => setQueries(previous => ({ ...previous, [key]: query.slice(0, 120) })), retry: () => { setAuthStatus(null); setAttempt(value => value + 1); } };
}
