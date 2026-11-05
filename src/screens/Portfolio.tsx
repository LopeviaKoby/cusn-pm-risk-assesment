import { loadScreen, RouteContent } from "@/components/ui/route-loader";
const Finance = loadScreen(() => import("./Finance"));
import { ChartLegend } from "@/components/ui/analytics";
import { useNavigation } from "@/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/primitives";
import { CircleAlert } from "lucide-react";
import { Badge, Button, Empty, Filter, MetricStrip, PageHeading, TableRegion } from "@/components/ui/primitives";
import { RowActions, RowActionsHeader, RowEdit, SortHeader, useRowEdits, useTableSort } from "@/components/ui/table-tools";
import { persistProjectEdit } from "@/data/edits";
import { asOfDate, date, filteredPortfolioRisks, number, percent, projectRows, unique, type ProjectRow } from "@/demo/view-models";
import { Progress, Status } from "@/components/ui/project-indicators";
import { useDemoSession } from "@/demo/session";
import { dataMode } from "@/data/mode";

const asPercent = (value: number | null) => value === null ? null : Math.round(value * 1000) / 10;
function AttentionTable({ rows }: { rows: ProjectRow[] }) {
  const edits = useRowEdits("portafolio-atencion", rows, dataMode === "api" ? persistProjectEdit : undefined);
  const table = useTableSort(edits.rows, {
    project: row => row.name,
    status: row => row.status,
    progress: row => row.actualProgress,
    spi: row => row.spi,
    difference: row => row.actualProgress !== null && row.plannedProgress !== null ? row.actualProgress - row.plannedProgress : null,
    manager: row => row.manager.name,
  });
  const fields = [
    { key: "name", label: "Proyecto", value: (row: ProjectRow) => row.name, required: true },
    { key: "status", label: "Estado", type: "select" as const, options: unique(rows.map(row => row.status)).map(value => ({ value, label: value })), value: (row: ProjectRow) => row.status },
    { key: "plannedProgress", label: "Avance planificado (%)", type: "number" as const, min: 0, max: 100, value: (row: ProjectRow) => asPercent(row.plannedProgress), parse: (value: string) => value === "" ? null : Number(value) / 100 },
    { key: "actualProgress", label: "Avance real (%)", type: "number" as const, min: 0, max: 100, value: (row: ProjectRow) => asPercent(row.actualProgress), parse: (value: string) => value === "" ? null : Number(value) / 100 },
    { key: "plannedEndDate", label: "Término previsto", type: "date" as const, value: (row: ProjectRow) => row.plannedEndDate },
  ];
  return <TableRegion label="Proyectos que requieren atención"><table className="attention-table"><thead><tr>
    <SortHeader label="Proyecto" column="project" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Estado" column="status" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Avance plan / real" column="progress" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="SPI" column="spi" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Diferencia" column="difference" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Gestor" column="manager" sort={table.sort} onToggle={table.toggle} />
    <RowActionsHeader />
  </tr></thead><tbody>{table.rows.map(row => <tr key={row.id} className="data-row"><th scope="row">{row.name}</th><td><Status value={row.status} /></td><td><Progress planned={row.plannedProgress} actual={row.actualProgress} /></td><td>{percent(row.spi)}</td><td className="progress-behind">{row.actualProgress !== null && row.plannedProgress !== null ? `${number((row.actualProgress - row.plannedProgress) * 100)} pp` : "—"}</td><td>{row.manager.name}</td>
    <RowActions><RowEdit row={row} label="proyecto" record={row.name} fields={fields} onSave={edits.save} /></RowActions>
  </tr>)}</tbody></table></TableRegion>;
}

