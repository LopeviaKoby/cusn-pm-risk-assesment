import { api } from './client';

export interface WorkspaceSummary { id: string; nombre: string; slug: string; version: string }
export interface WorkspaceSession { identifier: string; expiresAt: string; role: string | null; permissions: string[] }
export const workspacePath = (id: string) => `/workspace/${encodeURIComponent(id)}`;
export const listWorkspaces = () => api<WorkspaceSummary[]>('/api/v1/workspaces');
export const workspaceSession = () => api<WorkspaceSession>('/api/v1/sesion');
export function createWorkspace(nombre: string) {
  return api<WorkspaceSummary>('/api/v1/workspaces', { method: 'POST', body: JSON.stringify({ nombre: nombre.trim() }) });
}
