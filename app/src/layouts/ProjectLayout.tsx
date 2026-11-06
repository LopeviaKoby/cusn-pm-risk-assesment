import type { ReactNode } from 'react';
import { Badge } from '@/components/atoms/catalog';
import type { ProjectSummary } from '@/data/projects';
import { projectListPath, projectPath, projectViews, projectStateLabel } from '@/data/projects';
import { Link } from '@/navigation';

export function ProjectLayout({ project, workspaceName, view, children }: { project: ProjectSummary; workspaceName: string; view: string; children: ReactNode }) {
  return <article className="pmo-project">
    <nav className="pmo-breadcrumb" aria-label="Ubicación"><Link href={`/workspace/${project.workspaceId}`}>{workspaceName}</Link><span aria-hidden="true">/</span><Link href={projectListPath(project.workspaceId)}>Proyectos</Link><span aria-hidden="true">/</span><span aria-current="page">{project.tvt}</span></nav>
    <header className="pmo-project-heading"><div><p className="pmo-eyebrow">{project.tvt}</p><h1>{project.nombre}</h1></div><Badge>{projectStateLabel(project.estado)}</Badge></header>
    <dl className="pmo-project-meta">{['Cliente', 'PM titular', 'Clasificación', 'Inicio', 'Término'].map(label => <div key={label}><dt>{label}</dt><dd><span aria-label="Sin datos disponibles">—</span></dd></div>)}</dl>
    <nav className="pmo-project-nav" aria-label="Secciones del proyecto">{projectViews.map(([key, label]) => <Link key={key} href={projectPath(project.workspaceId, project.id, key)} aria-current={view === key ? 'page' : undefined}>{label}</Link>)}</nav>
    {children}
  </article>;
}
