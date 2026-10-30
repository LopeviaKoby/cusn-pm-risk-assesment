import { SQL } from "bun";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Mode = "schema" | "demo";
type Migration = { file: string; mode: Mode; sha256: string };
type Manifest = {
  schema: string;
  asOfDate: string;
  migrations: Migration[];
};

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find(value => value.startsWith(prefix))?.slice(prefix.length);
}

const requestedMode = argument("mode") ?? Bun.env.DB_MIGRATE_MODE ?? "schema";
if (requestedMode !== "schema" && requestedMode !== "demo") {
  console.error(`Modo no válido: ${requestedMode}. Usa --mode=schema o --mode=demo.`);
  process.exit(1);
}
const mode: Mode = requestedMode;

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(here, "../migrations");
const manifest = JSON.parse(readFileSync(resolve(migrationsDir, "manifest.json"), "utf8")) as Manifest;
const url = Bun.env.MIGRATOR_DATABASE_URL;

if (!url) {
  console.error("Falta MIGRATOR_DATABASE_URL. No se aplica ninguna migración.");
  process.exit(1);
}

if (/cambia-por|cambiar-|change-me/i.test(url)) {
  console.error("MIGRATOR_DATABASE_URL contiene un valor de ejemplo. Define credenciales reales.");
  process.exit(1);
}

if (!Array.isArray(manifest.migrations) || manifest.migrations.length === 0) {
  console.error("El manifiesto de migraciones está vacío.");
  process.exit(1);
}

const files = new Set<string>();
for (const item of manifest.migrations) {
  if (item.mode !== "schema" && item.mode !== "demo") {
    console.error(`Modo inválido en ${item.file}: ${String(item.mode)}.`);
    process.exit(1);
  }
  if (files.has(item.file)) {
    console.error(`Migración duplicada en el manifiesto: ${item.file}.`);
    process.exit(1);
  }
  files.add(item.file);
}

const first = manifest.migrations[0];
if (!first || first.file !== "001_schema.sql" || first.mode !== "schema") {
  console.error("El manifiesto debe empezar por 001_schema.sql en modo schema.");
  process.exit(1);
}

const sql = new SQL({ url, max: 1, connectionTimeout: 10 });

function checksum(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

try {
  console.log(`Modo de migración: ${mode}`);
  await sql`CREATE SCHEMA IF NOT EXISTS pmo_meta`;
  await sql`
    CREATE TABLE IF NOT EXISTS pmo_meta.migracion (
      version text PRIMARY KEY,
      sha256 text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`SELECT pg_advisory_lock(81420261026)`;

  for (const item of manifest.migrations) {
    if (item.mode === "demo" && mode === "schema") {
      console.log(`- ${item.file} omitida (solo demo)`);
      continue;
    }

    const path = resolve(migrationsDir, item.file);
    const actual = checksum(path);
    if (actual !== item.sha256) {
      throw new Error(`Checksum distinto para ${item.file}; no se aplica.`);
    }
    const applied = await sql<{ sha256: string }>`SELECT sha256 FROM pmo_meta.migracion WHERE version = ${item.file}`;
    if (applied.length) {
      if (applied[0]?.sha256 !== actual) throw new Error(`La migración ${item.file} ya fue aplicada con otro contenido.`);
      console.log(`= ${item.file} ya aplicada`);
      continue;
    }
    const content = readFileSync(path, "utf8");
    await sql.begin(async tx => {
      await tx.unsafe(content);
      await tx`INSERT INTO pmo_meta.migracion (version, sha256) VALUES (${item.file}, ${actual})`;
    });
    console.log(`+ ${item.file} aplicada`);
  }

  const [{ version } = { version: "desconocida" }] = await sql<{ version: string }>`SELECT version() AS version`;
  console.log(`Migraciones completas (${mode}). ${version}`);
} catch (error) {
  console.error(`Migración fallida: ${error instanceof Error ? error.message : "error desconocido"}`);
  process.exitCode = 1;
} finally {
  try {
    await sql`SELECT pg_advisory_unlock(81420261026)`;
  } catch {
    // La conexión pudo fallar antes de adquirir el bloqueo.
  }
  await sql.close({ timeout: 5 });
}