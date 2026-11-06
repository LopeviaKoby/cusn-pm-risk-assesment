import '@/design-system/operations.css';
import { Button } from '@/components/atoms/catalog';
import { Link } from '@/navigation';
import { projectPath, projectListPath, projectStateLabel, type ProjectSummary } from '@/data/projects';
export default function Projects({ workspaceId, rows, loading, error, hasMore, canCreate, onNext, onRetry }: { workspaceId: string; rows: ProjectSummary[]; loading: boolean; error: string; hasMore: boolean; canCreate: boolean; onNext: () => void; onRetry: () => void }) {
  return <section className="pmo-project-list"><header><div><p className="pmo-eyebrow">Workspace</p><h1>Proyectos</h1><p>Proyectos accesibles recibidos para este workspace.</p></div>{canCreate && <Link className="button button-primary button-md" href={projectListPath(workspaceId) + '/nuevo'}>Nuevo proyecto</Link>}</header>
    {error && <div role="alert"><p>{error}</p><Button onClick={onRetry}>Reintentar consulta</Button></div>}
    {!loading && !error && !rows.length && <p role="status">{hasMore ? 'No hay proyectos de este workspace en las páginas recibidas. Puedes consultar la siguiente página.' : 'No hay proyectos accesibles de este workspace en las páginas consultadas.'}</p>}
    <div className="pmo-dense-region" role="region" aria-label="Proyectos del workspace" tabIndex={0}><table className="pmo-dense-table"><thead><tr><th scope="col">TVT</th><th scope="col">Proyecto</th><th scope="col">Estado</th></tr></thead><tbody>{rows.map(project => <tr key={project.id}><th scope="row">{project.tvt}</th><td><Link href={projectPath(workspaceId, project.id)}>{project.nombre}</Link></td><td>{projectStateLabel(project.estado)}</td></tr>)}</tbody></table></div>
    {loading && <p role="status">Consultando proyectos…</p>}
    {hasMore && <Button disabled={loading} onClick={onNext}>Cargar siguiente página</Button>}
    <p className="pmo-help">Listado paginado del alcance de tu sesión, filtrado por workspace. No representa un total consolidado del portafolio.</p>
  </section>;
}
