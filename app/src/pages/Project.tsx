import { useEffect, useState } from 'react';
import { Button, Spinner } from '@/components/atoms/catalog';
import { Unavailable } from '@/components/molecules/unavailable';
import { ProjectOverview } from '@/components/organisms/project-overview';
import { ProjectLayout } from '@/layouts/ProjectLayout';
import { getProject, startProject, projectPath, projectError, projectViews, type ProjectDetail } from '@/data/projects';
import { ApiError } from '@/data/client';
import {useNavigation} from '@/navigation';
import {ProjectRecord} from '@/components/organisms/project-record';
import {loadScreen, RouteContent} from '@/components/molecules/route-loader';
import '@/design-system/operations.css';
const ProjectBilling = loadScreen(() => import('./ProjectBilling'));
const ProjectDocuments = loadScreen(() => import('./ProjectDocuments'));
export default function Project({ projectId, workspaceId, workspaceName, view, permissions, onAuthorizationError }: { projectId: string; workspaceId: string; workspaceName: string; view: string; permissions: string[]; onAuthorizationError?: (status: number) => void }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const {navigate} = useNavigation();
  const [starting, setStarting] = useState(false), [startError, setStartError] = useState(''), [startDenied, setStartDenied] = useState(false);
  useEffect(() => {if (view === 'finanzas') navigate(projectPath(workspaceId, projectId, 'facturacion'), true);}, [view, workspaceId, projectId]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setProject(null); setError('');
    void getProject(projectId, controller.signal).then(value => {
      if (value.workspaceId !== workspaceId) throw new Error('El proyecto no pertenece al workspace seleccionado.');
      setProject(value);
    }).catch(cause => { if (!controller.signal.aborted) { setError(cause instanceof Error && cause.message.startsWith('El proyecto') ? cause.message : projectError(cause)); if (cause instanceof ApiError && [401, 403].includes(cause.status)) onAuthorizationError?.(cause.status); } });
    return () => controller.abort();
  }, [projectId, workspaceId, attempt]);
  useEffect(() => { if (project) document.title = project.nombre + ' · PMO TIVIT'; }, [project]);
  if (error) return <section role="alert"><h1>Proyecto no disponible</h1><p>{error}</p><Button onClick={() => setAttempt(value => value + 1)}>Reintentar consulta</Button></section>;
  if (!project) return <Spinner label="Cargando proyecto" />;
  const label = projectViews.find(([key]) => key === view)?.[1];
  return <ProjectLayout project={project} workspaceName={workspaceName} view={view}>{project.estado === 'Requiere P1P2' && project.accionesDisponibles.puedeEditarFicha && !startDenied && <Button disabled={starting} loading={starting} onClick={() => {if (starting) return; setStarting(true); setStartError(''); void startProject(project.id, project.version).then(() => setAttempt(value => value + 1)).catch(cause => {setStartError(projectError(cause)); if (cause instanceof ApiError && cause.status === 409) setAttempt(value => value + 1); if (cause instanceof ApiError && cause.status === 403) setStartDenied(true);}).finally(() => setStarting(false));}}>Iniciar ejecución</Button>}{startError && <p role="alert">{startError}</p>}<RouteContent>{view === 'resumen' ? <><ProjectRecord key={project.version} project={project} onReload={() => setAttempt(value => value + 1)}/><ProjectOverview /></> : view === 'facturacion' || view === 'finanzas' ? <ProjectBilling key={project.id} project={project} permissions={permissions}/> : view === 'documentos' ? <ProjectDocuments projectId={project.id}/> : <section className="pmo-section"><h2>{label ?? 'Sección no disponible'}</h2><Unavailable title="Aún no disponible en v2.1.0">Esta sección no dispone de un contrato público de lectura y registro. No hay acciones de escritura habilitadas.</Unavailable></section>}</RouteContent></ProjectLayout>;
}
