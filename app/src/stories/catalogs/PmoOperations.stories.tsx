import {useState} from 'react';
import {NavigationProvider} from '@/navigation';
import {PortfolioTable} from '@/components/organisms/portfolio-table';
import {ProjectPeek} from '@/components/organisms/project-peek';
import {BillingMatrix} from '@/components/organisms/billing-matrix';
import {BillingLineForm} from '@/components/organisms/billing-line-form';
import {DriveTree} from '@/components/organisms/drive-tree';
import Analytics from '@/components/organisms/portfolio-analytics';
import {projectFixture, portfolioFixture, billingFixture, driveFixture} from './pmo-fixtures';
import '@/design-system/projects.css';
import '@/design-system/operations.css';
export default {id: 'pmo-operations', title: 'Fixtures/Operaciones PMO', decorators: [(Story: () => React.JSX.Element) => <NavigationProvider><main className="pmo-content" style={{padding: 24, color: 'var(--foreground)'}}><p>Fixtures sintéticos · Sin persistencia operativa</p><Story/></main></NavigationProvider>]};
export function DensePortfolio() {const [open, setOpen] = useState(false), [direction, setDirection] = useState('asc'), [state, setState] = useState(''); return <><h1>Portafolio · fixture</h1><p>Orden solicitado: {direction}</p><PortfolioTable rows={portfolioFixture.items.filter(row => !state || row.estado === state)} onPeek={() => setOpen(true)} onSort={(_key, next) => setDirection(next)} detail={open ? {...projectFixture, accionesDisponibles: {...projectFixture.accionesDisponibles, puedeEditarFicha: false}} : null} onSaveName={async () => {}} onReloadDetail={() => {}} filters={{Estado: <label>Filtrar estado<select value={state} onChange={event => setState(event.target.value)}><option value="">Todos</option><option>En ejecución</option></select></label>}}/>{open && <ProjectPeek project={{...projectFixture, accionesDisponibles: {...projectFixture.accionesDisponibles, puedeEditarFicha: false}}} error="" origin="/portafolio" onClose={() => setOpen(false)} onReload={() => {}}/>}</>;}
export function MonthlyBilling() {const [selected, setSelected] = useState(''); return <><h1>Facturación · fixture</h1><BillingMatrix data={billingFixture} onPeriod={(period, unit) => setSelected(`${period} ${unit}`)}/><p role="status">{selected}</p></>;}
export function BillingEditor() {const [saved, setSaved] = useState(false); return <>{saved ? <p>Callback de fixture ejecutado</p> : <BillingLineForm line={billingFixture.hitos[0]} onSave={async () => {}} onSaved={() => setSaved(true)} onConflict={() => {}}/>}</>;}
export function BillingConflict() {return <BillingLineForm line={billingFixture.hitos[0]} onSave={async () => {throw new Error('Conflicto simulado; datos preservados.');}} onSaved={() => {}} onConflict={() => {}}/>;}
export function DriveCompleted() {return <DriveTree data={driveFixture}/>;}
export function DrivePending() {return <DriveTree data={{...driveFixture, estado: 'PENDIENTE', carpetas: [], updatedAt: null}}/>;}
export function DriveError() {return <DriveTree data={{...driveFixture, estado: 'ERROR', errorCodigo: 'DRIVE_FORBIDDEN'}}/>;}
export function AnalyticalBoard() {const [state, setState] = useState(''); return <><p role="status">Filtro solicitado: {state}</p><Analytics data={portfolioFixture} onState={setState}/></>;}
