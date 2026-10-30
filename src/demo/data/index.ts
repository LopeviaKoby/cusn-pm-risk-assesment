import demoCatalogs from "./core/catalogs.json";
import demoBillingMilestones from "./operations/billing-milestones.json";
import demoChangeControls from "./operations/change-controls.json";
import demoCommitments from "./operations/commitments.json";
import demoPlanChangeRequests from "./operations/plan-change-requests.json";
import demoPurchases from "./operations/purchases.json";
import demoTimeEntries from "./operations/time-entries.json";
import demoClients from "./core/clients.json";
import demoMilestones from "./core/milestones.json";
import demoProjectProgressHistory from "./core/project-progress-history.json";
import demoProjectStatus from "./core/project-status.json";
import demoProjects from "./core/projects.json";
import demoUsers from "./core/users.json";
import demoConfig from "./demo-config.json";
import demoEvidence from "./risks/evidence.json";
import demoRiskActions from "./risks/risk-actions.json";
import demoRiskEvents from "./risks/risk-events.json";
import demoRiskReviews from "./risks/risk-reviews.json";
import demoRiskSuggestions from "./risks/risk-suggestions.json";
import demoRisks from "./risks/risks.json";
import demoProjectDecisions from "./supporting/project-decisions.json";
import demoProjectDocuments from "./supporting/project-documents.json";
import demoLessonsLearned from "./supporting/lessons-learned.json";

export type Project = (typeof demoProjects)[number];
export type Risk = (typeof demoRisks)[number];
export type RiskReview = (typeof demoRiskReviews)[number];
export type ProgressSnapshot = (typeof demoProjectProgressHistory)[number];
export type Suggestion = (typeof demoRiskSuggestions)[number];
export type Evidence = (typeof demoEvidence)[number];
export type Client = (typeof demoClients)[number];
export type User = (typeof demoUsers)[number];
export type BillingMilestone = (typeof demoBillingMilestones)[number];
export type Purchase = (typeof demoPurchases)[number];
export type PlanChangeRequest = (typeof demoPlanChangeRequests)[number];
export type Milestone = (typeof demoMilestones)[number];
export type ProjectStatus = (typeof demoProjectStatus)[number] & { nextSteps?: string | null; plannedProgress?: number | null; actualProgress?: number | null; spi?: number | null };
export type ProjectEvent = { id: string; projectId: string; tipo: string; registradoAt: string; contenido: unknown; usuario: string | null };
export type ProjectDocument = (typeof demoProjectDocuments)[number];
export type ProjectDecision = (typeof demoProjectDecisions)[number];
export type Lesson = (typeof demoLessonsLearned)[number];
export type Commitment = (typeof demoCommitments)[number];
export type TimeEntry = (typeof demoTimeEntries)[number];
export type ChangeControl = (typeof demoChangeControls)[number];

export let asOfDate = demoConfig.asOfDate;
export let catalogs = demoCatalogs;
export let billingMilestones = demoBillingMilestones;
export let changeControls = demoChangeControls;
export let clients = demoClients;
export let commitments = demoCommitments;
export let evidence = demoEvidence;
export let lessonsLearned = demoLessonsLearned;
export let milestones = demoMilestones;
export let planChangeRequests = demoPlanChangeRequests;
export let projectDecisions = demoProjectDecisions;
export let projectDocuments = demoProjectDocuments;
export let projectProgressHistory = demoProjectProgressHistory;
export let projectStatus: ProjectStatus[] = demoProjectStatus;
export let projectEvents: ProjectEvent[] = [];
export let projects = demoProjects;
export let purchases = demoPurchases;
export let riskActions = demoRiskActions;
export let riskEvents = demoRiskEvents;
export let riskReviews = demoRiskReviews;
export let riskSuggestions = demoRiskSuggestions;
export let risks = demoRisks;
export let timeEntries = demoTimeEntries;
export let users = demoUsers;

