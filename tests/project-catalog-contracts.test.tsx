import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { getEligibleManagers, getProjectCatalogs } from '../app/src/data/project-catalogs';
import { useProjectCatalogs } from '../app/src/data/use-project-catalogs';

test('catálogos reales conservan bigint string y código sin convertirlo a paisId', async () => {
  const data = { clientes: [{ id: '9007199254740993', nombre: 'Cliente sintético', sector: null }], paises: [{ id: '10', codigo: 'CHL', nombre: 'Chile' }], lobs: [{ id: '20', nombre: 'LOB sintético' }] };
  const fetcher = vi.fn(async (path: RequestInfo | URL) => new Response(JSON.stringify({data: String(path).includes('/clientes?') ? {items: data.clientes, paginacion: {hasMore: false, nextCursor: null}} : String(path).endsWith('/paises') ? data.paises : data.lobs})));
  vi.stubGlobal('fetch', fetcher);
  expect(await getProjectCatalogs('Cliente & nombre')).toEqual({...data, paginacion: {hasMore: false, nextCursor: null}});
  expect(fetcher).toHaveBeenCalledWith('/api/v1/clientes?limit=100&after=0&q=Cliente%20%26%20nombre', expect.objectContaining({ credentials: 'same-origin' }));
});
test('candidatos usan ID de usuario del workspace y excluyen perfiles y membresías no elegibles', async () => {
  const member = { usuarioId: '9007199254740993', nombre: 'PM sintético', email: 'fixture@example.invalid', tipoUsuario: 'INTERNO', rol: 'PM', miembroActivo: true, puedeCrearProyectos: false };
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: { items: [member, { ...member, usuarioId: '2', rol: 'ADMIN' }, { ...member, usuarioId: '3', miembroActivo: false }] } })));
  vi.stubGlobal('fetch', fetcher);
  expect(await getEligibleManagers('12')).toEqual({ options: [{ id: member.usuarioId, nombre: member.nombre, email: member.email }], complete: true });
  expect(fetcher).toHaveBeenCalledWith('/api/v1/workspaces/12/elegibles?para=PM_TITULAR&limit=100', expect.objectContaining({ credentials: 'same-origin' }));
});
test('404 de catálogos tiene estado indisponible y permite reintentar sin bootstrap', async () => {
  let fail = true;
  const fetcher = vi.fn(async (path: RequestInfo | URL) => fail ? new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'No disponible' } }), { status: 404 }) : new Response(JSON.stringify({data: String(path).includes('/clientes?') ? {items: [], paginacion: {hasMore: false, nextCursor: null}} : []})));
  vi.stubGlobal('fetch', fetcher);
  function Probe() { const result = useProjectCatalogs('12', false, () => {}); return <><output>{result.sources.clientes.status}</output><button onClick={result.retry}>Reintentar</button></>; }
  render(<Probe />); await screen.findByText('unavailable'); fail = false; fireEvent.click(screen.getByText('Reintentar')); await screen.findByText('ready');
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(6));
  expect(fetcher.mock.calls.some(args => String(args[0]).includes('/catalogos'))).toBe(false);
});
