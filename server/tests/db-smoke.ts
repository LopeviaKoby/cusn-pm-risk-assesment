import { SQL } from "bun";

const url = Bun.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL.");
  process.exit(1);
}

const sql = new SQL({ url, max: 2, connectionTimeout: 10 });
let failures = 0;

function check(name: string, condition: boolean, detail = "") {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${detail ? ` · ${detail}` : ""}`);
  if (!condition) failures += 1;
}

try {
  const tables = await sql<{ count: string }>`
    SELECT count(*)::text AS count FROM information_schema.tables
    WHERE table_schema = 'pmo' AND table_type = 'BASE TABLE'
  `;
  check("24 tablas de negocio", tables[0]?.count === "24", `obtenido=${tables[0]?.count}`);

  const units = await sql<{ count: string }>`SELECT count(*)::text AS count FROM pmo.unidad_monetaria`;
  check("9 unidades monetarias", units[0]?.count === "9", `obtenido=${units[0]?.count}`);

  const projects = await sql<{ count: string }>`SELECT count(*)::text AS count FROM pmo.proyecto`;
  check("25 proyectos", projects[0]?.count === "25", `obtenido=${projects[0]?.count}`);

  const risks = await sql<{ count: string }>`
    SELECT ((SELECT count(*) FROM pmo.riesgo_global) + (SELECT count(*) FROM pmo.riesgo_proyecto))::text AS count
  `;
  check("48 riesgos", risks[0]?.count === "48", `obtenido=${risks[0]?.count}`);

  const numeric = await sql<{ value: string }>`SELECT 1234567890123456.7890::numeric(20,4) AS value`;
  check("numeric exacto", numeric[0]?.value === "1234567890123456.7890", `obtenido=${numeric[0]?.value}`);

  const bigint = await sql<{ value: string }>`SELECT 9007199254740993::bigint AS value`;
  check("bigint > 2^53 como string", bigint[0]?.value === "9007199254740993", `obtenido=${bigint[0]?.value}`);

  const date = await sql<{ value: unknown }>`SELECT '2026-10-20'::date AS value`;
  const dateValue = date[0]?.value instanceof Date ? date[0].value.toISOString().slice(0, 10) : String(date[0]?.value);
  check("fecha civil sin cambio de día", dateValue === "2026-10-20", `obtenido=${dateValue}`);

  const json = await sql<{ value: unknown }>`SELECT '{"prueba":true}'::jsonb AS value`;
  check("JSONB tipado", typeof json[0]?.value === "object" && json[0]?.value !== null);

  const before = await sql<{ count: string }>`SELECT count(*)::text AS count FROM pmo.cliente`;
  try {
    await sql.begin(async tx => {
      await tx`INSERT INTO pmo.cliente (nombre) VALUES ('__rollback_test__')`;
      throw new Error("rollback intencional");
    });
  } catch {
    // Se espera el rollback.
  }
  const after = await sql<{ count: string }>`SELECT count(*)::text AS count FROM pmo.cliente`;
  check("transacción con rollback", before[0]?.count === after[0]?.count, `antes=${before[0]?.count} después=${after[0]?.count}`);

  const privileges = await sql<{ can_create: boolean; can_select: boolean; can_insert: boolean; current_user: string }>`
    SELECT current_user,
           has_schema_privilege(current_user, 'pmo', 'CREATE') AS can_create,
           has_table_privilege(current_user, 'pmo.proyecto', 'SELECT') AS can_select,
           has_table_privilege(current_user, 'pmo.proyecto', 'INSERT') AS can_insert
  `;
  const privilege = privileges[0];
  check("rol runtime sin DDL", privilege?.can_create === false, `usuario=${privilege?.current_user}`);
  check("rol runtime con lectura y escritura DML", privilege?.can_select === true && privilege?.can_insert === true);

  const migration = await sql<{ version: string | null }>`SELECT max(version) AS version FROM pmo_meta.migracion`;
  check("migración 004 o posterior", (migration[0]?.version ?? "") >= "004_units.sql", `obtenido=${migration[0]?.version ?? "ninguna"}`);
} catch (error) {
  console.error(`Error de prueba: ${error instanceof Error ? error.message : "desconocido"}`);
  failures += 1;
} finally {
  await sql.close({ timeout: 5 });
}

if (failures) {
  console.error(`${failures} comprobaciones fallaron.`);
  process.exit(1);
}
console.log("Comprobaciones de base de datos completadas.");
