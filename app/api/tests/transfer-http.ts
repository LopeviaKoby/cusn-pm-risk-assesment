import {registrationFixture} from './registration-fixture';
import { strict as assert } from "node:assert";
import { SQL } from "bun";
if(Bun.env.NODE_ENV!=="test"||!Bun.env.TEST_DATABASE_URL?.includes("pmo_test_v210_"))throw new Error("Solo BD aislada.");
const password=Bun.env.TEST_PASSWORD;
if(!password)throw new Error("Falta TEST_PASSWORD.");
const db=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});
const hashed=await Bun.password.hash(password,{algorithm:"argon2id"});
await db`UPDATE pmo_cusn.usuario SET password_hash=${hashed} WHERE email IN ('head@example.invalid','pm-workspace@example.invalid')`;
const [headWorkspace]=await db<{id:string}>`SELECT w.id::text FROM pmo_cusn.workspace w JOIN pmo_cusn.usuario u ON u.id=w.creado_por_id WHERE u.email='head@example.invalid' ORDER BY w.id DESC LIMIT 1`;
const [project]=await db<{id:string;tvt:string;version:string}>`SELECT id::text,tvt,version::text FROM pmo_cusn.proyecto ORDER BY id DESC LIMIT 1`;
assert.ok(headWorkspace&&project);
const [newPm]=await db<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash) VALUES (${`pm-transfer-${crypto.randomUUID()}@example.invalid`},'PM transferencia',${hashed}) RETURNING id::text`;
await db`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura) SELECT ${newPm!.id},id,'GLOBAL' FROM pmo_cusn.rol WHERE codigo='PM'`;
await db`INSERT INTO pmo_cusn.membresia_workspace(workspace_id,usuario_id,puede_crear_proyectos) VALUES (${headWorkspace!.id},${newPm!.id},false)`;
await db.close();
const {handleRequest}=await import("../src/index");
const {closeDatabase,sql}=await import("../src/db");
const send=(method:string,path:string,cookie?:string,body?:unknown)=>handleRequest(new Request(`http://127.0.0.1:43001/api/v1/${path}`,{method,
  headers:{origin:"http://127.0.0.1:4173",...(cookie?{cookie}:{}),...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(registrationFixture(method,path,body)):undefined}));
async function cookie(email:string){const r=await send("POST","sesion",undefined,{identifier:email,password});assert.equal(r.status,200);return r.headers.getSetCookie().find(v=>v.startsWith("pmo_access="))!.split(";")[0]!;}
try{
  const pm=await cookie("pm-workspace@example.invalid");const head=await cookie("head@example.invalid");
  const input={workspaceId:headWorkspace!.id,pmTitularId:newPm!.id,version:project!.version};
  assert.equal((await send("POST",`proyectos/${project!.id}/transferencia`,pm,input)).status,403);
  const response=await send("POST",`proyectos/${project!.id}/transferencia`,head,input);
  assert.equal(response.status,200,await response.text());
  const [after]=await sql<{tvt:string;workspaceId:string;ownerId:string;version:string}>`SELECT p.tvt,p.workspace_id::text AS "workspaceId",pp.usuario_id::text AS "ownerId",p.version::text FROM pmo_cusn.proyecto p
    JOIN pmo_cusn.participacion_proyecto pp ON pp.proyecto_id=p.id AND pp.funcion='PM_TITULAR' AND pp.fecha_fin IS NULL WHERE p.id=${project!.id}`;
  assert.equal(after?.tvt,project!.tvt);assert.equal(after.workspaceId,headWorkspace!.id);assert.equal(after.ownerId,newPm!.id);
  assert.equal(BigInt(after.version),BigInt(project!.version)+1n);
  console.log("PASS T11 PM 403; Head transfiere y reasigna sin cambiar ID/TVT.");
}finally{await closeDatabase();}
