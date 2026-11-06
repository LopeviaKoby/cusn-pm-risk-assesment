import {enqueueDrive} from '../drive/enqueue';
import {config} from '../../config';
import { sql } from "../../db";
import { activeActor, hasGrant } from "../../authorization";
import { ApiError } from "../../errors";
import { civilDate } from "../../domain/shared/civil-date";

export type NewProject = {
  condicionComercial: { tcvTipo: 'DEFINIDO' | 'ILIMITADO'; tcvValor: string | null; unidadCodigo: string | null };
  especialistaIds?: string[];
  workspaceId: string;
  tvt: string;
  nombre: string;
  clienteId: string;
  paisId: string;
  lobId: string;
  pmTitularId?: string;
  squadId?: string | null;
  descripcion?: string | null;
  situacionInicial?: string | null;
  fechaRecepcionP1p2?: string | null;
  fechaInicio?: string | null;
  fechaTerminoBaseline?: string | null;
  referenciaSap?: string | null;
  referenciaCeco?: string | null;
  referenciaPep?: string | null;
};

function parseOptionalDate(field: string, value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  try {
    return civilDate(value);
  } catch {
    throw new ApiError(422, "INVALID_DATE", `Fecha civil no válida en ${field}.`, { [field]: "Usa YYYY-MM-DD válido." });
  }
}

