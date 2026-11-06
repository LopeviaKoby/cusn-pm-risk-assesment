import { useEffect, useState } from 'react';
import { Button, Spinner } from '@/components/atoms/catalog';
import { Unavailable } from '@/components/molecules/unavailable';
import { ProjectOverview } from '@/components/organisms/project-overview';
import { ProjectLayout } from '@/layouts/ProjectLayout';
import { getProject, projectError, projectViews, type ProjectSummary } from '@/data/projects';
import { ApiError } from '@/data/client';
export default function Project({ projectId, workspaceId, workspaceName, view, onAuthorizationError }: { projectId: string; workspaceId: string; workspaceName: string; view: string; onAuthorizationError?: (status: number) => void }) {
  const [project, setProject] = useState<ProjectSummary | null>(null);
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
  return <ProjectLayout project={project} workspaceName={workspaceName} view={view}>{view === 'resumen' ? <ProjectOverview /> : <section className="pmo-section"><h2>{label ?? 'Sección no disponible'}</h2><Unavailable title="Aún no disponible en v2.1.0">Esta sección no dispone de un contrato público de lectura y registro. No hay acciones de escritura habilitadas.</Unavailable></section>}</ProjectLayout>;
}
