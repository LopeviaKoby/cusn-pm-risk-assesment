import { api } from "./client";
import type { EditPatch } from "@/components/organisms/table-tools";
import type { ProjectRow, RiskRow } from "@/demo/view-models";

const has = (patch: EditPatch, key: string) => Object.prototype.hasOwnProperty.call(patch, key);

export async function persistProjectEdit(row: ProjectRow, patch: EditPatch): Promise<void> {
  const body: Record<string, unknown> = {};
  if (has(patch, "name")) body.nombre = patch.name;
  if (has(patch, "status")) body.estado = patch.status;
  if (has(patch, "plannedProgress")) body.avancePlanificadoPct = patch.plannedProgress === null ? null : Number(patch.plannedProgress) * 100;
  if (has(patch, "actualProgress")) body.avanceRealPct = patch.actualProgress === null ? null : Number(patch.actualProgress) * 100;
  if (has(patch, "plannedEndDate")) body.fechaTerminoProyecto = patch.plannedEndDate || null;
  if (has(patch, "situationNote")) body.actividades = patch.situationNote;
  if (has(patch, "nextSteps")) body.proximosPasos = patch.nextSteps;
  if (!Object.keys(body).length) return;
  await api(`/api/v1/proyectos/${encodeURIComponent(row.id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function persistRiskEdit(row: RiskRow, patch: EditPatch): Promise<void> {
  const body: Record<string, unknown> = {};
  if (has(patch, "title")) body.nombre = patch.title;
  if (has(patch, "status")) body.estado = patch.status;
  if (has(patch, "category")) body.categoria = patch.category;
  if (has(patch, "probability")) body.probabilidad = patch.probability;
  if (has(patch, "impact")) body.impacto = patch.impact;
  if (has(patch, "strategy")) body.estrategia = patch.strategy;
  if (has(patch, "responsePlan")) body.planMitigacion = patch.responsePlan;
  if (has(patch, "contingency")) body.planContingencia = patch.contingency;
  if (has(patch, "ownerName")) body.responsableNombre = patch.ownerName;
  if (!Object.keys(body).length) return;
  const path = row.projectId
    ? `/api/v1/proyectos/${encodeURIComponent(row.projectId)}/riesgos/${encodeURIComponent(row.id)}`
    : `/api/v1/riesgos/globales/${encodeURIComponent(row.id)}`;
  await api(path, { method: "PATCH", body: JSON.stringify(body) });
}
