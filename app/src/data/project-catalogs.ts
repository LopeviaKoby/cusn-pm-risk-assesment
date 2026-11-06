import type { CatalogOption, ProjectCatalogs } from './projects';
import { api } from './client';

// Read contracts verified against the local router. Client creation remains unavailable.
export interface SelectionCatalogs {
  clientes: (CatalogOption & { sector: string | null })[];
  paises: CountryOption[];
  lobs: CatalogOption[];
}
export function getProjectCatalogs(query = '', signal?: AbortSignal) {
  return api<SelectionCatalogs>(`/api/v1/catalogos?limit=100${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ''}`, { signal });
}
export async function getEligibleManagers(workspaceId: string, query = '', signal?: AbortSignal) {
  const result = await api<{ items: { usuarioId: string; nombre: string; email: string; tipoUsuario: string; rol: string; miembroActivo: boolean; puedeCrearProyectos: boolean }[] }>(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/elegibles?para=PM_TITULAR&limit=100${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ''}`, { signal });
  return { options: result.items.filter(item => item.tipoUsuario === 'INTERNO' && item.rol === 'PM' && item.miembroActivo).map(item => ({ id: item.usuarioId, nombre: item.nombre, email: item.email })), complete: result.items.length < 100 };
}
export interface CountryOption extends CatalogOption { codigo: string }
export interface EligibleProjectManager extends CatalogOption { email?: string }
export interface ClientCreateInput { nombre: string }
export type ClientRecord = CatalogOption;
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
