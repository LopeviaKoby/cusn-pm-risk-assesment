import { createHash, randomBytes } from 'node:crypto';
import { sql } from '../../db';
import { activeActor } from '../../authorization';
import { ApiError } from '../../errors';

const digest=(token:string)=>createHash('sha256').update(token).digest('hex');

// Head verifies identity outside the app and passes the single-use token through an approved channel.
export async function issueRecovery(actorId:string,userId:string){
  return sql.begin(async tx=>{
    if((await activeActor(actorId,tx))?.role!=='ADMIN')throw new ApiError(403,'FORBIDDEN','Solo Head emite recuperación de credenciales.');
    const token=randomBytes(32).toString('base64url');
    const [user]=await tx<{id:string}>`UPDATE pmo_cusn.usuario SET recovery_token_hash=${digest(token)},
      recovery_expires_at=now()+interval '30 minutes' WHERE id=${userId} AND activo RETURNING id::text`;
    if(!user)throw new ApiError(404,'NOT_FOUND','Usuario no encontrado.');
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},'usuarios.recuperacion.emitir','usuario',${userId},'PERMITIDO')`;
    return {userId,token,expiresInSeconds:1800,delivery:'PENDING'};
  });
}

export async function resetPassword(token:string,password:string){
  if(!/^[A-Za-z0-9_-]{43}$/.test(token)||password.length<14||password.length>1024)
    throw new ApiError(422,'INVALID_RECOVERY','Token o contraseña no válidos.');
  const hash=await Bun.password.hash(password,{algorithm:'argon2id'});
  return sql.begin(async tx=>{
    const [user]=await tx<{id:string}>`UPDATE pmo_cusn.usuario SET password_hash=${hash},recovery_token_hash=NULL,
      recovery_expires_at=NULL,refresh_token_hash=NULL,refresh_expires_at=NULL,
      session_version=session_version+1,failed_login_count=0,locked_until=NULL
      WHERE recovery_token_hash=${digest(token)} AND recovery_expires_at>now() AND activo RETURNING id::text`;
    if(!user)throw new ApiError(410,'RECOVERY_EXPIRED','Recuperación no vigente.');
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${user.id},'usuarios.recuperacion.aplicar','usuario',${user.id},'PERMITIDO')`;
    return {status:'PASSWORD_UPDATED'};
  });
}
