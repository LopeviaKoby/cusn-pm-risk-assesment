import {registrationFixture} from './registration-fixture';
import {strict as assert} from 'node:assert';
import {SQL} from 'bun';
import {z} from 'zod';
import {inputs} from '../src/infrastructure/http/contracts';

if(Bun.env.NODE_ENV!=='test'||!Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_'))throw new Error('Solo BD aislada.');
const fixture=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});
const password=Bun.env.TEST_PASSWORD!;
const hash=await Bun.password.hash(password,{algorithm:'argon2id'});
const mark=crypto.randomUUID();
let serial=0;
async function user(role:string,scope='ASIGNADOS',kind='INTERNO'){
  const email=`matrix-${++serial}-${mark}@example.invalid`;
  const [u]=await fixture<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash,tipo_usuario)
    VALUES (${email},'Matriz de acceso',${hash},${kind}) RETURNING id::text`;
  await fixture`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura)
    SELECT ${u!.id},id,${scope} FROM pmo_cusn.rol WHERE codigo=${role}`;
  return {id:u!.id,email,cookie:'',refresh:''};
}
const head=await user('ADMIN','GLOBAL'),owner=await user('PM','GLOBAL'),peer=await user('PM','GLOBAL'),
  specialist=await user('ESPECIALISTA'),viewer=await user('VISUALIZADOR'),globalViewer=await user('VISUALIZADOR','GLOBAL'),external=await user('VISUALIZADOR','ASIGNADOS','EXTERNO'),invitee=await user('VISUALIZADOR');
const [catalog]=await fixture<{clienteId:string;paisId:string;lobId:string}>`SELECT cliente_id::text AS "clienteId",pais_id::text AS "paisId",lob_id::text AS "lobId" FROM pmo_cusn.proyecto LIMIT 1`;
assert.ok(catalog);
const {app,handleRequest}=await import('../src/index');
const {sql,closeDatabase}=await import('../src/db');
const {hasPermission}=await import('../src/authorization');
const send=(method:string,path:string,cookie?:string,body?:unknown)=>handleRequest(new Request(`http://127.0.0.1:43001/api/v1/${path}`,{
  method,headers:{origin:'http://127.0.0.1:4173',...(cookie?{cookie}:{}),...(body!==undefined?{'content-type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(registrationFixture(method,path,body))}));
async function data<T>(response:Response,status=200):Promise<T>{
  const json=await response.json();assert.equal(response.status,status,JSON.stringify(json));
  assert.ok(!/password_hash|token_hash|session_version|recovery_expires|locked_until/.test(JSON.stringify(json)),'No secretos ni campos internos');
  return json.data as T;
}
try{
  for(const actor of [head,owner,peer,specialist,viewer,globalViewer,external,invitee]){
    const r=await send('POST','sesion',undefined,{identifier:actor.email,password});
    await data(r);actor.cookie=r.headers.getSetCookie().find(v=>v.startsWith('pmo_access='))!.split(';')[0]!;
    actor.refresh=r.headers.getSetCookie().find(v=>v.startsWith('pmo_refresh='))!.split(';')[0]!;
  }
  const w=await data<{id:string}>(await send('POST','workspaces',owner.cookie,{nombre:`Matriz ${mark}`}),201);
  const other=await data<{id:string}>(await send('POST','workspaces',peer.cookie,{nombre:`Ajeno ${mark}`}),201);
  for(const actor of [peer,specialist,viewer,external])await fixture`INSERT INTO pmo_cusn.membresia_workspace(workspace_id,usuario_id,incorporado_por_id)
    VALUES (${w.id},${actor.id},${head.id})`;
  const create=(workspaceId:string,tvt:string)=>({...catalog,workspaceId,tvt,nombre:'Proyecto matriz'});
  const p=await data<{id:string;version:string}>(await send('POST','proyectos',owner.cookie,create(w.id,`M-${mark}`)),201);
  const q=await data<{id:string;version:string}>(await send('POST','proyectos',peer.cookie,create(other.id,`Q-${mark}`)),201);
  for(const [actor,funcion] of [[specialist,'ESPECIALISTA'],[viewer,'OBSERVADOR'],[external,'OBSERVADOR']] as const)
    await data(await send('POST',`proyectos/${p.id}/participantes`,owner.cookie,{userId:actor.id,funcion}),201);
  // T04: creation enablement in the same workspace never confers ownership of p.
  await data(await send('POST',`workspaces/${w.id}/miembros/${peer.id}/habilitacion-creacion`,head.cookie,{habilitado:true}));
  await data(await send('POST','proyectos',peer.cookie,create(w.id,`EN-${mark}`)),201);
  assert.equal((await send('PATCH',`proyectos/${p.id}`,peer.cookie,{version:p.version,nombre:'Prohibido'})).status,403);
  const [denial]=await fixture<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.auditoria_seguridad
    WHERE actor_id=${peer.id} AND operacion='http.denegado' AND resultado='DENEGADO'`;
  assert.ok(Number(denial?.n)>0,'Denegación persistida fuera del rollback');
  console.log('PASS T04 completo: creación habilitada y edición ajena 403 en mismo workspace.');
  // T05: distinct workspace locks; the SQL global unique constraint resolves the race.
  const race=`RACE-${mark}`;
  const concurrent=await Promise.all([send('POST','proyectos',owner.cookie,create(w.id,` ${race.toLowerCase()} `)),send('POST','proyectos',peer.cookie,create(other.id,race))]);
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[201,409]);
  const [persisted]=await fixture<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.proyecto WHERE tvt_normalizado=${race.toUpperCase()}`;
  assert.equal(persisted?.n,'1');console.log('PASS T05 concurrente: 201/409; exactamente un TVT persiste.');
  assert.equal((await send('POST',`proyectos/${p.id}/transferencia`,head.cookie,{workspaceId:w.id,pmTitularId:external.id,version:p.version})).status,422);
  assert.equal((await send('POST',`usuarios/${external.id}/rol`,head.cookie,{rol:'PM',alcance:'ASIGNADOS'})).status,422);
  assert.equal((await send('POST','proyectos',external.cookie,create(w.id,`EXT-${mark}`))).status,403);
  assert.equal((await send('POST','workspaces',external.cookie,{nombre:'No permitido'})).status,403);
  const [stillOwner]=await fixture<{id:string}>`SELECT usuario_id::text id FROM pmo_cusn.participacion_proyecto
    WHERE proyecto_id=${p.id} AND funcion='PM_TITULAR' AND fecha_fin IS NULL`;
  assert.equal(stillOwner?.id,owner.id);console.log('PASS T07 externo: transferencia/rol PM rechazados, sin titularidad ni creación corporativa.');
  for(const actor of [head,owner,peer,globalViewer]){
    await data(await send('GET',`proyectos/${p.id}`,actor.cookie));await data(await send('GET',`proyectos/${q.id}`,actor.cookie));
  }
  for(const actor of [specialist,viewer,external]){
    await data(await send('GET',`proyectos/${p.id}`,actor.cookie));
    assert.equal((await send('GET',`proyectos/${q.id}`,actor.cookie)).status,403);
    const listed=await data<Array<{id:string}>>(await send('GET','proyectos?limit=100',actor.cookie));
    assert.deepEqual(listed.map(r=>r.id),[p.id]);
    assert.equal((await send('PATCH',`proyectos/${p.id}`,actor.cookie,{version:p.version,nombre:'No'})).status,403);
    assert.equal(await hasPermission(actor.id,'documentos.consultar',p.id),false);
  }
  assert.equal((await send('POST',`workspaces/${w.id}/invitaciones`,peer.cookie,{email:`no-${mark}@example.invalid`,rol:'ESPECIALISTA'})).status,201);
  await data(await send('POST',`workspaces/${w.id}/miembros/${peer.id}/habilitacion-creacion`,head.cookie,{habilitado:false}));
  assert.equal((await send('POST',`workspaces/${w.id}/invitaciones`,peer.cookie,{email:`no2-${mark}@example.invalid`,rol:'ESPECIALISTA'})).status,403);
  console.log('PASS matriz lectura/escritura por perfil, workspace ajeno, observador y documentos denegados.');
  for(const [path,body] of [['proyectos',{...create(w.id,`BAD-${mark}`),rol:'ADMIN'}],[`proyectos/${p.id}`,{nombre:'No',version:p.version,workspaceId:other.id}]])
    assert.equal((await send(path==='proyectos'?'POST':'PATCH',path as string,owner.cookie,body)).status,422);
  assert.equal((await send('POST','sesion',undefined,{identifier:owner.email,password,rol:'ADMIN'})).status,422);
  for(const query of ['limit=0','limit=101','after=-1','after=9223372036854775808','workspaceId=1'])assert.equal((await send('GET',`proyectos?${query}`,owner.cookie)).status,422);
  assert.equal((await send('GET','proyectos/999999999999999999999999',owner.cookie)).status,422);
  assert.equal((await send('GET','proyectos/9223372036854775808',owner.cookie)).status,422);
  assert.equal((await send('GET','proyectos/9223372036854775807',head.cookie)).status,404);
  const paged=await data<Array<{id:string}>>(await send('GET','proyectos?limit=1&after=0',head.cookie));assert.equal(paged.length,1);
  const spec=await (await send('GET','openapi.json')).json() as {openapi:string;paths:Record<string,Record<string,{requestBody?:{content:Record<string,{schema:unknown}>}}>>};
  assert.equal(spec.openapi,'3.1.0');
  assert.deepEqual(spec.paths['/api/v1/proyectos']!.post!.requestBody!.content['application/json']!.schema,z.toJSONSchema(inputs.project));
  for(const route of app.routes){if(route.method==='ALL'||route.path==='*'||route.path==='/api/v1/openapi.json')continue;
    const path=route.path.replace(/:([A-Za-z]+)/g,'{$1}');assert.ok(spec.paths[path]?.[route.method.toLowerCase()],route.method+' '+path);}
  console.log('PASS DTO estricto, mass assignment, filtros, ausencia de secretos y OpenAPI/handlers/Zod.');
  const inv=await data<{id:string;token:string}>(await send('POST',`workspaces/${w.id}/invitaciones`,owner.cookie,{email:invitee.email,rol:'VISUALIZADOR'}),201);
  const accept=await Promise.all([send('POST','invitaciones/aceptar',invitee.cookie,{token:inv.token}),send('POST','invitaciones/aceptar',invitee.cookie,{token:inv.token})]);
  assert.deepEqual(accept.map(r=>r.status).sort(),[200,410]);
  const [membership]=await fixture<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.membresia_workspace WHERE workspace_id=${w.id} AND usuario_id=${invitee.id}`;
  assert.equal(membership?.n,'1');
  await data(await send('POST',`usuarios/${specialist.id}/rol`,head.cookie,{rol:'VISUALIZADOR',alcance:'ASIGNADOS'}));
  assert.equal((await send('GET',`proyectos/${p.id}`,specialist.cookie)).status,401);
  await data(await send('POST',`usuarios/${external.id}/desactivacion`,head.cookie));
  assert.equal((await send('GET','sesion',external.cookie)).status,401);
  assert.equal((await send('POST','sesion/renovar',external.refresh)).status,401);
  for(const statement of ['CREATE TABLE pmo_cusn.privilege_probe(id int)','UPDATE pmo_cusn.rol_permiso SET rol_id=rol_id','UPDATE pmo_cusn.auditoria_seguridad SET operacion=operacion','DELETE FROM pmo_cusn.auditoria_seguridad','DELETE FROM pmo_cusn.proyecto','UPDATE pmo_cusn.compra SET descripcion=descripcion']){
    await assert.rejects(()=>sql.unsafe(statement),(error:unknown)=>(error as {errno?:string}).errno==='42501');
  }
  console.log('PASS aceptación concurrente 200/410, cambio de permisos/desactivación revoca tokens y privilegios SQL mínimos.');
}finally{await fixture.close();await closeDatabase();}
