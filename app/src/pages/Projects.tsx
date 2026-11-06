import { Button } from '@/components/atoms/catalog';
import { Link } from '@/navigation';
import { projectPath, projectListPath, projectStateLabel, type ProjectSummary } from '@/data/projects';
export default function Projects({ workspaceId, rows, loading, error, hasMore, canCreate, onNext, onRetry }: { workspaceId: string; rows: ProjectSummary[]; loading: boolean; error: string; hasMore: boolean; canCreate: boolean; onNext: () => void; onRetry: () => void }) {
  return <section className="pmo-project-list"><header><div><p className="pmo-eyebrow">Workspace</p><h1>Proyectos</h1><p>Proyectos accesibles recibidos para este workspace.</p></div>{canCreate && <Link className="button button-primary button-md" href={projectListPath(workspaceId) + '/nuevo'}>Nuevo proyecto</Link>}</header>
    {error && <div role="alert"><p>{error}</p><Button onClick={onRetry}>Reintentar consulta</Button></div>}
    {!loading && !error && !rows.length && <p role="status">{hasMore ? 'No hay proyectos de este workspace en las páginas recibidas. Puedes consultar la siguiente página.' : 'No hay proyectos accesibles de este workspace en las páginas consultadas.'}</p>}
    <ul className="pmo-project-cards">{rows.map(project => <li key={project.id}><Link href={projectPath(workspaceId, project.id)}><span>{project.tvt}</span><strong>{project.nombre}</strong><small>{projectStateLabel(project.estado)}</small></Link></li>)}</ul>
    {loading && <p role="status">Consultando proyectos…</p>}
    {hasMore && <Button disabled={loading} onClick={onNext}>Cargar siguiente página</Button>}
    <p className="pmo-help">Listado paginado del alcance de tu sesión, filtrado por workspace. No representa un total consolidado del portafolio.</p>
  </section>;
}
