import { sql } from '../../db';
import { assertPermission, visibleProjects } from '../../authorization';
import { lockProject } from '../../repositories/writes';
import { complexity, type Factors } from '../../domain/complexity';
import { ApiError } from '../../errors';

export async function controls(actor:string) {
  const visible=await visibleProjects(actor);
  return sql`SELECT id::text,proyecto_id::text,folio,descripcion,estado_firma,estado_aprobacion,impacto_monetario::text,unidad_codigo
    FROM pmo_cusn.control_cambio WHERE proyecto_id::text=ANY(${[...visible]}::text[]) ORDER BY id DESC`;
}
export async function saveComplexity(actor:string,key:string,input:Factors & {override:boolean;motivo:string}) {
  return sql.begin(async tx=>{
    const p=await lockProject(tx,key);
    await assertPermission(actor,'complejidad.evaluar',p.key,tx);
    if(input.override)await assertPermission(actor,'complejidad.override',p.key,tx);
    const result=complexity({riesgo:input.riesgo,facturacion:input.facturacion,plazo:input.plazo,alcance:input.alcance},input.override?{reason:input.motivo,permitted:true}:undefined);
    const levels:Record<string,string>={Bajo:'BAJO',Medio:'MEDIO',Alto:'ALTO','Estratégico':'ESTRATEGICO'};
    await tx`INSERT INTO pmo_cusn.evaluacion_complejidad(proyecto_id,evaluador_id,riesgo,facturacion,plazo,alcance,indice_complejidad,tipificacion,override_estrategico,motivo_override,version_modelo)
      VALUES (${p.key},${actor},${input.riesgo},${input.facturacion},${input.plazo},${input.alcance},${result.index},${levels[result.level]},${input.override},${input.override?input.motivo:null},'V1')`;
    return result;
  });
}
export async function editPurchase(actor:string,id:string,budget:string|null,awarded:string|null) {
  return sql.begin(async tx=>{
    const [ref]=await tx<{project:string}>`SELECT proyecto_id::text project FROM pmo_cusn.compra WHERE id::text=${id}`;
    if(!ref)throw new ApiError(404,'NOT_FOUND','Compra no encontrada.');
    await lockProject(tx,ref.project);
    await assertPermission(actor,'compras.gestionar',ref.project,tx);
    const [row]=await tx`UPDATE pmo_cusn.compra SET presupuesto=${budget},monto_adjudicado=${awarded} WHERE id::text=${id} RETURNING id::text,presupuesto::text,monto_adjudicado::text,ahorro::text`;
    return row;
  });
}
