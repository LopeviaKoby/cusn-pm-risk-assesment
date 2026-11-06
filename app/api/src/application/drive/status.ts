import {sql} from '../../db';
import {activeActor,assertPermission} from '../../authorization';
import {ApiError} from '../../errors';
export async function driveStatus(actorId:string,projectId:string){
 return sql.begin(async tx=>{
  const actor=await activeActor(actorId,tx);
  if(!actor||actor.kind!=='INTERNO')throw new ApiError(403,'FORBIDDEN','Referencias documentales no autorizadas.');
  await assertPermission(actorId,'proyectos.consultar',projectId,tx);
  await assertPermission(actorId,'proyectos.editar',projectId,tx);
  const [job]=await tx<{estado:string;intentos:number;errorCodigo:string|null;updatedAt:Date}>`SELECT estado,intentos,error_codigo AS "errorCodigo",updated_at AS "updatedAt" FROM pmo_cusn.drive_provisionamiento WHERE proyecto_id=${projectId}`;
  const folders=await tx<{clave:string;driveId:string;parentDriveId:string;ruta:string;checkedAt:Date;errorCodigo:string|null}>`SELECT clave_nodo clave,drive_id AS "driveId",parent_drive_id AS "parentDriveId",ruta,checked_at AS "checkedAt",error_codigo AS "errorCodigo" FROM pmo_cusn.drive_carpeta WHERE proyecto_id=${projectId} ORDER BY clave_nodo`;
  return {proyectoId:projectId,estado:job?.estado??'NO_SOLICITADO',intentos:job?.intentos??0,errorCodigo:job?.errorCodigo??null,updatedAt:job?.updatedAt.toISOString()??null,carpetas:folders.map(f=>({...f,checkedAt:f.checkedAt.toISOString(),webViewLink:'https://drive.google.com/drive/folders/'+encodeURIComponent(f.driveId)})),nota:'REFERENCIAS_NO_VERIFICAN_CONTENIDO_NI_ACL_DEL_USUARIO'};
 });
}