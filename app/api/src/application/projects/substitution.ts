import { sql } from "../../db";
import { activeActor } from "../../authorization";
import { ApiError } from "../../errors";

export type SubstitutionInput={ delegateId:string;start:string;end:string;reason:string;permissions:string[] };

async function assertDesignator(actorId:string,projectId:string,db:typeof sql){
  const actor=await activeActor(actorId,db);
  if(!actor || !["ADMIN","PM"].includes(actor.role))throw new ApiError(403,"FORBIDDEN","No puedes designar suplencias.");
  const [project]=await db<{ownerId:string;creatorId:string;workspaceId:string}>`SELECT pp.usuario_id::text AS "ownerId",p.creado_por_id::text AS "creatorId",p.workspace_id::text AS "workspaceId"
    FROM pmo_cusn.proyecto p JOIN pmo_cusn.participacion_proyecto pp ON pp.proyecto_id=p.id
      AND pp.funcion='PM_TITULAR' AND pp.fecha_fin IS NULL
    WHERE p.id=${projectId} AND p.activo FOR UPDATE OF p`;
  if(!project)throw new ApiError(404,"NOT_FOUND","Proyecto no encontrado.");
  if(actor.role==='PM'&&(project.ownerId!==actorId||project.creatorId!==actorId))throw new ApiError(403,"FORBIDDEN","Solo el titular creador puede designar suplencia.");
  return project;
}

export async function designateSubstitution(actorId:string,projectId:string,input:SubstitutionInput){
  const start=new Date(input.start),end=new Date(input.end);
  if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start||end.getTime()-start.getTime()>366*86400_000)
    throw new ApiError(422,"INVALID_PERIOD","Vigencia [inicio, fin) no válida.");
  if(!input.permissions.length||input.permissions.length>20)throw new ApiError(422,"INVALID_PERMISSIONS","Selecciona permisos delegables.");
  return sql.begin(async tx=>{
    const project=await assertDesignator(actorId,projectId,tx);
    const [delegate]=await tx<{id:string}>`SELECT u.id::text FROM pmo_cusn.usuario u
      JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
      JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.codigo='PM' AND r.activo
      WHERE u.id::text=${input.delegateId} AND u.activo AND u.tipo_usuario='INTERNO' FOR SHARE OF u`;
    if(!delegate||delegate.id===project.ownerId)throw new ApiError(422,"INVALID_DELEGATE","Suplente PM no elegible.");
    const approved=await tx<{id:string;codigo:string}>`SELECT p.id::text,p.codigo FROM pmo_cusn.permiso p
      JOIN pmo_cusn.rol_permiso rp ON rp.permiso_id=p.id JOIN pmo_cusn.rol r ON r.id=rp.rol_id AND r.codigo='PM'
      WHERE p.delegable`;
    if(!input.permissions.every(code=>approved.some(permission=>permission.codigo===code)))throw new ApiError(422,"INVALID_PERMISSIONS","Permiso no delegable.");
    const [created]=await tx<{id:string}>`INSERT INTO pmo_cusn.delegacion_acceso(delegante_id,delegado_id,autorizado_por_id,proyecto_id,inicio,fin,motivo,estado)
      VALUES (${project.ownerId},${input.delegateId},${actorId},${projectId},${start},${end},${input.reason.trim()},'ACTIVA') RETURNING id::text`;
    for(const code of new Set(input.permissions)){
      const permission=approved.find(p=>p.codigo===code)!;
      await tx`INSERT INTO pmo_cusn.delegacion_permiso(delegacion_id,permiso_id) VALUES (${created!.id},${permission.id})`;
    }
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,delegacion_id,workspace_id,proyecto_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${created!.id},${project.workspaceId},${projectId},'suplencias.designar','delegacion_acceso',${created!.id},'PERMITIDO')`;
    return {id:created!.id,projectId,delegateId:input.delegateId,start:start.toISOString(),end:end.toISOString(),state:'ACTIVA'};
  });
}

export async function revokeSubstitution(actorId:string,projectId:string,delegationId:string){
  return sql.begin(async tx=>{
    const project=await assertDesignator(actorId,projectId,tx);
    const [updated]=await tx<{id:string}>`UPDATE pmo_cusn.delegacion_acceso SET estado='REVOCADA',revocado_at=now(),revocado_por_id=${actorId}
      WHERE id=${delegationId} AND proyecto_id=${projectId} AND estado IN ('PENDIENTE','ACTIVA') RETURNING id::text`;
    if(!updated)throw new ApiError(404,"NOT_FOUND","Suplencia vigente no encontrada.");
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,delegacion_id,workspace_id,proyecto_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${delegationId},${project.workspaceId},${projectId},'suplencias.revocar','delegacion_acceso',${delegationId},'PERMITIDO')`;
    return {id:updated.id,state:'REVOCADA'};
  });
}
