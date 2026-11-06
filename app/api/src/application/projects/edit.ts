import { sql } from "../../db";
import { assertPermission } from "../../authorization";
import { ApiError } from "../../errors";
import { civilDate } from "../../domain/shared/civil-date";
import { renameProject } from "../../repositories/projects";

export type ProjectEditInput = {
  version: string;
  nombre?: string;
  descripcion?: string | null;
  situacionInicial?: string | null;
  squadId?: string | null;
  fechaRecepcionP1p2?: string | null;
  fechaInicio?: string | null;
  fechaTerminoBaseline?: string | null;
  referenciaSap?: string | null;
  referenciaCeco?: string | null;
  referenciaPep?: string | null;
};

function parseOptionalDate(field: string, value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  try {
    return civilDate(value);
  } catch {
    throw new ApiError(422, "INVALID_DATE", `Fecha civil no válida en ${field}.`, { [field]: "Usa YYYY-MM-DD válido." });
  }
}

function formatDateColumn(value: Date | string | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export async function editProjectName(
  actorId: string,
  projectId: string,
  expectedVersion: string,
  nameOrInput: string | ProjectEditInput,
) {
  const input: ProjectEditInput =
    typeof nameOrInput === "string" ? { version: expectedVersion, nombre: nameOrInput } : nameOrInput;
  const hasField =
    input.nombre !== undefined ||
    input.descripcion !== undefined ||
    input.situacionInicial !== undefined ||
    input.squadId !== undefined ||
    input.fechaRecepcionP1p2 !== undefined ||
    input.fechaInicio !== undefined ||
    input.fechaTerminoBaseline !== undefined ||
    input.referenciaSap !== undefined ||
    input.referenciaCeco !== undefined ||
    input.referenciaPep !== undefined;
  if (!hasField) {
    throw new ApiError(422, "EMPTY_UPDATE", "Indica al menos un atributo editable del proyecto.");
  }
  if (input.nombre !== undefined) {
    const trimmed = input.nombre.trim();
    if (!trimmed || trimmed.length > 200) throw new ApiError(422, "INVALID_NAME", "Nombre de proyecto no válido.");
  }

  if (input.fechaInicio !== undefined || input.fechaTerminoBaseline !== undefined) throw new ApiError(422,'IMMUTABLE_PLAN','La planificacion inicial no es editable.');
  const nextP1p2 = parseOptionalDate("fechaRecepcionP1p2", input.fechaRecepcionP1p2);
  const nextInicio = parseOptionalDate("fechaInicio", input.fechaInicio);
  const nextBaseline = parseOptionalDate("fechaTerminoBaseline", input.fechaTerminoBaseline);

  return sql.begin(async tx => {
    const [locked] = await tx<{
      id: string;
      nombre: string;
      descripcion: string | null;
      situacionInicial: string | null;
      squadId: string | null;
      fechaRecepcionP1p2: Date | string | null;
      fechaInicio: Date | string | null;
      fechaTerminoBaseline: Date | string | null;
      fechaTerminoActual: Date | string | null;
      referenciaSap: string | null;
      referenciaCeco: string | null;
      referenciaPep: string | null;
    }>`SELECT id::text,nombre,descripcion,situacion_inicial AS "situacionInicial",
        squad_id::text AS "squadId",fecha_recepcion_p1p2 AS "fechaRecepcionP1p2",
        fecha_inicio AS "fechaInicio",fecha_termino_baseline AS "fechaTerminoBaseline",
        fecha_termino_actual AS "fechaTerminoActual",referencia_sap AS "referenciaSap",
        referencia_ceco AS "referenciaCeco",referencia_pep AS "referenciaPep"
      FROM pmo_cusn.proyecto WHERE id=${projectId} AND activo FOR UPDATE`;
    if (!locked) throw new ApiError(404, "NOT_FOUND", "Proyecto no encontrado.");
    await tx`SELECT u.id FROM pmo_cusn.usuario u JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id
      WHERE u.id=${actorId} AND a.revocado_at IS NULL FOR SHARE OF u,a`;
    await assertPermission(actorId, "proyectos.editar", projectId, tx);
    const [delegation] = await tx<{ id: string }>`SELECT d.id::text FROM pmo_cusn.delegacion_acceso d
      JOIN pmo_cusn.delegacion_permiso dp ON dp.delegacion_id=d.id JOIN pmo_cusn.permiso p ON p.id=dp.permiso_id
      WHERE d.proyecto_id=${projectId} AND d.delegado_id=${actorId} AND d.estado='ACTIVA'
        AND d.inicio<=now() AND d.fin>now() AND d.revocado_at IS NULL AND p.codigo='proyectos.editar'
        AND NOT EXISTS (SELECT 1 FROM pmo_cusn.participacion_proyecto pp WHERE pp.proyecto_id=${projectId}
          AND pp.usuario_id=${actorId} AND pp.funcion='PM_TITULAR' AND pp.fecha_fin IS NULL)
      FOR SHARE OF d`;

    const currentBaseline = formatDateColumn(locked.fechaTerminoBaseline);
    const currentInicio = formatDateColumn(locked.fechaInicio);
    const currentActual = formatDateColumn(locked.fechaTerminoActual);
    const currentP1p2 = formatDateColumn(locked.fechaRecepcionP1p2);

    if (nextBaseline !== undefined && currentBaseline !== null && nextBaseline !== currentBaseline) {
      throw new ApiError(409, "BASELINE_IMMUTABLE", "La primera línea base de término ya fue fijada y es inmutable.");
    }

    const effectiveInicio = nextInicio === undefined ? currentInicio : nextInicio;
    const effectiveBaseline = nextBaseline === undefined ? currentBaseline : nextBaseline;
    const effectiveActual =
      currentBaseline === null && effectiveBaseline !== null && currentActual === null
        ? effectiveBaseline
        : currentActual;
    const effectiveP1p2 = nextP1p2 === undefined ? currentP1p2 : nextP1p2;

    if (effectiveInicio && effectiveBaseline && effectiveBaseline < effectiveInicio) {
      throw new ApiError(422, "INVALID_DATES", "La línea base de término no puede ser anterior a la fecha de inicio.");
    }
    if (effectiveInicio && effectiveActual && effectiveActual < effectiveInicio) {
      throw new ApiError(422, "INVALID_DATES", "La fecha de término actual no puede ser anterior a la fecha de inicio.");
    }

    const effectiveSquad = input.squadId === undefined ? locked.squadId : input.squadId;
    if (effectiveSquad !== null) {
      const [squad] = await tx<{ id: string }>`SELECT id::text FROM pmo_cusn.squad WHERE id=${effectiveSquad} AND activo`;
      if (!squad) throw new ApiError(422, "INVALID_REFERENCE", "El squad indicado no existe o está inactivo.");
    }

    const effectiveNombre = input.nombre !== undefined ? input.nombre.trim() : locked.nombre;
    const effectiveDesc =
      input.descripcion === undefined ? locked.descripcion : input.descripcion?.trim() || null;
    const effectiveSituacion =
      input.situacionInicial === undefined ? locked.situacionInicial : input.situacionInicial?.trim() || null;
    const effectiveSap =
      input.referenciaSap === undefined ? locked.referenciaSap : input.referenciaSap?.trim() || null;
    const effectiveCeco =
      input.referenciaCeco === undefined ? locked.referenciaCeco : input.referenciaCeco?.trim() || null;
    const effectivePep =
      input.referenciaPep === undefined ? locked.referenciaPep : input.referenciaPep?.trim() || null;

    const onlyNameChanged =
      input.descripcion === undefined &&
      input.situacionInicial === undefined &&
      input.squadId === undefined &&
      input.fechaRecepcionP1p2 === undefined &&
      input.fechaInicio === undefined &&
      input.fechaTerminoBaseline === undefined &&
      input.referenciaSap === undefined &&
      input.referenciaCeco === undefined &&
      input.referenciaPep === undefined;

    const row = onlyNameChanged
      ? await renameProject(tx, projectId, expectedVersion, effectiveNombre)
      : (
          await tx<{ id: string; tvt: string; nombre: string; workspaceId: string; version: string }>`
            UPDATE pmo_cusn.proyecto
            SET nombre=${effectiveNombre},
                descripcion=${effectiveDesc},
                situacion_inicial=${effectiveSituacion},
                squad_id=${effectiveSquad},
                fecha_recepcion_p1p2=${effectiveP1p2},
                fecha_inicio=${effectiveInicio},
                fecha_termino_baseline=${effectiveBaseline},
                fecha_termino_actual=${effectiveActual},
                referencia_sap=${effectiveSap},
                referencia_ceco=${effectiveCeco},
                referencia_pep=${effectivePep},
                version=version+1,
                updated_at=now()
            WHERE id=${projectId} AND version=${expectedVersion} AND activo
            RETURNING id::text,tvt,nombre,workspace_id::text AS "workspaceId",version::text`
        )[0];

    if (!row) throw new ApiError(409, "VERSION_CONFLICT", "El proyecto cambió; vuelve a cargarlo.");
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,delegacion_id,workspace_id,proyecto_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${delegation?.id ?? null},${row.workspaceId},${projectId},'proyectos.editar','proyecto',${projectId},'PERMITIDO')`;
    return row;
  });
}
