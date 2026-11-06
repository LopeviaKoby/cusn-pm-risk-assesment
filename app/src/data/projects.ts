import { api, ApiError } from './client';

export interface ProjectSummary { id: string; tvt: string; nombre: string; workspaceId: string; version: string; estado: string }
export type CreatedProject = Omit<ProjectSummary, 'estado'>;
export interface CommercialCondition { tcvTipo: 'DEFINIDO' | 'ILIMITADO'; tcvValor: string | null; unidadCodigo: string | null }
export interface NewProjectInput { workspaceId: string; tvt: string; nombre: string; clienteId: string; paisId: string; lobId: string; pmTitularId?: string; condicionComercial: CommercialCondition; fechaInicio: string; fechaTerminoBaseline: string; fechaRecepcionP1p2?: string | null; descripcion?: string | null; situacionInicial?: string | null; squadId?: string | null; especialistaIds?: string[] }
export interface ProjectDetail extends ProjectSummary {
  identidad: { id: string; tvt: string; nombre: string; descripcion: string | null; situacionInicial: string | null; activo: boolean; workspace: CatalogOption & {slug: string}; cliente: CatalogOption & {estadoCliente: 'NUEVO' | 'ANTIGUO' | null}; pais: CatalogOption & {codigo: string}; lob: CatalogOption; squad: CatalogOption | null; referenciasInternas: {sap: string | null; ceco: string | null; pep: string | null} | null };
  gobierno: { titular: {usuarioId: string; nombre: string; email: string | null}; participantes: {id: string; usuarioId: string; nombre: string; funcion: string; fechaInicio: string}[]; suplenciaEfectiva: {permisos: string[]} | null; createdAt: string; updatedAt: string };
  planificacion: {fechaRecepcionP1p2: string | null; fechaInicio: string | null; fechaInicioReal: string | null; fechaTerminoBaseline: string | null; fechaTerminoActual: string | null; baselineCongelada: boolean};
  condicionComercial: CommercialCondition | null;
  accionesDisponibles: {puedeEditarFicha: boolean; puedeFijarBaseline: boolean; puedeTransferir: boolean; puedeGestionarParticipantes: boolean; puedeDesignarSuplencia: boolean; puedeRevocarSuplencia: boolean};
}
export interface ProjectEdit { version: string; nombre?: string; descripcion?: string | null; situacionInicial?: string | null; squadId?: string | null; fechaRecepcionP1p2?: string | null; referenciaSap?: string | null; referenciaCeco?: string | null; referenciaPep?: string | null }
export interface CatalogOption { id: string; nombre: string }
export interface ProjectCatalogs { clientes: CatalogOption[]; paises: CatalogOption[]; lobs: CatalogOption[]; titulares: CatalogOption[] }
export const projectViews = [
  ['resumen', 'Resumen'], ['seguimiento', 'Seguimiento'], ['facturacion', 'Facturación'], ['riesgos', 'Riesgos'],
  ['cambios', 'Cambios'], ['compras', 'Compras'], ['documentos', 'Documentos'], ['historial', 'Historial'],
] as const;
const lifecycle: Record<string, string> = { 'p1p2-required': 'Requiere P1P2', 'in-progress': 'En ejecución', 'in-handover': 'En transición', 'on-hold': 'Detenido', cancelled: 'Cancelado', 'closed-successfully': 'Cerrado exitoso', 'closed-with-observations': 'Cerrado con observaciones' };
export const projectStateLabel = (value: string) => lifecycle[value] ?? value;
export const projectListPath = (workspaceId: string) => `/workspace/${encodeURIComponent(workspaceId)}/proyectos`;
export const projectPath = (workspaceId: string, id: string, view = 'resumen') => `${projectListPath(workspaceId)}/${encodeURIComponent(id)}/${view}`;
export const PROJECT_PAGE_SIZE = 50;
export async function listProjects(after = '0', signal?: AbortSignal, workspaceId?: string) {
  if (workspaceId) {
    const page = await api<{items: {id: string; tvt: string; nombre: string; version: string; estado: string}[]}>(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/proyectos?after=${after}&limit=${PROJECT_PAGE_SIZE}`, {signal});
    return page.items.map(item => ({id: item.id, tvt: item.tvt, nombre: item.nombre, version: item.version, estado: item.estado, workspaceId}));
  }
  return api<ProjectSummary[]>(`/api/v1/proyectos?after=${encodeURIComponent(after)}&limit=${PROJECT_PAGE_SIZE}`, { signal });
}
export const getProject = (id: string, signal?: AbortSignal) => api<ProjectDetail>(`/api/v1/proyectos/${encodeURIComponent(id)}`, { signal });
export const editProject = (id: string, input: ProjectEdit) => api<CreatedProject>(`/api/v1/proyectos/${encodeURIComponent(id)}`, {method: 'PATCH', body: JSON.stringify(input)});
export const startProject = (id: string, version: string) => api<CreatedProject>(`/api/v1/proyectos/${encodeURIComponent(id)}/inicio`, {method: 'POST', body: JSON.stringify({version})});
export function createProject(input: NewProjectInput) {
  return api<ProjectDetail>('/api/v1/proyectos', { method: 'POST', body: JSON.stringify({...input, tvt: input.tvt.trim(), nombre: input.nombre.trim()}) });
}
export function projectError(cause: unknown) {
  if (!(cause instanceof ApiError)) return 'Se perdió la conexión. No se reintentó la operación automáticamente. Comprueba el listado antes de volver a crear.';
  const labels: Record<number, string> = { 401: 'Sesión vencida', 403: 'Acceso denegado', 404: 'Recurso no disponible', 409: 'Conflicto', 422: 'Datos no válidos' };
  return `${labels[cause.status] ?? (cause.status >= 500 ? 'Servicio no disponible' : 'Error de solicitud')}: ${cause.message}`;
}
