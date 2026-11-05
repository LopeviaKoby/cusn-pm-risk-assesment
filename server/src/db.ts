import { SQL } from "bun";
import { config } from "./config";

export const sql = new SQL({
  url: config.databaseUrl,
  max: config.dbPoolMax,
  idleTimeout: 30,
  connectionTimeout: 10,
});

export async function readiness() {
  const rows = await sql<{ database: string; migration: string | null }>`
    SELECT current_database() AS database,
           (SELECT max(version) FROM pmo_meta.migracion) AS migration
  `;
  const row = rows[0];
  return {
    database: row?.database ?? "desconocida",
    migration: row?.migration ?? null,
  };
}

export async function closeDatabase(): Promise<void> {
  await sql.close({ timeout: 5 });
}