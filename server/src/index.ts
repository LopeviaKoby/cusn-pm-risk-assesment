import { config } from "./config";
import { closeDatabase, readiness } from "./db";
import { ApiError, respond, respondError } from "./errors";
import {
  buildBootstrap,
  getBilling,
  getCatalogs,
  getGlobalRisk,
  getPlanChanges,
  getProject,
  getProjectRisk,
  getProjects,
  getPurchases,
  getRisks,
} from "./repositories/read";
import { updateGlobalRisk, updateProject, updateProjectRisk } from "./repositories/writes";
import { assertOrigin, expiredCookie, login, logout, requireSession, sessionCookie } from "./session";

async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 8192) throw new ApiError(413, "BODY_TOO_LARGE", "El cuerpo de la petición es demasiado grande.");
  const raw = await request.text();
  if (raw.length > 8192) throw new ApiError(413, "BODY_TOO_LARGE", "El cuerpo de la petición es demasiado grande.");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "El cuerpo debe ser un objeto JSON válido.");
  }
}

function loginPayload(body: Record<string, unknown>) {
  const identifier = body.identifier;
  const password = body.password;
  if (typeof identifier !== "string" || typeof password !== "string" || identifier.length > 254 || password.length > 200) {
    throw new ApiError(400, "INVALID_CREDENTIALS", "Indica identificación y contraseña válidas.", {
      identifier: "Campo obligatorio.",
      password: "Campo obligatorio.",
    });
  }
  return { identifier, password };
}

const server = Bun.serve({
  hostname: config.hostname,
  port: config.port,
  async fetch(request) {
    const requestId = crypto.randomUUID();
    const started = performance.now();
    const url = new URL(request.url);
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : "/";
    let response: Response;
    try {
      if (path === "/api/v1/salud" && request.method === "GET") {
        response = respond({ status: "ok", mode: "api", asOfDate: config.asOfDate }, requestId);
      } else if (path === "/api/v1/listo" && request.method === "GET") {
        try {
          const status = await readiness();
          response = respond({ status: "ready", ...status }, requestId);
        } catch {
          response = new Response(
            JSON.stringify({ error: { code: "DATABASE_UNAVAILABLE", message: "La base de datos no está lista." }, requestId }),
            { status: 503, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-request-id": requestId } },
          );
        }
      } else if (path === "/api/v1/sesion") {
        assertOrigin(request);
        if (request.method === "POST") {
          const credentials = loginPayload(await jsonBody(request));
          const session = await login(credentials.identifier, credentials.password);
          if (!session) throw new ApiError(401, "INVALID_CREDENTIALS", "Identificación o contraseña incorrectas.");
          response = respond({ identifier: session.identifier, expiresAt: new Date(session.expiresAt).toISOString() }, requestId);
          response.headers.set("set-cookie", sessionCookie(session.token));
        } else if (request.method === "GET") {
          const session = requireSession(request);
          response = respond({ identifier: session.identifier, expiresAt: new Date(session.expiresAt).toISOString() }, requestId);
        } else if (request.method === "DELETE") {
          logout(request);
          response = respond({ status: "closed" }, requestId);
          response.headers.set("set-cookie", expiredCookie());
        } else {
          throw new ApiError(405, "METHOD_NOT_ALLOWED", "Método no permitido.");
        }
      } else {
        assertOrigin(request);
        const session = requireSession(request);
        if (path === "/api/v1/catalogos" && request.method === "GET") {
          response = respond(await getCatalogs(), requestId);
        } else if (path === "/api/v1/datos" && request.method === "GET") {
          response = respond(await buildBootstrap(), requestId);
        } else if (path === "/api/v1/proyectos" && request.method === "GET") {
          response = respond(await getProjects(), requestId);
        } else if (path === "/api/v1/riesgos" && request.method === "GET") {
          const risks = await getRisks(url.searchParams.get("proyecto") ?? undefined);
          const scope = url.searchParams.get("alcance");
          response = respond(scope ? risks.filter(risk => risk.alcance === scope.toUpperCase()) : risks, requestId);
        } else if (path === "/api/v1/facturacion" && request.method === "GET") {
          response = respond(await getBilling(url.searchParams.get("proyecto") ?? undefined), requestId);
        } else if (path === "/api/v1/compras" && request.method === "GET") {
          response = respond(await getPurchases(url.searchParams.get("proyecto") ?? undefined), requestId);
        } else if (path === "/api/v1/cambios-planificacion" && request.method === "GET") {
          response = respond(await getPlanChanges(url.searchParams.get("estado") ?? undefined), requestId);
        } else {
          const projectHistory = path.match(/^\/api\/v1\/proyectos\/([^/]+)\/historial$/);
          const projectRisk = path.match(/^\/api\/v1\/proyectos\/([^/]+)\/riesgos\/([^/]+)$/);
          const projectRisks = path.match(/^\/api\/v1\/proyectos\/([^/]+)\/riesgos$/);
          const globalRisk = path.match(/^\/api\/v1\/riesgos\/globales\/([^/]+)$/);
          const project = path.match(/^\/api\/v1\/proyectos\/([^/]+)$/);
          if (projectRisk && request.method === "PATCH") {
            response = respond(await updateProjectRisk(decodeURIComponent(projectRisk[1]!), decodeURIComponent(projectRisk[2]!), await jsonBody(request), session.identifier), requestId);
          } else if (globalRisk && request.method === "PATCH") {
            response = respond(await updateGlobalRisk(decodeURIComponent(globalRisk[1]!), await jsonBody(request), session.identifier), requestId);
          } else if (project && request.method === "PATCH") {
            response = respond(await updateProject(decodeURIComponent(project[1]!), await jsonBody(request), session.identifier), requestId);
          } else if (projectHistory && request.method === "GET") {
            const found = await getProject(decodeURIComponent(projectHistory[1]!));
            if (!found) throw new ApiError(404, "NOT_FOUND", "Proyecto no encontrado.");
            response = respond(found.historial, requestId);
          } else if (projectRisk && request.method === "GET") {
            const found = await getProjectRisk(decodeURIComponent(projectRisk[1]!), decodeURIComponent(projectRisk[2]!));
            if (!found) throw new ApiError(404, "NOT_FOUND", "Riesgo del proyecto no encontrado.");
            response = respond(found, requestId);
          } else if (projectRisks && request.method === "GET") {
            response = respond(await getRisks(decodeURIComponent(projectRisks[1]!)), requestId);
          } else if (globalRisk && request.method === "GET") {
            const found = await getGlobalRisk(decodeURIComponent(globalRisk[1]!));
            if (!found) throw new ApiError(404, "NOT_FOUND", "Riesgo global no encontrado.");
            response = respond(found, requestId);
          } else if (project && request.method === "GET") {
            const found = await getProject(decodeURIComponent(project[1]!));
            if (!found) throw new ApiError(404, "NOT_FOUND", "Proyecto no encontrado.");
            response = respond(found, requestId);
          } else {
            throw new ApiError(404, "NOT_FOUND", "Ruta no encontrada.");
          }
        }
      }
    } catch (error) {
      response = respondError(error, requestId);
    }
    const elapsed = Math.round(performance.now() - started);
    console.log(`${request.method} ${path} ${response.status} ${elapsed}ms`);
    return response;
  },
  error(error) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] error de servidor: ${error.name}`);
    return respondError(error, requestId);
  },
});

console.log(`API GPL en http://${config.hostname}:${config.port}`);
console.log(`Datos de corte: ${config.asOfDate}. Sesión: ${config.sessionMinutes} min. Orígenes: ${config.origins.join(", ")}`);

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
