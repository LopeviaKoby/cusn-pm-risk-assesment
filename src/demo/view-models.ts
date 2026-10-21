import {
  asOfDate, catalogs, projects, riskSuggestions, planChangeRequests,
  getClient, getUser, getProject, getProjectMetrics, getLatestProgress,
  isRiskClosed,
  getRiskExposure, getSuggestionEvidence, isReviewOverdue,
} from "./data";
import { proposalStatusTone, riskStatusTone } from "./presentation";
import { currentUser, emptySession, sessionProjects, sessionProject, sessionRisks, sessionReviews, type DemoSession } from "./session";
import { projectStates } from "./catalogs";

export { asOfDate, getUser, getProject, getSuggestionEvidence };
export type Project = (typeof projects)[number];
export const demoUser = currentUser;
export const percent = (value: number | null, digits = 0) => value === null ? "—" : new Intl.NumberFormat("es-PE", { style: "percent", maximumFractionDigits: digits }).format(value);
export const number = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(value);
export function date(value: string | null | undefined): string {
  return value ? new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value.includes("T") ? value : `${value}T12:00:00Z`)) : "Sin programar";
}
export function relativeDate(value: string) {
  const days = Math.round((Date.parse(value) - Date.parse(asOfDate)) / 86_400_000);
  return new Intl.RelativeTimeFormat("es-PE", { numeric: "auto" }).format(days, "day");
}
export const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));
export const matches = (query: string, ...values: (string | undefined | null)[]) => {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  return normalize(values.filter(Boolean).join(" ")).includes(normalize(query.trim()));
};

export function projectRows(session: DemoSession = emptySession) {
  const riskRows = officialRiskRows(session).filter(risk => !isRiskClosed(risk));
  return sessionProjects(session).map(project => {
    const metrics = getProjectMetrics(project.id);
    const projectRisks = riskRows.filter(risk => risk.projectId === project.id);
    const overdueReviewCount = projectRisks.filter(risk => risk.overdue).length;
    const progress = getLatestProgress(project.id);
    const status = metrics.status?.status ?? project.initialStatus ?? "Sin estado";
    return {
      ...project, ...metrics, status, situationNote: metrics.status?.situationNote,
      lob: catalogs.lobs.find(item => item.id === project.lobId)?.label ?? project.lob ?? "Sin dato",
      service: catalogs.services.find(item => item.id === project.serviceId)?.label ?? "Sin dato",
      squad: catalogs.squads.find(item => item.id === project.squadId)?.label ?? "Sin dato",
      techLead: getUser(project.techLeadId ?? "")?.name ?? "Sin dato",
      openRiskCount: projectRisks.length, overdueReviewCount,
      updatedAt: metrics.status?.updatedAt ?? progress?.snapshotDate ?? project.createdAt ?? asOfDate,
      manager: getUser(project.managerId)!, client: getClient(project.clientId)!,
      behind: metrics.plannedProgress !== null && metrics.actualProgress !== null && metrics.actualProgress < metrics.plannedProgress,
      belowSpi: metrics.spi !== null && metrics.spi < 0.8,
      needsAttention: (metrics.spi !== null && metrics.spi < 0.8) || overdueReviewCount > 0 || status === "Detenido",
      executing: status === "En ejecución",
    };
  });
}
export type ProjectRow = ReturnType<typeof projectRows>[number];

export function officialRiskRows(session: DemoSession = emptySession) {
  return sessionRisks(session).map(risk => {
    const review = sessionReviews(risk.id, session).at(-1);
    return {
      ...risk, projectName: sessionProject(risk.projectId ?? "", session)?.name ?? risk.scopeType,
      category: catalogs.riskCategories.find(item => item.id === risk.categoryId)?.label ?? "Sin clasificar",
      tone: risk.type === "Amenaza" ? "neutral" as const : "info" as const,
      statusTone: riskStatusTone(risk.status),
      owner: getUser(risk.ownerId)!, reviewDate: review?.nextReviewAt ?? null,
      review, overdue: !isRiskClosed(risk) && !!review && isReviewOverdue(review), exposure: getRiskExposure(risk),
    };
  });
}
export function suggestionRows(session: DemoSession = emptySession) {
  return riskSuggestions.map(source => {
    const decision = session.decisions[source.id];
    const suggestion = decision ? { ...source, status: decision.status, linkedRiskId: decision.risk?.id ?? null, pmDecision: decision.status === "accepted" ? "Aceptar" : "Descartar", decidedAt: decision.decidedAt, decidedById: decision.actorId } : source;
    return {
    ...suggestion, type: suggestion.suggestedType, scopes: suggestion.suggestedScopes,
    probability: suggestion.suggestedProbability, impact: suggestion.suggestedImpact,
    exposure: suggestion.suggestedProbability * suggestion.suggestedImpact,
    statusLabel: suggestion.status === "pending" ? "Pendiente · no registrada" : suggestion.status === "accepted" ? "Aceptada" : "Descartada",
    statusTone: proposalStatusTone(suggestion.status),
    projectName: getProject(suggestion.projectId)?.name,
    };
  });
}
export function getPendingSuggestions(session: DemoSession = emptySession) {
  return suggestionRows(session).filter(suggestion => suggestion.status === "pending");
}

