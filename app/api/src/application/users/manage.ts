import { sql } from "../../db";
import { activeActor } from "../../authorization";
import { ApiError } from "../../errors";

type Role='ADMIN'|'PM'|'ESPECIALISTA'|'VISUALIZADOR';
export async function changeCorporateRole(actorId:string,userId:string,role:Role,scope:'GLOBAL'|'ASIGNADOS') {
  if (actorId===userId) throw new ApiError(403,'SELF_PROMOTION','No puedes modificar tu propio rol.');
  if (role!=='ADMIN' && role!=='PM' && scope==='GLOBAL') {
    // Global read is approved only for internal Visualizers. Specialists remain assigned.
    if (role!=='VISUALIZADOR') throw new ApiError(422,'INVALID_SCOPE','Este rol no tiene alcance global.');
  }
  return sql.begin(async tx => {
    if ((await activeActor(actorId,tx))?.role!=='ADMIN') throw new ApiError(403,'FORBIDDEN','Solo Head asigna roles.');
    const [target]=await tx<{id:string;kind:string}>`SELECT id::text,tipo_usuario AS kind FROM pmo_cusn.usuario
      WHERE id=${userId} AND activo FOR UPDATE`;
    if (!target) throw new ApiError(404,'NOT_FOUND','Usuario no encontrado.');
    if (target.kind==='EXTERNO' && (role!=='VISUALIZADOR'||scope==='GLOBAL'))
      throw new ApiError(422,'EXTERNAL_SCOPE','Un externo solo puede ser Visualizador con alcance asignado.');
    await tx`UPDATE pmo_cusn.asignacion_rol SET revocado_at=now()
      WHERE usuario_id=${userId} AND revocado_at IS NULL`;
    const [assignment]=await tx<{id:string}>`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura,asignado_por_id)
      SELECT ${userId},id,${scope},${actorId} FROM pmo_cusn.rol WHERE codigo=${role} AND activo RETURNING id::text`;
    await tx`UPDATE pmo_cusn.usuario SET session_version=session_version+1,refresh_token_hash=NULL,refresh_expires_at=NULL
      WHERE id=${userId}`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},'usuarios.administrar.rol','usuario',${userId},'PERMITIDO')`;
    return {userId,role,scope,assignmentId:assignment!.id};
  });
}

export async function deactivateUser(actorId:string,userId:string) {
  if (actorId===userId) throw new ApiError(403,'SELF_DEACTIVATION','No puedes desactivar tu propia cuenta.');
  return sql.begin(async tx => {
    if ((await activeActor(actorId,tx))?.role!=='ADMIN') throw new ApiError(403,'FORBIDDEN','Solo Head desactiva usuarios.');
    const [target]=await tx<{id:string}>`UPDATE pmo_cusn.usuario SET activo=false,session_version=session_version+1,
      refresh_token_hash=NULL,refresh_expires_at=NULL WHERE id=${userId} AND activo RETURNING id::text`;
    if (!target) throw new ApiError(404,'NOT_FOUND','Usuario no encontrado.');
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},'usuarios.administrar.desactivar','usuario',${userId},'PERMITIDO')`;
    return {userId,status:'INACTIVE'};
  });
}

export async function revokeCorporateRole(actorId:string,userId:string){
  if(actorId===userId)throw new ApiError(403,'SELF_REVOCATION','No puedes revocar tu propio rol.');
  return sql.begin(async tx=>{
    if((await activeActor(actorId,tx))?.role!=='ADMIN')throw new ApiError(403,'FORBIDDEN','Solo Head revoca roles.');
    const [user]=await tx`SELECT id FROM pmo_cusn.usuario WHERE id=${userId} FOR UPDATE`;
    if(!user)throw new ApiError(404,'NOT_FOUND','Usuario no encontrado.');
    await tx`UPDATE pmo_cusn.asignacion_rol SET revocado_at=now() WHERE usuario_id=${userId} AND revocado_at IS NULL`;
    await tx`UPDATE pmo_cusn.usuario SET session_version=session_version+1,refresh_token_hash=NULL,refresh_expires_at=NULL WHERE id=${userId}`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},'usuarios.administrar.revocar','usuario',${userId},'PERMITIDO')`;
    return {userId,status:'ROLE_REVOKED'};
  });
}
