import { SQL } from "bun";

const migratorUrl = Bun.env.MIGRATOR_DATABASE_URL;
const password = Bun.env.APP_DB_PASSWORD;
const role = (Bun.env.APP_DB_ROLE ?? "pmo_app").trim();

if (!migratorUrl) {
  console.error("Falta MIGRATOR_DATABASE_URL. Ejecuta las migraciones con la cuenta propietaria.");
  process.exit(1);
}
if (!password) {
  console.error("Falta APP_DB_PASSWORD. Define la contraseña del rol de aplicación.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("APP_DB_PASSWORD debe tener al menos 12 caracteres.");
  process.exit(1);
}
if (/cambia-por|cambiar-|change-me/i.test(password)) {
  console.error("APP_DB_PASSWORD sigue siendo un valor de ejemplo. Define una contraseña real.");
  process.exit(1);
}
if (password.includes("\0")) {
  console.error("APP_DB_PASSWORD no puede contener caracteres nulos.");
  process.exit(1);
}
if (!/^[a-z_][a-z0-9_]*$/.test(role)) {
  console.error(`APP_DB_ROLE no válido: ${role}. Usa minúsculas, números y guion bajo.`);
  process.exit(1);
}

async function ddl(promise: Promise<Array<{ ddl: string }>>): Promise<string> {
  const [row] = await promise;
  if (!row?.ddl) throw new Error("No se pudo construir una sentencia de bootstrap.");
  return row.ddl;
}

const sql = new SQL({ url: migratorUrl, max: 1, connectionTimeout: 15 });

try {
  await sql.begin(async tx => {
    const [context] = await tx<{ current_user: string; current_database: string }>`
      SELECT current_user, current_database()
    `;
    const currentUser = context?.current_user;
    const database = context?.current_database;
    if (!currentUser || !database) throw new Error("No se pudo identificar la conexión de migración.");

    const [schema] = await tx<{ proyecto: string | null; meta: string | null }>`
      SELECT to_regclass('pmo.proyecto')::text AS proyecto,
             to_regclass('pmo_meta.migracion')::text AS meta
    `;
    if (!schema?.proyecto) throw new Error("Falta pmo.proyecto. Ejecuta las migraciones antes del bootstrap.");
    if (!schema?.meta) throw new Error("Falta pmo_meta.migracion. Ejecuta las migraciones antes del bootstrap.");

    const [owner] = await tx<{ owner: string }>`
      SELECT tableowner AS owner FROM pg_tables
      WHERE schemaname = 'pmo' AND tablename = 'proyecto'
    `;
    if (owner?.owner !== currentUser) {
      throw new Error(`MIGRATOR_DATABASE_URL debe conectar como propietario de pmo.proyecto (${owner?.owner ?? "desconocido"}).`);
    }

    const [existing] = await tx<{ role_exists: boolean }>`
      SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${role}) AS role_exists
    `;
    if (!existing?.role_exists) {
      await tx.unsafe(await ddl(tx`SELECT format('CREATE ROLE %I LOGIN', ${role}::text) AS ddl`));
      console.log(`+ rol ${role} creado`);
    } else {
      console.log(`= rol ${role} ya existe`);
    }

    await tx.unsafe(await ddl(tx`
      SELECT format(
        'ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE',
        ${role}::text, ${password}::text
      ) AS ddl
    `));

    const statements: string[] = [];
    statements.push(await ddl(tx`SELECT format('GRANT CONNECT ON DATABASE %I TO %I', ${database}::text, ${role}::text) AS ddl`));

    for (const schemaName of ["pmo", "pmo_meta"]) {
      statements.push(await ddl(tx`SELECT format('GRANT USAGE ON SCHEMA %I TO %I', ${schemaName}::text, ${role}::text) AS ddl`));
      statements.push(await ddl(tx`SELECT format('REVOKE CREATE ON SCHEMA %I FROM %I', ${schemaName}::text, ${role}::text) AS ddl`));
    }

    statements.push(await ddl(tx`SELECT format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pmo TO %I', ${role}::text) AS ddl`));
    statements.push(await ddl(tx`SELECT format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pmo TO %I', ${role}::text) AS ddl`));
    statements.push(await ddl(tx`SELECT format('GRANT SELECT ON pmo_meta.migracion TO %I', ${role}::text) AS ddl`));

    for (const [schemaName, objectType, privileges] of [
      ["pmo", "TABLES", "SELECT, INSERT, UPDATE, DELETE"],
      ["pmo", "SEQUENCES", "USAGE, SELECT"],
      ["pmo_meta", "TABLES", "SELECT"],
    ] as const) {
      const template = `ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT ${privileges} ON ${objectType} TO %I`;
      statements.push(await ddl(tx`
        SELECT format(${template}::text, ${currentUser}::text, ${schemaName}::text, ${role}::text) AS ddl
      `));
    }

    for (const statement of statements) await tx.unsafe(statement);

    const [privileges] = await tx<{
      can_create: boolean;
      can_select: boolean;
      can_insert: boolean;
      can_update: boolean;
      can_delete: boolean;
      can_read_meta: boolean;
      is_super: boolean;
      can_login: boolean;
    }>`
      SELECT has_schema_privilege(${role}::text, 'pmo', 'CREATE') AS can_create,
             has_table_privilege(${role}::text, 'pmo.proyecto', 'SELECT') AS can_select,
             has_table_privilege(${role}::text, 'pmo.proyecto', 'INSERT') AS can_insert,
             has_table_privilege(${role}::text, 'pmo.proyecto', 'UPDATE') AS can_update,
             has_table_privilege(${role}::text, 'pmo.proyecto', 'DELETE') AS can_delete,
             has_table_privilege(${role}::text, 'pmo_meta.migracion', 'SELECT') AS can_read_meta,
             rolsuper AS is_super,
             rolcanlogin AS can_login
      FROM pg_roles WHERE rolname = ${role}
    `;

    if (privileges?.can_create !== false) throw new Error(`El rol ${role} conserva permiso CREATE en pmo.`);
    if (privileges?.can_select !== true || privileges?.can_insert !== true || privileges?.can_update !== true || privileges?.can_delete !== true) {
      throw new Error(`El rol ${role} no tiene DML completo sobre pmo.proyecto.`);
    }
    if (privileges?.can_read_meta !== true) throw new Error(`El rol ${role} no puede leer pmo_meta.migracion.`);
    if (privileges?.is_super !== false) throw new Error(`El rol ${role} no debe ser superusuario.`);
    if (privileges?.can_login !== true) throw new Error(`El rol ${role} debe poder iniciar sesión.`);

    const [counts] = await tx<{ tables: string; sequences: string }>`
      SELECT (SELECT count(*)::text FROM information_schema.tables
              WHERE table_schema = 'pmo' AND table_type = 'BASE TABLE') AS tables,
             (SELECT count(*)::text FROM pg_class c
              JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = 'pmo' AND c.relkind = 'S') AS sequences
    `;

    console.log(`Rol runtime: ${role}`);
    console.log(`Base: ${database} · propietario/migrador: ${currentUser}`);
    console.log(`Tablas con DML: ${counts?.tables ?? "0"} · secuencias: ${counts?.sequences ?? "0"}`);
    console.log("Privilegios verificados: sin CREATE, DML completo y lectura de pmo_meta.migracion.");
  });
} catch (error) {
  console.error(`Bootstrap fallido: ${error instanceof Error ? error.message : "error desconocido"}`);
  process.exitCode = 1;
} finally {
  await sql.close({ timeout: 5 });
}