export async function createProject(actorId: string, input: NewProject) {
  const fechaRecepcionP1p2 = parseOptionalDate("fechaRecepcionP1p2", input.fechaRecepcionP1p2);
  const fechaInicio = parseOptionalDate("fechaInicio", input.fechaInicio);
  const fechaTerminoBaseline = parseOptionalDate("fechaTerminoBaseline", input.fechaTerminoBaseline);
  if (fechaInicio && fechaTerminoBaseline && fechaTerminoBaseline < fechaInicio) {
    throw new ApiError(422, "INVALID_DATES", "La línea base de término no puede ser anterior a la fecha de inicio.", {
      fechaTerminoBaseline: "Debe ser mayor o igual a fechaInicio.",
    });
  }
  if (!fechaInicio || !fechaTerminoBaseline) throw new ApiError(422,'INCOMPLETE_PROJECT','Inicio y termino planificados requeridos.');
  const squadId = input.squadId ?? null;
  const descripcion = input.descripcion?.trim() || null;
  const situacionInicial = input.situacionInicial?.trim() || null;
  const referenciaSap = input.referenciaSap?.trim() || null;
  const referenciaCeco = input.referenciaCeco?.trim() || null;
  const referenciaPep = input.referenciaPep?.trim() || null;

  return sql.begin(async tx => {
    const actor = await activeActor(actorId, tx);
    if (!actor || actor.kind !== "INTERNO" || !["ADMIN", "PM"].includes(actor.role) || !await hasGrant(actorId,"proyectos.crear",tx)) throw new ApiError(403, "FORBIDDEN", "No puedes crear proyectos.");
    const [workspace] = await tx<{ id: string }>`SELECT id::text FROM pmo_cusn.workspace WHERE id::text=${input.workspaceId} AND estado='ACTIVO' FOR UPDATE`;
    if (!workspace) throw new ApiError(404, "NOT_FOUND", "Workspace no encontrado.");
    if (actor.role === "PM") {
      const [membership] = await tx<{ allowed: boolean }>`SELECT puede_crear_proyectos AS allowed FROM pmo_cusn.membresia_workspace
        WHERE workspace_id=${workspace.id} AND usuario_id=${actorId} AND estado='ACTIVA' FOR SHARE`;
      if (!membership?.allowed) throw new ApiError(403, "FORBIDDEN", "No puedes crear en este workspace.");
    }
    const ownerId = actor.role === "PM" ? actorId : input.pmTitularId;
    if (!ownerId || (actor.role === "PM" && input.pmTitularId && input.pmTitularId !== actorId)) {
      throw new ApiError(422, "INVALID_OWNER", "Selecciona un PM titular elegible.");
    }
    const [eligible] = await tx<{ id: string }>`SELECT u.id::text FROM pmo_cusn.usuario u
      JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
      JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.codigo='PM' AND r.activo
      JOIN pmo_cusn.membresia_workspace m ON m.usuario_id=u.id AND m.workspace_id=${workspace.id} AND m.estado='ACTIVA'
      WHERE u.id::text=${ownerId} AND u.activo AND u.tipo_usuario='INTERNO' FOR SHARE OF u,m`;
    if (!eligible) throw new ApiError(422, "INVALID_OWNER", "El PM titular no es elegible en este workspace.");

    const [refs] = await tx<{ clienteOk: boolean; paisOk: boolean; lobOk: boolean; squadOk: boolean }>`
      SELECT
        EXISTS(SELECT 1 FROM pmo_cusn.cliente WHERE id=${input.clienteId} AND activo) AS "clienteOk",
        EXISTS(SELECT 1 FROM pmo_cusn.pais WHERE id=${input.paisId} AND activo) AS "paisOk",
        EXISTS(SELECT 1 FROM pmo_cusn.lob WHERE id=${input.lobId} AND activo) AS "lobOk",
        (${squadId}::bigint IS NULL OR EXISTS(SELECT 1 FROM pmo_cusn.squad WHERE id=${squadId} AND activo)) AS "squadOk"`;
    if (!refs?.clienteOk || !refs.paisOk || !refs.lobOk || !refs.squadOk) {
      throw new ApiError(422, "INVALID_REFERENCE", "Cliente, país, LOB o squad no válido o inactivo.");
    }

    const [created] = await tx<{ id: string; tvt: string; nombre: string; workspaceId: string; version: string }>`
      INSERT INTO pmo_cusn.proyecto(
        tvt,nombre,workspace_id,creado_por_id,cliente_id,pais_id,lob_id,squad_id,
        descripcion,situacion_inicial,fecha_recepcion_p1p2,fecha_inicio,
        fecha_termino_baseline,fecha_termino_actual,referencia_sap,referencia_ceco,referencia_pep
      )
      VALUES (
        ${input.tvt.trim()},${input.nombre.trim()},${workspace.id},${actorId},
        ${input.clienteId},${input.paisId},${input.lobId},${squadId},
        ${descripcion},${situacionInicial},${fechaRecepcionP1p2},${fechaInicio},
        ${fechaTerminoBaseline},${fechaTerminoBaseline},${referenciaSap},${referenciaCeco},${referenciaPep}
      )
      RETURNING id::text,tvt,nombre,workspace_id::text AS "workspaceId",version::text`;
    await tx`INSERT INTO pmo_cusn.participacion_proyecto(proyecto_id,usuario_id,funcion) VALUES (${created!.id},${ownerId},'PM_TITULAR')`;
    const contract=input.condicionComercial;
    await tx`INSERT INTO pmo_cusn.condicion_comercial(proyecto_id,tcv_tipo,tcv_valor,unidad_codigo)
      VALUES (${created!.id},${contract.tcvTipo},${contract.tcvValor},${contract.unidadCodigo})`;
    for (const specialistId of new Set(input.especialistaIds ?? [])) {
      const person=await activeActor(specialistId,tx);
      const [member]=await tx`SELECT id FROM pmo_cusn.membresia_workspace WHERE workspace_id=${workspace.id} AND usuario_id=${specialistId} AND estado='ACTIVA' FOR SHARE`;
      if (!person || person.kind!=='INTERNO' || person.role!=='ESPECIALISTA' || !member) throw new ApiError(422,'INVALID_SPECIALIST','Especialista no elegible.');
      await tx`INSERT INTO pmo_cusn.participacion_proyecto(proyecto_id,usuario_id,funcion) VALUES (${created!.id},${specialistId},'ESPECIALISTA')`;
    }
    await tx`INSERT INTO pmo_cusn.evento_proyecto(proyecto_id,actor_id,tipo_evento,estado_nuevo,detalle)
      VALUES (${created!.id},${actorId},'CREACION_PROYECTO','Requiere P1P2',${JSON.stringify({ workspaceId: workspace.id, pmTitularId: ownerId })}::jsonb)`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,proyecto_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${workspace.id},${created!.id},'proyectos.crear','proyecto',${created!.id},'PERMITIDO')`;
    if(config.driveProvisioningEnabled)await enqueueDrive(tx,created!.id,config.driveRootFolderId);
    return created!;
  });
}
