import { strict as assert } from "node:assert";
import { SQL } from "bun";

if (Bun.env.NODE_ENV !== "test" || !Bun.env.TEST_DATABASE_URL?.includes("pmo_test_v210_")) throw new Error("Solo BD aislada de prueba.");
const password = Bun.env.TEST_HEAD_PASSWORD;
if (!password) throw new Error("Falta TEST_HEAD_PASSWORD.");
const db = new SQL({ url: Bun.env.TEST_DATABASE_URL, max: 1 });
await db`UPDATE pmo_cusn.usuario SET password_hash=${await Bun.password.hash(password, { algorithm: "argon2id" })}
  WHERE email='head@example.invalid'`;
await db.close();
const { handleRequest } = await import("../src/index");
const { closeDatabase } = await import("../src/db");
const url = "http://127.0.0.1:43001/api/v1/sesion";
const request = (method: string, path = "", body?: unknown, cookie?: string, origin = "http://127.0.0.1:4173") => new Request(url + path, {
  method, headers: { origin, ...(cookie ? { cookie } : {}), ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined,
});
try {
  const denied = await handleRequest(request("POST", "", { identifier: "head@example.invalid", password: "wrong" }));
  assert.equal(denied.status, 401);
  const badOrigin = await handleRequest(request("POST", "", { identifier: "head@example.invalid", password }, undefined, "https://attacker.invalid"));
  assert.equal(badOrigin.status, 403);
  const missingOrigin=new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identifier:'head@example.invalid',password})});
  assert.equal((await handleRequest(missingOrigin)).status,403);
  const signed = await handleRequest(request("POST", "", { identifier: "head@example.invalid", password }));
  assert.equal(signed.status, 200);
  const cookies = signed.headers.getSetCookie();
  const access = cookies.find(value => value.startsWith("pmo_access="))?.split(";")[0];
  const refresh = cookies.find(value => value.startsWith("pmo_refresh="))?.split(";")[0];
  assert.ok(access && refresh);
  assert.ok(cookies.every(value => value.includes("HttpOnly") && value.includes("SameSite=Strict")));
  assert.equal((await handleRequest(request("GET", "", undefined, access))).status, 200);
  const renewed = await handleRequest(request("POST", "/renovar", undefined, refresh));
  assert.equal(renewed.status, 200);
  const newRefresh = renewed.headers.getSetCookie().find(value => value.startsWith("pmo_refresh="))?.split(";")[0];
  assert.ok(newRefresh && newRefresh !== refresh);
  assert.equal((await handleRequest(request("POST", "/renovar", undefined, refresh))).status, 401);
  assert.equal((await handleRequest(request("DELETE", "", undefined, `${access}; ${newRefresh}`))).status, 200);
  assert.equal((await handleRequest(request("POST", "/renovar", undefined, newRefresh))).status, 401);
  console.log("PASS HTTP login, 401, origen 403, cookies, restauración, refresh rotativo y logout.");
} finally { await closeDatabase(); }
