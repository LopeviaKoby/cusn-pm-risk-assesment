import { ProgressChart } from '@/components/molecules/progress-chart';
export default { id: 'progress-fixtures', title: 'Fixtures/Gráficos', parameters: { docs: { description: { component: 'Series sintéticas exclusivas de Storybook; no representan métricas del producto.' } } } };
export function SyntheticSeries() { return <ProgressChart points={[{ periodo: 'Ene', planificado: 10, real: 8 }, { periodo: 'Feb', planificado: 35, real: 30 }, { periodo: 'Mar', planificado: 65, real: null }, { periodo: 'Abr', planificado: 100, real: 90 }]} />; }
export function UnavailableSeries() { return <ProgressChart />; }
