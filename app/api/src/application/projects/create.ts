import { sql } from "../../db";
import { activeActor } from "../../authorization";
import { ApiError } from "../../errors";

export type NewProject = { workspaceId: string; tvt: string; nombre: string; clienteId: string; paisId: string; lobId: string; pmTitularId?: string };

export async function createProject(actorId: string, input: NewProject) {
  return sql.begin(async tx => {
    const actor = await activeActor(actorId, tx);
    if (!actor || !["ADMIN", "PM"].includes(actor.role)) throw new ApiError(403,"FORBIDDEN","No puedes crear proyectos.");
    const [workspace] = await tx<{id:string}>`SELECT id::text FROM pmo_cusn.workspace WHERE id::text=${input.workspaceId} AND estado='ACTIVO' FOR UPDATE`;
    if (!workspace) throw new ApiError(404,"NOT_FOUND","Workspace no encontrado.");
    if (actor.role === "PM") {
      const [membership] = await tx<{allowed:boolean}>`SELECT puede_crear_proyectos AS allowed FROM pmo_cusn.membresia_workspace
        WHERE workspace_id=${workspace.id} AND usuario_id=${actorId} AND estado='ACTIVA' FOR SHARE`;
      if (!membership?.allowed) throw new ApiError(403,"FORBIDDEN","No puedes crear en este workspace.");
    }
    const ownerId = actor.role === "PM" ? actorId : input.pmTitularId;
    if (!ownerId || (actor.role === "PM" && input.pmTitularId && input.pmTitularId !== actorId)) {
      throw new ApiError(422,"INVALID_OWNER","Selecciona un PM titular elegible.");
    }
    const [eligible] = await tx<{id:string}>`SELECT u.id::text FROM pmo_cusn.usuario u
      JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
      JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.codigo='PM' AND r.activo
      JOIN pmo_cusn.membresia_workspace m ON m.usuario_id=u.id AND m.workspace_id=${workspace.id} AND m.estado='ACTIVA'
      WHERE u.id::text=${ownerId} AND u.activo AND u.tipo_usuario='INTERNO' FOR SHARE OF u,m`;
    if (!eligible) throw new ApiError(422,"INVALID_OWNER","El PM titular no es elegible en este workspace.");
    const [created] = await tx<{id:string;tvt:string;nombre:string;workspaceId:string;version:string}>`
      INSERT INTO pmo_cusn.proyecto(tvt,nombre,workspace_id,creado_por_id,cliente_id,pais_id,lob_id)
      VALUES (${input.tvt.trim()},${input.nombre.trim()},${workspace.id},${actorId},${input.clienteId},${input.paisId},${input.lobId})
      RETURNING id::text,tvt,nombre,workspace_id::text AS "workspaceId",version::text`;
    await tx`INSERT INTO pmo_cusn.participacion_proyecto(proyecto_id,usuario_id,funcion) VALUES (${created!.id},${ownerId},'PM_TITULAR')`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,proyecto_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${workspace.id},${created!.id},'proyectos.crear','proyecto',${created!.id},'PERMITIDO')`;
    return created!;
  });
}
