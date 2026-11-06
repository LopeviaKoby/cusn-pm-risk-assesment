import { ProjectCreateForm } from '@/components/organisms/project-create-form';
import { availableProjectCatalogs, createProject, projectListPath, projectPath } from '@/data/projects';
import type { WorkspaceSummary, WorkspaceSession } from '@/data/workspaces';
import { useNavigation } from '@/navigation';
export function NewProject({ workspace, session, onRefresh, onAuthorizationError }: { workspace: WorkspaceSummary; session: WorkspaceSession; onRefresh: () => void; onAuthorizationError: (status: number) => void }) {
  const { navigate } = useNavigation();
  return <ProjectCreateForm workspace={workspace} session={session} catalogs={availableProjectCatalogs} onCreate={createProject} onCreated={project => { onRefresh(); navigate(projectPath(project.workspaceId, project.id)); }} onCancel={() => navigate(projectListPath(workspace.id))} onAuthorizationError={onAuthorizationError} />;
}
export default NewProject;
