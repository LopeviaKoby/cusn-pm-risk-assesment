import { ApiError } from "../errors";
import { sql } from "../db";
import type { SQL } from "bun";
import { config } from "../config";
import { getGlobalRisk, getProject, getProjectRisk } from "./read";

const editTimestamp = `${config.asOfDate}T12:00:00Z`;

type Row = Record<string, unknown>;
type Patch = Record<string, unknown>;

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const text = (value: unknown): string | null => value === null || value === undefined ? null : String(value).trim();
const number = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const date = (value: unknown): string | null => {
  const raw = text(value);
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new ApiError(422, "INVALID_DATE", "La fecha debe tener formato AAAA-MM-DD.");
  return raw;
};
const requiredText = (value: unknown, field: string): string => {
  const raw = text(value);
  if (!raw) throw new ApiError(422, "INVALID_FIELD", `El campo ${field} es obligatorio.`);
  if (raw.length > 5000) throw new ApiError(422, "INVALID_FIELD", `El campo ${field} es demasiado largo.`);
  return raw;
};
const optionalText = (value: unknown, field: string): string | null => {
  const raw = text(value);
  if (raw && raw.length > 5000) throw new ApiError(422, "INVALID_FIELD", `El campo ${field} es demasiado largo.`);
  return raw || null;
};
const percentage = (value: unknown, field: string): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = number(value);
  if (parsed === null || parsed < 0 || parsed > 100) throw new ApiError(422, "INVALID_NUMBER", `${field} debe estar entre 0 y 100.`);
  return parsed;
};
const scale = (value: unknown, field: string): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = number(value);
  if (parsed === null || !Number.isInteger(parsed) || parsed < 1 || parsed > 5) throw new ApiError(422, "INVALID_NUMBER", `${field} debe ser un entero entre 1 y 5.`);
  return parsed;
};
const ensureFields = (patch: Patch, allowed: string[]) => {
  for (const key of Object.keys(patch)) {
    if (!allowed.includes(key)) throw new ApiError(400, "UNKNOWN_FIELD", `Campo no permitido: ${key}`);
  }
};

async function resolveProject(idOrTvt: string): Promise<{ id: string }> {
  const rows = await sql<{ id: string }>`SELECT id::text AS id FROM pmo.proyecto WHERE id::text = ${idOrTvt} OR tvt = ${idOrTvt}`;
  const project = rows[0];
  if (!project) throw new ApiError(404, "NOT_FOUND", "Proyecto no encontrado.");
  return project;
}

async function resolveState(tx: SQL, name: string): Promise<string> {
  const rows = await tx<{ id: string; nombre: string }>`SELECT id::text AS id, nombre FROM pmo.estado_proyecto`;
  const found = rows.find(row => normalize(row.nombre) === normalize(name));
  if (!found) throw new ApiError(422, "INVALID_STATUS", "El estado indicado no existe en el catálogo.");
  return found.id;
}

