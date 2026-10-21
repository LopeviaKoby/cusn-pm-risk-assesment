import { validateEnrichment } from "./validate-enrichment.mjs";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const dataDirectory = resolve(scriptDirectory, "../src/demo/data");

const expectedFiles = {
  config: "demo-config.json",
  catalogs: "core/catalogs.json",
  users: "core/users.json",
  clients: "core/clients.json",
  projects: "core/projects.json",
  projectStatus: "core/project-status.json",
  projectProgressHistory: "core/project-progress-history.json",
  milestones: "core/milestones.json",
  risks: "risks/risks.json",
  riskSuggestions: "risks/risk-suggestions.json",
  riskActions: "risks/risk-actions.json",
  riskReviews: "risks/risk-reviews.json",
  riskEvents: "risks/risk-events.json",
  evidence: "risks/evidence.json",
  changeControls: "operations/change-controls.json",
  planChangeRequests: "operations/plan-change-requests.json",
  purchases: "operations/purchases.json",
  billingMilestones: "operations/billing-milestones.json",
  timeEntries: "operations/time-entries.json",
  commitments: "operations/commitments.json",
  projectDocuments: "supporting/project-documents.json",
  projectDecisions: "supporting/project-decisions.json",
  lessonsLearned: "supporting/lessons-learned.json",
};

const projectStatuses = [
  "Requiere P1P2",
  "En ejecución",
  "Detenido",
  "Cancelado",
  "En transición",
  "Terminado",
];
const milestoneStatuses = ["Pendiente", "En curso", "Completado", "Cancelado"];
const riskTypes = ["Amenaza", "Oportunidad"];
const riskScopeTypes = ["Proyecto", "Transversal"];
const riskStatuses = {
  Amenaza: ["Activo", "Controlado", "Materializado", "Cerrado"],
  Oportunidad: ["Activa", "Potenciada", "Realizada", "Cerrada"],
};
const riskStrategies = {
  Amenaza: ["Evitar", "Mitigar", "Transferir", "Aceptar", "Escalar"],
  Oportunidad: ["Explotar", "Potenciar", "Compartir", "Aceptar", "Escalar"],
};
const riskScopes = ["Alcance", "Costo", "Calidad", "Plazo"];
const suggestionStatuses = ["pending", "accepted", "dismissed"];
const actionStatuses = ["Pendiente", "En curso", "Completada", "Cancelada"];
const riskEventTypes = [
  "Registro",
  "Revisión",
  "Acción completada",
  "Preparación de contingencia",
  "Materialización",
  "Contingencia activada",
  "Cierre",
  "Reapertura",
];
const evidenceSourceTypes = ["Minuta", "Cronograma", "Acta", "Extracto"];
const changeControlStatuses = ["Pendiente", "Aprobado", "Rechazado"];
const planChangeStatuses = ["Pendiente", "Aprobado", "Descartado"];
const purchaseStatuses = ["Pendiente", "Aprobada", "Recibida"];
const billingStatuses = ["Pendiente", "Facturado", "Real registrado"];
const commitmentScopes = ["project", "management"];
const commitmentStatuses = ["Vigente", "En riesgo", "Cumplido"];
const documentTypes = ["Entregable", "SOW", "Acta"];
const documentStatuses = ["En elaboración", "Enviado", "Firmado"];
const decisionStatuses = ["Vigente", "Reemplazada"];
const decisionReferenceTypes = ["Riesgo", "Documento", "Control de cambio", "Compromiso"];
const currencies = ["PEN", "CLP", "COP", "USD"];
const forbiddenMetricKeys = new Set([
  "spi",
  "exposure",
  "openRiskCount",
  "riskCount",
  "portfolioKpis",
  "workspaceCounts",
]);
const forbiddenFiles = new Set([
  "portfolio-kpis.json",
  "workspace-counts.json",
  "project-risk-counts.json",
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizePath(filePath) {
  return filePath.split(sep).join("/");
}

function loadJsonFiles(directory) {
  const files = {};
  const parseErrors = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      const nested = loadJsonFiles(fullPath);
      Object.assign(files, nested.files);
      parseErrors.push(...nested.parseErrors);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const relativePath = normalizePath(relative(dataDirectory, fullPath));
    const content = readFileSync(fullPath, "utf8");

    try {
      files[relativePath] = JSON.parse(content);
    } catch (error) {
      parseErrors.push(`${relativePath}: JSON inválido (${error.message})`);
    }
  }

  return { files, parseErrors };
}

function buildDataset(files) {
  const dataset = {};

  for (const [key, relativePath] of Object.entries(expectedFiles)) {
    if (!(relativePath in files)) {
      dataset[key] = undefined;
    } else {
      dataset[key] = files[relativePath];
    }
  }

  return dataset;
}

function indexById(items) {
  const index = new Map();

  for (const item of items) {
    if (isObject(item) && typeof item.id === "string") {
      index.set(item.id, item);
    }
  }

  return index;
}

function sameSet(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    new Set(left).size === left.length &&
    left.every((value) => right.includes(value))
  );
}

function roundTwo(value) {
  return Math.round(value * 100) / 100;
}

