function required(name: string): string {
  const value = Bun.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

function boolean(name: string, fallback: boolean): boolean {
  const value = Bun.env[name];
  if (value === undefined || value.trim() === "") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new Error(`La variable ${name} debe ser true o false.`);
}

function integer(name: string, fallback: number, min: number, max: number): number {
  const raw = Bun.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`La variable ${name} debe ser un entero entre ${min} y ${max}.`);
  }
  return value;
}

const origins = (Bun.env.APP_ORIGINS ?? Bun.env.APP_ORIGIN ?? "http://127.0.0.1:5173")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

if (origins.length === 0) throw new Error("APP_ORIGINS no puede quedar vacío.");

export const config = {
  databaseUrl: required("DATABASE_URL"),
  hostname: Bun.env.API_HOST?.trim() || "127.0.0.1",
  port: integer("API_PORT", 3001, 1, 65535),
  user: Bun.env.GPL_USER ?? "pmo@gpl.example.test",
  passwordHash: atob(required("GPL_PASSWORD_HASH_B64")),
  origins,
  asOfDate: Bun.env.GPL_AS_OF_DATE ?? "2028-10-22",
  sessionMinutes: integer("GPL_SESSION_MINUTES", 60, 1, 1440),
  cookieSecure: boolean("COOKIE_SECURE", false),
  dbPoolMax: integer("DB_POOL_MAX", 8, 1, 50),
};