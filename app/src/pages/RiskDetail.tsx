import { Badge, ExposureBadge, PageHeading } from "@/components/atoms/primitives";
import { useData } from "@/data/bootstrap";
import { date } from "@/data/format";
import { Link } from "@/navigation";

export default function RiskDetail({ riskId, projectId }: { riskId: string; projectId?: string }) {
  const { data } = useData();
  const global = riskId.startsWith("global-");
  const key = riskId.replace(/^(global|transversal)-/, "");
  const risk = data?.riesgos.find(r => r.id === key && (projectId ? r.proyectoId === projectId : global ? r.entidad === "RIESGO_GLOBAL" : r.proyectoId === null));
  if (!risk) return <div className="page"><PageHeading title="Riesgo no disponible" description="No existe o no está dentro de tu alcance." /><Link href="/riesgos">Volver a riesgos</Link></div>;
  return <div className="page"><Link href={projectId ? `/proyectos/${projectId}/riesgos` : "/riesgos"}>← Volver a riesgos</Link><PageHeading title={risk.nombre} description={`${risk.proyectoTvt ?? "Alcance transversal / global"} · ${risk.categoria ?? "Sin categoría"}`}><Badge>{risk.estado ?? "Sin estado"}</Badge></PageHeading>
    <section className="panel context-panel"><h2>Evaluación y respuesta</h2><div className="facts"><div><dt>Probabilidad</dt><dd>{risk.probabilidad ?? "Sin evaluación"}</dd></div><div><dt>Impacto</dt><dd>{risk.impacto ?? "Sin evaluación"}</dd></div><div><dt>Exposición</dt><dd><ExposureBadge type={risk.tipo ?? ""} score={risk.severidad} /></dd></div><div><dt>Responsable</dt><dd>{risk.responsableNombre ?? "Sin asignar"}</dd></div></div><p>Causa: {risk.causa ?? "Sin dato"}</p><p>Estrategia: {risk.estrategia ?? "Sin dato"}</p><p>Plan de mitigación: {risk.planMitigacion ?? "Sin dato"}</p><p>Plan de contingencia: {risk.planContingencia ?? "Sin dato"}</p><small>Actualizado el {date(risk.actualizadoAt)}</small></section>
  </div>;
}
