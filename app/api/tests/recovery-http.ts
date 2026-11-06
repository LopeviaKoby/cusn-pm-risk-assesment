import {registrationFixture} from './registration-fixture';
import {strict as assert} from 'node:assert';
import {SQL} from 'bun';
if(Bun.env.NODE_ENV!=='test'||!Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_'))throw new Error('Solo BD aislada.');
const password=Bun.env.TEST_PASSWORD;
if(!password)throw new Error('Falta TEST_PASSWORD.');
const db=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});
const hash=await Bun.password.hash(password,{algorithm:'argon2id'});
const serial=crypto.randomUUID();
async function create(role:'ADMIN'|'PM'){
  const email=`${role.toLowerCase()}-recovery-${serial}@example.invalid`;
  const [u]=await db<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash)
    VALUES (${email},${role},${hash}) RETURNING id::text`;
  await db`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura)
    SELECT ${u!.id},id,'GLOBAL' FROM pmo_cusn.rol WHERE codigo=${role}`;
  return {id:u!.id,email};
}
const head=await create('ADMIN'),pm=await create('PM');
await db.close();
const {handleRequest}=await import('../src/index');
const {closeDatabase,sql}=await import('../src/db');
const send=(method:string,path:string,cookie?:string,body?:unknown)=>handleRequest(new Request(`http://127.0.0.1:43001/api/v1/${path}`,{
  method,headers:{origin:'http://127.0.0.1:4173',...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(registrationFixture(method,path,body)):undefined}));
try{
  const login=await send('POST','sesion',undefined,{identifier:head.email,password});
  assert.equal(login.status,200);
  const headCookie=login.headers.getSetCookie().find(v=>v.startsWith('pmo_access='))!.split(';')[0]!;
  const pmLogin=await send('POST','sesion',undefined,{identifier:pm.email,password});
  assert.equal(pmLogin.status,200);
  const pmCookie=pmLogin.headers.getSetCookie().find(v=>v.startsWith('pmo_access='))!.split(';')[0]!;
  assert.equal((await send('POST',`usuarios/${pm.id}/recuperacion`,pmCookie)).status,403);
  const issued=await send('POST',`usuarios/${pm.id}/recuperacion`,headCookie);
  assert.equal(issued.status,201);
  const token=((await issued.json()).data as {token:string}).token;
  const [stored]=await sql<{hash:string}>`SELECT recovery_token_hash AS hash FROM pmo_cusn.usuario WHERE id=${pm.id}`;
  assert.notEqual(stored?.hash,token);
  const nextPassword=`Next-${crypto.randomUUID()}-secret`;
  assert.equal((await send('POST','credenciales/restablecer',undefined,{token,password:nextPassword})).status,200);
  assert.equal((await send('POST','credenciales/restablecer',undefined,{token,password:nextPassword})).status,410);
  assert.equal((await send('GET','sesion',pmCookie)).status,401);
  assert.equal((await send('POST','sesion',undefined,{identifier:pm.email,password})).status,401);
  assert.equal((await send('POST','sesion',undefined,{identifier:pm.email,password:nextPassword})).status,200);
  console.log('PASS recuperación restringida, hash, uso único, revocación y nuevo login.');
}finally{await closeDatabase();}
