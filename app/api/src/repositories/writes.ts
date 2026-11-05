import type { SQL } from "bun";
import { sql } from "../db";
import { ApiError } from "../errors";
import { assertPermission } from "../authorization";
import { PROJECT_STATES, RISK_STATES, RISK_STRATEGIES } from "../domain";
import { isClosedProject } from '../domain/projects/state';
import { getGlobalRisk, getProject, getProjectRisk, getTransverseRisks } from "./read";
import type { ProyectoRow, EvaluacionRiesgoRow, SolicitudCambioPlanificacionRow } from "../models";

type Patch = Record<string,unknown>;
type Row = Record<string,unknown>;
const required = (value:unknown,field:string):string => {
  if(typeof value!=="string"||!value.trim()||value.length>5000) throw new ApiError(422,"INVALID_FIELD",`${field} debe ser texto no vacío (máximo 5000 caracteres).`);
  return value.trim();
};
const optional=(value:unknown,field:string):string|null=>value===null||value===""?null:required(value,field);
function fields(patch:Patch,allowed:readonly string[]) {
  if(!Object.keys(patch).length)throw new ApiError(400,"EMPTY_PATCH","No se indicaron cambios.");
  for(const key of Object.keys(patch))if(!allowed.includes(key))throw new ApiError(400,"UNKNOWN_FIELD",`Campo no permitido: ${key}`);
}
function choice(value:unknown,field:string,values:readonly string[]):string {
  const result=required(value,field);
  if(!values.includes(result))throw new ApiError(422,"INVALID_FIELD",`Valor no válido para ${field}.`);
  return result;
}
function scale(value:unknown,field:string):number {
  if(typeof value!=="number"||!Number.isInteger(value)||value<1||value>4)throw new ApiError(422,"INVALID_SCALE",`${field} debe ser entero entre 1 y 4.`);
  return value;
}
function percent(value:unknown,field:string):string {
  if(typeof value!=="number"||!Number.isFinite(value)||value<0||value>100)throw new ApiError(422,"INVALID_PERCENT",`${field} debe estar entre 0 y 100 y no puede ser nulo.`);
  return value.toFixed(2);
}
export function civilDate(value:unknown):string {
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new ApiError(422,"INVALID_DATE","Fecha civil no válida.");
  return value;
}
export async function lockProject(tx:SQL,key:string):Promise<ProyectoRow & Row & {key:string}> {
  const [p]=await tx<ProyectoRow & Row & {key:string}>`SELECT *,id::text AS key FROM pmo_cusn.proyecto WHERE (id::text=${key} OR tvt=${key}) AND activo FOR UPDATE`;
  if(!p)throw new ApiError(404,"NOT_FOUND","Proyecto no encontrado.");
  return p;
}

// Solo se invoca dentro de una transacción; se exporta para pruebas de rollback real.
export async function editProject(tx:SQL,key:string,patch:Patch,actor:string):Promise<string> {
  fields(patch,["nombre","estado","avancePlanificadoPct","avanceRealPct","actividades","proximosPasos","fechaTerminoProyecto"]);
  const p=await lockProject(tx,key),pid=String(p.key);
  await assertPermission(actor,"proyectos.editar",pid,tx);
  await assertPermission(actor,"proyectos.consultar",pid,tx);
  if(isClosedProject(String(p.estado_actual)))throw new ApiError(409,'PROJECT_CLOSED','Reabre el proyecto antes de modificarlo.');
  if("fechaTerminoProyecto" in patch)throw new ApiError(409,"PLAN_CHANGE_REQUIRED","Los cambios de fecha requieren una solicitud de planificación aprobada.");
  if("nombre" in patch)await tx`UPDATE pmo_cusn.proyecto SET nombre=${required(patch.nombre,"nombre")},updated_at=now() WHERE id=${pid}`;
  if("estado" in patch) {
    const state=choice(patch.estado,"estado",PROJECT_STATES);
    if(state!==p.estado_actual) {
      // El producto aún no expone validación/evidencias de cierre. Denegar en servidor.
      if(state.startsWith("Cerrado"))throw new ApiError(409,"CLOSURE_EVIDENCE_REQUIRED","El cierre requiere un flujo de validación y evidencias aún no habilitado.");
      await tx`UPDATE pmo_cusn.proyecto SET estado_actual=${state},updated_at=now() WHERE id=${pid}`;
      await tx`INSERT INTO pmo_cusn.evento_proyecto(proyecto_id,actor_id,tipo_evento,estado_anterior,estado_nuevo,detalle)
        VALUES (${pid},${actor},'CAMBIO_ESTADO',${p.estado_actual},${state},${JSON.stringify({estadoAnterior:p.estado_actual,estadoNuevo:state})}::jsonb)`;
    }
  }
  if(["avancePlanificadoPct","avanceRealPct","actividades","proximosPasos"].some(k=>k in patch)) {
    await assertPermission(actor,"seguimiento.registrar",pid,tx);
    const [s]=await tx<Row>`SELECT * FROM pmo_cusn.seguimiento_proyecto WHERE proyecto_id=${pid} ORDER BY fecha_registro DESC,id DESC LIMIT 1`;
    const plan="avancePlanificadoPct" in patch?percent(patch.avancePlanificadoPct,"avancePlanificadoPct"):s?.avance_planificado;
    const real="avanceRealPct" in patch?percent(patch.avanceRealPct,"avanceRealPct"):s?.avance_real;
    if(plan==null||real==null)throw new ApiError(422,"PROGRESS_REQUIRED","El seguimiento exige ambos porcentajes; no se inventa el faltante.");
    await tx`INSERT INTO pmo_cusn.seguimiento_proyecto(proyecto_id,registrado_por,fecha_registro,avance_planificado,avance_real,actividades,proximos_pasos)
      VALUES (${pid},${actor},(now() AT TIME ZONE 'America/Santiago')::date,${plan},${real},${"actividades" in patch?optional(patch.actividades,"actividades"):s?.actividades??null},${"proximosPasos" in patch?optional(patch.proximosPasos,"proximosPasos"):s?.proximos_pasos??null})`;
  }
  return pid;
}
export async function updateProject(key:string,patch:Patch,actor:string) {
  const pid=await sql.begin(tx=>editProject(tx,key,patch,actor));
  return getProject(actor,pid);
}

