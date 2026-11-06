import { lazy, Suspense } from 'react';
import { Spinner } from '@/components/atoms/catalog';
import { Unavailable } from './unavailable';
import '@/design-system/charts.css';

export interface ProgressPoint { periodo: string; planificado: number | null; real: number | null }
const ProgressPlot = lazy(() => import('./progress-plot'));
const noPoints: readonly ProgressPoint[] = [];

// Presentation only: callers provide authenticated series; no interpolation or KPI calculation.
export function ProgressChart({ points = noPoints }: { points?: readonly ProgressPoint[] }) {
  if (!points.length) return <Unavailable title="Serie de avance no disponible">La API no proporciona series por período ni vínculos a actividades. No hay una curva para representar.</Unavailable>;
  return <div className="pmo-progress-chart">
    <Suspense fallback={<Spinner label="Cargando gráfico de avance" />}><ProgressPlot points={points} /></Suspense>
    <details><summary>Ver datos del gráfico</summary><div className="pmo-chart-table"><table><caption>Avance por período (%)</caption><thead><tr><th scope="col">Período</th><th scope="col">Planificado</th><th scope="col">Real</th></tr></thead><tbody>{points.map(point => <tr key={point.periodo}><th scope="row">{point.periodo}</th><td>{point.planificado ?? '—'}</td><td>{point.real ?? '—'}</td></tr>)}</tbody></table></div></details>
  </div>;
}
