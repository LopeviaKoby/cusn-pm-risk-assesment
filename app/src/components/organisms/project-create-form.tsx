import { useRef, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Button, TextInput } from '@/components/atoms/catalog';
import { ApiError } from '@/data/client';
import { projectError, type CatalogOption, type CreatedProject, type NewProjectInput, type ProjectCatalogs } from '@/data/projects';
import type { WorkspaceSummary, WorkspaceSession } from '@/data/workspaces';

interface Props { workspace: WorkspaceSummary; session: WorkspaceSession; catalogs: ProjectCatalogs | null; onCreate: (input: NewProjectInput) => Promise<CreatedProject>; onCreated: (value: CreatedProject) => void; onCancel: () => void; onAuthorizationError?: (status: number) => void }
const idPattern = /^[1-9][0-9]{0,18}$/;
export function ProjectCreateForm({ workspace, session, catalogs, onCreate, onCreated, onCancel, onAuthorizationError }: Props) {
  const [values, setValues] = useState({ tvt: '', nombre: '', clienteId: '', paisId: '', lobId: '', pmTitularId: '' });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const reduceMotion = useReducedMotion();
  const admin = session.role === 'ADMIN';
  const allowed = session.permissions.includes('proyectos.crear') && (admin || session.role === 'PM');
  const ready = !!catalogs?.clientes.length && !!catalogs.paises.length && !!catalogs.lobs.length && (!admin || !!catalogs.titulares.length);
  function change(key: keyof typeof values, value: string) { setValues(previous => ({ ...previous, [key]: value })); setFields(previous => ({ ...previous, [key]: '' })); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || !ready || !allowed) return;
    const next: Record<string, string> = {};
    if (!values.tvt.trim() || values.tvt.trim().length > 80) next.tvt = 'Ingresa un TVT de 1 a 80 caracteres.';
    if (!values.nombre.trim() || values.nombre.trim().length > 200) next.nombre = 'Ingresa un nombre de 1 a 200 caracteres.';
    for (const key of ['clienteId', 'paisId', 'lobId', ...(admin ? ['pmTitularId'] : [])] as const) {
      if (!idPattern.test(values[key as keyof typeof values])) next[key] = 'Selecciona una opción válida.';
    }
    setFields(next); if (Object.keys(next).length) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const created = await onCreate({ workspaceId: workspace.id, tvt: values.tvt, nombre: values.nombre, clienteId: values.clienteId, paisId: values.paisId, lobId: values.lobId, ...(admin ? { pmTitularId: values.pmTitularId } : {}) });
      onCreated(created);
    } catch (cause) {
      setError(projectError(cause));
      if (cause instanceof ApiError) { setFields(cause.fields ?? {}); if (cause.status === 401 || cause.status === 403) onAuthorizationError?.(cause.status); }
    } finally { pending.current = false; setBusy(false); }
  }
  const selects: { key: 'clienteId' | 'paisId' | 'lobId' | 'pmTitularId'; label: string; options?: CatalogOption[] }[] = [
    { key: 'clienteId', label: 'Cliente', options: catalogs?.clientes },
    { key: 'paisId', label: 'País', options: catalogs?.paises },
    { key: 'lobId', label: 'LOB', options: catalogs?.lobs },
    ...(admin ? [{ key: 'pmTitularId' as const, label: 'PM titular', options: catalogs?.titulares }] : []),
  ];
  return <motion.section className="pmo-create" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .16 }}>
    <header><p className="pmo-eyebrow">Alta de proyecto</p><h1>Nuevo proyecto</h1><p>Workspace: <strong>{workspace.nombre}</strong></p></header>
    {!ready && <div className="pmo-notice" id="catalog-blocker" role="status"><strong>Creación bloqueada por catálogos no disponibles</strong><p>PMO v2.1.0 no publica los catálogos de cliente, país, LOB ni PM elegibles. No es posible enviar IDs verificados. Puedes revisar la composición; no se guardará un proyecto.</p></div>}
    {!allowed && <p role="alert">Tu sesión no tiene permiso para crear proyectos.</p>}
    <form onSubmit={event => { void submit(event); }} noValidate>
      <fieldset disabled={busy}><legend>Identificación y responsables</legend><div className="pmo-form-grid">
        {(['tvt', 'nombre'] as const).map(key => <label key={key} htmlFor={`project-${key}`}>{key === 'tvt' ? 'TVT *' : 'Nombre del proyecto *'}<TextInput id={`project-${key}`} name={key} required maxLength={key === 'tvt' ? 80 : 200} value={values[key]} onChange={event => change(key, event.target.value)} error={!!fields[key]} aria-describedby={fields[key] ? `error-${key}` : undefined} /><span id={`error-${key}`} className="form-error">{fields[key]}</span></label>)}
        {selects.map(({ key, label, options }) => <label key={key} htmlFor={`project-${key}`}>{label} *<select id={`project-${key}`} name={key} required disabled={!options?.length} value={values[key]} onChange={event => change(key, event.target.value)} aria-invalid={!!fields[key]} aria-describedby={!ready ? 'catalog-blocker' : fields[key] ? `error-${key}` : undefined}><option value="">{options?.length ? 'Selecciona una opción' : 'Catálogo no disponible'}</option>{options?.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><span id={`error-${key}`} className="form-error">{fields[key]}</span></label>)}
      </div>{!admin && <p className="pmo-help">El servidor asigna como titular al PM autenticado si su membresía y habilitación son válidas en este workspace.</p>}</fieldset>
      <section className="pmo-deferred"><h2>Información complementaria</h2><p>Clasificación, fechas, línea base, descripción, TCV, moneda, presupuesto y documentos: disponible cuando se habilite su registro.</p></section>
      {error && <p role="alert" className="form-error">{error}</p>}
      <footer><Button disabled={busy} onClick={onCancel}>Cancelar</Button><Button variant="primary" type="submit" loading={busy} disabled={!ready || !allowed} aria-describedby={!ready ? 'catalog-blocker' : undefined}>Crear proyecto</Button></footer>
    </form>
  </motion.section>;
}
