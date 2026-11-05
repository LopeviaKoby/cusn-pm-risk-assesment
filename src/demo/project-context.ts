import { getProgressSeries, milestones, riskActions, getRiskExposure, projectEvents } from "./data";
import { officialRiskRows, projectRows, suggestionRows } from "./view-models";
import { sessionEvents, sessionReviews, type DemoSession } from "./session";

function fallbackSeries(project: ReturnType<typeof projectRows>[number]): ReturnType<typeof getProgressSeries> {
  const points: ReturnType<typeof getProgressSeries> = [];
  const start = project.startDate;
  const current = project.updatedAt ? project.updatedAt.slice(0, 10) : null;
  if (start) {
    points.push({
      id: `PPH-DERIVED-START-${project.id}`,
      projectId: project.id,
      snapshotDate: start,
      plannedProgress: 0,
      actualProgress: 0,
      reportedById: project.managerId,
      note: "Inicio del proyecto",
      spi: null,
    });
  }
  if (current && current !== start && (project.plannedProgress !== null || project.actualProgress !== null)) {
    const planned = project.plannedProgress ?? 0;
    const actual = project.actualProgress ?? 0;
    points.push({
      id: `PPH-DERIVED-CURRENT-${project.id}`,
      projectId: project.id,
      snapshotDate: current,
      plannedProgress: planned,
      actualProgress: actual,
      reportedById: project.managerId,
      note: "Último seguimiento registrado",
      spi: planned > 0 ? Math.round((actual / planned) * 100) / 100 : null,
    });
  }
  return points;
}

export function getProjectContext(projectId: string, session: DemoSession) {
  const project = projectRows(session).find(row => row.id === projectId);
  if (!project) return;
  const history = getProgressSeries(projectId);
  const series = history.length ? history : fallbackSeries(project);
  const projectMilestones = milestones.filter(item => item.projectId === projectId).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const projectRisks = officialRiskRows(session).filter(risk => risk.projectId === projectId);
  return { project, series, latest: series.at(-1), risks: projectRisks,
    nextSteps: project.nextSteps,
    events: projectEvents.filter(event => event.projectId === projectId).sort((left, right) => right.registradoAt.localeCompare(left.registradoAt)),
    pendingSuggestions: suggestionRows(session).filter(item => item.projectId === projectId && item.status === "pending"),
    milestones: projectMilestones, nextMilestones: projectMilestones.filter(item => item.status !== "Completado" && item.status !== "Cancelado"),
    difference: project.actualProgress === null || project.plannedProgress === null ? null : Math.round((project.actualProgress - project.plannedProgress) * 10000) / 100,
  };
}
export type ProjectContext = NonNullable<ReturnType<typeof getProjectContext>>;
export function getRiskContext(projectId: string | null, riskId: string, session: DemoSession) {
  const risk = officialRiskRows(session).find(item => item.id === riskId && item.projectId === projectId);
  if (!risk) return;
  const reviews = sessionReviews(riskId, session);
  const initialScore = reviews[0] ? getRiskExposure(reviews[0]) : risk.exposure;
  const events = sessionEvents(session).filter(event => event.riskId === riskId).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return { risk, reviews, initialScore, difference: risk.exposure - initialScore, events,
    actions: riskActions.filter(action => action.riskId === riskId),
    preparation: events.find(event => event.eventType === "Preparación de contingencia"),
    activation: events.find(event => event.eventType === "Contingencia activada"),
  };
}
