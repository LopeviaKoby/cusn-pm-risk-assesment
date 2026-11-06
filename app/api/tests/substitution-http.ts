import { strict as assert } from "node:assert";
import { SQL } from "bun";
if(Bun.env.NODE_ENV!=="test"||!Bun.env.TEST_DATABASE_URL?.includes("pmo_test_v210_"))throw new Error("Solo base aislada.");
const password=Bun.env.TEST_PASSWORD;if(!password)throw new Error("Falta TEST_PASSWORD.");
const db=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});
const [project]=await db<{id:string;version:string;ownerId:string;ownerEmail:string}>`SELECT p.id::text,p.version::text,pp.usuario_id::text AS "ownerId",u.email AS "ownerEmail"
  FROM pmo_cusn.proyecto p JOIN pmo_cusn.participacion_proyecto pp ON pp.proyecto_id=p.id AND pp.funcion='PM_TITULAR' AND pp.fecha_fin IS NULL
  JOIN pmo_cusn.usuario u ON u.id=pp.usuario_id ORDER BY p.id DESC LIMIT 1`;
const [delegate]=await db<{id:string}>`SELECT id::text FROM pmo_cusn.usuario WHERE email='pm-workspace@example.invalid'`;
assert.ok(project&&delegate);
const hash=await Bun.password.hash(password,{algorithm:"argon2id"});
await db`UPDATE pmo_cusn.usuario SET password_hash=${hash} WHERE id IN (${project.ownerId},${delegate.id}) OR email='head@example.invalid'`;
await db.close();
const {handleRequest}=await import("../src/index");
const {closeDatabase,sql}=await import("../src/db");
const {hasPermission}=await import("../src/authorization");
const send=(method:string,path:string,cookie?:string,body?:unknown)=>handleRequest(new Request(`http://127.0.0.1:43001/api/v1/${path}`,{method,
  headers:{origin:"http://127.0.0.1:4173",...(cookie?{cookie}:{}),...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(body):undefined}));
async function cookie(email:string){const r=await send("POST","sesion",undefined,{identifier:email,password});assert.equal(r.status,200);return r.headers.getSetCookie().find(v=>v.startsWith("pmo_access="))!.split(";")[0]!;}
try{
  const head=await cookie("head@example.invalid"),owner=await cookie(project.ownerEmail),sub=await cookie("pm-workspace@example.invalid");
  const input={delegateId:delegate.id,start:new Date(Date.now()-60000).toISOString(),end:new Date(Date.now()+3600000).toISOString(),reason:"Ausencia de prueba",permissions:["proyectos.editar"]};
  assert.equal((await send('GET',`proyectos/${project.id}`,sub)).status,200);
  assert.equal((await send('PATCH',`proyectos/${project.id}`,sub,{version:project.version,nombre:'Ajeno'})).status,403);
  console.log('PASS T08 lectura global PM y edición ajena 403.');
  const competing=await Promise.all([send("POST",`proyectos/${project.id}/suplencias`,head,input),send("POST",`proyectos/${project.id}/suplencias`,head,input)]);
  assert.deepEqual(competing.map(r=>r.status).sort(),[201,409]);
  const created=competing.find(r=>r.status===201)!;
  const createdBody=await created.json();assert.equal(created.status,201,JSON.stringify(createdBody));
  const delegation=createdBody.data as {id:string};
  assert.equal(await hasPermission(delegate.id,"proyectos.editar",project.id),true);
  const overlap=await send("POST",`proyectos/${project.id}/suplencias`,head,{...input,start:new Date(Date.now()+1000).toISOString()});
  assert.equal(overlap.status,409);
  const bySub=await send("PATCH",`proyectos/${project.id}`,sub,{version:project.version,nombre:"Suplente editó"});assert.equal(bySub.status,200);
  const nextVersion=((await bySub.json()).data as {version:string}).version;
  assert.equal((await send("PATCH",`proyectos/${project.id}`,owner,{version:nextVersion,nombre:"Titular editó"})).status,200);
  assert.equal((await send("POST",`proyectos/${project.id}/suplencias/${delegation.id}/revocacion`,head)).status,200);
  assert.equal(await hasPermission(delegate.id,"proyectos.editar",project.id),false);
  const [pending]=await sql<{id:string}>`INSERT INTO pmo_cusn.delegacion_acceso(delegante_id,delegado_id,autorizado_por_id,proyecto_id,inicio,fin,motivo,estado)
    VALUES (${project.ownerId},${delegate.id},${project.ownerId},${project.id},now()-interval '1 minute',now()+interval '1 hour','Prueba pendiente','PENDIENTE') RETURNING id::text`;
  await sql`INSERT INTO pmo_cusn.delegacion_permiso(delegacion_id,permiso_id)
    SELECT ${pending!.id},id FROM pmo_cusn.permiso WHERE codigo='proyectos.editar'`;
  assert.equal(await hasPermission(delegate.id,'proyectos.editar',project.id),false);
  await sql`UPDATE pmo_cusn.delegacion_acceso SET estado='ACTIVA',inicio=now()-interval '2 hours',fin=now()-interval '1 hour' WHERE id=${pending!.id}`;
  assert.equal(await hasPermission(delegate.id,'proyectos.editar',project.id),false);
  console.log('PASS T13 pendiente, revocada y vencida no conceden edición.');
  const [audit]=await sql<{n:string}>`SELECT count(*)::text AS n FROM pmo_cusn.auditoria_seguridad WHERE delegacion_id=${delegation.id}`;
  assert.ok(Number(audit?.n)>=2);
  const [delegatedEdit]=await sql<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.auditoria_seguridad
    WHERE delegacion_id=${delegation.id} AND actor_id=${delegate.id} AND operacion='proyectos.editar'`;
  assert.equal(delegatedEdit?.n,'1');
  const [ownerEdit]=await sql<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.auditoria_seguridad
    WHERE proyecto_id=${project.id} AND actor_id=${project.ownerId} AND operacion='proyectos.editar' AND delegacion_id IS NULL`;
  assert.ok(Number(ownerEdit?.n)>0);
  console.log("PASS T12 exclusión 409; T14 suplente y titular editan; revocación corta acceso y conserva auditoría.");
}finally{await closeDatabase();}
