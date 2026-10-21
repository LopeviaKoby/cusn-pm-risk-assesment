import catalogs from "./core/catalogs.json";
import billingMilestones from "./operations/billing-milestones.json";
import changeControls from "./operations/change-controls.json";
import commitments from "./operations/commitments.json";
import planChangeRequests from "./operations/plan-change-requests.json";
import purchases from "./operations/purchases.json";
import timeEntries from "./operations/time-entries.json";
import clients from "./core/clients.json";
import milestones from "./core/milestones.json";
import projectProgressHistory from "./core/project-progress-history.json";
import projectStatus from "./core/project-status.json";
import projects from "./core/projects.json";
import users from "./core/users.json";
import demoConfig from "./demo-config.json";
import evidence from "./risks/evidence.json";
import riskActions from "./risks/risk-actions.json";
import riskEvents from "./risks/risk-events.json";
import riskReviews from "./risks/risk-reviews.json";
import riskSuggestions from "./risks/risk-suggestions.json";
import risks from "./risks/risks.json";
import projectDecisions from "./supporting/project-decisions.json";
import projectDocuments from "./supporting/project-documents.json";
import lessonsLearned from "./supporting/lessons-learned.json";

type Project = (typeof projects)[number];
type Risk = (typeof risks)[number];
type RiskReview = (typeof riskReviews)[number];
type ProgressSnapshot = (typeof projectProgressHistory)[number];
type Suggestion = (typeof riskSuggestions)[number];
type Evidence = (typeof evidence)[number];

export const asOfDate = demoConfig.asOfDate;

export {
  catalogs,
  billingMilestones,
  changeControls,
  clients,
  commitments,
  demoConfig,
  evidence,
  lessonsLearned,
  milestones,
  planChangeRequests,
  projectDecisions,
  projectDocuments,
  projectProgressHistory,
  projectStatus,
  projects,
  purchases,
  riskActions,
  riskEvents,
  riskReviews,
  riskSuggestions,
  risks,
  timeEntries,
  users,
};

export const demoData = {
  catalogs,
  billingMilestones,
  changeControls,
  clients,
  commitments,
  demoConfig,
  evidence,
  lessonsLearned,
  milestones,
  planChangeRequests,
  projectDecisions,
  projectDocuments,
  projectProgressHistory,
  projectStatus,
  projects,
  purchases,
  riskActions,
  riskEvents,
  riskReviews,
  riskSuggestions,
  risks,
  timeEntries,
  users,
};

export function getUser(userId: string) {
  return users.find((user) => user.id === userId);
}

export function getClient(clientId: string) {
  return clients.find((client) => client.id === clientId);
}

export function getProject(projectId: string): Project | undefined {
  return projects.find((project) => project.id === projectId);
}

export function getProjectStatus(projectId: string) {
  return projectStatus.find((status) => status.projectId === projectId);
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
    .filter((snapshot) => snapshot.projectId === projectId)
    .sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate))
    .map((snapshot) => ({ ...snapshot, spi: calculateSpi(snapshot) }));
}

export function getRisk(riskId: string): Risk | undefined {
  return risks.find((risk) => risk.id === riskId);
}

export function getRiskExposure(risk: Pick<Risk, "probability" | "impact">): number {
  return risk.probability * risk.impact;
}

export function isRiskClosed(risk: Pick<Risk, "status">): boolean {
  return risk.status === "Cerrado" || risk.status === "Cerrada";
}

export function getOpenRisks(): Risk[] {
  return risks.filter((risk) => !isRiskClosed(risk));
}

export function getTransversalRisks(): Risk[] {
  return risks.filter((risk) => risk.scopeType === "Transversal");
}

export function getOpenRisksForProject(projectId: string): Risk[] {
  return getOpenRisks().filter((risk) => risk.projectId === projectId);
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
  const suggestion = riskSuggestions.find((item) => item.id === suggestionId);

  if (!suggestion) {
    return [];
  }

  const linkedEvidence: Evidence[] = [];

  for (const evidenceId of suggestion.evidenceIds) {
    const item = evidence.find((entry) => entry.id === evidenceId);

    if (item) {
      linkedEvidence.push(item);
    }
  }

  return linkedEvidence;
}

export function getPendingSuggestions(): Suggestion[] {
  return riskSuggestions.filter((suggestion) => suggestion.status === "pending");
}

export function getProjectMetrics(projectId: string) {
  const progress = getLatestProgress(projectId);
  const overdueReviewCount = getOverdueRiskReviews().filter((review) => {
    return getRisk(review.riskId)?.projectId === projectId;
  }).length;

  return {
    project: getProject(projectId),
    status: getProjectStatus(projectId),
    plannedProgress: progress?.plannedProgress ?? null,
    actualProgress: progress?.actualProgress ?? null,
    spi: calculateSpi(progress),
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
    .map((project) => calculateSpi(getLatestProgress(project.id)))
    .filter((spi): spi is number => spi !== null);

  return {
    projectCount: projects.length,
    statusCounts,
    projectsBelowSpi: spiValues.filter((spi) => spi < 0.8).length,
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
