import { strict as assert } from "node:assert";
import { closeDatabase } from "../src/db";
import { login, logout, renew, sessionFrom } from "../src/session";

if (Bun.env.NODE_ENV !== "test" || !Bun.env.TEST_DATABASE_URL?.includes("pmo_test_v210_")) {
  throw new Error("Auth smoke solo admite una base pmo_test_v210_* aislada.");
}
const password = Bun.env.TEST_HEAD_PASSWORD;
if (!password) throw new Error("Falta TEST_HEAD_PASSWORD.");
try {
  const session = await login("head@example.invalid", password);
  assert.ok(session?.accessToken && session.refreshToken);
  const request = (method: string, access?: string, refresh?: string) => new Request("http://127.0.0.1:43001/api/v1/sesion", {
    method, headers: { origin: "http://127.0.0.1:4173", cookie: [access && `pmo_access=${access}`, refresh && `pmo_refresh=${refresh}`].filter(Boolean).join("; ") },
  });
  assert.equal((await sessionFrom(request("GET", session.accessToken)))?.userId, session.userId);
  const rotated = await renew(request("POST", undefined, session.refreshToken));
  assert.ok(rotated.refreshToken !== session.refreshToken);
  await assert.rejects(() => renew(request("POST", undefined, session.refreshToken)));
  await logout(request("DELETE", undefined, rotated.refreshToken));
  assert.equal(await sessionFrom(request("GET", rotated.accessToken)), null);
  assert.equal(await login("head@example.invalid", "wrong-password"), null);
  console.log("PASS Argon2id login, JWT, refresh rotativo, revocación y contraseña errónea.");
} finally { await closeDatabase(); }
