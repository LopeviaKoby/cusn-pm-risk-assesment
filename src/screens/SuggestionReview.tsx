import { useState } from "react";
import { Badge, Button, ExposureBadge } from "@/components/ui/primitives";
import { asOfDate, getRiskExposure, risks, users } from "@/demo/data";
import type { ProjectContext } from "@/demo/project-context";
import { currentUser, useDemoSession, type RiskDraft } from "@/demo/session";
import { date, getSuggestionEvidence, suggestionRows, unique } from "@/demo/view-models";
import { contextualPath, Link, safeReturn, useNavigation } from "@/navigation";
import { Facts, Panel, ProjectTabs, UnavailableRecord } from "./ProjectFrame";

export default function SuggestionReview({ model, suggestionId }: { model: ProjectContext; suggestionId: string }) {
  const { session, decide } = useDemoSession();
  const { url } = useNavigation();
  const suggestion = suggestionRows(session).find(item => item.id === suggestionId && item.projectId === model.project.id);
  const decision = session.decisions[suggestionId];
  const [draft, setDraft] = useState<RiskDraft>(() => {
    const risk = decision?.risk;
    return { title: risk?.title ?? suggestion?.title ?? "", description: risk?.description ?? suggestion?.summary ?? "", type: risk?.type ?? suggestion?.type ?? "", strategy: risk?.strategy ?? suggestion?.suggestedStrategy ?? "", probability: risk?.probability ?? suggestion?.probability ?? 1, impact: risk?.impact ?? suggestion?.impact ?? 1, scopes: [...risk?.scopes ?? suggestion?.scopes ?? []], ownerId: risk?.ownerId ?? model.project.managerId, nextReviewAt: decision?.review?.nextReviewAt ?? "" };
  });
  const [approved, setApproved] = useState(() => !!decision?.risk);
  const [error, setError] = useState("");
  if (!suggestion) return <UnavailableRecord title="Sugerencia no encontrada" back={`/proyectos/${model.project.id}/riesgos?bandeja=sugerencias`} />;
  const back = safeReturn(new URLSearchParams(url.split("?")[1]).get("origen"), `/proyectos/${model.project.id}/riesgos?bandeja=sugerencias`);
  const backLabel = back.startsWith("/workspace") ? "Volver a Workspace" : back.includes("/resumen") ? "Volver al resumen" : "Volver a sugerencias";
  const pending = suggestion.status === "pending";
  const canDecide = pending && currentUser.id === model.project.managerId;
  const evidence = getSuggestionEvidence(suggestion.id);
  const update = (patch: Partial<RiskDraft>) => { setDraft(previous => ({ ...previous, ...patch })); setApproved(false); };
  const scopes = unique(risks.flatMap(risk => risk.scopes));
  const strategies = unique(risks.filter(risk => risk.type === draft.type).map(risk => risk.strategy));
  return <div className="page project-page review-page"><div className="context-back"><Link href={back}>← {backLabel}</Link><small>{model.project.name}</small></div><ProjectTabs model={model} active="riesgos" />
    <header className="record-heading"><small>{suggestion.id} · Detectada el {date(suggestion.detectedAt)}</small><h1>{suggestion.title}</h1><div className="badge-row"><Badge tone="info">Sugerencia de IA</Badge><Badge tone={suggestion.statusTone}>{suggestion.statusLabel}</Badge></div><p>Evalúa la información sugerida antes de decidir si corresponde incorporarla al registro oficial de riesgos.</p></header>
    {!pending && <div className="decision-result" role="status"><strong>{suggestion.statusLabel} · {date(suggestion.decidedAt)}</strong>{suggestion.linkedRiskId ? <Link href={contextualPath(`/proyectos/${model.project.id}/riesgos/${suggestion.linkedRiskId}`, url, true)}>Ver riesgo registrado: {suggestion.linkedRiskId}</Link> : <p>La sugerencia no se incorporó al registro oficial.</p>}</div>}
    <div className="context-grid review-grid"><div className="context-stack"><Panel title="Descripción sugerida"><p className="inset">{suggestion.summary}</p><small>Propuesta preliminar; requiere validación del Project Manager.</small></Panel>
      <Panel title="Señales que sustentan la propuesta"><ul className="context-list">{evidence.map(item => <li key={item.id}><a href={`#evidencia-${item.id}`}>{item.sourceLabel}</a><small>{item.sourceType} · {date(item.documentDate)}</small></li>)}</ul></Panel>
      <Panel title="Evidencias referenciadas"><ul className="context-list">{evidence.map(item => <li id={`evidencia-${item.id}`} key={item.id}><h3>{item.title}</h3><small>{date(item.documentDate)} · {item.reference}</small><blockquote>{item.excerpt}</blockquote></li>)}</ul>{!evidence.length && <p className="muted">No hay evidencias vinculadas.</p>}</Panel>
    </div><div className="context-stack"><Panel title={decision?.risk ? "Evaluación aprobada" : "Revisión del riesgo propuesto"}><form id="proposal-review" onSubmit={event => { event.preventDefault(); if (!draft.title.trim() || !draft.description.trim()) { setError("Escribe un título y una descripción para el riesgo."); return; } setError(""); if (canDecide && approved && draft.scopes.length) decide(suggestion.id, { ...draft, title: draft.title.trim(), description: draft.description.trim() }, approved); }}>
      <fieldset disabled={!canDecide}><label className="field">Título del riesgo<input required value={draft.title} onChange={event => update({ title: event.target.value })} /></label>
        <label className="field">Descripción del riesgo<textarea required rows={4} value={draft.description} onChange={event => update({ description: event.target.value })} /></label>
        <div className="field-grid"><label className="field">Tipo<select value={draft.type} onChange={event => { const type = event.target.value; update({ type, strategy: risks.find(risk => risk.type === type)?.strategy ?? "" }); }}>{unique(risks.map(risk => risk.type)).map(type => <option key={type}>{type}</option>)}</select></label>
          <label className="field">Estrategia propuesta<select value={draft.strategy} onChange={event => update({ strategy: event.target.value })}>{strategies.map(strategy => <option key={strategy}>{strategy}</option>)}</select></label></div>
        <div className="field-grid">{[{ key: "probability" as const, label: "Probabilidad" }, { key: "impact" as const, label: "Impacto" }].map(field => <label className="field" key={field.key}>{field.label}<select aria-label={field.label} value={draft[field.key]} onChange={event => update({ [field.key]: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></label>)}</div>
        <div className="proposal-score"><span>Puntuación propuesta</span><ExposureBadge type={draft.type} score={getRiskExposure(draft)} proposed /></div>
        <fieldset className="scope-options"><legend>Ámbitos impactados</legend>{scopes.map(scope => <label key={scope}><input type="checkbox" checked={draft.scopes.includes(scope)} onChange={event => update({ scopes: event.target.checked ? [...draft.scopes, scope] : draft.scopes.filter(value => value !== scope) })} />{scope}</label>)}</fieldset>
        {!draft.scopes.length && <p className="review-overdue" role="status">Selecciona al menos un ámbito.</p>}
        <label className="field">Responsable propuesto<select value={draft.ownerId} onChange={event => update({ ownerId: event.target.value })}>{users.filter(user => user.active).map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
        <label className="field">Próxima revisión<input type="date" required min={asOfDate} value={draft.nextReviewAt} onChange={event => update({ nextReviewAt: event.target.value })} /></label>
        <label className="approval-check"><input type="checkbox" required checked={approved} onChange={event => setApproved(event.target.checked)} />Confirmo la evaluación y autorizo registrar este riesgo.</label>
      </fieldset>
      {error && <p role="alert" className="review-overdue">{error}</p>}
    </form></Panel><Panel title="Validación del Project Manager"><p>La propuesta permanece fuera del registro oficial hasta su aprobación explícita.</p><Facts items={[{ label: "Gestor del proyecto", value: model.project.manager.name }]} />{pending && !canDecide && <p className="muted">Solo el gestor asignado puede decidir sobre esta propuesta.</p>}</Panel></div></div>
    {pending && <footer className="review-actions"><Link href={back}>Mantener pendiente</Link>{canDecide && <><Button onClick={() => decide(suggestion.id)}>Descartar sugerencia</Button><Button variant="primary" type="submit" form="proposal-review">Aprobar y registrar riesgo</Button></>}</footer>}
  </div>;
}
