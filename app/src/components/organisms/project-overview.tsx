import { Unavailable } from '@/components/molecules/unavailable';

const metrics = ['Avance real', 'Avance planificado', 'SPI', 'Desviación de plazo', 'Riesgos abiertos', 'Última actualización'];
export function ProjectOverview() {
  return <div className="pmo-overview">
    <dl className="pmo-kpis" aria-label="Indicadores ejecutivos">{metrics.map(label => <div key={label}><dt>{label}</dt><dd>—</dd><small>Sin datos disponibles</small></div>)}</dl>
    <div className="pmo-tracking-row">
      <section className="pmo-section pmo-curve"><header><h2>Curva S</h2><span>Planificado / Real</span></header><Unavailable title="Serie de avance no disponible">La API no proporciona series por período ni vínculos a actividades. No hay una curva para representar.</Unavailable></section>
      <section className="pmo-section"><header><h2>Último seguimiento</h2></header><Unavailable title="Seguimiento no disponible">PMO v2.1.0 aún no expone el registro semanal, sus actividades ni la fecha del último reporte.</Unavailable></section>
    </div>
    <section className="pmo-section"><header><div><p className="pmo-eyebrow">Visión comercial</p><h2>Resumen financiero</h2></div><span>Sin proyección financiera disponible</span></header>
      <dl className="pmo-finance-kpis">{['TCV total', 'Planificado exigible', 'Real facturado', 'Diferencia / cumplimiento'].map(label => <div key={label}><dt>{label}</dt><dd>—</dd></div>)}</dl>
      <p className="pmo-help">Hito (Proyecto / Operación): — · Cuota (Setup / Recurrente): — · Moneda: —</p>
      <div className="pmo-finance-table" role="region" aria-label="Matriz financiera mensual" tabIndex={0}><table><caption>Showprice / Planificado / Real · Los períodos e importes no están disponibles en el contrato vigente.</caption><thead><tr><th scope="col">Concepto</th><th scope="col">Período no disponible</th></tr></thead><tbody>{['Showprice', 'Planificado', 'Real'].map(label => <tr key={label}><th scope="row">{label}</th><td>—</td></tr>)}</tbody></table></div>
      <p className="pmo-help">No se infieren totales, importes exigibles ni cumplimiento desde los datos básicos del proyecto.</p>
    </section>
    <section className="pmo-section"><header><h2>Alertas y pendientes</h2></header><Unavailable title="Alertas no disponibles">No hay un endpoint de riesgos críticos, compromisos atrasados, cambios pendientes ni vigencia de reportes. No se puede determinar su estado.</Unavailable></section>
    <section className="pmo-section"><header><h2>Registro de eventos</h2></header><Unavailable title="Historial no disponible">La API no expone la línea de tiempo de cambios, aprobaciones y actualizaciones con fecha y actor.</Unavailable></section>
  </div>;
}
