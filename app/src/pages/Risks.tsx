import { useState } from "react";
import { Badge, ExposureBadge, MetricStrip, PageHeading, SearchField, TableFooter, TableRegion } from "@/components/atoms/primitives";
import { RowActions, RowActionsHeader, RowEdit, SortHeader, useTableSort } from "@/components/organisms/table-tools";
import { useData } from "@/data/bootstrap";
import { persistRiskEdit } from "@/data/edits";
import type { Risk } from "@/data/contracts";
import { Link } from "@/navigation";
import { NewRisk } from "./ManualForms";

export default function Risks({ projectId }: { projectId?: string }) {
  const { data, refresh } = useData();
  const [query, setQuery] = useState("");
  const all = (data?.riesgos ?? []).filter(r => !projectId || r.proyectoId === projectId);
  const filtered = all.filter(r => `${r.nombre} ${r.categoria ?? ""} ${r.proyectoTvt ?? ""}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));
  const table = useTableSort(filtered, { name: r => r.nombre, status: r => r.estado, exposure: r => r.severidad });
  const fields = [
    { key: "title", label: "Riesgo", value: (r: Risk) => r.nombre, required: true },
    { key: "category", label: "Categoría", value: (r: Risk) => r.categoria },
    { key: "probability", label: "Probabilidad (1-4)", type: "number" as const, min: 1, max: 4, value: (r: Risk) => r.probabilidad },
    { key: "impact", label: "Impacto (1-4)", type: "number" as const, min: 1, max: 4, value: (r: Risk) => r.impacto },
  ];
  return <div className={projectId ? "project-register" : "page"}><PageHeading level={projectId ? "h2" : "h1"} title={projectId ? "Riesgos del proyecto" : "Riesgos"} description="Registro y evaluación actual; la ausencia de evaluación se muestra sin puntuación."><NewRisk /></PageHeading>
    <MetricStrip items={[{ value: all.length, label: "Riesgos registrados" }, { value: all.filter(r => r.severidad == null).length, label: "Sin evaluación" }]} />
    <div className="toolbar"><SearchField label="Buscar riesgo" value={query} onChange={setQuery} /></div>
    <section className="table-card"><TableRegion label="Riesgos registrados"><table className="risks-table"><thead><tr><SortHeader label="Riesgo" column="name" sort={table.sort} onToggle={table.toggle} /><th>Proyecto / alcance</th><SortHeader label="Estado" column="status" sort={table.sort} onToggle={table.toggle} /><th>Probabilidad</th><th>Impacto</th><SortHeader label="Puntuación" column="exposure" sort={table.sort} onToggle={table.toggle} /><th>Responsable</th><RowActionsHeader /></tr></thead><tbody>{table.rows.map(r => <tr key={`${r.entidad}-${r.id}`}><th scope="row"><Link className="record-link" href={r.proyectoId ? `/proyectos/${r.proyectoId}/riesgos/${r.id}` : `/riesgos/${r.entidad === "RIESGO_GLOBAL" ? `global-${r.id}` : `transversal-${r.id}`}`}>{r.nombre}</Link><small>{r.categoria ?? "Sin categoría"}</small></th><td>{r.proyectoTvt ?? "Transversal / global"}</td><td><Badge>{r.estado ?? "Sin estado"}</Badge></td><td>{r.probabilidad ?? "Sin evaluación"}</td><td>{r.impacto ?? "Sin evaluación"}</td><td><ExposureBadge type={r.tipo ?? ""} score={r.severidad} /></td><td>{r.responsableNombre ?? "Sin asignar"}</td><RowActions><RowEdit row={r} label="riesgo" record={r.nombre} fields={fields} onSave={async (_id, patch) => { await persistRiskEdit(r, patch); await refresh(); }} /></RowActions></tr>)}</tbody></table></TableRegion><TableFooter count={table.rows.length} total={all.length} noun="riesgos" /></section>
  </div>;
}
