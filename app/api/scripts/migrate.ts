import { SQL } from "bun";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {assertCatalog} from './catalog';

export const migrationDirectory = resolve(import.meta.dirname, "../migrations");
export const baseFile = "011_pmo_cusn_v210.sql";

export async function migrate(sql: SQL, through?: string): Promise<void> {
  const manifest = JSON.parse(readFileSync(resolve(migrationDirectory, "manifest.json"), "utf8")) as {
    schema: string; catalogSha256: string; migrations: { file: string; sha256: string; catalogSha256?:string }[];
  };
  const boundary=through?manifest.migrations.findIndex(item=>item.file===through):manifest.migrations.length-1;
  if(boundary<0)throw new Error('Límite de migración desconocido.');
  const migrations=manifest.migrations.slice(0,boundary+1);
  const expected=through?migrations.at(-1)!.catalogSha256:manifest.catalogSha256;
  if(!expected)throw new Error('Falta huella versionada del límite de migración.');
  if (manifest.schema !== "pmo_cusn") throw new Error("Esquema de migración no permitido.");
  await sql.begin(async tx => {
    const [engine]=await tx<{version:string}>`SELECT current_setting('server_version_num') AS version`;
    if(engine?.version!=="180006")throw new Error("La migración requiere PostgreSQL 18.6 verificado.");
    await tx`SELECT pg_advisory_xact_lock(81420261102)`;
    await tx`CREATE SCHEMA IF NOT EXISTS pmo_cusn_meta`;
    await tx`CREATE TABLE IF NOT EXISTS pmo_cusn_meta.migracion (
      version text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`;
    if (manifest.migrations[0]?.file !== baseFile) throw new Error("El baseline inicial debe ser 011_pmo_cusn_v210.sql.");
    for (const item of migrations) {
      if (!/^01[1-9]_[a-z0-9_]+\.sql$/.test(item.file)) throw new Error("Archivo de migración no autorizado.");
      const content = readFileSync(resolve(migrationDirectory, item.file), "utf8");
      const hash = createHash("sha256").update(content).digest("hex");
      if (hash !== item.sha256) throw new Error(`Checksum distinto: ${item.file}`);
      const [applied] = await tx<{ sha256: string }>`SELECT sha256 FROM pmo_cusn_meta.migracion WHERE version=${item.file}`;
      if (applied) {
        if (applied.sha256 !== hash) throw new Error(`Migración aplicada con otro contenido: ${item.file}`);
        console.log(`= ${item.file} ya aplicada`);
        continue;
      }
      const [existing] = await tx<{ name: string | null }>`SELECT to_regnamespace('pmo_cusn')::text AS name`;
      if (item.file === baseFile) {
        if (existing?.name) throw new Error("pmo_cusn existe sin registro de migración; no se sobrescribe.");
      } else if (!existing?.name) {
        throw new Error("No se puede aplicar una migración incremental sin el esquema base pmo_cusn.");
      }
      // La definición versionada incorpora las correcciones documentadas; Bun controla la transacción.
      const statements = content.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, "");
      await tx.unsafe(statements);
      await tx`INSERT INTO pmo_cusn_meta.migracion(version,sha256) VALUES (${item.file},${hash})`;
      console.log(`+ ${item.file} aplicada`);
    }
    await assertCatalog(tx,expected);
  });
}

if (import.meta.main) {
  const url = Bun.env.MIGRATOR_DATABASE_URL;
  if (!url) throw new Error("Falta MIGRATOR_DATABASE_URL.");
  const sql = new SQL({ url, max: 1, connectionTimeout: 10 });
  try { await migrate(sql); } finally { await sql.close(); }
}
