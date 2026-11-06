import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { config } from "./config";
import { ApiError } from "./errors";
import { sql } from "./db";
import {activeActor} from './authorization';

export type Session = { identifier: string; userId: string; expiresAt: number; accessToken?: string; refreshToken?: string };
export async function publicSession(session:Session){
  const rows=await sql<{role:string;permission:string}>`SELECT r.codigo AS role,p.codigo AS permission
    FROM pmo_cusn.asignacion_rol a JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.activo
    JOIN pmo_cusn.rol_permiso rp ON rp.rol_id=r.id JOIN pmo_cusn.permiso p ON p.id=rp.permiso_id
    WHERE a.usuario_id=${session.userId} AND a.revocado_at IS NULL ORDER BY p.codigo`;
  return {identifier:session.identifier,expiresAt:new Date(session.expiresAt).toISOString(),role:rows[0]?.role??null,
    permissions:rows.map(row=>row.permission)};
}
const accessCookie = "pmo_access";
const refreshCookieName = "pmo_refresh";
const secure = config.cookieSecure ? "; Secure" : "";
const secretBytes = new TextEncoder().encode(config.jwtSigningKey);
if (secretBytes.length < 32) throw new Error("JWT_SIGNING_KEY requiere al menos 32 bytes.");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const randomToken = () => randomBytes(32).toString("base64url");
const dummyHash = Bun.password.hash(randomToken(), { algorithm: "argon2id" });

function cookies(request: Request): Record<string, string> {
  return Object.fromEntries((request.headers.get("cookie") ?? "").split(";").map(part => {
    const cut = part.indexOf("="); return cut < 1 ? ["", ""] : [part.slice(0, cut).trim(), part.slice(cut + 1).trim()];
  }));
}

async function accessToken(userId: string, version: string): Promise<string> {
  return new SignJWT({ ver: version }).setProtectedHeader({ alg: "HS256" }).setSubject(userId)
    .setIssuer("pmo-cusn").setAudience("pmo-web").setIssuedAt()
    .setExpirationTime(`${config.sessionMinutes}m`).setJti(crypto.randomUUID()).sign(secretBytes);
}

export async function sessionFrom(request: Request): Promise<Session | null> {
  const token = cookies(request)[accessCookie];
  if (!token) return null;
  let payload:JWTPayload;
  try {
    ({payload}=await jwtVerify(token, secretBytes, { issuer: "pmo-cusn", audience: "pmo-web", algorithms: ["HS256"],requiredClaims:['sub','exp','iat','jti'] }));
  } catch { return null; }
    if (!payload.sub || !/^[1-9][0-9]{0,18}$/.test(payload.sub) || typeof payload.ver !== "string" || !payload.exp) return null;
    const [user] = await sql<{ id: string; email: string }>`SELECT u.id::text AS id,u.email FROM pmo_cusn.usuario u
      JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
      JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.activo
      WHERE u.id::text=${payload.sub} AND u.session_version::text=${payload.ver} AND u.activo
        AND u.password_hash IS NOT NULL AND (u.tipo_usuario='INTERNO' OR r.codigo='VISUALIZADOR')`;
    if (!user) return null;
    return { userId: user.id, identifier: user.email, expiresAt: payload.exp * 1000 };
}

export async function requireSession(request: Request): Promise<Session> {
  const session = await sessionFrom(request);
  if (!session) throw new ApiError(401, "SESSION_REQUIRED", "Inicia sesión para continuar.");
  return session;
}

