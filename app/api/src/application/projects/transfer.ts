import { sql } from "../../db";
import { activeActor } from "../../authorization";
import { ApiError } from "../../errors";

export async function transferProject(actorId:string,projectId:string,input:{workspaceId:string;pmTitularId:string;version:string}){
  return sql.begin(async tx=>{
    const actor=await activeActor(actorId,tx);
    if(actor?.role!=="ADMIN")throw new ApiError(403,"FORBIDDEN","Solo Head transfiere proyectos.");
    const [project]=await tx<{id:string;tvt:string;workspaceId:string;version:string}>`SELECT id::text,tvt,workspace_id::text AS "workspaceId",version::text
      FROM pmo_cusn.proyecto WHERE id=${projectId} AND activo FOR UPDATE`;
    if(!project)throw new ApiError(404,"NOT_FOUND","Proyecto no encontrado.");
    if(project.version!==input.version)throw new ApiError(409,"VERSION_CONFLICT","El proyecto cambió; vuelve a cargarlo.");
    const [eligible]=await tx<{id:string}>`SELECT u.id::text FROM pmo_cusn.usuario u
      JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
      JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.codigo='PM' AND r.activo
      JOIN pmo_cusn.membresia_workspace m ON m.usuario_id=u.id AND m.workspace_id=${input.workspaceId} AND m.estado='ACTIVA'
      JOIN pmo_cusn.workspace w ON w.id=m.workspace_id AND w.estado='ACTIVO'
      WHERE u.id::text=${input.pmTitularId} AND u.activo AND u.tipo_usuario='INTERNO' FOR SHARE OF u,m,w`;
    if(!eligible)throw new ApiError(422,"INVALID_OWNER","Nuevo PM no elegible en el workspace de destino.");
    const [old]=await tx<{id:string;userId:string}>`SELECT id::text,usuario_id::text AS "userId" FROM pmo_cusn.participacion_proyecto
      WHERE proyecto_id=${projectId} AND funcion='PM_TITULAR' AND fecha_fin IS NULL FOR UPDATE`;
    if(!old)throw new ApiError(409,"OWNER_MISSING","Proyecto sin titular vigente.");
    if(project.workspaceId===input.workspaceId && old.userId===input.pmTitularId)throw new ApiError(409,"NO_CHANGE","Titular y workspace sin cambios.");
    const [stamp]=await tx<{at:Date}>`SELECT greatest(clock_timestamp(),fecha_inicio+interval '1 microsecond') AS at
      FROM pmo_cusn.participacion_proyecto WHERE id=${old.id}`;
    await tx`UPDATE pmo_cusn.participacion_proyecto SET fecha_fin=${stamp!.at} WHERE id=${old.id}`;
    await tx`UPDATE pmo_cusn.proyecto SET workspace_id=${input.workspaceId},version=version+1,updated_at=now() WHERE id=${projectId}`;
    await tx`INSERT INTO pmo_cusn.participacion_proyecto(proyecto_id,usuario_id,funcion,fecha_inicio)
      VALUES (${projectId},${input.pmTitularId},'PM_TITULAR',${stamp!.at})`;
    if(old.userId!==input.pmTitularId)await tx`UPDATE pmo_cusn.delegacion_acceso SET estado='REVOCADA',revocado_at=now(),revocado_por_id=${actorId}
      WHERE proyecto_id=${projectId} AND estado IN ('PENDIENTE','ACTIVA')`;
    await tx`INSERT INTO pmo_cusn.evento_proyecto(proyecto_id,actor_id,tipo_evento,detalle)
      VALUES (${projectId},${actorId},'TRANSFERENCIA',${JSON.stringify({workspaceAnterior:project.workspaceId,workspaceNuevo:input.workspaceId,pmAnterior:old.userId,pmNuevo:input.pmTitularId})}::jsonb)`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,proyecto_id,operacion,recurso_tipo,recurso_id,resultado,detalle)
      VALUES (${actorId},${input.workspaceId},${projectId},'proyectos.transferir','proyecto',${projectId},'PERMITIDO',
        ${JSON.stringify({anteriorWorkspaceId:project.workspaceId,anteriorPmId:old.userId,nuevoPmId:input.pmTitularId})}::jsonb)`;
    return {id:project.id,tvt:project.tvt,workspaceId:input.workspaceId,pmTitularId:input.pmTitularId,version:String(BigInt(project.version)+1n)};
  });
}
