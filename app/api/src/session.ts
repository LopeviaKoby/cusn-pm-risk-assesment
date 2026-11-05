import { config } from "./config";
import { ApiError } from "./errors";
import { sql } from "./db";

export type Session = {
  token: string;
  identifier: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
};

const sessions = new Map<string, Session>();
const cookie = "gpl_session";
const secure = config.cookieSecure ? "; Secure" : "";

function readCookies(header: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 1) continue;
    result[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  return result;
}

export function sessionFrom(request: Request): Session | null {
  const token = readCookies(request.headers.get("cookie"))[cookie];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function requireSession(request: Request): Session {
  const session = sessionFrom(request);
  if (!session) throw new ApiError(401, "SESSION_REQUIRED", "Inicia sesión para continuar.");
  return session;
}

export async function login(identifier: string, password: string): Promise<Session | null> {
  if (identifier.trim().toLowerCase() !== config.user.toLowerCase()) return null;
  let valid = false;
  try {
    valid = await Bun.password.verify(password, config.passwordHash);
  } catch {
    return null;
  }
  if (!valid) return null;
  // La identidad procede de la configuración validada por contraseña, nunca de
  // un email libre de una petición de escritura. No crea usuarios ni permisos.
  const [user] = await sql<{ id: string }>`SELECT id::text FROM pmo_cusn.usuario WHERE lower(btrim(email))=lower(btrim(${config.user})) AND activo`;
  if (!user) return null;

  const now = Date.now();
  const token = crypto.randomUUID();
  const session: Session = {
    token,
    identifier: config.user,
    userId: user.id,
    createdAt: now,
    expiresAt: now + config.sessionMinutes * 60_000,
  };
  for (const [key, value] of sessions) if (value.expiresAt <= now) sessions.delete(key);
  sessions.set(token, session);
  return session;
}

export function logout(request: Request): void {
  const token = readCookies(request.headers.get("cookie"))[cookie];
  if (token) sessions.delete(token);
}

export function sessionCookie(token: string): string {
  return `${cookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${config.sessionMinutes * 60}${secure}`;
}

export function expiredCookie(): string {
  return `${cookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`;
}

export function assertOrigin(request: Request): void {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origin = request.headers.get("origin");
  if (origin && !config.origins.includes(origin)) {
    throw new ApiError(403, "ORIGIN_REJECTED", "El origen de la petición no está autorizado.");
  }
}
