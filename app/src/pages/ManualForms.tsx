import { ProjectCreateForm } from '@/components/organisms/project-create-form';
import { createProject, projectListPath, projectPath } from '@/data/projects';
import type { WorkspaceSummary, WorkspaceSession } from '@/data/workspaces';
import { useNavigation } from '@/navigation';
import { useProjectCatalogs } from '@/data/use-project-catalogs';
import {createClient, getEligibleManagers} from '@/data/project-catalogs';
import {useResource} from '@/data/use-resource';
export function NewProject({ workspace, session, onRefresh, onAuthorizationError }: { workspace: WorkspaceSummary; session: WorkspaceSession; onRefresh: () => void; onAuthorizationError: (status: number) => void }) {
  const { navigate } = useNavigation();
  const catalogs = useProjectCatalogs(workspace.id, session.role === 'ADMIN', onAuthorizationError);
  const specialists = useResource(signal => getEligibleManagers(workspace.id, '', signal, 'ESPECIALISTA'), [workspace.id]);
  return <ProjectCreateForm workspace={workspace} session={session} catalogs={null} catalogStates={catalogs.sources} specialists={specialists.data?.options} specialistMessage={specialists.loading ? 'Consultando especialistas elegibles…' : specialists.error || (!specialists.data?.complete ? 'Resultados de especialistas parciales; el servidor limita la consulta a 100.' : undefined)} onClientsMore={catalogs.moreClients} clientCreation={{authorized: ['ADMIN', 'PM'].includes(session.role ?? '') && session.permissions.includes('clientes.crear'), create: createClient, refresh: catalogs.retry}} onCatalogSearch={catalogs.search} onCatalogRetry={catalogs.retry} onCreate={createProject} onCreated={project => { onRefresh(); navigate(projectPath(project.workspaceId, project.id)); }} onCancel={() => navigate(projectListPath(workspace.id))} onAuthorizationError={onAuthorizationError} />;
}
export default NewProject;
