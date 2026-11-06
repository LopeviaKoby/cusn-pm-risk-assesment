import { Unavailable } from '@/components/molecules/unavailable';
import { ProgressChart } from '@/components/molecules/progress-chart';

const metrics = ['Avance real', 'Avance planificado', 'SPI', 'Desviación de plazo', 'Riesgos abiertos', 'Última actualización'];
export function ProjectOverview() {
  return <div className="pmo-overview">
    <dl className="pmo-kpis" aria-label="Indicadores ejecutivos">{metrics.map(label => <div key={label}><dt>{label}</dt><dd>—</dd><small>Sin datos disponibles</small></div>)}</dl>
    <div className="pmo-tracking-row">
      <section className="pmo-section pmo-curve"><header><h2>Curva S</h2><span>Planificado / Real</span></header><ProgressChart /></section>
      <section className="pmo-section"><header><h2>Último seguimiento</h2></header><Unavailable title="Seguimiento no disponible">PMO v2.1.0 aún no expone el registro semanal, sus actividades ni la fecha del último reporte.</Unavailable></section>
    </div>
    <section className="pmo-section"><h2>Resumen financiero</h2><p>Consulta el contrato y los importes por unidad en la pestaña Facturación. Los agregados se obtienen del servidor, sin cálculos locales.</p></section>
    <section className="pmo-section"><header><h2>Alertas y pendientes</h2></header><Unavailable title="Alertas no disponibles">No hay un endpoint de riesgos críticos, compromisos atrasados, cambios pendientes ni vigencia de reportes. No se puede determinar su estado.</Unavailable></section>
    <section className="pmo-section"><header><h2>Registro de eventos</h2></header><Unavailable title="Historial no disponible">La API no expone la línea de tiempo de cambios, aprobaciones y actualizaciones con fecha y actor.</Unavailable></section>
  </div>;
}
