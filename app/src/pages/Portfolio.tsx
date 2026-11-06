import {lazy, Suspense, useEffect, useState} from 'react';
import {Button, Checkbox, TextInput} from '@/components/atoms/catalog';
import {PortfolioTable} from '@/components/organisms/portfolio-table';
import {ProjectPeek} from '@/components/organisms/project-peek';
import {PortfolioLayout} from '@/layouts/PortfolioLayout';
import {ApiError} from '@/data/client';
import {getProject, editProject, projectError, type ProjectDetail} from '@/data/projects';
import {getProjectCatalogs} from '@/data/project-catalogs';
import {listWorkspaces, workspaceSession} from '@/data/workspaces';
import {listPortfolio} from '@/data/project-modules';
import {useResource} from '@/data/use-resource';
import {useNavigation} from '@/navigation';
const Analytics = lazy(() => import('@/components/organisms/portfolio-analytics'));
const states = ['Requiere P1P2', 'En ejecución', 'En transición', 'Detenido', 'Cancelado', 'Cerrado exitoso', 'Cerrado con observaciones'];
const filterKeys = ['q', 'workspaceId', 'paisId', 'lobId', 'squadId', 'clienteId', 'pmTitularId', 'estado', 'incluirInactivos', 'ordenarPor', 'direccion', 'offset'];
export default function Portfolio() {
  const {url, navigate} = useNavigation();
  const sessionResource = useResource(() => workspaceSession(), []);
  const session = sessionResource.data;
  const params = new URLSearchParams(url.split('?')[1]); const query = new URLSearchParams();
  for (const key of filterKeys) if (params.has(key)) query.set(key, params.get(key)!);
  if (session?.role !== 'ADMIN') query.delete('incluirInactivos');
  query.set('limit', '50');
  const requestKey = query.toString();
  const listing = useResource(signal => listPortfolio(new URLSearchParams(requestKey), undefined, signal), [requestKey]);
  const peek = params.get('peek'); const detail = useResource(signal => peek && /^[1-9][0-9]{0,18}$/.test(peek) ? getProject(peek, signal) : Promise.resolve(null), [peek]);
  const catalogs = useResource(signal => getProjectCatalogs('', signal), []), workspaces = useResource(() => listWorkspaces(), []);
  const [error, setError] = useState(''), [denied, setDenied] = useState<string[]>([]);
  const [lastDetail, setLastDetail] = useState<ProjectDetail | null>(null);
  useEffect(() => {if (detail.data) setLastDetail(detail.data);}, [detail.data]);
  function set(key: string, value: string, reset = true) {const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); if (reset) {next.delete('offset'); next.delete('peek');} navigate('/portafolio' + (next.size ? '?' + next : ''), key === 'q');}
  function sort(key: string, direction: 'asc' | 'desc') {const next = new URLSearchParams(params); next.set('ordenarPor', key); next.set('direccion', direction); next.delete('offset'); next.delete('peek'); navigate('/portafolio?' + next);}
  const data = listing.data;
  const options = (key: 'squad' | 'titular') => [...new Map((data?.items ?? []).flatMap(row => row[key] ? [[key === 'titular' ? row.titular.usuarioId : row.squad!.id, row[key]!.nombre] as const] : [])).entries()];
  const select = (key: string, label: string, values: readonly (readonly [string, string])[]) => <label>{label}<select value={params.get(key) ?? ''} onChange={event => set(key, event.target.value)}><option value="">Todos</option>{values.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
  const filters = {
    Estado: select('estado', 'Filtrar estado', states.map(value => [value, value])),
    Workspace: select('workspaceId', 'Filtrar workspace', workspaces.data?.map(item => [item.id, item.nombre]) ?? []),
    País: select('paisId', 'Filtrar país', catalogs.data?.paises.map(item => [item.id, item.nombre]) ?? []),
    LOB: select('lobId', 'Filtrar LOB', catalogs.data?.lobs.map(item => [item.id, item.nombre]) ?? []),
    Cliente: select('clienteId', 'Filtrar cliente (resultados recibidos)', catalogs.data?.clientes.map(item => [item.id, `${item.nombre} · ${item.id}`]) ?? []),
    Squad: select('squadId', 'Filtrar Squad (página actual)', options('squad')),
    'PM titular': select('pmTitularId', 'Filtrar PM (página actual)', options('titular')),
  };
  const origin = new URLSearchParams(params); origin.delete('peek');
  async function saveName(project: ProjectDetail, name: string) {try {await editProject(project.id, {nombre: name, version: project.version}); listing.reload(); detail.reload();} catch (cause) {if (cause instanceof ApiError && cause.status === 403) setDenied(previous => [...previous, project.id]); throw new Error(projectError(cause));}}
  return <PortfolioLayout identifier={session?.identifier} onError={cause => setError(projectError(cause))}><header className="pmo-project-heading"><div><p className="pmo-eyebrow">PMO TIVIT</p><h1>Portafolio</h1></div><Button onClick={listing.reload}>Actualizar portafolio</Button></header><nav aria-label="Vistas del portafolio" className="pmo-project-nav">{[['lista', 'Lista operativa'], ['tablero', 'Tablero analítico PMO']].map(([key, label]) => <Button key={key} variant={params.get('tab') === key || key === 'lista' && !params.has('tab') ? 'secondary' : 'ghost'} aria-current={(params.get('tab') ?? 'lista') === key ? 'page' : undefined} onClick={() => set('tab', key!, false)}>{label}</Button>)}</nav>
    <div className="pmo-toolbar"><label>Buscar en portafolio<TextInput type="search" maxLength={120} value={params.get('q') ?? ''} onChange={event => set('q', event.target.value)}/></label>{filters.Workspace}{filters.Estado}{session?.role === 'ADMIN' && <label className="pmo-check-row"><Checkbox checked={params.get('incluirInactivos') === 'true'} onChange={event => set('incluirInactivos', event.target.checked ? 'true' : '')}/>Incluir inactivos</label>}<Button onClick={() => navigate('/portafolio' + (params.get('tab') ? '?tab=' + params.get('tab') : ''))}>Limpiar filtros</Button></div>
    <div className="pmo-filter-chips">{filterKeys.filter(key => params.has(key) && !['offset', 'ordenarPor', 'direccion'].includes(key)).map(key => <Button size="sm" key={key} onClick={() => set(key, '')}>Quitar {key}: {params.get(key)}</Button>)}</div><p className="pmo-help">Orden servidor: {params.get('ordenarPor') ?? 'id'} / {params.get('direccion') ?? 'asc'}. Los filtros de columnas se abren en sus cabeceras. Opciones de Squad y PM provienen solo de la página recibida; el filtro por su ID se aplica al universo servidor.</p>{(error || listing.error || sessionResource.error) && <p role="alert">{error || listing.error || sessionResource.error}</p>}{listing.loading && <p role="status">Consultando portafolio…</p>}
    {data && <><dl className="pmo-kpis pmo-portfolio-kpis"><div><dt>Total filtrado</dt><dd>{data.resumenPorEstado.total}</dd></div>{Object.entries(data.resumenPorEstado.porEstado).slice(0,6).map(([state, count]) => <div key={state}><dt><Button variant="ghost" onClick={() => set('estado', state)}>{state}</Button></dt><dd>{count}</dd></div>)}<div><dt>Otros estados</dt><dd>{Object.entries(data.resumenPorEstado.porEstado).slice(6).reduce((sum, entry) => sum + entry[1], 0)}</dd><details><summary>Ver estados restantes</summary>{Object.entries(data.resumenPorEstado.porEstado).slice(6).map(([state, count]) => <Button key={state} variant="ghost" onClick={() => set('estado', state)}>{state}: {count}</Button>)}</details></div><div><dt>SPI promedio</dt><dd>Sin datos</dd></div></dl>{params.get('tab') === 'tablero' ? <Suspense fallback={<p>Cargando visualización…</p>}><Analytics data={data} onState={state => set('estado', state)}/></Suspense> : <PortfolioTable rows={data.items} onPeek={id => set('peek', id, false)} onSort={sort} detail={lastDetail && !denied.includes(lastDetail.id) ? lastDetail : null} onSaveName={saveName} onReloadDetail={detail.reload} filters={filters}/>}<div className="pmo-toolbar"><Button disabled={!data.paginacion.offset} onClick={() => set('offset', String(Math.max(0, data.paginacion.offset - data.paginacion.limit)), false)}>Página anterior</Button><span>Página recibida: {data.items.length} de {data.paginacion.total}</span><Button disabled={!data.paginacion.hasMore || data.paginacion.nextOffset === null} onClick={() => set('offset', String(data.paginacion.nextOffset), false)}>Página siguiente</Button></div></>}
    {peek && <ProjectPeek project={detail.data} error={detail.error} origin={'/portafolio' + (origin.size ? '?' + origin : '')} onClose={() => set('peek', '', false)} onReload={() => {detail.reload(); listing.reload();}}/>}
  </PortfolioLayout>;
}
