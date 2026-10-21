import { asOfDate, catalogs, clients, projects, riskEvents, riskReviews, risks, users } from "./data";
import { countries, impactDomains, managers, projectStates, riskCatalog, riskTypes, type RiskType } from "./catalogs";

export const localRecordsKey = "gpl.demo.records.v1";
export type ProjectAttributes = Partial<Pick<(typeof projects)[number], "lobId" | "serviceId" | "squadId" | "techLeadId" | "complexity" | "p1p2ReceivedAt" | "preSalesId" | "tamId" | "sdmId" | "accountManagerId" | "references" | "tcv" | "acv">>;
export type ProjectDraft = ProjectAttributes & { id: string; name: string; clientId: string; managerId: string; country: string; lob: string; status: string; description: string; startDate: string; plannedEndDate: string };
export type ManualRiskDraft = { categoryId?: string; title: string; description: string; type: RiskType; ownerId: string; scopeType: string; projectId: string | null; scopes: string[]; probability: number; impact: number; strategy: string; responsePlan: string; trigger: string; contingency: string; contingencyPrepared: boolean; nextReviewAt: string };
export type ManualRiskRecord = { id: string; reviewId: string; eventId: string; draft: ManualRiskDraft };
export type LocalRecords = { projects: ProjectDraft[]; risks: ManualRiskRecord[] };
export const emptyRecords: LocalRecords = { projects: [], risks: [] };
export type ProjectRecord = Omit<(typeof projects)[number], keyof ProjectAttributes | "startDate" | "plannedEndDate" | "budgetAmount" | "currency"> & ProjectAttributes & { startDate: string | null; plannedEndDate: string | null; budgetAmount: number | null; currency: string | null; lob?: string; initialStatus?: string; createdAt?: string };
export const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const present = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const text = (value: unknown): value is string => typeof value === "string";
export const sameId = (a: string, b: string) => a.trim().toLocaleLowerCase("es") === b.trim().toLocaleLowerCase("es");

