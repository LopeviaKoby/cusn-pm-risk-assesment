import { motion, useReducedMotion } from "motion/react";
import { billingMilestones } from "@/demo/data";
import { financeModel, financeRows, money, monthLabel } from "@/demo/finance";
import { projectRows, unique } from "@/demo/view-models";
import { useDemoSession } from "@/demo/session";
import { Link, contextualPath, useNavigation } from "@/navigation";
import { Button, Filter, TableRegion } from "@/components/ui/primitives";
import { ChartFrame, ChartLegend, financeSeries, IndicatorCards, MonthlyComparison } from "@/components/ui/analytics";

export default function Finance() {
  const { session } = useDemoSession(), { url, navigate } = useNavigation();
  const reduceMotion = useReducedMotion();
  const params = new URLSearchParams(url.split("?")[1]);
  const projectId = params.get("project") ?? "", country = params.get("country") ?? "";
  const requestedPeriod = params.get("period") ?? "";
  const period = /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedPeriod) ? requestedPeriod : "";
  const currencies = unique(billingMilestones.map(row => row.currency));
  const currency = currencies.includes(params.get("currency") ?? "") ? params.get("currency")! : currencies[0]!;
  const all = projectRows(session), selected = all.filter(row => (!projectId || row.id === projectId) && (!country || row.country === country));
  const model = financeModel(selected.map(row => row.id), currency, period);
  const periods = unique(financeRows(all.map(row => row.id), currency).map(row => row.period));
  const set = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key === "currency") next.delete("period"); navigate(`/portafolio?${next}`, true); };
  const clear = () => { const next = new URLSearchParams(params); for (const key of ["project", "country", "period"]) next.delete(key); navigate(`/portafolio?${next}`, true); };
  return <motion.div className="finance-view" data-reduced-motion={!!reduceMotion} initial={{ opacity: reduceMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : .16 }}>
    <header className="finance-heading"><h2>Finanzas</h2><p>Referencias de facturación · {currency} · {period ? monthLabel(period) : "Todos los periodos registrados"}</p></header>
    <div className="toolbar surface-toolbar"><Filter label="Proyecto" value={projectId} onChange={value => set("project", value)} options={all.map(row => ({ value: row.id, label: row.name }))} /><Filter label="País" value={country} onChange={value => set("country", value)} options={unique(all.map(row => row.country))} /><Filter label="Moneda" value={currency} onChange={value => set("currency", value)} all="" options={currencies} /><Filter label="Periodo" value={period} onChange={value => set("period", value)} options={periods.map(value => ({ value, label: monthLabel(value) }))} />{(projectId || country || period) && <Button variant="ghost" onClick={clear}>Limpiar filtros</Button>}</div>
    <IndicatorCards items={[{ label: "Showpricing original", value: money(model.showPricing, currency) }, { label: "Planificado PM", value: money(model.planned, currency) }, { label: "Real registrado", value: money(model.actual, currency), note: "Solo importes con registro real" }, { label: "Diferencia comparable", value: money(model.difference, currency), note: "Real − plan, solo proyecto/mes con ambos" }]} />
    {!model.rows.length ? <div className="empty"><h3>{selected.length ? "Sin referencias financieras" : "Sin resultados"}</h3><p>No hay registros para este alcance, periodo y moneda.</p>{(projectId || country || period) && <Button onClick={clear}>Limpiar filtros</Button>}</div> : <>
      <ChartFrame title="Facturación por mes" description="Cada referencia se ubica en su propia fecha. No se convierten monedas ni se proyecta el real." legend={<ChartLegend items={[...financeSeries]} />}><MonthlyComparison months={model.months} currency={currency} /></ChartFrame>
      <section className="panel context-panel"><header className="panel-header"><h2>Detalle por proyecto y periodo</h2><span>{model.rows.length} filas · {currency}</span></header><TableRegion label="Referencias de facturación, importes y fuentes"><table className="finance-table"><thead><tr>{["Proyecto", "Periodo", "Showpricing original", "Planificado PM", "Real registrado", "Diferencia comparable", "Estado / fuente"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{model.rows.map(row => <tr key={`${row.projectId}:${row.period}`}><th scope="row"><Link href={contextualPath(`/proyectos/${row.projectId}/resumen`, url)}>{all.find(project => project.id === row.projectId)?.name}</Link></th><td>{monthLabel(row.period)}</td><td>{money(row.showPricing, currency)}</td><td>{money(row.planned, currency)}</td><td>{money(row.actual, currency)}</td><td>{money(row.difference, currency)}</td><td><span>{row.actual === null ? "Sin registro real" : row.statuses.filter(status => status !== "Referencia de planificación").join(" · ")}</span><details><summary>Consultar fuentes</summary><ul>{row.sources.map(source => <li key={source}>{source}</li>)}</ul></details></td></tr>)}</tbody></table></TableRegion></section>
      <section className="panel context-panel"><header className="panel-header"><h2>Egresos por compras</h2><span>{currency} · mismo alcance y periodo</span></header><dl className="facts"><div><dt>Esperados</dt><dd>{money(model.costs.expected, currency)}</dd></div><div><dt>Reales registrados</dt><dd>{money(model.costs.actual, currency)}</dd></div></dl><p className="muted">Separados de la facturación y de TCV/ACV; no se calcula margen ni presupuesto operativo.</p></section>
    </>}
  </motion.div>;
}
