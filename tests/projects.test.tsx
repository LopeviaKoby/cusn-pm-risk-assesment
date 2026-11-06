import {projectFixture} from '../app/src/stories/catalogs/pmo-fixtures';
import {fillPlanning, planningPayload} from './pmo-helpers';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ProjectCreateForm } from '../app/src/components/organisms/project-create-form';
import { ProjectOverview } from '../app/src/components/organisms/project-overview';
import { createProject, type ProjectCatalogs, type ProjectSummary } from '../app/src/data/projects';
import App from '../app/src/App';

// Explicit test-only catalogs isolate router tests; HTTP contracts have their own suite.
vi.mock('@/data/use-project-catalogs', () => {
  const values = [{ id: '7', nombre: 'Opción sintética de test' }];
  const resource = { status: 'ready', options: values, complete: true };
  return { useProjectCatalogs: () => ({ sources: { clientes: resource, paises: resource, lobs: resource, titulares: resource }, retry: vi.fn() }) };
});

const workspace = { id: '9007199254740993', nombre: 'Workspace de prueba', slug: 'workspace-prueba', version: '1' };
const session = { identifier: 'fixture@example.invalid', expiresAt: '2099-01-01T00:00:00Z', role: 'PM', permissions: ['proyectos.consultar', 'proyectos.crear', 'workspaces.consultar'] };
const project = { ...projectFixture, id: '9007199254740994', workspaceId: workspace.id, nombre: 'Proyecto de prueba', tvt: 'TVT-PRUEBA', version: '2', estado: 'Requiere P1P2' };
const option = [{ id: '7', nombre: 'Opción sintética de test' }];
const catalogs: ProjectCatalogs = { clientes: option, paises: option, lobs: option, titulares: option };
beforeEach(() => { vi.stubGlobal('matchMedia', () => ({ matches: true, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })); });
function form(role = 'PM', sources: ProjectCatalogs | null = catalogs, permissions = session.permissions) {
  const created = vi.fn(), cancel = vi.fn(), auth = vi.fn();
  render(<ProjectCreateForm workspace={workspace} session={{ ...session, role, permissions }} catalogs={sources} onCreate={createProject} onCreated={created} onCancel={cancel} onAuthorizationError={auth} />);
  return { created, cancel, auth };
}
function fill(admin = false) { fillPlanning();
  fireEvent.change(screen.getByLabelText(/^TVT/), { target: { value: '  TVT-PRUEBA  ' } });
  fireEvent.change(screen.getByLabelText(/^Nombre del proyecto/), { target: { value: '  Proyecto de prueba  ' } });
  for (const label of ['Cliente', 'País', 'LOB', ...(admin ? ['PM titular'] : [])]) {
    fireEvent.click(screen.getByLabelText(new RegExp('^' + label)));
    fireEvent.click(within(screen.getByRole('group', { name: `Opciones de ${label}` })).getByRole('button', { name: /Opción sintética/ }));
  }
}
test('sin catálogos el alta está bloqueada sin IDs ni requests inventados', () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher); form('PM', null);
  expect(screen.getByRole('button', { name: 'Crear proyecto' })).toBeDisabled();
  expect(screen.getByLabelText(/^Cliente/)).toBeDisabled();
  expect(screen.getByText('Algunos catálogos no están disponibles')).toBeVisible();
  expect(fetcher).not.toHaveBeenCalled();
});
test.each(['PM', 'ADMIN'])('201 envía únicamente el contrato estricto para %s', async role => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ data: project }), { status: 201 })); vi.stubGlobal('fetch', fetcher);
  const { created } = form(role); fill(role === 'ADMIN'); fireEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }));
  await waitFor(() => expect(created).toHaveBeenCalledWith(project));
  expect(fetcher).toHaveBeenCalledWith('/api/v1/proyectos', expect.objectContaining({ credentials: 'same-origin' }));
  expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({ ...planningPayload, workspaceId: workspace.id, tvt: 'TVT-PRUEBA', nombre: 'Proyecto de prueba', clienteId: '7', paisId: '7', lobId: '7', ...(role === 'ADMIN' ? { pmTitularId: '7' } : {}) });
});
test('ADMIN requiere titular y PM lo delega al servidor', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher); form('ADMIN'); fill();
  expect(screen.getByRole('button', { name: 'Crear proyecto' })).toBeDisabled(); expect(fetcher).not.toHaveBeenCalled();
});
test('required y límites se comprueban sin POST', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher); form(); fill();
  fireEvent.change(screen.getByLabelText(/^TVT/), { target: { value: ' '.repeat(5) } });
  fireEvent.change(screen.getByLabelText(/^Nombre del proyecto/), { target: { value: 'x'.repeat(201) } });
  fireEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }));
  expect(await screen.findByText('Ingresa un TVT de 1 a 80 caracteres.')).toBeVisible();
  expect(screen.getByText('Ingresa un nombre de 1 a 200 caracteres.')).toBeVisible(); expect(fetcher).not.toHaveBeenCalled();
});
test.each([401, 403, 404, 409, 422, 503])('error %s preserva campos sin éxito ni reintento del POST', async status => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ error: { code: 'REJECTED', message: 'Respuesta del servidor', fields: { tvt: 'Revisar TVT' } } }), { status })); vi.stubGlobal('fetch', fetcher);
  const { created, auth } = form(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }));
  await screen.findByText(/Respuesta del servidor/); expect(screen.getByLabelText(/^TVT/)).toHaveValue('  TVT-PRUEBA  '); expect(created).not.toHaveBeenCalled();
  expect(fetcher.mock.calls.filter(([path]) => path === '/api/v1/proyectos')).toHaveLength(1);
  if ([401, 403].includes(status)) expect(auth).toHaveBeenCalledWith(status);
});
test('doble submit se bloquea y pérdida de red requiere revisión explícita', async () => {
  let fail!: (cause: Error) => void;
  const fetcher = vi.fn(() => new Promise<Response>((_, reject) => { fail = reject; })); vi.stubGlobal('fetch', fetcher);
  const { created } = form(); fill(); const button = screen.getByRole('button', { name: 'Crear proyecto' }); fireEvent.click(button); fireEvent.click(button);
  expect(fetcher).toHaveBeenCalledTimes(1); expect(button).toBeDisabled(); fail(new TypeError('offline'));
  await screen.findByText(/Se perdió la conexión/); expect(created).not.toHaveBeenCalled(); expect(fetcher).toHaveBeenCalledTimes(1);
});
test.each(['ESPECIALISTA', 'VISUALIZADOR'])('%s sin grant no puede crear aun con catálogos de test', role => {
  form(role, catalogs, ['proyectos.consultar']); expect(screen.getByRole('button', { name: 'Crear proyecto' })).toBeDisabled();
});
test('dashboard no fabrica series, actividades, importes, alertas ni eventos', () => {
  render(<ProjectOverview />);
  for (const text of ['Serie de avance no disponible', 'Seguimiento no disponible', 'Alertas no disponibles', 'Historial no disponible']) expect(screen.getByText(text)).toBeVisible();
  expect(screen.getByText(/Consulta el contrato y los importes/)).toBeVisible();
  expect(screen.queryByText('0%')).not.toBeInTheDocument();
});
function service(pages: ProjectSummary[][]) {
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (path: string) => {
    calls.push(path);
    if (path === '/api/v1/sesion') return new Response(JSON.stringify({ data: session }));
    if (path === '/api/v1/workspaces') return new Response(JSON.stringify({ data: [workspace] }));
    if (path.includes('/proyectos?')) return new Response(JSON.stringify({ data: {items: pages.shift() ?? []} }));
    if (path === `/api/v1/proyectos/${project.id}`) return new Response(JSON.stringify({ data: project }));
    throw new Error(`Endpoint no permitido: ${path}`);
  }));
  window.history.replaceState(null, '', `/workspace/${workspace.id}/proyectos`); return calls;
}
test('listado pagina por cursor string, filtra workspace y permite entrar al detalle', async () => {
  const first = Array.from({ length: 50 }, (_, i) => ({ ...project, id: String(i + 1), nombre: `Ajeno ${i}`, workspaceId: '99' }));
  const calls = service([first, [project]]); render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cargar siguiente página' }));
  fireEvent.click(await screen.findByRole('link', { name: project.nombre }));
  await screen.findByRole('heading', { name: project.nombre });
  expect(calls).toContain(`/api/v1/workspaces/${workspace.id}/proyectos?after=50&limit=50`); expect(calls.some(path => path.includes('/datos'))).toBe(false);
});
test('listado vacío no simula métricas de portafolio', async () => {
  service([[]]); render(<App />); await screen.findByText(/No hay proyectos accesibles/); expect(screen.queryByText('Riesgos abiertos')).not.toBeInTheDocument();
});
test('composición habilitada solo en test navega al ID devuelto después de 201', async () => {
  let release!: () => void; let created = false;
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (path: string, init?: RequestInit) => {
    calls.push(path);
    if (path === '/api/v1/sesion') return new Response(JSON.stringify({ data: session }));
    if (path === '/api/v1/workspaces') return new Response(JSON.stringify({ data: [workspace] }));
    if (path === '/api/v1/proyectos' && init?.method === 'POST') { await new Promise<void>(resolve => { release = resolve; }); created = true; return new Response(JSON.stringify({ data: project }), { status: 201 }); }
    if (path.includes('/proyectos?')) return new Response(JSON.stringify({ data: {items: created ? [project] : []} }));
    if (path === `/api/v1/proyectos/${project.id}`) return new Response(JSON.stringify({ data: project }));
    throw new Error(`Endpoint inesperado: ${path}`);
  }));
  window.history.replaceState(null, '', `/workspace/${workspace.id}/proyectos/nuevo`); render(<App />);
  await screen.findByLabelText(/^TVT/); fill(); fireEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }));
  expect(location.pathname).toContain('/nuevo'); release();
  await screen.findByRole('heading', { name: project.nombre });
  expect(location.pathname).toBe(`/workspace/${workspace.id}/proyectos/${project.id}/resumen`);
  expect(calls).not.toContain('/api/v1/datos');
});
test('revalidar al recuperar foco conserva la edición del alta', async () => {
  const calls = service([[], []]); window.history.replaceState(null, '', `/workspace/${workspace.id}/proyectos/nuevo`); render(<App />);
  await screen.findByLabelText(/^TVT/); fill(); fireEvent(window, new Event('focus'));
  await waitFor(() => expect(calls.filter(path => path === '/api/v1/workspaces')).toHaveLength(2));
  expect(screen.getByLabelText(/^TVT/)).toHaveValue('  TVT-PRUEBA  ');
});
