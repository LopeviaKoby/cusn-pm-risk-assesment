import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {afterEach, expect, test, vi} from 'vitest';
import {BillingLineForm} from '../app/src/components/organisms/billing-line-form';
import {BillingMatrix} from '../app/src/components/organisms/billing-matrix';
import {DriveTree} from '../app/src/components/organisms/drive-tree';
import ProjectDocuments from '../app/src/pages/ProjectDocuments';
import {ApiError} from '../app/src/data/client';
import {createClient} from '../app/src/data/project-catalogs';
import {createProject, editProject, startProject, type NewProjectInput} from '../app/src/data/projects';
import {canReportBilling, getBilling, saveBilling} from '../app/src/data/project-modules';
import {billingFixture, driveFixture, projectFixture} from '../app/src/stories/catalogs/pmo-fixtures';

afterEach(() => vi.useRealTimers());
test('cliente clasificado envía contrato estricto, permite homónimos y conserva identidad string', async () => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({data: {id: '9007199254740993', nombre: 'Cliente', estadoCliente: 'ANTIGUO', sector: null}}), {status: 201})); vi.stubGlobal('fetch', fetcher);
  const result = await createClient({nombre: ' Cliente ', estadoCliente: 'ANTIGUO'});
  expect(result.id).toBe('9007199254740993'); expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({nombre: 'Cliente', estadoCliente: 'ANTIGUO'});
});
test('alta incluye planificación y condición ilimitada nula; inicio usa versión sin fecha local', async () => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({data: projectFixture}))); vi.stubGlobal('fetch', fetcher);
  const input: NewProjectInput = {workspaceId: '12', tvt: ' TVT ', nombre: ' Nombre ', clienteId: '7', paisId: '100', lobId: '20', fechaInicio: '2026-01-01', fechaTerminoBaseline: '2026-12-31', condicionComercial: {tcvTipo: 'ILIMITADO', tcvValor: null, unidadCodigo: null}};
  await createProject(input); expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({...input, tvt: 'TVT', nombre: 'Nombre'});
  await startProject(projectFixture.id, '2'); expect(JSON.parse(String(fetcher.mock.calls[1]?.[1]?.body))).toEqual({version: '2'});
  await editProject(projectFixture.id, {nombre: 'Cambio', version: '2'}); expect(JSON.parse(String(fetcher.mock.calls[2]?.[1]?.body))).toEqual({nombre: 'Cambio', version: '2'});
});
test('facturación conserva decimales exactos, ventana y clave original al editar', async () => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({data: billingFixture}))); vi.stubGlobal('fetch', fetcher);
  await getBilling(projectFixture.id, '2026-01', '2026-12');
  expect(fetcher.mock.calls[0]?.[0]).toBe(`/api/v1/proyectos/${projectFixture.id}/facturacion?desde=2026-01&hasta=2026-12&limit=100&after=0`);
  const line = billingFixture.hitos[0]!;
  await saveBilling(projectFixture.id, {claveRegistro: 'otra-clave-no-usada', periodo: '2026-01', unidadCodigo: 'USD', tipoHito: 'Proyecto', tipoCuota: 'SetUp', showprice: '10000.1234', planificado: '9500.0000', realReportado: '9000.0123', comentario: null}, line);
  expect(JSON.parse(String(fetcher.mock.calls[1]?.[1]?.body))).toMatchObject({claveRegistro: line.claveRegistro, version: line.version, showprice: '10000.1234', realReportado: '9000.0123'});
});
test('doble envío financiero bloqueado; 409 conserva valores y exige consulta explícita', async () => {
  let reject!: (cause: unknown) => void;
  const save = vi.fn(() => new Promise((_, fail) => {reject = fail;})), refresh = vi.fn();
  render(<BillingLineForm line={billingFixture.hitos[0]} onSave={save} onSaved={vi.fn()} onConflict={refresh}/>);
  fireEvent.click(screen.getByLabelText('Confirmo los importes y el período')); const button = screen.getByRole('button', {name: 'Guardar hito'}); fireEvent.click(button); fireEvent.click(button);
  expect(save).toHaveBeenCalledTimes(1); reject(new ApiError(409, 'VERSION_CONFLICT', 'Versión obsoleta'));
  await screen.findByText(/Versión obsoleta/); expect(screen.getByLabelText('Showprice')).toHaveValue('10000.1234'); expect(refresh).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', {name: /Consultar versión vigente/})); expect(refresh).toHaveBeenCalledOnce();
});
test('red incierta conserva clave y no reintenta automáticamente; 403 revoca edición', async () => {
  const save = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockRejectedValueOnce(new ApiError(403, 'FORBIDDEN', 'Sin permiso'));
  render(<BillingLineForm line={billingFixture.hitos[0]} onSave={save} onSaved={vi.fn()} onConflict={vi.fn()}/>);
  fireEvent.click(screen.getByLabelText('Confirmo los importes y el período')); fireEvent.click(screen.getByRole('button', {name: 'Guardar hito'})); await screen.findByText(/Se perdió la conexión/);
  expect(save).toHaveBeenCalledTimes(1); const first = save.mock.calls[0]![0]; fireEvent.click(screen.getByRole('button', {name: 'Guardar hito'})); await screen.findByText(/Sin permiso/); expect(save.mock.calls[1]![0]).toEqual(first); expect(screen.getByRole('button', {name: 'Guardar hito'})).toBeDisabled();
});
test('matriz conserva monedas separadas, cero y ausencia; detalle contextual por período', () => {
  const click = vi.fn(); const data = {...billingFixture, totales: [...billingFixture.totales, {unidadCodigo: 'CLP', showprice: '0', planificado: null, realReportado: '0'}]}; render(<BillingMatrix data={data} onPeriod={click}/>);
  expect(screen.getByRole('rowheader', {name: 'USD · Showprice'})).toBeVisible(); expect(screen.getByRole('rowheader', {name: 'CLP · Showprice'})).toBeVisible();
  fireEvent.click(screen.getByRole('button', {name: 'realReportado 2026-01 USD'})); expect(click).toHaveBeenCalledWith('2026-01', 'USD'); expect(screen.queryByText('Cobrado')).not.toBeInTheDocument();
});
test('reportar exige permiso y autorización contextual; no basta el grant global', () => {
  expect(canReportBilling({...projectFixture, accionesDisponibles: {...projectFixture.accionesDisponibles, puedeEditarFicha: false}}, ['facturacion.reportar'])).toBe(false);
  expect(canReportBilling(projectFixture, ['facturacion.reportar'])).toBe(true); expect(canReportBilling(projectFixture, [])).toBe(false);
});
test('Drive muestra jerarquía persistida, links seguros y estado sin porcentajes simulados', () => {
  render(<DriveTree data={driveFixture}/>); expect(screen.getByText('Completado')).toBeVisible(); const list = screen.getByRole('list', {name: 'Carpetas persistidas de Google Drive'});
  expect(within(list).getByRole('link', {name: 'INICIO'})).toHaveAttribute('rel', 'noopener noreferrer'); expect(screen.queryByText('100%')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Buscar carpetas cargadas'), {target: {value: 'CIERRE'}}); expect(screen.queryByRole('link', {name: 'INICIO'})).not.toBeInTheDocument(); expect(screen.getByRole('link', {name: 'CIERRE'})).toBeVisible();
});
test('polling Drive se detiene al completar y aborta al desmontar', async () => {
  vi.useFakeTimers(); const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(JSON.stringify({data: {...driveFixture, estado: 'PENDIENTE', carpetas: []}}))).mockResolvedValueOnce(new Response(JSON.stringify({data: driveFixture}))); vi.stubGlobal('fetch', fetcher);
  const view = render(<ProjectDocuments projectId={projectFixture.id}/>); await act(async () => {}); expect(fetcher).toHaveBeenCalledTimes(1);
  await act(async () => {await vi.advanceTimersByTimeAsync(5000);}); expect(screen.getByText('Completado')).toBeVisible();
  await act(async () => {await vi.advanceTimersByTimeAsync(60000);}); expect(fetcher).toHaveBeenCalledTimes(2); view.unmount(); expect(vi.getTimerCount()).toBe(0);
});
test('ninguna solicitud de módulos usa bootstrap ni catálogos retirados', async () => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({data: billingFixture}))); vi.stubGlobal('fetch', fetcher); await getBilling(projectFixture.id, '2026-01', '2026-12'); await waitFor(() => expect(fetcher).toHaveBeenCalledOnce()); expect(String(fetcher.mock.calls[0]?.[0])).not.toMatch(/datos|catalogos/);
});