export async function login(identifier: string, password: string): Promise<Session | null> {
  return sql.begin(async tx=>{
  const email = identifier.trim().toLowerCase();
  const [user] = await tx<{ id: string; email: string; password_hash: string | null; session_version: string; locked: boolean }>`
    SELECT u.id::text AS id,u.email,u.password_hash,u.session_version::text,
      (u.locked_until IS NOT NULL AND u.locked_until>now()) AS locked
    FROM pmo_cusn.usuario u JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
    JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.activo
    WHERE lower(btrim(u.email))=${email} AND u.activo
      AND (u.tipo_usuario='INTERNO' OR r.codigo='VISUALIZADOR') FOR UPDATE OF u`;
  const valid = await Bun.password.verify(password, user?.password_hash ?? await dummyHash).catch(() => false);
  if (!user || user.locked || !valid) {
    if (user) {
      await tx`UPDATE pmo_cusn.usuario SET failed_login_count=failed_login_count+1,
        locked_until=CASE WHEN failed_login_count+1>=5 THEN now()+interval '15 minutes' ELSE locked_until END
        WHERE id=${user.id}`;
      await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
        VALUES (${user.id},'sesion.login','usuario',${user.id},'DENEGADO')`;
    }else{
      await tx`INSERT INTO pmo_cusn.auditoria_seguridad(operacion,recurso_tipo,resultado)
        VALUES ('sesion.login','credencial','DENEGADO')`;
    }
    return null;
  }
  const refreshToken = randomToken();
  const digest = hashToken(refreshToken);
  await tx`UPDATE pmo_cusn.usuario SET refresh_token_hash=${digest},
    refresh_expires_at=now()+(${config.refreshDays}::integer * interval '1 day'),
    failed_login_count=0,locked_until=NULL WHERE id=${user.id}`;
  await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
    VALUES (${user.id},'sesion.login','usuario',${user.id},'PERMITIDO')`;
  return { userId: user.id, identifier: user.email, expiresAt: Date.now()+config.sessionMinutes*60_000,
    accessToken: await accessToken(user.id, user.session_version), refreshToken };
  });
}

export async function renew(request: Request): Promise<Session> {
  const old = cookies(request)[refreshCookieName];
  if (!old || !/^[A-Za-z0-9_-]{43}$/.test(old)) throw new ApiError(401, "REFRESH_REQUIRED", "Sesión vencida.");
  return sql.begin(async tx=>{
  const next = randomToken();
  const [user] = await tx<{ id: string; email: string; session_version: string }>`UPDATE pmo_cusn.usuario u
    SET refresh_token_hash=${hashToken(next)},refresh_expires_at=now()+(${config.refreshDays}::integer * interval '1 day')
    WHERE u.refresh_token_hash=${hashToken(old)} AND u.refresh_expires_at>now() AND u.activo
      AND u.password_hash IS NOT NULL AND EXISTS (SELECT 1 FROM pmo_cusn.asignacion_rol a
        JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.activo WHERE a.usuario_id=u.id AND a.revocado_at IS NULL
          AND (u.tipo_usuario='INTERNO' OR r.codigo='VISUALIZADOR'))
    RETURNING u.id::text AS id,u.email,u.session_version::text`;
  if (!user) throw new ApiError(401, "REFRESH_REJECTED", "Sesión vencida.");
  if(!await activeActor(user.id,tx))throw new ApiError(401,'REFRESH_REJECTED','Sesión vencida.');
  await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
    VALUES (${user.id},'sesion.renovar','usuario',${user.id},'PERMITIDO')`;
  return { userId: user.id, identifier: user.email, expiresAt: Date.now()+config.sessionMinutes*60_000,
    accessToken: await accessToken(user.id, user.session_version), refreshToken: next };
  });
}

export async function logout(request: Request): Promise<void> {
  const refresh = cookies(request)[refreshCookieName];
  const session = await sessionFrom(request);
  if (!refresh && !session) return;
  const [user] = await sql<{ id: string }>`UPDATE pmo_cusn.usuario SET refresh_token_hash=NULL,refresh_expires_at=NULL,
    session_version=session_version+1 WHERE
      (${session?.userId??null}::bigint IS NULL AND ${refresh ? hashToken(refresh) : null}::text IS NOT NULL AND refresh_token_hash=${refresh ? hashToken(refresh) : null})
      OR (${session?.userId ?? null}::bigint IS NOT NULL AND id=${session?.userId ?? null}) RETURNING id::text`;
  if (user) await sql`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
    VALUES (${user.id},'sesion.logout','usuario',${user.id},'PERMITIDO')`;
}

export function sessionCookie(token: string): string {
  return `${accessCookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${config.sessionMinutes*60}${secure}`;
}
export function refreshCookie(token: string): string {
  return `${refreshCookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api/v1/sesion; Max-Age=${config.refreshDays*86400}${secure}`;
}
export function expiredCookie(): string { return `${accessCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`; }
export function expiredRefreshCookie(): string { return `${refreshCookieName}=; HttpOnly; SameSite=Strict; Path=/api/v1/sesion; Max-Age=0${secure}`; }

export function assertOrigin(request: Request): void {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origin = request.headers.get("origin");
  if (!origin || !config.origins.includes(origin)) throw new ApiError(403, "ORIGIN_REJECTED", "El origen de la petición no está autorizado.");
}
