import { useState, type ReactNode } from "react";
import { TableRegion } from "./primitives";
import { money, monthLabel } from "@/demo/finance";

export function IndicatorCards({ items }: { items: { label: string; value: ReactNode; note?: string }[] }) {
  return <dl className="indicator-cards">{items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}{item.note && <small style={{ fontFamily: "var(--gpl-font-body)", fontWeight: 400 }}>{item.note}</small>}</dd></div>)}</dl>;
}
export function ChartLegend({ items }: { items: { label: string; className: string }[] }) {
  return <div className="legend">{items.map(item => <span key={item.label}><i className={item.className} />{item.label}</span>)}</div>;
}
export function ChartFrame({ title, description, legend, children }: { title: string; description: string; legend?: ReactNode; children: ReactNode }) {
  return <section className="panel chart-panel"><header className="panel-header"><div><h2>{title}</h2><p>{description}</p></div>{legend}</header>{children}</section>;
}
export const financeSeries = [{ key: "showPricing", label: "Showpricing original", className: "original-key" }, { key: "planned", label: "Planificado PM", className: "planned-key" }, { key: "actual", label: "Real registrado", className: "actual-key" }] as const;
export function MonthlyComparison({ months, currency }: { months: { period: string; showPricing: number | null; planned: number | null; actual: number | null }[]; currency: string }) {
  const [detail, setDetail] = useState("");
  const maximum = Math.max(1, ...months.flatMap(month => financeSeries.map(series => month[series.key] ?? 0)));
  const width = Math.max(800, months.length * 180), plotHeight = 188;
  const y = (value: number) => 230 - value / maximum * plotHeight;
  const compact = (value: number) => new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return <><TableRegion label={`Comparación mensual de facturación en ${currency}`} overflowHint="Desplázate para consultar todos los meses."><svg className="finance-chart" style={{ minWidth: width }} viewBox={`0 0 ${width} 300`} role="img" aria-label={`Showpricing, plan PM y real registrado por mes, en ${currency}; cifras completas en la tabla inferior.`}>
    {[0, .5, 1].map(tick => <g key={tick}><line className="chart-gridline" x1="56" x2={width - 12} y1={y(tick * maximum)} y2={y(tick * maximum)} /><text x="48" y={y(tick * maximum) + 4} textAnchor="end">{compact(tick * maximum)}</text></g>)}
    <text x="56" y="18">{currency} · mensual</text>
    {months.map((month, index) => <g key={month.period}>{financeSeries.map((series, seriesIndex) => { const value = month[series.key], x = 80 + index * ((width - 110) / months.length) + seriesIndex * 38; const description = `${monthLabel(month.period)} · ${series.label}: ${money(value, currency)}`; return <g className={`finance-series-${series.key}`} key={series.key} tabIndex={0} aria-label={description} onFocus={() => setDetail(description)} onBlur={() => setDetail("")} onMouseEnter={() => setDetail(description)} onMouseLeave={() => setDetail("")}><title>{description}</title>{value === null ? <text x={x + 10} y="226" textAnchor="middle">—</text> : <><rect x={x} y={y(value)} width="22" height={Math.max(1, value / maximum * plotHeight)} /><text className="finance-value" x={x + 10} y={y(value) - 8} textAnchor="middle">{compact(value)}</text></>}</g>; })}<text x={128 + index * ((width - 110) / months.length)} y="268" textAnchor="middle">{monthLabel(month.period)}</text></g>)}
  </svg></TableRegion><p className="chart-readout" role="status">{detail || "Enfoca una barra para consultar su cifra completa. — indica ausencia de registro; 0 es un importe registrado."}</p></>;
}
