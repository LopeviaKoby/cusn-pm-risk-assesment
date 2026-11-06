import {strict as assert} from 'node:assert';
import {SQL} from 'bun';
if(Bun.env.NODE_ENV!=='test'||!Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_'))throw new Error('Solo BD aislada.');
const db=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});
const {handleRequest}=await import('../src/index');const {sql,closeDatabase}=await import('../src/db');
const mark=crypto.randomUUID(),password=Bun.env.TEST_PASSWORD!,hash=await Bun.password.hash(password,{algorithm:'argon2id'});
const send=(method:string,path:string,cookie?:string,body?:unknown)=>handleRequest(new Request('http://127.0.0.1:43001/api/v1/'+path,{method,headers:{origin:'http://127.0.0.1:4173',...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));
async function data(r:Response,status=200){const b=await r.json();assert.equal(r.status,status,JSON.stringify(b));assert.ok(!/password_hash|token_hash|private_key/.test(JSON.stringify(b)));return b.data;}
async function actor(role:string,external=false){
 const email=`billing-${crypto.randomUUID()}@example.invalid`;
 const [u]=await db<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash,tipo_usuario) VALUES (${email},'Prueba facturación',${hash},${external?'EXTERNO':'INTERNO'}) RETURNING id::text`;
 await db`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura) SELECT ${u!.id},id,${['ADMIN','PM'].includes(role)?'GLOBAL':'ASIGNADOS'} FROM pmo_cusn.rol WHERE codigo=${role}`;
 const r=await send('POST','sesion',undefined,{identifier:email,password});await data(r);
 return {id:u!.id,cookie:r.headers.getSetCookie().find(c=>c.startsWith('pmo_access='))!.split(';')[0]!};
}
try{
 const head=await actor('ADMIN'),owner=await actor('PM'),peer=await actor('PM'),observer=await actor('PM'),delegate=await actor('PM'),specialist=await actor('ESPECIALISTA'),viewer=await actor('VISUALIZADOR'),external=await actor('VISUALIZADOR',true);
 const w=await data(await send('POST','workspaces',owner.cookie,{nombre:`Facturacion ${mark}`}),201);
 await db`INSERT INTO pmo_cusn.membresia_workspace(workspace_id,usuario_id,estado) VALUES (${w.id},${observer.id},'ACTIVA')`;
 const client=await data(await send('POST','clientes',owner.cookie,{nombre:'Cliente financiero',estadoCliente:'NUEVO'}),201);
 const [country]=await db<{id:string}>`SELECT id::text FROM pmo_cusn.pais WHERE activo ORDER BY id LIMIT 1`;
 const [lob]=await db<{id:string}>`SELECT id::text FROM pmo_cusn.lob WHERE activo ORDER BY id LIMIT 1`;
 const projectInput={workspaceId:w.id,clienteId:client.id,paisId:country!.id,lobId:lob!.id,tvt:`BILL-${mark}`,nombre:'Facturación aislada',fechaInicio:'2026-01-01',fechaTerminoBaseline:'2026-12-31',condicionComercial:{tcvTipo:'DEFINIDO',tcvValor:'9999999999999999.1234',unidadCodigo:'USD'}};
 const p=await data(await send('POST','proyectos',owner.cookie,projectInput),201),other=await data(await send('POST','proyectos',owner.cookie,{...projectInput,tvt:`BILL-OTHER-${mark}`}),201);
 const path=`proyectos/${p.id}/facturacion`;
 const empty=await data(await send('GET',path+'?desde=2026-01&hasta=2026-12',owner.cookie));assert.deepEqual(empty.hitos,[]);assert.deepEqual(empty.totales,[]);assert.deepEqual(empty.porMes,[]);assert.equal(empty.estado,'SIN_HITOS');
 const absent=await data(await send('GET',path+'/indicadores?corte=2026-01',owner.cookie));assert.equal(absent.estado,'SIN_HITOS_EXIGIBLES');assert.deepEqual(absent.porMoneda,[]);
 const input={claveRegistro:crypto.randomUUID(),periodo:'2026-02',unidadCodigo:'USD',tipoHito:'Proyecto',tipoCuota:'SetUp',showprice:'100.1234',planificado:'100.0000',realReportado:'50.0000',comentario:'Reportado, no conciliado'};
 for(const u of [peer,observer,specialist,viewer,external]){
  assert.equal((await send('GET',path,u.cookie)).status,403);
  assert.equal((await send('POST',path+'/hitos',u.cookie,input)).status,403);
 }
 assert.equal((await send('GET',path)).status,401);
 const simultaneous=await Promise.all([send('POST',path+'/hitos',owner.cookie,input),send('POST',path+'/hitos',owner.cookie,input)]);
 const [first,retry]=await Promise.all(simultaneous.map(r=>data(r,201)));assert.equal(first.id,retry.id);assert.equal(first.planificado,'100.0000');
 assert.equal((await send('POST',path+'/hitos',owner.cookie,{...input,planificado:'101'})).status,409);
 for(const invalid of [{periodo:'2026-13'},{periodo:'2026-02-01'},{periodo:'0000-01'},{unidadCodigo:'ZZZ'},{showprice:5},{showprice:'1.00001'},{showprice:'-1'},{origen:'CAMBIO'},{tcvValor:'2'},{tipoHito:'Otro'}])assert.equal((await send('POST',path+'/hitos',owner.cookie,{...input,claveRegistro:crypto.randomUUID(),...invalid})).status,422);
 const uf=await data(await send('POST',path+'/hitos',head.cookie,{...input,claveRegistro:crypto.randomUUID(),unidadCodigo:'UF',showprice:'9007199254740993.1234',planificado:'10',realReportado:'5'}),201);
 const march=await data(await send('POST',path+'/hitos',owner.cookie,{...input,claveRegistro:crypto.randomUUID(),periodo:'2026-03',planificado:'100',realReportado:'100'}),201);
 const zero=await data(await send('POST',path+'/hitos',owner.cookie,{...input,claveRegistro:crypto.randomUUID(),unidadCodigo:'CLP',planificado:'0',realReportado:'0'}),201);
 assert.ok(march.id&&zero.id);assert.equal(uf.showprice,'9007199254740993.1234');
 const before=await data(await send('GET',path+'/indicadores?corte=2026-01',owner.cookie));assert.ok(before.porMoneda.every((r:{valor:null;estado:string})=>r.valor===null&&r.estado==='SIN_HITOS_EXIGIBLES'));
 const feb=await data(await send('GET',path+'/indicadores?corte=2026-02',owner.cookie));assert.equal(feb.porMoneda.find((r:{unidadCodigo:string})=>r.unidadCodigo==='USD').valor,'50.0000');assert.equal(feb.porMoneda.find((r:{unidadCodigo:string})=>r.unidadCodigo==='CLP').estado,'BASE_CERO_PENDIENTE_POLITICA');
 const mar=await data(await send('GET',path+'/indicadores?corte=2026-03',owner.cookie));assert.equal(mar.porMoneda.find((r:{unidadCodigo:string})=>r.unidadCodigo==='USD').valor,'75.0000');
 const summary=await data(await send('GET',path+'?desde=2026-01&hasta=2026-12&limit=1',owner.cookie));assert.equal(summary.hitos.length,1);assert.equal(summary.totales.length,3);assert.equal(summary.paginacion.total,4);assert.ok(summary.paginacion.nextCursor);
 assert.equal(summary.totales.find((r:{unidadCodigo:string})=>r.unidadCodigo==='USD').planificado,'200.0000');
 assert.equal(summary.totales.find((r:{unidadCodigo:string})=>r.unidadCodigo==='USD').realReportado,'150.0000');
 assert.equal(summary.totales.find((r:{unidadCodigo:string})=>r.unidadCodigo==='UF').showprice,'9007199254740993.1234');
 assert.equal((await send('GET',path+'?desde=2026-12&hasta=2026-01',owner.cookie)).status,422);
 assert.equal((await send('GET',path+'/indicadores?corte=2026-13',owner.cookie)).status,422);
 const [one]=await db<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.hito_facturacion WHERE proyecto_id=${p.id} AND clave_registro=${input.claveRegistro}::uuid`;assert.equal(one!.n,'1');
 const next=await data(await send('GET',path+`?desde=2026-01&hasta=2026-12&limit=100&after=${summary.paginacion.nextCursor}`,owner.cookie));assert.equal(next.hitos.length,3);assert.ok(next.hitos.every((r:{id:string})=>r.id!==first.id));
 assert.equal((await send('PATCH',`proyectos/${other.id}/facturacion/hitos/${first.id}`,owner.cookie,{...input,version:first.version})).status,404);
 const changes=await Promise.all([send('PATCH',path+`/hitos/${first.id}`,owner.cookie,{...input,version:first.version,realReportado:'60'}),send('PATCH',path+`/hitos/${first.id}`,owner.cookie,{...input,version:first.version,realReportado:'70'})]);assert.deepEqual(changes.map(r=>r.status).sort(),[200,409]);
 const delegation=await data(await send('POST',`proyectos/${p.id}/suplencias`,owner.cookie,{delegateId:delegate.id,start:new Date(Date.now()-1000).toISOString(),end:new Date(Date.now()+3600000).toISOString(),reason:'Prueba facturacion',permissions:['facturacion.reportar']}),201);
 await data(await send('POST',path+'/hitos',delegate.cookie,{...input,claveRegistro:crypto.randomUUID(),periodo:'2026-04'}),201);
 const [audit]=await db<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.auditoria_seguridad WHERE actor_id=${delegate.id} AND delegacion_id=${delegation.id} AND operacion='facturacion.crear'`;assert.equal(audit!.n,'1');
 await data(await send('POST',`proyectos/${p.id}/suplencias/${delegation.id}/revocacion`,owner.cookie));assert.equal((await send('GET',path,delegate.cookie)).status,403);
 const [contract]=await db<{value:string}>`SELECT tcv_valor::text value FROM pmo_cusn.condicion_comercial WHERE proyecto_id=${p.id}`;assert.equal(contract!.value,projectInput.condicionComercial.tcvValor);
 const [bad]=await db<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.hito_facturacion WHERE proyecto_id=${p.id} AND origen<>'MANUAL'`;assert.equal(bad!.n,'0');
 await assert.rejects(()=>sql`DELETE FROM pmo_cusn.hito_facturacion WHERE proyecto_id=${p.id}`);
 await assert.rejects(()=>sql`UPDATE pmo_cusn.condicion_comercial SET tcv_valor=1 WHERE proyecto_id=${p.id}`);
 console.log('PASS facturación HTTP/SQL: vacío, CPI null/base cero/corte inclusivo, precisión exacta USD/UF sin FX, alta/edición/versionado, reintento concurrente idempotente, BOLA, perfiles, suplencia/revocación/auditoría y TCV intacto.');
}finally{await db.close();await closeDatabase();}