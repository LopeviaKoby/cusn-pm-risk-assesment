import { api } from "./client";
import type { Project, Risk } from "./contracts";
import type { EditPatch } from "@/components/organisms/table-tools";

const has = (patch: EditPatch, key: string) => Object.prototype.hasOwnProperty.call(patch, key);
export async function persistProjectEdit(row: Project, patch: EditPatch): Promise<void> {
  const body: Record<string, unknown> = {};
  if (has(patch, "name")) body.nombre = patch.name;
  if (has(patch, "status")) body.estado = patch.status;
  if (has(patch, "plannedProgress")) body.avancePlanificadoPct = patch.plannedProgress;
  if (has(patch, "actualProgress")) body.avanceRealPct = patch.actualProgress;
  if (has(patch, "situationNote")) body.actividades = patch.situationNote;
  if (has(patch, "nextSteps")) body.proximosPasos = patch.nextSteps;
  if (!Object.keys(body).length) return;
  if (has(patch,"plannedProgress") || has(patch,"actualProgress") || has(patch,"situationNote") || has(patch,"nextSteps")) {
    const planned = has(patch,"plannedProgress") ? patch.plannedProgress : row.avancePlanificadoPct;
    const actual = has(patch,"actualProgress") ? patch.actualProgress : row.avanceRealPct;
    if (planned == null || actual == null) throw new Error("El seguimiento requiere ambos porcentajes registrados.");
    body.avancePlanificadoPct = planned;
    body.avanceRealPct = actual;
  }
  await api<Project>(`/api/v1/proyectos/${encodeURIComponent(row.id)}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function persistRiskEdit(row: Risk, patch: EditPatch): Promise<void> {
  const body: Record<string, unknown> = {};
  if (has(patch,"title")) body.nombre = patch.title;
  if (has(patch,"category")) body.categoria = patch.category;
  if (has(patch,"probability") || has(patch,"impact")) {
    const probability = has(patch,"probability") ? patch.probability : row.probabilidad;
    const impact = has(patch,"impact") ? patch.impact : row.impacto;
    if (probability == null || impact == null) throw new Error("Registra probabilidad e impacto juntos para crear una evaluación.");
    body.probabilidad = probability;
    body.impacto = impact;
  }
  if (!Object.keys(body).length) return;
  const path = row.proyectoId
    ? `/api/v1/proyectos/${encodeURIComponent(row.proyectoId)}/riesgos/${encodeURIComponent(row.id)}`
    : row.entidad === "RIESGO_GLOBAL"
      ? `/api/v1/riesgos/globales/${encodeURIComponent(row.id)}`
      : `/api/v1/riesgos/transversales/${encodeURIComponent(row.id)}`;
  await api<Risk>(path, { method: "PATCH", body: JSON.stringify(body) });
}
