import { useEffect, useRef, useState } from 'react';
import { Link, useNavigation } from '@/navigation';
import { useAccess } from '@/data/access';
import { ApiError } from '@/data/client';
import { workspaceSession, type WorkspaceSummary, type WorkspaceSession } from '@/data/workspaces';
import { listProjects, projectError, PROJECT_PAGE_SIZE, projectListPath, type ProjectSummary } from '@/data/projects';
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout';
import { loadScreen, RouteContent } from '@/components/molecules/route-loader';
import Projects from './Projects';
const Project = loadScreen(() => import('./Project'));
const NewProject = loadScreen(() => import('./ManualForms'));
import '@/design-system/projects.css';

export default function WorkspaceArea({ workspace, session: initialSession }: { workspace: WorkspaceSummary; session: WorkspaceSession }) {
  const { url, navigate } = useNavigation();
  const { signOut } = useAccess();
  const [session, setSession] = useState(initialSession);
  const [rows, setRows] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const request = useRef<AbortController | null>(null);
  const pending = useRef(false);
  const cursor = useRef('0');
  const segments = url.split('?')[0]!.split('/');
  const inProjects = segments[3] === 'proyectos';
  const projectId = segments[4];
  const view = segments[5] ?? 'resumen';
  const filtered = rows.filter(project => project.workspaceId === workspace.id);
  const canCreate = session.permissions.includes('proyectos.crear') && ['ADMIN', 'PM'].includes(session.role ?? '');
  useEffect(() => { setSession(initialSession); }, [initialSession]);
  function authorizationError(status: number) {
    if (status === 401) { void signOut().then(() => navigate('/login', true)).catch(() => setError('La sesión venció. Cierra sesión para volver a ingresar.')); }
    else if (status === 403) void workspaceSession().then(setSession).catch(() => setSession({ ...initialSession, permissions: [] }));
  }
  async function nextPage() {
    if (pending.current) return;
    pending.current = true; setLoading(true); setError('');
    const controller = new AbortController(); request.current = controller;
    try {
      const page = await listProjects(cursor.current, controller.signal);
      if (controller.signal.aborted) return;
      setRows(previous => [...previous, ...page.filter(project => !previous.some(item => item.id === project.id))]);
      cursor.current = page.at(-1)?.id ?? cursor.current;
      setHasMore(page.length === PROJECT_PAGE_SIZE);
    } catch (cause) {
      if (!controller.signal.aborted) { setError(projectError(cause)); if (cause instanceof ApiError) authorizationError(cause.status); }
    } finally { if (!controller.signal.aborted) { pending.current = false; setLoading(false); } }
  }
  useEffect(() => {
    request.current?.abort(); pending.current = false; cursor.current = '0'; setRows([]); setHasMore(false);
    if (inProjects) void nextPage();
    return () => { request.current?.abort(); };
  }, [workspace.id, inProjects, attempt]);
  const refresh = () => setAttempt(value => value + 1);
  return <WorkspaceLayout workspace={workspace} projects={filtered}><RouteContent>{!inProjects ? <><p>Workspace / Inicio</p><h1>Te damos la bienvenida a {workspace.nombre}</h1><p>{workspace.slug}</p><section><h2>Proyectos de tu workspace</h2><p>Consulta los proyectos accesibles para tu sesión.</p><Link className="button button-primary button-md" href={projectListPath(workspace.id)}>Ver proyectos</Link></section></> : projectId === 'nuevo' ? <NewProject workspace={workspace} session={session} onRefresh={refresh} onAuthorizationError={authorizationError} /> : projectId ? <Project projectId={projectId} workspaceId={workspace.id} workspaceName={workspace.nombre} view={view} onAuthorizationError={authorizationError} /> : <Projects workspaceId={workspace.id} rows={filtered} loading={loading} error={error} hasMore={hasMore} canCreate={canCreate} onNext={() => { void nextPage(); }} onRetry={() => { void nextPage(); }} />}</RouteContent></WorkspaceLayout>;
}