export type DemoData = {
  asOfDate: string;
  catalogs: typeof demoCatalogs;
  billingMilestones: typeof demoBillingMilestones;
  changeControls: typeof demoChangeControls;
  clients: typeof demoClients;
  commitments: typeof demoCommitments;
  evidence: typeof demoEvidence;
  lessonsLearned: typeof demoLessonsLearned;
  milestones: typeof demoMilestones;
  planChangeRequests: typeof demoPlanChangeRequests;
  projectDecisions: typeof demoProjectDecisions;
  projectDocuments: typeof demoProjectDocuments;
  projectProgressHistory: typeof demoProjectProgressHistory;
  projectStatus: typeof demoProjectStatus;
  projectEvents: ProjectEvent[];
  projects: typeof demoProjects;
  purchases: typeof demoPurchases;
  riskActions: typeof demoRiskActions;
  riskEvents: typeof demoRiskEvents;
  riskReviews: typeof demoRiskReviews;
  riskSuggestions: typeof demoRiskSuggestions;
  risks: typeof demoRisks;
  timeEntries: typeof demoTimeEntries;
  users: typeof demoUsers;
};

export function installData(next: Partial<DemoData>) {
  if (next.asOfDate !== undefined) asOfDate = next.asOfDate;
  if (next.catalogs !== undefined) catalogs = next.catalogs;
  if (next.billingMilestones !== undefined) billingMilestones = next.billingMilestones;
  if (next.changeControls !== undefined) changeControls = next.changeControls;
  if (next.clients !== undefined) clients = next.clients;
  if (next.commitments !== undefined) commitments = next.commitments;
  if (next.evidence !== undefined) evidence = next.evidence;
  if (next.lessonsLearned !== undefined) lessonsLearned = next.lessonsLearned;
  if (next.milestones !== undefined) milestones = next.milestones;
  if (next.planChangeRequests !== undefined) planChangeRequests = next.planChangeRequests;
  if (next.projectDecisions !== undefined) projectDecisions = next.projectDecisions;
  if (next.projectDocuments !== undefined) projectDocuments = next.projectDocuments;
  if (next.projectProgressHistory !== undefined) projectProgressHistory = next.projectProgressHistory;
  if (next.projectStatus !== undefined) projectStatus = next.projectStatus;
  if (next.projectEvents !== undefined) projectEvents = next.projectEvents;
  if (next.projects !== undefined) projects = next.projects;
  if (next.purchases !== undefined) purchases = next.purchases;
  if (next.riskActions !== undefined) riskActions = next.riskActions;
  if (next.riskEvents !== undefined) riskEvents = next.riskEvents;
  if (next.riskReviews !== undefined) riskReviews = next.riskReviews;
  if (next.riskSuggestions !== undefined) riskSuggestions = next.riskSuggestions;
  if (next.risks !== undefined) risks = next.risks;
  if (next.timeEntries !== undefined) timeEntries = next.timeEntries;
  if (next.users !== undefined) users = next.users;
}

export function getUser(userId: string) {
  return users.find(user => user.id === userId);
}

export function getClient(clientId: string) {
  return clients.find(client => client.id === clientId);
}

export function getProject(projectId: string): Project | undefined {
  return projects.find(project => project.id === projectId);
}

export function getProjectStatus(projectId: string) {
  return projectStatus.find(status => status.projectId === projectId);
}

export function getLatestProgress(projectId: string): ProgressSnapshot | undefined {
  let latest: ProgressSnapshot | undefined;

  for (const snapshot of projectProgressHistory) {
    if (snapshot.projectId !== projectId) {
      continue;
    }

    if (!latest || snapshot.snapshotDate > latest.snapshotDate) {
      latest = snapshot;
    }
  }

  return latest;
}

export function calculateSpi(
  snapshot: Pick<ProgressSnapshot, "plannedProgress" | "actualProgress"> | null | undefined,
): number | null {
  if (!snapshot || snapshot.plannedProgress <= 0) {
    return null;
  }

  return Math.round((snapshot.actualProgress / snapshot.plannedProgress) * 100) / 100;
}

export function getProgressSeries(projectId: string) {
  return projectProgressHistory
    .filter(snapshot => snapshot.projectId === projectId)
    .sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate))
    .map(snapshot => ({ ...snapshot, spi: calculateSpi(snapshot) }));
}

export function getRisk(riskId: string): Risk | undefined {
  return risks.find(risk => risk.id === riskId);
}

export function getRiskExposure(risk: Pick<Risk, "probability" | "impact">): number {
  return risk.probability * risk.impact;
}

