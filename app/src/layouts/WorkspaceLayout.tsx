import type { ReactNode } from 'react';
import { LuFolderKanban, LuLayoutDashboard } from 'react-icons/lu';
import { Icon } from '@/components/atoms/catalog';
import type { WorkspaceSummary } from '@/data/workspaces';
import { Link, useNavigation } from '@/navigation';
import { projectListPath, projectPath, type ProjectSummary } from '@/data/projects';

export function WorkspaceLayout({ workspace, projects, children }: { workspace: WorkspaceSummary; projects: ProjectSummary[]; children: ReactNode }) {
  const { url } = useNavigation();
  return <div className="workspace-frame"><aside><strong>{workspace.nombre}</strong><nav aria-label="Workspace"><Link href={`/workspace/${workspace.id}`} aria-current={url === `/workspace/${workspace.id}` ? 'page' : undefined}><Icon glyph={LuLayoutDashboard} /> Inicio</Link><Link href={projectListPath(workspace.id)} aria-current={url === projectListPath(workspace.id) ? 'page' : undefined}><Icon glyph={LuFolderKanban} /> Proyectos</Link><Link href="/workspace">Cambiar workspace</Link></nav>{projects.length > 0 && <nav aria-label="Proyectos recibidos"><small>Proyectos</small>{projects.map(project => <Link href={projectPath(workspace.id, project.id)} aria-current={url.startsWith(`${projectListPath(workspace.id)}/${project.id}/`) ? 'page' : undefined} key={project.id}>{project.tvt} · {project.nombre}</Link>)}</nav>}</aside><main id="contenido" className="workspace-home pmo-content">{children}</main></div>;
}
