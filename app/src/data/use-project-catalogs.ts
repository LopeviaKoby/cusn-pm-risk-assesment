import { useEffect, useRef, useState } from 'react';
import { ApiError } from './client';
import { getEligibleManagers, listClients, listCountries, listLobs, projectCatalogStates, type ProjectCatalogStates } from './project-catalogs';

export function useProjectCatalogs(workspaceId: string, admin: boolean, onAuthorizationError: (status: number) => void) {
  const [sources, setSources] = useState<ProjectCatalogStates>(() => projectCatalogStates(null));
  const [queries, setQueries] = useState({ clientes: '', titulares: '' });
  const [attempt, setAttempt] = useState(0);
  const [authStatus, setAuthStatus] = useState<number | null>(null);
  const [clientCursor, setClientCursor] = useState('0');
  const nextCursor = useRef<string | null>(null);
  const authCallback = useRef(onAuthorizationError);
  useEffect(() => { authCallback.current = onAuthorizationError; }, [onAuthorizationError]);
  useEffect(() => { if (authStatus !== null) authCallback.current(authStatus); }, [authStatus]);
  useEffect(() => {
    const controller = new AbortController();
    setSources(previous => ({ ...previous, clientes: { ...previous.clientes, status: 'loading' } }));
    const timer = setTimeout(() => {
      void listClients(queries.clientes, clientCursor, controller.signal).then(data => {
        if (controller.signal.aborted) return;
        nextCursor.current = data.paginacion.nextCursor;
        setSources(previous => ({ ...previous, clientes: { status: 'ready', options: clientCursor === '0' ? data.items : [...previous.clientes.options, ...data.items.filter(item => !previous.clientes.options.some(old => old.id === item.id))], complete: !data.paginacion.hasMore } }));
      }).catch(cause => {
        if (controller.signal.aborted) return;
        const status = cause instanceof ApiError && cause.status === 403 ? 'forbidden' : cause instanceof ApiError && cause.status === 404 ? 'unavailable' : 'error';
        setSources(previous => ({ ...previous, clientes: { ...previous.clientes, status } }));
        if (cause instanceof ApiError && [401, 403].includes(cause.status)) setAuthStatus(cause.status);
      });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [workspaceId, queries.clientes, attempt, clientCursor]);
  useEffect(() => {
    const controller = new AbortController();
    for (const [key, load] of [['paises', listCountries], ['lobs', listLobs]] as const) {
      setSources(previous => ({...previous, [key]: {...previous[key], status: 'loading'}}));
      void load(controller.signal).then(options => {if (!controller.signal.aborted) setSources(previous => ({...previous, [key]: {status: 'ready', options, complete: true}}));}).catch(cause => {if (!controller.signal.aborted) setSources(previous => ({...previous, [key]: {...previous[key], status: cause instanceof ApiError && cause.status === 403 ? 'forbidden' : cause instanceof ApiError && cause.status === 404 ? 'unavailable' : 'error'}}));});
    }
    return () => controller.abort();
  }, [attempt]);
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
  return { sources, moreClients: () => {if (nextCursor.current) setClientCursor(nextCursor.current);}, search: (key: 'clientes' | 'titulares', query: string) => {if (key === 'clientes') setClientCursor('0'); setQueries(previous => ({ ...previous, [key]: query.slice(0, 120) }));}, retry: () => { setAuthStatus(null); setClientCursor('0'); setAttempt(value => value + 1); } };
}