export async function updateProject(idOrTvt: string, patch: Patch, actor: string) {
  ensureFields(patch, ["nombre", "estado", "avancePlanificadoPct", "avanceRealPct", "fechaTerminoProyecto", "actividades", "proximosPasos"]);
  const project = await resolveProject(idOrTvt);
  const projectSets: string[] = [];
  const projectParams: unknown[] = [];
  if ("nombre" in patch) {
    projectSets.push(`nombre = $${projectParams.length + 1}`);
    projectParams.push(requiredText(patch.nombre, "nombre"));
  }

  await sql.begin(async tx => {
    if (projectSets.length) {
      await tx.unsafe(
        `UPDATE pmo.proyecto SET ${projectSets.join(", ")}, actualizado_at = $${projectParams.length + 1}, actualizado_por = $${projectParams.length + 2} WHERE id = $${projectParams.length + 3}`,
        [...projectParams, editTimestamp, actor, project.id],
      );
    }

    const currentRows = await tx<Row>`
      SELECT proyecto_id::text AS proyecto_id, estado_proyecto_id::text AS estado_proyecto_id,
             avance_planificado_pct, avance_real_pct
      FROM pmo.proyecto_estado_actual WHERE proyecto_id = ${project.id}
    `;
    const current = currentRows[0];
    const stateSets: string[] = [];
    const stateParams: unknown[] = [];
    const set = (column: string, value: unknown) => {
      stateSets.push(`${column} = $${stateParams.length + 1}`);
      stateParams.push(value);
    };

    if ("estado" in patch) {
      const estado = requiredText(patch.estado, "estado");
      set("estado_proyecto_id", await resolveState(tx, estado));
    }
    if ("avancePlanificadoPct" in patch) set("avance_planificado_pct", percentage(patch.avancePlanificadoPct, "avancePlanificadoPct"));
    if ("avanceRealPct" in patch) set("avance_real_pct", percentage(patch.avanceRealPct, "avanceRealPct"));
    if ("fechaTerminoProyecto" in patch) set("fecha_termino_proyecto", date(patch.fechaTerminoProyecto));
    if ("actividades" in patch) set("actividades", optionalText(patch.actividades, "actividades"));
    if ("proximosPasos" in patch) set("proximos_pasos", optionalText(patch.proximosPasos, "proximosPasos"));

    const planned = "avancePlanificadoPct" in patch ? percentage(patch.avancePlanificadoPct, "avancePlanificadoPct") : number(current?.avance_planificado_pct);
    const actual = "avanceRealPct" in patch ? percentage(patch.avanceRealPct, "avanceRealPct") : number(current?.avance_real_pct);
    if (planned !== null && actual !== null && planned > 0) set("spi_pct", Math.round((actual / planned) * 10000) / 100);
    else if ("avancePlanificadoPct" in patch || "avanceRealPct" in patch) set("spi_pct", null);

    if (current) {
      if (stateSets.length) {
        await tx.unsafe(
          `UPDATE pmo.proyecto_estado_actual SET ${stateSets.join(", ")}, actualizado_at = $${stateParams.length + 1}, actualizado_por = $${stateParams.length + 2} WHERE proyecto_id = $${stateParams.length + 3}`,
          [...stateParams, editTimestamp, actor, project.id],
        );
      }
    } else {
      const firstState = await tx<{ id: string }>`SELECT id::text AS id FROM pmo.estado_proyecto ORDER BY id LIMIT 1`;
      const estadoId = "estado" in patch ? await resolveState(tx, requiredText(patch.estado, "estado")) : firstState[0]?.id;
      if (!estadoId) throw new ApiError(422, "INVALID_STATUS", "No hay estados de proyecto configurados.");
      const values = new Map<string, unknown>([["estado_proyecto_id", estadoId]]);
      for (const [column, value] of [["avance_planificado_pct", planned], ["avance_real_pct", actual], ["fecha_termino_proyecto", "fechaTerminoProyecto" in patch ? date(patch.fechaTerminoProyecto) : null], ["actividades", "actividades" in patch ? optionalText(patch.actividades, "actividades") : null], ["proximos_pasos", "proximosPasos" in patch ? optionalText(patch.proximosPasos, "proximosPasos") : null]] as const) values.set(column, value);
      if (planned !== null && actual !== null && planned > 0) values.set("spi_pct", Math.round((actual / planned) * 10000) / 100);
      const columns = [...values.keys()];
      const params = [...values.values()];
      await tx.unsafe(
        `INSERT INTO pmo.proyecto_estado_actual (proyecto_id, ${columns.join(", ")}, actualizado_at, actualizado_por) VALUES ($1, ${columns.map((_, index) => `$${index + 2}`).join(", ")}, $${columns.length + 2}, $${columns.length + 3})`,
        [project.id, ...params, editTimestamp, actor],
      );
    }
  });

  return getProject(project.id);
}

const riskFields = ["nombre", "estado", "categoria", "probabilidad", "impacto", "estrategia", "planMitigacion", "planContingencia", "responsableNombre"] as const;

