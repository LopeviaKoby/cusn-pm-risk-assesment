import { ProjectCreateForm } from '@/components/organisms/project-create-form';
import { createProject, projectListPath, projectPath } from '@/data/projects';
import type { WorkspaceSummary, WorkspaceSession } from '@/data/workspaces';
import { useNavigation } from '@/navigation';
import { useProjectCatalogs } from '@/data/use-project-catalogs';
export function NewProject({ workspace, session, onRefresh, onAuthorizationError }: { workspace: WorkspaceSummary; session: WorkspaceSession; onRefresh: () => void; onAuthorizationError: (status: number) => void }) {
  const { navigate } = useNavigation();
  const catalogs = useProjectCatalogs(workspace.id, session.role === 'ADMIN', onAuthorizationError);
  return <ProjectCreateForm workspace={workspace} session={session} catalogs={null} catalogStates={catalogs.sources} onCatalogSearch={catalogs.search} onCatalogRetry={catalogs.retry} onCreate={createProject} onCreated={project => { onRefresh(); navigate(projectPath(project.workspaceId, project.id)); }} onCancel={() => navigate(projectListPath(workspace.id))} onAuthorizationError={onAuthorizationError} />;
}
export default NewProject;
