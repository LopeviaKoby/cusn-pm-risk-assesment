import {config} from './config';
import {closeDatabase} from './db';
import {respondError} from './errors';
import {createBusinessApi} from './infrastructure/http/business-routes';
export const app=createBusinessApi();
export const handleRequest=app.fetch;

if (import.meta.main) {
const server = Bun.serve({
  hostname: config.hostname,
  port: config.port,
  fetch: handleRequest,
  error(error) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] error de servidor: ${error.name}`);
    return respondError(error, requestId);
  },
});

console.log(`API PMO v2.1.0 en http://${config.hostname}:${config.port}`);
console.log(`Acceso: ${config.sessionMinutes} min. Orígenes: ${config.origins.join(", ")}`);

let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  console.log(`Cerrando API por ${signal}…`);
  server.stop(true);
  await closeDatabase();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

}
