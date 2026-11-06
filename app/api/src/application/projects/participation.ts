import {sql} from '../../db';
import {activeActor} from '../../authorization';
import {ApiError} from '../../errors';

export async function addParticipant(actorId:string,projectId:string,userId:string,funcion:'ESPECIALISTA'|'OBSERVADOR'){
  return sql.begin(async tx=>{
    const actor=await activeActor(actorId,tx);
    const [project]=await tx<{workspaceId:string}>`SELECT workspace_id::text AS "workspaceId" FROM pmo_cusn.proyecto WHERE id=${projectId} AND activo FOR UPDATE`;
    if(!project)throw new ApiError(404,'NOT_FOUND','Proyecto no encontrado.');
    if(actor?.role!=='ADMIN'){
      const [owner]=await tx`SELECT id FROM pmo_cusn.participacion_proyecto WHERE proyecto_id=${projectId}
        AND usuario_id=${actorId} AND funcion='PM_TITULAR' AND fecha_inicio<=now() AND fecha_fin IS NULL`;
      if(actor?.role!=='PM'||!owner)throw new ApiError(403,'FORBIDDEN','Solo Head o titular incorpora participantes.');
    }
    const target=await activeActor(userId,tx);
    if(!target||(funcion==='ESPECIALISTA'?target.role!=='ESPECIALISTA':!['PM','VISUALIZADOR'].includes(target.role)))
      throw new ApiError(422,'INVALID_PARTICIPANT','Rol no elegible para esta participación.');
    const [member]=await tx`SELECT id FROM pmo_cusn.membresia_workspace WHERE workspace_id=${project.workspaceId}
      AND usuario_id=${userId} AND estado='ACTIVA' FOR SHARE`;
    if(!member)throw new ApiError(422,'INVALID_MEMBER','Se requiere membresía activa.');
    const [row]=await tx<{id:string}>`INSERT INTO pmo_cusn.participacion_proyecto(proyecto_id,usuario_id,funcion)
      VALUES (${projectId},${userId},${funcion}) RETURNING id::text`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,proyecto_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${project.workspaceId},${projectId},'proyectos.miembros.gestionar','participacion_proyecto',${row!.id},'PERMITIDO')`;
    return {id:row!.id,projectId,userId,funcion};
  });
}
