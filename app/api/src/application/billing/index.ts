import type {SQL} from 'bun';
import {sql} from '../../db';
import {activeActor,assertPermission} from '../../authorization';
import {ApiError} from '../../errors';
import {billingGroups,billingIndicators,type BillingLine} from '../../domain/performance/billing';
export type BillingInput={claveRegistro:string;periodo:string;unidadCodigo:string;tipoHito:'Proyecto'|'Operación';tipoCuota:'SetUp'|'Recurrente';showprice:string;planificado:string;realReportado:string;comentario:string|null};
async function guard(tx:SQL,actorId:string,projectId:string){
 const actor=await activeActor(actorId,tx);
 if(!actor||actor.kind!=='INTERNO')throw new ApiError(403,'FORBIDDEN','Acceso financiero no autorizado.');
 await assertPermission(actorId,'proyectos.consultar',projectId,tx);
 // Financial detail is restricted to owner/effective delegate/Head, independent of global portfolio visibility.
 await assertPermission(actorId,'facturacion.reportar',projectId,tx);
}
async function rows(tx:SQL,projectId:string,from:string,to:string){
 const result=await tx<BillingLine>`SELECT id::text,to_char(periodo,'YYYY-MM') periodo,unidad_codigo AS "unidadCodigo",tipo_hito AS "tipoHito",tipo_cuota AS "tipoCuota",showprice::text,planificado::text,real_reportado::text AS "realReportado",comentario,origen,clave_registro::text AS "claveRegistro",version::text
 FROM pmo_cusn.hito_facturacion WHERE proyecto_id=${projectId} AND periodo>=${from+'-01'}::date AND periodo<=${to+'-01'}::date ORDER BY id LIMIT 10001`;
 if(result.length>10000)throw new ApiError(422,'WINDOW_TOO_LARGE','Reduce la ventana temporal: máximo 10000 hitos.');
 return result;
}
export async function queryBilling(actorId:string,projectId:string,q:{desde?:string;hasta?:string;limit?:string;after?:string}){
 const now=new Date().toISOString().slice(0,7),from=q.desde??now.slice(0,4)+'-01',to=q.hasta??now.slice(0,4)+'-12';
 if(from>to||Number(to.slice(0,4))*12+Number(to.slice(5))-Number(from.slice(0,4))*12-Number(from.slice(5))>59)throw new ApiError(422,'INVALID_WINDOW','Ventana de hasta 60 meses en orden ascendente.');
 return sql.begin(async tx=>{
  await guard(tx,actorId,projectId);
  const all=await rows(tx,projectId,from,to),limit=Number(q.limit??50),filtered=all.filter(r=>BigInt(r.id)>BigInt(q.after??'0')),items=filtered.slice(0,limit),hasMore=filtered.length>limit;
  const [contract]=await tx`SELECT tcv_tipo AS "tcvTipo",tcv_valor::text AS "tcvValor",unidad_codigo AS "unidadCodigo" FROM pmo_cusn.condicion_comercial WHERE proyecto_id=${projectId}`;
  return {proyectoId:projectId,contrato:contract??null,ventana:{desde:from,hasta:to},hitos:items,paginacion:{limit,total:all.length,hasMore,nextCursor:hasMore?items.at(-1)!.id:null},porMes:billingGroups(all,true),totales:billingGroups(all),estado:all.length?'CON_HITOS':'SIN_HITOS',notaReal:'REPORTADO_POR_GESTOR_NO_CONCILIADO_ERP'};
 });
}
export async function queryIndicators(actorId:string,projectId:string,cutoff:string){
 return sql.begin(async tx=>{await guard(tx,actorId,projectId);return {proyectoId:projectId,...billingIndicators(await rows(tx,projectId,'0001-01','9999-12'),cutoff)};});
}
export async function writeBilling(actorId:string,projectId:string,input:BillingInput,hitoId?:string,version?:string){
 return sql.begin(async tx=>{
  await tx`SELECT id FROM pmo_cusn.proyecto WHERE id=${projectId} AND activo FOR UPDATE`;
  await guard(tx,actorId,projectId);
  const [unit]=await tx`SELECT codigo FROM pmo_cusn.unidad_monetaria WHERE codigo=${input.unidadCodigo}`;
  if(!unit)throw new ApiError(422,'INVALID_CURRENCY','Moneda no admitida.');
  let actualId=hitoId;
  if(!hitoId){
   const [existing]=await tx<{id:string}>`SELECT id::text FROM pmo_cusn.hito_facturacion WHERE proyecto_id=${projectId} AND clave_registro=${input.claveRegistro}::uuid`;
   if(existing){
    const old=(await rows(tx,projectId,'0001-01','9999-12')).find(r=>r.id===existing.id)!;
    const equal=old.periodo===input.periodo&&old.unidadCodigo===input.unidadCodigo&&old.tipoHito===input.tipoHito&&old.tipoCuota===input.tipoCuota&&old.comentario===input.comentario;
    // Compare decimal values through PostgreSQL, preserving exact scale.
    const [same]=await tx<{ok:boolean}>`SELECT showprice=${input.showprice}::numeric AND planificado=${input.planificado}::numeric AND real_reportado=${input.realReportado}::numeric AS ok FROM pmo_cusn.hito_facturacion WHERE id=${existing.id}`;
    if(!equal||!same?.ok)throw new ApiError(409,'IDEMPOTENCY_CONFLICT','La clave ya identifica otro contenido.');
    return old;
   }
   const [created]=await tx<{id:string}>`INSERT INTO pmo_cusn.hito_facturacion(proyecto_id,periodo,unidad_codigo,tipo_hito,tipo_cuota,showprice,planificado,real_reportado,comentario,origen,clave_registro)
    VALUES (${projectId},${input.periodo+'-01'},${input.unidadCodigo},${input.tipoHito},${input.tipoCuota},${input.showprice},${input.planificado},${input.realReportado},${input.comentario},'MANUAL',${input.claveRegistro}::uuid) RETURNING id::text`;
   actualId=created!.id;
  }else{
   const [locked]=await tx<{version:string;origen:string;clave:string}>`SELECT version::text,origen,clave_registro::text clave FROM pmo_cusn.hito_facturacion WHERE id=${hitoId} AND proyecto_id=${projectId} FOR UPDATE`;
   if(!locked)throw new ApiError(404,'NOT_FOUND','Hito no encontrado en el proyecto.');
   if(locked.origen!=='MANUAL'||locked.version!==version||locked.clave!==input.claveRegistro)throw new ApiError(409,'VERSION_CONFLICT','Hito no manual, clave distinta o versión obsoleta.');
   await tx`UPDATE pmo_cusn.hito_facturacion SET periodo=${input.periodo+'-01'},unidad_codigo=${input.unidadCodigo},tipo_hito=${input.tipoHito},tipo_cuota=${input.tipoCuota},showprice=${input.showprice},planificado=${input.planificado},real_reportado=${input.realReportado},comentario=${input.comentario},version=version+1,updated_at=now() WHERE id=${hitoId} AND proyecto_id=${projectId}`;
  }
  const [delegation]=await tx<{id:string}>`SELECT d.id::text FROM pmo_cusn.delegacion_acceso d JOIN pmo_cusn.delegacion_permiso dp ON dp.delegacion_id=d.id JOIN pmo_cusn.permiso p ON p.id=dp.permiso_id WHERE d.proyecto_id=${projectId} AND d.delegado_id=${actorId} AND d.estado='ACTIVA' AND d.inicio<=now() AND d.fin>now() AND d.revocado_at IS NULL AND p.codigo='facturacion.reportar'`;
  await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,delegacion_id,proyecto_id,operacion,recurso_tipo,recurso_id,resultado) VALUES (${actorId},${delegation?.id??null},${projectId},${hitoId?'facturacion.editar':'facturacion.crear'},'hito_facturacion',${actualId},'PERMITIDO')`;
  return (await rows(tx,projectId,input.periodo,input.periodo)).find(r=>r.id===actualId)!;
 });
}