export async function editProjectRisk(tx:SQL,project:string,risk:string,patch:Patch,actor:string):Promise<string> {
  fields(patch,["nombre","estado","categoria","probabilidad","impacto","estrategia","planMitigacion","planContingencia","responsableNombre","responsableId"]);
  const p=await lockProject(tx,project),pid=String(p.key);
  await assertPermission(actor,"riesgos.gestionar",pid,tx);
  await assertPermission(actor,"proyectos.consultar",pid,tx);
  if(isClosedProject(String(p.estado_actual)))throw new ApiError(409,'PROJECT_CLOSED','Reabre el proyecto antes de modificar sus riesgos.');
  const [r]=await tx<Row>`SELECT id::text FROM pmo_cusn.riesgo_proyecto WHERE proyecto_id=${pid} AND id::text=${risk} FOR UPDATE`;
  if(!r)throw new ApiError(404,"NOT_FOUND","Riesgo del proyecto no encontrado.");
  const sets:string[]=[],params:unknown[]=[];
  const set=(col:string,val:unknown)=>{params.push(val);sets.push(`${col}=$${params.length}`);};
  if("nombre" in patch)set("nombre",required(patch.nombre,"nombre"));
  if("estado" in patch)set("estado",choice(patch.estado,"estado",RISK_STATES));
  if("estrategia" in patch)set("estrategia",patch.estrategia===null?null:choice(patch.estrategia,"estrategia",RISK_STRATEGIES));
  for(const [k,col] of [["categoria","categoria"],["planMitigacion","plan_mitigacion"],["planContingencia","plan_contingencia"]] as const)if(k in patch)set(col,optional(patch[k],k));
  if("responsableNombre" in patch||"responsableId" in patch) {
    let owner:string|null=null;
    if(patch.responsableId!=null) {
      const key=required(patch.responsableId,"responsableId");
      const [u]=await tx<{id:string}>`SELECT id::text FROM pmo_cusn.usuario WHERE id::text=${key} AND activo`;
      if(!u)throw new ApiError(422,"INVALID_OWNER","Usuario no encontrado.");owner=u.id;
    }else if(patch.responsableNombre!=null&&patch.responsableNombre!=="") {
      const name=required(patch.responsableNombre,"responsableNombre");
      const users=await tx<{id:string}>`SELECT id::text FROM pmo_cusn.usuario WHERE nombre=${name} AND activo`;
      if(users.length!==1)throw new ApiError(422,"INVALID_OWNER","El nombre debe identificar exactamente un usuario existente.");owner=users[0]!.id;
    }
    set("responsable_id",owner);
  }
  if(sets.length)await tx.unsafe(`UPDATE pmo_cusn.riesgo_proyecto SET ${sets.join(",")},updated_at=now() WHERE id=$${params.length+1}`,[...params,r.id]);
  if("probabilidad" in patch||"impacto" in patch) {
    const [e]=await tx<Pick<EvaluacionRiesgoRow,"probabilidad"|"impacto">>`SELECT probabilidad,impacto FROM pmo_cusn.evaluacion_riesgo WHERE riesgo_proyecto_id=${r.id} ORDER BY fecha_evaluacion DESC,id DESC LIMIT 1`;
    const probability=scale("probabilidad" in patch?patch.probabilidad:e?.probabilidad,"probabilidad");
    const impact=scale("impacto" in patch?patch.impacto:e?.impacto,"impacto");
    await tx`INSERT INTO pmo_cusn.evaluacion_riesgo(riesgo_proyecto_id,evaluador_id,tipo_evaluacion,probabilidad,impacto)
      VALUES (${r.id},${actor},'REVISION',${probability},${impact})`;
  }
  return pid;
}
export async function updateProjectRisk(project:string,risk:string,patch:Patch,actor:string) {
  const pid=await sql.begin(tx=>editProjectRisk(tx,project,risk,patch,actor));
  return getProjectRisk(actor,pid,risk);
}
export async function updateGlobalRisk(risk:string,patch:Patch,actor:string) {
  fields(patch,["nombre","descripcion","categoria","probabilidad","impacto"]);
  await sql.begin(async tx=>{
    await assertPermission(actor,"riesgos_globales.gestionar",null,tx);
    const [r]=await tx`SELECT id FROM pmo_cusn.riesgo_global WHERE id::text=${risk} FOR UPDATE`;
    if(!r)throw new ApiError(404,"NOT_FOUND","Riesgo global no encontrado.");
    const cols:Record<string,string>={nombre:"nombre",descripcion:"descripcion",categoria:"categoria",probabilidad:"probabilidad_sugerida",impacto:"impacto_sugerido"};
    const values=Object.keys(patch).map(k=>k==="nombre"?required(patch[k],k):k==="probabilidad"||k==="impacto"?scale(patch[k],k):optional(patch[k],k));
    await tx.unsafe(`UPDATE pmo_cusn.riesgo_global SET ${Object.keys(patch).map((k,i)=>`${cols[k]}=$${i+1}`).join(",")} WHERE id::text=$${values.length+1}`,[...values,risk]);
  });
  return getGlobalRisk(actor,risk);
}

