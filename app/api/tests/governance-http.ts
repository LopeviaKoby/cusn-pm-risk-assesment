import { strict as assert } from 'node:assert';
import { SQL } from 'bun';

if (Bun.env.NODE_ENV !== 'test' || !Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_')) throw new Error('Solo BD aislada.');
const password=Bun.env.TEST_PASSWORD;
if (!password) throw new Error('Falta TEST_PASSWORD.');
const db=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});
const hashed=await Bun.password.hash(password,{algorithm:'argon2id'});
const suffix=crypto.randomUUID();
let serial=0;
async function user(role:'ADMIN'|'PM'|'ESPECIALISTA'|'VISUALIZADOR',kind:'INTERNO'|'EXTERNO'='INTERNO') {
  const email=`${role.toLowerCase()}-${++serial}-${suffix}@example.invalid`;
  const [row]=await db<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash,tipo_usuario)
    VALUES (${email},${role},${hashed},${kind}) RETURNING id::text`;
  await db`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura)
    SELECT ${row!.id},id,${role==='ADMIN'||role==='PM'?'GLOBAL':'ASIGNADOS'} FROM pmo_cusn.rol WHERE codigo=${role}`;
  return {id:row!.id,email};
}
const head=await user('ADMIN');const pm=await user('PM');const observer=await user('PM');const specialist=await user('ESPECIALISTA');
const external=await user('VISUALIZADOR','EXTERNO');
await db.close();
const {handleRequest}=await import('../src/index');
const {closeDatabase,sql}=await import('../src/db');
const origin='http://127.0.0.1:4173';
const send=(method:string,path:string,cookie?:string,body?:unknown)=>handleRequest(new Request(`http://127.0.0.1:43001/api/v1/${path}`,{
  method,headers:{origin,...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));
async function cookie(email:string){const response=await send('POST','sesion',undefined,{identifier:email,password});assert.equal(response.status,200);
  return response.headers.getSetCookie().find(value=>value.startsWith('pmo_access='))!.split(';')[0]!;}
try {
  const headCookie=await cookie(head.email),pmCookie=await cookie(pm.email),specialistCookie=await cookie(specialist.email);
  const created=await send('POST','workspaces',pmCookie,{nombre:`Gobierno ${suffix}`});
  assert.equal(created.status,201);
  const workspace=((await created.json()).data as {id:string;version:string;slug:string});
  const firstInvite=await send('POST',`workspaces/${workspace.id}/invitaciones`,pmCookie,{email:specialist.email,rol:'ESPECIALISTA'});
  assert.equal(firstInvite.status,201);
  const firstToken=((await firstInvite.json()).data as {token:string}).token;
  assert.equal((await send('POST','invitaciones/aceptar',undefined,{token:firstToken})).status,403);
  assert.equal((await send('POST','invitaciones/aceptar',specialistCookie,{token:firstToken})).status,200);
  assert.equal((await send('POST','invitaciones/aceptar',specialistCookie,{token:firstToken})).status,410);
  for(const state of ['REVOCADA','EXPIRADA']){
    const issued=await send('POST',`workspaces/${workspace.id}/invitaciones`,pmCookie,{email:`${state}-${suffix}@example.invalid`,rol:'ESPECIALISTA'});
    assert.equal(issued.status,201);
    const invitation=(await issued.json()).data as {id:string;token:string};
    if(state==='REVOCADA')await sql`UPDATE pmo_cusn.invitacion_workspace SET estado='REVOCADA' WHERE id=${invitation.id}`;
    else await sql`UPDATE pmo_cusn.invitacion_workspace SET created_at=now()-interval '2 days',expires_at=now()-interval '1 day' WHERE id=${invitation.id}`;
    assert.equal((await send('POST','invitaciones/aceptar',undefined,{token:invitation.token,password})).status,410);
  }
  assert.equal((await send('POST',`workspaces/${workspace.id}/invitaciones`,pmCookie,{email:`promotion-${suffix}@example.invalid`,rol:'PM'})).status,403);
  const observerInvite=await send('POST',`workspaces/${workspace.id}/invitaciones`,pmCookie,{email:observer.email,rol:'PM'});
  assert.equal(observerInvite.status,201);
  const observerToken=((await observerInvite.json()).data as {token:string}).token;
  const observerCookie=await cookie(observer.email);
  assert.equal((await send('POST','invitaciones/aceptar',observerCookie,{token:observerToken})).status,200);
  const [member]=await sql<{enabled:boolean}>`SELECT puede_crear_proyectos AS enabled FROM pmo_cusn.membresia_workspace
    WHERE workspace_id=${workspace.id} AND usuario_id=${observer.id}`;
  assert.equal(member?.enabled,false);
  const promotion=await send('POST',`usuarios/${specialist.id}/rol`,pmCookie,{rol:'ADMIN',alcance:'GLOBAL'});
  assert.equal(promotion.status,403);
  const externalGlobal=await send('POST',`usuarios/${external.id}/rol`,headCookie,{rol:'VISUALIZADOR',alcance:'GLOBAL'});
  assert.equal(externalGlobal.status,422);
  const enabled=await send('POST',`workspaces/${workspace.id}/miembros/${observer.id}/habilitacion-creacion`,headCookie,{habilitado:true});
  assert.equal(enabled.status,200);
  assert.equal(((await enabled.json()).data as {enabled:boolean}).enabled,true);
  const [catalog]=await sql<{clienteId:string;paisId:string;lobId:string}>`SELECT cliente_id::text AS "clienteId",pais_id::text AS "paisId",lob_id::text AS "lobId" FROM pmo_cusn.proyecto LIMIT 1`;
  assert.ok(catalog);
  const newProject=await send('POST','proyectos',observerCookie,{...catalog,workspaceId:workspace.id,tvt:`ENABLED-${suffix}`,nombre:'PM habilitado'});
  assert.equal(newProject.status,201);
  const renamed=await send('PATCH',`workspaces/${workspace.id}`,pmCookie,{nombre:'Nombre cambiado',version:workspace.version});
  assert.equal(renamed.status,200);
  assert.equal(((await renamed.json()).data as {slug:string}).slug,workspace.slug);
  console.log('PASS T04 habilitación Head; T09 invitaciones PM limitadas; T10 PM 403; T16 externo GLOBAL rechazado; T17 reutilización rechazada.');
} finally {await closeDatabase();}
