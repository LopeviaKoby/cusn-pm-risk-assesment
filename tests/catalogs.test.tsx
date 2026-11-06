import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { SearchableSelect } from '../app/src/components/molecules/searchable-select';
import { ProjectCreateForm } from '../app/src/components/organisms/project-create-form';
import { CreateClientDialog } from '../app/src/components/organisms/create-client-dialog';
import { ApiError } from '../app/src/data/client';
import { projectCatalogStates, type ClientCreationAccess, type CountryOption, type ProjectCatalogStates } from '../app/src/data/project-catalogs';
import type { ProjectCatalogs } from '../app/src/data/projects';

beforeEach(() => vi.stubGlobal('matchMedia', () => ({ matches: true, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })));
const country: CountryOption = { id: '100', nombre: 'Chile', codigo: 'CHL' };
const catalogs: ProjectCatalogs = { clientes: [{ id: '1', nombre: 'Ácme Andina' }], paises: [country], lobs: [{ id: '20', nombre: 'Cloud solutions' }], titulares: [{ id: '30', nombre: 'PM de prueba' }] };
const workspace = { id: '12', nombre: 'Workspace de prueba', slug: 'workspace-test', version: '1' };
const session = { identifier: 'fixture@example.invalid', expiresAt: '2099-01-01T00:00:00Z', role: 'ADMIN', permissions: ['proyectos.crear'] };
function props(access?: ClientCreationAccess, states?: ProjectCatalogStates) {
  return { workspace, session, catalogs, catalogStates: states, clientCreation: access, onCreate: vi.fn(async () => ({ id: '42', workspaceId: '12', tvt: 'T', nombre: 'Proyecto', version: '1' })), onCreated: vi.fn(), onCancel: vi.fn() };
}
function choose(label: string, value: RegExp) {
  fireEvent.click(screen.getByLabelText(new RegExp('^' + label)));
  fireEvent.click(within(screen.getByRole('group', { name: `Opciones de ${label}` })).getByRole('button', { name: value }));
}
function projectValues() {
  fireEvent.change(screen.getByLabelText(/^TVT/), { target: { value: 'TVT-TEST' } });
  fireEvent.change(screen.getByLabelText(/^Nombre del proyecto/), { target: { value: 'Proyecto conservado' } });
  choose('País', /Chile/); choose('LOB', /Cloud solutions/); choose('PM titular', /PM de prueba/);
}
function openClient(name = 'Empresa nueva') {
  fireEvent.click(screen.getByLabelText(/^Cliente/));
  fireEvent.change(screen.getByLabelText('Buscar cliente…'), { target: { value: name } });
  expect(within(screen.getByRole('group', { name: 'Opciones de Cliente' })).getByText('No hay coincidencias')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Agregar registro' }));
  return screen.getByRole('dialog', { name: 'Agregar cliente' });
}
test('busca por nombre sin distinguir espacios, case ni acentos y selecciona el ID', () => {
  const onChange = vi.fn(); render(<SearchableSelect id="client-test" label="Cliente" value="" options={[{ value: '9007199254740993', label: '  Ácme   ANDINA' }]} onChange={onChange} searchLabel="Buscar cliente…" />);
  fireEvent.click(screen.getByLabelText('Cliente'));
  fireEvent.change(screen.getByLabelText('Buscar cliente…'), { target: { value: '  acme andina ' } });
  fireEvent.click(screen.getByRole('button', { name: /Ácme ANDINA/ }));
  expect(onChange).toHaveBeenCalledWith('9007199254740993');
});
test.each(['idle', 'loading', 'error'] as const)('%s no se confunde con vacío ni ofrece alta', status => {
  render(<SearchableSelect id="select" label="Cliente" value="" options={[]} onChange={vi.fn()} status={status} renderEmptyAction={() => <button>Agregar registro</button>} />);
  fireEvent.click(screen.getByLabelText('Cliente')); expect(screen.queryByText('No hay coincidencias')).not.toBeInTheDocument(); expect(screen.queryByText('Agregar registro')).not.toBeInTheDocument();
});
test('una página parcial sin coincidencias no afirma un vacío global', () => {
  render(<SearchableSelect id="partial" label="Cliente" value="" options={[]} complete={false} onChange={vi.fn()} renderEmptyAction={() => <button>Agregar registro</button>} />);
  fireEvent.click(screen.getByLabelText('Cliente')); expect(screen.getByText('No hay coincidencias en los resultados recibidos.')).toBeVisible(); expect(screen.queryByText('Agregar registro')).not.toBeInTheDocument();
});
test('proyectos.crear no concede alta de clientes y LOB/país/PM no tienen registro inline', () => {
  render(<ProjectCreateForm {...props()} />);
  for (const label of ['Cliente', 'País', 'LOB', 'PM titular']) {
    fireEvent.click(screen.getByLabelText(new RegExp('^' + label)));
    fireEvent.change(screen.getByRole('textbox', { name: /^Buscar/ }), { target: { value: 'sin coincidencias' } });
    expect(screen.queryByText('Agregar registro')).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('textbox', { name: /^Buscar/ }), { key: 'Escape' });
  }
});
test('disponibilidad por campo permite seleccionar país y LOB con cliente pendiente', () => {
  const states = projectCatalogStates(catalogs); states.clientes = { status: 'unavailable', options: [], complete: false };
  const model = props(undefined, states); render(<ProjectCreateForm {...model} />);
  expect(screen.getByLabelText(/^Cliente/)).toBeDisabled(); choose('País', /Chile/); choose('LOB', /Cloud solutions/);
  expect(screen.getByLabelText(/^País/)).toHaveTextContent('Chile'); expect(screen.getByRole('button', { name: 'Crear proyecto' })).toBeDisabled();
});
test('cancelar el modal conserva formulario, búsqueda y restaura foco', async () => {
  render(<ProjectCreateForm {...props({ authorized: true, create: vi.fn() })} />); projectValues();
  const dialog = openClient(); expect(within(dialog).getByLabelText('Nombre del cliente *')).toHaveValue('Empresa nueva');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
  await waitFor(() => expect(screen.getByLabelText(/^Cliente/)).toHaveFocus());
  expect(screen.getByLabelText(/^TVT/)).toHaveValue('TVT-TEST'); expect(screen.getByLabelText(/^Nombre del proyecto/)).toHaveValue('Proyecto conservado');
  expect(screen.getByLabelText(/^País/)).toHaveTextContent('Chile'); expect(screen.getByLabelText(/^LOB/)).toHaveTextContent('Cloud solutions'); expect(screen.getByLabelText(/^PM titular/)).toHaveTextContent('PM de prueba');
  fireEvent.click(screen.getByLabelText(/^Cliente/)); expect(screen.getByLabelText('Buscar cliente…')).toHaveValue('Empresa nueva');
});
test('alta confirmada selecciona ID, deduplica, refresca y envía país por ID interno', async () => {
  const create = vi.fn(async () => ({ id: '9007199254740993', nombre: 'Empresa nueva' })); const refresh = vi.fn();
  const model = props({ authorized: true, create, refresh }); render(<ProjectCreateForm {...model} />); projectValues();
  const dialog = openClient(); fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar cliente' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(create).toHaveBeenCalledWith({ nombre: 'Empresa nueva' }); expect(refresh).toHaveBeenCalledOnce(); expect(screen.getByLabelText(/^Cliente/)).toHaveTextContent('Empresa nueva');
  expect(screen.getByLabelText(/^TVT/)).toHaveValue('TVT-TEST');
  fireEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }));
  await waitFor(() => expect(model.onCreate).toHaveBeenCalledWith({ workspaceId: '12', tvt: 'TVT-TEST', nombre: 'Proyecto conservado', clienteId: '9007199254740993', paisId: '100', lobId: '20', pmTitularId: '30' }));
});
test.each([403, 409, 422, 503])('error %s no selecciona un cliente ni pierde el proyecto', async status => {
  const create = vi.fn(async () => { throw new ApiError(status, 'REJECTED', 'Registro rechazado', { nombre: 'Revisa el nombre' }); }); const refresh = vi.fn();
  render(<ProjectCreateForm {...props({ authorized: true, create, refresh })} />); projectValues(); const dialog = openClient(); fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar cliente' }));
  await within(dialog).findByText(/Registro rechazado/); expect(within(dialog).getByLabelText('Nombre del cliente *')).toHaveValue('Empresa nueva');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByLabelText(/^Cliente/)).not.toHaveTextContent('Empresa nueva'); expect(screen.getByLabelText(/^TVT/)).toHaveValue('TVT-TEST'); expect(refresh).not.toHaveBeenCalled();
});
test('validación y doble guardado; no cierra mientras la respuesta está pendiente', async () => {
  let finish!: (value: { id: string; nombre: string }) => void;
  const create = vi.fn(() => new Promise<{ id: string; nombre: string }>(resolve => { finish = resolve; })); const created = vi.fn();
  render(<CreateClientDialog initialName="   " create={create} onCreated={created} onCancel={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cliente' })); expect(screen.getByText('Ingresa el nombre del cliente.')).toBeVisible(); expect(create).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Nombre del cliente *'), { target: { value: '  Nuevo  ' } }); const save = screen.getByRole('button', { name: 'Guardar cliente' }); fireEvent.click(save); fireEvent.click(save);
  expect(create).toHaveBeenCalledOnce(); expect(create).toHaveBeenCalledWith({ nombre: 'Nuevo' }); expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  finish({ id: '5', nombre: 'Nuevo' }); await waitFor(() => expect(created).toHaveBeenCalledWith({ id: '5', nombre: 'Nuevo' }));
});
test('sin contrato de alta el error al guardar es contextual y no simula persistencia', () => {
  const created = vi.fn(); render(<CreateClientDialog initialName="Cliente" onCreated={created} onCancel={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cliente' })); expect(screen.getByText('No pudimos guardar el cliente. Inténtalo más tarde.')).toBeVisible(); expect(created).not.toHaveBeenCalled();
});
test('una identidad ya presente se actualiza sin duplicar opciones', async () => {
  render(<ProjectCreateForm {...props({ authorized: true, create: async () => ({ id: '1', nombre: 'Empresa nueva' }) })} />);
  const dialog = openClient(); fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar cliente' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  fireEvent.click(screen.getByLabelText(/^Cliente/));
  expect(within(screen.getByRole('group', { name: 'Opciones de Cliente' })).getAllByRole('button', { name: /Empresa nueva/ })).toHaveLength(1);
});
test('409 permite refrescar explícitamente sin fusionar entidades', async () => {
  const refresh = vi.fn(); const created = vi.fn();
  render(<CreateClientDialog initialName="Cliente" create={async () => { throw new ApiError(409, 'CONFLICT', 'Nombre en conflicto'); }} onCreated={created} onCancel={vi.fn()} onRefresh={refresh} />);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cliente' }));
  fireEvent.click(await screen.findByRole('button', { name: /Actualizar clientes para buscar/ }));
  await waitFor(() => expect(refresh).toHaveBeenCalledOnce()); expect(created).not.toHaveBeenCalled();
});
test('retirar autorización mientras el modal está abierto impide guardar', async () => {
  const create = vi.fn(async () => ({ id: '8', nombre: 'Empresa nueva' })); const model = props({ authorized: true, create });
  const view = render(<ProjectCreateForm {...model} />); openClient();
  view.rerender(<ProjectCreateForm {...model} clientCreation={{ authorized: false, create }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cliente' }));
  await screen.findByText('No pudimos guardar el cliente. Inténtalo más tarde.'); expect(create).not.toHaveBeenCalled();
});
test('catálogo denegado y PM sin candidatos mantienen mensajes distintos', () => {
  const states = projectCatalogStates(catalogs); states.clientes = { status: 'forbidden', options: [], complete: false }; states.titulares = { status: 'ready', options: [], complete: true };
  render(<ProjectCreateForm {...props(undefined, states)} />);
  expect(screen.getByText('No tienes acceso a este catálogo.')).toBeVisible(); expect(screen.getByLabelText(/^Cliente/)).toBeDisabled();
  fireEvent.click(screen.getByLabelText(/^PM titular/)); expect(screen.getByText('No hay PM elegibles')).toBeVisible(); expect(screen.queryByText('Agregar registro')).not.toBeInTheDocument();
});
