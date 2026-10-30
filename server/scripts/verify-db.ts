import { SQL } from "bun";

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find(value => value.startsWith(prefix))?.slice(prefix.length);
}

const url = Bun.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. La verificación usa el rol runtime de la API.");
  process.exit(1);
}

const expectedRaw = argument("expect-projects") ?? Bun.env.EXPECT_PROJECTS;
const expectedProjects = expectedRaw !== undefined && expectedRaw.trim() !== ""
  ? Number(expectedRaw)
  : null;
if (expectedProjects !== null && (!Number.isInteger(expectedProjects) || expectedProjects < 0)) {
  console.error(`EXPECT_PROJECTS no válido: ${expectedRaw}.`);
  process.exit(1);
}

const sql = new SQL({ url, max: 1, connectionTimeout: 10 });
let failures = 0;

function check(name: string, condition: boolean, detail = "") {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${detail ? ` · ${detail}` : ""}`);
  if (!condition) failures += 1;
}

try {
  const [identity] = await sql<{ current_user: string; database: string }>`
    SELECT current_user, current_database() AS database
  `;
  console.log(`Verificación con rol ${identity?.current_user ?? "desconocido"} en ${identity?.database ?? "desconocida"}.`);

  const [tables] = await sql<{ count: string }>`
    SELECT count(*)::text AS count FROM information_schema.tables
    WHERE table_schema = 'pmo' AND table_type = 'BASE TABLE'
  `;
  check("24 tablas de negocio", tables?.count === "24", `obtenido=${tables?.count ?? "0"}`);

  const [units] = await sql<{ count: string }>`SELECT count(*)::text AS count FROM pmo.unidad_monetaria`;
  check("9 unidades monetarias", units?.count === "9", `obtenido=${units?.count ?? "0"}`);

  const [migration] = await sql<{ version: string | null }>`
    SELECT max(version) AS version FROM pmo_meta.migracion
  `;
  const version = migration?.version ?? "";
  check("migración 004 o posterior", version >= "004_units.sql", `obtenido=${version || "ninguna"}`);

  const [privileges] = await sql<{
    can_create: boolean;
    can_select: boolean;
    can_insert: boolean;
    can_update: boolean;
    can_delete: boolean;
    can_read_meta: boolean;
  }>`
    SELECT has_schema_privilege(current_user, 'pmo', 'CREATE') AS can_create,
           has_table_privilege(current_user, 'pmo.proyecto', 'SELECT') AS can_select,
           has_table_privilege(current_user, 'pmo.proyecto', 'INSERT') AS can_insert,
           has_table_privilege(current_user, 'pmo.proyecto', 'UPDATE') AS can_update,
           has_table_privilege(current_user, 'pmo.proyecto', 'DELETE') AS can_delete,
           has_table_privilege(current_user, 'pmo_meta.migracion', 'SELECT') AS can_read_meta
  `;
  check("rol runtime sin DDL", privileges?.can_create === false, `CREATE=${privileges?.can_create}`);
  check("rol runtime con SELECT/INSERT/UPDATE/DELETE", privileges?.can_select === true && privileges?.can_insert === true && privileges?.can_update === true && privileges?.can_delete === true);
  check("rol runtime puede leer pmo_meta.migracion", privileges?.can_read_meta === true);

  const [counts] = await sql<{
    projects: string;
    risks: string;
    billing: string;
    purchases: string;
    hours: string;
  }>`
    SELECT (SELECT count(*)::text FROM pmo.proyecto) AS projects,
           (SELECT (SELECT count(*) FROM pmo.riesgo_global) + (SELECT count(*) FROM pmo.riesgo_proyecto))::text AS risks,
           (SELECT count(*)::text FROM pmo.facturacion) AS billing,
           (SELECT count(*)::text FROM pmo.compra) AS purchases,
           (SELECT count(*)::text FROM pmo.registro_horas) AS hours
  `;
  console.log(`Conteos: proyectos=${counts?.projects ?? "0"} riesgos=${counts?.risks ?? "0"} facturas=${counts?.billing ?? "0"} compras=${counts?.purchases ?? "0"} horas=${counts?.hours ?? "0"}.`);

  if (expectedProjects !== null) {
    check(`${expectedProjects} proyectos esperados`, counts?.projects === String(expectedProjects), `obtenido=${counts?.projects ?? "0"}`);
  }

  if (failures === 0) console.log("Verificación correcta.");
} catch (error) {
  console.error(`Verificación fallida: ${error instanceof Error ? error.message : "error desconocido"}`);
  failures += 1;
} finally {
  await sql.close({ timeout: 5 });
}

if (failures) {
  console.error(`${failures} comprobaciones fallaron.`);
  process.exit(1);
}