function validateDataset(dataset) {
  const errors = [];
  const addError = (message) => errors.push(message);

  const users = Array.isArray(dataset.users) ? dataset.users : [];
  const clients = Array.isArray(dataset.clients) ? dataset.clients : [];
  const projects = Array.isArray(dataset.projects) ? dataset.projects : [];
  const statuses = Array.isArray(dataset.projectStatus) ? dataset.projectStatus : [];
  const progressHistory = Array.isArray(dataset.projectProgressHistory)
    ? dataset.projectProgressHistory
    : [];
  const milestones = Array.isArray(dataset.milestones) ? dataset.milestones : [];
  const risks = Array.isArray(dataset.risks) ? dataset.risks : [];
  const suggestions = Array.isArray(dataset.riskSuggestions) ? dataset.riskSuggestions : [];
  const actions = Array.isArray(dataset.riskActions) ? dataset.riskActions : [];
  const reviews = Array.isArray(dataset.riskReviews) ? dataset.riskReviews : [];
  const riskEvents = Array.isArray(dataset.riskEvents) ? dataset.riskEvents : [];
  const evidence = Array.isArray(dataset.evidence) ? dataset.evidence : [];
  const changeControls = Array.isArray(dataset.changeControls) ? dataset.changeControls : [];
  const planChanges = Array.isArray(dataset.planChangeRequests)
    ? dataset.planChangeRequests
    : [];
  const purchases = Array.isArray(dataset.purchases) ? dataset.purchases : [];
  const billing = Array.isArray(dataset.billingMilestones) ? dataset.billingMilestones : [];
  const timeEntries = Array.isArray(dataset.timeEntries) ? dataset.timeEntries : [];
  const commitments = Array.isArray(dataset.commitments) ? dataset.commitments : [];
  const documents = Array.isArray(dataset.projectDocuments) ? dataset.projectDocuments : [];
  const decisions = Array.isArray(dataset.projectDecisions) ? dataset.projectDecisions : [];
  const lessons = Array.isArray(dataset.lessonsLearned) ? dataset.lessonsLearned : [];

  const collections = [
    ["users", users],
    ["clients", clients],
    ["projects", projects],
    ["project-status", statuses],
    ["project-progress-history", progressHistory],
    ["milestones", milestones],
    ["risks", risks],
    ["risk-suggestions", suggestions],
    ["risk-actions", actions],
    ["risk-reviews", reviews],
    ["risk-events", riskEvents],
    ["evidence", evidence],
    ["change-controls", changeControls],
    ["plan-change-requests", planChanges],
    ["purchases", purchases],
    ["billing-milestones", billing],
    ["time-entries", timeEntries],
    ["commitments", commitments],
    ["project-documents", documents],
    ["project-decisions", decisions],
    ["lessons-learned", lessons],
  ];

  for (const [name, items] of collections) {
    if (!Array.isArray(items)) {
      addError(`${name}: se esperaba un arreglo de registros.`);
      continue;
    }

    if (items.length === 0) {
      addError(`${name}: no debe estar vacío.`);
    }

    if (items.length > 20) {
      addError(`${name}: contiene ${items.length} registros; el máximo es 20.`);
    }

    const ids = new Set();

    for (const item of items) {
      if (!isObject(item)) {
        addError(`${name}: todos los registros deben ser objetos.`);
        continue;
      }

      if (typeof item.id !== "string" || item.id.length === 0) {
        addError(`${name}: hay un registro sin id válido.`);
      } else if (ids.has(item.id)) {
        addError(`${name}: id duplicado ${item.id}.`);
      } else {
        ids.add(item.id);
      }
    }
  }

  if (!isObject(dataset.config)) {
    addError("demo-config.json: se esperaba un objeto de configuración.");
  } else {
    if (dataset.config.asOfDate !== "2026-10-20") {
      addError('demo-config.json: asOfDate debe ser exactamente "2026-10-20".');
    }

    if (dataset.config.fictionalData !== true) {
      addError("demo-config.json: fictionalData debe ser true.");
    }
  }

  const asOfDate = isObject(dataset.config) ? dataset.config.asOfDate : "2026-10-20";
  const userIndex = indexById(users);
  const clientIndex = indexById(clients);
  const projectIndex = indexById(projects);
  const riskIndex = indexById(risks);
  const reviewIndex = indexById(reviews);
  const actionIndex = indexById(actions);
  const evidenceIndex = indexById(evidence);
  const documentIndex = indexById(documents);
  const changeControlIndex = indexById(changeControls);
  const planChangeIndex = indexById(planChanges);
  const commitmentIndex = indexById(commitments);

  const checkReference = (value, index, field, context, allowNull = false) => {
    if (value === null && allowNull) {
      return;
    }

    if (typeof value !== "string" || !index.has(value)) {
      addError(`${context}: ${field} referencia un ID inexistente (${String(value)}).`);
    }
  };

  const checkDate = (value, field, context, allowNull = false) => {
    if (value === null && allowNull) {
      return;
    }

    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      addError(`${context}: ${field} debe ser una fecha ISO YYYY-MM-DD.`);
      return;
    }

    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      addError(`${context}: ${field} no es una fecha válida (${value}).`);
    }
  };

  const checkTimestamp = (value, field, context) => {
    if (typeof value !== "string") {
      addError(`${context}: ${field} debe ser un timestamp ISO 8601.`);
      return;
    }

    const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/;
    if (!timestampPattern.test(value) || Number.isNaN(Date.parse(value))) {
      addError(`${context}: ${field} debe ser un timestamp ISO 8601 válido.`);
    }
  };

  const checkEnum = (value, allowed, field, context) => {
    if (!allowed.includes(value)) {
      addError(`${context}: ${field} inválido (${String(value)}).`);
    }
  };

  const checkScopes = (value, field, context) => {
    if (!Array.isArray(value) || value.length === 0) {
      addError(`${context}: ${field} debe contener al menos un ámbito.`);
      return;
    }

    if (new Set(value).size !== value.length) {
      addError(`${context}: ${field} contiene ámbitos duplicados.`);
    }

    for (const scope of value) {
      checkEnum(scope, riskScopes, field, context);
    }
  };

  const checkAssessment = (item, context) => {
    for (const [field, label] of [
      ["probability", "probabilidad"],
      ["impact", "impacto"],
    ]) {
      if (!Number.isInteger(item[field]) || item[field] < 1 || item[field] > 5) {
        addError(`${context}: ${label} (${field}) debe ser un entero entre 1 y 5.`);
      }
    }
  };

  const checkAmount = (value, field, context) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      addError(`${context}: ${field} debe ser un importe no negativo.`);
    }
  };

  for (const client of clients) {
    const context = `Cliente ${client.id}`;
    if (typeof client.name !== "string" || client.name.length === 0) {
      addError(`${context}: nombre requerido.`);
    }
    if (typeof client.country !== "string" || client.country.length === 0) {
      addError(`${context}: country requerido.`);
    }
  }

  for (const user of users) {
    const context = `Usuario ${user.id}`;
    checkEnum(user.role, ["Project Manager", "PMO", "Especialista", "Preventa", "TAM", "SDM", "Account Manager"], "role", context);
    if (typeof user.name !== "string" || user.name.length === 0) {
      addError(`${context}: nombre requerido.`);
    }
    if (user.active !== true) {
      addError(`${context}: el dato de demostración debe estar activo.`);
    }
  }

  if (projects.length !== 8) {
    addError(`projects: se esperaban exactamente 8 proyectos y hay ${projects.length}.`);
  }

  const projectCodes = new Set();
  for (const project of projects) {
    const context = `Proyecto ${project.id}`;
    checkReference(project.clientId, clientIndex, "clientId", context);
    checkReference(project.managerId, userIndex, "managerId", context);


    checkDate(project.startDate, "startDate", context);
    checkDate(project.plannedEndDate, "plannedEndDate", context);

    if (project.startDate > project.plannedEndDate) {
      addError(`${context}: startDate no puede ser posterior a plannedEndDate.`);
    }

    if (projectCodes.has(project.code)) {
      addError(`${context}: código de proyecto duplicado (${project.code}).`);
    }
    projectCodes.add(project.code);

    if (!/^[A-Z]{2}$/.test(project.countryCode)) {
      addError(`${context}: countryCode debe tener dos letras mayúsculas.`);
    }
  }

  const statusProjectIds = new Set();
  for (const status of statuses) {
    const context = `Estado ${status.id}`;
    checkReference(status.projectId, projectIndex, "projectId", context);
    checkReference(status.updatedById, userIndex, "updatedById", context);
    checkEnum(status.status, projectStatuses, "status", context);
    checkDate(status.statusSince, "statusSince", context);
    checkDate(status.updatedAt, "updatedAt", context);

    if (statusProjectIds.has(status.projectId)) {
      addError(`${context}: hay más de un estado vigente para ${status.projectId}.`);
    }
    statusProjectIds.add(status.projectId);

    if (status.statusSince > status.updatedAt) {
      addError(`${context}: statusSince no puede ser posterior a updatedAt.`);
    }
  }

  for (const project of projects) {
    if (!statusProjectIds.has(project.id)) {
      addError(`Proyecto ${project.id}: falta su registro en project-status.`);
    }
  }

  const progressKeys = new Set();
  for (const snapshot of progressHistory) {
    const context = `Avance ${snapshot.id}`;
    checkReference(snapshot.projectId, projectIndex, "projectId", context);
    checkReference(snapshot.reportedById, userIndex, "reportedById", context);
    checkDate(snapshot.snapshotDate, "snapshotDate", context);

    const key = `${snapshot.projectId}:${snapshot.snapshotDate}`;
    if (progressKeys.has(key)) {
      addError(`${context}: corte duplicado para ${snapshot.projectId} en ${snapshot.snapshotDate}.`);
    }
    progressKeys.add(key);

    for (const [field, label] of [
      ["plannedProgress", "plannedProgress"],
      ["actualProgress", "actualProgress"],
    ]) {
      if (
        typeof snapshot[field] !== "number" ||
        !Number.isFinite(snapshot[field]) ||
        snapshot[field] < 0 ||
        snapshot[field] > 1
      ) {
        addError(`${context}: ${label} debe ser un ratio entre 0 y 1.`);
      }
    }
  }

  const latestProgressByProject = new Map();
  for (const snapshot of progressHistory) {
    const current = latestProgressByProject.get(snapshot.projectId);
    if (!current || snapshot.snapshotDate > current.snapshotDate) {
      latestProgressByProject.set(snapshot.projectId, snapshot);
    }
  }

  for (const project of projects) {
    const latest = latestProgressByProject.get(project.id);
    if (!latest) {
      addError(`Proyecto ${project.id}: falta al menos un corte de avance.`);
      continue;
    }

    const status = statuses.find((item) => item.projectId === project.id);
    if (status && latest.snapshotDate > status.updatedAt) {
      addError(
        `Proyecto ${project.id}: el avance más reciente (${latest.snapshotDate}) es posterior a su estado vigente (${status.updatedAt}).`,
      );
    }
  }

  for (const milestone of milestones) {
    const context = `Hito ${milestone.id}`;
    checkReference(milestone.projectId, projectIndex, "projectId", context);
    checkReference(milestone.ownerId, userIndex, "ownerId", context);
    checkEnum(milestone.status, milestoneStatuses, "status", context);
    checkDate(milestone.dueDate, "dueDate", context);
    checkDate(milestone.completedAt, "completedAt", context, true);

    if (milestone.status === "Completado" && milestone.completedAt === null) {
      addError(`${context}: un hito completado requiere completedAt.`);
    }

    if (milestone.status !== "Completado" && milestone.completedAt !== null) {
      addError(`${context}: completedAt solo corresponde a un hito completado.`);
    }
  }

  for (const risk of risks) {
    const context = `Riesgo ${risk.id}`;
    checkEnum(risk.type, riskTypes, "type", context);
    checkEnum(risk.scopeType, riskScopeTypes, "scopeType", context);
    checkReference(risk.ownerId, userIndex, "ownerId", context);
    checkReference(risk.identifiedById, userIndex, "identifiedById", context);
    checkDate(risk.identifiedAt, "identifiedAt", context);
    checkScopes(risk.scopes, "scopes", context);
    checkAssessment(risk, context);

    if (risk.scopeType === "Transversal") {
      if (risk.projectId !== null) {
        addError(`${context}: un riesgo transversal debe tener projectId null.`);
      }
    } else {
      if (risk.projectId === null) {
        addError(`${context}: un riesgo de proyecto requiere projectId.`);
      } else {
        checkReference(risk.projectId, projectIndex, "projectId", context);
      }
    }

    checkEnum(risk.status, riskStatuses[risk.type] ?? [], "status", context);
    checkEnum(risk.strategy, riskStrategies[risk.type] ?? [], "strategy", context);

    if (typeof risk.responsePlan !== "string" || risk.responsePlan.length === 0) {
      addError(`${context}: responsePlan requerido.`);
    }

    if (typeof risk.contingencyPrepared !== "boolean") {
      addError(`${context}: contingencyPrepared debe ser booleano.`);
    }
  }

  for (const suggestion of suggestions) {
    const context = `Sugerencia ${suggestion.id}`;
    checkEnum(suggestion.status, suggestionStatuses, "status", context);
    checkReference(suggestion.projectId, projectIndex, "projectId", context);
    checkEnum(suggestion.suggestedType, riskTypes, "suggestedType", context);
    checkScopes(suggestion.suggestedScopes, "suggestedScopes", context);
    checkAssessment(
      { probability: suggestion.suggestedProbability, impact: suggestion.suggestedImpact },
      context,
    );
    checkEnum(
      suggestion.suggestedStrategy,
      riskStrategies[suggestion.suggestedType] ?? [],
      "suggestedStrategy",
      context,
    );
    checkDate(suggestion.detectedAt, "detectedAt", context);

    if (suggestion.simulated !== true) {
      addError(`${context}: la propuesta debe estar marcada como simulated.`);
    }

    if (riskIndex.has(suggestion.id)) {
      addError(`${context}: una sugerencia no puede existir también como riesgo oficial.`);
    }

    if (!Array.isArray(suggestion.evidenceIds) || suggestion.evidenceIds.length === 0) {
      addError(`${context}: evidenceIds debe tener al menos una evidencia.`);
    } else {
      if (new Set(suggestion.evidenceIds).size !== suggestion.evidenceIds.length) {
        addError(`${context}: evidenceIds contiene duplicados.`);
      }

      for (const evidenceId of suggestion.evidenceIds) {
        checkReference(evidenceId, evidenceIndex, "evidenceIds", context);
        const item = evidenceIndex.get(evidenceId);
        if (item && item.projectId !== suggestion.projectId) {
          addError(`${context}: la evidencia ${evidenceId} pertenece a otro proyecto.`);
        }
        if (item && item.simulated !== true) {
          addError(`${context}: la evidencia ${evidenceId} debe ser simulada.`);
        }
      }
    }

    if (suggestion.status === "pending") {
      if (
        suggestion.pmDecision !== null ||
        suggestion.decidedById !== null ||
        suggestion.decidedAt !== null ||
        suggestion.linkedRiskId !== null
      ) {
        addError(`${context}: una propuesta pendiente no puede tener decisión ni vínculo oficial.`);
      }
    }

    if (suggestion.status === "accepted") {
      if (suggestion.pmDecision !== "Aceptar") {
        addError(`${context}: una propuesta aceptada requiere pmDecision "Aceptar".`);
      }
      checkReference(suggestion.decidedById, userIndex, "decidedById", context);
      checkDate(suggestion.decidedAt, "decidedAt", context);
      checkReference(suggestion.linkedRiskId, riskIndex, "linkedRiskId", context);
      if (suggestion.linkedRiskId === null) {
        addError(`${context}: una propuesta aceptada debe enlazar un riesgo oficial.`);
      }
    }

    if (suggestion.status === "dismissed") {
      if (suggestion.pmDecision !== "Descartar") {
        addError(`${context}: una propuesta descartada requiere pmDecision "Descartar".`);
      }
      checkReference(suggestion.decidedById, userIndex, "decidedById", context);
      checkDate(suggestion.decidedAt, "decidedAt", context);
      if (suggestion.linkedRiskId !== null) {
        addError(`${context}: una propuesta descartada no debe enlazar un riesgo oficial.`);
      }
      if (typeof suggestion.decisionNote !== "string" || suggestion.decisionNote.length === 0) {
        addError(`${context}: una propuesta descartada requiere decisionNote.`);
      }
    }
  }

  for (const action of actions) {
    const context = `Acción ${action.id}`;
    checkReference(action.riskId, riskIndex, "riskId", context);
    checkReference(action.ownerId, userIndex, "ownerId", context);
    checkEnum(action.status, actionStatuses, "status", context);
    checkDate(action.createdAt, "createdAt", context);
    checkDate(action.dueDate, "dueDate", context);
    checkDate(action.completedAt, "completedAt", context, true);

    if (action.createdAt > action.dueDate) {
      addError(`${context}: createdAt no puede ser posterior a dueDate.`);
    }

    if (action.status === "Completada" && action.completedAt === null) {
      addError(`${context}: una acción completada requiere completedAt.`);
    }

    if (action.status !== "Completada" && action.completedAt !== null) {
      addError(`${context}: completedAt solo corresponde a una acción completada.`);
    }
  }

  const reviewsByRisk = new Map();
  for (const review of reviews) {
    const context = `Revisión ${review.id}`;
    const risk = riskIndex.get(review.riskId);
    checkReference(review.riskId, riskIndex, "riskId", context);
    checkReference(review.actorId, userIndex, "actorId", context);
    checkReference(review.approvedByPmId, userIndex, "approvedByPmId", context);
    checkDate(review.reviewedAt, "reviewedAt", context);
    checkDate(review.approvedAt, "approvedAt", context);
    checkDate(review.nextReviewAt, "nextReviewAt", context, true);
    checkAssessment(review, context);
    checkScopes(review.scopes, "scopes", context);

    if (!risk) {
      continue;
    }

    checkEnum(review.status, riskStatuses[risk.type] ?? [], "status", context);
    checkEnum(review.strategy, riskStrategies[risk.type] ?? [], "strategy", context);

    if (typeof review.decision !== "string" || review.decision.length === 0) {
      addError(`${context}: decision requerida.`);
    }

    if (!Number.isInteger(review.cycleNumber) || review.cycleNumber < 1) {
      addError(`${context}: cycleNumber debe ser un entero positivo.`);
    }

    if (typeof review.isFinal !== "boolean") {
      addError(`${context}: isFinal debe ser booleano.`);
    }

    if (review.reviewedAt > review.approvedAt) {
      addError(`${context}: reviewedAt no puede ser posterior a approvedAt.`);
    }

    if (review.nextReviewAt !== null && review.nextReviewAt < review.approvedAt) {
      addError(`${context}: nextReviewAt no puede ser anterior a approvedAt.`);
    }

    if (review.isFinal && review.nextReviewAt !== null) {
      addError(`${context}: una revisión final no debe tener próxima revisión.`);
    }

    const list = reviewsByRisk.get(review.riskId) ?? [];
    list.push(review);
    reviewsByRisk.set(review.riskId, list);
  }

  for (const [riskId, list] of reviewsByRisk) {
    list.sort((left, right) => left.reviewedAt.localeCompare(right.reviewedAt));
    for (let index = 0; index < list.length; index += 1) {
      const review = list[index];
      const previous = index > 0 ? list[index - 1] : undefined;
      const next = index < list.length - 1 ? list[index + 1] : undefined;

      if (review.decision === "Reapertura" && (!previous || previous.isFinal !== true)) {
        addError(`Riesgo ${riskId}: la reapertura ${review.id} debe seguir a un cierre final.`);
      }

      if (previous?.isFinal === true && review.decision !== "Reapertura") {
        addError(`Riesgo ${riskId}: tras el cierre final ${previous.id} solo procede una reapertura.`);
      }

      if (review.isFinal && next && next.decision !== "Reapertura") {
        addError(`Riesgo ${riskId}: el cierre ${review.id} debe continuar con una reapertura si hay nuevos registros.`);
      }
    }
  }

  for (const risk of risks) {
    const latest = (reviewsByRisk.get(risk.id) ?? []).at(-1);
    if (!latest) {
      addError(`Riesgo ${risk.id}: falta al menos una revisión aprobada.`);
      continue;
    }

    if (latest.probability !== risk.probability || latest.impact !== risk.impact) {
      addError(`Riesgo ${risk.id}: la P/I actual no coincide con su última revisión aprobada.`);
    }

    if (latest.status !== risk.status) {
      addError(`Riesgo ${risk.id}: el estado actual no coincide con su última revisión aprobada.`);
    }

    if (latest.strategy !== risk.strategy) {
      addError(`Riesgo ${risk.id}: la estrategia actual no coincide con su última revisión aprobada.`);
    }

    if (!sameSet(latest.scopes, risk.scopes)) {
      addError(`Riesgo ${risk.id}: los ámbitos actuales no coinciden con su última revisión aprobada.`);
    }
  }

  const checkRelatedEvent = (event, relatedIndex, expectedRiskId) => {
    if (event.relatedId === null) {
      return;
    }

    checkReference(event.relatedId, relatedIndex, "relatedId", `Evento ${event.id}`);
    const related = relatedIndex.get(event.relatedId);
    if (related && related.riskId !== expectedRiskId) {
      addError(`Evento ${event.id}: el registro relacionado pertenece a otro riesgo.`);
    }
  };

  for (const event of riskEvents) {
    const context = `Evento ${event.id}`;
    checkReference(event.riskId, riskIndex, "riskId", context);
    checkReference(event.actorId, userIndex, "actorId", context);
    checkEnum(event.eventType, riskEventTypes, "eventType", context);
    checkTimestamp(event.occurredAt, "occurredAt", context);

    if (typeof event.summary !== "string" || event.summary.length === 0) {
      addError(`${context}: summary requerido.`);
    }

    if (event.relatedId !== null) {
      if (event.relatedId.startsWith("RRV-")) {
        checkRelatedEvent(event, reviewIndex, event.riskId);
      } else if (event.relatedId.startsWith("ACT-")) {
        checkRelatedEvent(event, actionIndex, event.riskId);
      } else {
        addError(`${context}: relatedId no corresponde a una revisión o acción conocida.`);
      }
    }
  }

  for (const item of evidence) {
    const context = `Evidencia ${item.id}`;
    checkReference(item.projectId, projectIndex, "projectId", context);
    checkEnum(item.sourceType, evidenceSourceTypes, "sourceType", context);
    checkDate(item.documentDate, "documentDate", context);

    if (item.simulated !== true) {
      addError(`${context}: simulated debe ser true.`);
    }

    if (typeof item.excerpt !== "string" || item.excerpt.length === 0) {
      addError(`${context}: excerpt requerido.`);
    }

    if (
      typeof item.reference !== "string" ||
      /https?:\/\//i.test(item.reference) ||
      /@/.test(item.reference)
    ) {
      addError(`${context}: reference debe ser una referencia ficticia, sin URL ni correo.`);
    }
  }

  for (const control of changeControls) {
    const context = `Control de cambio ${control.id}`;
    checkReference(control.projectId, projectIndex, "projectId", context);
    checkReference(control.requestedById, userIndex, "requestedById", context);
    checkEnum(control.status, changeControlStatuses, "status", context);
    checkDate(control.requestedAt, "requestedAt", context);
    checkDate(control.decisionDueDate, "decisionDueDate", context);
    checkDate(control.decidedAt, "decidedAt", context, true);

    if (control.status === "Pendiente") {
      if (control.decidedById !== null || control.decidedAt !== null) {
        addError(`${context}: un control pendiente no debe tener decisión.`);
      }
    } else {
      checkReference(control.decidedById, userIndex, "decidedById", context);
      if (control.decidedAt === null) {
        addError(`${context}: un control resuelto requiere decidedAt.`);
      }
    }
  }

  for (const request of planChanges) {
    const context = `Solicitud de cambio de plan ${request.id}`;
    const project = projectIndex.get(request.projectId);
    checkReference(request.projectId, projectIndex, "projectId", context);
    checkReference(request.requestedById, userIndex, "requestedById", context);
    checkReference(request.relatedRiskId, riskIndex, "relatedRiskId", context, true);
    checkEnum(request.status, planChangeStatuses, "status", context);
    checkDate(request.requestedAt, "requestedAt", context);
    checkDate(request.currentEndDate, "currentEndDate", context);
    checkDate(request.requestedEndDate, "requestedEndDate", context);
    checkDate(request.decidedAt, "decidedAt", context, true);

    if (project && request.currentEndDate !== project.plannedEndDate) {
      addError(`${context}: currentEndDate no coincide con la fecha maestra del proyecto.`);
    }

    if (request.requestedEndDate < request.currentEndDate) {
      addError(`${context}: requestedEndDate no puede ser anterior a currentEndDate.`);
    }

    if (request.status === "Pendiente") {
      if (request.decidedById !== null || request.decidedAt !== null) {
        addError(`${context}: una solicitud pendiente no debe tener decisión.`);
      }
    } else {
      checkReference(request.decidedById, userIndex, "decidedById", context);
      if (request.decidedAt === null) {
        addError(`${context}: una solicitud resuelta requiere decidedAt.`);
      }
    }
  }

  for (const purchase of purchases) {
    const context = `Compra ${purchase.id}`;

    checkReference(purchase.projectId, projectIndex, "projectId", context);
    checkReference(purchase.requestedById, userIndex, "requestedById", context);
    checkEnum(purchase.status, purchaseStatuses, "status", context);
    checkEnum(purchase.currency, currencies, "currency", context);
    checkAmount(purchase.expectedAmount, "amount", context);
    checkDate(purchase.orderedAt, "orderedAt", context, true);
    checkDate(purchase.expectedDeliveryAt, "expectedDeliveryAt", context);
    checkDate(purchase.receivedAt, "receivedAt", context, true);

    if (purchase.expectedAmount <= 0) {
      addError(`${context}: amount debe ser mayor que cero.`);
    }



    if (purchase.status === "Pendiente" && purchase.orderedAt !== null) {
      addError(`${context}: una compra pendiente no debe tener orderedAt.`);
    }

    if (purchase.status !== "Pendiente" && purchase.orderedAt === null) {
      addError(`${context}: una compra aprobada o recibida requiere orderedAt.`);
    }

    if (purchase.status === "Recibida" && purchase.receivedAt === null) {
      addError(`${context}: una compra recibida requiere receivedAt.`);
    }

    if (purchase.status !== "Recibida" && purchase.receivedAt !== null) {
      addError(`${context}: receivedAt solo corresponde a una compra recibida.`);
    }
  }

  for (const milestone of billing) {
    const context = `Hito de facturación ${milestone.id}`;

    checkReference(milestone.projectId, projectIndex, "projectId", context);
    checkEnum(milestone.currency, currencies, "currency", context);
    checkEnum(milestone.billingStatus, billingStatuses, "billingStatus", context);
    checkAmount(milestone.showPricingAmount, "showPricingAmount", context);
    checkAmount(milestone.plannedAmount, "plannedAmount", context);
    if (milestone.actualAmount !== null) checkAmount(milestone.actualAmount, "actualAmount", context);
    checkDate(milestone.plannedDate, "plannedDate", context);
    checkDate(milestone.actualDate, "actualDate", context, true);

    if (milestone.showPricingAmount <= 0 || milestone.plannedAmount < 0) {
      addError(`${context}: showPricingAmount y plannedAmount deben ser positivos.`);
    }



    if (milestone.billingStatus === "Pendiente") {
      if (milestone.actualAmount !== null || milestone.actualDate !== null) {
        addError(`${context}: un hito pendiente no debe tener importe ni fecha real.`);
      }
    } else {
      if (milestone.actualAmount === null || milestone.actualDate === null) {
        addError(`${context}: un hito facturado requiere importe y fecha reales.`);
      }
    }
  }

  for (const entry of timeEntries) {
    const context = `Imputación ${entry.id}`;
    checkReference(entry.projectId, projectIndex, "projectId", context);
    checkReference(entry.userId, userIndex, "userId", context);
    checkDate(entry.workDate, "workDate", context);

    if (
      typeof entry.hours !== "number" ||
      !Number.isFinite(entry.hours) ||
      entry.hours <= 0 ||
      entry.hours > 24
    ) {
      addError(`${context}: hours debe ser mayor que 0 y no superar 24.`);
    }

    if (typeof entry.billable !== "boolean") {
      addError(`${context}: billable debe ser booleano.`);
    }

    if (typeof entry.source !== "string" || entry.source.length === 0) {
      addError(`${context}: source requerido.`);
    } else if (/ia|inteligencia artificial|estimad/i.test(entry.source)) {
      addError(`${context}: las horas deben provenir de un registro, no de una estimación de IA.`);
    }
  }

  for (const commitment of commitments) {
    const context = `Compromiso ${commitment.id}`;
    checkReference(commitment.projectId, projectIndex, "projectId", context);
    checkReference(commitment.ownerId, userIndex, "ownerId", context);
    checkEnum(commitment.scope, commitmentScopes, "scope", context);
    checkEnum(commitment.status, commitmentStatuses, "status", context);
    checkDate(commitment.committedAt, "committedAt", context);
    checkDate(commitment.dueDate, "dueDate", context);
    checkDate(commitment.completedAt, "completedAt", context, true);

    if (commitment.committedAt > commitment.dueDate) {
      addError(`${context}: committedAt no puede ser posterior a dueDate.`);
    }

    if (commitment.status === "Cumplido" && commitment.completedAt === null) {
      addError(`${context}: un compromiso cumplido requiere completedAt.`);
    }

    if (commitment.status !== "Cumplido" && commitment.completedAt !== null) {
      addError(`${context}: completedAt solo corresponde a un compromiso cumplido.`);
    }
  }

  const commitmentScopesPresent = new Set(commitments.map((item) => item.scope));
  if (!commitmentScopesPresent.has("project") || !commitmentScopesPresent.has("management")) {
    addError("commitments: deben existir compromisos de proyecto y gerenciales.");
  }

  for (const document of documents) {
    const context = `Documento ${document.id}`;
    checkReference(document.projectId, projectIndex, "projectId", context);
    checkReference(document.ownerId, userIndex, "ownerId", context);
    checkEnum(document.type, documentTypes, "type", context);
    checkEnum(document.status, documentStatuses, "status", context);
    checkDate(document.updatedAt, "updatedAt", context);

    if (typeof document.title !== "string" || document.title.length === 0) {
      addError(`${context}: title requerido.`);
    }

    if (typeof document.version !== "string" || document.version.length === 0) {
      addError(`${context}: version requerida.`);
    }
  }

  const referenceIndexes = {
    Riesgo: riskIndex,
    Documento: documentIndex,
    "Control de cambio": changeControlIndex,
    Compromiso: commitmentIndex,
  };

  for (const decision of decisions) {
    const context = `Decisión ${decision.id}`;
    checkReference(decision.projectId, projectIndex, "projectId", context);
    checkReference(decision.decidedById, userIndex, "decidedById", context);
    checkEnum(decision.status, decisionStatuses, "status", context);
    checkEnum(decision.referenceType, decisionReferenceTypes, "referenceType", context);
    checkDate(decision.decisionDate, "decisionDate", context);

    const referenceIndex = referenceIndexes[decision.referenceType];
    if (!referenceIndex) {
      addError(`${context}: referenceType sin índice de referencia.`);
    } else {
      checkReference(decision.referenceId, referenceIndex, "referenceId", context);
    }
  }

  for (const lesson of lessons) {
    const context = `Lección ${lesson.id}`;
    checkReference(lesson.projectId, projectIndex, "projectId", context);
    checkReference(lesson.ownerId, userIndex, "ownerId", context);
    checkDate(lesson.recordedAt, "recordedAt", context);

    for (const field of ["title", "context", "recommendation"]) {
      if (typeof lesson[field] !== "string" || lesson[field].length === 0) {
        addError(`${context}: ${field} requerido.`);
      }
    }
  }

  const scanForDerivedMetrics = (value, path) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => scanForDerivedMetrics(item, `${path}[${index}]`));
      return;
    }

    if (!isObject(value)) {
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      if (forbiddenMetricKeys.has(key)) {
        addError(`${path || "datos"}: la métrica derivada "${key}" no debe almacenarse en JSON.`);
      }
      scanForDerivedMetrics(child, path ? `${path}.${key}` : key);
    }
  };

  for (const [path, value] of Object.entries(dataset)) {
    scanForDerivedMetrics(value, path);
  }

  const atlas = projects.find((project) => project.name === "Implementación Atlas");
  if (!atlas) {
    addError("Atlas: no existe el proyecto Implementación Atlas.");
  } else {
    const atlasClient = clientIndex.get(atlas.clientId);
    const atlasManager = userIndex.get(atlas.managerId);

    if (atlasClient?.name !== "Grupo Prisma") {
      addError("Atlas: el cliente debe ser Grupo Prisma.");
    }

    if (atlasManager?.name !== "María Torres") {
      addError("Atlas: el gestor debe ser María Torres.");
    }

    if (atlas.plannedEndDate !== "2026-11-14") {
      addError("Atlas: la fecha de término debe ser 2026-11-14.");
    }

    const atlasRisks = risks.filter((risk) => risk.projectId === atlas.id);
    if (atlasRisks.length !== 3) {
      addError(
        `Atlas: Implementación Atlas debe tener exactamente 3 riesgos oficiales (encontrados ${atlasRisks.length}).`,
      );
    }

    const rsk041 = riskIndex.get("RSK-041");
    if (!rsk041) {
      addError("Atlas: falta el riesgo RSK-041.");
    } else {
      if (rsk041.projectId !== atlas.id) {
        addError("Atlas: RSK-041 debe pertenecer a Implementación Atlas.");
      }
      if (rsk041.probability !== 4 || rsk041.impact !== 3) {
        addError("Atlas: RSK-041 debe tener P4/I3.");
      }
      if (rsk041.type !== "Amenaza" || rsk041.status !== "Activo") {
        addError("Atlas: RSK-041 debe ser una amenaza activa.");
      }
      if (userIndex.get(rsk041.ownerId)?.name !== "María Torres") {
        addError("Atlas: RSK-041 debe estar asignado a María Torres.");
      }

      const latestReview = (reviewsByRisk.get("RSK-041") ?? []).at(-1);
      if (latestReview?.nextReviewAt !== "2026-10-19") {
        addError("Atlas: la revisión vigente de RSK-041 debe vencer el 2026-10-19.");
      }

      const initialReview = (reviewsByRisk.get("RSK-041") ?? [])[0];
      if (initialReview?.probability !== 4 || initialReview?.impact !== 4) {
        addError("Atlas: el historial inicial de RSK-041 debe registrar P4/I4.");
      }

      const rsk041Actions = actions.filter((action) => action.riskId === "RSK-041");
      if (rsk041Actions.length !== 3) {
        addError("Atlas: RSK-041 debe tener exactamente tres acciones.");
      }

      const actionStatusesForRisk = new Set(rsk041Actions.map((action) => action.status));
      if (actionStatusesForRisk.size !== 3) {
        addError("Atlas: las tres acciones de RSK-041 deben tener estados distintos.");
      }

      if (rsk041.contingencyPrepared !== true) {
        addError("Atlas: RSK-041 debe registrar una contingencia preparada.");
      }
    }

    const atlasSnapshots = progressHistory
      .filter((snapshot) => snapshot.projectId === atlas.id)
      .sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate));
    const expectedSnapshots = [
      ["2026-09-15", 0.2, 0.18],
      ["2026-09-22", 0.35, 0.3],
      ["2026-10-01", 0.48, 0.41],
      ["2026-10-11", 0.63, 0.54],
      ["2026-10-18", 0.78, 0.68],
    ];

    if (atlasSnapshots.length !== expectedSnapshots.length) {
      addError("Atlas: deben existir exactamente cinco cortes de avance.");
    } else {
      for (let index = 0; index < expectedSnapshots.length; index += 1) {
        const [date, planned, actual] = expectedSnapshots[index];
        const snapshot = atlasSnapshots[index];
        if (
          snapshot.snapshotDate !== date ||
          snapshot.plannedProgress !== planned ||
          snapshot.actualProgress !== actual
        ) {
          addError(`Atlas: el corte ${date} debe registrar ${planned * 100}% planificado y ${actual * 100}% real.`);
        }
      }
    }

    const latestAtlas = atlasSnapshots.at(-1);
    const atlasSpi = latestAtlas
      ? roundTwo(latestAtlas.actualProgress / latestAtlas.plannedProgress)
      : null;
    if (atlasSpi !== 0.87) {
      addError(`Atlas: el SPI derivado debe ser 0.87 (calculado ${String(atlasSpi)}).`);
    }
  }

  if (risks.length !== 8) {
    addError(`Riesgos: la vista global debe tener exactamente 8 riesgos oficiales (hay ${risks.length}).`);
  }

  const transversalRisks = risks.filter((risk) => risk.scopeType === "Transversal");
  if (transversalRisks.length !== 2) {
    addError(`Riesgos: debe haber exactamente 2 riesgos transversales (hay ${transversalRisks.length}).`);
  }

  if (!transversalRisks.every((risk) => risk.projectId === null)) {
    addError("Riesgos: los riesgos transversales no deben tener projectId.");
  }

  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending");
  if (pendingSuggestions.length !== 2) {
    addError(`Sugerencias: debe haber exactamente 2 pendientes (hay ${pendingSuggestions.length}).`);
  }

  const sug014 = suggestions.find((suggestion) => suggestion.id === "SUG-014");
  if (!sug014) {
    addError("Sugerencias: falta SUG-014.");
  } else {
    if (sug014.status !== "pending") {
      addError("Sugerencias: SUG-014 debe estar pendiente.");
    }
    if (sug014.title !== "Posible retraso por validación de alcance") {
      addError("Sugerencias: SUG-014 debe mantener el título diseñado.");
    }
    if (sug014.projectId !== "PRJ-001") {
      addError("Sugerencias: SUG-014 debe estar asociada a Implementación Atlas.");
    }
    if (!Array.isArray(sug014.evidenceIds) || sug014.evidenceIds.length !== 2) {
      addError("Sugerencias: SUG-014 debe referenciar dos evidencias simuladas.");
    }
  }

  const projectsBelowSpi = projects.filter((project) => {
    const latest = latestProgressByProject.get(project.id);
    if (!latest || latest.plannedProgress <= 0) {
      return false;
    }
    return latest.actualProgress / latest.plannedProgress < 0.8;
  });
  if (projectsBelowSpi.length !== 2) {
    addError(`Portafolio: debe haber exactamente 2 proyectos con SPI inferior a 0.80 (hay ${projectsBelowSpi.length}).`);
  }

  const distinctProjectStatuses = new Set(statuses.map((status) => status.status));
  if (distinctProjectStatuses.size < 2) {
    addError("Proyectos: debe existir más de un estado vigente.");
  }

  const latestReviewByRisk = new Map();
  for (const review of reviews) {
    const current = latestReviewByRisk.get(review.riskId);
    if (!current || review.reviewedAt > current.reviewedAt) {
      latestReviewByRisk.set(review.riskId, review);
    }
  }

  const overdueReviews = reviews.filter((review) => {
    if (review.nextReviewAt === null || review.nextReviewAt >= asOfDate) {
      return false;
    }

    const risk = riskIndex.get(review.riskId);
    if (!risk || risk.status === "Cerrado" || risk.status === "Cerrada") {
      return false;
    }

    return latestReviewByRisk.get(review.riskId)?.id === review.id;
  });

  if (overdueReviews.length !== 3) {
    addError(`Riesgos: debe haber exactamente 3 revisiones vencidas a la fecha fija (hay ${overdueReviews.length}).`);
  }

  if (!overdueReviews.some((review) => review.riskId === "RSK-041")) {
    addError("Riesgos: RSK-041 debe figurar entre las revisiones vencidas.");
  }

  const materializedRisks = risks.filter((risk) => risk.status === "Materializado");
  if (materializedRisks.length === 0) {
    addError("Riesgos: debe existir al menos una situación materializada.");
  }

  for (const risk of materializedRisks) {
    const hasMaterializationEvent = riskEvents.some(
      (event) => event.riskId === risk.id && event.eventType === "Materialización",
    );
    if (!hasMaterializationEvent) {
      addError(`Riesgo ${risk.id}: el estado materializado requiere un evento de materialización.`);
    }
  }

  const rsk078Events = riskEvents.filter((event) => event.riskId === "RSK-078");
  if (
    !rsk078Events.some((event) => event.eventType === "Materialización") ||
    !rsk078Events.some((event) => event.eventType === "Contingencia activada")
  ) {
    addError("Riesgo RSK-078: materialización y activación de contingencia deben ser eventos separados.");
  }

  return errors;
}