export function projectError(draft: ProjectDraft, existing: { id: string }[]) {
  if (!present(draft.id) || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(draft.id)) return "Usa un identificador de hasta 64 letras, números, guiones o guiones bajos.";
  if (existing.some(item => sameId(item.id, draft.id))) return "Ya existe un proyecto con ese identificador.";
  if (!present(draft.name) || !present(draft.lob)) return "Completa el nombre y la línea de negocio (LOB).";
  if (!clients.some(client => client.id === draft.clientId) || !managers.some(user => user.id === draft.managerId) || !countries.some(country => country.name === draft.country) || !projectStates.includes(draft.status)) return "Selecciona cliente, gestor, país y estado válidos.";
  if (!text(draft.description) || !text(draft.startDate) || !text(draft.plannedEndDate)) return "Revisa los datos adicionales del proyecto.";
  if ((draft.startDate && !validDate(draft.startDate)) || (draft.plannedEndDate && !validDate(draft.plannedEndDate))) return "Introduce fechas válidas.";
  if (draft.startDate && draft.plannedEndDate && draft.plannedEndDate < draft.startDate) return "El término previsto no puede ser anterior al inicio.";
  if (draft.lobId && !catalogs.lobs.some(row => row.id === draft.lobId)) return "Selecciona una LOB válida.";
  if (draft.lobId && catalogs.lobs.find(row => row.id === draft.lobId)?.label !== draft.lob) return "La línea de negocio no coincide con su catálogo.";
  if (draft.serviceId && !catalogs.services.some(row => row.id === draft.serviceId && row.lobId === draft.lobId)) return "El servicio debe pertenecer a la LOB elegida.";
  if (draft.squadId && !catalogs.squads.some(row => row.id === draft.squadId)) return "Selecciona un squad válido.";
  if (draft.techLeadId && !users.some(row => row.id === draft.techLeadId && row.active)) return "Selecciona un líder técnico válido.";
  if (draft.complexity && !catalogs.complexities.includes(draft.complexity)) return "Selecciona una complejidad válida.";
  if (draft.p1p2ReceivedAt && (!validDate(draft.p1p2ReceivedAt) || draft.p1p2ReceivedAt > asOfDate)) return "La recepción P1P2 debe ser válida y no posterior al corte.";
  return "";
}
export function riskError(draft: ManualRiskDraft, availableProjects: { id: string }[]) {
  if (draft.categoryId && !catalogs.riskCategories.some(row => row.id === draft.categoryId)) return "Selecciona una categoría válida.";
  if (!present(draft.title) || !present(draft.description)) return "Completa el título y la descripción del riesgo.";
  if (!riskTypes.includes(draft.type) || !riskCatalog[draft.type]?.strategies.includes(draft.strategy)) return "Selecciona un tipo y una estrategia compatibles.";
  if (!users.some(user => user.active && user.id === draft.ownerId)) return "Selecciona un responsable válido.";
  if (!Array.isArray(draft.scopes) || !draft.scopes.length || draft.scopes.some(scope => !impactDomains.includes(scope)) || new Set(draft.scopes).size !== draft.scopes.length) return "Selecciona al menos un ámbito impactado válido.";
  if (![draft.probability, draft.impact].every(value => Number.isInteger(value) && value >= 1 && value <= 5)) return "Probabilidad e impacto deben ser enteros entre 1 y 5.";
  if (draft.scopeType === "Proyecto" ? !availableProjects.some(project => project.id === draft.projectId) : draft.scopeType !== "Transversal" || draft.projectId !== null) return "Selecciona un proyecto o el alcance transversal.";
  if (![draft.responsePlan, draft.trigger, draft.contingency, draft.nextReviewAt].every(text) || typeof draft.contingencyPrepared !== "boolean") return "Revisa el plan de respuesta y las fechas.";
  if (draft.contingencyPrepared && !draft.contingency.trim()) return "Describe la contingencia antes de marcarla preparada.";
  if (draft.nextReviewAt && (!validDate(draft.nextReviewAt) || draft.nextReviewAt < asOfDate)) return "La próxima revisión debe ser una fecha válida desde el corte de referencia.";
  return "";
}
export function localProject(draft: ProjectDraft): ProjectRecord {
  return { ...draft, id: draft.id, code: draft.id, countryCode: countries.find(country => country.name === draft.country)!.code, initialStatus: draft.status, createdAt: asOfDate, startDate: draft.startDate || null, plannedEndDate: draft.plannedEndDate || null, budgetAmount: null, currency: null };
}
function projectValue(value: unknown): ProjectDraft | undefined {
  if (!value || typeof value !== "object") return;
  const row = value as ProjectDraft;
  if (![row.id, row.name, row.clientId, row.managerId, row.country, row.lob, row.status, row.description, row.startDate, row.plannedEndDate].every(text)) return;
  const extra = Object.fromEntries(["lobId", "serviceId", "squadId", "techLeadId", "complexity", "p1p2ReceivedAt"].filter(key => key in row).map(key => [key, (row as Record<string, unknown>)[key]]));
  if (!Object.values(extra).every(value => value === null || text(value))) return;
  return { ...extra, id: row.id, name: row.name, clientId: row.clientId, managerId: row.managerId, country: row.country, lob: row.lob, status: row.status, description: row.description, startDate: row.startDate, plannedEndDate: row.plannedEndDate };
}
function riskValue(value: unknown): ManualRiskDraft | undefined {
  if (!value || typeof value !== "object") return;
  const row = value as ManualRiskDraft;
  if (row.categoryId !== undefined && !text(row.categoryId)) return;
  return { categoryId: row.categoryId, title: row.title, description: row.description, type: row.type, ownerId: row.ownerId, scopeType: row.scopeType, projectId: row.projectId, scopes: row.scopes, probability: row.probability, impact: row.impact, strategy: row.strategy, responsePlan: row.responsePlan, trigger: row.trigger, contingency: row.contingency, contingencyPrepared: row.contingencyPrepared, nextReviewAt: row.nextReviewAt };
}
export function loadRecords(): { records: LocalRecords; issue: string } {
  try {
    const raw = localStorage.getItem(localRecordsKey);
    if (!raw) return { records: emptyRecords, issue: "" };
    const parsed = JSON.parse(raw);
    if (![1, 2].includes(parsed.version) || !Array.isArray(parsed.projects) || !Array.isArray(parsed.risks)) throw new Error();
    const records: LocalRecords = { projects: [], risks: [] };
    for (const value of parsed.projects) {
      const draft = projectValue(value);
      if (!draft || projectError(draft, [...projects, ...records.projects])) throw new Error();
      records.projects.push(draft);
    }
    const ids = new Set(risks.map(risk => risk.id));
    const reviewIds = new Set(riskReviews.map(review => review.id)), eventIds = new Set(riskEvents.map(event => event.id));
    for (const value of parsed.risks) {
      const draft = riskValue(value?.draft);
      if (!draft || riskError(draft, [...projects, ...records.projects]) || !/^(RSK|TRS)-\d+$/.test(value.id) || !/^RRV-\d+$/.test(value.reviewId) || !/^EVT-\d+$/.test(value.eventId) || ids.has(value.id) || reviewIds.has(value.reviewId) || eventIds.has(value.eventId)) throw new Error();
      ids.add(value.id); reviewIds.add(value.reviewId); eventIds.add(value.eventId);
      records.risks.push({ id: value.id, reviewId: value.reviewId, eventId: value.eventId, draft });
    }
    return { records, issue: "" };
  } catch { return { records: emptyRecords, issue: "No se pudieron validar los registros locales. Restablece la semilla antes de guardar nuevas altas." }; }
}
export function saveRecords(records: LocalRecords) {
  try { localStorage.setItem(localRecordsKey, JSON.stringify({ version: 2, ...records })); return ""; }
  catch { return "No se pudo guardar en este navegador. Conserva el formulario y habilita el almacenamiento local para continuar."; }
}