export type WorkItem = {
  id: string; title: string; projectId: string | null; kind: string;
  summary: string; date: string; overdue: boolean;
  suggestionId?: string; riskId?: string;
};
export function workItems(following: boolean, session: DemoSession = emptySession): WorkItem[] {
  if (following) return officialRiskRows(session).map(risk => ({
    id: risk.id, title: risk.title, projectId: risk.projectId, kind: "Seguimiento de riesgo",
    summary: risk.description, date: risk.reviewDate ?? risk.identifiedAt, overdue: risk.overdue, riskId: risk.id,
  }));
  return [
    ...getPendingSuggestions(session).map(suggestion => ({
      id: suggestion.id, title: suggestion.title, projectId: suggestion.projectId, kind: "Sugerencia IA",
      summary: suggestion.summary, date: suggestion.detectedAt, overdue: false, suggestionId: suggestion.id,
    })),
    ...officialRiskRows(session).filter(risk => risk.overdue).map(risk => {
      const review = risk.review!;
      return {
        id: review.id, title: risk.title, projectId: risk.projectId, kind: "Revisión vencida",
        summary: review.notes, date: review.nextReviewAt!, overdue: true, riskId: risk.id,
      };
    }),
    ...planChangeRequests.filter(request => request.status === "Pendiente").map(request => ({
      id: request.id, title: request.title, projectId: request.projectId, kind: "Cambio de plan",
      summary: `Término actual: ${date(request.currentEndDate)}. Término solicitado: ${date(request.requestedEndDate)}.`,
      date: request.requestedAt, overdue: false,
    })),
  ];
}
export function filteredPortfolioRisks(rows: ProjectRow[], filtered: boolean, session: DemoSession = emptySession) {
  const ids = new Set(rows.map(project => project.id));
  return officialRiskRows(session).filter(risk => risk.projectId ? ids.has(risk.projectId) : !filtered);
}

export const projectViews = [
  { value: "all", label: "Todos los proyectos" }, { value: "mine", label: "Mis proyectos" },
  { value: "attention", label: "Requieren atención" }, { value: "execution", label: "En ejecución" },
] as const;
export const defaultProjectFilters = { view: "all", query: "", status: "", manager: "", country: "", sort: "updated", lob: "", squad: "", lead: "" };
export type ProjectFilters = typeof defaultProjectFilters;
export function readProjectFilters(search: string): ProjectFilters {
  const params = new URLSearchParams(search);
  const valid = (key: string, values: string[], fallback = "") => values.includes(params.get(key) ?? "") ? params.get(key)! : fallback;
  return { view: valid("view", projectViews.map(view => view.value), "all"), query: params.get("q") ?? "",
    lob: params.get("lob") ?? "", squad: params.get("squad") ?? "", lead: params.get("lead") ?? "",
    status: valid("status", projectStates), manager: valid("manager", projects.map(row => row.managerId)),
    country: valid("country", projects.map(row => row.country)), sort: valid("sort", ["updated", "name", "spi", "end"], "updated") };
}
export function filterProjects(all: ProjectRow[], filters: ProjectFilters) {
  const base = all.filter(row => matches(filters.query, row.name, row.code, row.client.name)
    && (!filters.status || row.status === filters.status) && (!filters.manager || row.managerId === filters.manager) && (!filters.country || row.country === filters.country)
    && (!filters.lob || row.lob === filters.lob) && (!filters.squad || row.squad === filters.squad) && (!filters.lead || row.techLead === filters.lead));
  const matchesView = (row: ProjectRow, view: string) => view === "mine" ? row.managerId === demoUser.id : view === "attention" ? row.needsAttention : view === "execution" ? row.executing : true;
  const rows = base.filter(row => matchesView(row, filters.view)).sort((a, b) => filters.sort === "name" ? a.name.localeCompare(b.name, "es") : filters.sort === "spi" ? (a.spi ?? Infinity) - (b.spi ?? Infinity) : filters.sort === "end" ? (a.plannedEndDate ?? "9999").localeCompare(b.plannedEndDate ?? "9999") : b.updatedAt.localeCompare(a.updatedAt));
  return { rows, counts: Object.fromEntries(projectViews.map(view => [view.value, base.filter(row => matchesView(row, view.value)).length])),
    summary: { executing: rows.filter(row => row.executing).length, behind: rows.filter(row => row.behind).length, risks: rows.reduce((sum, row) => sum + row.openRiskCount, 0) } };
}
