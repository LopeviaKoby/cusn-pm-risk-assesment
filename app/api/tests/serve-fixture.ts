// Solo arranque para render/E2E con fixtures creados por test:db en BD aislada.
const url=Bun.env.TEST_DATABASE_URL;
if(Bun.env.NODE_ENV!=="test"||!url||!/^\/pmo_test(?:_[a-z0-9]+)?$/.test(new URL(url).pathname))throw new Error("Se requiere BD pmo_test aislada.");
Bun.env.DATABASE_URL=url;
if(!Bun.env.JWT_SIGNING_KEY)throw new Error('Se requiere JWT_SIGNING_KEY; no existe bypass de credenciales para fixtures.');
Bun.env.APP_ORIGINS="http://127.0.0.1:4173";
const {handleRequest}=await import("../src/index");
const {closeDatabase}=await import("../src/db");
const server=Bun.serve({hostname:"127.0.0.1",port:43001,fetch:handleRequest});
console.log(`Fixture API PID=${process.pid} http://127.0.0.1:43001`);
async function close(){server.stop(true);await closeDatabase();process.exit(0);}
process.on("SIGINT",()=>void close());process.on("SIGTERM",()=>void close());
export {};
