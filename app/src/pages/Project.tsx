import { Badge, PageHeading, TableRegion } from "@/components/atoms/primitives";
import { Progress, Status } from "@/components/molecules/project-indicators";
import { BusinessKpis, ProjectBusiness } from "@/components/organisms/project-business";
import { useData } from "@/data/bootstrap";
import { date, money, number } from "@/data/format";
import { Link } from "@/navigation";
import Risks from "./Risks";
import RiskDetail from "./RiskDetail";
import SuggestionReview from "./SuggestionReview";

export default function Project({ projectId, view, recordId }: { projectId: string; view: string; recordId?: string }) {
  const { data } = useData();
  const project = data?.proyectos.find(p => p.id === projectId);
  if (!project) return <div className="page"><PageHeading title="Proyecto no disponible" description="No existe o no está dentro de tu alcance." /><Link href="/proyectos">Volver a proyectos</Link></div>;
  if (view === "sugerencias") return <SuggestionReview />;
  if (recordId && view === "riesgos") return <RiskDetail riskId={recordId} projectId={projectId} />;
  return <div className="page"><div className="context-back"><Link href="/proyectos">← Volver a proyectos</Link><small>Actualizado el {date(project.actualizadoAt)}</small></div>
    <PageHeading title={project.nombre} description={`${project.tvt} · ${project.cliente.nombre} · ${project.pais ?? "Sin país"}`}><Status value={project.estado} /></PageHeading>
    <nav className="project-tabs" aria-label="Vistas del proyecto"><Link href={`/proyectos/${projectId}/resumen`} aria-current={view === "resumen" ? "page" : undefined}>Resumen</Link><Link href={`/proyectos/${projectId}/ejecucion`} aria-current={view === "ejecucion" ? "page" : undefined}>Ejecución y avance</Link><Link href={`/proyectos/${projectId}/riesgos`} aria-current={view === "riesgos" ? "page" : undefined}>Riesgos</Link></nav>
    {view === "riesgos" ? <Risks projectId={projectId} /> : <>
      <section className="panel context-panel"><h2>{view === "ejecucion" ? "Seguimiento registrado" : "Resumen del proyecto"}</h2><p>{project.situacion ?? "Sin actividades registradas."}</p><p>Próximos pasos: {project.proximosPasos ?? "Sin dato"}</p><Progress planned={project.avancePlanificadoPct == null ? null : project.avancePlanificadoPct / 100} actual={project.avanceRealPct == null ? null : project.avanceRealPct / 100} />
        <div className="project-metrics"><div><small>SPI</small><strong>{number(project.spiRatio)}</strong></div><div><small>Riesgos abiertos</small><strong>{project.riesgosAbiertos}</strong></div><div><small>Inicio</small><strong>{date(project.fechaInicio)}</strong></div><div><small>Término vigente</small><strong>{date(project.fechaTerminoProyecto)}</strong></div></div></section>
      <BusinessKpis projectId={projectId} />
      {view === "resumen" && <><section className="panel context-panel"><h2>Referencias comerciales</h2><p>TCV: {money(project.tcv?.amount, project.tcv?.currency)} · ACV: {money(project.acv?.amount, project.acv?.currency)}</p><p><Badge>{project.complejidad ?? "Sin evaluación de complejidad"}</Badge></p></section><ProjectBusiness projectId={projectId} /></>}
      {view === "ejecucion" && <section className="panel context-panel"><h2>Historial del proyecto</h2>{project.historial.length ? <TableRegion label="Historial"><table className="context-table"><thead><tr><th>Fecha</th><th>Evento</th><th>Actor</th></tr></thead><tbody>{project.historial.map(event => <tr key={event.id}><td>{date(event.registradoAt)}</td><td>{event.tipo}</td><td>{event.usuarioEmail ?? "Sin dato"}</td></tr>)}</tbody></table></TableRegion> : <p>Sin eventos registrados.</p>}</section>}
    </>}
  </div>;
}