export function isRiskClosed(risk: Pick<Risk, "status">): boolean {
  return risk.status === "Cerrado" || risk.status === "Cerrada";
}

export function getOpenRisks(): Risk[] {
  return risks.filter(risk => !isRiskClosed(risk));
}

export function getTransversalRisks(): Risk[] {
  return risks.filter(risk => risk.scopeType === "Transversal");
}

export function getOpenRisksForProject(projectId: string): Risk[] {
  return getOpenRisks().filter(risk => risk.projectId === projectId);
}

export function getLatestReview(riskId: string): RiskReview | undefined {
  let latest: RiskReview | undefined;

  for (const review of riskReviews) {
    if (review.riskId !== riskId) {
      continue;
    }

    if (!latest || review.reviewedAt > latest.reviewedAt) {
      latest = review;
    }
  }

  return latest;
}

export function isReviewOverdue(review: RiskReview, referenceDate = asOfDate): boolean {
  return review.nextReviewAt !== null && review.nextReviewAt < referenceDate;
}

export function getOverdueRiskReviews(referenceDate = asOfDate): RiskReview[] {
  const overdue: RiskReview[] = [];

  for (const risk of getOpenRisks()) {
    const review = getLatestReview(risk.id);

    if (review && isReviewOverdue(review, referenceDate)) {
      overdue.push(review);
    }
  }

  return overdue;
}

export function getSuggestionEvidence(suggestionId: string): Evidence[] {
  const suggestion = riskSuggestions.find(item => item.id === suggestionId);

  if (!suggestion) {
    return [];
  }

  const linkedEvidence: Evidence[] = [];

  for (const evidenceId of suggestion.evidenceIds) {
    const item = evidence.find(entry => entry.id === evidenceId);

    if (item) {
      linkedEvidence.push(item);
    }
  }

  return linkedEvidence;
}

export function getPendingSuggestions(): Suggestion[] {
  return riskSuggestions.filter(suggestion => suggestion.status === "pending");
}

export function getProjectMetrics(projectId: string) {
  const progress = getLatestProgress(projectId);
  const status = getProjectStatus(projectId);
  const overdueReviewCount = getOverdueRiskReviews().filter(review => {
    return getRisk(review.riskId)?.projectId === projectId;
  }).length;

  return {
    project: getProject(projectId),
    status,
    plannedProgress: progress?.plannedProgress ?? status?.plannedProgress ?? null,
    actualProgress: progress?.actualProgress ?? status?.actualProgress ?? null,
    spi: calculateSpi(progress) ?? status?.spi ?? null,
    openRiskCount: getOpenRisksForProject(projectId).length,
    overdueReviewCount,
  };
}

export function getPortfolioSummary(referenceDate = asOfDate) {
  const statusCounts: Record<string, number> = {};

  for (const project of projects) {
    const status = getProjectStatus(project.id)?.status ?? "Sin estado";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const spiValues = projects
    .map(project => calculateSpi(getLatestProgress(project.id)))
    .filter((spi): spi is number => spi !== null);

  return {
    projectCount: projects.length,
    statusCounts,
    projectsBelowSpi: spiValues.filter(spi => spi < 0.8).length,
    overdueReviewCount: getOverdueRiskReviews(referenceDate).length,
  };
}

export function getBillingTotalsByCurrency(projectId?: string) {
  const totals = new Map<
    string,
    {
      currency: string;
      showPricingAmount: number;
      plannedAmount: number;
      actualAmount: number | null;
    }
  >();

  for (const milestone of billingMilestones) {
    if (projectId && milestone.projectId !== projectId) {
      continue;
    }

    const current = totals.get(milestone.currency) ?? {
      currency: milestone.currency,
      showPricingAmount: 0,
      plannedAmount: 0,
      actualAmount: null,
    };

    current.showPricingAmount += milestone.showPricingAmount;
    current.plannedAmount += milestone.plannedAmount;
    if (milestone.actualAmount !== null) current.actualAmount = (current.actualAmount ?? 0) + milestone.actualAmount;
    totals.set(milestone.currency, current);
  }

  return [...totals.values()].sort((left, right) => left.currency.localeCompare(right.currency));
}
