import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { asOfDate, getProject, getUser, projects, riskEvents, riskSuggestions, risks, riskReviews, users } from "./data";
import { riskCatalog } from "./catalogs";
import { emptyRecords, loadRecords, localProject, projectError, riskError, saveRecords, validDate, type LocalRecords, type ManualRiskDraft, type ManualRiskRecord, type ProjectDraft, type ProjectRecord } from "./records";

export type Risk = Omit<(typeof risks)[number], "categoryId"> & { categoryId?: string; trigger?: string; contingency?: string };
export type RiskReview = (typeof riskReviews)[number];
export type RiskEvent = (typeof riskEvents)[number];
export type RiskDraft = Pick<Risk, "title" | "description" | "type" | "strategy" | "probability" | "impact" | "scopes" | "ownerId"> & { nextReviewAt: string };
type Decision = { status: "accepted" | "dismissed"; actorId: string; decidedAt: string; risk?: Risk; review?: RiskReview };
export type DemoSession = { decisions: Record<string, Decision>; local: LocalRecords };
export const emptySession: DemoSession = { decisions: {}, local: emptyRecords };
type SessionContextValue = { session: DemoSession; storageIssue: string; decide: (id: string, draft?: RiskDraft, approved?: boolean) => void; createProject: (draft: ProjectDraft) => string; createRisk: (draft: ManualRiskDraft) => { error: string; id?: string }; clearDecisions: () => void };
const SessionContext = createContext<SessionContextValue | null>(null);
export const currentUser = users.find(user => user.active && user.role === "Project Manager")!;
function nextId(prefix: string, ids: string[]) {
  const numbers = ids.filter(id => id.startsWith(prefix) && /^\d+$/.test(id.slice(prefix.length))).map(id => Number(id.slice(prefix.length)));
  return `${prefix}${String(Math.max(0, ...numbers) + 1).padStart(3, "0")}`;
}

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadRecords);
  const [session, setSession] = useState<DemoSession>({ decisions: {}, local: loaded.records });
  const current = useRef(session);
  function update(next: DemoSession) { current.current = next; setSession(next); }
  function createProject(draft: ProjectDraft) {
    const previous = current.current;
    const clean = { ...draft, id: draft.id.trim(), name: draft.name.trim(), lob: draft.lob.trim(), description: draft.description.trim() };
    const error = loaded.issue || projectError(clean, sessionProjects(previous));
    if (error) return error;
    const local = { ...previous.local, projects: [...previous.local.projects, clean] };
    const failure = saveRecords(local);
    if (!failure) update({ ...previous, local });
    return failure;
  }
  function createRisk(draft: ManualRiskDraft) {
    const previous = current.current;
    const clean = { ...draft, title: draft.title.trim(), description: draft.description.trim(), responsePlan: draft.responsePlan.trim(), trigger: draft.trigger.trim(), contingency: draft.contingency.trim() };
    const error = loaded.issue || riskError(clean, sessionProjects(previous));
    if (error) return { error };
    const record: ManualRiskRecord = { draft: clean, id: nextId(clean.scopeType === "Transversal" ? "TRS-" : "RSK-", sessionRisks(previous).map(risk => risk.id)), reviewId: nextId("RRV-", allReviews(previous).map(review => review.id)), eventId: nextId("EVT-", sessionEvents(previous).map(event => event.id)) };
    const local = { ...previous.local, risks: [...previous.local.risks, record] };
    const failure = saveRecords(local);
    if (failure) return { error: failure };
    update({ ...previous, local });
    return { error: "", id: record.id };
  }
  function decide(id: string, draft?: RiskDraft, approved = false) {
    const previous = current.current;
    const suggestion = riskSuggestions.find(item => item.id === id);
    if (!suggestion || suggestion.status !== "pending" || previous.decisions[id] || getProject(suggestion.projectId)?.managerId !== currentUser.id) return;
    if (draft && (!approved || !draft.title.trim() || !draft.description.trim() || !getUser(draft.ownerId)?.active || !draft.scopes.length
      || !draft.scopes.every(scope => risks.some(risk => risk.scopes.includes(scope)))
      || !Number.isInteger(draft.probability) || draft.probability < 1 || draft.probability > 5
      || !Number.isInteger(draft.impact) || draft.impact < 1 || draft.impact > 5
      || !validDate(draft.nextReviewAt) || draft.nextReviewAt < asOfDate
      || !risks.some(risk => risk.type === draft.type && risk.strategy === draft.strategy))) return;
    const decision: Decision = { status: draft ? "accepted" : "dismissed", actorId: currentUser.id, decidedAt: asOfDate };
    if (draft) {
      const riskId = nextId("RSK-", sessionRisks(previous).map(risk => risk.id));
      const reviewId = nextId("RRV-", allReviews(previous).map(review => review.id));
      const { nextReviewAt, ...attributes } = draft;
      decision.risk = { ...attributes, id: riskId, projectId: suggestion.projectId, scopeType: "Proyecto", status: draft.type === "Amenaza" ? "Activo" : "Activa", identifiedAt: asOfDate, identifiedById: currentUser.id, responsePlan: "", contingencyPrepared: false };
      decision.review = { id: reviewId, riskId, reviewedAt: asOfDate, actorId: currentUser.id, probability: draft.probability, impact: draft.impact, status: decision.risk.status, strategy: draft.strategy, scopes: draft.scopes, decision: "Registrar riesgo", approvedByPmId: currentUser.id, approvedAt: asOfDate, nextReviewAt, cycleNumber: 1, isFinal: false, notes: suggestion.summary };
    }
    update({ ...previous, decisions: { ...previous.decisions, [id]: decision } });
  }
  return <SessionContext value={{ session, storageIssue: loaded.issue, decide, createProject, createRisk, clearDecisions: () => update({ ...current.current, decisions: {} }) }}>{children}</SessionContext>;
}
export function useDemoSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("Falta DemoSessionProvider.");
  return context;
}
export function sessionProjects(session: DemoSession = emptySession): ProjectRecord[] {
  return [...projects, ...session.local.projects.map(localProject)];
}
export function sessionProject(id: string, session: DemoSession = emptySession) { return sessionProjects(session).find(project => project.id === id); }
function manualRisk(record: ManualRiskRecord): Risk {
  const { nextReviewAt: _nextReviewAt, ...draft } = record.draft;
  return { ...draft, id: record.id, status: riskCatalog[draft.type].initial, identifiedAt: asOfDate, identifiedById: currentUser.id };
}
export function sessionRisks(session: DemoSession = emptySession): Risk[] {
  return [...risks, ...session.local.risks.map(manualRisk), ...Object.values(session.decisions).flatMap(decision => decision.risk ? [decision.risk] : [])];
}
function allReviews(session: DemoSession): RiskReview[] {
  return [...riskReviews, ...session.local.risks.map(record => {
    const risk = manualRisk(record);
    return { id: record.reviewId, riskId: risk.id, reviewedAt: asOfDate, actorId: currentUser.id, probability: risk.probability, impact: risk.impact, status: risk.status, strategy: risk.strategy, scopes: risk.scopes, decision: "Registrar riesgo", approvedByPmId: currentUser.id, approvedAt: asOfDate, nextReviewAt: record.draft.nextReviewAt || null, cycleNumber: 1, isFinal: false, notes: risk.description };
  }), ...Object.values(session.decisions).flatMap(decision => decision.review ? [decision.review] : [])];
}
export function sessionReviews(riskId: string, session: DemoSession = emptySession) {
  return allReviews(session).filter(review => review.riskId === riskId).sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
}
export function sessionEvents(session: DemoSession): RiskEvent[] {
  return [...riskEvents, ...session.local.risks.map(record => ({ id: record.eventId, riskId: record.id, occurredAt: `${asOfDate}T12:00:00Z`, actorId: currentUser.id, eventType: "Registro", summary: record.draft.description, relatedId: record.reviewId }))];
}