export async function createTransverseRisk(input:Patch,actor:string) {
  fields(input,["riesgoGlobalId","nombre","descripcion","categoria","probabilidad","impacto","estrategia"]);
  const globalId=required(input.riesgoGlobalId,"riesgoGlobalId");
  const name=required(input.nombre,"nombre");
  const probability="probabilidad" in input?scale(input.probabilidad,"probabilidad"):null;
  const impact="impacto" in input?scale(input.impacto,"impacto"):null;
  if((probability===null)!==(impact===null))throw new ApiError(422,"INVALID_SCALE","Probabilidad e impacto deben registrarse juntos.");
  const id=await sql.begin(async tx=>{
    await assertPermission(actor,"riesgos.gestionar",null,tx);
    const [global]=await tx`SELECT id FROM pmo_cusn.riesgo_global WHERE id::text=${globalId} AND activo`;
    if(!global)throw new ApiError(422,"INVALID_REFERENCE","Catálogo global inexistente.");
    const [created]=await tx<{id:string}>`INSERT INTO pmo_cusn.riesgo_proyecto
      (riesgo_global_id,es_transversal,nombre,descripcion,categoria,estrategia)
      VALUES (${globalId},true,${name},${"descripcion" in input?optional(input.descripcion,"descripcion"):null},${"categoria" in input?optional(input.categoria,"categoria"):null},${"estrategia" in input?choice(input.estrategia,"estrategia",RISK_STRATEGIES):null}) RETURNING id::text`;
    if(probability!==null&&impact!==null)await tx`INSERT INTO pmo_cusn.evaluacion_riesgo(riesgo_proyecto_id,evaluador_id,tipo_evaluacion,probabilidad,impacto)
      VALUES (${created!.id},${actor},'INICIAL',${probability},${impact})`;
    return created!.id;
  });
  return (await getTransverseRisks(actor)).find(r=>r.id===id);
}

