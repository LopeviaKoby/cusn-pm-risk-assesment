import { SQL } from "bun";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { migrate } from "../scripts/migrate";
import { verifyDatabase } from "../scripts/verify-db";

// Nunca insertar fixtures de permisos en la BD del laboratorio principal.
const url=Bun.env.TEST_DATABASE_URL;
if(!url||!/^\/pmo_test(?:_[a-z0-9]+)?$/.test(new URL(url).pathname)||Bun.env.NODE_ENV!=="test") {
  throw new Error("test:db exige NODE_ENV=test y TEST_DATABASE_URL a una BD pmo_test aislada.");
}
Bun.env.DATABASE_URL=url;
Bun.env.MIGRATOR_DATABASE_URL=url;
Bun.env.GPL_USER="fixture@example.invalid";
Bun.env.GPL_PASSWORD_HASH_B64=btoa(await Bun.password.hash("fixture-password-only"));
Bun.env.APP_ORIGINS="http://127.0.0.1:5173";
Bun.env.GPL_AS_OF_DATE="2026-11-02";
const db=new SQL({url,max:2});
const {hasPermission}=await import("../src/authorization");
const {editProject,editProjectRisk,resolvePlanChange}=await import("../src/repositories/writes");
const {approveEconomicChange,decidePlanChange}=await import("../src/infrastructure/database/changes");
const {handleRequest}=await import("../src/index");
const {closeDatabase}=await import("../src/db");
let checks=0;
const pass=(name:string)=>{checks++;console.log(`PASS ${name}`);};
async function rejects(tx:SQL,name:string,action:()=>Promise<unknown>){
  await tx.unsafe("SAVEPOINT expected_failure");
  let failed=false;
  try{await action();}catch{failed=true;}finally{await tx.unsafe("ROLLBACK TO SAVEPOINT expected_failure");await tx.unsafe("RELEASE SAVEPOINT expected_failure");}
  assert.ok(failed,name);pass(name);
}
async function rollback(name:string,action:(tx:SQL)=>Promise<void>){
  const sentinel=new Error('rollback fixture');
  try{await db.begin(async tx=>{await action(tx);throw sentinel;});}catch(e){if(e!==sentinel)throw e;}
  pass(name);
}
const project="9007199254740993",other="9007199254740994";
let actor="",approver="",delegate="",client="",country="",lob="",risk="";
try {
  await db`CREATE SCHEMA IF NOT EXISTS pmo`;
  await db`CREATE TABLE IF NOT EXISTS pmo.sentinel(value text PRIMARY KEY)`;
  await db`INSERT INTO pmo.sentinel VALUES ('intacto') ON CONFLICT DO NOTHING`;
  await migrate(db);
  const [empty]=await db<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.rol_permiso`;
  assert.equal(empty?.n,'0');pass('DDL no asigna permisos');
  await verifyDatabase(db);
  const [scalars]=await db<{amount:string;identifier:string;civil_day:Date;payload:{verified:boolean}}>`SELECT 1234567890123456.7890::numeric(20,4) amount,9007199254740993::bigint identifier,'2026-10-20'::date AS civil_day,'{"verified":true}'::jsonb payload`;
  assert.equal(scalars?.amount,'1234567890123456.7890');assert.equal(scalars.identifier,'9007199254740993');
  assert.equal(scalars.civil_day.toISOString().slice(0,10),'2026-10-20');assert.deepEqual(scalars.payload,{verified:true});
  pass('tipos reales Bun: numeric, bigint, fecha civil y jsonb');
  const [initial]=await db<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.proyecto`;
  assert.equal(initial?.n,'0','Usar una BD de pruebas nueva, sin fixtures previos');
  await db.begin(async tx=>{
    const users=await tx<{id:string}>`INSERT INTO pmo_cusn.usuario(nombre,email) VALUES ('Fixture editor','fixture@example.invalid'),('Fixture aprobador','approver@example.invalid'),('Fixture delegado','delegate@example.invalid') RETURNING id::text`;
    actor=users[0]!.id;approver=users[1]!.id;delegate=users[2]!.id;
    const [c]=await tx<{id:string}>`INSERT INTO pmo_cusn.cliente(nombre) VALUES ('Cliente fixture') RETURNING id::text`;client=c!.id;
    const [p]=await tx<{id:string}>`INSERT INTO pmo_cusn.pais(codigo,nombre) VALUES ('TST','País fixture') RETURNING id::text`;country=p!.id;
    const [l]=await tx<{id:string}>`INSERT INTO pmo_cusn.lob(nombre) VALUES ('LOB fixture') RETURNING id::text`;lob=l!.id;
    await tx`INSERT INTO pmo_cusn.proyecto(id,tvt,nombre,cliente_id,pais_id,lob_id,fecha_inicio,fecha_termino_baseline,fecha_termino_actual) OVERRIDING SYSTEM VALUE
      VALUES (${project},'TEST-1','Proyecto fixture',${client},${country},${lob},'2026-01-01','2026-12-01','2026-12-01'),(${other},'TEST-2','Proyecto ajeno',${client},${country},${lob},'2026-01-01','2026-12-01','2026-12-01')`;
    assert.equal(await hasPermission(actor,'proyectos.consultar',project,tx),false);pass('sin concesiones se deniega incluso con usuario válido');
    // Matriz SOLO de pruebas. No forma parte de migraciones/seeds.
    await tx`INSERT INTO pmo_cusn.rol_permiso(rol_id,permiso_id) SELECT r.id,p.id FROM pmo_cusn.rol r CROSS JOIN pmo_cusn.permiso p
      WHERE (r.codigo='PM' AND p.codigo IN ('proyectos.consultar','proyectos.editar','seguimiento.registrar','riesgos.gestionar','cambios.solicitar','cambios.crear','proyectos.cerrar')) OR (r.codigo='ADMIN' AND p.codigo IN ('cambios.aprobar','riesgos_globales.gestionar','facturacion.reportar','riesgos.gestionar'))`;
    await tx`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance,proyecto_id) SELECT ${actor},id,'PROYECTO',${project} FROM pmo_cusn.rol WHERE codigo='PM'`;
    await tx`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance,proyecto_id) SELECT ${approver},id,'PROYECTO',${project} FROM pmo_cusn.rol WHERE codigo='ADMIN'`;
    await tx`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance) SELECT ${actor},id,'GLOBAL' FROM pmo_cusn.rol WHERE codigo='ADMIN'`;
    await tx`INSERT INTO pmo_cusn.riesgo_global(nombre,probabilidad_sugerida,impacto_sugerido) VALUES ('Riesgo global fixture',2,3)`;
    const [r]=await tx<{id:string}>`INSERT INTO pmo_cusn.riesgo_proyecto(proyecto_id,nombre) VALUES (${project},'Riesgo fixture') RETURNING id::text`;risk=r!.id;
    await tx`INSERT INTO pmo_cusn.evaluacion_riesgo(riesgo_proyecto_id,tipo_evaluacion,probabilidad,impacto) VALUES (${risk},'INICIAL',2,3)`;
    await tx`INSERT INTO pmo_cusn.condicion_comercial(proyecto_id,tcv_tipo,tcv_valor,unidad_codigo) VALUES (${project},'DEFINIDO',1234567890123456.7890,'USD')`;
    await tx`INSERT INTO pmo_cusn.hito_facturacion(proyecto_id,periodo,unidad_codigo,planificado,real_reportado) VALUES (${project},'2026-01-01','USD',0.1000,0.2000),(${project},'2026-02-01','USD',0.2000,0.3000)`;
  });
  await rollback('integridad SQL',async tx=>{
    const [secondLob]=await tx<{id:string}>`INSERT INTO pmo_cusn.lob(nombre) VALUES ('LOB ajeno') RETURNING id::text`;
    const [service]=await tx<{id:string}>`INSERT INTO pmo_cusn.servicio_lob(lob_id,nombre) VALUES (${secondLob!.id},'Servicio ajeno') RETURNING id::text`;
    await rejects(tx,'asociación LOB/servicio rechaza cruce',()=>tx`INSERT INTO pmo_cusn.proyecto_servicio_lob VALUES (${project},${service!.id},${lob})`);
    const [c]=await tx<{id:string}>`INSERT INTO pmo_cusn.cliente(nombre) VALUES ('Otro cliente') RETURNING id::text`;
    const [contact]=await tx<{id:string}>`INSERT INTO pmo_cusn.contacto_cliente(cliente_id,nombre) VALUES (${c!.id},'Contacto ajeno') RETURNING id::text`;
    await rejects(tx,'contacto/cliente rechaza cruce',()=>tx`INSERT INTO pmo_cusn.proyecto_contacto VALUES (${project},${contact!.id},${client},'Contacto')`);
    await rejects(tx,'EUR rechazado',()=>tx`INSERT INTO pmo_cusn.unidad_monetaria VALUES ('EUR','MONEDA')`);
    await rejects(tx,'escala riesgo 5 rechazada',()=>tx`INSERT INTO pmo_cusn.evaluacion_riesgo(riesgo_proyecto_id,tipo_evaluacion,probabilidad,impacto) VALUES (${risk},'REVISION',5,1)`);
    await rejects(tx,'severidad generada no acepta escritura',()=>tx`INSERT INTO pmo_cusn.evaluacion_riesgo(riesgo_proyecto_id,tipo_evaluacion,probabilidad,impacto,severidad) VALUES (${risk},'REVISION',2,2,16)`);
    await tx`INSERT INTO pmo_cusn.servicio_operativo(proyecto_id) VALUES (${project})`;
    await rejects(tx,'máximo un servicio operativo',()=>tx`INSERT INTO pmo_cusn.servicio_operativo(proyecto_id) VALUES (${project})`);
    await rejects(tx,'cierre APTO sin evidencia rechazado por DDL',()=>tx`INSERT INTO pmo_cusn.validacion_cierre(proyecto_id,resultado) VALUES (${project},'APTO')`);
  });
  await rollback('autorización y delegación',async tx=>{
    assert.equal(await hasPermission(actor,'proyectos.editar',project,tx),true);
    assert.equal(await hasPermission(actor,'proyectos.editar',other,tx),false);pass('escritura acotada al proyecto asignado');
    await rejects(tx,'servicio rechaza edición ajena',()=>editProject(tx,other,{nombre:'Invasión'},actor));
    const [d]=await tx<{id:string}>`INSERT INTO pmo_cusn.delegacion_acceso(delegante_id,delegado_id,autorizado_por_id,alcance,proyecto_id,inicio,fin,motivo,estado)
      VALUES (${actor},${delegate},${approver},'PROYECTO',${project},now()-interval '1 hour',now()+interval '1 hour','Fixture explícito','ACTIVA') RETURNING id::text`;
    await tx`INSERT INTO pmo_cusn.delegacion_permiso SELECT ${d!.id},id FROM pmo_cusn.permiso WHERE codigo='proyectos.editar'`;
    assert.equal(await hasPermission(delegate,'proyectos.editar',project,tx),true);pass('delegación activa concede permiso delegable y acotado');
    assert.equal(await hasPermission(delegate,'proyectos.editar',other,tx),false);
    await tx`UPDATE pmo_cusn.delegacion_acceso SET inicio=now()-interval '2 hour',fin=now()-interval '1 hour' WHERE id=${d!.id}`;
    assert.equal(await hasPermission(delegate,'proyectos.editar',project,tx),false);pass('delegación vencida denegada');
    await tx`UPDATE pmo_cusn.delegacion_acceso SET fin=now()+interval '1 hour',estado='REVOCADA' WHERE id=${d!.id}`;
    assert.equal(await hasPermission(delegate,'proyectos.editar',project,tx),false);pass('delegación revocada denegada');
  });
  await rollback('estado y evento atómicos',async tx=>{
    await editProject(tx,project,{estado:'En ejecución'},actor);
    const [s]=await tx<{estado_actual:string;n:string}>`SELECT estado_actual,(SELECT count(*)::text FROM pmo_cusn.evento_proyecto WHERE proyecto_id=${project}) n FROM pmo_cusn.proyecto WHERE id=${project}`;
    assert.equal(s?.estado_actual,'En ejecución');assert.equal(s.n,'1');
    await rejects(tx,'evento UPDATE inmutable',()=>tx`UPDATE pmo_cusn.evento_proyecto SET motivo='cambio' WHERE proyecto_id=${project}`);
    await rejects(tx,'evento DELETE inmutable',()=>tx`DELETE FROM pmo_cusn.evento_proyecto WHERE proyecto_id=${project}`);
    await rejects(tx,'cierre sin flujo de evidencia denegado en servicio',()=>editProject(tx,project,{estado:'Cerrado exitoso'},actor));
  });
  // Fallo real de INSERT del evento después del UPDATE del proyecto.
  await rollback('fallo del evento revierte estado',async tx=>{
    await tx`ALTER TABLE pmo_cusn.evento_proyecto ADD CONSTRAINT fixture_event_failure CHECK (tipo_evento <> 'CAMBIO_ESTADO')`;
    await rejects(tx,'fallo de evento revierte operación completa',()=>editProject(tx,project,{estado:'Detenido'},actor));
    const [s]=await tx<{estado_actual:string}>`SELECT estado_actual FROM pmo_cusn.proyecto WHERE id=${project}`;
    assert.equal(s?.estado_actual,'Requiere P1P2');
  });
  await rollback('riesgo se evalúa sin mutar severidad',async tx=>{
    await editProjectRisk(tx,project,risk,{probabilidad:4,impacto:3,estado:'Controlado'},actor);
    const [e]=await tx<{severidad:number;n:string}>`SELECT severidad,(SELECT count(*)::text FROM pmo_cusn.evaluacion_riesgo WHERE riesgo_proyecto_id=${risk}) n FROM pmo_cusn.evaluacion_riesgo WHERE riesgo_proyecto_id=${risk} ORDER BY id DESC LIMIT 1`;
    assert.equal(e?.severidad,12);assert.equal(e.n,'2');
    await rejects(tx,'escala API 5 denegada',()=>editProjectRisk(tx,project,risk,{probabilidad:5},actor));
  });
  await rollback('CC y planificación transaccional',async tx=>{
    const [cc]=await tx<{id:string}>`INSERT INTO pmo_cusn.control_cambio(proyecto_id,secuencia,folio,fecha_elaboracion,descripcion,urgencia,estado_firma) VALUES (${project},1,'CC-1',CURRENT_DATE,'Fixture CC','MEDIA','FIRMADO') RETURNING id::text`;
    const request=async()=>{
      const [s]=await tx<{id:string}>`INSERT INTO pmo_cusn.solicitud_cambio_planificacion(proyecto_id,control_cambio_id,solicitante_id,campo,valor_anterior,valor_propuesto) VALUES (${project},${cc!.id},${actor},'FECHA_TERMINO','2026-12-01','2027-01-01') RETURNING id::text`;return s!.id;
    };
    await tx`UPDATE pmo_cusn.control_cambio SET estado_firma='PENDIENTE' WHERE id=${cc!.id}`;
    await rejects(tx,'CC sin firma no respalda solicitud',request);
    await tx`UPDATE pmo_cusn.control_cambio SET estado_firma='FIRMADO' WHERE id=${cc!.id}`;
    const first=await request();
    await rejects(tx,'CC reserva pendiente única',request);
    await resolvePlanChange(tx,first,'RECHAZADO',approver);
    const second=await request();pass('rechazo libera CC para nueva solicitud');
    await rejects(tx,'sin permiso no se aprueba',()=>resolvePlanChange(tx,second,'APROBADO',delegate));
    await tx`ALTER TABLE pmo_cusn.solicitud_cambio_planificacion ADD CONSTRAINT fixture_resolution_failure CHECK (estado <> 'APROBADO')`;
    await rejects(tx,'fallo de resolución revierte modificación de fecha',()=>resolvePlanChange(tx,second,'APROBADO',approver));
    const [unchanged]=await tx<{value:string}>`SELECT fecha_termino_actual::text value FROM pmo_cusn.proyecto WHERE id=${project}`;
    assert.equal(unchanged?.value,'2026-12-01');
    await tx`ALTER TABLE pmo_cusn.solicitud_cambio_planificacion DROP CONSTRAINT fixture_resolution_failure`;
    await resolvePlanChange(tx,second,'APROBADO',approver);
    const [result]=await tx<{value:string;estado:string}>`SELECT p.fecha_termino_actual::text value,s.estado FROM pmo_cusn.proyecto p JOIN pmo_cusn.solicitud_cambio_planificacion s ON s.proyecto_id=p.id WHERE s.id=${second}`;
    assert.equal(result?.value,'2027-01-01');assert.equal(result.estado,'APROBADO');pass('aprobación actualiza fecha y resolución');
    await rejects(tx,'CC aprobado no se reutiliza',request);
    await rejects(tx,'CC consumido inmutable',()=>tx`UPDATE pmo_cusn.control_cambio SET descripcion='alterado' WHERE id=${cc!.id}`);
    await rejects(tx,'solicitud resuelta no se actualiza',()=>tx`UPDATE pmo_cusn.solicitud_cambio_planificacion SET valor_propuesto='2027-02-01' WHERE id=${second}`);
    await rejects(tx,'solicitud resuelta no se elimina',()=>tx`DELETE FROM pmo_cusn.solicitud_cambio_planificacion WHERE id=${second}`);
  });
  // Pruebas HTTP con el handler real, cookies reales y SQL real, sin abrir puerto.
  const login=await handleRequest(new Request('http://localhost/api/v1/sesion',{method:'POST',headers:{origin:'http://127.0.0.1:5173'},body:JSON.stringify({identifier:'fixture@example.invalid',password:'fixture-password-only'})}));
  assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie')!.split(';')[0]!;
  const http=async(path:string,method='GET',body?:unknown)=>handleRequest(new Request('http://localhost/api/v1/'+path,{method,headers:{cookie,origin:'http://127.0.0.1:5173'},body:body===undefined?undefined:JSON.stringify(body)}));
  await db`INSERT INTO pmo_cusn.rol_permiso(rol_id,permiso_id) SELECT r.id,p.id FROM pmo_cusn.rol r CROSS JOIN pmo_cusn.permiso p WHERE r.codigo='PM' AND p.codigo IN ('complejidad.evaluar','compras.gestionar') ON CONFLICT DO NOTHING`;
  assert.equal((await http('controles-cambio')).status,200);
  assert.equal((await http(`proyectos/${project}/prevalidacion-cierre`)).status,200);
  assert.equal((await http(`proyectos/${project}/complejidad`,'POST',{riesgo:3,facturacion:3,plazo:3,alcance:3,override:false,motivo:''})).status,200);
  assert.equal((await http(`proyectos/${project}/complejidad`,'POST',{riesgo:3,facturacion:3,plazo:3,alcance:3,override:true,motivo:'Fixture'})).status,403);
  const [vendor]=await db<{id:string}>`INSERT INTO pmo_cusn.proveedor(nombre) VALUES ('Proveedor UI') RETURNING id::text`;
  const [purchaseUi]=await db<{id:string}>`INSERT INTO pmo_cusn.compra(proyecto_id,proveedor_id) VALUES (${project},${vendor!.id}) RETURNING id::text`;
  const savedPurchase=await http(`compras/${purchaseUi!.id}`,'PATCH',{presupuesto:'123.4567',montoAdjudicado:'0'});
  assert.equal(savedPurchase.status,200);assert.equal(((await savedPurchase.json()) as {data:{ahorro:string}}).data.ahorro,'123.4567');pass('contratos UI: prevalidación, CC, complejidad autorizada y compra cero');
  assert.equal((await handleRequest(new Request('http://localhost/api/v1/proyectos'))).status,401);pass('HTTP sin sesión 401');
  for(const path of ['catalogos','datos','proyectos',`proyectos/${project}`,`proyectos/${project}/historial`,'riesgos','riesgos/globales/1',`proyectos/${project}/riesgos`,`proyectos/${project}/riesgos/${risk}`,'facturacion','compras','cambios-planificacion']) {
    const response=await http(path);assert.equal(response.status,200,path);await response.json();
  }pass('smoke GET de todas las rutas existentes');
  const list=await (await http('proyectos')).json() as {data:{id:string;tcv:{amount:string};acv:{amount:string}}[]};
  assert.deepEqual(list.data.map(r=>r.id),[project]);assert.equal(list.data[0]!.tcv.amount,'1234567890123456.7890');assert.equal(list.data[0]!.acv.amount,'0.3000');pass('HTTP consulta acotada, bigint y decimal exactos (incluye 0.1+0.2)');
  assert.equal((await http(`proyectos/${other}`)).status,404);
  assert.equal((await http(`proyectos/${project}`,'PATCH',{nombre:'Editado HTTP'})).status,200);
  assert.equal((await http(`proyectos/${project}`,'PATCH',{nombre:123})).status,422);
  assert.equal((await http(`proyectos/${project}`,'PATCH',{fechaTerminoProyecto:'2027-01-01'})).status,409);
  assert.equal((await http(`proyectos/${project}`,'PATCH',{campoInexistente:true})).status,400);
  assert.equal((await http(`proyectos/${other}`,'PATCH',{nombre:'No permitido'})).status,403);
  assert.equal((await http(`proyectos/${project}/riesgos/${risk}`,'PATCH',{probabilidad:3,impacto:4})).status,200);
  assert.equal((await http(`proyectos/${project}/riesgos/${risk}`,'PATCH',{probabilidad:5})).status,422);
  assert.equal((await http('riesgos/globales/1','PATCH',{nombre:'Global editado',probabilidad:4})).status,200);
  assert.equal((await http('riesgos/globales/1','PATCH',{estado:'Controlado'})).status,400);
  // Nuevos flujos: permisos explícitos en esta BD aislada, nunca en el seed principal.
  assert.equal((await http(`proyectos/${project}/cierre`,'POST',{})).status,409);pass('cierre sin checklist/lección denegado');
  const [item]=await db<{id:string}>`INSERT INTO pmo_cusn.item_checklist_proyecto(proyecto_id,nombre,requiere_documento,completado)
    VALUES (${project},'Acta final',true,true) RETURNING id::text`;
  await db`INSERT INTO pmo_cusn.leccion_aprendida(proyecto_id,titulo,leccion) VALUES (${project},'Lección fixture','Contenido válido')`;
  await db`UPDATE pmo_cusn.riesgo_proyecto SET estado='Mitigado',estrategia='Transferir' WHERE id=${risk}`;
  assert.equal((await http(`proyectos/${project}/cierre`,'POST',{})).status,409);pass('cierre exige documento vigente');
  const [doc]=await db<{id:string}>`INSERT INTO pmo_cusn.documento(drive_file_id,nombre,mime_type) VALUES ('fixture-drive-id','Acta','application/pdf') RETURNING id::text`;
  await db`INSERT INTO pmo_cusn.item_checklist_documento(item_checklist_id,documento_id) VALUES (${item!.id},${doc!.id})`;
  const transverse=await http('riesgos/transversales','POST',{riesgoGlobalId:'1',nombre:'Riesgo portafolio',probabilidad:2,impacto:4});
  assert.equal(transverse.status,201);const transverseData=await transverse.json() as {data:{id:string;entidad:string;proyectoId:null;severidad:number}};
  assert.equal(transverseData.data.entidad,'RIESGO_PROYECTO');assert.equal(transverseData.data.proyectoId,null);assert.equal(transverseData.data.severidad,8);
  assert.equal((await http(`riesgos/transversales/${transverseData.data.id}`,'PATCH',{estado:'Contingencia',probabilidad:4})).status,200);
  assert.equal((await http('riesgos/transversales')).status,200);pass('riesgo transversal evaluable separado del catálogo');
  let concurrentClosure:Promise<Response>|undefined;
  await db.begin(async tx=>{
    await tx`UPDATE pmo_cusn.item_checklist_proyecto SET completado=false WHERE id=${item!.id}`;
    concurrentClosure=http(`proyectos/${project}/cierre`,'POST',{});
    await new Promise(resolve=>setTimeout(resolve,50));
  });
  assert.equal((await concurrentClosure!).status,409);pass('cierre concurrente ve checklist actualizado');
  await db`UPDATE pmo_cusn.item_checklist_proyecto SET completado=true WHERE id=${item!.id}`;
  await db.begin(async tx=>{
    await tx`UPDATE pmo_cusn.riesgo_proyecto SET estado='Pendiente' WHERE id=${risk}`;
    concurrentClosure=http(`proyectos/${project}/cierre`,'POST',{});
    await new Promise(resolve=>setTimeout(resolve,50));
  });
  assert.equal((await concurrentClosure!).status,409);pass('cierre concurrente ve riesgo actualizado');
  await db`UPDATE pmo_cusn.riesgo_proyecto SET estado='Mitigado' WHERE id=${risk}`;
  await db`ALTER TABLE pmo_cusn.evento_proyecto ADD CONSTRAINT fixture_closure_event_failure CHECK (tipo_evento <> 'CIERRE')`;
  try {
    assert.equal((await http(`proyectos/${project}/cierre`,'POST',{})).status,422);
    const [rolledBack]=await db<{state:string;validations:string}>`SELECT estado_actual state,
      (SELECT count(*)::text FROM pmo_cusn.validacion_cierre WHERE proyecto_id=${project} AND resultado='APTO') validations
      FROM pmo_cusn.proyecto WHERE id=${project}`;
    assert.equal(rolledBack?.state,'Requiere P1P2');assert.equal(rolledBack.validations,'0');pass('fallo de evento revierte cierre y validación');
  } finally { await db`ALTER TABLE pmo_cusn.evento_proyecto DROP CONSTRAINT fixture_closure_event_failure`; }
  const closed=await http(`proyectos/${project}/cierre`,'POST',{});assert.equal(closed.status,200);
  const closedData=await closed.json() as {data:{state:string}};assert.equal(closedData.data.state,'Cerrado con observaciones');
  const [stamp]=await db<{close_day:string;close_month:string;events:string}>`SELECT fecha_cierre_real::text close_day,periodo_cierre_mes close_month,
    (SELECT count(*)::text FROM pmo_cusn.evento_proyecto WHERE proyecto_id=${project} AND tipo_evento='CIERRE') events FROM pmo_cusn.proyecto WHERE id=${project}`;
  assert.match(stamp!.close_day,/^\d{4}-\d{2}-\d{2}$/);assert.equal(stamp?.close_month,stamp!.close_day.slice(0,7));assert.equal(stamp?.events,'1');pass('cierre, fecha y evento atómicos');
  await rollback('evidencias cerradas protegidas',async tx=>{
    await rejects(tx,'checklist cerrado inmutable',()=>tx`UPDATE pmo_cusn.item_checklist_proyecto SET completado=false WHERE id=${item!.id}`);
    await rejects(tx,'riesgo cerrado inmutable',()=>tx`UPDATE pmo_cusn.riesgo_proyecto SET estado='Pendiente' WHERE id=${risk}`);
    await rejects(tx,'vínculo documental cerrado inmutable',()=>tx`DELETE FROM pmo_cusn.item_checklist_documento WHERE item_checklist_id=${item!.id}`);
    await rejects(tx,'documento de cierre no se archiva',()=>tx`UPDATE pmo_cusn.documento SET estado_registro='ARCHIVADO' WHERE id=${doc!.id}`);
    await rejects(tx,'evaluación de riesgo cerrado inmutable',()=>tx`INSERT INTO pmo_cusn.evaluacion_riesgo(riesgo_proyecto_id,tipo_evaluacion,probabilidad,impacto) VALUES (${risk},'REVISION',2,2)`);
  });
  assert.equal((await http(`proyectos/${project}/reapertura`,'POST',{motivo:'Fixture'})).status,200);
  const [reopened]=await db<{state:string;close_day:string|null;close_month:string|null}>`SELECT estado_actual state,fecha_cierre_real::text close_day,periodo_cierre_mes close_month FROM pmo_cusn.proyecto WHERE id=${project}`;
  assert.equal(reopened?.state,'En ejecución');assert.equal(reopened.close_day,null);assert.equal(reopened.close_month,null);pass('reapertura limpia fecha y mes');
  const [ccEconomic]=await db<{id:string}>`INSERT INTO pmo_cusn.control_cambio(proyecto_id,secuencia,folio,fecha_elaboracion,descripcion,urgencia,estado_firma,impacto_monetario,tipo_impacto,unidad_codigo)
    VALUES (${project},2,'CC-ECON',CURRENT_DATE,'Cambio económico fixture','MEDIA','FIRMADO',12.3400,'COSTO_TIVIT','USD') RETURNING id::text`;
  const requested=await http(`proyectos/${project}/cambios-planificacion`,'POST',{campo:'FECHA_TERMINO',valorPropuesto:'2027-01-01',controlCambioId:ccEconomic!.id});
  assert.equal(requested.status,201);const requestData=await requested.json() as {data:{id:string}};
  await decidePlanChange(requestData.data.id,'APROBADO',approver);
  const [planned]=await db<{baseline:string;current:string}>`SELECT fecha_termino_baseline::text baseline,fecha_termino_actual::text current FROM pmo_cusn.proyecto WHERE id=${project}`;
  assert.equal(planned?.baseline,'2026-12-01');assert.equal(planned.current,'2027-01-01');pass('solicitud HTTP aprobada conserva baseline');
  const economic=await approveEconomicChange(ccEconomic!.id,'2026-11',approver);
  assert.ok(economic.billingId);assert.deepEqual(await approveEconomicChange(ccEconomic!.id,'2026-11',approver),economic);
  await assert.rejects(()=>approveEconomicChange(ccEconomic!.id,'2026-12',approver));
  const [contribution]=await db<{amount:string;origin:string;count:string}>`SELECT real_reportado::text amount,origen origin,
    (SELECT count(*)::text FROM pmo_cusn.hito_facturacion WHERE control_cambio_id=${ccEconomic!.id}) count
    FROM pmo_cusn.hito_facturacion WHERE id=${economic.billingId}`;
  assert.equal(contribution?.amount,'-12.3400');assert.equal(contribution.origin,'CAMBIO');assert.equal(contribution.count,'1');pass('CC económico posterior al consumo: aporte único, signo e idempotencia');
  const [ccConcurrent]=await db<{id:string}>`INSERT INTO pmo_cusn.control_cambio(proyecto_id,secuencia,folio,fecha_elaboracion,descripcion,urgencia,estado_firma,impacto_monetario,tipo_impacto,unidad_codigo)
    VALUES (${project},3,'CC-CONCURRENT',CURRENT_DATE,'Cambio concurrente fixture','MEDIA','FIRMADO',0.0000,'BENEFICIO','USD') RETURNING id::text`;
  const concurrent=await Promise.all([approveEconomicChange(ccConcurrent!.id,'2026-11',approver),approveEconomicChange(ccConcurrent!.id,'2026-11',approver)]);
  assert.equal(concurrent[0]?.billingId,concurrent[1]?.billingId);
  const [once]=await db<{n:string;amount:string}>`SELECT count(*)::text n,max(real_reportado)::text amount FROM pmo_cusn.hito_facturacion WHERE control_cambio_id=${ccConcurrent!.id}`;
  assert.equal(once?.n,'1');assert.equal(once.amount,'0.0000');pass('aprobaciones simultáneas generan un único aporte, incluso cero');
  await assert.rejects(()=>approveEconomicChange(ccConcurrent!.id,'2026-13',approver));pass('período económico inválido rechazado');
  await rollback('cálculos generados SQL',async tx=>{
    const [provider]=await tx<{id:string}>`INSERT INTO pmo_cusn.proveedor(nombre) VALUES ('Proveedor fixture') RETURNING id::text`;
    const [purchase]=await tx<{saving:string}>`INSERT INTO pmo_cusn.compra(proyecto_id,proveedor_id,presupuesto,monto_adjudicado)
      VALUES (${project},${provider!.id},100.0000,0.0000) RETURNING ahorro::text saving`;
    assert.equal(purchase?.saving,'100.0000');pass('ahorro generado con adjudicación cero');
    const [followup]=await tx<{spi:string}>`INSERT INTO pmo_cusn.seguimiento_proyecto(proyecto_id,fecha_registro,avance_planificado,avance_real)
      VALUES (${project},CURRENT_DATE,0.01,100.00) RETURNING spi::text`;
    assert.equal(followup?.spi,'1000000.0000');pass('SPI generado soporta extremo válido');
  });
  await rollback('nuevas garantías SQL',async tx=>{
    await rejects(tx,'baseline inmutable',()=>tx`UPDATE pmo_cusn.proyecto SET fecha_termino_baseline='2027-01-01' WHERE id=${project}`);
    await tx`INSERT INTO pmo_cusn.seguimiento_proyecto(proyecto_id,fecha_registro,avance_planificado,avance_real)
      VALUES (${project},CURRENT_DATE,50,40)`;
    await rejects(tx,'seguimiento append-only',()=>tx`UPDATE pmo_cusn.seguimiento_proyecto SET avance_real=80 WHERE proyecto_id=${project}`);
  });
  await db`UPDATE pmo_cusn.asignacion_rol SET activo=false WHERE usuario_id=${actor}`;
  assert.equal((await http('proyectos')).status,403);pass('HTTP sin permisos se deniega con sesión válida');
  await db`UPDATE pmo_cusn.asignacion_rol SET activo=true WHERE usuario_id=${actor}`;
  pass('smoke PATCH válidos/invalidos, recurso ajeno y fecha protegida');
  const before=await db<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.proyecto`;
  await migrate(db);
  assert.deepEqual(await db`SELECT count(*)::text n FROM pmo_cusn.proyecto`,before);pass('segunda migración no pierde datos');
  assert.deepEqual(Array.from(await db`SELECT value FROM pmo.sentinel`),[{value:'intacto'}]);pass('pmo intacto en instalación y repetición');
  const resetScript=resolve(import.meta.dirname,'../scripts/reset-dev.ts');
  const resetEnv={...process.env,NODE_ENV:'development',MIGRATOR_DATABASE_URL:url,PMO_ALLOW_RESET:'pmo_cusn',PMO_DEV_DATABASE:new URL(url).pathname.slice(1)};
  await db`CREATE SCHEMA reset_external_fixture`;
  try {
    await db`CREATE TABLE reset_external_fixture.reference(id bigint REFERENCES pmo_cusn.proyecto(id))`;
    const blocked=spawnSync(process.execPath,['run',resetScript,'--schema=pmo_cusn'],{env:resetEnv,encoding:'utf8'});
    assert.notEqual(blocked.status,0);assert.match(blocked.stderr,/Dependencias/);
    pass('reset rechaza dependencias ajenas');
  } finally {
    await db`DROP TABLE IF EXISTS reset_external_fixture.reference`;
    await db`DROP SCHEMA reset_external_fixture`;
  }
  for(const [name,schema,environment] of [['esquema pmo','pmo','development'],['producción','pmo_cusn','production']]) {
    const blocked=spawnSync(process.execPath,['run',resetScript,`--schema=${schema}`],{env:{...resetEnv,NODE_ENV:environment},encoding:'utf8'});
    assert.notEqual(blocked.status,0);pass(`reset rechaza ${name}`);
  }
  assert.deepEqual(await db`SELECT count(*)::text n FROM pmo_cusn.proyecto`,before);
  await verifyDatabase(db);
  console.log(`${checks} comprobaciones pasaron en PostgreSQL real aislado.`);
}finally{await closeDatabase();await db.close();}
