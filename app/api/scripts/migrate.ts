import { SQL } from "bun";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const migrationDirectory = resolve(import.meta.dirname, "../migrations");
export const baseFile = "005_pmo_cusn_v200.sql";

export async function migrate(sql: SQL): Promise<void> {
  const manifest = JSON.parse(readFileSync(resolve(migrationDirectory, "manifest.json"), "utf8")) as {
    schema: string; migrations: { file: string; sha256: string }[];
  };
  if (manifest.schema !== "pmo_cusn") throw new Error("Esquema de migración no permitido.");
  await sql.begin(async tx => {
    const [engine]=await tx<{version:string}>`SELECT current_setting('server_version_num') AS version`;
    if(engine?.version!=="180006")throw new Error("La migración requiere PostgreSQL 18.6 verificado.");
    await tx`SELECT pg_advisory_xact_lock(81420261102)`;
    await tx`CREATE SCHEMA IF NOT EXISTS pmo_cusn_meta`;
    await tx`CREATE TABLE IF NOT EXISTS pmo_cusn_meta.migracion (
      version text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`;
    for (const item of manifest.migrations) {
      if (!/^0(?:0[5-9]|10)_[a-z0-9_]+\.sql$/.test(item.file)) throw new Error("Archivo de migración no autorizado.");
      const content = readFileSync(resolve(migrationDirectory, item.file), "utf8");
      const hash = createHash("sha256").update(content).digest("hex");
      if (hash !== item.sha256) throw new Error(`Checksum distinto: ${item.file}`);
      const [applied] = await tx<{ sha256: string }>`SELECT sha256 FROM pmo_cusn_meta.migracion WHERE version=${item.file}`;
      if (applied) {
        if (applied.sha256 !== hash) throw new Error(`Migración aplicada con otro contenido: ${item.file}`);
        console.log(`= ${item.file} ya aplicada`);
        continue;
      }
      if (item.file === baseFile) {
        const [existing] = await tx<{ name: string | null }>`SELECT to_regnamespace('pmo_cusn')::text AS name`;
        if (existing?.name) throw new Error("pmo_cusn existe sin registro de migración; no se sobrescribe.");
      }
      // El adjunto se conserva byte por byte; Bun controla la transacción.
      const statements = content.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, "");
      await tx.unsafe(statements);
      await tx`INSERT INTO pmo_cusn_meta.migracion(version,sha256) VALUES (${item.file},${hash})`;
      console.log(`+ ${item.file} aplicada`);
    }
  });
}

if (import.meta.main) {
  const url = Bun.env.MIGRATOR_DATABASE_URL;
  if (!url) throw new Error("Falta MIGRATOR_DATABASE_URL.");
  const sql = new SQL({ url, max: 1, connectionTimeout: 10 });
  try { await migrate(sql); } finally { await sql.close(); }
}