export async function updateTransverseRisk(key:string,patch:Patch,actor:string) {
  fields(patch,["nombre","estado","categoria","probabilidad","impacto","estrategia","planMitigacion","planContingencia"]);
  await sql.begin(async tx=>{
    await assertPermission(actor,"riesgos.gestionar",null,tx);
    const [risk]=await tx<{id:string}>`SELECT id::text FROM pmo_cusn.riesgo_proyecto WHERE id::text=${key} AND proyecto_id IS NULL AND es_transversal FOR UPDATE`;
    if(!risk)throw new ApiError(404,"NOT_FOUND","Riesgo transversal no encontrado.");
    const pairs: [string,unknown][]=[];
    if("nombre" in patch)pairs.push(["nombre",required(patch.nombre,"nombre")]);
    if("estado" in patch)pairs.push(["estado",choice(patch.estado,"estado",RISK_STATES)]);
    if("estrategia" in patch)pairs.push(["estrategia",patch.estrategia===null?null:choice(patch.estrategia,"estrategia",RISK_STRATEGIES)]);
    for(const [keyName,column] of [["categoria","categoria"],["planMitigacion","plan_mitigacion"],["planContingencia","plan_contingencia"]] as const)
      if(keyName in patch)pairs.push([column,optional(patch[keyName],keyName)]);
    if(pairs.length)await tx.unsafe(`UPDATE pmo_cusn.riesgo_proyecto SET ${pairs.map(([column],i)=>`${column}=$${i+1}`).join(',')},updated_at=now() WHERE id=$${pairs.length+1}`,[...pairs.map(([,value])=>value),key]);
    if("probabilidad" in patch||"impacto" in patch){
      const [previous]=await tx<{probabilidad:number;impacto:number}>`SELECT probabilidad,impacto FROM pmo_cusn.evaluacion_riesgo WHERE riesgo_proyecto_id=${key} ORDER BY fecha_evaluacion DESC,id DESC LIMIT 1`;
      const probability=scale("probabilidad" in patch?patch.probabilidad:previous?.probabilidad,"probabilidad");
      const impact=scale("impacto" in patch?patch.impacto:previous?.impacto,"impacto");
      await tx`INSERT INTO pmo_cusn.evaluacion_riesgo(riesgo_proyecto_id,evaluador_id,tipo_evaluacion,probabilidad,impacto) VALUES (${key},${actor},'REVISION',${probability},${impact})`;
    }
  });
  return (await getTransverseRisks(actor)).find(r=>r.id===key);
}

export async function resolvePlanChange(tx:SQL,key:string,decision:"APROBADO"|"RECHAZADO",actor:string):Promise<void> {
  // Bloquear proyecto antes de solicitud: orden compartido con la edición de proyecto.
  const [ref]=await tx<{proyecto_id:string}>`SELECT proyecto_id::text FROM pmo_cusn.solicitud_cambio_planificacion WHERE id::text=${key}`;
  if(!ref)throw new ApiError(404,"NOT_FOUND","Solicitud no encontrada.");
  const project=await lockProject(tx,ref.proyecto_id);
  await assertPermission(actor,"cambios.aprobar",ref.proyecto_id,tx);
  if(isClosedProject(String(project.estado_actual)))throw new ApiError(409,'PROJECT_CLOSED','Reabre el proyecto antes de resolver fechas.');
  const [s]=await tx<SolicitudCambioPlanificacionRow>`SELECT * FROM pmo_cusn.solicitud_cambio_planificacion WHERE id::text=${key} FOR UPDATE`;
  if(!s||s.estado!=="PENDIENTE")throw new ApiError(409,"RESOLVED_REQUEST","La solicitud ya fue resuelta.");
  if(String(s.solicitante_id)===actor)throw new ApiError(403,"SEPARATION_OF_DUTIES","Solicitante y aprobador deben ser distintos.");
  if(decision==="APROBADO") {
    const columns:Record<string,string>={FECHA_INICIO:"fecha_inicio",FECHA_TERMINO:"fecha_termino_actual",FECHA_OPERACION_INICIO:"fecha_inicio",FECHA_OPERACION_TERMINO:"fecha_termino"};
    const column=columns[String(s.campo)];
    if(!column)throw new ApiError(422,"INVALID_FIELD","Campo de fecha no válido.");
    const operation=String(s.campo).startsWith("FECHA_OPERACION");
    let current=project[column];
    if(operation){const [op]=await tx<Row>`SELECT * FROM pmo_cusn.servicio_operativo WHERE proyecto_id=${ref.proyecto_id} FOR UPDATE`;if(!op)throw new ApiError(409,"OPERATION_REQUIRED","No existe servicio operativo.");current=op[column];}
    const toDate=(v:unknown)=>v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10);
    if(current==null||toDate(current)!==toDate(s.valor_anterior))throw new ApiError(409,"STALE_PLAN_CHANGE","La fecha vigente cambió desde la solicitud.");
    await tx.unsafe(`UPDATE pmo_cusn.${operation?"servicio_operativo":"proyecto"} SET ${column}=$1 WHERE ${operation?"proyecto_id":"id"}=$2`,[s.valor_propuesto,ref.proyecto_id]);
  }
  await tx`UPDATE pmo_cusn.solicitud_cambio_planificacion SET estado=${decision},fecha_resolucion=now(),aprobador_id=${actor} WHERE id::text=${key}`;
}
