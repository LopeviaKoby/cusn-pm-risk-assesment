import { sql } from "../../db";
import { activeActor } from "../../authorization";
import { ApiError } from "../../errors";

export async function updateWorkspaceName(actorId: string, workspaceId: string, name: string, version: string) {
  return sql.begin(async tx => {
    const actor = await activeActor(actorId,tx);
    const [workspace] = await tx<{creatorId:string}>`SELECT creado_por_id::text AS "creatorId" FROM pmo_cusn.workspace
      WHERE id=${workspaceId} AND estado='ACTIVO' FOR UPDATE`;
    if (!workspace) throw new ApiError(404,'NOT_FOUND','Workspace no encontrado.');
    if (actor?.role !== 'ADMIN') {
      if (actor?.role !== 'PM' || workspace.creatorId !== actorId) {
        const [membership] = await tx<{allowed:boolean}>`SELECT puede_crear_proyectos AS allowed FROM pmo_cusn.membresia_workspace
          WHERE workspace_id=${workspaceId} AND usuario_id=${actorId} AND estado='ACTIVA' FOR SHARE`;
        if (!membership?.allowed || actor?.role !== 'PM') throw new ApiError(403,'FORBIDDEN','No puedes configurar este workspace.');
      }
    }
    const [updated] = await tx<{id:string;nombre:string;slug:string;version:string}>`UPDATE pmo_cusn.workspace
      SET nombre=${name.trim()},version=version+1,updated_at=now() WHERE id=${workspaceId} AND version=${version}
      RETURNING id::text,nombre,slug,version::text`;
    if (!updated) throw new ApiError(409,'VERSION_CONFLICT','El workspace cambió.');
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${workspaceId},'workspaces.configurar','workspace',${workspaceId},'PERMITIDO')`;
    return updated;
  });
}

export async function enableProjectCreation(actorId:string,workspaceId:string,userId:string,enabled:boolean) {
  return sql.begin(async tx => {
    if ((await activeActor(actorId,tx))?.role !== 'ADMIN') throw new ApiError(403,'FORBIDDEN','Solo Head habilita la creación.');
    const [target] = await tx<{id:string}>`SELECT u.id::text FROM pmo_cusn.usuario u
      JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
      JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.codigo='PM' AND r.activo
      WHERE u.id=${userId} AND u.activo AND u.tipo_usuario='INTERNO' FOR SHARE OF u`;
    if (!target) throw new ApiError(422,'INVALID_MEMBER','El miembro debe ser PM interno activo.');
    const [member] = await tx<{id:string;enabled:boolean}>`UPDATE pmo_cusn.membresia_workspace m
      SET puede_crear_proyectos=${enabled},updated_at=now() FROM pmo_cusn.workspace w
      WHERE m.workspace_id=w.id AND w.id=${workspaceId} AND w.estado='ACTIVO'
        AND m.usuario_id=${userId} AND m.estado='ACTIVA'
      RETURNING m.id::text,m.puede_crear_proyectos AS enabled`;
    if (!member) throw new ApiError(404,'NOT_FOUND','Membresía activa no encontrada.');
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${workspaceId},'workspaces.creacion_habilitar','membresia_workspace',${member.id},'PERMITIDO')`;
    return member;
  });
}

export async function changeMembership(actorId:string,workspaceId:string,userId:string,state:'ACTIVA'|'SUSPENDIDA'|'RETIRADA'){
  return sql.begin(async tx=>{
    if((await activeActor(actorId,tx))?.role!=='ADMIN')throw new ApiError(403,'FORBIDDEN','Solo Head gestiona el estado de membresía.');
    const [member]=await tx<{id:string;estado:string}>`UPDATE pmo_cusn.membresia_workspace SET estado=${state},
      puede_crear_proyectos=CASE WHEN ${state}='ACTIVA' THEN puede_crear_proyectos ELSE false END,updated_at=now()
      WHERE workspace_id=${workspaceId} AND usuario_id=${userId} RETURNING id::text,estado`;
    if(!member)throw new ApiError(404,'NOT_FOUND','Membresía no encontrada.');
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${workspaceId},'workspaces.miembros.gestionar','membresia_workspace',${member.id},'PERMITIDO')`;
    return member;
  });
}