export async function updateProjectRisk(projectIdOrTvt: string, riskId: string, patch: Patch, actor: string) {
  ensureFields(patch, [...riskFields]);
  const project = await resolveProject(projectIdOrTvt);
  const rows = await sql<Row>`
    SELECT id::text AS id, probabilidad, impacto
    FROM pmo.riesgo_proyecto
    WHERE risk_id_origen = ${riskId} AND proyecto_id = ${project.id}
  `;
  const risk = rows[0];
  if (!risk) throw new ApiError(404, "NOT_FOUND", "Riesgo del proyecto no encontrado.");
  const sets: string[] = [];
  const params: unknown[] = [];
  const set = (column: string, value: unknown) => {
    sets.push(`${column} = $${params.length + 1}`);
    params.push(value);
  };
  if ("nombre" in patch) set("nombre", requiredText(patch.nombre, "nombre"));
  if ("estado" in patch) set("estado", requiredText(patch.estado, "estado"));
  if ("categoria" in patch) set("categoria", optionalText(patch.categoria, "categoria"));
  if ("estrategia" in patch) set("estrategia", optionalText(patch.estrategia, "estrategia"));
  if ("planMitigacion" in patch) set("plan_mitigacion", optionalText(patch.planMitigacion, "planMitigacion"));
  if ("planContingencia" in patch) set("plan_contingencia", optionalText(patch.planContingencia, "planContingencia"));
  if ("responsableNombre" in patch) set("responsable_nombre", optionalText(patch.responsableNombre, "responsableNombre"));
  const probability = "probabilidad" in patch ? scale(patch.probabilidad, "probabilidad") : number(risk.probabilidad);
  const impact = "impacto" in patch ? scale(patch.impacto, "impacto") : number(risk.impacto);
  if ("probabilidad" in patch) set("probabilidad", probability);
  if ("impacto" in patch) set("impacto", impact);
  if (probability !== null && impact !== null) set("severidad", probability * impact);
  if (!sets.length) throw new ApiError(400, "EMPTY_PATCH", "No se indicaron cambios.");
  await sql.unsafe(
    `UPDATE pmo.riesgo_proyecto SET ${sets.join(", ")}, actualizado_at = $${params.length + 1}, actualizado_por = $${params.length + 2} WHERE id = $${params.length + 3}`,
    [...params, editTimestamp, actor, risk.id],
  );
  return getProjectRisk(projectIdOrTvt, riskId);
}

export async function updateGlobalRisk(riskId: string, patch: Patch, actor: string) {
  ensureFields(patch, [...riskFields]);
  const rows = await sql<Row>`SELECT id::text AS id, probabilidad, impacto FROM pmo.riesgo_global WHERE risk_id_origen = ${riskId}`;
  const risk = rows[0];
  if (!risk) throw new ApiError(404, "NOT_FOUND", "Riesgo global no encontrado.");
  const sets: string[] = [];
  const params: unknown[] = [];
  const set = (column: string, value: unknown) => {
    sets.push(`${column} = $${params.length + 1}`);
    params.push(value);
  };
  if ("nombre" in patch) set("nombre", requiredText(patch.nombre, "nombre"));
  if ("estado" in patch) set("estado", requiredText(patch.estado, "estado"));
  if ("categoria" in patch) set("categoria", optionalText(patch.categoria, "categoria"));
  if ("estrategia" in patch) set("estrategia", optionalText(patch.estrategia, "estrategia"));
  if ("planMitigacion" in patch) set("plan_mitigacion", optionalText(patch.planMitigacion, "planMitigacion"));
  if ("planContingencia" in patch) set("plan_contingencia", optionalText(patch.planContingencia, "planContingencia"));
  if ("responsableNombre" in patch) set("responsable_nombre", optionalText(patch.responsableNombre, "responsableNombre"));
  const probability = "probabilidad" in patch ? scale(patch.probabilidad, "probabilidad") : number(risk.probabilidad);
  const impact = "impacto" in patch ? scale(patch.impacto, "impacto") : number(risk.impacto);
  if ("probabilidad" in patch) set("probabilidad", probability);
  if ("impacto" in patch) set("impacto", impact);
  if (probability !== null && impact !== null) set("severidad", probability * impact);
  if (!sets.length) throw new ApiError(400, "EMPTY_PATCH", "No se indicaron cambios.");
  await sql.unsafe(
    `UPDATE pmo.riesgo_global SET ${sets.join(", ")}, actualizado_at = $${params.length + 1}, actualizado_por = $${params.length + 2} WHERE id = $${params.length + 3}`,
    [...params, editTimestamp, actor, risk.id],
  );
  return getGlobalRisk(riskId);
}
