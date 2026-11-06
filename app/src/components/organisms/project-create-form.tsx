import { useRef, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Button, TextInput } from '@/components/atoms/catalog';
import { ApiError } from '@/data/client';
import { projectError, type CatalogOption, type CreatedProject, type NewProjectInput, type ProjectCatalogs } from '@/data/projects';
import { projectCatalogStates, type ClientCreationAccess, type ProjectCatalogStates } from '@/data/project-catalogs';
import { SearchableSelect } from '@/components/molecules/searchable-select';
import { CreateClientDialog } from './create-client-dialog';
import {ProjectPlanningFields, emptyPlanning} from './project-planning-fields';
import type { WorkspaceSummary, WorkspaceSession } from '@/data/workspaces';
import '@/design-system/catalogs.css';

interface Props { workspace: WorkspaceSummary; session: WorkspaceSession; catalogs: ProjectCatalogs | null; catalogStates?: ProjectCatalogStates; clientCreation?: ClientCreationAccess; specialists?: readonly CatalogOption[]; specialistMessage?: string; onClientsMore?: () => void; onCatalogRetry?: (key: keyof ProjectCatalogStates) => void; onCatalogSearch?: (key: 'clientes' | 'titulares', query: string) => void; onCreate: (input: NewProjectInput) => Promise<CreatedProject>; onCreated: (value: CreatedProject) => void; onCancel: () => void; onAuthorizationError?: (status: number) => void }
const idPattern = /^[1-9][0-9]{0,18}$/;
export function ProjectCreateForm({ workspace, session, catalogs, catalogStates, clientCreation, specialists, specialistMessage, onClientsMore, onCatalogRetry, onCatalogSearch, onCreate, onCreated, onCancel, onAuthorizationError }: Props) {
  const [values, setValues] = useState({ tvt: '', nombre: '', clienteId: '', paisId: '', lobId: '', pmTitularId: '' });
  const [planning, setPlanning] = useState(emptyPlanning);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const clientTrigger = useRef<HTMLButtonElement>(null);
  const [clientDraft, setClientDraft] = useState<string | null>(null);
  const [createdClients, setCreatedClients] = useState<CatalogOption[]>([]);
  const chosenRecords = useRef(new Map<string, string>());
  const [clientFeedback, setClientFeedback] = useState('');
  const reduceMotion = useReducedMotion();
  const admin = session.role === 'ADMIN';
  const allowed = session.permissions.includes('proyectos.crear') && (admin || session.role === 'PM');
  const sources = catalogStates ?? projectCatalogStates(catalogs);
  const clients = [...new Map([...sources.clientes.options, ...createdClients].map(client => [client.id, client])).values()];
  const ready = sources.clientes.status === 'ready' && (clients.some(item => item.id === values.clienteId) || chosenRecords.current.get('clienteId') === values.clienteId)
    && sources.paises.status === 'ready' && sources.paises.options.some(item => item.id === values.paisId)
    && sources.lobs.status === 'ready' && sources.lobs.options.some(item => item.id === values.lobId)
    && (!admin || sources.titulares.status === 'ready' && (sources.titulares.options.some(item => item.id === values.pmTitularId) || chosenRecords.current.get('pmTitularId') === values.pmTitularId));
  const missingSources = [sources.clientes, sources.paises, sources.lobs, ...(admin ? [sources.titulares] : [])].some(source => source.status !== 'ready');
  function change(key: keyof typeof values, value: string) { chosenRecords.current.set(key, value); setValues(previous => ({ ...previous, [key]: value })); setFields(previous => ({ ...previous, [key]: '' })); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || !ready || !allowed) return;
    const next: Record<string, string> = {};
    if (!values.tvt.trim() || values.tvt.trim().length > 80) next.tvt = 'Ingresa un TVT de 1 a 80 caracteres.';
    if (!values.nombre.trim() || values.nombre.trim().length > 200) next.nombre = 'Ingresa un nombre de 1 a 200 caracteres.';
    for (const key of ['clienteId', 'paisId', 'lobId', ...(admin ? ['pmTitularId'] : [])] as const) {
      if (!idPattern.test(values[key as keyof typeof values])) next[key] = 'Selecciona una opción válida.';
    }
    if (!planning.fechaInicio) next.fechaInicio = 'Selecciona el inicio planificado.';
    if (!planning.fechaTerminoBaseline || planning.fechaTerminoBaseline < planning.fechaInicio) next.fechaTerminoBaseline = 'El término baseline debe ser igual o posterior al inicio.';
    if (planning.tcvTipo === 'DEFINIDO' && (!/^[0-9]{1,16}(\.[0-9]{1,4})?$/.test(planning.tcvValor) || !/^[A-Z]{3}$/.test(planning.unidadCodigo))) next.condicionComercial = 'Ingresa un importe decimal válido y código de moneda de 3 letras.';
    if (planning.unidadCodigo && !/^[A-Z]{3}$/.test(planning.unidadCodigo)) next.unidadCodigo = 'Usa un código de 3 letras mayúsculas.';
    setFields(next); if (Object.keys(next).length) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const created = await onCreate({ workspaceId: workspace.id, fechaInicio: planning.fechaInicio, fechaTerminoBaseline: planning.fechaTerminoBaseline, fechaRecepcionP1p2: planning.fechaRecepcionP1p2 || null, descripcion: planning.descripcion.trim() || null, situacionInicial: planning.situacionInicial.trim() || null, especialistaIds: planning.especialistaIds, condicionComercial: {tcvTipo: planning.tcvTipo, tcvValor: planning.tcvTipo === 'ILIMITADO' ? null : planning.tcvValor, unidadCodigo: planning.unidadCodigo || null}, tvt: values.tvt, nombre: values.nombre, clienteId: values.clienteId, paisId: values.paisId, lobId: values.lobId, ...(admin ? { pmTitularId: values.pmTitularId } : {}) });
      onCreated(created);
    } catch (cause) {
      setError(projectError(cause));
      if (cause instanceof ApiError) { setFields(cause.fields ?? {}); if (cause.status === 401 || cause.status === 403) onAuthorizationError?.(cause.status); }
    } finally { pending.current = false; setBusy(false); }
  }
  const selects = [
    { key: 'clienteId', label: 'Cliente', source: sources.clientes, options: clients, search: 'Buscar cliente…' },
    { key: 'paisId', label: 'País', source: sources.paises, options: sources.paises.options, search: 'Buscar país…' },
    { key: 'lobId', label: 'LOB', source: sources.lobs, options: sources.lobs.options, search: 'Buscar LOB…' },
    ...(admin ? [{ key: 'pmTitularId' as const, label: 'PM titular', source: sources.titulares, options: sources.titulares.options, search: 'Buscar PM titular…' }] : []),
  ] as const;
  return <motion.section className="pmo-create" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .16 }}>
    <header><p className="pmo-eyebrow">Alta de proyecto</p><h1>Nuevo proyecto</h1><p>Workspace: <strong>{workspace.nombre}</strong></p></header>
    {missingSources && <div className="pmo-notice" id="catalog-blocker" role="status"><strong>Algunos catálogos no están disponibles</strong><p>Puedes completar los campos habilitados. Para crear el proyecto necesitas seleccionar todos los registros obligatorios.</p></div>}
    {!allowed && <p role="alert">Tu sesión no tiene permiso para crear proyectos.</p>}
    <form onSubmit={event => { void submit(event); }} noValidate>
      <fieldset disabled={busy}><legend>Identificación y responsables</legend><div className="pmo-form-grid">
        {(['tvt', 'nombre'] as const).map(key => <label key={key} htmlFor={`project-${key}`}>{key === 'tvt' ? 'TVT *' : 'Nombre del proyecto *'}<TextInput id={`project-${key}`} name={key} required maxLength={key === 'tvt' ? 80 : 200} value={values[key]} onChange={event => change(key, event.target.value)} error={!!fields[key]} aria-describedby={fields[key] ? `error-${key}` : undefined} /><span id={`error-${key}`} className="form-error">{fields[key]}</span></label>)}
        {selects.map(({ key, label, source, options, search }) => {
          const feedback = source.message ?? (source.status === 'unavailable' ? 'El catálogo no está disponible. Inténtalo más tarde.' : source.status === 'forbidden' ? 'No tienes acceso a este catálogo.' : source.status === 'loading' ? 'Consultando opciones…' : source.status === 'error' ? 'No pudimos consultar el catálogo. Reintenta cuando tengas conexión.' : source.status === 'idle' ? 'La consulta todavía no se ha realizado.' : source.complete ? undefined : 'Este catálogo tiene resultados parciales.');
          return <SearchableSelect key={key} id={`project-${key}`} label={label} required value={values[key]} options={options.map(option => ({ value: option.id, label: option.nombre, detail: key === 'clienteId' ? ((('estadoCliente' in option && option.estadoCliente) || 'Sin clasificación') + ' · ID ' + option.id) : 'codigo' in option && typeof option.codigo === 'string' ? option.codigo : 'email' in option && typeof option.email === 'string' ? option.email : undefined }))} onChange={value => change(key, value)} status={source.status === 'unavailable' || source.status === 'forbidden' ? 'disabled' : source.status} disabled={busy} error={fields[key]} message={feedback} complete={source.complete} searchLabel={search} filterMode={onCatalogSearch && (key === 'clienteId' || key === 'pmTitularId') ? 'remote' : 'local'} onQueryChange={onCatalogSearch && (key === 'clienteId' || key === 'pmTitularId') ? query => onCatalogSearch(key === 'clienteId' ? 'clientes' : 'titulares', query) : undefined} emptyMessage={key === 'pmTitularId' ? 'No hay PM elegibles' : 'No hay coincidencias'} triggerRef={key === 'clienteId' ? clientTrigger : undefined} onRetry={onCatalogRetry ? () => onCatalogRetry(key === 'clienteId' ? 'clientes' : key === 'paisId' ? 'paises' : key === 'lobId' ? 'lobs' : 'titulares') : undefined} renderEmptyAction={key === 'clienteId' && clientCreation?.authorized && clientCreation.create ? ({ query, close }) => <Button variant="ghost" className="catalog-add-link" onClick={() => { close(); setClientDraft(query); }}>Agregar registro</Button> : undefined} />;
        })}
      </div>{!sources.clientes.complete && onClientsMore && <Button disabled={sources.clientes.status === 'loading'} onClick={onClientsMore}>Cargar más clientes</Button>}{!admin && <p className="pmo-help">Se asignará tu usuario como PM titular si estás habilitado en este workspace.</p>}</fieldset>
      {clientFeedback && <p role="status">{clientFeedback}</p>}
      <ProjectPlanningFields value={planning} onChange={setPlanning} errors={fields} specialists={specialists} specialistMessage={specialistMessage}/>
      {error && <p role="alert" className="form-error">{error}</p>}
      <footer><Button disabled={busy} onClick={onCancel}>Cancelar</Button><Button variant="primary" type="submit" loading={busy} disabled={!ready || !allowed} aria-describedby={!ready ? 'catalog-blocker' : undefined}>Crear proyecto</Button></footer>
    </form>
    {clientDraft !== null && <CreateClientDialog initialName={clientDraft} create={clientCreation?.authorized ? clientCreation.create : undefined} onCreated={client => { setCreatedClients(previous => [...previous.filter(item => item.id !== client.id), client]); change('clienteId', client.id); setClientFeedback(`Cliente ${client.nombre} seleccionado.`); setClientDraft(null); void Promise.resolve().then(() => clientCreation?.refresh?.()).catch(() => setClientFeedback(`Cliente ${client.nombre} seleccionado. No pudimos actualizar el catálogo.`)); }} onCancel={() => setClientDraft(null)} onRestoreFocus={() => clientTrigger.current?.focus()} onRefresh={clientCreation?.refresh} onAuthorizationError={onAuthorizationError} />}
  </motion.section>;
}
