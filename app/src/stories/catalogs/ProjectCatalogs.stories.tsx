import { ProjectCreateForm } from '@/components/organisms/project-create-form';
import { CreateClientDialog } from '@/components/organisms/create-client-dialog';
import { SearchableSelect } from '@/components/molecules/searchable-select';
import { ApiError } from '@/data/client';
import type { CountryOption } from '@/data/project-catalogs';
import '@/design-system/projects.css';
import '@/design-system/catalogs.css';

export default {
  id: 'catalog-fixtures', title: 'Fixtures/Catálogos del proyecto',
  parameters: { docs: { description: { component: 'Datos sintéticos y callbacks de prueba. No se conecta con la API ni representa persistencia operativa.' } } },
  decorators: [(Story: () => React.JSX.Element) => <div className="pmo-content" style={{ color: 'var(--foreground)', minHeight: 600 }}><Story /></div>],
};
const country: CountryOption = { id: '100', nombre: 'Chile', codigo: 'CHL' };
export function Contextual() {
  return <ProjectCreateForm workspace={{ id: '12', nombre: 'Workspace de prueba', slug: 'workspace-prueba', version: '1' }} session={{ identifier: 'fixture@example.invalid', expiresAt: '2099-01-01T00:00:00Z', role: 'ADMIN', permissions: ['proyectos.crear'] }} catalogs={{ clientes: [{ id: '1', nombre: 'Cliente de prueba' }], paises: [country], lobs: [{ id: '20', nombre: 'Cloud solutions' }, { id: '21', nombre: 'Velvet IA empresarial' }], titulares: [{ id: '30', nombre: 'PM de prueba' }] }} clientCreation={{ authorized: true, create: async input => ({ id: '9007199254740993', nombre: input.nombre }) }} onCreate={async input => ({ id: '42', workspaceId: input.workspaceId, tvt: input.tvt, nombre: input.nombre, version: '1' })} onCreated={() => {}} onCancel={() => {}} />;
}
export function Loading() { return <SearchableSelect id="loading-fixture" label="Cliente" value="" options={[]} status="loading" onChange={() => {}} />; }
export function Empty() { return <SearchableSelect id="empty-fixture" label="LOB" value="" options={[]} onChange={() => {}} />; }
export function Partial() { return <SearchableSelect id="partial-fixture" label="País" value="" options={[]} complete={false} onChange={() => {}} />; }
export function FailedQuery() { return <SearchableSelect id="failed-fixture" label="Cliente" value="" options={[]} status="error" message="No pudimos consultar los clientes." onChange={() => {}} />; }
export function ClientConflict() { return <CreateClientDialog initialName="Cliente de prueba" create={async () => { throw new ApiError(409, 'CONFLICT', 'Ya existe un registro con este nombre.'); }} onCreated={() => {}} onCancel={() => {}} />; }
export function ClientServiceUnavailable() { return <CreateClientDialog initialName="Cliente de prueba" onCreated={() => {}} onCancel={() => {}} />; }
