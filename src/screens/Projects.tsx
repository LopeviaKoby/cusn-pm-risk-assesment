import { Badge, Button, Empty, Filter, MetricStrip, PageHeading, SearchField, TableFooter, TableRegion, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { date, defaultProjectFilters, filterProjects, percent, projectRows, projectViews, readProjectFilters, relativeDate, unique, type ProjectFilters, type ProjectRow } from "@/demo/view-models";
import { projectStatusTone } from "@/demo/presentation";
import { useDemoSession } from "@/demo/session";
import { contextualPath, Link, useNavigation } from "@/navigation";
import { NewProject } from "./ManualForms";

export function Progress({ planned, actual }: { planned: number | null; actual: number | null }) {
  return <div className="progress-cell"><span>Plan {percent(planned)} · Real {percent(actual)}</span><div className="progress-track" aria-hidden="true"><i className="planned" style={{ width: `${(planned ?? 0) * 100}%` }} /><i className="actual" style={{ width: `${(actual ?? 0) * 100}%` }} /></div></div>;
}
export function Status({ value }: { value: string }) {
  return <Badge tone={projectStatusTone(value)}>{value}</Badge>;
}
export function ProjectTable({ rows }: { rows: ProjectRow[] }) {
  const { url } = useNavigation();
  return <TableRegion label="Proyectos, todas las columnas"><table className="projects-table"><thead><tr>
    {["Proyecto", "Gestor", "Estado", "Avance plan / real", "SPI", "Riesgos abiertos", "Término", "Actualización"].map(label => <th scope="col" key={label}>{label}</th>)}
  </tr></thead><tbody>{rows.map(row => <tr key={row.id}>
    <th scope="row"><Link className="record-link" href={contextualPath(`/proyectos/${row.id}/resumen`, url)}>{row.name}</Link><small>{row.client.name} · {row.country}</small></th>
    <td>{row.manager.name}<small>{row.lob}</small></td><td><Status value={row.status} /></td>
    <td><Progress planned={row.plannedProgress} actual={row.actualProgress} /></td>
    <td className={row.belowSpi ? "progress-behind numeric" : "numeric"}>{percent(row.spi)}</td>
    <td className="numeric">{row.openRiskCount}</td><td>{date(row.plannedEndDate)}</td>
    <td><span title={date(row.updatedAt)}>{relativeDate(row.updatedAt)}</span><small>{date(row.updatedAt)}</small></td>
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
  const setSort = (sort: string) => update({ sort });
  const all = projectRows(session);
  const clear = () => update({ ...defaultProjectFilters, view: tab });
  const { rows, counts, summary } = filterProjects(all, filters);
  const content = <>
    <div className="toolbar"><SearchField label="Buscar proyecto o cliente" value={query} onChange={setQuery} />
      <Filter label="Estado" value={status} onChange={setStatus} options={unique(all.map(row => row.status))} />
      <Filter label="Gestor" value={manager} onChange={setManager} options={[...new Map(all.map(row => [row.managerId, { value: row.managerId, label: row.manager.name }])).values()]} />
      <Filter label="País" value={country} onChange={setCountry} options={unique(all.map(row => row.country))} />
      <Filter label="LOB" value={lob} onChange={lob => update({ lob })} options={unique(all.map(row => row.lob))} />
      <Filter label="Squad" value={squad} onChange={squad => update({ squad })} options={unique(all.map(row => row.squad))} />
      <Filter label="Líder técnico" value={lead} onChange={lead => update({ lead })} options={unique(all.map(row => row.techLead))} />
      <Filter label="Ordenar" value={sort} onChange={setSort} all="" options={[{ value: "updated", label: "Última actualización" }, { value: "name", label: "Proyecto A–Z" }, { value: "spi", label: "Menor SPI" }, { value: "end", label: "Próximo término" }]} />
      {(query || status || manager || country || lob || squad || lead || sort !== "updated") && <Button variant="ghost" onClick={clear}>Limpiar filtros</Button>}
    </div>
    <section className="table-card">{rows.length ? <ProjectTable rows={rows} /> : <Empty onClear={clear} />}<TableFooter count={rows.length} total={all.length} noun="proyectos" /></section>
  </>;
  return <div className="page"><PageHeading title="Proyectos" description="Consulta el estado, avance y riesgos de los proyectos bajo seguimiento."><NewProject /></PageHeading>
    <MetricStrip items={[{ value: rows.length, label: "Proyectos listados" }, { value: summary.executing, label: "En ejecución" }, { value: summary.behind, label: "Bajo lo planificado", tone: "progress" }, { value: summary.risks, label: "Riesgos de estos proyectos" }]} />
    <Tabs value={tab} onValueChange={value => update({ view: String(value) })}><TabsList aria-label="Vistas de proyectos">
      {projectViews.map(view => <TabsTrigger key={view.value} value={view.value}>{view.label}<span className="count">{counts[view.value]}</span></TabsTrigger>)}
    </TabsList>{["all", "mine", "attention", "execution"].map(value => <TabsContent key={value} value={value}>{content}</TabsContent>)}</Tabs>
    <p className="footnote">Requieren atención: SPI menor a 80 %, revisión vencida o proyecto detenido. Los riesgos transversales se consultan en Riesgos.</p>
  </div>;
}
