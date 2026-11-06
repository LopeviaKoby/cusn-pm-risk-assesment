import {ContextPanel} from '@/components/molecules/context-panel';
import {ProjectRecord} from './project-record';
import {Link} from '@/navigation';
import {projectPath, type ProjectDetail} from '@/data/projects';
export function ProjectPeek({project, error, origin, onClose, onReload}: {project: ProjectDetail | null; error: string; origin: string; onClose: () => void; onReload: () => void}) {
  const href = (view: string) => projectPath(project!.workspaceId, project!.id, view) + '?lista=' + encodeURIComponent(origin);
  return <ContextPanel title={project ? `${project.tvt} · ${project.nombre}` : 'Ficha de proyecto'} description="Vista contextual; la lista conserva filtros, tab y desplazamiento." onClose={onClose}>{error ? <p role="alert">{error}</p> : !project ? <p role="status">Consultando ficha…</p> : <><p>{project.estado}</p><p>Cliente: {project.identidad.cliente.nombre} · {project.identidad.cliente.estadoCliente ?? 'Sin clasificación'}</p><p>PM: {project.gobierno.titular.nombre}</p><ProjectRecord key={project.version} project={project} onReload={onReload}/><nav aria-label="Ampliar proyecto"><Link href={href('resumen')}>Ampliar / Ver proyecto</Link><Link href={href('facturacion')}>Facturación</Link><Link href={href('documentos')}>Documentos</Link></nav></>}</ContextPanel>;
}