function PortfolioOverview() {
  const { session } = useDemoSession();
  const { url, navigate } = useNavigation();
  const params = new URLSearchParams(url.split("?")[1]);
  const country = params.get("generalCountry") ?? "", manager = params.get("generalManager") ?? "", status = params.get("generalStatus") ?? "";
  const update = (patch: Record<string, string>) => { const next = new URLSearchParams(params); for (const [key, value] of Object.entries(patch)) { if (value) next.set(key, value); else next.delete(key); } navigate(`/portafolio${next.size ? `?${next}` : ""}`, true); };
  const setCountry = (value: string) => update({ generalCountry: value }), setManager = (value: string) => update({ generalManager: value }), setStatus = (value: string) => update({ generalStatus: value });
  const all = projectRows(session);
  const rows = all.filter(row => (!country || row.country === country) && (!manager || row.managerId === manager) && (!status || row.status === status));
  const filtered = !!(country || manager || status);
  const overdue = filteredPortfolioRisks(rows, filtered, session).filter(row => row.overdue);
  const isApi = dataMode === "api";
  const states = unique(rows.map(row => row.status)).map(label => ({ label, count: rows.filter(row => row.status === label).length }));
  const attention = rows.filter(row => row.needsAttention).sort((a, b) => (a.spi ?? Infinity) - (b.spi ?? Infinity));
  const clear = () => update({ generalCountry: "", generalManager: "", generalStatus: "" });
  return <div className="portfolio-overview">
    <div className="toolbar surface-toolbar"><Filter label="País" value={country} onChange={setCountry} options={unique(all.map(row => row.country))} /><Filter label="Gestor" value={manager} onChange={setManager} options={[...new Map(all.map(row => [row.managerId, { value: row.managerId, label: row.manager.name }])).values()]} /><Filter label="Estado" value={status} onChange={setStatus} options={unique(all.map(row => row.status))} />
      {filtered && <Button variant="ghost" onClick={clear}>Limpiar filtros</Button>}<small className="toolbar-note">{filtered ? "Revisiones de los proyectos filtrados" : "Incluye riesgos transversales"}</small></div>
    <MetricStrip items={[{ value: rows.length, label: "Proyectos totales" }, { value: rows.filter(row => row.executing).length, label: "En ejecución" }, { value: rows.filter(row => row.belowSpi).length, label: "Proyectos con SPI < 80 %" }, ...(!isApi ? [{ value: overdue.length, label: "Revisiones vencidas", tone: "review" as const }] : [])]} />
    {!rows.length ? <Empty onClear={clear} /> : <>
      <div className="portfolio-grid"><section className="panel chart-panel"><header className="panel-header"><div><h2>Avance de proyectos</h2><p>Comparación del avance planificado y real.</p></div><ChartLegend items={[{ label: "Planificado", className: "planned-key" }, { label: "Real", className: "actual-key" }]} /></header>
        <div className="bar-chart">{rows.map(row => <div className="chart-row" key={row.id}><div className="chart-label"><span>{row.name}</span><span className={row.behind ? "progress-behind" : ""}>{row.actualProgress !== null && row.plannedProgress !== null ? `${row.actualProgress >= row.plannedProgress ? "+" : ""}${number((row.actualProgress - row.plannedProgress) * 100)} pp` : "—"}</span></div>
          <div className="bar-line"><span className="bar-track"><i className="planned" style={{ width: `${(row.plannedProgress ?? 0) * 100}%` }} /></span><span>{percent(row.plannedProgress)}</span><span className="sr-only">planificado</span></div>
          <div className="bar-line"><span className="bar-track"><i className="actual" style={{ width: `${(row.actualProgress ?? 0) * 100}%` }} /></span><span>{percent(row.actualProgress)}</span><span className="sr-only">real</span></div>
        </div>)}</div>
      </section><div className="portfolio-side"><section className="panel"><header className="panel-header"><div><h2>Estado de los proyectos</h2><p>Distribución de los proyectos seleccionados.</p></div></header>
        <ul className="state-list">{states.map(state => <li key={state.label}><span>{state.label}</span><strong>{state.count}</strong><span>{percent(state.count / rows.length, 1)}</span><meter aria-label={state.label} value={state.count} max={rows.length} /></li>)}</ul>
      </section>{!isApi && <section className="panel overdue-panel"><header className="panel-header"><h2><CircleAlert aria-hidden="true" />Revisiones vencidas</h2><Badge tone="review">{overdue.length}</Badge></header>
        {overdue.length ? <ul className="overdue-list">{overdue.map(risk => <li key={risk.id}><div><small>{risk.id}</small><Badge tone="review">{date(risk.reviewDate)} · vencida</Badge></div><strong>{risk.title}</strong><small>{risk.projectName}</small></li>)}</ul> : <p className="muted">Sin revisiones vencidas en este alcance.</p>}
      </section>}</div></div>
      <section className="panel attention-panel"><header className="panel-header"><div><h2>Proyectos que requieren atención</h2><p>{isApi ? "SPI menor a 80 % o proyecto detenido." : "SPI menor a 80 %, revisiones vencidas o proyecto detenido."}</p></div></header>
        {attention.length ? <AttentionTable rows={attention} /> : <p className="muted">No hay proyectos que requieran atención en esta selección.</p>}
      </section>
    </>}
  </div>;
}

export default function Portfolio() {
  const { url, navigate } = useNavigation();
  const params = new URLSearchParams(url.split("?")[1]);
  const tab = params.get("vista") === "finanzas" ? "finanzas" : "general";
  return <div className="page portfolio-page"><PageHeading title="Portafolio" description="Visión consolidada del desempeño, avance y riesgos de los proyectos."><span className="cutoff">Corte: {date(asOfDate)}</span></PageHeading><Tabs value={tab} onValueChange={value => { const next = new URLSearchParams(params); if (value === "finanzas") next.set("vista", "finanzas"); else next.delete("vista"); navigate(`/portafolio${next.size ? `?${next}` : ""}`); }}><TabsList aria-label="Vistas de Portafolio"><TabsTrigger value="general">Visión general</TabsTrigger><TabsTrigger value="finanzas">Finanzas</TabsTrigger></TabsList><TabsContent value="general"><PortfolioOverview /></TabsContent><TabsContent value="finanzas"><RouteContent><Finance /></RouteContent></TabsContent></Tabs></div>;
}
