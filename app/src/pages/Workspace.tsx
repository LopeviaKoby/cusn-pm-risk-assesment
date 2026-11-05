import { MetricStrip, PageHeading, TableRegion } from "@/components/atoms/primitives";
import { useData } from "@/data/bootstrap";
import { date, percent } from "@/data/format";
import { Link } from "@/navigation";

export default function Workspace() {
  const { data } = useData();
  const projects = data?.proyectos ?? [];
  const risks = data?.riesgos ?? [];
  return <div className="page"><PageHeading title="Workspace" description="Portafolio y riesgos visibles para tu sesión." />
    <MetricStrip items={[{ value: projects.length, label: "Proyectos" }, { value: projects.filter(p => p.estado === "En ejecución").length, label: "En ejecución" }, { value: risks.length, label: "Riesgos registrados" }]} />
    <section className="panel context-panel"><h2>Proyectos recientes</h2>{!projects.length && <p>No hay proyectos disponibles en tu alcance.</p>}
      {!!projects.length && <TableRegion label="Proyectos recientes"><table className="context-table"><thead><tr><th>Proyecto</th><th>Estado</th><th>Avance real</th><th>Actualización</th></tr></thead><tbody>{[...projects].sort((a,b) => (b.actualizadoAt ?? "").localeCompare(a.actualizadoAt ?? "")).slice(0,8).map(p => <tr key={p.id}><td><Link href={`/proyectos/${p.id}/resumen`}>{p.tvt} · {p.nombre}</Link></td><td>{p.estado}</td><td>{percent(p.avanceRealPct == null ? null : p.avanceRealPct / 100)}</td><td>{date(p.actualizadoAt)}</td></tr>)}</tbody></table></TableRegion>}</section>
  </div>;
}
