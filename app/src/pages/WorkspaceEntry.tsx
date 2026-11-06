import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LuArrowRight } from 'react-icons/lu';
import { Button, TextInput, Icon, Spinner } from '@/components/atoms/catalog';
import { useAccess } from '@/data/access';
import { ApiError } from '@/data/client';
import { createWorkspace, listWorkspaces, workspacePath, workspaceSession, type WorkspaceSummary, type WorkspaceSession } from '@/data/workspaces';
import { useNavigation } from '@/navigation';
import {ApplicationHeader} from '@/components/organisms/application-header';
import '@/design-system/workspaces.css';
import WorkspaceArea from './WorkspaceArea';

export default function WorkspaceEntry() {
  const { url, navigate } = useNavigation();
  const { signOut } = useAccess();

  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [items, setItems] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [nombre, setNombre] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const generation = useRef(0);
  const id = url.split('?')[0]!.split('/')[2] ?? '';
  const selected = items.find(item => item.id === id);
  const canCreate = session?.permissions.includes('workspaces.crear') ?? false;
  async function load(background = false) {
    const run = ++generation.current;
    if (!background) setLoading(true); setError('');
    try {
      const current = await workspaceSession();
      if (run !== generation.current) return;
      setSession(current);
      const spaces = await listWorkspaces();
      if (run !== generation.current) return;
      setItems(spaces);
    } catch (cause) {
      if (run !== generation.current) return;
      setItems([]); report(cause);
    } finally { if (run === generation.current) setLoading(false); }
  }
  function report(cause: unknown) {
    if (cause instanceof ApiError) {
      if (cause.status === 401) { void signOut().then(() => navigate('/login', true)).catch(() => setError('La sesión venció. Cierra sesión para volver a ingresar.')); return; }
      const prefix = cause.status === 403 ? 'Acceso denegado. ' : cause.status === 409 ? 'Conflicto. ' : cause.status === 422 ? 'Revisa los datos. ' : cause.status >= 500 ? 'Servicio no disponible. ' : '';
      setError(prefix + cause.message);
      setFieldError(cause.fields?.nombre ?? '');
      if (cause.status === 403) void workspaceSession().then(setSession).catch(() => setSession(null));
    } else setError('No se pudo conectar con el servicio. Reintenta cuando tengas conexión.');
  }
  useEffect(() => {
    const revalidate = () => { void load(true); };
    void load(); window.addEventListener('focus', revalidate);
    return () => { generation.current++; window.removeEventListener('focus', revalidate); };
  }, []);
  useEffect(() => { document.title = `${selected?.nombre ?? 'Workspaces'} · PMO TIVIT`; }, [selected]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const clean = nombre.trim();
    if (!clean || clean.length > 200) { setFieldError('Ingresa un nombre de 1 a 200 caracteres.'); return; }
    pending.current = true; setBusy(true); setCreating(true); setError(''); setFieldError('');
    try {
      const created = await createWorkspace(clean);
      setCreating(false);
      navigate(workspacePath(created.id));
      await load();
    } catch (cause) { report(cause); }
    finally { pending.current = false; setBusy(false); }
  }
  return <div className="workspace-experience">
    <ApplicationHeader identifier={session?.identifier} onError={report}/>
    {selected && !creating && !loading && !error ? <WorkspaceArea workspace={selected} session={session!} /> : <main id="contenido" className="workspace-onboarding">
      {loading ? <><Spinner /><h1>Cargando workspaces…</h1></> : <>
        <h1>{creating || (!items.length && canCreate && !error) ? 'Crea tu workspace' : 'Tus workspaces'}</h1>
        {error && <div role="alert"><p>{error}</p><Button onClick={() => { void load(); }}>Reintentar</Button></div>}
        {id && !selected && !error && <p role="alert">El workspace no está disponible para tu sesión. Selecciona otro espacio.</p>}
        {!error && !items.length && !canCreate && <p>No tienes workspaces accesibles ni permiso para crear uno. Solicita acceso a tu administrador.</p>}
        {(creating || (!items.length && canCreate && !error)) && canCreate ? <form onSubmit={event => { void submit(event); }} noValidate><p>Crea tu workspace</p><label htmlFor="workspace-name">Nombre del workspace</label><TextInput id="workspace-name" name="nombre" required maxLength={200} value={nombre} onChange={event => { setNombre(event.target.value); setFieldError(''); }} error={!!fieldError} aria-describedby={fieldError ? 'workspace-name-error' : undefined} /><p id="workspace-name-error" role={fieldError ? 'alert' : undefined}>{fieldError}</p><div><Button type="submit" variant="primary" loading={busy}>Crear workspace</Button>{items.length > 0 && <Button disabled={busy} onClick={() => setCreating(false)}>Volver</Button>}</div></form> : <><div className="workspace-options">{!error && items.map(item => <Button key={item.id} onClick={() => navigate(workspacePath(item.id))}><span><strong>{item.nombre}</strong><small>{item.slug}</small></span><Icon glyph={LuArrowRight} /></Button>)}</div>{canCreate && !error && <Button variant="primary" onClick={() => setCreating(true)}>Crear workspace</Button>}</>}
      </>}
    </main>}
  </div>;
}
