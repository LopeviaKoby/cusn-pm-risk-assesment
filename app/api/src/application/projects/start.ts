import {sql} from '../../db';
import {assertPermission} from '../../authorization';
import {ApiError} from '../../errors';
export async function startExecution(actorId:string,projectId:string,version:string){
 return sql.begin(async tx=>{
  const [p]=await tx<{version:string;estado:string;workspaceId:string;complete:boolean}>`SELECT p.version::text,p.estado_actual estado,p.workspace_id::text AS "workspaceId",
    (p.fecha_inicio IS NOT NULL AND p.fecha_termino_baseline IS NOT NULL AND EXISTS(SELECT 1 FROM pmo_cusn.condicion_comercial c WHERE c.proyecto_id=p.id)) complete
    FROM pmo_cusn.proyecto p WHERE p.id=${projectId} AND p.activo FOR UPDATE`;
  await assertPermission(actorId,'proyectos.editar',projectId,tx);
  if(!p)throw new ApiError(404,'NOT_FOUND','Proyecto no encontrado.');
  if(p.version!==version||p.estado!=='Requiere P1P2')throw new ApiError(409,'START_CONFLICT','El proyecto cambio o ya fue iniciado.');
  if(!p.complete)throw new ApiError(422,'INCOMPLETE_PROJECT','Faltan planificacion o contrato inicial.');
  const [delegation]=await tx<{id:string}>`SELECT d.id::text FROM pmo_cusn.delegacion_acceso d JOIN pmo_cusn.delegacion_permiso dp ON dp.delegacion_id=d.id JOIN pmo_cusn.permiso pe ON pe.id=dp.permiso_id
    WHERE d.proyecto_id=${projectId} AND d.delegado_id=${actorId} AND d.estado='ACTIVA' AND d.inicio<=now() AND d.fin>now() AND d.revocado_at IS NULL AND pe.codigo='proyectos.editar' FOR SHARE OF d`;
  await tx`INSERT INTO pmo_cusn.evento_proyecto(proyecto_id,actor_id,tipo_evento,estado_anterior,estado_nuevo,detalle)
    VALUES (${projectId},${actorId},'INICIO_EJECUCION','Requiere P1P2','En ejecución',${{zona:'America/Santiago',delegacionId:delegation?.id??null}}::jsonb)`;
  const [row]=await tx`UPDATE pmo_cusn.proyecto SET estado_actual='En ejecución',fecha_inicio_real=(transaction_timestamp() AT TIME ZONE 'America/Santiago')::date,version=version+1,updated_at=now()
    WHERE id=${projectId} RETURNING id::text,tvt,nombre,workspace_id::text AS "workspaceId",version::text`;
  await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,delegacion_id,workspace_id,proyecto_id,operacion,recurso_tipo,recurso_id,resultado)
    VALUES (${actorId},${delegation?.id??null},${p.workspaceId},${projectId},'proyectos.iniciar','proyecto',${projectId},'PERMITIDO')`;
  return row;
 });
}