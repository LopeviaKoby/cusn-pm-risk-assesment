import { Badge, ExposureBadge, TableRegion } from "@/components/atoms/primitives";
import { SortHeader, useTableSort } from "@/components/organisms/table-tools";
import { SeriesChart } from "@/components/molecules/series-chart";
import { dataMode } from "@/data/mode";
import { getRiskExposure } from "@/demo/data";
import { getRiskContext, type ProjectContext } from "@/demo/project-context";
import { useDemoSession } from "@/demo/session";
import { date, getUser, number } from "@/demo/view-models";
import { Link, safeReturn, useNavigation } from "@/navigation";
import { Facts, Panel, ProjectTabs, UnavailableRecord } from "../layouts/ProjectFrame";

export default function RiskDetail({ model, riskId }: { model?: ProjectContext; riskId: string }) {
  const { session } = useDemoSession();
  const { url } = useNavigation();
  const registry = model ? `/proyectos/${model.project.id}/riesgos` : "/riesgos";
  const context = getRiskContext(model?.project.id ?? null, riskId, session);
  const actionTable = useTableSort(context?.actions ?? [], {
    action: item => item.title,
    owner: item => getUser(item.ownerId)?.name ?? "",
    due: item => item.dueDate,
    status: item => item.status,
  });
  const reviewTable = useTableSort(context?.reviews ?? [], {
    date: item => item.reviewedAt,
    decision: item => item.decision,
    score: item => getRiskExposure(item),
    actor: item => getUser(item.actorId)?.name ?? "",
    next: item => item.nextReviewAt,
  });
  if (!context) return <UnavailableRecord title="Riesgo no encontrado" back={registry} />;
  const { risk, reviews, initialScore, difference, events, actions, preparation, activation } = context;
  const isApi = dataMode === "api";
  const back = safeReturn(new URLSearchParams(url.split("?")[1]).get("origen"), registry);
  const backLabel = back.startsWith("/workspace") ? "Volver a Workspace" : back.includes("/resumen") ? "Volver al resumen" : back.includes("/sugerencias/") ? "Volver a la sugerencia" : "Volver al registro de riesgos";
  return <div className="page project-page"><div className="context-back"><Link href={back}>← {backLabel}</Link><small>{model?.project.name ?? risk.scopeType}</small></div>{model && <ProjectTabs model={model} active="riesgos" />}
    <header className="record-heading"><small>{risk.id} · Riesgo registrado</small><h1>{risk.title}</h1><div className="badge-row"><Badge>{risk.type}</Badge><Badge tone={risk.statusTone}>{risk.status}</Badge>{risk.overdue && <Badge tone="review">Revisión vencida</Badge>}</div></header>
    <div className="project-metrics risk-metrics"><div><small>Evaluación actual</small><ExposureBadge type={risk.type} score={risk.exposure} /></div>{!isApi && <><div><small>Evaluación inicial</small><ExposureBadge type={risk.type} score={initialScore} /></div><div><small>Evolución desde el registro</small><strong>{difference > 0 ? "+" : ""}{number(difference)} puntos</strong></div></>}{!isApi && <div><small>Próxima revisión</small><strong className={risk.overdue ? "review-overdue" : ""}>{date(risk.reviewDate)}</strong>{risk.overdue && <small className="review-overdue">Vencida</small>}</div>}</div>
    <div className="context-grid"><div className="context-stack"><Panel title="Descripción del riesgo"><p>{risk.description}</p><Facts items={[{ label: "Tipo", value: risk.type }, { label: "Estado", value: risk.status }, { label: "Estrategia", value: risk.strategy }, { label: "Probabilidad", value: risk.probability }, { label: "Impacto", value: risk.impact }]} /></Panel>
      <Panel title="Plan de respuesta"><h3 className="subsection-title">Estrategia · {risk.strategy}</h3><p className="inset">{risk.responsePlan || "No hay plan de respuesta registrado."}</p>{risk.trigger && <><h3 className="subsection-title">Disparador</h3><p>{risk.trigger}</p></>}<h3 className="subsection-title">Plan de contingencia</h3><Badge tone={risk.contingencyPrepared ? "info" : "neutral"}>{risk.contingencyPrepared ? "Preparada" : "No preparada"}</Badge><p className="contingency-copy">{risk.contingency || preparation?.summary || "Sin preparación de contingencia documentada."}</p>{preparation && <small>{date(preparation.occurredAt)}</small>}{activation && <p className="inset">{activation.summary} · {date(activation.occurredAt)}</p>}</Panel>
      {!isApi && <>
      <Panel title="Acciones de respuesta" after={<span className="muted">{actions.length} acciones</span>}>
        {actions.length ? <TableRegion label="Acciones de respuesta"><table className="context-table"><thead><tr><SortHeader label="Acción" column="action" sort={actionTable.sort} onToggle={actionTable.toggle} /><SortHeader label="Responsable" column="owner" sort={actionTable.sort} onToggle={actionTable.toggle} /><SortHeader label="Fecha objetivo" column="due" sort={actionTable.sort} onToggle={actionTable.toggle} /><SortHeader label="Estado" column="status" sort={actionTable.sort} onToggle={actionTable.toggle} /></tr></thead><tbody>{actionTable.rows.map(action => <tr key={action.id}><th scope="row">{action.title}</th><td>{getUser(action.ownerId)?.name}</td><td>{date(action.dueDate)}</td><td><Badge tone={action.completedAt ? "positive" : "neutral"}>{action.status}</Badge></td></tr>)}</tbody></table></TableRegion> : <p className="muted">No hay acciones de respuesta registradas.</p>}
      </Panel>
      <details className="panel context-panel review-history"><summary>Historial de revisiones · {reviews.length}</summary><TableRegion label="Revisiones del riesgo"><table className="context-table"><thead><tr><SortHeader label="Fecha" column="date" sort={reviewTable.sort} onToggle={reviewTable.toggle} /><SortHeader label="Decisión" column="decision" sort={reviewTable.sort} onToggle={reviewTable.toggle} /><SortHeader label="Puntuación" column="score" sort={reviewTable.sort} onToggle={reviewTable.toggle} /><SortHeader label="Responsable" column="actor" sort={reviewTable.sort} onToggle={reviewTable.toggle} /><SortHeader label="Próxima revisión" column="next" sort={reviewTable.sort} onToggle={reviewTable.toggle} /></tr></thead><tbody>{reviewTable.rows.map(review => <tr key={review.id}><th scope="row">{date(review.reviewedAt)}</th><td>{review.decision}<small>{review.notes}</small></td><td><ExposureBadge type={risk.type} score={getRiskExposure(review)} /></td><td>{getUser(review.actorId)?.name}</td><td>{date(review.nextReviewAt)}</td></tr>)}</tbody></table></TableRegion></details>
      </>}
    </div><div className="context-stack"><Panel title="Información y seguimiento"><Facts items={[{ label: "Proyecto", value: model?.project.name ?? risk.scopeType }, { label: "Responsable", value: risk.owner.name }, { label: "Estado", value: risk.status }, { label: "Estrategia", value: risk.strategy }, { label: "Categoría", value: risk.category }, ...(!isApi ? [{ label: "Última evaluación", value: date(risk.review?.reviewedAt) }, { label: "Próxima revisión", value: date(risk.reviewDate) }, { label: "Ámbitos impactados", value: risk.scopes.join(", ") }] : [])]} /></Panel>
      {!isApi && <>
      <Panel title="Evolución de la exposición"><SeriesChart label="Evolución de la puntuación del riesgo, escala de 1 a 25" maximum={25} dates={reviews.map(review => review.reviewedAt)} series={[{ label: "Exposición", className: "actual", values: reviews.map(getRiskExposure) }]} /></Panel>
      <Panel title="Actividad reciente">{events.length ? <ol className="activity-list">{events.slice(0, 3).map(event => <li key={event.id}><small>{date(event.occurredAt)}</small><h3>{event.eventType}</h3><p>{event.summary}</p><small>{getUser(event.actorId)?.name}</small></li>)}</ol> : <p className="muted">Sin actividad adicional registrada.</p>}</Panel>
      </>}
    </div></div>
  </div>;
}
