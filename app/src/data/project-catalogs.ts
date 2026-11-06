import type { CatalogOption, ProjectCatalogs } from './projects';
import { api } from './client';

// Transport read models; never import persistence entities into the browser.
export interface SelectionCatalogs {
  clientes: (CatalogOption & { sector: string | null })[];
  paises: CountryOption[];
  lobs: CatalogOption[];
  paginacion: {hasMore: boolean; nextCursor: string | null};
}
export const listClients = (query = '', after = '0', signal?: AbortSignal) => api<{items: ClientRecord[]; paginacion: {limit: number; total: number; hasMore: boolean; nextCursor: string | null}}>(`/api/v1/clientes?limit=100&after=${after}${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ''}`, {signal});
export const listCountries = (signal?: AbortSignal) => api<CountryOption[]>('/api/v1/paises', {signal});
export const listLobs = (signal?: AbortSignal) => api<CatalogOption[]>('/api/v1/lobs', {signal});
export async function getProjectCatalogs(query = '', signal?: AbortSignal, after = '0') {
  const [clients, paises, lobs] = await Promise.all([
    listClients(query, after, signal), listCountries(signal), listLobs(signal),
  ]);
  return {clientes: clients.items, paginacion: clients.paginacion, paises, lobs};
}
export const createClient = (input: ClientCreateInput) => api<ClientRecord>('/api/v1/clientes', {method: 'POST', body: JSON.stringify({nombre: input.nombre.trim(), estadoCliente: input.estadoCliente})});
export async function getEligibleManagers(workspaceId: string, query = '', signal?: AbortSignal, para = 'PM_TITULAR') {
  const result = await api<{ items: { usuarioId: string; nombre: string; email: string; tipoUsuario: string; rol: string; miembroActivo: boolean; puedeCrearProyectos: boolean }[] }>(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/elegibles?para=${para}&limit=100${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ''}`, { signal });
  return { options: result.items.filter(item => item.tipoUsuario === 'INTERNO' && item.rol === (para === 'PM_TITULAR' ? 'PM' : 'ESPECIALISTA') && item.miembroActivo).map(item => ({ id: item.usuarioId, nombre: item.nombre, email: item.email })), complete: result.items.length < 100 };
}
export interface CountryOption extends CatalogOption { codigo: string }
export interface EligibleProjectManager extends CatalogOption { email?: string }
export interface ClientCreateInput { nombre: string; estadoCliente: 'NUEVO' | 'ANTIGUO' }
export type ClientRecord = CatalogOption & {estadoCliente?: 'NUEVO' | 'ANTIGUO' | null};
export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'forbidden' | 'error';
export interface CatalogResource<T extends CatalogOption = CatalogOption> {
  status: CatalogStatus;
  options: readonly T[];
  complete: boolean;
  message?: string;
}
export interface ProjectCatalogStates {
  clientes: CatalogResource;
  paises: CatalogResource<CatalogOption | CountryOption>;
  lobs: CatalogResource;
  titulares: CatalogResource<CatalogOption | EligibleProjectManager>;
}
export interface ClientCreationAccess {
  // Must be supplied from a verified backend permission; never from proyectos.crear.
  authorized: boolean;
  create?: (input: ClientCreateInput) => Promise<ClientRecord>;
  refresh?: () => void | Promise<void>;
}
export function projectCatalogStates(catalogs: ProjectCatalogs | null): ProjectCatalogStates {
  const resource = (options?: readonly CatalogOption[]): CatalogResource => options
    ? { status: 'ready', options, complete: true }
    : { status: 'unavailable', options: [], complete: false };
  return { clientes: resource(catalogs?.clientes), paises: resource(catalogs?.paises), lobs: resource(catalogs?.lobs), titulares: resource(catalogs?.titulares) };
}