function validateFiles(files) {
  const errors = [];

  for (const file of Object.keys(files)) {
    if (forbiddenFiles.has(file.split("/").pop())) {
      errors.push(`${file}: no se permiten archivos de métricas derivadas.`);
    }
  }

  for (const [key, relativePath] of Object.entries(expectedFiles)) {
    if (!(relativePath in files)) {
      errors.push(`${relativePath}: falta el archivo esperado para "${key}".`);
    }
  }

  return errors;
}

function hasError(errors, fragment) {
  return errors.some((error) => error.includes(fragment));
}

function runSelfTests(dataset) {
  const cases = [];
  const clone = () => structuredClone(dataset);

  {
    const mutated = clone();
    mutated.risks[0].ownerId = "USR-999";
    const errors = validateDataset(mutated);
    cases.push({
      name: "ID huérfano",
      detected: hasError(errors, "ownerId referencia un ID inexistente"),
    });
  }

  {
    const mutated = clone();
    mutated.risks[0].probability = 6;
    const errors = validateDataset(mutated);
    cases.push({
      name: "P fuera de rango",
      detected: hasError(errors, "probabilidad"),
    });
  }

  {
    const mutated = clone();
    mutated.risks = mutated.risks.filter((risk) => risk.id !== "RSK-079");
    const errors = validateDataset(mutated);
    cases.push({
      name: "Conteo de Atlas inconsistente",
      detected: hasError(errors, "debe tener exactamente 3 riesgos oficiales"),
    });
  }

  for (const [name, mutate, fragment] of [['LOB huérfano', d => { d.projects[0].lobId = 'inexistente'; }, 'LOB/servicio'], ['Real futuro', d => { d.billingMilestones[0].actualDate = '2026-12-01'; }, 'real futuro'], ['Emisión sin respaldo', d => { d.billingMilestones[0].invoiceReference = null; }, 'emisión sin respaldo'], ['Categoría inválida', d => { d.risks[0].categoryId = 'inexistente'; }, 'categoría inválida']]) { const d = clone(); mutate(d); cases.push({ name, detected: hasError(validateEnrichment(d), fragment) }); }
  return cases;
}

const { files, parseErrors } = loadJsonFiles(dataDirectory);
const errors = [...parseErrors, ...validateFiles(files)];

if (parseErrors.length === 0) {
  const dataset = buildDataset(files);
  errors.push(...validateDataset(dataset), ...validateEnrichment(dataset));

  const selfTestCases = runSelfTests(dataset);
  const failedSelfTests = selfTestCases.filter((testCase) => !testCase.detected);
  for (const testCase of failedSelfTests) {
    errors.push(`Autotest: no se detectó el caso "${testCase.name}".`);
  }

  if (failedSelfTests.length === 0) {
    console.log(`Autotest de validación: ${selfTestCases.length}/${selfTestCases.length} casos detectados.`);
  }
}

if (errors.length > 0) {
  console.error(`Validación de datos de demostración: ${errors.length} error(es).`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  const counts = Object.entries(buildDataset(files))
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => `${key}=${value.length}`)
    .join(", ");
  console.log(`Validación de datos de demostración: OK (${Object.keys(files).length} archivos JSON).`);
  console.log(counts);
}
