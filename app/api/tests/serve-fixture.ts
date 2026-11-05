// Solo arranque para render/E2E con fixtures creados por test:db en BD aislada.
const url=Bun.env.TEST_DATABASE_URL;
if(Bun.env.NODE_ENV!=="test"||!url||!/^\/pmo_test(?:_[a-z0-9]+)?$/.test(new URL(url).pathname))throw new Error("Se requiere BD pmo_test aislada.");
Bun.env.DATABASE_URL=url;
Bun.env.GPL_USER="fixture@example.invalid";
Bun.env.GPL_PASSWORD_HASH_B64=btoa(await Bun.password.hash("fixture-password-only"));
Bun.env.APP_ORIGINS="http://127.0.0.1:4173";
Bun.env.GPL_AS_OF_DATE="2026-11-02";
const {handleRequest}=await import("../src/index");
const {closeDatabase}=await import("../src/db");
const server=Bun.serve({hostname:"127.0.0.1",port:43001,fetch:handleRequest});
console.log(`Fixture API PID=${process.pid} http://127.0.0.1:43001`);
async function close(){server.stop(true);await closeDatabase();process.exit(0);}
process.on("SIGINT",()=>void close());process.on("SIGTERM",()=>void close());
export {};
