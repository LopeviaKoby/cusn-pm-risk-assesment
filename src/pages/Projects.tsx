import { Button, Empty, Filter, MetricStrip, PageHeading, SearchField, TableFooter, TableRegion, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/primitives";
import { RowActions, RowActionsHeader, RowEdit, SortHeader, useRowEdits, useTableSort, type EditField } from "@/components/organisms/table-tools";
import { persistProjectEdit } from "@/data/edits";
import { date, defaultProjectFilters, filterProjects, percent, projectRows, projectViews, readProjectFilters, relativeDate, unique, type ProjectFilters, type ProjectRow } from "@/demo/view-models";
import { projectStates } from "@/demo/catalogs";
import { Progress, Status } from "@/components/molecules/project-indicators";
import { useDemoSession } from "@/demo/session";
import { dataMode } from "@/data/mode";
import { contextualPath, Link, useNavigation } from "@/navigation";
import { NewProject } from "./ManualForms";

const asPercent = (value: number | null) => value === null ? null : Math.round(value * 1000) / 10;
function projectEditFields(rows: ProjectRow[]): EditField<ProjectRow>[] {
  return [
    { key: "name", label: "Proyecto", value: row => row.name, required: true },
    { key: "status", label: "Estado", type: "select", options: unique([...projectStates, ...rows.map(row => row.status)]).map(value => ({ value, label: value })), value: row => row.status },
    { key: "plannedProgress", label: "Avance planificado (%)", type: "number", min: 0, max: 100, value: row => asPercent(row.plannedProgress), parse: value => value === "" ? null : Number(value) / 100 },
    { key: "actualProgress", label: "Avance real (%)", type: "number", min: 0, max: 100, value: row => asPercent(row.actualProgress), parse: value => value === "" ? null : Number(value) / 100 },
    { key: "plannedEndDate", label: "Término previsto", type: "date", value: row => row.plannedEndDate },
    { key: "situationNote", label: "Actividades", value: row => row.situationNote ?? "" },
    { key: "nextSteps", label: "Próximos pasos", value: row => row.nextSteps ?? "" },
  ];
}
export function ProjectTable({ rows }: { rows: ProjectRow[] }) {
  const { url } = useNavigation();
  const edits = useRowEdits("proyectos", rows, dataMode === "api" ? persistProjectEdit : undefined);
  const table = useTableSort(edits.rows, {
    name: row => row.name,
    manager: row => row.manager.name,
    status: row => row.status,
    progress: row => row.actualProgress,
    spi: row => row.spi,
    risks: row => row.openRiskCount,
    end: row => row.plannedEndDate,
    updated: row => row.updatedAt,
  });
  const fields = projectEditFields(rows);
  const columns = [
    { key: "name", label: "Proyecto" }, { key: "manager", label: "Gestor" }, { key: "status", label: "Estado" },
    { key: "progress", label: "Avance plan / real" }, { key: "spi", label: "SPI" }, { key: "risks", label: "Riesgos abiertos" },
    { key: "end", label: "Término" }, { key: "updated", label: "Actualización" },
  ];
  return <TableRegion label="Proyectos, todas las columnas"><table className="projects-table"><thead><tr>
    {columns.map(column => <SortHeader key={column.key} label={column.label} column={column.key} sort={table.sort} onToggle={table.toggle} />)}
    <RowActionsHeader />
  </tr></thead><tbody>{table.rows.map(row => <tr key={row.id} className="data-row">
    <th scope="row"><Link className="record-link" href={contextualPath(`/proyectos/${row.id}/resumen`, url)}>{row.name}</Link><small>{row.client.name} · {row.country}</small></th>
    <td>{row.manager.name}<small>{row.lob}</small></td><td><Status value={row.status} /></td>
    <td><Progress planned={row.plannedProgress} actual={row.actualProgress} /></td>
    <td className={row.belowSpi ? "progress-behind numeric" : "numeric"}>{percent(row.spi)}</td>
    <td className="numeric">{row.openRiskCount}</td><td>{date(row.plannedEndDate)}</td>
    <td><span title={date(row.updatedAt)}>{relativeDate(row.updatedAt)}</span><small>{date(row.updatedAt)}</small></td>
    <RowActions><RowEdit row={row} label="proyecto" record={row.name} fields={fields} onSave={edits.save} /></RowActions>
  </tr>)}</tbody></table></TableRegion>;
}
export default function Projects() {
  const { session } = useDemoSession();
  const { url, navigate } = useNavigation();
  const filters = readProjectFilters(url.split("?")[1] ?? "");
  const { view: tab, query, status, manager, country, lob, squad, lead, sort } = filters;
  const update = (patch: Partial<ProjectFilters>) => {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    for (const key of Object.keys(next) as (keyof ProjectFilters)[]) if (next[key] !== defaultProjectFilters[key]) params.set(key === "query" ? "q" : key, next[key]);
    navigate(`/proyectos${params.size ? `?${params}` : ""}`, next.view === tab);
  };
  const setQuery = (query: string) => update({ query });
  const setStatus = (status: string) => update({ status });
  const setManager = (manager: string) => update({ manager });
  const setCountry = (country: string) => update({ country });
  const all = projectRows(session);
  const clear = () => update({ ...defaultProjectFilters, view: tab });
  const { rows, counts, summary } = filterProjects(all, filters);
  const views = dataMode === "api" ? projectViews.filter(view => view.value !== "mine") : projectViews;
  const content = <>
    <div className="toolbar"><SearchField label="Buscar proyecto o cliente" value={query} onChange={setQuery} />
      <Filter label="Estado" value={status} onChange={setStatus} options={unique(all.map(row => row.status))} />
      <Filter label="Gestor" value={manager} onChange={setManager} options={[...new Map(all.map(row => [row.managerId, { value: row.managerId, label: row.manager.name }])).values()]} />
      <Filter label="País" value={country} onChange={setCountry} options={unique(all.map(row => row.country))} />
      <Filter label="LOB" value={lob} onChange={lob => update({ lob })} options={unique(all.map(row => row.lob))} />
      <Filter label="Squad" value={squad} onChange={squad => update({ squad })} options={unique(all.map(row => row.squad))} />
      <Filter label="Líder técnico" value={lead} onChange={lead => update({ lead })} options={unique(all.map(row => row.techLead))} />
      {(query || status || manager || country || lob || squad || lead || sort !== "updated") && <Button variant="ghost" onClick={clear}>Limpiar filtros</Button>}
    </div>
    <section className="table-card">{rows.length ? <ProjectTable rows={rows} /> : <Empty onClear={clear} />}<TableFooter count={rows.length} total={all.length} noun="proyectos" /></section>
  </>;
  return <div className="page"><PageHeading title="Proyectos" description="Consulta el estado, avance y riesgos de los proyectos bajo seguimiento."><NewProject /></PageHeading>
    <MetricStrip items={[{ value: rows.length, label: "Proyectos listados" }, { value: summary.executing, label: "En ejecución" }, { value: summary.behind, label: "Bajo lo planificado", tone: "progress" }, { value: summary.risks, label: "Riesgos de estos proyectos" }]} />
    <Tabs value={tab} onValueChange={value => update({ view: String(value) })}><TabsList aria-label="Vistas de proyectos">
      {views.map(view => <TabsTrigger key={view.value} value={view.value}>{view.label}<span className="count">{counts[view.value]}</span></TabsTrigger>)}
    </TabsList>{views.map(view => <TabsContent key={view.value} value={view.value}>{content}</TabsContent>)}</Tabs>
    <p className="footnote">Requieren atención: SPI menor a 80 %, revisión vencida o proyecto detenido. Los riesgos transversales se consultan en Riesgos.</p>
  </div>;
}
