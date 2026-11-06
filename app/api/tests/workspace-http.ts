import { strict as assert } from "node:assert";
import { SQL } from "bun";

if (Bun.env.NODE_ENV !== "test" || !Bun.env.TEST_DATABASE_URL?.includes("pmo_test_v210_")) throw new Error("Solo BD aislada de prueba.");
const password = Bun.env.TEST_PASSWORD;
if (!password) throw new Error("Falta TEST_PASSWORD.");
const db = new SQL({ url: Bun.env.TEST_DATABASE_URL, max: 1 });
const hashed = await Bun.password.hash(password, { algorithm: "argon2id" });
for (const [role, scope] of [["PM","GLOBAL"],["ESPECIALISTA","ASIGNADOS"],["VISUALIZADOR","ASIGNADOS"]] as const) {
  const email = `${role.toLowerCase()}-workspace@example.invalid`;
  const [user] = await db<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash)
    VALUES (${email},${role},${hashed}) RETURNING id::text`;
  await db`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura)
    SELECT ${user!.id},id,${scope} FROM pmo_cusn.rol WHERE codigo=${role}`;
}
await db.close();
const { handleRequest } = await import("../src/index");
const { closeDatabase } = await import("../src/db");
const origin = "http://127.0.0.1:4173";
const request = (method: string, path: string, body?: unknown, cookie?: string) => new Request(`http://127.0.0.1:43001/api/v1/${path}`, {
  method, headers: { origin, ...(cookie ? { cookie } : {}), ...(body ? { "content-type": "application/json" } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});
async function cookie(email: string) {
  const response = await handleRequest(request("POST","sesion",{identifier:email,password}));
  assert.equal(response.status,200);
  return response.headers.getSetCookie().find(value => value.startsWith("pmo_access="))!.split(";")[0]!;
}
try {
  const pm = await cookie("pm-workspace@example.invalid");
  const specialist = await cookie("especialista-workspace@example.invalid");
  const viewer = await cookie("visualizador-workspace@example.invalid");
  const name = `Workspace test ${crypto.randomUUID().slice(0,8)}`;
  const created = await handleRequest(request("POST","workspaces",{nombre:name},pm));
  assert.equal(created.status,201);
  const workspace = (await created.json()).data as {id:string;slug:string};
  const [member] = await (await import("../src/db")).sql<{can:boolean}>`SELECT puede_crear_proyectos AS can
    FROM pmo_cusn.membresia_workspace WHERE workspace_id::text=${workspace.id}`;
  assert.equal(member?.can,true);
  const collision = await handleRequest(request("POST","workspaces",{nombre:name},pm));
  assert.equal(collision.status,201);
  assert.notEqual(((await collision.json()).data as {slug:string}).slug,workspace.slug);
  assert.equal((await handleRequest(request("POST","workspaces",{nombre:"Prohibido"},specialist))).status,403);
  assert.equal((await handleRequest(request("POST","workspaces",{nombre:"Prohibido"},viewer))).status,403);
  const list = await handleRequest(request("GET","workspaces",undefined,pm));
  assert.equal(list.status,200);
  assert.ok(((await list.json()).data as {id:string}[]).some(item => item.id===workspace.id));
  console.log("PASS T01 PM crea y obtiene membresía; T02 Especialista 403; slug estable y colisión resuelta.");
} finally { await closeDatabase(); }
