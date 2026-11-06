import { strict as assert } from "node:assert";
import { SQL } from "bun";
if (Bun.env.NODE_ENV!=="test" || !Bun.env.TEST_DATABASE_URL?.includes("pmo_test_v210_")) throw new Error("Solo base aislada.");
const password=Bun.env.TEST_PASSWORD;
if(!password)throw new Error("Falta TEST_PASSWORD.");
const db=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});
const hash=await Bun.password.hash(password,{algorithm:"argon2id"});
await db`UPDATE pmo_cusn.usuario SET password_hash=${hash} WHERE email IN ('head@example.invalid','pm-workspace@example.invalid')`;
const mark=crypto.randomUUID().slice(0,8);
const [client]=await db<{id:string}>`INSERT INTO pmo_cusn.cliente(nombre) VALUES (${`Cliente ${mark}`}) RETURNING id::text`;
const [country]=await db<{id:string}>`INSERT INTO pmo_cusn.pais(codigo,nombre) VALUES (${mark.slice(0,3).toUpperCase()},${`País ${mark}`}) RETURNING id::text`;
const [lob]=await db<{id:string}>`INSERT INTO pmo_cusn.lob(nombre) VALUES (${`LOB ${mark}`}) RETURNING id::text`;
await db.close();
const {handleRequest}=await import("../src/index");
const {closeDatabase}=await import("../src/db");
const base="http://127.0.0.1:43001/api/v1/";
const send=(method:string,path:string,cookie?:string,body?:unknown)=>handleRequest(new Request(base+path,{method,
  headers:{origin:"http://127.0.0.1:4173",...(cookie?{cookie}:{}),...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(body):undefined}));
async function signIn(email:string){const r=await send("POST","sesion",undefined,{identifier:email,password});assert.equal(r.status,200);return r.headers.getSetCookie().find(v=>v.startsWith("pmo_access="))!.split(";")[0]!;}
try{
  const pm=await signIn("pm-workspace@example.invalid");
  const head=await signIn("head@example.invalid");
  const own=await send("GET","workspaces",pm);
  const workspace=((await own.json()).data as {id:string}[])[0]!;
  const other=await send("POST","workspaces",head,{nombre:`Head ${mark}`});assert.equal(other.status,201);
  const otherId=((await other.json()).data as {id:string}).id;
  const input={workspaceId:workspace.id,tvt:`TVT-${mark}`,nombre:"Proyecto",clienteId:client!.id,paisId:country!.id,lobId:lob!.id};
  assert.equal((await send("POST","proyectos",pm,{...input,workspaceId:otherId})).status,403);
  const created=await send("POST","proyectos",pm,input);assert.equal(created.status,201);
  const project=(await created.json()).data as {id:string;version:string};
  const [owner]=await (await import("../src/db")).sql<{userId:string}>`SELECT usuario_id::text AS "userId" FROM pmo_cusn.participacion_proyecto WHERE proyecto_id=${project.id} AND funcion='PM_TITULAR' AND fecha_fin IS NULL`;
  assert.ok(owner?.userId);
  const listed=await send("GET","proyectos",pm);assert.equal(listed.status,200);
  assert.ok(((await listed.json()).data as {id:string}[]).some(p=>p.id===project.id));
  const [first,second]=await Promise.all([send("PATCH",`proyectos/${project.id}`,pm,{version:project.version,nombre:"Primero"}),send("PATCH",`proyectos/${project.id}`,pm,{version:project.version,nombre:"Segundo"})]);
  assert.deepEqual([first.status,second.status].sort(),[200,409]);
  console.log("PASS T03 PM ajeno 403; F3 creación con titular; T15 actualización concurrente 200/409.");
}finally{await closeDatabase();}
