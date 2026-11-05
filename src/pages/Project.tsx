import { motion, useReducedMotion } from "motion/react";
import { loadScreen } from "@/components/molecules/route-loader";
import { Badge, ExposureBadge, TableRegion } from "@/components/atoms/primitives";
import { SortHeader, useTableSort } from "@/components/organisms/table-tools";
import { SeriesChart } from "@/components/molecules/series-chart";
import { dataMode } from "@/data/mode";
import { billingMilestones } from "@/demo/data";
import { financeModel, money } from "@/demo/finance";
import { getProjectContext, type ProjectContext } from "@/demo/project-context";
import { useDemoSession } from "@/demo/session";
import { asOfDate, date, getUser, number, percent, unique } from "@/demo/view-models";
import { contextualPath, Link, useNavigation } from "@/navigation";
import { Difference, Facts, Panel, PendingSuggestions, ProjectHeader, UnavailableRecord } from "../layouts/ProjectFrame";
const Risks = loadScreen(() => import("./Risks"));
const RiskDetail = loadScreen(() => import("./RiskDetail"));
const SuggestionReview = loadScreen(() => import("./SuggestionReview"));

function Economics({ model }: { model: ProjectContext }) {
  const p = model.project;
  const currencies = unique(billingMilestones.filter(row => row.projectId === p.id).map(row => row.currency));
  return <Panel title="Síntesis económica"><Facts items={[
    { label: "TCV · valor total comercial", value: p.tcv ? money(p.tcv.amount, p.tcv.currency) : "Sin dato" },
    { label: `ACV · plan anual${p.acv ? ` ${p.acv.period}` : ""}`, value: p.acv ? money(p.acv.amount, p.acv.currency) : "Sin dato" },
    { label: "Presupuesto operativo", value: "Sin dato" },
  ]} />{p.tcv && <p className="muted economic-source">{p.tcv.origin}{p.tcv.date ? ` · ${date(p.tcv.date)}` : ""}{p.acv && ` · ${p.acv.origin}${p.acv.date ? `: ${date(p.acv.date)}` : ""}`}</p>}
    {currencies.length ? currencies.map(currency => { const model = financeModel([p.id], currency); return <div key={currency}><h3 className="subsection-title">Facturación · {currency} · todos los periodos registrados</h3><Facts items={[{ label: "Showpricing original", value: money(model.showPricing, currency) }, { label: "Planificado PM", value: money(model.planned, currency) }, { label: "Real registrado", value: money(model.actual, currency) }]} /></div>; }) : <p className="muted">Sin referencias de facturación registradas.</p>}
    <p className="muted economic-source">TCV y ACV son referencias comerciales. El real no acredita por sí solo una factura emitida.</p>
  </Panel>;
}
function QuickView({ model }: { model: ProjectContext }) {
  const { project: p, series, latest, risks, events } = model;
  const { url } = useNavigation();
  const reduceMotion = useReducedMotion();
  const currency = p.tcv?.currency ?? unique(billingMilestones.filter(row => row.projectId === p.id).map(row => row.currency))[0] ?? "";
  const finance = currency ? financeModel([p.id], currency) : null;
  const latestRisk = risks[0];
  const latestEvent = events[0];
  const transition = { duration: reduceMotion ? 0 : .22 };
  return <section className="quick-view" aria-label="Vista rápida del proyecto">
    <div className="quick-view-heading"><div><h2>Vista rápida</h2><p>Curva S, actividades, registro e información financiera del proyecto.</p></div><span className="quick-view-cutoff">Corte: {date(latest?.snapshotDate ?? p.updatedAt)}</span></div>
    <div className="quick-grid">
      <motion.article className="quick-card quick-card-chart" initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
        <header><div><h3>Curva S</h3><p>Avance planificado y real.</p></div><Link className="quick-link" href={contextualPath(`/proyectos/${p.id}/ejecucion`, url)}>Ver ejecución →</Link></header>
        {series.length ? <SeriesChart label={`Curva S de ${p.name}`} curved dates={series.map(item => item.snapshotDate)} series={[{ label: "Planificado", className: "planned", values: series.map(item => item.plannedProgress) }, { label: "Real", className: "actual", values: series.map(item => item.actualProgress) }]} /> : <p className="muted">Sin avance registrado.</p>}
        <div className="quick-facts-inline"><span>Plan {percent(p.plannedProgress)}</span><span>Real {percent(p.actualProgress)}</span><Difference value={model.difference} /></div>
      </motion.article>
      <motion.article className="quick-card" initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduceMotion ? 0 : .04 }}>
        <header><div><h3>Actividades</h3><p>Trabajo en curso y próximos pasos.</p></div><Link className="quick-link" href={contextualPath(`/proyectos/${p.id}/ejecucion`, url)}>Ver detalle →</Link></header>
        {p.situationNote && <p className="quick-copy">{p.situationNote}</p>}
        {model.nextSteps ? <p className="quick-copy quick-next">{model.nextSteps}</p> : <p className="muted">Sin próximos pasos registrados.</p>}
        {model.nextMilestones.length > 0 && <ul className="quick-list">{model.nextMilestones.slice(0, 3).map(item => <li key={item.id}><span>{item.title}</span><small>{date(item.dueDate)}</small></li>)}</ul>}
      </motion.article>
      <motion.article className="quick-card" initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduceMotion ? 0 : .08 }}>
        <header><div><h3>Registro</h3><p>Riesgos y eventos del proyecto.</p></div><Link className="quick-link" href={contextualPath(`/proyectos/${p.id}/riesgos`, url)}>Ver registro →</Link></header>
        <div className="quick-register-count"><strong>{risks.length}</strong><span>{risks.length === 1 ? "riesgo registrado" : "riesgos registrados"}</span></div>
        {latestRisk ? <div className="quick-register-item"><small>{latestRisk.id}</small><strong>{latestRisk.title}</strong><div><Badge tone={latestRisk.statusTone}>{latestRisk.status}</Badge><ExposureBadge type={latestRisk.type} score={latestRisk.exposure} /></div></div> : <p className="muted">Sin riesgos registrados.</p>}
        <p className="quick-caption">Último seguimiento: {date(latest?.snapshotDate)}</p>
        {latestEvent && <p className="quick-caption">Último evento: {latestEvent.tipo} · {date(latestEvent.registradoAt)}</p>}
      </motion.article>
      <motion.article className="quick-card" initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduceMotion ? 0 : .12 }}>
        <header><div><h3>Información financiera</h3><p>Referencias comerciales y facturación.</p></div>{currency && <Link className="quick-link" href={`/portafolio?vista=finanzas&project=${encodeURIComponent(p.id)}&currency=${encodeURIComponent(currency)}`}>Ver finanzas →</Link>}</header>
        {currency ? <><Facts items={[{ label: "TCV", value: money(p.tcv?.amount, currency) }, { label: "ACV", value: money(p.acv?.amount, currency) }, { label: "Real registrado", value: money(finance?.actual ?? null, currency) }, { label: "Planificado PM", value: money(finance?.planned ?? null, currency) }]} /><p className="quick-caption">Moneda {currency}. TCV y ACV no son presupuesto operativo.</p></> : <p className="muted">Sin referencias financieras registradas.</p>}
      </motion.article>
    </div>
  </section>;
}
function Summary({ model }: { model: ProjectContext }) {
  const { project: p, latest, difference } = model;
  const { url } = useNavigation();
  return <><QuickView model={model} /><div className="context-grid"><div className="context-stack">
    <Panel title="Situación del proyecto" after={p.behind ? <Badge>Desviación de avance</Badge> : undefined}><p>{p.situationNote ?? "Sin situación registrada."}</p><div className="summary-progress">{[{ label: "Planificado", value: p.plannedProgress, className: "planned" }, { label: "Real acumulado", value: p.actualProgress, className: "actual" }].map(item => <div key={item.label}><div><span>{item.label}</span><strong>{percent(item.value)}</strong></div><div className="bar-track"><i className={item.className} style={{ width: `${(item.value ?? 0) * 100}%` }} /></div></div>)}<Difference value={difference} /></div></Panel>
    <Panel title="Seguimiento y próximos pasos"><div className="inset"><div className="inline-between"><small>Último seguimiento</small><small>{date(latest?.snapshotDate)}</small></div><p>{latest?.note ?? "Sin seguimiento registrado."}</p></div><h3 className="subsection-title">Próximos pasos</h3>
      {model.nextSteps && <p className="inset">{model.nextSteps}</p>}
      {model.nextMilestones.length ? <ul className="context-list">{model.nextMilestones.map(item => <li key={item.id}><strong>{item.title}</strong><div><Badge>{item.status}</Badge><span className={item.dueDate < asOfDate ? "review-overdue" : ""}>{date(item.dueDate)}{item.dueDate < asOfDate && " · Vencido"}</span></div><small>{item.note}</small></li>)}</ul> : !model.nextSteps && <p className="muted">No hay hitos pendientes.</p>}
    </Panel>
    <Panel title="Riesgos del proyecto" after={<span className="muted">{p.openRiskCount} abiertos</span>}>
      {model.risks.length ? <ul className="context-list">{model.risks.slice(0, 1).map(risk => <li key={risk.id}><div><small>{risk.id}</small>{risk.overdue && <Badge tone="review">Revisión vencida</Badge>}</div><Link className="record-link" href={contextualPath(`/proyectos/${p.id}/riesgos/${risk.id}`, url, true)}>{risk.title}</Link><div><span>{risk.type} · {risk.status}</span><ExposureBadge type={risk.type} score={risk.exposure} /></div><small>{dataMode === "api" ? risk.owner.name : `${risk.owner.name} · Próxima revisión: ${date(risk.reviewDate)}`}</small></li>)}</ul> : <p className="muted">Sin riesgos registrados para este proyecto.</p>}
      <Link className="section-link" href={contextualPath(`/proyectos/${p.id}/riesgos`, url)}>Ver riesgos del proyecto →</Link>
    </Panel>
    <Economics model={model} />
  </div><div className="context-stack"><Panel title="Información general"><Facts items={[{ label: "Cliente", value: p.client.name }, { label: "Línea de negocio", value: p.lob }, { label: "Squad", value: p.squad }, { label: "País", value: p.country }, { label: "Gestor de proyecto", value: p.manager.name }, { label: "Líder técnico", value: p.techLead }]} /><details className="business-details"><summary>Información comercial y referencias</summary><Facts items={[{ label: "Relación comercial", value: p.client.relationship }, { label: "Sector / industria", value: p.client.segment }, { label: "Servicio LOB", value: p.service }, { label: "Complejidad", value: p.complexity || "Sin dato" }, { label: "Recepción P1P2", value: p.p1p2ReceivedAt ? date(p.p1p2ReceivedAt) : "Sin dato" }, { label: "Preventa", value: getUser(p.preSalesId ?? "")?.name ?? "Sin asignar" }, { label: "TAM", value: getUser(p.tamId ?? "")?.name ?? "Sin asignar" }, { label: "SDM", value: getUser(p.sdmId ?? "")?.name ?? "Sin asignar" }, { label: "Account Manager", value: getUser(p.accountManagerId ?? "")?.name ?? "Sin asignar" }, { label: "SAP", value: p.references?.sap ?? "Sin dato" }, { label: "CECO", value: p.references?.ceco ?? "Sin dato" }, { label: "PEP", value: p.references?.pep ?? "Sin dato" }]} /></details></Panel>
    <Panel title="Control de fechas"><Facts items={[{ label: "Inicio", value: date(p.startDate) }, { label: "Término previsto", value: date(p.plannedEndDate) }, { label: "Último seguimiento", value: date(latest?.snapshotDate) }, { label: "Diferencia de avance", value: <Difference value={difference} /> }]} /></Panel><PendingSuggestions model={model} />
  </div></div></>;
}
function Execution({ model }: { model: ProjectContext }) {
  const { project: p, series, latest, difference } = model;
  const { url } = useNavigation();
  const isApi = dataMode === "api";
  const historyTable = useTableSort([...series].reverse(), {
    date: item => item.snapshotDate,
    planned: item => item.plannedProgress,
    actual: item => item.actualProgress,
    spi: item => item.spi,
    note: item => item.note,
  });
  const milestoneTable = useTableSort(model.milestones, {
    title: item => item.title,
    dueDate: item => item.dueDate,
    status: item => item.status,
    owner: item => item.ownerId,
    note: item => item.note,
  });
  return <div className="context-stack"><header className="page-heading"><div><h2>Ejecución y avance</h2><p>{dataMode === "api" ? "Supervisa el progreso planificado y real y las desviaciones del proyecto." : "Supervisa el progreso planificado y real, los hitos y las desviaciones del proyecto."}</p></div><small>Último seguimiento: {date(latest?.snapshotDate)}</small></header>
    <div className="context-grid"><Panel title="Evolución del avance"><p className="muted">Comparación temporal del avance planificado y real.</p><SeriesChart label="Evolución del avance planificado y real" curved dates={series.map(item => item.snapshotDate)} series={[{ label: "Planificado", className: "planned", values: series.map(item => item.plannedProgress) }, { label: "Real", className: "actual", values: series.map(item => item.actualProgress) }]} /><p className="inset">Diferencia al último seguimiento: <Difference value={difference} /></p></Panel>
      <div className="context-stack"><Panel title="Indicadores de ejecución"><Facts items={[{ label: "Real respecto al planificado", value: <Difference value={difference} /> }, { label: "Índice SPI", value: p.spi === null ? "—" : number(p.spi) }, { label: "Fecha del último seguimiento", value: date(latest?.snapshotDate) }]} /></Panel><Panel title="Fechas clave"><Facts items={[...(!isApi ? [{ label: "Próximo hito pendiente", value: model.nextMilestones[0]?.title ?? "Sin hitos pendientes" }, { label: "Fecha del hito", value: model.nextMilestones[0] ? date(model.nextMilestones[0].dueDate) : "—" }] : []), { label: "Término previsto", value: date(p.plannedEndDate) }]} /></Panel></div>
    </div>
    {!isApi && <Panel title="Hitos y entregables">{model.milestones.length ? <TableRegion label="Hitos y entregables"><table className="context-table"><thead><tr><SortHeader label="Hito" column="title" sort={milestoneTable.sort} onToggle={milestoneTable.toggle} /><SortHeader label="Fecha prevista" column="dueDate" sort={milestoneTable.sort} onToggle={milestoneTable.toggle} /><SortHeader label="Estado" column="status" sort={milestoneTable.sort} onToggle={milestoneTable.toggle} /><SortHeader label="Responsable" column="owner" sort={milestoneTable.sort} onToggle={milestoneTable.toggle} /><SortHeader label="Observación" column="note" sort={milestoneTable.sort} onToggle={milestoneTable.toggle} /></tr></thead><tbody>{milestoneTable.rows.map(item => <tr key={item.id}><th scope="row">{item.title}</th><td>{date(item.dueDate)}</td><td><Badge>{item.status}</Badge></td><td>{getUser(item.ownerId)?.name}</td><td>{item.note}</td></tr>)}</tbody></table></TableRegion> : <p className="muted">No hay hitos registrados.</p>}</Panel>}
    <div className="related-followup"><p>Seguimiento relacionado · {p.openRiskCount} riesgos abiertos</p><Link href={contextualPath(`/proyectos/${p.id}/riesgos`, url)}>Consultar riesgos del proyecto →</Link></div>
    <Panel title="Historial de avance">{historyTable.rows.length ? <TableRegion label="Historial de avance"><table className="context-table"><thead><tr><SortHeader label="Fecha" column="date" sort={historyTable.sort} onToggle={historyTable.toggle} /><SortHeader label="Avance planificado" column="planned" sort={historyTable.sort} onToggle={historyTable.toggle} /><SortHeader label="Avance real" column="actual" sort={historyTable.sort} onToggle={historyTable.toggle} /><SortHeader label="SPI" column="spi" sort={historyTable.sort} onToggle={historyTable.toggle} /><SortHeader label="Observación" column="note" sort={historyTable.sort} onToggle={historyTable.toggle} /></tr></thead><tbody>{historyTable.rows.map(item => <tr key={item.id}><th scope="row">{date(item.snapshotDate)}</th><td>{percent(item.plannedProgress)}</td><td>{percent(item.actualProgress)}</td><td>{item.spi === null ? "—" : number(item.spi)}</td><td>{item.note}</td></tr>)}</tbody></table></TableRegion> : <p className="muted">No hay actualizaciones registradas.</p>}</Panel>
  </div>;
}
export default function Project({ projectId, view, recordId }: { projectId: string; view: string; recordId?: string }) {
  const { session } = useDemoSession();
  const model = getProjectContext(projectId, session);
  if (!model) return <UnavailableRecord title="Proyecto no encontrado" back="/proyectos" />;
  if (recordId && view === "sugerencias") return <SuggestionReview key={recordId} model={model} suggestionId={recordId} />;
  if (recordId && view === "riesgos") return <RiskDetail model={model} riskId={recordId} />;
  if (recordId) return <UnavailableRecord title="Vista no disponible" back={`/proyectos/${projectId}/resumen`} />;
  if (!["resumen", "ejecucion", "riesgos"].includes(view)) return <UnavailableRecord title="Vista no disponible" back={`/proyectos/${projectId}/resumen`} />;
  return <div className="page project-page"><ProjectHeader model={model} active={view} />{view === "resumen" ? <Summary model={model} /> : view === "ejecucion" ? <Execution model={model} /> : <Risks projectId={projectId} />}</div>;
}
