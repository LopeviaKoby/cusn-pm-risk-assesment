import { useState } from "react";
import { Button, MetricStrip, PageHeading, SearchField, TableFooter, TableRegion } from "@/components/atoms/primitives";
import { Progress, Status } from "@/components/molecules/project-indicators";
import { RowActions, RowActionsHeader, RowEdit, SortHeader, useTableSort } from "@/components/organisms/table-tools";
import { useData } from "@/data/bootstrap";
import { persistProjectEdit } from "@/data/edits";
import { date, number } from "@/data/format";
import type { Project } from "@/data/contracts";
import { Link } from "@/navigation";
import { NewProject } from "./ManualForms";

export default function Projects() {
  const { data, refresh } = useData();
  const [query, setQuery] = useState("");
  const all = data?.proyectos ?? [];
  const filtered = all.filter(p => `${p.tvt} ${p.nombre} ${p.cliente.nombre}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));
  const table = useTableSort(filtered, { name: p => p.nombre, status: p => p.estado, progress: p => p.avanceRealPct, end: p => p.fechaTerminoProyecto });
  const fields = [
    { key: "name", label: "Proyecto", value: (p: Project) => p.nombre, required: true },
    { key: "status", label: "Estado", type: "select" as const, options: (data?.catalogos.estados ?? []).map(s => ({ value: s.nombre, label: s.nombre })), value: (p: Project) => p.estado },
    { key: "plannedProgress", label: "Avance planificado (%)", type: "number" as const, min: 0, max: 100, value: (p: Project) => p.avancePlanificadoPct },
    { key: "actualProgress", label: "Avance real (%)", type: "number" as const, min: 0, max: 100, value: (p: Project) => p.avanceRealPct },
    { key: "situationNote", label: "Actividades", value: (p: Project) => p.situacion },
    { key: "nextSteps", label: "Próximos pasos", value: (p: Project) => p.proximosPasos },
  ];
  return <div className="page"><PageHeading title="Proyectos" description="Proyectos visibles y avance registrado en PostgreSQL."><NewProject /></PageHeading>
    <MetricStrip items={[{ value: all.length, label: "Proyectos" }, { value: all.filter(p => p.estado === "En ejecución").length, label: "En ejecución" }, { value: all.reduce((sum,p) => sum + p.riesgosAbiertos,0), label: "Riesgos abiertos" }]} />
    <div className="toolbar"><SearchField label="Buscar proyecto o cliente" value={query} onChange={setQuery} />{query && <Button variant="ghost" onClick={() => setQuery("")}>Limpiar</Button>}</div>
    <section className="table-card"><TableRegion label="Proyectos"><table className="projects-table"><thead><tr><SortHeader label="Proyecto" column="name" sort={table.sort} onToggle={table.toggle} /><th>Cliente</th><SortHeader label="Estado" column="status" sort={table.sort} onToggle={table.toggle} /><SortHeader label="Avance plan / real" column="progress" sort={table.sort} onToggle={table.toggle} /><th>SPI</th><SortHeader label="Término" column="end" sort={table.sort} onToggle={table.toggle} /><RowActionsHeader /></tr></thead><tbody>{table.rows.map(p => <tr key={p.id}><th scope="row"><Link className="record-link" href={`/proyectos/${p.id}/resumen`}>{p.tvt} · {p.nombre}</Link></th><td>{p.cliente.nombre}</td><td><Status value={p.estado} /></td><td><Progress planned={p.avancePlanificadoPct == null ? null : p.avancePlanificadoPct / 100} actual={p.avanceRealPct == null ? null : p.avanceRealPct / 100} /></td><td>{number(p.spiRatio)}</td><td>{date(p.fechaTerminoProyecto)}</td><RowActions><RowEdit row={p} label="proyecto" record={p.nombre} fields={fields} onSave={async (_id, patch) => { await persistProjectEdit(p, patch); await refresh(); }} /></RowActions></tr>)}</tbody></table></TableRegion><TableFooter count={table.rows.length} total={all.length} noun="proyectos" /></section>
  </div>;
}
