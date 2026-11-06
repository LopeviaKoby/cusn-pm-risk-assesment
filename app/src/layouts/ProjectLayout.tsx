import type { ReactNode } from 'react';
import { Badge } from '@/components/atoms/catalog';
import type { ProjectDetail } from '@/data/projects';
import { projectListPath, projectPath, projectViews, projectStateLabel } from '@/data/projects';
import { Link, useNavigation, safeReturn } from '@/navigation';

export function ProjectLayout({ project, workspaceName, view, children }: { project: ProjectDetail; workspaceName: string; view: string; children: ReactNode }) {
  const {url} = useNavigation(); const list = new URLSearchParams(url.split('?')[1]).get('lista');
  return <article className="pmo-project">{list && <Link href={safeReturn(list, '/portafolio')}>Volver al portafolio</Link>}
    <nav className="pmo-breadcrumb" aria-label="Ubicación"><Link href={`/workspace/${project.workspaceId}`}>{workspaceName}</Link><span aria-hidden="true">/</span><Link href={projectListPath(project.workspaceId)}>Proyectos</Link><span aria-hidden="true">/</span><span aria-current="page">{project.tvt}</span></nav>
    <header className="pmo-project-heading"><div><p className="pmo-eyebrow">{project.tvt}</p><h1>{project.nombre}</h1></div><Badge>{projectStateLabel(project.estado)}</Badge></header>
    <dl className="pmo-project-meta">{Object.entries({Cliente: project.identidad.cliente.nombre, 'PM titular': project.gobierno.titular.nombre, Clasificación: project.identidad.cliente.estadoCliente ?? 'Sin clasificación', 'Inicio planificado': project.planificacion.fechaInicio, 'Inicio real': project.planificacion.fechaInicioReal, 'Término baseline': project.planificacion.fechaTerminoBaseline}).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? 'Sin datos disponibles'}</dd></div>)}</dl>
    <nav className="pmo-project-nav" aria-label="Secciones del proyecto">{projectViews.map(([key, label]) => <Link key={key} href={projectPath(project.workspaceId, project.id, key)} aria-current={view === key ? 'page' : undefined}>{label}</Link>)}</nav>
    {children}
  </article>;
}
